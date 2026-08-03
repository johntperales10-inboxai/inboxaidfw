import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scoreEmailBatch, type EmailInput, type EmailScore } from "@/lib/emailScoring.server";

export const scoreEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { emails: EmailInput[] }) => input)
  .handler(async ({ data }): Promise<{ scores: EmailScore[]; aiAvailable: boolean }> => {
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
