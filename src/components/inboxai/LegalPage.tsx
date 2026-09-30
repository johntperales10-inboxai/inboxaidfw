import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export const CONTACT_EMAIL = "inboxaidfw@gmail.com";

// Shared layout for /privacy and /terms (Google's OAuth consent screen links to both).
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-20">
      <article className="max-w-3xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary">
          ← Back to InboxAI
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/90 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_p+p]:mt-3 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
          {children}
        </div>
        <p className="mt-16 text-sm text-muted-foreground">
          Questions? Email <a className="text-primary underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </article>
    </main>
  );
}
