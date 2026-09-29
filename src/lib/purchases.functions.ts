import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const checkMyPurchase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ hasPurchase: boolean; email: string | null }> => {
    const email = (context.claims?.email as string | undefined)?.toLowerCase() ?? null;
    if (!email) return { hasPurchase: false, email: null };
    const { data, error } = await context.supabase
      .from("purchases")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      console.error("checkMyPurchase error", error);
      return { hasPurchase: false, email };
    }
    return { hasPurchase: !!data, email };
  });

type AuthContext = {
  supabase: SupabaseClient<Database>;
  claims?: { email?: unknown } | null;
};

// Shared by checkMyPremium and any server function that must be Premium-only.
export async function isPremiumUser(context: AuthContext): Promise<{ isPremium: boolean; email: string | null }> {
  const email = (context.claims?.email as string | undefined)?.toLowerCase() ?? null;
  if (!email) return { isPremium: false, email: null };
  const { data, error } = await context.supabase
    .from("purchases")
    .select("raw")
    .eq("email", email);
  if (error) {
    console.error("checkMyPremium error", error);
    return { isPremium: false, email };
  }
  const isPremium = (data ?? []).some((row) => {
    const raw = (row.raw ?? {}) as Record<string, unknown>;
    const haystack = [raw["product_name"], raw["product_permalink"], raw["variants"], raw["tier"]]
      .filter((v) => typeof v === "string")
      .join(" ")
      .toLowerCase();
    return haystack.includes("premium");
  });
  return { isPremium, email };
}

export const checkMyPremium = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => isPremiumUser(context));
