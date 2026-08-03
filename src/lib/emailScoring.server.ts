const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

export interface EmailInput {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  receivedAt: string;
}

export interface EmailScore {
  id: string;
  importanceScore: number;
  section: "now" | "today" | "this-week" | "waiting" | "read-later" | "archive";
  explanation: string;
  actionRequired: boolean;
  waitingStatus: "needs-my-reply" | "waiting-on-them" | "no-action";
  deadlineDetected: boolean;
  deadlineText: string | null;
}

const PERSONAL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "icloud.com", "protonmail.com", "me.com",
];
const ROLE_MARKERS = [
  "noreply", "no-reply", "donotreply", "newsletter", "marketing",
  "support", "info", "admin", "notifications",
];

export function isRealPerson(email: string): boolean {
  const addr = email.toLowerCase();
  const domain = addr.split("@")[1] ?? "";
  if (!PERSONAL_DOMAINS.includes(domain)) return false;
  return !ROLE_MARKERS.some((m) => addr.includes(m));
}

function buildPrompt(e: EmailInput) {
  return `Analyze this email and return ONLY valid JSON with no extra text. Sender: ${e.sender}. Subject: ${e.subject}. Preview: ${e.preview.slice(0, 200)}. Return these fields: importanceScore (number 0-100), section (now/today/this-week/waiting/read-later/archive), explanation (one sentence max 15 words), actionRequired (true/false), waitingStatus (needs-my-reply/waiting-on-them/no-action), deadlineDetected (true/false), deadlineText (string or null). Score 90 plus for urgent emails with deadlines or direct questions from important contacts. Score 70 to 89 for emails needing response today. Score 50 to 69 for this week. Score 25 to 49 for low priority. Below 25 for newsletters and promotions. Never score marketing emails above 40 even if they use urgent language.`;
}

const VALID_SECTIONS = ["now", "today", "this-week", "waiting", "read-later", "archive"] as const;

function normalize(id: string, raw: unknown, senderEmail: string): EmailScore {
  const o = (raw ?? {}) as Record<string, unknown>;
  let score = Math.max(0, Math.min(100, Number(o["importanceScore"]) || 0));
  let explanation = typeof o["explanation"] === "string" ? o["explanation"] : "No explanation available.";
  if (isRealPerson(senderEmail)) {
    score = Math.min(100, score + 15);
    explanation = `${explanation} Real person detected.`;
  }
  const section = VALID_SECTIONS.includes(o["section"] as never)
    ? (o["section"] as EmailScore["section"])
    : score >= 75 ? "now" : score >= 50 ? "today" : score >= 25 ? "this-week" : "read-later";
  const waiting = ["needs-my-reply", "waiting-on-them", "no-action"].includes(o["waitingStatus"] as string)
    ? (o["waitingStatus"] as EmailScore["waitingStatus"])
    : "no-action";
  return {
    id,
    importanceScore: score,
    section,
    explanation,
    actionRequired: o["actionRequired"] === true,
    waitingStatus: waiting,
    deadlineDetected: o["deadlineDetected"] === true,
    deadlineText: typeof o["deadlineText"] === "string" ? o["deadlineText"] : null,
  };
}

async function scoreOne(apiKey: string, e: EmailInput): Promise<EmailScore> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(e) }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(text.replace(/^```json\s*|```$/g, "").trim());
  } catch {
    parsed = {};
  }
  return normalize(e.id, parsed, e.senderEmail);
}

export async function scoreEmailBatch(apiKey: string, emails: EmailInput[]): Promise<EmailScore[]> {
  const out: EmailScore[] = [];
  const CHUNK = 8;
  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map((e) =>
        scoreOne(apiKey, e).catch(() => normalize(e.id, {}, e.senderEmail)),
      ),
    );
    out.push(...results);
  }
  return out;
}
