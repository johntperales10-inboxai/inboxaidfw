import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Reviews } from "./Reviews";
import { useCheckout } from "@/lib/useCheckout";
import { PREMIUM_ON_SALE } from "@/lib/features";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Setup", href: "#setup" },
];

const inboxRows = [
  { starred: true, sender: "Mom", subject: "Don't forget dinner Sunday — we're having...", badge: "star", label: "Trusted" },
  { starred: true, sender: "Coach Rivera", subject: "Practice schedule update for next week", badge: "star", label: "Trusted" },
  { starred: false, sender: "LinkedIn", subject: "You have 14 new connection requests waiting...", badge: "news", label: "Newsletter" },
  { starred: false, sender: "no-reply@promo", subject: "🔥 LAST CHANCE 80% off everything ends at...", badge: "spam", label: "Spam" },
  { starred: true, sender: "Jake", subject: "Hey are you coming to the game Friday night?", badge: "star", label: "Trusted" },
];

const tiles = [
  { tone: "tile-dark", eyebrow: "Stars important emails", title: ["The people who matter", "always rise to the top."], body: "Tell the AI who you trust. It learns your network and makes sure every email from a real person in your life gets starred and stays visible.", icon: "⭐" },
  { tone: "tile-white", eyebrow: "Clears spam automatically", title: ["Spam gone", "every hour. On the dot."], body: "AI reads and categorizes every incoming email. Anything it identifies as spam disappears — quietly, automatically, every 60 minutes. You never see it.", icon: "🗑" },
  { tone: "tile-black", eyebrow: "Unsubscribes for you", title: ["Newsletters you forgot", "you signed up for."], body: "The ones piling up from three years ago. The brand you bought from once. The AI finds them and unsubscribes — no action required from you.", icon: "📭" },
  { tone: "tile-light", eyebrow: "Email alerts when unsure", title: ["It asks when", "it needs you."], body: "When the AI finds something it can't confidently categorize, it emails you directly. You decide. It learns. Gets smarter every time.", icon: "🔔" },
];

const problems = [
  { icon: "😤", title: "Real emails get buried", body: "A message from a friend, a teacher, someone who matters — gone under 40 promotional emails you never asked for." },
  { icon: "🤯", title: "Spam never stops", body: "You delete it, it comes back. You unsubscribe, three more replace it. The inbox was not designed to fight this for you." },
  { icon: "⏳", title: "You do it manually", body: "Sorting, starring, unsubscribing — all of it on you, all of it taking time away from things that actually matter." },
];

const steps = [
  { n: "01", title: "Tell it who matters", body: "Add the names and email addresses of people you actually care about. Family, friends, teachers, teammates." },
  { n: "02", title: "Set your preferences", body: "Choose how often you want alerts, what kind of emails to clear automatically, and how aggressive the spam filter runs." },
  { n: "03", title: "It runs itself", body: "From here, the AI handles everything. Checks hourly, stars what matters, clears the rest. No further input needed." },
];

const basicFeatures = [
  "AI reads and categorizes every email",
  "Stars emails from people you trust",
  "Clears spam every hour",
  "Unsubscribes from forgotten newsletters",
  "Email alerts when it needs your input",
  "Runs inside your Google account — private",
  "Step by step setup guide included",
];

const premiumFeatures = [
  "Everything in Basic",
  "AI importance scores for every email",
  "Priority Dashboard — 6 intelligent sections",
  "Real person detection",
  "Deadline alerts",
  "Full inbox organized by importance",
];

const faqs = [
  { q: "Doesn't Google already do this?", a: "Gmail has basic filters you set up manually — you write the rules, you maintain them, and they never learn. InboxAI reads and understands every email, makes decisions automatically, gets smarter from your answers, and runs itself every hour. Gmail gives you a filing cabinet. InboxAI gives you a personal assistant." },
  { q: "Is my email safe?", a: "Yes. The agent runs entirely inside your own Google account — nobody else ever sees your emails. You can revoke access any time from your Google account settings." },
  { q: "Do I need to know how to code?", a: "No. The setup wizard builds your custom script automatically. You copy and paste it into one place and click run. The whole process takes about 5 minutes." },
  { q: "What if the agent makes a mistake?", a: "The agent never permanently deletes anything. Trashed emails stay in your trash for 30 days so you can always recover them. And if it's unsure about something, it asks you first rather than guessing." },
  { q: "What happens after I pay?", a: "Come back to this page and click “Sign in to set up” using the same Google account you bought with. You'll fill out a short form, copy your custom script, and follow the steps. Most people are up and running in under 10 minutes." },
  { q: "Can I stop it whenever I want?", a: "Yes. You can pause it instantly by running one function, or fully remove all access from your Google account settings." },
];

