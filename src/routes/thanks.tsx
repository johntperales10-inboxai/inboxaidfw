import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { getCheckoutSummary } from "@/lib/checkout.functions";
import { CONTACT_EMAIL } from "@/components/inboxai/LegalPage";

export const Route = createFileRoute("/thanks")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search["session_id"] === "string" ? (search["session_id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Thanks for buying InboxAI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThanksPage,
});

type Summary = { email: string | null; tier: "basic" | "premium"; paid: boolean } | null;

function ThanksPage() {
  const { session_id } = Route.useSearch();
  const summarize = useServerFn(getCheckoutSummary);
  const [summary, setSummary] = useState<Summary | "loading">(session_id ? "loading" : null);

  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;
    summarize({ data: { sessionId: session_id } })
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch(() => { if (!cancelled) setSummary(null); });
    return () => { cancelled = true; };
  }, [session_id, summarize]);

  const s = summary === "loading" ? null : summary;
  const tierName = s?.tier === "premium" ? "InboxAI Premium" : "InboxAI";

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card/80 p-8 shadow-2xl text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">You're all set!</h1>
        <p className="mt-3 text-muted-foreground">Thanks for buying {tierName}. Your receipt is on its way to your inbox.</p>

        {summary === "loading" && <p className="mt-6 text-sm text-muted-foreground">Looking up your purchase…</p>}

        {s?.email && (
          <div className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/30 text-sm text-left">
            <p className="text-foreground">
              Your purchase is linked to <strong className="break-all">{s.email}</strong>.
            </p>
            <p className="mt-2 text-muted-foreground">
              Next, sign in with the <strong>Google account for that email</strong> to build your agent. If that isn't a Google
              account, email {CONTACT_EMAIL} and we'll move your purchase over.
            </p>
          </div>
        )}

        {!s && summary !== "loading" && (
          <p className="mt-6 text-sm text-muted-foreground">
            Sign in with the Google account for the email you used at checkout to build your agent.
          </p>
        )}

        <Link
          to="/signin"
          className="mt-8 inline-flex w-full items-center justify-center px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          Sign in to set up →
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          It can take up to a minute for your purchase to register. If sign-in says it can't find it, wait a moment and try
          again.
        </p>
      </div>
    </main>
  );
}
