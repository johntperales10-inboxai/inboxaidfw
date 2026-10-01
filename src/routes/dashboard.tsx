import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkMyPremium } from "@/lib/purchases.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Priority Inbox — InboxAI Premium" },
      { name: "description", content: "Open your InboxAI Priority Inbox, which runs privately inside your own Google account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

// The dashboard itself is an Apps Script web app inside the customer's Google
// account. This page only remembers its address (in this browser) and opens it.
const STORAGE_KEY = "inboxai.dashboardUrl";
const WEB_APP_URL = /^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/exec\/?$/;

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function DashboardPage() {
  const navigate = useNavigate();
  const checkPremium = useServerFn(checkMyPremium);
  const [gate, setGate] = useState<"checking" | "ok">("checking");
  const [saved, setSaved] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        const s = readSaved();
        setSaved(s);
        setDraft(s);
        setGate("ok");
      } catch {
        if (!cancelled) void navigate({ to: "/premium", search: { upgrade: "required" } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkPremium, navigate]);

  const save = () => {
    const url = draft.trim();
    if (!WEB_APP_URL.test(url)) {
      setError("That doesn't look like a web app address. It should start with https://script.google.com/macros/s/ and end with /exec.");
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, url);
    } catch {
      /* private browsing: still usable for this visit */
    }
    setSaved(url);
    setError(null);
  };

  if (gate === "checking") {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking your Premium access…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">InboxAI Premium ✨</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Your Priority Inbox</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Every unread email scored 0–100 and sorted into what needs you now, today, this week, and what can wait.
        </p>

        <div className="mt-6 flex gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30 text-sm">
          <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
          <p className="text-foreground/90">
            Your Priority Inbox runs inside <strong>your own Google account</strong>, as part of your InboxAI script.
            Your email never passes through our servers.
          </p>
        </div>

        {saved ? (
          <div className="mt-10">
            <a
              href={saved}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/30"
            >
              Open my Priority Inbox <ExternalLink className="size-4" />
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">Opens in a new tab, signed in with your Google account.</p>
          </div>
        ) : null}

        <div className="mt-10 p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-lg font-semibold">{saved ? "Change your dashboard address" : "Connect your dashboard"}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Paste the <strong>Web app URL</strong> you got after deploying your script (Deploy → New deployment → Web app).
            It's saved in this browser only.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://script.google.com/macros/s/…/exec"
              className="flex-1 min-w-0 h-11 px-3 rounded-md bg-background border-2 border-border text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={save}
              className="h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
            >
              Save
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-6 p-6 rounded-2xl bg-card border border-border text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">Don't have a dashboard address yet?</p>
          <p className="mt-2">
            Build your Premium script on the <Link to="/" className="text-primary underline underline-offset-4">setup page</Link>,
            paste it into script.google.com, run <span className="font-mono text-primary">setupTrigger</span>, then follow the
            “Open your Priority Inbox” steps shown with your script.
          </p>
        </div>
      </div>
    </main>
  );
}
