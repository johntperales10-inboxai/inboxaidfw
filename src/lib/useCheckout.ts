import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startCheckout, type Tier } from "@/lib/checkout.functions";
import { PREMIUM_ON_SALE } from "@/lib/features";

// Discount-code field + buy button logic shared by the Basic and Premium pages.
// Codes are never checked in the browser (anything here is public); Stripe
// validates them at checkout.
export function useCheckout(tier: Tier) {
  const start = useServerFn(startCheckout);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const applyCode = () => {
    const code = discountCode.replace(/\s/g, "").toUpperCase();
    if (!code) return;
    if (!/^[A-Z0-9_-]{2,64}$/.test(code)) {
      setAppliedCode(null);
      setCodeError("Codes only use letters, numbers, - and _.");
      return;
    }
    setAppliedCode(code);
    setCodeError(null);
  };

  // codeOverride lets one shared code field drive several buy buttons
  const buy = async (codeOverride?: string | null) => {
    if (busy) return;
    if (tier === "premium" && !PREMIUM_ON_SALE) return;
    const code = codeOverride !== undefined ? codeOverride : appliedCode;
    setBusy(true);
    setCodeError(null);
    try {
      const r = await start({ data: { tier, code: code ?? undefined } });
      if (r.url) {
        window.location.href = r.url;
        return;
      }
      setCodeError(r.error ?? "Checkout is unavailable right now. Please email inboxaidfw@gmail.com.");
      if (r.error && code) setAppliedCode(null);
    } catch (e) {
      console.error("Stripe checkout failed", e);
      setCodeError("Checkout is unavailable right now. Please try again or email inboxaidfw@gmail.com.");
    }
    setBusy(false);
  };

  const onCodeChange = (value: string) => {
    setDiscountCode(value);
    if (codeError) setCodeError(null);
  };

  return { discountCode, onCodeChange, appliedCode, codeError, applyCode, buy, busy };
}
