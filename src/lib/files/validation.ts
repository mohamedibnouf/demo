import { maxUploadBytes } from "@/lib/env";

export const EXTRACTABLE_EXTENSIONS = [".xlsx", ".xls", ".csv", ".pdf", ".docx"] as const;
export const STORAGE_ONLY_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"] as const;
export const ALLOWED_EXTENSIONS = [...EXTRACTABLE_EXTENSIONS, ...STORAGE_ONLY_EXTENSIONS] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

const MIME_BY_EXT: Record<string, string[]> = {
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip"],
  ".xls": ["application/vnd.ms-excel", "application/octet-stream"],
  ".csv": ["text/csv", "text/plain", "application/vnd.ms-excel"],
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"],
  ".gif": ["image/gif"],
};

export interface FileValidationInput {
  filename: string;
  size: number;
  declaredMime?: string | null;
  bytes: Uint8Array;
}

export interface FileValidationResult {
  ok: true;
  extension: AllowedExtension;
  detectedMime: string;
  extractable: boolean;
}

export interface FileValidationFailure {
  ok: false;
  error: string;
}

export function extensionOf(filename: string): string {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? "";
  const idx = base.lastIndexOf(".");
  return idx >= 0 ? base.slice(idx).toLowerCase() : "";
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, 512);
  if (!sample.length) return false;
  let printable = 0;
  for (const value of sample) {
    if (value === 9 || value === 10 || value === 13 || (value >= 32 && value <= 126)) printable += 1;
  }
  return printable / sample.length > 0.9;
}

export function detectMagicMime(bytes: Uint8Array, extension: string): string | null {
  if (!bytes.length) return null;
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    const tag = String.fromCharCode(...bytes.slice(8, 12));
    if (tag === "WEBP") return "image/webp";
  }
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) return "application/vnd.ms-excel";
  if (startsWith(bytes, [0x50, 0x4b])) {
    const zipText = Buffer.from(bytes.slice(0, Math.min(bytes.length, 2048))).toString("latin1");
    if (zipText.includes("word/document.xml")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (zipText.includes("xl/workbook") || zipText.includes("xl/")) {
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
    if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (extension === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    return "application/zip";
  }
  if (extension === ".csv" && looksLikeText(bytes)) return "text/csv";
  return null;
}

export function validateUploadFile(input: FileValidationInput): FileValidationResult | FileValidationFailure {
  if (!input.filename?.trim()) return { ok: false, error: "Choose a file to upload." };
  if (!input.size || input.size <= 0 || !input.bytes.length) return { ok: false, error: "The file is empty." };
  const limit = maxUploadBytes();
  if (input.size > limit) {
    return { ok: false, error: `File is too large. Maximum size is ${Math.round(limit / (1024 * 1024))} MB.` };
  }
  const extension = extensionOf(input.filename) as AllowedExtension;
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      ok: false,
      error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }
  const detected = detectMagicMime(input.bytes, extension);
  if (!detected) {
    return { ok: false, error: "The file contents do not match a supported format." };
  }
  const allowedMimes = MIME_BY_EXT[extension] ?? [];
  if (!allowedMimes.includes(detected) && !(extension === ".xlsx" && detected === "application/zip")) {
    return { ok: false, error: `File extension ${extension} does not match the detected file type.` };
  }
  if (input.declaredMime && !allowedMimes.includes(input.declaredMime) && input.declaredMime !== detected) {
    // Client MIME is advisory only; detected bytes win.
  }
  return {
    ok: true,
    extension,
    detectedMime: detected,
    extractable: EXTRACTABLE_EXTENSIONS.includes(extension as (typeof EXTRACTABLE_EXTENSIONS)[number]),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function typeLabel(extension: string): string {
  return extension.replace(".", "").toUpperCase();
}
