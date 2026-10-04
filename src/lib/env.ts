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

export function hasSupabaseServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && hasSupabaseConfig());
}

export function supabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "samco-documents";
}

export function maxUploadBytes(): number {
  const parsed = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10 * 1024 * 1024;
}

export function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openAiModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export const DEMO_AS_OF = "2026-10-04";
