export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProvider {
  name: string;
  complete(messages: AIMessage[]): Promise<string>;
}

export interface AIRequestContext {
  topic: string;
  recordRefs?: string[];
  extra?: string;
}