// Drifting blue orbs blended with "screen" so overlaps glow brighter.
const orbs = [
  { bx: 0.2, by: 0.3, r: 0.55, rgb: [0, 51, 170], fx: 0.4, fy: 0.45, px: 0, py: 1.1, pr: 1.4, pp: 0 },
  { bx: 0.8, by: 0.2, r: 0.45, rgb: [0, 136, 255], fx: 0.55, fy: 0.38, px: 2.1, py: 0.5, pr: 1.0, pp: 2.4 },
  { bx: 0.5, by: 0.7, r: 0.62, rgb: [0, 20, 68], fx: 0.32, fy: 0.58, px: 1.0, py: 3.1, pr: 1.2, pp: 1.2 },
  { bx: 0.3, by: 0.5, r: 0.4, rgb: [0, 200, 255], fx: 0.62, fy: 0.44, px: 3.5, py: 0.8, pr: 1.6, pp: 4.0 },
  { bx: 0.72, by: 0.62, r: 0.5, rgb: [60, 0, 210], fx: 0.47, fy: 0.65, px: 0.8, py: 2.2, pr: 0.8, pp: 0.5 },
  { bx: 0.6, by: 0.1, r: 0.38, rgb: [0, 85, 221], fx: 0.71, fy: 0.36, px: 4.2, py: 1.5, pr: 1.8, pp: 3.3 },
  { bx: 0.1, by: 0.82, r: 0.44, rgb: [0, 180, 255], fx: 0.38, fy: 0.7, px: 1.8, py: 4.4, pr: 1.2, pp: 1.8 },
];

function useOrbCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const draw = (ts: number) => {
      const t = ts * 0.001;
      const W = canvas.width, H = canvas.height, D = Math.max(W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000a14";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "screen";
      for (const o of orbs) {
        const x = (o.bx + 0.35 * Math.sin(t * o.fx + o.px)) * W;
        const y = (o.by + 0.35 * Math.cos(t * o.fy + o.py)) * H;
        const r = (o.r + 0.06 * Math.sin(t * o.pr * 0.4 + o.pp)) * D;
        const [R, G, B] = o.rgb;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${R},${G},${B},0.78)`);
        g.addColorStop(0.4, `rgba(${R},${G},${B},0.36)`);
        g.addColorStop(0.75, `rgba(${R},${G},${B},0.12)`);
        g.addColorStop(1, `rgba(${R},${G},${B},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = "source-over";
      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    resize();
    const onResize = () => {
      resize();
      if (reduceMotion) draw(0);
    };
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return ref;
}

export function Landing() {
  const canvasRef = useOrbCanvas();
  const [menuOpen, setMenuOpen] = useState(false);
  const basic = useCheckout("basic");
  const premium = useCheckout("premium");
  // One code field drives both buy buttons; the basic hook owns its state
  const code = basic.appliedCode;
  const codeError = basic.codeError ?? premium.codeError;

  const buyBasic = () => void basic.buy(code);
  const buyPremium = () => void premium.buy(code);
  const basicLabel = basic.busy ? "Opening checkout…" : "Buy now — $50";
  const premiumLabel = premium.busy ? "Opening checkout…" : "Buy Premium — $97";

  return (
    <div className="ib-landing">
      <canvas ref={canvasRef} className="ib-canvas" aria-hidden="true" />

      <nav className="ib-nav" aria-label="Main">
        <div className="nav-inner">
          <a className="nav-logo" href="#top">InboxAI.</a>
          <ul className="nav-links">
            {navLinks.map((l) => (
              <li key={l.href}><a href={l.href}>{l.label}</a></li>
            ))}
            <li><Link to="/signin">Sign in</Link></li>
          </ul>
          <div className="nav-right">
            <a className="nav-premium" href="#pricing">Premium ✨</a>
            <button
              type="button"
              className="nav-burger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="ib-mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="ib-mobile-menu" className="nav-mobile">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
            ))}
            <Link to="/signin" onClick={() => setMenuOpen(false)}>Sign in</Link>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Premium ✨</a>
          </div>
        )}
      </nav>

      <section className="hero" id="top">
        <p className="eyebrow">No coding required · Runs inside your Google account</p>
        <h1 className="hero-headline">Your Gmail inbox,<br />managed by AI.</h1>
        <p className="hero-sub">
          A personal AI agent that lives inside your own Google account. It stars emails from people you care about,
          deletes spam, unsubscribes from newsletters you've forgotten about, and emails you when it finds something
          it's not sure about.
        </p>
        <p className="hero-tagline">One time payment · No subscription · No recurring charges. Ever.</p>
        <div className="cta-row">
          <button type="button" className="btn-pill" onClick={buyBasic} disabled={basic.busy}>{basicLabel}</button>
          <Link className="btn-link" to="/signin">Sign in to set up</Link>
        </div>

        <div className="inbox-art" aria-hidden="true">
          <div className="inbox-bar">
            <div className="inbox-dot" style={{ background: "#ff5f57" }} />
            <div className="inbox-dot" style={{ background: "#febc2e" }} />
            <div className="inbox-dot" style={{ background: "#28c840" }} />
            <span className="inbox-title">Gmail — Primary</span>
          </div>
          <div className="inbox-rows">
            {inboxRows.map((r) => (
              <div className="inbox-row" key={r.sender}>
                <span className={r.starred ? "inbox-star" : "inbox-star-empty"}>{r.starred ? "★" : "☆"}</span>
                <span className="inbox-sender">{r.sender}</span>
                <span className="inbox-subject">{r.subject}</span>
                <span className={`inbox-badge badge-${r.badge}`}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {tiles.map((t, i) => (
        <section key={t.eyebrow} id={i === 0 ? "features" : undefined} className={`tile ${t.tone}`}>
          <div className="tile-inner">
            <p className="tile-eyebrow">{t.eyebrow}</p>
            <h2 className="tile-headline">{t.title[0]}<br />{t.title[1]}</h2>
            <p className="tile-body">{t.body}</p>
            <div className="tile-links"><a href="#setup">Learn more</a></div>
            <span className="tile-icon" aria-hidden="true">{t.icon}</span>
          </div>
        </section>
      ))}

      <section className="problem-section">
        <div className="problem-inner">
          <h2 className="problem-headline">Your inbox is working<br />against you.</h2>
          <div className="problem-grid">
            {problems.map((p) => (
              <div className="problem-card" key={p.title}>
                <span className="problem-icon" aria-hidden="true">{p.icon}</span>
                <h3 className="problem-title">{p.title}</h3>
                <p className="problem-body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="setup-section" id="setup">
        <div className="setup-inner">
          <p className="section-eyebrow">Setup</p>
          <h2 className="section-title">Set it up once.<br />Let it run forever.</h2>
          <div className="step-grid">
            {steps.map((s) => (
              <div className="step-card" key={s.n}>
                <div className="step-num">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="pricing-inner">
          <p className="section-eyebrow center">Pricing</p>
          <h2 className="section-title center">One time. No subscriptions.<br />No recurring charges. Ever.</h2>
          <div className="pricing-grid">
            <div className="pricing-card pricing-basic">
              <p className="pricing-label">Basic</p>
              <div className="pricing-price">$50</div>
              <p className="pricing-once">One time payment</p>
              <ul className="pricing-features">
                {basicFeatures.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button type="button" className="btn-pill-outline" onClick={buyBasic} disabled={basic.busy}>{basicLabel}</button>
              <p className="pricing-note">No subscription. No recurring charges. Ever.</p>
            </div>
            <div className="pricing-card pricing-premium">
              <p className="pricing-label">Premium ✨{!PREMIUM_ON_SALE && " · Coming soon"}</p>
              <div className="pricing-price">$97</div>
              <p className="pricing-once">One time payment</p>
              <ul className="pricing-features">
                {premiumFeatures.map((f) => <li key={f}>{f}</li>)}
              </ul>
              {PREMIUM_ON_SALE ? (
                <>
                  <button type="button" className="btn-pill-dark" onClick={buyPremium} disabled={premium.busy}>{premiumLabel}</button>
                  <p className="pricing-note">
                    No subscription. No recurring charges. Ever. ·{" "}
                    <Link to="/premium" search={{ upgrade: undefined }}>See all Premium features ›</Link>
                  </p>
                </>
              ) : (
                <>
                  <button type="button" className="btn-pill-dark" disabled>Coming soon</button>
                  <p className="pricing-note">
                    The Priority Dashboard is moving into your own Google account for extra privacy. Questions?{" "}
                    <a href="mailto:inboxaidfw@gmail.com">inboxaidfw@gmail.com</a>
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="code-box">
            <label htmlFor="ib-code">Have a discount code?</label>
            <div className="code-row">
              <input
                id="ib-code"
                type="text"
                value={basic.discountCode}
                onChange={(e) => basic.onCodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    basic.applyCode();
                  }
                }}
                placeholder="Enter code"
                autoComplete="off"
              />
              <button type="button" onClick={basic.applyCode}>Apply</button>
            </div>
            {code && !codeError && <p className="code-ok">✓ Code {code} will be applied at checkout.</p>}
            {codeError && <p className="code-err">{codeError}</p>}
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <p className="section-eyebrow center">FAQ</p>
          <h2 className="section-title center">Common questions</h2>
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="reviews-wrap" id="reviews">
        <Reviews />
      </div>

      <footer>
        <div className="footer-inner">
          <p className="footer-text">
            InboxAI — Gmail AI automation · Keller, TX<br />
            Questions? <a href="mailto:inboxaidfw@gmail.com">inboxaidfw@gmail.com</a><br />
            <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link><br />
            Copyright © 2026 InboxAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
