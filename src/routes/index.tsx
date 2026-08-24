import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { StageHero } from "@/components/inboxai/StageHero";
import { StageForm } from "@/components/inboxai/StageForm";
import { StageScript } from "@/components/inboxai/StageScript";
import { generateScript, type AgentSettings } from "@/lib/generateScript";
import { checkMyPurchase } from "@/lib/purchases.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InboxAI — Your Gmail inbox, managed by AI" },
      { name: "description", content: "A personal AI agent that lives inside your own Google account. Stars important emails, deletes spam, and unsubscribes you from forgotten newsletters." },
      { property: "og:title", content: "InboxAI — Your Gmail inbox, managed by AI" },
      { property: "og:description", content: "A personal AI agent that lives inside your own Google account. Stars important emails, deletes spam, and unsubscribes you from forgotten newsletters." },
    ],
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
    return () => { cancelled = true; };
  }, [user, check]);

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
      return "We could not verify your purchase. Please make sure you signed in with the same Google account you used to buy on Gumroad. If you need help email johntperales10@gmail.com";
    }
    setScript(generateScript(s));
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
            InboxAI purchase is on file for this email. Please buy access on Gumroad using this same
            email, or contact support if you already purchased.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <a
              href="https://johnperales.gumroad.com/l/xypgwz?wanted=true"
              className="gumroad-button w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
            >
              Buy now — $50
            </a>
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div key={stage} className="animate-in fade-in duration-500">
        {stage === 1 && <StageHero onStart={() => go(2)} />}
        {stage === 2 && <StageForm onBack={() => go(1)} onSubmit={handleBuild} userEmail={user?.email ?? null} />}
        {stage === 3 && <StageScript script={script} onBack={() => go(2)} />}
      </div>
    </main>
  );
}
