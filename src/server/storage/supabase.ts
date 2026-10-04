import { createClient } from "@supabase/supabase-js";
import { hasSupabaseServiceRole, supabaseStorageBucket } from "@/lib/env";
import { isSafeStoragePath } from "@/lib/files/paths";
import type { StorageProvider, StoredObject } from "./provider";

export class SupabaseStorage implements StorageProvider {
  name = "SupabaseStorage";
  bucket = supabaseStorageBucket();
  private = true as const;

  private client() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase storage is not configured");
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async put(storagePath: string, bytes: Buffer, contentType: string): Promise<StoredObject> {
    if (!isSafeStoragePath(storagePath)) throw new Error("Unsafe storage path");
    const { error } = await this.client().storage.from(this.bucket).upload(storagePath, bytes, {
      contentType,
      upsert: false,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return { bucket: this.bucket, path: storagePath, size: bytes.length };
  }

  async get(storagePath: string): Promise<Buffer> {
    if (!isSafeStoragePath(storagePath)) throw new Error("Unsafe storage path");
    const { data, error } = await this.client().storage.from(this.bucket).download(storagePath);
    if (error || !data) throw new Error(error?.message ?? "Stored file was not found");
    return Buffer.from(await data.arrayBuffer());
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      await this.get(storagePath);
      return true;
    } catch {
      return false;
    }
  }

  async signedUrl(storagePath: string, expiresInSeconds = 300): Promise<string> {
    if (!isSafeStoragePath(storagePath)) throw new Error("Unsafe storage path");
    const { data, error } = await this.client().storage.from(this.bucket).createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not create a signed URL");
    return data.signedUrl;
  }
}

export function supabaseStorageAvailable(): boolean {
  return hasSupabaseServiceRole();
}
