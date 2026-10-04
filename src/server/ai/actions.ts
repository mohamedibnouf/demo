"use server";

import { authorize } from "@/lib/engines/rbac";
import { requireUser } from "@/server/auth/session";
import { getStore, mutateStore } from "@/server/data/store";
import { getAIProvider } from "./index";

export async function askAssistant(prompt: string, topic: string) {
  const user = await requireUser();
  if (!authorize(user, "ai", "view")) {
    throw new Error("Not authorized");
  }
  const provider = getAIProvider();
  const storeHint = `Demo context: NCR-2026-0012, SNCR-2026-0004, CAPA-2026-0008 share source_event_id QE-2026-0018. CAL-0042 due in 4 days.`;
  const result = await provider.complete([
    { role: "user", content: `${topic}\n${prompt}\n${storeHint}` },
  ]);
  mutateStore((store) => {
    store.aiAnalyses.unshift({
      id: `ai-${Date.now()}`,
      topic,
      prompt,
      result,
      provider: provider.name,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    });
  });
  return { result, provider: provider.name };
}

export async function recentAnalyses() {
  const user = await requireUser();
  if (!authorize(user, "ai", "view")) return [];
  return getStore().aiAnalyses.slice(0, 8);
}
