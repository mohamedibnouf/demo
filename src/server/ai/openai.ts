import { openAiModel } from "@/lib/env";
import type { AIMessage, AIProvider } from "./provider";

export class OpenAIProvider implements AIProvider {
  name = "OpenAIProvider";

  async complete(messages: AIMessage[]): Promise<string> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openAiModel(),
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an advisory quality assistant for SAMCO / Carrier. Never approve, reject, verify, close, or change controlled records. Always state that recommendations are advisory.",
          },
          ...messages,
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status})`);
    }
    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? "No response from model.";
  }
}
