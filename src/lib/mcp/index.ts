import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listReviewsTool from "./tools/list_reviews";
import submitReviewTool from "./tools/submit_review";
import generateAgentScriptTool from "./tools/generate_agent_script";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "inboxai-mcp",
  title: "InboxAI",
  version: "0.1.0",
  instructions:
    "Tools for the InboxAI Gmail agent product. Use `list_reviews` to read customer reviews, `submit_review` to post a new review, and `generate_agent_script` to build a ready-to-paste Google Apps Script for the Gmail agent.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listReviewsTool, submitReviewTool, generateAgentScriptTool],
});
