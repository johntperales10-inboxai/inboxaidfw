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
      // Access is unlocked by email, so send buyers to sign in with Google next
      success_url: `${origin}/signin`,
      cancel_url: data.tier === "premium" ? `${origin}/premium` : `${origin}/#pricing`,
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
