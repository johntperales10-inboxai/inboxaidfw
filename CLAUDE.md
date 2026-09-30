# InboxAI — notes for Claude Code

InboxAI is a paid Gmail AI agent: a setup wizard that generates a Google Apps Script agent (Basic, $50) plus a Premium AI priority dashboard ($97).

- Stack: Lovable + TanStack Start + Supabase, deployed on Vercel.
- Live: https://inboxaidfw.com (custom domain on Vercel) and https://inboxaidfw.vercel.app
- Lovable auto-syncs to this GitHub repo; always `git pull` before editing.

## Deploy
```
git pull
git add <files> && git commit -m "..." && git push
vercel --prod
```

## Gotchas
- Local `npm run build` fails on Windows (a `@lovable.dev/mcp-js` path check). Typecheck with `npx tsc --noEmit`; Vercel builds fine on Linux.
- To preview locally anyway, run `npx vite dev --config <tmp config>` with a copy of vite.config.ts minus `mcpPlugin()` (don't commit it).
- The home page (stage 1) is `src/components/inboxai/Landing.tsx` + `landing.css`, scoped under `.ib-landing`. Its resets sit in `@layer base`, because unlayered CSS would beat Tailwind's layered utilities.
- After adding a route file, regenerate `src/routeTree.gen.ts` using `@tanstack/router-generator`, or tsc will fail.
- `vite.config.ts` must keep `nitro: { preset: "vercel" }` and keep `cloudflare:workers` as an external.
- This repo is public. Never hardcode discount codes, keys or secrets in client code. Stripe and Gumroad validate codes at checkout.

## Key files
- `src/lib/generateScript.ts`: the Gmail agent script template (Gemini model, trusted senders, reply commands, learned rules).
- `src/lib/checkout.functions.ts` + `src/lib/useCheckout.ts`: Stripe Checkout, falling back to Gumroad when Stripe env vars are missing.
- `src/routes/api/public/stripe-webhook.ts`, `gumroad-webhook.ts`: record purchases in the Supabase `purchases` table and never downgrade Premium.
- `src/lib/purchases.functions.ts`: `isPremiumUser` / `checkMyPremium`, enforced on the server by `dashboard.functions.ts`.

## Status (2026-09-29)
- Stripe code is shipped but inactive until these are set in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PREMIUM`, `STRIPE_WEBHOOK_SECRET`. Webhook URL: `/api/public/stripe-webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
- To do: turn off the old public Gumroad codes; activate Stripe; run a full QA pass on the reply-command system.
