import { createHash } from "crypto";

export function checksumBuffer(data: Buffer | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function importFingerprint(checksum: string, profile: string): string {
  return createHash("sha256").update(`${checksum}:${profile}`).digest("hex");
}
