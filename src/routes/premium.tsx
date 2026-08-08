import { useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PREMIUM_GUMROAD_LINK = "https://johnperales.gumroad.com/l/gcmqik?wanted=true";

const basic = [
  "Stars emails from trusted senders",
  "Deletes spam automatically",
  "Unsubscribes from dead newsletters",
  "Email alerts when agent needs input",
  "Runs every hour in the background",
];

const premium = [
  "Everything in Basic",
  "Priority Dashboard with AI scores",
  "Dynamic importance scoring 0 to 100 for every email",
  "Emails organized into 6 intelligent sections",
  "Explainable AI — see exactly why each email was scored",
  "Real person detection — never miss a human email",
  "Deadline detection — scores increase as deadlines approach",
  "Background agent runs automatically every hour",
  "One time payment — no subscription ever",
];

const faqs = [
  {
    q: "What is the difference between Basic and Premium?",
    a: "Basic runs automatically in the background. Premium adds a visual dashboard so you can also see and control everything manually.",
  },
  { q: "Do I need Basic first?", a: "No. Premium includes everything Basic has plus the dashboard." },
  { q: "Is this really one time?", a: "Yes. $97 once, yours forever." },
];

export const Route = createFileRoute("/premium")({
  validateSearch: (search: Record<string, unknown>) => ({
    upgrade: typeof search["upgrade"] === "string" ? (search["upgrade"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "InboxAI Premium — Your inbox on full autopilot" },
      { name: "description", content: "Upgrade to InboxAI Premium for the Priority Dashboard, AI importance scoring, deadline detection and real person detection. One time payment of $97." },
      { property: "og:title", content: "InboxAI Premium — Your inbox on full autopilot" },
      { property: "og:description", content: "The Priority Dashboard shows you exactly what matters, while the background agent handles the rest. $97 once." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PremiumPage,
});

function PremiumPage() {
  const { upgrade } = useSearch({ from: "/premium" });
  const [discountCode, setDiscountCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleApplyCode = () => {
    const code = discountCode.replace(/\s/g, "").toUpperCase();
    if (!code) return;
    if (code === "FREEPREMIUM") {
      setAppliedCode("FREEPREMIUM");
      setCodeError(null);
    } else {
      setAppliedCode(null);
      setCodeError("Invalid code — please try again.");
    }
  };

  const buyUrl = appliedCode
    ? "https://johnperales.gumroad.com/l/gcmqik/FREEPREMIUM"
    : "https://johnperales.gumroad.com/l/gcmqik?wanted=true";
  const buyLabel = appliedCode ? "Claim Premium access ✨" : "Get InboxAI Premium — $97";

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-20">
      <div className="max-w-5xl mx-auto">
        {upgrade === "required" && (
          <div className="mb-10 px-5 py-4 rounded-2xl bg-primary/10 border border-primary/40 text-sm text-primary text-center">
            This feature is included in InboxAI Premium. Upgrade to access your Priority Dashboard.
          </div>
        )}

        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-xs text-primary">
            <Sparkles className="size-3.5" />
            New — InboxAI Premium
          </span>
        </div>

        <h1 className="mt-8 text-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          Your inbox on full autopilot
        </h1>
        <p className="mt-6 text-center text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The background agent handles everything automatically. The Priority Dashboard shows you
          exactly what matters. Together they give you complete control over your inbox without ever
          having to think about it.
        </p>

        {/* Comparison */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-border bg-card p-8">
            <h2 className="text-xl font-semibold">Basic</h2>
            <p className="mt-2 text-3xl font-bold">$50 <span className="text-sm font-normal text-muted-foreground">one time</span></p>
            <ul className="mt-8 space-y-3">
              {basic.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 size-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Check className="size-3 text-muted-foreground" />
                  </span>
                  <span className="text-foreground/80 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div aria-hidden className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/50 via-primary/15 to-transparent blur-xl opacity-70" />
            <div className="relative rounded-3xl border-2 border-primary/60 bg-card p-8 shadow-2xl shadow-primary/10">
              <h2 className="text-xl font-semibold text-primary">Premium</h2>
              <p className="mt-2 text-3xl font-bold">$97 <span className="text-sm font-normal text-muted-foreground">one time</span></p>
              <ul className="mt-8 space-y-3">
                {premium.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 size-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Check className="size-3 text-primary" />
                    </span>
                    <span className="text-foreground/90 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center">
          <a
            href={buyUrl}
            className="gumroad-button inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/30"
          >
            {buyLabel}
          </a>
          <p className="mt-3 text-center text-xs text-muted-foreground max-w-md">
            One time payment. No subscription. Includes everything in Basic plus the Priority Dashboard.
          </p>

          {/* Discount code */}
          <div className="mt-6 pt-5 border-t border-border/50 w-full max-w-sm">
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
                placeholder="Enter your code here"
                aria-label="Discount code"
                className="flex-1 min-w-0 h-11 px-3 rounded-md bg-background border-2 border-border text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleApplyCode}
                className="h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/40 hover:opacity-90 transition-all"
              >
                ✨ Apply
              </button>
            </div>
            {appliedCode && (
              <p className="mt-3 text-xs text-green-400 text-center">
                ✓ Discount applied — your Premium access is free!
              </p>
            )}
            {codeError && (
              <p className="mt-3 text-xs text-red-400 text-center">
                {codeError}
              </p>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-center text-3xl font-bold tracking-tight">Common questions</h2>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`p-${i}`}
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

        <div className="mt-20 text-center">
          <Link to="/" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
