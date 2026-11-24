import { createFileRoute } from "@tanstack/react-router";

// Called once a day by each customer's Apps Script. Answers whether the email
// still has access (an active subscription or an older one-time purchase).
export const Route = createFileRoute("/api/public/license")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { email?: unknown; key?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Bad request" }, { status: 400 });
        }
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const key = typeof body.key === "string" ? body.key.trim() : "";
        if (!email.includes("@") || email.length > 320 || !key || key.length > 64) {
          return Response.json({ error: "Bad request" }, { status: 400 });
        }

        const { isValidLicenseKey } = await import("@/lib/license.server");
        if (!process.env.LICENSE_SECRET) return Response.json({ error: "Not configured" }, { status: 503 });
        if (!isValidLicenseKey(email, key)) return Response.json({ error: "Invalid license" }, { status: 403 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { rawIsPremium } = await import("@/lib/tier");
        const { data, error } = await supabaseAdmin.from("purchases").select("raw").eq("email", email);
        if (error) {
          console.error("license lookup failed", error);
          // 5xx: the script keeps running and asks again next hour
          return Response.json({ error: "Server error" }, { status: 500 });
        }
        const rows = data ?? [];
        return Response.json({
          active: rows.length > 0,
          tier: rows.some((r) => rawIsPremium(r.raw)) ? "premium" : "basic",
        });
      },
    },
  },
});
