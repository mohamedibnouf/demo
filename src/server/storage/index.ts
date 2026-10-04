import { canPersistLocalFiles, DOCUMENT_STORAGE_UNAVAILABLE } from "@/server/runtime/local-fs";
import { LocalFileStorage } from "./local";
import { SupabaseStorage, supabaseStorageAvailable } from "./supabase";
import type { StorageProvider } from "./provider";

export function isDocumentStorageConfigured(): boolean {
  return supabaseStorageAvailable() || canPersistLocalFiles();
}

export function getStorageProvider(): StorageProvider {
  if (supabaseStorageAvailable()) return new SupabaseStorage();
  if (canPersistLocalFiles()) return new LocalFileStorage();
  throw new Error(DOCUMENT_STORAGE_UNAVAILABLE);
}

export { LocalFileStorage, SupabaseStorage, DOCUMENT_STORAGE_UNAVAILABLE };
export type { StorageProvider } from "./provider";
