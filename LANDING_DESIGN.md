# InboxAI Landing Page — Design Notes

Last updated: 2026-10-14

This file captures design decisions, in-progress work, and context for the landing page
(`src/components/inboxai/Landing.tsx` + `src/components/inboxai/landing.css`).
Read it alongside CLAUDE.md before making any visual changes to the landing page.

---

## Architecture overview

### Key files
- **`src/components/inboxai/Landing.tsx`** (359 lines) — React component with:
  - `useOrbCanvas()` hook: 7 sinusoidal blue orbs, `screen` globalCompositeOperation, drawn on a `position: fixed; z-index: -1` canvas. This is the animated backdrop behind every section.
  - `useCheckout('basic')` and `useCheckout('premium')` — real Stripe/Gumroad checkout hooks
  - `PREMIUM_ON_SALE` flag gates the premium button
  - Tiles data array alternating `tile-dark`, `tile-white`, `tile-black`, `tile-light` class names

- **`src/components/inboxai/landing.css`** (398 lines) — All styles scoped under `.ib-landing`
  - Resets live in `@layer base` (required so unlayered CSS doesn't beat Tailwind's layered utilities)
  - Canvas: `.ib-canvas { position: fixed; inset: 0; z-index: -1; pointer-events: none; }`

### CSS token system (current)
```css
--bg:      rgba(20,58,148,.86)
--surface: rgba(13,44,120,.84)
--text:    #ddeeff
--blue:    #7ed4ff
--blue-bright: #2997ff
```

### Section background classes (current palette)
```css
.tile-dark    { background: rgba(6,10,26,.78);   border-top: 1px solid rgba(38,58,120,.3); }
.tile-white   { background: var(--bg);           border-top: 1px solid var(--border); }
.tile-black   { background: rgba(0,3,12,.88);    border-top: 1px solid rgba(38,58,120,.2); }
.tile-light   { background: var(--surface);      border-top: 1px solid var(--border); }
.problem-section { background: rgba(0,3,12,.88); border-top: ... }
.setup-section   { background: var(--surface);   border-top: ... }
.pricing-section { background: var(--bg);        border-top: ... }
.faq-section     { background: rgba(6,10,26,.78);border-top: ... }
```

---

## Design problem: rigid section transitions

### Root cause
Sections currently use hard `border-top: 1px solid` dividers and switch abruptly between
different solid `rgba()` background colors. The fixed canvas orb animation is invisible at
section boundaries — sections cover it completely — so there is no visual bridge between them.

### Solution: gradient bleed technique
Replace solid section backgrounds with a `linear-gradient` that fades to `transparent` at
the top and bottom edges (96px fade zone). The fixed canvas shows through in those 96px gaps
between sections, acting as connective tissue that dissolves one section into the next.

```css
/* Pattern for any section */
.some-section {
  border-top: none; /* remove hard line */
  padding-block: 108px; /* extra padding so content clears the fade zone */
  background: linear-gradient(to bottom,
    transparent 0,
    rgba(R,G,B,A) 96px,
    rgba(R,G,B,A) calc(100% - 96px),
    transparent 100%
  );
}
```

The 96px fade zone and 108px padding-block are a matched pair — adjust both together if
you want a longer or shorter blend.

---

## Color palette options (decision pending as of 2026-10-14)

A live interactive demo is at: https://claude.ai/artifact/7HTU5RTmPEQFGbsG9LKgzT
Toggle between **Current**, **Dark Blue**, and **Light Blue** to compare.
Demo file on disk: `/tmp/claude-0/-home-claude-inboxaidfw/7d1c2100-ff36-51bf-add9-7b9e26adffa1/scratchpad/transitions-demo.html`

### Option A — Dark Blue (monochromatic navy)
Five close-but-distinct deep-navy shades all in the same color family.
Gradient bleed at edges. Canvas orb animation visible between sections.
Text stays light (no changes needed).

```css
/* Example shades used in the demo */
s-s1: rgba(5,10,32,.90)
s-s2: rgba(7,15,50,.87)
s-s3: rgba(3,7,22,.93)
s-s4: rgba(6,14,46,.88)
s-s5: rgba(4,9,28,.91)
```

