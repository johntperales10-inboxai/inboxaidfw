import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { rawIsPremium } from "@/lib/tier";

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
  const isPremium = (data ?? []).some((row) => rawIsPremium(row.raw));
  return { isPremium, email };
}

export const checkMyPremium = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => isPremiumUser(context));

// The license key that goes into the customer's script, so the script can check
// once a day that the subscription is still active. Null when licensing is off.
export const getMyLicense = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ email: string; key: string } | null> => {
    const email = (context.claims?.email as string | undefined)?.toLowerCase() ?? null;
    if (!email) return null;
    const { data } = await context.supabase.from("purchases").select("email").eq("email", email).maybeSingle();
    if (!data) return null;
    const { licenseKeyFor } = await import("@/lib/license.server");
    const key = licenseKeyFor(email);
    return key ? { email, key } : null;
  });
