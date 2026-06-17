import { ArrowRight, Star, Trash2, Mail, MessageSquare, Check } from "lucide-react";

interface Props {
  onStart: () => void;
}

const features = [
  { icon: Star, title: "Stars important emails", desc: "AI reads every email and decides if it's from a real person who matters to you." },
  { icon: Trash2, title: "Clears spam automatically", desc: "Empties your spam folder into trash so it never piles up again." },
  { icon: Mail, title: "Unsubscribes for you", desc: "Finds newsletters you haven't opened in months and unsubscribes automatically." },
  { icon: MessageSquare, title: "Texts you when unsure", desc: "Never guesses. Sends you a Telegram message when it needs your input." },
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

export function StageHero({ onStart }: Props) {
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

        <div className="mt-12 flex justify-center">
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
          >
            Set up my agent
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

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

              <a
                href="https://johntperales.gumroad.com/l/xypgwz?wanted=true"
                className="gumroad-button mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/30"
              >
                Buy now — $50
              </a>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                After payment, return to this page to set up your agent.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>
    </section>
  );
}
