# InboxAI — notes for Claude Code

InboxAI is a paid Gmail AI agent: a setup wizard that generates a Google Apps Script agent (Basic, $50) plus a Premium AI priority dashboard ($97).

- Stack: Lovable + TanStack Start + Supabase, deployed on Vercel.
- Live: https://inboxaidfw.com (custom domain on Vercel) and https://inboxaidfw.vercel.app
- Lovable auto-syncs to this GitHub repo; always `git pull` before editing.

## Deploy
```
git pull
git add <files> && git commit -m "..." && git push   # Vercel auto-deploys main
```

## Database
- Production (www.inboxaidfw.com on Vercel) uses Supabase project `marysqnxyqjcgrnnxgyx` (Google sign-in is configured there). Vercel env vars point at it.
- `supabase/config.toml` and the committed `.env` still name the Lovable project `ukhdsaxoqgoeqwaioxir`, which only the lovable.app preview uses.
- Apply new migrations to production with `npx supabase db query --linked --project-ref marysqnxyqjcgrnnxgyx -f <file>`.

## Gotchas
- Local `npm run build` fails on Windows (a `@lovable.dev/mcp-js` path check). Typecheck with `npx tsc --noEmit`; Vercel builds fine on Linux.
- To preview locally anyway, run `npx vite dev --config <tmp config>` with a copy of vite.config.ts minus `mcpPlugin()` (don't commit it).
- The home page (stage 1) is `src/components/inboxai/Landing.tsx` + `landing.css`, scoped under `.ib-landing`. Its resets sit in `@layer base`, because unlayered CSS would beat Tailwind's layered utilities.
- After adding a route file, regenerate `src/routeTree.gen.ts` using `@tanstack/router-generator`, or tsc will fail.
- `vite.config.ts` must keep `nitro: { preset: "vercel" }` and keep `cloudflare:workers` as an external.
- No emojis in website copy, labels or decorative icons (the owner says they make the site look fake). Plain UI symbols like ★, ✓, ☰ and arrows are fine.
- This repo is public. Never hardcode discount codes, keys or secrets in client code. Stripe and Gumroad validate codes at checkout.

## Key files
- `src/lib/generateScript.ts`: the Gmail agent script template (Gemini model, trusted senders, reply commands, learned rules).
- `src/lib/checkout.functions.ts` + `src/lib/useCheckout.ts`: Stripe Checkout, falling back to Gumroad when Stripe env vars are missing.
- `src/routes/api/public/stripe-webhook.ts`, `gumroad-webhook.ts`: record purchases in the Supabase `purchases` table and never downgrade Premium.
- `src/lib/purchases.functions.ts`: `isPremiumUser` / `checkMyPremium`, enforced on the server by `dashboard.functions.ts`.

## Status (2026-11-04)
- Premium is on sale. Its dashboard runs as an Apps Script web app inside the customer’s own Google account (`src/lib/appsScript/`), gated by `PREMIUM_ON_SALE` in `src/lib/features.ts`.
- Stripe live mode is active (owner reported the account enabled on 2026-10-18). Products, the webhook at `/api/public/stripe-webhook` and env vars are set in Vercel. Gumroad stays as an automatic fallback if Stripe checkout fails.
- A customer setup guide PDF lives at `public/inboxai-setup-guide.pdf` (source: `docs/setup-guide.html`), linked from the Thanks page and the script page.
- The Supabase CLI now requires `--read-only` for read queries run by an agent (writes need explicit owner confirmation).
- A read-only uptime check runs every 2 hours on GitHub Actions (`.github/workflows/health-check.yml`); a failed run emails the repo owner. GitHub pauses scheduled workflows after 60 days without repo activity.
- To do: reduce the restricted Stripe API key to the minimum permissions; turn off the old public Gumroad codes; full QA pass on the reply-command system.
