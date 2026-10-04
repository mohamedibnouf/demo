"use client";

import { useState, useTransition } from "react";
import { Button, Card } from "@/components/ui";

export function AssistantForm({
  actions,
  ask,
}: {
  actions: string[];
  ask: (prompt: string, topic: string) => Promise<{ result: string; provider: string }>;
}) {
  const [topic, setTopic] = useState(actions[0]!);
  const [prompt, setPrompt] = useState("Explain the Alpha Components leakage chain for the live demo.");
  const [answer, setAnswer] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-4">
        <label className="text-sm font-medium">
          Assistance type
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 w-full rounded border border-line px-2 py-2">
            {actions.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mt-3 h-32 w-full rounded border border-line p-2 text-sm" />
        <Button
          className="mt-3"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await ask(prompt, topic);
              setAnswer(res.result);
              setProvider(res.provider);
            })
          }
        >
          {pending ? "Analyzing…" : "Ask assistant"}
        </Button>
      </Card>
      <Card className="p-4">
        <p className="text-xs uppercase text-muted">Response {provider ? `· ${provider}` : ""}</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm">{answer ?? "Select a prompt and run the assistant."}</pre>
      </Card>
    </div>
  );
}
