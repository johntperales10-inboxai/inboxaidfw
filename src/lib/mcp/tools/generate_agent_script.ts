import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { generateScript } from "@/lib/generateScript";

export default defineTool({
  name: "generate_agent_script",
  title: "Generate Gmail agent script",
  description:
    "Generate a ready-to-paste Google Apps Script for the InboxAI Gmail agent, customized with the caller's Gemini API key and preferences.",
  inputSchema: {
    geminiApiKey: z
      .string()
      .trim()
      .optional()
      .describe("Gemini API key starting with AIzaSy... If omitted, a placeholder is left in the script."),
    trustedSenders: z
      .array(z.string().trim().min(1))
      .max(200)
      .optional()
      .describe("Email addresses or substrings whose messages should always be starred."),
    trustedDomains: z
      .array(z.string().trim().min(1))
      .max(100)
      .optional()
      .describe("Email domain suffixes (e.g. @mycompany.com) whose messages should always be starred."),
    unsubscribeAfterDays: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional()
      .describe("Auto-unsubscribe from newsletters unread for this many days (default 30)."),
    deleteSpam: z.boolean().optional().describe("If true, spam threads are moved to trash each run."),
    notificationFrequency: z
      .enum(["action-only", "daily", "every-run"])
      .optional()
      .describe("How often to email a summary (default action-only)."),
    notificationEmail: z
      .string()
      .trim()
      .optional()
      .describe("Email address to send summaries to. Defaults to the Google account running the script."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const script = generateScript({
      geminiApiKey: input.geminiApiKey,
      trustedSenders: input.trustedSenders ?? [],
      trustedDomains: input.trustedDomains ?? [],
      unsubscribeAfterDays: input.unsubscribeAfterDays ?? 30,
      deleteSpam: input.deleteSpam ?? true,
      notificationFrequency: input.notificationFrequency ?? "action-only",
      notificationEmail: input.notificationEmail,
    });

    return {
      content: [{ type: "text", text: script }],
      structuredContent: { script },
    };
  },
});
