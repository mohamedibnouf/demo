import { LocalFileStorage } from "./local";
import { SupabaseStorage, supabaseStorageAvailable } from "./supabase";
import type { StorageProvider } from "./provider";

export function getStorageProvider(): StorageProvider {
  if (supabaseStorageAvailable()) return new SupabaseStorage();
  return new LocalFileStorage();
}

export { LocalFileStorage, SupabaseStorage };
export type { StorageProvider } from "./provider";
