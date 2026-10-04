const SAFE_NAME = /[^a-zA-Z0-9._-]+/g;

export function sanitizeFilename(original: string): string {
  const base = original.replace(/\\/g, "/").split("/").pop() ?? "file";
  const cleaned = base.normalize("NFKD").replace(SAFE_NAME, "_").replace(/^\.+/, "").slice(0, 120);
  return cleaned || "file";
}

export function assertSafeFilename(original: string): string {
  if (!original || typeof original !== "string") {
    throw new Error("Filename is required");
  }
  if (original.includes("\0")) {
    throw new Error("Filename contains an unsafe null byte");
  }
  if (original.includes("..") || original.includes("\\") || original.startsWith("/")) {
    throw new Error("Filename must not contain path traversal characters");
  }
  return sanitizeFilename(original);
}

export function buildStoragePath(input: {
  organization?: string;
  module: string;
  year: number | string;
  recordId: string;
  uuid: string;
  filename: string;
}): string {
  const organization = sanitizeFilename(input.organization ?? "samco");
  const moduleName = sanitizeFilename(input.module || "documents");
  const year = String(input.year).replace(/[^\d]/g, "") || String(new Date().getFullYear());
  const recordId = sanitizeFilename(input.recordId);
  const uuid = sanitizeFilename(input.uuid);
  const filename = sanitizeFilename(input.filename);
  const parts = [organization, moduleName, year, recordId, `${uuid}-${filename}`];
  if (parts.some((part) => part.includes("..") || part.includes("/") || part.includes("\\"))) {
    throw new Error("Generated storage path is unsafe");
  }
  return parts.join("/");
}

export function isSafeStoragePath(path: string): boolean {
  if (!path || path.includes("..") || path.startsWith("/") || path.includes("\\") || path.includes("\0")) {
    return false;
  }
  return /^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)+$/.test(path);
}
