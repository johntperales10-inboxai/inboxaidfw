import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Archive, CheckCircle2, ChevronDown, RefreshCw, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkMyPremium } from "@/lib/purchases.functions";
import { scoreEmails } from "@/lib/dashboard.functions";
import { fetchUnreadEmails, type GmailEmail } from "@/lib/gmail";
import type { EmailScore } from "@/lib/emailTypes";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Priority Inbox — InboxAI Premium" },
      { name: "description", content: "Your AI-scored Priority Inbox: every unread email organized by what actually matters." },
      { property: "og:title", content: "Priority Inbox — InboxAI Premium" },
      { property: "og:description", content: "Your AI-scored Priority Inbox: every unread email organized by what actually matters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type SectionId = EmailScore["section"];

const SECTIONS: { id: SectionId; dot: string; title: string; desc: string }[] = [
  { id: "now", dot: "bg-red-500", title: "Needs Me Now", desc: "requires immediate attention" },
  { id: "today", dot: "bg-orange-500", title: "Today", desc: "important today but not emergencies" },
  { id: "this-week", dot: "bg-yellow-400", title: "This Week", desc: "handle soon" },
  { id: "waiting", dot: "bg-green-500", title: "Waiting On Someone", desc: "you already replied" },
  { id: "read-later", dot: "bg-blue-500", title: "Read Later", desc: "newsletters and promotions" },
  { id: "archive", dot: "bg-zinc-400", title: "Can Be Archived", desc: "safely ignorable" },
];

function scoreColor(n: number) {
  if (n >= 75) return "text-red-400 border-red-400/40 bg-red-400/10";
  if (n >= 50) return "text-orange-400 border-orange-400/40 bg-orange-400/10";
  if (n >= 25) return "text-yellow-400 border-yellow-400/40 bg-yellow-400/10";
  return "text-muted-foreground border-border bg-muted/30";
}

function statusBadge(s: EmailScore["waitingStatus"]) {
  if (s === "needs-my-reply") return "Needs My Reply";
  if (s === "waiting-on-them") return "Waiting On Them";
  return "No Action Needed";
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function countdown(text: string | null) {
  if (!text) return null;
  const t = Date.parse(text);
  if (Number.isNaN(t)) return text;
  const ms = t - Date.now();
  if (ms <= 0) return "Overdue";
  const hours = Math.round(ms / 3600000);
  return hours < 48 ? `${hours}h left` : `${Math.round(hours / 24)}d left`;
}

type Row = GmailEmail & { score?: EmailScore; done?: boolean; starred?: boolean; removed?: boolean };

function DashboardPage() {
  const navigate = useNavigate();
  const checkPremium = useServerFn(checkMyPremium);
  const score = useServerFn(scoreEmails);

  const [gate, setGate] = useState<"checking" | "ok">("checking");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [gmailError, setGmailError] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [agentLastRun, setAgentLastRun] = useState<Date | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ now: true, today: true });

  const load = useCallback(async () => {
    setLoading(true);
    setGmailError(false);
    setAiError(false);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.provider_token ?? null;
      const emails = token ? await fetchUnreadEmails(token, 50) : null;
      if (!emails) {
        setGmailError(true);
        setRows([]);
        setLoading(false);
        return;
      }
      setRows(emails);
      setUpdatedAt(new Date());
      setAgentLastRun(emails.length > 0 ? new Date(emails[0]!.receivedAt) : new Date());
      const result = await score({
        data: {
          emails: emails.map((e) => ({
            id: e.id,
            sender: e.senderName,
            senderEmail: e.senderEmail,
            subject: e.subject,
            preview: e.preview,
            receivedAt: e.receivedAt,
          })),
        },
      });
      if (!result.aiAvailable) {
        setAiError(true);
      } else {
        const byId = new Map(result.scores.map((s) => [s.id, s]));
        setRows(emails.map((e) => ({ ...e, score: byId.get(e.id) })));
      }
    } catch (e) {
      console.error(e);
      setGmailError(true);
    }
    setLoading(false);
  }, [score]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        void navigate({ to: "/signin" });
        return;
      }
      try {
        const r = await checkPremium();
        if (cancelled) return;
        if (!r.isPremium) {
          void navigate({ to: "/premium", search: { upgrade: "required" } });
          return;
        }
        setGate("ok");
        void load();
      } catch {
        if (!cancelled) void navigate({ to: "/premium", search: { upgrade: "required" } });
      }
    })();
    return () => { cancelled = true; };
  }, [checkPremium, navigate, load]);

  const visible = rows.filter((r) => !r.removed);
  const summary = useMemo(() => ({
    unread: visible.length,
    action: visible.filter((r) => r.score?.actionRequired).length,
    waiting: visible.filter((r) => r.score?.waitingStatus === "waiting-on-them").length,
  }), [visible]);

  const agentStale = !agentLastRun || Date.now() - agentLastRun.getTime() > 2 * 3600_000;

  if (gate === "checking") {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking your Premium access…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Priority Inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              AI has organized your emails by what actually matters
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated {updatedAt ? updatedAt.toLocaleTimeString() : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "Total unread", value: summary.unread },
            { label: "Needing action", value: summary.action },
            { label: "Waiting on others", value: summary.waiting },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-card border border-border text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {loading && (
          <div className="mt-8 p-6 rounded-2xl bg-card border border-primary/30 text-center animate-pulse">
            <p className="text-sm text-primary">AI is reading your inbox — this takes about 30 seconds</p>
          </div>
        )}

        {gmailError && (
          <div className="mt-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            Could not load your emails. Make sure you granted Gmail access when signing in. Try signing
            out and back in.
          </div>
        )}
        {aiError && !gmailError && (
          <div className="mt-8 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400">
            AI scoring unavailable right now. Your emails are still shown but without importance scores.
          </div>
        )}

        {/* Sections */}
        <div className="mt-8 space-y-3">
          {SECTIONS.map((sec) => {
            const items = visible.filter((r) => (r.score?.section ?? "read-later") === sec.id);
            const isOpen = open[sec.id] ?? false;
            return (
              <div key={sec.id} className="rounded-2xl bg-card border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [sec.id]: !isOpen }))}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                >
                  <span className={`size-3 rounded-full ${sec.dot}`} />
                  <span className="font-semibold">{sec.title}</span>
                  <span className="text-xs text-muted-foreground">— {sec.desc}</span>
                  <span className="ml-auto text-sm text-muted-foreground">{items.length}</span>
                  <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-3">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nothing here — you are all caught up</p>
                    ) : (
                      items.map((e) => (
                        <EmailCard
                          key={e.id}
                          row={e}
                          onAction={(action) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.id !== e.id
                                  ? r
                                  : action === "star"
                                    ? { ...r, starred: true }
                                    : action === "done"
                                      ? { ...r, done: true }
                                      : { ...r, removed: true },
                              ),
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Agent status */}
        <div className="mt-10 p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${agentStale ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
          <p className="text-xs text-muted-foreground">
            {agentStale
              ? "Background Agent: Check your Google Apps Script installation"
              : `Background Agent: Active — last ran ${agentLastRun!.toLocaleTimeString()} — next run in approximately 1 hour`}
          </p>
        </div>
      </div>
    </main>
  );
}

function EmailCard({ row, onAction }: { row: Row; onAction: (a: "star" | "trash" | "archive" | "done") => void }) {
  const s = row.score;
  const deadline = s?.deadlineDetected ? countdown(s.deadlineText) : null;
  return (
    <div className={`p-4 rounded-xl bg-background border border-border ${row.done ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {row.senderName} <span className="text-muted-foreground font-normal">· {row.senderEmail}</span>
          </p>
          <p className="mt-1 text-sm text-foreground/90 truncate">{row.subject}</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{row.preview.slice(0, 80)}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block px-2 py-1 rounded-lg border text-xs font-semibold ${scoreColor(s?.importanceScore ?? 0)}`}>
            {s ? s.importanceScore : "—"}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(row.receivedAt)}</p>
        </div>
      </div>

      {s && <p className="mt-3 text-xs text-muted-foreground">{s.explanation}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {s && (
          <span className="px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] text-muted-foreground">
            {statusBadge(s.waitingStatus)}
          </span>
        )}
        {s?.actionRequired && (
          <span className="px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-[11px] text-primary">
            Action required
          </span>
        )}
        {s?.deadlineDetected && (
          <span className="px-2 py-1 rounded-md bg-red-500/10 border border-red-500/40 text-[11px] text-red-400">
            Deadline{deadline ? `: ${deadline}` : ""}{s.deadlineText && deadline !== s.deadlineText ? ` — ${s.deadlineText}` : ""}
          </span>
        )}
        {row.starred && <span className="text-[11px] text-yellow-400">★ Starred</span>}
        {row.done && <span className="text-[11px] text-green-400">Marked done</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {([
          { key: "star", label: "Star", Icon: Star },
          { key: "trash", label: "Trash", Icon: Trash2 },
          { key: "archive", label: "Archive", Icon: Archive },
          { key: "done", label: "Mark Done", Icon: CheckCircle2 },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onAction(key)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
