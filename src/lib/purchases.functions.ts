import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
