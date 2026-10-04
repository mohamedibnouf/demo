import { hasOpenAiKey } from "@/lib/env";
import { MockAIProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import type { AIProvider } from "./provider";

export function getAIProvider(): AIProvider {
  if (hasOpenAiKey()) return new OpenAIProvider();
  return new MockAIProvider();
}

export { MockAIProvider, OpenAIProvider };
export type { AIProvider } from "./provider";
