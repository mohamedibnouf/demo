export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false" && process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
}

export function demoPassword(): string {
  return process.env.DEMO_PASSWORD ?? "SamcoDemo@2026";
}

export function authSecret(): string {
  return process.env.AUTH_SECRET ?? "samco-demo-auth-secret-change-in-production-32b";
}

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openAiModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export const DEMO_AS_OF = "2026-10-04";
