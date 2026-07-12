export type NotificationFrequency = "action-only" | "daily" | "every-run";

export interface AgentSettings {
  geminiApiKey?: string;
  trustedSenders: string[];
  trustedDomains?: string[];
  unsubscribeAfterDays: number;
  deleteSpam: boolean;
  notificationFrequency: NotificationFrequency;
  notificationEmail?: string;
}

export function generateScript(s: AgentSettings): string {
  const senders = s.trustedSenders
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => `    "${e.replace(/"/g, '\\"')}"`)
    .join(",\n");

  const domains = (s.trustedDomains || [])
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `    "${d.replace(/"/g, '\\"')}"`)
    .join(",\n");

  const geminiKey = s.geminiApiKey?.trim() ? s.geminiApiKey.trim() : "PASTE_YOUR_GEMINI_API_KEY_HERE";

  const trustedDomainsLiteral = domains.length > 0 ? `[\n${domains}\n  ]` : "[]";

  return `// ============================================================
//  GMAIL AI AGENT — your custom build
//  Paste into script.google.com → New project → Run setupTrigger
// ============================================================

const SETTINGS = {
  geminiApiKey: "${geminiKey.replace(/"/g, '\\"')}",
  trustedSenders: [
${senders}
  ],
  trustedDomains: ${trustedDomainsLiteral},
  deleteSpam: ${s.deleteSpam},
  unsubscribeAfterDays: ${s.unsubscribeAfterDays},
  notificationEmail: ${s.notificationEmail?.trim() ? `"${s.notificationEmail.trim().replace(/"/g, '\\"')}"` : "Session.getActiveUser().getEmail()"},
  notificationFrequency: "${s.notificationFrequency}",
  replyCommands: true,
  batchSize: 20,
  lookbackDays: 3
};

