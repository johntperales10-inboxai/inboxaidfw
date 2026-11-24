// Whether a purchases.raw record is a Premium purchase (Stripe, Gumroad or manual rows).
export function rawIsPremium(raw: unknown): boolean {
  const r = (raw ?? {}) as Record<string, unknown>;
  const haystack = [r["product_name"], r["product_permalink"], r["variants"], r["tier"]]
    .filter((v) => typeof v === "string")
    .join(" ")
    .toLowerCase();
  return haystack.includes("premium");
}
