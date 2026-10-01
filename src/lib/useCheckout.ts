import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startCheckout, type Tier } from "@/lib/checkout.functions";
import { PREMIUM_ON_SALE } from "@/lib/features";

const GUMROAD_URLS: Record<Tier, string> = {
  basic: "https://johnperales.gumroad.com/l/xypgwz",
  premium: "https://johnperales.gumroad.com/l/gcmqik",
};

// Discount-code field + buy button logic shared by the Basic and Premium pages.
// Codes are never checked in the browser (anything here is public); Stripe or
// Gumroad validates them at checkout.
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
      if (r.error) {
        setCodeError(r.error);
        setAppliedCode(null);
        setBusy(false);
        return;
      }
    } catch (e) {
      console.error("Stripe checkout unavailable, using Gumroad", e);
    }
    // Stripe not configured yet (or unreachable): Gumroad applies its own offer codes
    const base = GUMROAD_URLS[tier];
    window.location.href = code
      ? `${base}/${encodeURIComponent(code)}?wanted=true`
      : `${base}?wanted=true`;
  };

  const onCodeChange = (value: string) => {
    setDiscountCode(value);
    if (codeError) setCodeError(null);
  };

  return { discountCode, onCodeChange, appliedCode, codeError, applyCode, buy, busy };
}