Apply to the real site:
1. In `landing.css`, replace all `.tile-dark`, `.tile-white`, `.tile-black`, `.tile-light`,
   `.problem-section`, `.setup-section`, `.pricing-section`, `.faq-section` backgrounds with
   the gradient-bleed pattern using the shades above.
2. Remove all `border-top` lines from those sections.
3. Add `padding-block: 108px` to each.
4. No text color changes needed (dark backgrounds, light text already works).

### Option B — Light Blue (soft periwinkle)
Five soft sky-blue/periwinkle shades. Gradient bleed at edges. Body background `#c8dcf5`.
Canvas orbs glow through at section edges (creates a dark halo effect where canvas meets
light sections — looks intentional and interesting).
**Text must flip dark** for readability on light backgrounds.

```css
/* Body background */
background: #c8dcf5;

/* Example section shades */
s-s1: rgba(205,225,255,.93)
s-s2: rgba(188,214,255,.91)
s-s3: rgba(215,232,255,.94)
s-s4: rgba(196,220,255,.92)
s-s5: rgba(208,228,255,.93)

/* Text overrides required */
.eyebrow, .tile-eye          { color: #1565c0; }
.hero-h, .tile-h, .prob-h,
.prob-title, .nav-logo       { color: #0a1830; }
.hero-p, .tile-p, .prob-body { color: #2a4468; }
.nav-links a                 { color: #3a6090; }
.ib-nav                      { background: rgba(180,210,255,.82); }
.prob-card                   { background: rgba(160,200,255,.32); border-color: rgba(100,160,230,.45); }
.btn-pill                    { background: #1565c0; }
```

Apply to the real site:
1. Same gradient-bleed swap as Option A, but with the light-blue rgba values.
2. Add body background override under `.ib-landing` or set it directly in `Landing.tsx`.
3. Apply all text color overrides listed above.

---

## Scroll reveal animation (not yet applied to real site)

An `IntersectionObserver`-based scroll reveal was explored. Pattern:

```css
.rv-hidden { opacity: 0; transform: translateY(28px); transition: opacity .55s ease, transform .55s ease; }
.rv-show   { opacity: 1; transform: none; }
```

```js
const io = new IntersectionObserver(
  entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.replace('rv-hidden','rv-show'); }),
  { threshold: 0.12 }
);
document.querySelectorAll('.s-inner').forEach(el => { el.classList.add('rv-hidden'); io.observe(el); });
```

Decision: hold off until palette is decided. Can be layered on top of either color option
without conflict — it only affects opacity/transform, not backgrounds.

---

## Remaining to-dos (from CLAUDE.md + this session)

### Design (blocked on Jonathan's palette decision)
- [ ] Choose Dark Blue or Light Blue direction from the demo
- [ ] Apply chosen palette + gradient-bleed to `landing.css`
- [ ] Optionally add scroll reveal on top

### Commercial / backend (from CLAUDE.md)
- [ ] Set Vercel env vars to activate Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_BASIC`
  - `STRIPE_PRICE_PREMIUM`
  - `STRIPE_WEBHOOK_SECRET`
  - Webhook URL: `/api/public/stripe-webhook`
  - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- [ ] Turn off old public Gumroad codes once Stripe is live
- [ ] Full QA pass on the reply-command system

---

## How the Gmail agent script works (for reference)

The agent lives in `src/lib/generateScript.ts`. It generates a Google Apps Script that:
- Runs inside the user's own Google account (no external server)
- Stars emails from trusted senders the user defines
- Deletes spam on an hourly trigger
- Unsubscribes from newsletters automatically
- Emails the user when it finds something it can't categorize
- Uses Gemini (via Apps Script's AI features) for classification
- Accepts reply commands: user replies to an agent email with a command, agent reads
  and updates its learned rules accordingly

The agent cannot run as a feature inside Gmail itself (like a sidebar or panel) because
Google Workspace add-ons are restricted on personal Gmail accounts without Google Workspace
Business licensing. The Apps Script + trigger approach is the correct architecture for
personal Gmail — it runs on Google's servers as a background job tied to the user's account.

The Premium tier ($97) adds an AI priority dashboard at `/dashboard` — a web UI showing
inbox state, recent AI decisions, and rule management. It is enforced server-side in
`src/lib/purchases.functions.ts` (`isPremiumUser` / `checkMyPremium`) and
`src/routes/dashboard.functions.ts`.
