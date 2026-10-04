import fs from "fs";
import path from "path";

export const DOCUMENT_STORAGE_UNAVAILABLE = "Document storage is not configured for this environment.";

let writableCache: boolean | undefined;

export function isHostedRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

export function resetLocalFsCache() {
  writableCache = undefined;
}

export function canPersistLocalFiles(): boolean {
  if (writableCache !== undefined) return writableCache;
  if (isHostedRuntime()) {
    writableCache = false;
    return false;
  }
  try {
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, ".write-probe");
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    writableCache = true;
    return true;
  } catch {
    writableCache = false;
    return false;
  }
}
