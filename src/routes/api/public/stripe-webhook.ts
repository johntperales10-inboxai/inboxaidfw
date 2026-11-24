import { createFileRoute } from "@tanstack/react-router";

// Stripe signs each webhook: header "t=<unix>,v1=<hex hmac>" over `${t}.${rawBody}`.
async function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const { createHmac, timingSafeEqual } = await import("crypto");
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length) return false;
  // Reject replays older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"));
  return sigs.some((s) => {
    const b = Buffer.from(s);
    return b.length === expected.length && timingSafeEqual(b, expected);
  });
}

type CheckoutSession = {
  id: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
  payment_intent?: string | null;
  subscription?: string | null;
  customer?: string | null;
};

type Subscription = {
  id: string;
  status: string;
  items?: { data?: Array<{ price?: { id?: string } }> };
};

// Subscriptions in these states have ended for good; past_due keeps access
// while Stripe retries the card.
const ENDED = new Set(["canceled", "unpaid", "incomplete_expired"]);

type Charge = { payment_intent: string | null; amount: number; amount_refunded: number; refunded: boolean };

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Not configured", { status: 500 });

        const rawBody = await request.text();
        const sig = request.headers.get("stripe-signature") ?? "";
        if (!(await verifyStripeSignature(rawBody, sig, secret))) {
          return new Response("Bad signature", { status: 400 });
        }

        const event = JSON.parse(rawBody) as { type: string; data: { object: CheckoutSession } };

        // Subscription ended or changed plan (customer portal or failed payments)
        if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
          const sub = event.data.object as unknown as Subscription;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (event.type === "customer.subscription.deleted" || ENDED.has(sub.status)) {
            const { error } = await supabaseAdmin
              .from("purchases")
              .delete()
              .eq("source", "stripe")
              .eq("raw->>subscription_id", sub.id);
            if (error) {
              console.error("stripe subscription revoke failed", error);
              return new Response("Server error", { status: 500 });
            }
            return new Response("ok");
          }
          // Plan switch: the price tells us the tier
          const priceId = sub.items?.data?.[0]?.price?.id;
          const tier =
            priceId && priceId === process.env.STRIPE_PRICE_PREMIUM
              ? "premium"
              : priceId && priceId === process.env.STRIPE_PRICE_BASIC
                ? "basic"
                : null;
          if (!tier) return new Response("ignored");
          const { data: rows, error: readError } = await supabaseAdmin
            .from("purchases")
            .select("email, raw")
            .eq("source", "stripe")
            .eq("raw->>subscription_id", sub.id);
          if (readError) {
            console.error("stripe subscription lookup failed", readError);
            return new Response("Server error", { status: 500 });
          }
          for (const row of rows ?? []) {
            const raw = (row.raw ?? {}) as Record<string, unknown>;
            if (raw.tier === tier) continue;
            const { error } = await supabaseAdmin
              .from("purchases")
              .update({
                raw: { ...raw, tier, product_name: tier === "premium" ? "InboxAI Premium" : "InboxAI Basic" },
              })
              .eq("email", row.email);
            if (error) {
              console.error("stripe plan switch failed", error);
              return new Response("Server error", { status: 500 });
            }
          }
          return new Response("ok");
        }

        // A full refund of an old one-time purchase removes access. Partial refunds
        // keep it. Subscriptions lose access when they're canceled (above).
        if (event.type === "charge.refunded") {
          const charge = event.data.object as unknown as Charge;
          if (!charge.refunded || !charge.payment_intent) return new Response("ignored");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin
            .from("purchases")
            .delete()
            .eq("source", "stripe")
            .eq("raw->>payment_intent", charge.payment_intent);
          if (error) {
            console.error("stripe refund revoke failed", error);
            return new Response("Server error", { status: 500 });
          }
          return new Response("ok");
        }

        const unlocks =
          event.type === "checkout.session.async_payment_succeeded" ||
          (event.type === "checkout.session.completed" &&
            // "no_payment_required" covers 100%-off promotion codes
            (event.data.object.payment_status === "paid" ||
              event.data.object.payment_status === "no_payment_required"));
        if (!unlocks) return new Response("ignored");

        const session = event.data.object;
        const email = (session.customer_details?.email ?? session.customer_email ?? "")
          .trim()
          .toLowerCase();
        const tier = session.metadata?.tier === "premium" ? "premium" : "basic";
        if (!email.includes("@")) return new Response("Missing email", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // One row per email: never let a later Basic purchase overwrite Premium
        if (tier === "basic") {
          const { data: existing } = await supabaseAdmin
            .from("purchases")
            .select("email")
            .eq("email", email)
            .maybeSingle();
          if (existing) return new Response("ok");
        }

        const { error } = await supabaseAdmin.from("purchases").upsert(
          {
            email,
            source: "stripe",
            order_id: session.id,
            raw: {
              tier,
              product_name: tier === "premium" ? "InboxAI Premium" : "InboxAI Basic",
              amount_total: session.amount_total,
              currency: session.currency,
              // Lets a later charge.refunded event find this purchase
              payment_intent: session.payment_intent ?? null,
              // Lets subscription events find (and revoke) this purchase
              subscription_id: session.subscription ?? null,
              customer_id: session.customer ?? null,
              billing: session.subscription ? "monthly" : "one-time",
            },
          },
          { onConflict: "email" },
        );
        if (error) {
          console.error("stripe purchase upsert failed", error);
          // Non-2xx makes Stripe retry later
          return new Response("Server error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
