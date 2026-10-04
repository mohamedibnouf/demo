import { afterEach, describe, expect, it } from "vitest";
import { getStore, mutateStore } from "@/server/data/store";
import { runRiskEngine } from "@/server/risk-engine";
import { DOCUMENT_STORAGE_UNAVAILABLE, getStorageProvider, isDocumentStorageConfigured } from "@/server/storage";
import { canPersistLocalFiles, resetLocalFsCache } from "./local-fs";

const originalVercel = process.env.VERCEL;
const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
  resetLocalFsCache();
});

describe("hosted runtime storage selection", () => {
  it("keeps local disk persistence available in local development", () => {
    delete process.env.VERCEL;
    resetLocalFsCache();
    expect(canPersistLocalFiles()).toBe(true);
    expect(isDocumentStorageConfigured()).toBe(true);
    expect(getStorageProvider().name).toBe("LocalFileStorage");
  });

  it("does not use local disk on Vercel and leaves core store usable", () => {
    process.env.VERCEL = "1";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetLocalFsCache();
    globalThis.__samcoStore = undefined;
    expect(canPersistLocalFiles()).toBe(false);
    expect(isDocumentStorageConfigured()).toBe(false);
    expect(() => getStorageProvider()).toThrow(DOCUMENT_STORAGE_UNAVAILABLE);
    expect(() => getStore()).not.toThrow();
    expect(() => runRiskEngine()).not.toThrow();
    expect(() =>
      mutateStore((store) => {
        store.meta.generatedAt = new Date().toISOString();
      }),
    ).not.toThrow();
    expect(getStore().profiles.length).toBeGreaterThan(0);
  });

  it("selects Supabase storage on Vercel when service-role credentials exist", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    resetLocalFsCache();
    expect(isDocumentStorageConfigured()).toBe(true);
    expect(getStorageProvider().name).toBe("SupabaseStorage");
  });
});
