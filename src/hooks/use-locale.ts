"use client";

import type { Locale } from "@/types";

export function useLocale(): Locale {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang === "ar" ? "ar" : "en";
}
