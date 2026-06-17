import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, X, Check } from "lucide-react";
import type { AgentSettings, NotificationFrequency } from "@/lib/generateScript";

interface Props {
  onBack: () => void;
  onSubmit: (s: AgentSettings) => void;
}

export function StageForm({ onBack, onSubmit }: Props) {
  const [senders, setSenders] = useState<string[]>([""]);
  const [days, setDays] = useState(60);
  const [deleteSpam, setDeleteSpam] = useState(true);
  const [useTelegram, setUseTelegram] = useState(false);
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
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
      trustedSenders: cleaned,
      unsubscribeAfterDays: days,
      deleteSpam,
      useTelegram,
      telegramBotToken: token,
      telegramChatId: chatId,
      notificationFrequency,
    });
  };

  return (
    <section className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Tell us about your inbox</h1>
        <p className="mt-4 text-muted-foreground">Takes 2 minutes. We'll build your custom script with your settings already filled in.</p>

        <div className="mt-12 space-y-10">
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
