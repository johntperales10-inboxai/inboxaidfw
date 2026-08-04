# InboxAI Setup

Build me a clean, modern 3-stage web app called "InboxAI" — a Gmail AI Agent setup wizard. The app lives on one page and walks users through 3 stages. Only one stage is visible at a time.

=== BRAND & STYLE ===
- Name: InboxAI
- Tagline: "Your Gmail inbox, managed by AI"
- Style: Clean, minimal, professional. Dark navy (#0f1117) background. White text. Accent color: electric blue (#4f8ef7). Card surfaces: slightly lighter than background (#1a1d27).
- Font: Modern sans-serif. Large bold headlines.
- No clutter. Lots of breathing room. Feels premium and trustworthy.

=== STAGE 1 — LANDING / HERO ===
Full screen hero section with:
- Small badge at top: "Free · No coding required · Runs inside your Google account"
- Big headline: "Your Gmail inbox, managed by AI"
- Subheading: "A personal AI agent that lives inside your own Google account. It stars emails from people you care about, deletes spam, unsubscribes from newsletters you've forgotten about, and texts you when it finds something it's not sure about."
- 4 feature cards in a 2x2 grid:
  Card 1: ⭐ "Stars important emails" — "AI reads every email and decides if it's from a real person who matters to you."
  Card 2: 🗑️ "Clears spam automatically" — "Empties your spam folder into trash so it never piles up again."
  Card 3: 📧 "Unsubscribes for you" — "Finds newsletters you haven't opened in months and unsubscribes automatically."
  Card 4: 💬 "Texts you when unsure" — "Never guesses. Sends you a Telegram message when it needs your input."
- Big CTA button: "Set up my agent →" — clicking it goes to Stage 2.

=== STAGE 2 — SETTINGS FORM ===
Header: "Tell us about your inbox" with subtext "Takes 2 minutes. We'll build your custom script with your settings already filled in."

Back button at top left that goes back to Stage 1.

Form fields:

1. TRUSTED SENDERS
Label: "Who do you always want to hear from?"
Hint: "Emails from these people will always be starred, no questions asked."
- Dynamic list of email input fields
- User can add more with an "+ Add another email" button
- User can remove any row with an X button

2. UNSUBSCRIBE THRESHOLD
Label: "Unsubscribe from newsletters ignored for longer than..."
Hint: "The agent will automatically unsubscribe from any mailing list you haven't opened in this long."
- Slider from 14 days to 180 days, default 60 days
- Shows current value next to slider (e.g. "60 days")

3. TWO TOGGLE SWITCHES:
Toggle 1: "Auto-delete spam" (default ON) — "Moves everything in your spam folder to trash every hour"
Toggle 2: "Telegram notifications" (default OFF) — "Get a message when the agent needs your input"
- When Telegram toggle is turned ON, smoothly reveal two new text input fields below it:
  - "Telegram bot token" (placeholder: "123456:ABCdef...")
  - "Your Telegram chat ID" (placeholder: "987654321")

Big button at bottom: "Build my custom script →" — clicking it generates the script and goes to Stage 3.

=== STAGE 3 — GENERATED SCRIPT + INSTALL STEPS ===
Back button at top left that goes back to Stage 2.

Header: "Your script is ready"
Subtext: "Follow the 4 steps below. Takes about 5 minutes. You'll never need to touch code again."

Green success banner: "✓ Your settings have been baked into the script below."

SCRIPT OUTPUT BOX:
- Dark code box with monospace font showing the generated script
- The script must have the user's actual trusted sender emails filled in from the form
- The user's unsubscribe days threshold filled in
- Their spam setting (true/false) filled in
- Their Telegram settings filled in (useTelegram: true/false, token and chat ID if provided)
- "Copy script" button in the top right corner of the code box
- When clicked, button text changes to "Copied ✓" for 2 seconds

INSTALL STEPS — numbered list of cards:
Step 1: "Go to script.google.com and sign in with the same Google account as your Gmail. Click New project."
Step 2: "Delete everything in the editor. Paste your script above using Ctrl+V (Cmd+V on Mac). Save with Ctrl+S."
Step 3: "Click the dropdown at the top of the editor — it says myFunction by default. Change it to testGemini. Press ▶ Run. Accept any permissions Google asks for."
Step 4: "Once that works, change the dropdown to setupTrigger and press ▶ Run. Your agent is now live and runs every hour automatically."
Step 5: "To stop the agent any time, run stopAgent from the same dropdown. To fully remove access go to myaccount.google.com/permissions."

=== THE SCRIPT TEMPLATE ===
When the user clicks "Build my custom script", generate this script with their values filled in. Replace all placeholder values with what the user entered in the form:

// ============================================================
//  GMAIL AI AGENT — your custom build
//  Paste into script.google.com → New project → Run setupTrigger
// ============================================================

const SETTINGS = {
  geminiApiKey: "PASTE_YOUR_GEMINI_API_KEY_HERE",
  trustedSenders: [
    [LIST OF EMAILS FROM FORM, each on its own line in quotes]
  ],
  deleteSpam: [TRUE OR FALSE FROM TOGGLE],
  unsubscribeAfterDays: [NUMBER FROM SLIDER],
  notificationEmail: Session.getActiveUser().getEmail(),
  useTelegram: [TRUE OR FALSE FROM TOGGLE],
  telegramBotToken: "[TOKEN FROM FORM OR PASTE_YOUR_BOT_TOKEN_HERE]",
  telegramChatId: "[CHAT ID FROM FORM OR PASTE_YOUR_CHAT_ID_HERE]",
  batchSize: 20,
  lookbackDays: 3
};

const Memory = {
  load() { const raw = PropertiesService.getScriptProperties().getProperty("agentMemory"); return raw ? JSON.parse(raw) : {}; },
  save(memory) { PropertiesService.getScriptProperties().setProperty("agentMemory", JSON.stringify(memory)); },
  remember(email, action, reason) { const m = this.load(); m[email.toLowerCase()] = { action, reason, learnedOn: new Date().toLocaleDateString() }; this.save(m); },
  recall(email) { return this.load()[email.toLowerCase()] || null; },
  summarize() { const m = this.load(); const e = Object.entries(m); if (!e.length) return "No senders learned yet."; return e.map(([em, d]) => `${em}: ${d.action} — "${d.reason}"`).join("\n"); },
  forget(email) { const m = this.load(); delete m[email.toLowerCase()]; this.save(m); },
  reset() { PropertiesService.getScriptProperties().deleteProperty("agentMemory"); }
};

function askGemini(senderEmail, senderName, subject, snippet) {
  const prompt = `You are a Gmail assistant. Analyze this email and decide what to do.\nFrom: ${senderName} <${senderEmail}>\nSubject: ${subject}\nPreview: ${snippet}\nRules: STAR=personal/important, TRASH=junk/scam, UNSUB=newsletter/marketing, FLAG=unsure\nReply ONLY:\nDECISION: [STAR|TRASH|UNSUB|FLAG]\nREASON: [one sentence]`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${SETTINGS.geminiApiKey}`;
  try {
    const res = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 60 } }), muteHttpExceptions: true });
    const text = JSON.parse(res.getContentText())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return { action: "FLAG", reason: "No response from Gemini" };
    const action = (text.match(/DECISION:\s*(STAR|TRASH|UNSUB|FLAG)/i) || [])[1]?.toUpperCase() || "FLAG";
    const reason = (text.match(/REASON:\s*(.+)/i) || [])[1]?.trim() || "No reason";
    return { action, reason };
  } catch (e) { return { action: "FLAG", reason: "API error: " + e.message }; }
}

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("runAgent").timeBased().everyHours(1).create();
  sendNotification("✅ Gmail Agent active!", "Your Gmail AI Agent is running.", "✅ Gmail AI Agent is live!");
  Logger.log("Agent activated.");
}

function runAgent() {
  const flagged = [], actioned = [];
  processTrustedSenders(actioned);
  if (SETTINGS.deleteSpam) clearSpam(actioned);
  const threads = GmailApp.search(`is:unread newer_than:${SETTINGS.lookbackDays}d`, 0, SETTINGS.batchSize);
  for (const thread of threads) {
    const msgs = thread.getMessages();
    if (!msgs.length) continue;
    const msg = msgs[msgs.length - 1];
    const senderFull = msg.getFrom();
    const senderEmail = extractEmail(senderFull);
    if (isTrustedSender(senderEmail)) continue;
    let decision = Memory.recall(senderEmail);
    if (!decision) { decision = askGemini(senderEmail, extractName(senderFull), msg.getSubject() || "(no subject)", msg.getPlainBody().substring(0, 300)); Memory.remember(senderEmail, decision.action, decision.reason); }
    switch (decision.action) {
      case "STAR": msg.star(); actioned.push(`⭐ Starred: "${msg.getSubject()}"`); break;
      case "TRASH": thread.moveToTrash(); actioned.push(`🗑️ Trashed: "${msg.getSubject()}"`); break;
      case "UNSUB":
        const url = getUnsubscribeUrl(msg);
        if (url && attemptUnsubscribe(url)) { thread.moveToTrash(); actioned.push(`📧 Unsubscribed: ${senderEmail}`); }
        else flagged.push({ from: senderFull, subject: msg.getSubject(), reason: "Unsubscribe failed — manual action needed" });
        break;
      default: flagged.push({ from: senderFull, subject: msg.getSubject(), reason: decision.reason });
    }
  }
  if (flagged.length) sendFlagNotification(flagged, actioned);
}

function processTrustedSenders(actioned) {
  GmailApp.search(`is:unread newer_than:${SETTINGS.lookbackDays}d`, 0, SETTINGS.batchSize).forEach(thread => {
    thread.getMessages().forEach(msg => { if (msg.isUnread() && isTrustedSender(extractEmail(msg.getFrom()))) { msg.star(); actioned.push(`⭐ Starred (trusted): "${msg.getSubject()}"`); } });
  });
}

function isTrustedSender(email) { return SETTINGS.trustedSenders.some(t => email.toLowerCase().includes(t.toLowerCase())); }
function clearSpam(actioned) { const s = GmailApp.search("in:spam", 0, SETTINGS.batchSize); if (s.length) { GmailApp.moveThreadsToTrash(s); actioned.push(`🗑️ Trashed ${s.length} spam threads`); } }

function sendFlagNotification(flagged, actioned) {
  const lines = flagged.map((e, i) => `${i + 1}. From: ${e.from}\n   "${e.subject}"\n   Reason: ${e.reason}`).join("\n\n");
  sendNotification(`🚩 ${flagged.length} email(s) need your attention`, `${flagged.length} email(s) were flagged:\n\n${lines}\n\nThese were NOT touched.`, `🚩 ${flagged.length} email(s) flagged:\n${lines}`);
}

function sendNotification(subject, emailBody, telegramText) {
  try { GmailApp.sendEmail(SETTINGS.notificationEmail, subject, emailBody); } catch (e) {}
  if (SETTINGS.useTelegram && SETTINGS.telegramBotToken !== "PASTE_YOUR_BOT_TOKEN_HERE") {
    try { UrlFetchApp.fetch(`https://api.telegram.org/bot${SETTINGS.telegramBotToken}/sendMessage`, { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: SETTINGS.telegramChatId, text: telegramText || subject }), muteHttpExceptions: true }); } catch (e) {}
  }
}

