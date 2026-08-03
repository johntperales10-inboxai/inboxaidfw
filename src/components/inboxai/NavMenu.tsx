import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

const sectionLinks = [
  { label: "Home", href: "/#top" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Buy InboxAI", href: "/#pricing" },
];

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="size-11 rounded-xl border border-border bg-card/90 backdrop-blur flex items-center justify-center text-foreground hover:border-primary/50 hover:text-primary transition-colors shadow-lg"
      >
        {open ? <Menu className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          <nav className="p-2">
            {sectionLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/premium"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              InboxAI Premium
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
