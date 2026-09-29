import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scoreEmailBatch } from "@/lib/emailScoring.server";
import { isPremiumUser } from "@/lib/purchases.functions";
import type { EmailInput, EmailScore } from "@/lib/emailTypes";

export const scoreEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { emails: EmailInput[] }) => input)
  .handler(async ({ data, context }): Promise<{ scores: EmailScore[]; aiAvailable: boolean }> => {
    // The dashboard's Premium gate runs in the browser; enforce it here too so
    // signed-in free users can't call AI scoring directly.
    const { isPremium } = await isPremiumUser(context);
    if (!isPremium) throw new Error("Premium required");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { scores: [], aiAvailable: false };
    try {
      const scores = await scoreEmailBatch(key, data.emails.slice(0, 50));
      return { scores, aiAvailable: true };
    } catch (e) {
      console.error("scoreEmails failed", e);
      return { scores: [], aiAvailable: false };
    }
  });