const Memory = {
  load() { const raw = PropertiesService.getScriptProperties().getProperty("agentMemory"); return raw ? JSON.parse(raw) : {}; },
  save(memory) { PropertiesService.getScriptProperties().setProperty("agentMemory", JSON.stringify(memory)); },
  remember(email, action, reason) { const m = this.load(); m[email.toLowerCase()] = { action, reason, learnedOn: new Date().toLocaleDateString() }; this.save(m); },
  recall(email) { return this.load()[email.toLowerCase()] || null; },
  summarize() { const m = this.load(); const e = Object.entries(m); if (!e.length) return "No senders learned yet."; return e.map(([em, d]) => \`\${em}: \${d.action} — "\${d.reason}"\`).join("\\n"); },
  forget(email) { const m = this.load(); delete m[email.toLowerCase()]; this.save(m); },
  reset() { PropertiesService.getScriptProperties().deleteProperty("agentMemory"); }
};

function askGemini(senderEmail, senderName, subject, snippet) {
  const prompt = \`You are a Gmail assistant. Analyze this email and decide what to do.
From: \${senderName} <\${senderEmail}>
Subject: \${subject}
Preview: \${snippet}
Rules: STAR=personal/important, TRASH=junk/scam, UNSUB=newsletter/marketing, FLAG=unsure
Reply ONLY:
DECISION: [STAR|TRASH|UNSUB|FLAG]
REASON: [one sentence]\`;
  const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${SETTINGS.geminiApiKey}\`;
  try {
    const res = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 60 } }), muteHttpExceptions: true });
    const text = JSON.parse(res.getContentText())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return { action: "FLAG", reason: "No response from Gemini" };
    const action = (text.match(/DECISION:\\s*(STAR|TRASH|UNSUB|FLAG)/i) || [])[1]?.toUpperCase() || "FLAG";
    const reason = (text.match(/REASON:\\s*(.+)/i) || [])[1]?.trim() || "No reason";
    return { action, reason };
  } catch (e) { return { action: "FLAG", reason: "API error: " + e.message }; }
}

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("runAgent").timeBased().everyHours(1).create();
  sendNotification("✅ Gmail Agent active!", "Your Gmail AI Agent is running.");
  Logger.log("Agent activated.");
}

function runAgent() {
  checkForReplies();
  const flagged = [], actioned = [];
  processTrustedSenders(actioned);
  if (SETTINGS.deleteSpam) clearSpam(actioned);
  const threads = GmailApp.search(\`is:unread newer_than:\${SETTINGS.lookbackDays}d\`, 0, SETTINGS.batchSize);
  for (const thread of threads) {
    const msgs = thread.getMessages();
    if (!msgs.length) continue;
    const msg = msgs[msgs.length - 1];
    const senderFull = msg.getFrom();
    const senderEmail = extractEmail(senderFull);
    if (isTrustedSender(senderEmail)) continue;
    let decision = Memory.recall(senderEmail);
    if (!decision) { decision = askGemini(senderEmail, extractName(senderFull), msg.getSubject() || "(no subject)", msg.getPlainBody().substring(0, 300)); Memory.remember(senderEmail, decision.action, decision.reason); }
    const subject = msg.getSubject();
    switch (decision.action) {
      case "STAR": msg.star(); actioned.push(\`⭐ Starred: "\${subject}"\`); break;
      case "TRASH": thread.moveToTrash(); actioned.push(\`🗑️ Trashed: "\${subject}"\`); break;
      case "UNSUB":
        const url = getUnsubscribeUrl(msg);
        if (url && attemptUnsubscribe(url)) { thread.moveToTrash(); actioned.push(\`📧 Unsubscribed: \${senderEmail}\`); }
        else flagged.push({ from: senderFull, subject: subject, reason: "Unsubscribe failed — manual action needed", threadId: thread.getId(), senderEmail: senderEmail });
        break;
      default: flagged.push({ from: senderFull, subject: subject, reason: decision.reason, threadId: thread.getId(), senderEmail: senderEmail });
    }
  }
  if (flagged.length) sendFlagNotification(flagged, actioned);
}

function processTrustedSenders(actioned) {
  GmailApp.search(\`is:unread newer_than:\${SETTINGS.lookbackDays}d\`, 0, SETTINGS.batchSize).forEach(thread => {
    thread.getMessages().forEach(msg => { if (msg.isUnread() && isTrustedSender(extractEmail(msg.getFrom()))) { msg.star(); actioned.push(\`⭐ Starred (trusted): "\${msg.getSubject()}"\`); } });
  });
}

function isTrustedSender(email) {
  const individualMatch = SETTINGS.trustedSenders.some(t => email.toLowerCase().includes(t.toLowerCase()));
  const domainMatch = SETTINGS.trustedDomains.some(d => email.toLowerCase().endsWith(d.toLowerCase()));
  return individualMatch || domainMatch;
}

function clearSpam(actioned) { const s = GmailApp.search("in:spam", 0, SETTINGS.batchSize); if (s.length) { GmailApp.moveThreadsToTrash(s); actioned.push(\`🗑️ Trashed \${s.length} spam threads\`); } }

function sendFlagNotification(flagged, actioned) {
  const lines = flagged.map((e, i) => \`\${i + 1}. From: \${e.from}\\n   "\${e.subject}"\\n   Reason: \${e.reason}\`).join("\\n\\n");
  sendNotification(\`🚩 \${flagged.length} email(s) need your attention\`, \`\${flagged.length} email(s) were flagged:\\n\\n\${lines}\\n\\nThese were NOT touched.\`, { hasFlagged: true });
}

function sendNotification(subject, emailBody, opts) {
  const hasFlagged = opts && opts.hasFlagged;
  const freq = SETTINGS.notificationFrequency || "every-run";
  if (freq === "action-only" && !hasFlagged) return;
  if (freq === "daily" && new Date().getHours() !== 8) return;
  try { GmailApp.sendEmail(SETTINGS.notificationEmail, subject, emailBody); } catch (e) {}
}

function extractEmail(f) { const m = f.match(/<(.+?)>/); return m ? m[1].toLowerCase() : f.toLowerCase().trim(); }
function extractName(f) { const m = f.match(/^([^<]+)</); return m ? m[1].trim() : f; }
function getUnsubscribeUrl(msg) { try { const m = msg.getRawContent().match(/List-Unsubscribe:\\s*<(https?:\\/\\/[^>]+)>/i); return m ? m[1] : null; } catch (e) { return null; } }
function attemptUnsubscribe(url) { try { const r = UrlFetchApp.fetch(url, { method: "get", followRedirects: true, muteHttpExceptions: true }); return r.getResponseCode() < 400; } catch (e) { return false; } }

function testGemini() { Logger.log(JSON.stringify(askGemini("newsletter@example.com", "Example", "Weekly digest", "Top stories this week..."))); }
function showMemory() { Logger.log(Memory.summarize()); }
function forgetSender() { Memory.forget("email@example.com"); }
function resetMemory() { Memory.reset(); }
function stopAgent() { ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t)); Logger.log("Agent stopped."); }
`;
}
