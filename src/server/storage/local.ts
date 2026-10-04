import fs from "fs";
import path from "path";
import { createHmac } from "crypto";
import { authSecret } from "@/lib/env";
import { isSafeStoragePath } from "@/lib/files/paths";
import type { StorageProvider, StoredObject } from "./provider";

const ROOT = path.join(process.cwd(), "data", "uploads");
const BUCKET = "samco-documents-local";

function resolveSafe(storagePath: string): string {
  if (!isSafeStoragePath(storagePath)) {
    throw new Error("Unsafe storage path");
  }
  const full = path.resolve(ROOT, storagePath);
  const root = path.resolve(ROOT);
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new Error("Unsafe storage path");
  }
  return full;
}

export class LocalFileStorage implements StorageProvider {
  name = "LocalFileStorage";
  bucket = BUCKET;
  private = true as const;

  async put(storagePath: string, bytes: Buffer): Promise<StoredObject> {
    const full = resolveSafe(storagePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, bytes);
    return { bucket: this.bucket, path: storagePath, size: bytes.length };
  }

  async get(storagePath: string): Promise<Buffer> {
    const full = resolveSafe(storagePath);
    if (!fs.existsSync(full)) throw new Error("Stored file was not found");
    return fs.readFileSync(full);
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      return fs.existsSync(resolveSafe(storagePath));
    } catch {
      return false;
    }
  }

  async signedUrl(storagePath: string, expiresInSeconds = 300): Promise<string> {
    if (!isSafeStoragePath(storagePath)) throw new Error("Unsafe storage path");
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${storagePath}.${exp}`;
    const sig = createHmac("sha256", authSecret()).update(payload).digest("hex");
    return `/api/documents/file?path=${encodeURIComponent(storagePath)}&exp=${exp}&sig=${sig}`;
  }
}

export function verifyLocalSignedPath(storagePath: string, exp: string, sig: string): boolean {
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  if (!isSafeStoragePath(storagePath)) return false;
  const expected = createHmac("sha256", authSecret()).update(`${storagePath}.${expires}`).digest("hex");
  return expected === sig;
}
