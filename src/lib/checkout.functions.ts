import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { PREMIUM_ON_SALE } from "@/lib/features";

export type Tier = "basic" | "premium";

type CheckoutResult = { url: string | null; error: string | null };

async function stripe(path: string, key: string, init?: { method?: string; body?: URLSearchParams }) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: init?.body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    console.error("Stripe API error", path, json);
    throw new Error("Stripe request failed");
  }
  return json;
}

// Returns a Stripe Checkout URL, or { url: null } when Stripe isn't configured
// yet so the page falls back to Gumroad.
export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { tier: Tier; code?: string }) => {
    if (input.tier !== "basic" && input.tier !== "premium") throw new Error("Invalid tier");
    const code = input.code?.trim().toUpperCase() || undefined;
    if (code && !/^[A-Z0-9_-]{2,64}$/.test(code)) throw new Error("Invalid code");
    return { tier: input.tier, code };
  })
  .handler(async ({ data }): Promise<CheckoutResult> => {
    if (data.tier === "premium" && !PREMIUM_ON_SALE) {
      return { url: null, error: "InboxAI Premium is coming soon." };
    }
    const key = process.env.STRIPE_SECRET_KEY;
    const price =
      data.tier === "premium" ? process.env.STRIPE_PRICE_PREMIUM : process.env.STRIPE_PRICE_BASIC;
    if (!key || !price) return { url: null, error: null };

    const origin = new URL(getRequest().url).origin;
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      "metadata[tier]": data.tier,
      "payment_intent_data[metadata][tier]": data.tier,
      // Access is unlocked by email: /thanks shows which email to sign in with.
      // Stripe fills in {CHECKOUT_SESSION_ID} itself.
      success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.tier === "premium" ? `${origin}/premium` : `${origin}/#pricing`,
      "custom_text[submit][message]":
        "Use the email of the Google account you'll sign in with. That's how we unlock your setup.",
    });

    if (data.code) {
      // Promotion codes are created in the Stripe dashboard; look the code up so
      // an invalid one is reported here instead of silently ignored.
      const found = await stripe(
        `promotion_codes?active=true&limit=1&code=${encodeURIComponent(data.code)}`,
        key,
      );
      const promo = (found.data as Array<{ id: string }> | undefined)?.[0];
      if (!promo) return { url: null, error: "That code isn't valid or has expired." };
      body.set("discounts[0][promotion_code]", promo.id);
    } else {
      body.set("allow_promotion_codes", "true");
    }

    const session = await stripe("checkout/sessions", key, { method: "POST", body });
    return { url: String(session.url), error: null };
  });

// For the /thanks page: which email and tier a finished checkout belongs to.
// Session IDs are long random values only the buyer's browser receives.
export const getCheckoutSummary = createServerFn({ method: "GET" })
  .inputValidator((input: { sessionId: string }) => {
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(input.sessionId ?? "")) throw new Error("Invalid session");
    return input;
  })
  .handler(async ({ data }): Promise<{ email: string | null; tier: Tier; paid: boolean } | null> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    try {
      const s = await stripe(`checkout/sessions/${data.sessionId}`, key);
      const details = s.customer_details as { email?: string | null } | null;
      const metadata = s.metadata as Record<string, string> | null;
      return {
        email: details?.email ?? (s.customer_email as string | null) ?? null,
        tier: metadata?.tier === "premium" ? "premium" : "basic",
        paid: s.payment_status === "paid" || s.payment_status === "no_payment_required",
      };
    } catch {
      return null;
    }
  });
