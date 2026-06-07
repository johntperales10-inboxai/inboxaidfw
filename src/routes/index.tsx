import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StageHero } from "@/components/inboxai/StageHero";
import { StageForm } from "@/components/inboxai/StageForm";
import { StageScript } from "@/components/inboxai/StageScript";
import { generateScript, type AgentSettings } from "@/lib/generateScript";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InboxAI — Your Gmail inbox, managed by AI" },
      { name: "description", content: "A personal AI agent that lives inside your own Google account. Stars important emails, deletes spam, and unsubscribes you from forgotten newsletters." },
      { property: "og:title", content: "InboxAI — Your Gmail inbox, managed by AI" },
      { property: "og:description", content: "A personal AI agent that lives inside your own Google account." },
    ],
  }),
  component: Index,
});

function Index() {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [script, setScript] = useState("");

  const handleBuild = (s: AgentSettings) => {
    setScript(generateScript(s));
    setStage(3);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const go = (s: 1 | 2 | 3) => {
    setStage(s);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div key={stage} className="animate-in fade-in duration-500">
        {stage === 1 && <StageHero onStart={() => go(2)} />}
        {stage === 2 && <StageForm onBack={() => go(1)} onSubmit={handleBuild} />}
        {stage === 3 && <StageScript script={script} onBack={() => go(2)} />}
      </div>
    </main>
  );
}
