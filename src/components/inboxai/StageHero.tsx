import { useState } from "react";
import { Star, Trash2, Mail, MessageSquare, Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@tanstack/react-router";

const BASE_GUMROAD_URL = "https://johntperales.gumroad.com/l/xypgwz";
const VALID_CODES = new Set(["FREEACCESS"]);

interface Props {
  onStart: () => void;
}

const features = [
  { icon: Star, title: "Stars important emails", desc: "AI reads every email and decides if it's from a real person who matters to you." },
  { icon: Trash2, title: "Clears spam automatically", desc: "Empties your spam folder into trash so it never piles up again." },
  { icon: Mail, title: "Unsubscribes for you", desc: "Finds newsletters you haven't opened in months and unsubscribes automatically." },
  { icon: MessageSquare, title: "Texts you when unsure", desc: "Never guesses. Sends you a Telegram message when it needs your input." },
];

const problems = [
  { emoji: "📧", title: "Important emails get buried", desc: "Emails from people you actually care about disappear under a pile of newsletters and promotions you never asked for." },
  { emoji: "🗑️", title: "Spam never stops", desc: "You clean it out, it comes back. Every single day. It's a never ending battle you didn't sign up for." },
  { emoji: "😮‍💨", title: "You're still subscribed to everything", desc: "That newsletter from 2021? Still arriving every Tuesday. You've just learned to ignore it — but it's still eating your time." },
];

const steps = [
  { n: "1", title: "Tell it who matters", desc: "Add the email addresses of people you always want to hear from. Family, your boss, close friends." },
  { n: "2", title: "Set your preferences", desc: "Choose how aggressive you want it to be with spam and newsletters. Takes 2 minutes." },
  { n: "3", title: "It runs itself", desc: "The agent works in the background every hour. You only hear from it when it needs your input." },
];

const faqs = [
  { q: "Is my email safe?", a: "Yes. The agent runs entirely inside your own Google account — nobody else ever sees your emails. It's like hiring an assistant who already works at Google. You can revoke access any time from your Google account settings." },
  { q: "Do I need to know how to code?", a: "No. The setup wizard builds your custom script automatically. You just copy and paste it into one place and click run. The whole process takes about 5 minutes." },
  { q: "What if the agent makes a mistake?", a: "The agent never permanently deletes anything. Trashed emails stay in your trash for 30 days so you can always recover them. And if it's unsure about something it asks you first rather than guessing." },
  { q: "Does it work with any Gmail account?", a: "Yes — any personal Gmail account or Google Workspace account works." },
  { q: "What happens after I pay?", a: "You get a step by step setup guide immediately after payment. Then come back to this page, fill out the form, copy your custom script, and follow the guide. Most people are up and running in under 10 minutes." },
  { q: "Can I stop it whenever I want?", a: "Yes. You can pause it instantly by running one function, or fully remove all access from your Google account settings. You are always in complete control." },
  { q: "Is this really a one time payment?", a: "Yes. $50 once, yours forever. No monthly fees, no subscriptions, no surprises." },
];

const included = [
  "AI reads and categorizes every email automatically",
  "Stars emails from people you trust",
  "Clears spam every hour",
  "Unsubscribes from newsletters you've forgotten",
  "Telegram or email alerts when it needs your input",
  "Runs inside your own Google account — completely private",
  "Step by step setup guide included",
];



export function StageHero({ onStart: _onStart }: Props) {
  const [discountCode, setDiscountCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleApplyCode = () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;
    if (VALID_CODES.has(code)) {
      setAppliedCode(code);
      setCodeError(null);
    } else {
      setAppliedCode(null);
      setCodeError("Invalid code — try again");
    }
  };

  const buyUrl = appliedCode
    ? `${BASE_GUMROAD_URL}/${appliedCode}?wanted=true`
    : `${BASE_GUMROAD_URL}?wanted=true`;
  const buyLabel = appliedCode ? "Claim free access" : "Buy now — $50";

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Free · No coding required · Runs inside your Google account
          </span>
        </div>

        <h1 className="text-center text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          Your Gmail inbox,<br />
          <span className="text-primary">managed by AI</span>
        </h1>

        <p className="mt-8 text-center text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A personal AI agent that lives inside your own Google account. It stars emails from people you care about, deletes spam, unsubscribes from newsletters you've forgotten about, and texts you when it finds something it's not sure about.
        </p>

        <div className="mt-16 flex justify-center">
          <div className="relative w-full max-w-md">
            <div aria-hidden className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/40 via-primary/10 to-transparent blur-xl opacity-60" />
            <div className="relative rounded-3xl border border-primary/30 bg-card/80 backdrop-blur p-8 shadow-2xl shadow-primary/10">
              <div className="flex justify-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
                  One time payment
                </span>
              </div>

              <div className="mt-6 flex items-baseline justify-center gap-1">
                <span className="text-6xl font-bold tracking-tight">$50</span>
              </div>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                No subscription. No recurring charges. Ever.
              </p>

              <ul className="mt-8 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 size-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Check className="size-3 text-primary" />
                    </span>
                    <span className="text-foreground/90 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              {appliedCode && (
                <div className="mt-8 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
                  ✓ Discount applied — your order is free!
                </div>
              )}

              <a
                href={buyUrl}
                className={`gumroad-button ${appliedCode ? "mt-3" : "mt-8"} w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/30`}
              >
                {buyLabel}
              </a>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                After payment, return to this page to set up your agent.
              </p>

              {/* Discount code */}
              <div className="mt-6 pt-5 border-t border-border/50">
                <label className="block text-xs text-muted-foreground mb-2">
                  Have a discount code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      if (codeError) setCodeError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCode();
                      }
                    }}
                    placeholder="Enter code"
                    className="flex-1 min-w-0 px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCode}
                    className="px-4 py-2 rounded-md border border-border bg-card text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {codeError && (
                  <p className="mt-2 text-xs text-red-400">{codeError}</p>
                )}
              </div>


            </div>
          </div>
        </div>


        {/* Problem section */}
        <div className="mt-24">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight">
            Your inbox is working against you
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {problems.map((p) => (
              <div key={p.title} className="p-6 rounded-2xl bg-card border border-border">
                <div className="text-3xl mb-4">{p.emoji}</div>
                <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight">
            Set it up once. Let it run forever.
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="p-6 rounded-2xl bg-card border border-border">
                <div className="text-5xl font-bold text-primary mb-4">{s.n}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight">
            Common questions
          </h2>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl bg-card border border-border px-5 data-[state=open]:border-primary/40"
              >
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-24 flex flex-col items-center">
          <a
            href={buyUrl}
            className="gumroad-button inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/30"
          >
            {buyLabel}
          </a>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            After payment, return to this page to set up your agent.
          </p>
        </div>

        {/* Discreet sign-in link */}
        <div className="mt-20 text-center">
          <Link
            to="/signin"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-4"
          >
            Already purchased? Click here
          </Link>
        </div>
      </div>
    </section>
  );
}

