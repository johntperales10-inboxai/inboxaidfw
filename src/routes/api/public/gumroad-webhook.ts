import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/gumroad-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.GUMROAD_WEBHOOK_TOKEN;
        if (!expected) return new Response("Not configured", { status: 500 });

        const url = new URL(request.url);
        const providedToken =
          url.searchParams.get("token") ??
          request.headers.get("x-gumroad-token") ??
          "";

        // Constant-time compare
        const a = Buffer.from(providedToken);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return new Response("Unauthorized", { status: 401 });
        const { timingSafeEqual } = await import("crypto");
        if (!timingSafeEqual(a, b)) return new Response("Unauthorized", { status: 401 });

        // Gumroad Ping sends application/x-www-form-urlencoded
        let email = "";
        let orderId = "";
        let raw: Record<string, string> = {};
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const body = await request.json();
          raw = body ?? {};
          email = String(body?.email ?? "").trim().toLowerCase();
          orderId = String(body?.sale_id ?? body?.order_id ?? "");
        } else {
          const form = await request.formData();
          form.forEach((v, k) => { raw[k] = String(v); });
          email = String(form.get("email") ?? "").trim().toLowerCase();
          orderId = String(form.get("sale_id") ?? form.get("order_id") ?? "");
        }

        if (!email || !email.includes("@")) {
          return new Response("Missing email", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // One row per email: never let a later Basic purchase overwrite Premium
        const isPremiumSale = [raw["product_name"], raw["product_permalink"], raw["variants"]]
          .join(" ")
          .toLowerCase()
          .includes("premium");
        if (!isPremiumSale) {
          const { data: existing } = await supabaseAdmin
            .from("purchases")
            .select("email")
            .eq("email", email)
            .maybeSingle();
          if (existing) return new Response("ok");
        }

        const { error } = await supabaseAdmin.from("purchases").upsert(
          { email, source: "gumroad", order_id: orderId || null, raw },
          { onConflict: "email" },
        );
        if (error) {
          console.error("purchase upsert failed", error);
          return new Response("Server error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
