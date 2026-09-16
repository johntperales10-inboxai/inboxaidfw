import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — InboxAI" },
      { name: "description", content: "Completing your Google sign in for InboxAI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // The Supabase client auto-detects the session in the URL (code / hash tokens).
      // Give it a chance to complete, then confirm before leaving this page.
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        void navigate({ to: "/", replace: true });
        return;
      }
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      setError("We couldn't complete your sign in. Please try again.");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) {
        void navigate({ to: "/", replace: true });
      }
    });

    const timer = setTimeout(() => void finish(), 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="text-center">
        {error ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Sign in didn't complete</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <a
              href="/signin"
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm"
            >
              Try again
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        )}
      </div>
    </main>
  );
}
