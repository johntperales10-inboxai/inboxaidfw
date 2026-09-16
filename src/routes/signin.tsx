import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — InboxAI" },
      { name: "description", content: "Sign in with Google to set up your InboxAI agent." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignInPage,
});

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C41.1 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function SignInPage() {
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSignInError(null);
    setSigningIn(true);
    try {
      // Direct Supabase Google OAuth — works identically on every origin
      // (lovable.app, inboxaidfw.com, vercel.app) as long as the origin's
      // /auth/callback URL is allow-listed in the auth redirect settings.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setSignInError(error.message || "Sign in failed. Please try again.");
        setSigningIn(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Sign in failed.");
      setSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur p-8 shadow-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-center">Set up your agent</h1>
          <p className="mt-3 text-center text-sm text-muted-foreground leading-relaxed">
            Sign in with the Google account you want your InboxAI agent to manage.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="mt-8 w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white text-[#1f1f1f] font-medium text-sm border border-[#dadce0] hover:bg-[#f8f9fa] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleLogo />
            {signingIn ? "Redirecting…" : "Sign in with Google"}
          </button>

          {signInError && (
            <p className="mt-3 text-center text-xs text-destructive">{signInError}</p>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Haven't purchased yet?{" "}
            <Link to="/" className="underline underline-offset-4 hover:text-primary">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
