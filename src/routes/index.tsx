import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Landing } from "@/components/inboxai/Landing";
import landingCss from "@/components/inboxai/landing.css?url";
import { StageForm } from "@/components/inboxai/StageForm";
import { StageScript } from "@/components/inboxai/StageScript";
import { generateScript, type AgentSettings } from "@/lib/generateScript";
import { checkMyPurchase, checkMyPremium } from "@/lib/purchases.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InboxAI — Your Gmail inbox, managed by AI" },
      { name: "description", content: "A personal AI agent that lives inside your own Google account. Stars important emails, deletes spam, and unsubscribes you from forgotten newsletters." },
      { property: "og:title", content: "InboxAI — Your Gmail inbox, managed by AI" },
      { property: "og:description", content: "A personal AI agent that lives inside your own Google account. Stars important emails, deletes spam, and unsubscribes you from forgotten newsletters." },
    ],
    links: [{ rel: "stylesheet", href: landingCss }],
  }),
  component: Index,
});

type PurchaseState = "unknown" | "checking" | "verified" | "missing";

function Index() {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [script, setScript] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [purchase, setPurchase] = useState<PurchaseState>("unknown");
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  const navigate = useNavigate();
  const check = useServerFn(checkMyPurchase);
  const checkPremium = useServerFn(checkMyPremium);
  // Premium buyers get the Priority Inbox dashboard built into their script
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // When signed in, verify purchase server-side.
  useEffect(() => {
    if (!user) { setPurchase("unknown"); return; }
    let cancelled = false;
    setPurchase("checking");
    check()
      .then((r) => { if (!cancelled) setPurchase(r.hasPurchase ? "verified" : "missing"); })
      .catch(() => { if (!cancelled) setPurchase("missing"); });
    checkPremium()
      .then((r) => { if (!cancelled) setIsPremium(r.isPremium); })
      .catch(() => { if (!cancelled) setIsPremium(false); });
    return () => { cancelled = true; };
  }, [user, check, checkPremium]);

  // After OAuth redirect back, advance to stage 2 only if purchase is verified.
  useEffect(() => {
    if (user && purchase === "verified" && stage === 1 && !hasAutoAdvanced) {
      setHasAutoAdvanced(true);
      setStage(2);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [user, purchase, stage, hasAutoAdvanced]);

  const handleBuild = (s: AgentSettings): string | void => {
    if (purchase !== "verified") {
      return "We could not verify your purchase. Please make sure you signed in with the Google account for the email you used at checkout. If you need help, email inboxaidfw@gmail.com";
    }
    setScript(generateScript(s, { premium: isPremium }));
    setStage(3);
    window.scrollTo({ top: 0, behavior: "instant" });
  };


  const go = (s: 1 | 2 | 3) => {
    setStage(s);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setStage(1);
    setHasAutoAdvanced(false);
  };

  // Signed in but purchase not verified → block access to Stage 2/3.
  if (user && purchase === "missing") {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card/80 backdrop-blur p-8 shadow-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight">We couldn't find your purchase</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            You're signed in as <span className="font-medium text-foreground">{user.email}</span>, but no
            InboxAI purchase is on file for this email. Please buy access using this same
            email, or contact support if you already purchased.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={async () => {
                // Signing out swaps this screen for the landing page; then jump to its pricing
                await handleSignOut();
                setTimeout(() => document.getElementById("pricing")?.scrollIntoView(), 100);
              }}
              className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
            >
              See pricing
            </button>
            <button
              onClick={() => { void handleSignOut(); void navigate({ to: "/" }); }}
              className="w-full px-6 py-3 rounded-xl border border-border text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (user && purchase === "checking") {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying your purchase…</p>
      </main>
    );
  }

  // The landing page paints its own animated background, so it skips the app shell
  if (stage === 1) return <Landing />;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div key={stage} className="animate-in fade-in duration-500">
        {stage === 2 && <StageForm onBack={() => go(1)} onSubmit={handleBuild} userEmail={user?.email ?? null} />}
        {stage === 3 && <StageScript script={script} premium={isPremium} onBack={() => go(2)} />}
      </div>
    </main>
  );
}
