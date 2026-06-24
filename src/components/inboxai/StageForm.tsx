import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, X, Check, CheckCircle2 } from "lucide-react";
import type { AgentSettings, NotificationFrequency } from "@/lib/generateScript";

interface Props {
  onBack: () => void;
  onSubmit: (s: AgentSettings) => void;
  userEmail?: string | null;
}

export function StageForm({ onBack, onSubmit, userEmail }: Props) {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [senders, setSenders] = useState<string[]>([""]);
  const [days, setDays] = useState(60);
  const [deleteSpam, setDeleteSpam] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState(userEmail ?? "");
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>("action-only");
  const [error, setError] = useState("");

  const updateSender = (i: number, v: string) => {
    const next = [...senders];
    next[i] = v;
    setSenders(next);
  };

  const handleSubmit = () => {
    const cleaned = senders.map((s) => s.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setError("Please add at least one trusted sender email.");
      return;
    }
    const invalid = cleaned.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid) {
      setError(`"${invalid}" doesn't look like a valid email.`);
      return;
    }
    setError("");
    onSubmit({
      geminiApiKey: geminiApiKey.trim() || undefined,
      trustedSenders: cleaned,
      unsubscribeAfterDays: days,
      deleteSpam,
      notificationFrequency,
      notificationEmail: notificationEmail.trim() || undefined,
    });
  };

  return (
    <section className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {userEmail && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Signed in as <span className="font-medium">{userEmail}</span></span>
          </div>
        )}
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Tell us about your inbox</h1>
        <p className="mt-4 text-muted-foreground">Takes 2 minutes. We'll build your custom script with your settings already filled in.</p>

        <div className="mt-12 space-y-10">
          {/* Step 1 — Gemini API Key */}
          <div>
            <label className="block text-base font-semibold">Step 1 — Get your free AI key</label>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary/10 transition-colors"
            >
              Get my free Gemini key →
            </a>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Sign in with Google → Click Get API Key → Click Create API key → Copy the key → Come back and paste it below
            </p>
            <input
              type="text"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Paste your Gemini key here — starts with AIzaSy..."
              className="mt-4 w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm"
            />
          </div>

          {/* Trusted senders */}
          <div>
            <label className="block text-base font-semibold">Who do you always want to hear from?</label>
            <p className="text-sm text-muted-foreground mt-1">Emails from these people will always be starred, no questions asked.</p>
            <div className="mt-4 space-y-2">
              {senders.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    value={s}
                    onChange={(e) => updateSender(i, e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    onClick={() => setSenders(senders.length === 1 ? [""] : senders.filter((_, j) => j !== i))}
                    className="size-12 flex items-center justify-center rounded-lg bg-card border border-border hover:border-destructive hover:text-destructive transition-colors"
                    aria-label="Remove"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSenders([...senders, ""])}
                className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity mt-2"
              >
                <Plus className="size-4" /> Add another email
              </button>
            </div>
          </div>

          {/* Slider */}
          <div>
            <label className="block text-base font-semibold">Unsubscribe from newsletters ignored for longer than…</label>
            <p className="text-sm text-muted-foreground mt-1">The agent will automatically unsubscribe from any mailing list you haven't opened in this long.</p>
            <div className="mt-5 flex items-center gap-4">
              <input
                type="range"
                min={14}
                max={180}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-medium tabular-nums min-w-[70px] text-right">{days} days</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <ToggleRow
              label="Auto-delete spam"
              desc="Moves everything in your spam folder to trash every hour"
              checked={deleteSpam}
              onChange={setDeleteSpam}
            />
            <ToggleRow
              label="Telegram notifications"
              desc="Get a message when the agent needs your input"
              checked={useTelegram}
              onChange={setUseTelegram}
            />
            <div
              className={`grid transition-all duration-300 ease-out ${useTelegram ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="pt-3 space-y-3 pl-4 border-l-2 border-primary/40">
                  <div>
                    <label className="block text-sm font-medium mb-2">Telegram bot token</label>
                    <input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="123456:ABCdef..."
                      className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Telegram chat ID</label>
                    <input
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="987654321"
                      className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification email */}
          <div>
            <label className="block text-base font-semibold">Notification email</label>
            <p className="text-sm text-muted-foreground mt-1">Where the agent will send alerts when it needs your input.</p>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-4 w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Notification preference */}
          <div>
            <label className="block text-base font-semibold">Notification preference</label>
            <p className="text-sm text-muted-foreground mt-1">How often should the agent reach out to you?</p>
            <div className="mt-4 space-y-3">
              {([
                { value: "action-only", label: "Only when action needed", desc: "I'll only contact you when I find something I'm not sure about.", recommended: true },
                { value: "daily", label: "Daily summary", desc: "I'll send you one message per day with everything I did." },
                { value: "every-run", label: "Every run", desc: "I'll send you a message every hour (not recommended)." },
              ] as { value: NotificationFrequency; label: string; desc: string; recommended?: boolean }[]).map((opt) => {
                const selected = notificationFrequency === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNotificationFrequency(opt.value)}
                    className={`w-full text-left flex items-start gap-4 p-4 rounded-xl bg-card border transition-all ${
                      selected
                        ? "border-primary ring-1 ring-primary/40 shadow-lg shadow-primary/10"
                        : opt.recommended
                          ? "border-primary/40 hover:border-primary/70"
                          : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 size-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selected ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {selected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        {opt.label}
                        {opt.recommended && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>


          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="group w-full inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Build my custom script
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-card border border-border">
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors mt-1 ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`pointer-events-none inline-block size-6 rounded-full bg-background shadow-lg transform transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
