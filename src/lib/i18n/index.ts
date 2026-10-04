import { messages, type MessageKey } from "./dictionary";
import type { Locale } from "@/types";

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

export { messages };
