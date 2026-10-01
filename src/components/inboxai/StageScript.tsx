import { useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";

interface Props {
  script: string;
  premium?: boolean;
  onBack: () => void;
}

const dashboardSteps = [
  "In the same script editor, click the blue Deploy button (top right) → New deployment.",
  "Click the gear ⚙ next to “Select type” and choose Web app.",
  "Set Execute as: Me, and Who has access: Only myself. Click Deploy, then Authorize access if Google asks.",
  "Copy the Web app URL. That's your private Priority Inbox. Bookmark it, or save it on inboxaidfw.com/dashboard so it's one click away.",
];

const steps = [
  "Go to script.google.com and sign in with the same Google account as your Gmail. Click New project.",
  "Delete everything in the editor. Paste your script above using Ctrl+V (Cmd+V on Mac). Save with Ctrl+S.",
  "Click the dropdown at the top of the editor — it says myFunction by default. Change it to testGemini. Press ▶ Run. Accept any permissions Google asks for.",
  "Once that works, change the dropdown to setupTrigger and press ▶ Run. Your agent is now live and runs every hour automatically.",
  "To stop the agent any time, run stopAgent from the same dropdown. To fully remove access go to myaccount.google.com/permissions.",
];

export function StageScript({ script, premium = false, onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = script;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your script is ready</h1>
        <p className="mt-4 text-muted-foreground">Follow the 4 steps below. Takes about 5 minutes. You'll never need to touch code again.</p>

        <div className="mt-8 px-5 py-4 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3">
          <div className="size-6 rounded-full bg-success flex items-center justify-center shrink-0">
            <Check className="size-4 text-success-foreground" />
          </div>
          <p className="text-sm text-foreground">Your settings have been baked into the script below.</p>
        </div>

        <div className="mt-6 relative rounded-xl overflow-hidden border border-border bg-[oklch(0.15_0.015_265)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/40">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[oklch(0.65_0.22_25)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.78_0.18_85)]" />
              <span className="size-2.5 rounded-full bg-success" />
            </div>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              {copied ? <><Check className="size-3.5" /> Copied</> : <><Copy className="size-3.5" /> Copy my ready-to-use script</>}
            </button>
          </div>
          <pre className="overflow-x-auto p-5 text-xs leading-relaxed font-mono text-foreground/90 max-h-[480px]">
            <code>{script}</code>
          </pre>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Now install it in 2 steps</h2>
          <div className="mt-8 space-y-6">
            {[
              "Go to script.google.com — sign in with your Gmail account, click New Project, delete the default code, and paste your script. Save with Ctrl+S.",
              "Click the dropdown at the top — change it from myFunction to setupTrigger — press the Play button. Accept the permissions Google asks for. Your agent is now live.",
            ].map((s, i) => (
              <div key={i} className="flex gap-6 p-8 rounded-2xl bg-card border border-border">
                <div className="size-16 shrink-0 rounded-full bg-primary text-primary-foreground font-bold text-3xl flex items-center justify-center">
                  {i + 1}
                </div>
                <p className="text-lg sm:text-xl leading-relaxed text-foreground font-medium pt-2">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {premium && (
          <div className="mt-16 p-8 rounded-2xl bg-card border-2 border-primary/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Premium ✨</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Open your Priority Inbox</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your script includes the Priority Inbox dashboard. It runs inside your own Google account, so your
              email never passes through our servers. Make sure your Gemini API key is filled in (it scores your
              emails), then publish it as a private web app. This takes about 2 minutes.
            </p>
            <ol className="mt-6 space-y-3">
              {dashboardSteps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="size-7 shrink-0 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/90 pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-muted-foreground">
              Changed your script later? Use Deploy → Manage deployments → ✎ Edit → Version: New version → Deploy, so the
              dashboard picks up the change at the same address.
            </p>
          </div>
        )}

        <div className="mt-16 p-8 rounded-2xl bg-card border border-primary/30">
          <h2 className="text-2xl font-bold tracking-tight">Your agent learns from your answers</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            When your agent is unsure, it still emails you — but now it remembers your reply as a reusable
            rule, so it stops asking about the same thing again.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-foreground/90">
            <li><span className="font-mono text-primary">TRASH 1</span> — learns a rule for that exact sender</li>
            <li><span className="font-mono text-primary">TRASH 1 DOMAIN</span> — applies to everyone at that sender&apos;s domain</li>
            <li><span className="font-mono text-primary">UNSUB 2 TYPE</span> — applies to that kind of request (unsubscribe, meeting, pricing…)</li>
            <li><span className="font-mono text-primary">TRASH 3 ONCE</span> — handle it once, don&apos;t learn anything</li>
          </ul>
          <p className="mt-6 text-sm font-semibold">View and delete your learned rules</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>Reply <span className="font-mono text-primary">RULES</span> to any agent email — it emails you the full list with rule IDs.</li>
            <li>Reply <span className="font-mono text-primary">FORGET R123abc</span> to delete one, or <span className="font-mono text-primary">FORGET ALL</span> to wipe them.</li>
            <li>Or in script.google.com, run <span className="font-mono text-primary">showRules</span>, <span className="font-mono text-primary">deleteRule</span>, or <span className="font-mono text-primary">resetRules</span>.</li>
          </ul>
        </div>

        <div className="mt-12 space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-xl bg-card border border-border">
              <div className="size-8 shrink-0 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 pt-1">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
