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
  autoStarRealPeople: true,
  batchSize: 20,
  lookbackDays: 3
};

// ---------- LEARNED RULES (reusable answers) ----------
// A rule is: { rule_id, pattern_type: "sender"|"domain"|"request_type", pattern_value, action, created_at }
const Rules = {
  load() { const raw = PropertiesService.getScriptProperties().getProperty("agentRules"); try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; } },
  save(rules) { PropertiesService.getScriptProperties().setProperty("agentRules", JSON.stringify(rules)); },
  add(pattern_type, pattern_value, action) {
    if (!pattern_value) return null;
    const rules = this.load();
    const value = String(pattern_value).toLowerCase();
    const existing = rules.filter(r => r.pattern_type === pattern_type && r.pattern_value === value)[0];
    if (existing) { existing.action = action; existing.created_at = new Date().toISOString(); this.save(rules); return existing; }
    const rule = { rule_id: "R" + Date.now().toString(36) + Math.floor(Math.random() * 1000), pattern_type: pattern_type, pattern_value: value, action: action, created_at: new Date().toISOString() };
    rules.push(rule); this.save(rules); return rule;
  },
  // Checks sender first, then domain, then request type
  match(senderEmail, requestType) {
    const rules = this.load();
    const email = (senderEmail || "").toLowerCase();
    const domain = email.split("@")[1] || "";
    const order = [["sender", email], ["domain", domain], ["request_type", (requestType || "").toLowerCase()]];
    for (const pair of order) {
      if (!pair[1]) continue;
      const hit = rules.filter(r => r.pattern_type === pair[0] && r.pattern_value === pair[1])[0];
      if (hit) return hit;
    }
    return null;
  },
  remove(rule_id) { const rules = this.load(); const next = rules.filter(r => r.rule_id !== rule_id); this.save(next); return next.length !== rules.length; },
  reset() { PropertiesService.getScriptProperties().deleteProperty("agentRules"); },
  summarize() {
    const rules = this.load();
    if (!rules.length) return "No learned rules yet.";
    return rules.map(r => \`\${r.rule_id} | \${r.pattern_type} | \${r.pattern_value} → \${r.action} (learned \${new Date(r.created_at).toLocaleDateString()})\`).join("\\n");
  }
};

// Categorize the kind of request so similar emails from other senders match too
function classifyRequestType(subject, snippet) {
  const text = ((subject || "") + " " + (snippet || "")).toLowerCase();
  const buckets = [
    ["unsubscribe request", ["unsubscribe", "opt out", "manage preferences", "stop receiving", "email preferences"]],
    ["meeting request", ["meeting", "calendar", "schedule a call", "book a time", "invite you to", "zoom", "google meet"]],
    ["pricing question", ["pricing", "quote", "how much", "cost", "discount", "invoice", "payment"]],
    ["sales outreach", ["quick question about your", "reaching out", "partnership", "demo", "our platform", "grow your"]],
    ["newsletter", ["newsletter", "weekly digest", "this week in", "roundup", "issue #"]],
    ["receipt or order", ["receipt", "your order", "shipped", "tracking number", "confirmation number"]],
    ["account notice", ["password", "verify your", "security alert", "sign-in", "account update", "terms of service"]],
    ["support request", ["help", "issue", "not working", "support ticket", "bug", "problem with"]]
  ];
  for (const b of buckets) { if (b[1].some(k => text.indexOf(k) !== -1)) return b[0]; }
  return "general";
}

function applyRuleAction(action, thread, msg, senderEmail, actioned, ruleId) {
  switch (action) {
    case "STAR": msg.star(); actioned.push(\`⭐ Starred by learned rule \${ruleId}: \${senderEmail}\`); return true;
    case "TRASH": thread.moveToTrash(); actioned.push(\`🗑️ Trashed by learned rule \${ruleId}: \${senderEmail}\`); return true;
    case "UNSUB": {
      const u = getUnsubscribeUrl(msg);
      if (u && attemptUnsubscribe(u)) { thread.moveToTrash(); actioned.push(\`📧 Unsubscribed by learned rule \${ruleId}: \${senderEmail}\`); return true; }
      return false;
    }
    case "IGNORE": actioned.push(\`✋ Left alone by learned rule \${ruleId}: \${senderEmail}\`); return true;
    default: return false;
  }
}

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
MOST IMPORTANT RULE: Before anything else, determine if this email was sent by a real human person writing directly to the recipient, or by a company, organization, automated system, newsletter, bot, or marketing tool.
Signs it is a REAL PERSON:
- Written in a conversational natural tone
- Addresses the recipient by name or personally
- Comes from a personal email address like gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com
- Has imperfect grammar, casual language, or personal details
- Feels like one human writing to another human
- Is a reply to something the recipient sent
- Mentions specific personal details like names, places, events

Signs it is NOT a real person:
- Comes from a company domain with words like noreply, info, support, newsletter, hello, team, admin, marketing, deals, offers, updates, notifications
- Contains promotional language like limited time offer, unsubscribe, click here, shop now, your order, your account
- Has perfect formatting with images, logos, or HTML layout
- Is clearly automated like a receipt, shipping update, password reset, or system notification
- Sent from a business name not a personal name

If the email is from a REAL PERSON always return STAR regardless of the subject or content. A real human reaching out to you is always more important than any other rule. Never trash or unsub a real person's email.
Other rules: STAR=personal/important, TRASH=junk/scam, UNSUB=newsletter/marketing, FLAG=unsure
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
    const subject = msg.getSubject() || "(no subject)";
    const snippet = msg.getPlainBody().substring(0, 300);
    if (isTrustedSender(senderEmail)) continue;
    if (isRealPerson(senderEmail, subject, snippet)) {
      msg.star();
      actioned.push("⭐ Auto-starred real person: " + senderEmail);
      continue;
    }
    const requestType = classifyRequestType(subject, snippet);
    // 1) Learned rules first (sender → domain → request type). If one matches, never ask again.
    const rule = Rules.match(senderEmail, requestType);
    if (rule && applyRuleAction(rule.action, thread, msg, senderEmail, actioned, rule.rule_id)) continue;

    let decision = Memory.recall(senderEmail);
    if (!decision) { decision = askGemini(senderEmail, extractName(senderFull), subject, snippet); Memory.remember(senderEmail, decision.action, decision.reason); }
    switch (decision.action) {
      case "STAR": msg.star(); actioned.push(\`⭐ Starred: "\${subject}"\`); break;
      case "TRASH": thread.moveToTrash(); actioned.push(\`🗑️ Trashed: "\${subject}"\`); break;
      case "UNSUB":
        const url = getUnsubscribeUrl(msg);
        if (url && attemptUnsubscribe(url)) { thread.moveToTrash(); actioned.push(\`📧 Unsubscribed: \${senderEmail}\`); }
        else flagged.push({ from: senderFull, subject: subject, reason: "Unsubscribe failed — manual action needed", threadId: thread.getId(), senderEmail: senderEmail, requestType: requestType });
        break;
      default: flagged.push({ from: senderFull, subject: subject, reason: decision.reason, threadId: thread.getId(), senderEmail: senderEmail, requestType: requestType });
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

function isRealPerson(senderEmail, subject, snippet) {
  if (!SETTINGS.autoStarRealPeople) return false;
  const personalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "msn.com", "live.com", "me.com", "mac.com", "protonmail.com", "icloud.com"];
  const domain = senderEmail.split("@")[1]?.toLowerCase() || "";
  const isPersonalDomain = personalDomains.some(d => domain === d);
  const noReplyPatterns = ["noreply", "no-reply", "donotreply", "do-not-reply", "newsletter", "marketing", "support", "info@", "hello@", "team@", "admin@", "notifications@", "updates@", "deals@", "offers@", "mailer@", "automated@"];
  const isAutomated = noReplyPatterns.some(p => senderEmail.toLowerCase().includes(p));
  if (isPersonalDomain && !isAutomated) return true;
  return false;
}

function clearSpam(actioned) { const s = GmailApp.search("in:spam", 0, SETTINGS.batchSize); if (s.length) { GmailApp.moveThreadsToTrash(s); actioned.push(\`🗑️ Trashed \${s.length} spam threads\`); } }

function sendFlagNotification(flagged, actioned) {
  storePendingFlagged(flagged);
  const lines = flagged.map((e, i) => \`\${i + 1}. From: \${e.from}\\n   "\${e.subject}"\\n   Reason: \${e.reason}\`).join("\\n\\n");
  const instructions = "HOW TO HANDLE THESE EMAILS:\\nJust reply to this email with simple commands:\\nTRASH 1 — trash email number 1\\nSTAR 2 — star email number 2\\nUNSUB 3 — unsubscribe from email number 3\\nIGNORE 1 — leave email 1 alone\\nYou can combine them: TRASH 1, UNSUB 2, STAR 3\\n\\nI LEARN FROM YOUR ANSWERS:\\nBy default I save your answer as a rule for that exact sender, so I never ask about them again.\\nWant it to cover more? Add a scope word:\\nTRASH 1 DOMAIN — apply to everyone at that sender's domain\\nUNSUB 2 TYPE — apply to every email of that same kind (e.g. unsubscribe request, meeting request, pricing question)\\nTRASH 3 ONCE — just this once, do not learn a rule\\n\\nMANAGE LEARNED RULES:\\nReply RULES — I email you the full list of learned rules with their IDs\\nReply FORGET R123abc — delete that rule\\nReply FORGET ALL — delete every learned rule\\nThe agent will process your reply within the hour and send you a confirmation.";
  sendNotification(\`🚩 \${flagged.length} email(s) need your attention\`, \`\${flagged.length} email(s) were flagged:\\n\\n\${lines}\\n\\nThese were NOT touched.\\n\\n\${instructions}\`, { hasFlagged: true });
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

// ---------- VIEW / DELETE YOUR LEARNED RULES ----------
// Run showRules() to print them, emailMyRules() to get them in your inbox,
// deleteRule("R123abc") to delete one, resetRules() to delete all.
function showRules() { Logger.log(Rules.summarize()); }
function emailMyRules() {
  GmailApp.sendEmail(SETTINGS.notificationEmail, "📘 Gmail Agent: your learned rules",
    "These are the rules I learned from your answers:\\n\\n" + Rules.summarize() +
    "\\n\\nTo delete one, reply to a flag email with: FORGET <rule_id>\\nTo delete all: FORGET ALL\\n\\n— Your Gmail AI Agent");
}
function deleteRule(ruleId) { Logger.log(Rules.remove(ruleId) ? "Deleted " + ruleId : "No rule with id " + ruleId); }
function resetRules() { Rules.reset(); Logger.log("All learned rules deleted."); }
function stopAgent() { ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t)); Logger.log("Agent stopped."); }

function checkForReplies() {
  const threads = GmailApp.search('subject:"🚩 Gmail Agent" is:unread from:me', 0, 10);
  if (threads.length === 0) return;
  for (const thread of threads) {
    for (const msg of thread.getMessages()) {
      if (!msg.isUnread()) continue;
      if (msg.getFrom().toLowerCase().indexOf(Session.getActiveUser().getEmail().toLowerCase()) === -1) continue;
      const body = msg.getPlainBody().toUpperCase();
      const ruleResults = handleRuleCommands(body);
      const commands = parseCommands(body);
      if (commands.length === 0) {
        msg.markRead();
        if (ruleResults.length) GmailApp.sendEmail(SETTINGS.notificationEmail, "📘 Gmail Agent: rules updated", ruleResults.join("\\n") + "\\n\\n— Your Gmail AI Agent");
        continue;
      }
      const stored = getPendingFlagged();
      if (!stored || !stored.length) { msg.markRead(); continue; }
      const results = ruleResults.slice();
      for (const cmd of commands) {
        const index = cmd.number - 1;
        if (index < 0 || index >= stored.length) { results.push("⚠️ Email " + cmd.number + " not found"); continue; }
        const flagged = stored[index];
        try {
          const emailThread = GmailApp.getThreadById(flagged.threadId);
          if (!emailThread) { results.push("⚠️ Email " + cmd.number + " could not be found"); continue; }
          switch (cmd.action) {
            case "TRASH": emailThread.moveToTrash(); Memory.remember(flagged.senderEmail, "TRASH", "Trashed by reply"); results.push("🗑️ Trashed email " + cmd.number); break;
            case "STAR": emailThread.getMessages().forEach(m => m.star()); Memory.remember(flagged.senderEmail, "STAR", "Starred by reply"); results.push("⭐ Starred email " + cmd.number); break;
            case "UNSUB": const url = getUnsubscribeUrl(emailThread.getMessages().slice(-1)[0]); if (url && attemptUnsubscribe(url)) { emailThread.moveToTrash(); Memory.remember(flagged.senderEmail, "UNSUB", "Unsubscribed by reply"); results.push("📧 Unsubscribed from email " + cmd.number); } else { results.push("⚠️ Could not unsubscribe from email " + cmd.number); } break;
            case "IGNORE": Memory.remember(flagged.senderEmail, "FLAG", "Ignored by user"); results.push("✋ Ignored email " + cmd.number); break;
          }
        } catch(err) { results.push("❌ Error on email " + cmd.number + ": " + err.message); }
      }
      msg.markRead();
      GmailApp.sendEmail(SETTINGS.notificationEmail, "✅ Gmail Agent: Commands processed", "Your agent processed your reply:\\n\\n" + results.join("\\n") + "\\n\\n— Your Gmail AI Agent");
      clearPendingFlagged();
    }
  }
}

function parseCommands(text) {
  const commands = []; const pattern = /(TRASH|STAR|UNSUB|IGNORE)\\s+(\\d+)/g; let match;
  while ((match = pattern.exec(text)) !== null) { commands.push({ action: match[1], number: parseInt(match[2]) }); }
  return commands;
}

function storePendingFlagged(flagged) { PropertiesService.getScriptProperties().setProperty("pendingFlagged", JSON.stringify(flagged)); }
function getPendingFlagged() { const raw = PropertiesService.getScriptProperties().getProperty("pendingFlagged"); return raw ? JSON.parse(raw) : []; }
function clearPendingFlagged() { PropertiesService.getScriptProperties().deleteProperty("pendingFlagged"); }
`;
}
