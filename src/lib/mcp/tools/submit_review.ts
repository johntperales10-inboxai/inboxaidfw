import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "submit_review",
  title: "Submit a review",
  description: "Post a new public customer review for the InboxAI Gmail agent product.",
  inputSchema: {
    first_name: z.string().trim().min(1).max(50).describe("Reviewer's first name."),
    rating: z.number().int().min(1).max(5).describe("Star rating, 1 to 5."),
    body: z.string().trim().min(1).max(300).describe("Review text, up to 300 characters."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ first_name, rating, body }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data, error } = await supabase
      .from("reviews")
      .insert({ first_name, rating, body })
      .select("id, first_name, rating, body, created_at")
      .single();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: `Review submitted: ${JSON.stringify(data)}` }],
      structuredContent: { review: data },
    };
  },
});
