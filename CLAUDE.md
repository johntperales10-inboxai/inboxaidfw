# InboxAI — notes for Claude Code

InboxAI is a paid Gmail AI agent: a setup wizard that generates a Google Apps Script agent (Basic, $4.99/month) plus a Premium AI priority dashboard ($9.99/month). Before Nov 2026 it was sold as a one-time purchase ($50 / $97); those buyers keep access.

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
- `src/lib/checkout.functions.ts` + `src/lib/useCheckout.ts`: Stripe Checkout in subscription mode. No Gumroad fallback any more; missing Stripe env vars show an error.
- `src/routes/api/public/stripe-webhook.ts`: records subscriptions in the Supabase `purchases` table (`raw.subscription_id`), switches tier on `customer.subscription.updated`, deletes the row on `customer.subscription.deleted`. `gumroad-webhook.ts` is kept only for old Gumroad sales.
- License check: `src/lib/license.server.ts` (HMAC of the email with `LICENSE_SECRET`), `/api/public/license`, and `licenseModule()` in `generateScript.ts`. Generated scripts check once a day and pause when the subscription ends; they fail open if the site is unreachable. Never rotate `LICENSE_SECRET` (it would pause every customer). The check lives in the customer's own editable script, so it deters casual reuse but can be removed by someone determined.
- `BILLING_PORTAL_URL` in `src/lib/features.ts`: Stripe no-code customer portal link behind the "Manage subscription" links.
- `src/lib/purchases.functions.ts`: `isPremiumUser` / `checkMyPremium`, enforced on the server by `dashboard.functions.ts`.

## Status (2026-11-23)
- Premium is on sale. Its dashboard runs as an Apps Script web app inside the customer’s own Google account (`src/lib/appsScript/`), gated by `PREMIUM_ON_SALE` in `src/lib/features.ts`.
- Stripe live mode is active (owner reported the account enabled on 2026-10-18). Products, the webhook at `/api/public/stripe-webhook` and env vars are set in Vercel.
- Monthly subscriptions went live on 2026-11-23 (recurring prices in `STRIPE_PRICE_BASIC` / `STRIPE_PRICE_PREMIUM`, `LICENSE_SECRET` set in Vercel). The license check calls `www.inboxaidfw.com`, because the apex domain 308-redirects. Still to confirm: subscription events on the Stripe webhook, and a real paid subscribe, cancel and refund test by the owner.
- A customer setup guide PDF lives at `public/inboxai-setup-guide.pdf` (source: `docs/setup-guide.html`), linked from the Thanks page and the script page.
- The Supabase CLI now requires `--read-only` for read queries run by an agent (writes need explicit owner confirmation).
- A read-only uptime check runs every 2 hours on GitHub Actions (`.github/workflows/health-check.yml`); a failed run emails the repo owner. GitHub pauses scheduled workflows after 60 days without repo activity.
- No emojis in site copy (removed 2026-10-14; a light-blue scroll-animation restyle was tried on branch `restyle-light-blue` and rejected).
- Known bug: `notificationFrequency: "daily"` in `generateScript.ts` only emails during the 8 AM hourly run, so it isn't a real daily summary, and "needs your attention" alerts from other hours are dropped. The fix is to collect actions and flags in PropertiesService and send one combined 8 AM email.
- To do: fix the daily-summary bug above; unpublish the Gumroad products and turn off the old Gumroad codes; full QA pass on the reply-command system.
- Marketing (2026-11-23): short-form video plan started, 11 vertical videos posting Nov 25 to Dec 19 (TikTok, Reels, Shorts), month review on Dec 20. Scripts and schedule are kept outside the repo. First video posted early to Instagram and TikTok on 2026-11-24.