function extractEmail(f) { const m = f.match(/<(.+?)>/); return m ? m[1].toLowerCase() : f.toLowerCase().trim(); }
function extractName(f) { const m = f.match(/^([^<]+)</); return m ? m[1].trim() : f; }
function getUnsubscribeUrl(msg) { try { const m = msg.getRawContent().match(/List-Unsubscribe:\s*<(https?:\/\/[^>]+)>/i); return m ? m[1] : null; } catch (e) { return null; } }
function attemptUnsubscribe(url) { try { const r = UrlFetchApp.fetch(url, { method: "get", followRedirects: true, muteHttpExceptions: true }); return r.getResponseCode() < 400; } catch (e) { return false; } }

function testGemini() { Logger.log(JSON.stringify(askGemini("newsletter@example.com", "Example", "Weekly digest", "Top stories this week..."))); }
function testTelegram() { SETTINGS.useTelegram = true; sendNotification("🤖 Test", "Test email.", "🤖 Telegram connected!"); }
function showMemory() { Logger.log(Memory.summarize()); }
function forgetSender() { Memory.forget("email@example.com"); }
function resetMemory() { Memory.reset(); }
function stopAgent() { ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t)); Logger.log("Agent stopped."); }

=== IMPORTANT NOTES FOR THE BUILDER ===
- All 3 stages live on ONE page. Only one stage shows at a time. Transitions should be smooth.
- The script generator is pure JavaScript in the browser — no backend needed.
- The copy button must copy the full generated script to clipboard.
- The form must validate that at least one trusted sender email is entered before allowing script generation.
- Mobile responsive — should look great on phone too.
- No login required. No data is stored anywhere. Everything happens in the browser.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://inboxaidfw.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c8d36047-b4c4-469b-aeab-a63b6a467594).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
