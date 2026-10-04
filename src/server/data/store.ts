import fs from "fs";
import path from "path";
import type { DemoStore, DocumentRecord } from "@/types";
import { canPersistLocalFiles } from "@/server/runtime/local-fs";
import { createSeedStore } from "./seed";
import { formatFileSize } from "@/lib/files/validation";

function normalizeDocument(doc: DocumentRecord): DocumentRecord {
  const name = doc.name || doc.originalFilename || "document";
  const extension = doc.extension || (name.includes(".") ? `.${name.split(".").pop()}` : "");
  return {
    ...doc,
    documentNumber: doc.documentNumber || `DOC-2026-${(doc.id.replace(/\D/g, "") || "0").padStart(4, "0")}`,
    title: doc.title || name,
    originalFilename: doc.originalFilename || name,
    storedFilename: doc.storedFilename || name,
    mimeType: doc.mimeType || "application/octet-stream",
    extension,
    sizeBytes: doc.sizeBytes ?? 0,
    sizeLabel: doc.sizeLabel || formatFileSize(doc.sizeBytes ?? 0),
    storageBucket: doc.storageBucket || "samco-documents-local",
    storagePath: doc.storagePath || "",
    checksum: doc.checksum || `legacy-${doc.id}`,
    module: doc.module || "documents",
    recordType: doc.recordType ?? null,
    recordId: doc.recordId ?? null,
    processingStatus: doc.processingStatus || (doc.status === "Failed" ? "failed" : doc.status === "Analyzed" ? "processed" : "uploaded"),
    processedAt: doc.processedAt ?? null,
    createdAt: doc.createdAt || doc.uploadedAt,
    updatedAt: doc.updatedAt || doc.uploadedAt,
  };
}

export function normalizeStore(store: DemoStore): DemoStore {
  store.documents = (store.documents ?? []).map((doc) => normalizeDocument(doc));
  store.documentVersions = store.documentVersions ?? [];
  store.documentProcessingJobs = store.documentProcessingJobs ?? [];
  store.documentExtractions = store.documentExtractions ?? [];
  store.documentAnalysisResults = store.documentAnalysisResults ?? [];
  store.documentLinks = store.documentLinks ?? [];
  store.importBatches = store.importBatches ?? [];
  store.importRows = store.importRows ?? [];
  store.importJobs = store.importJobs ?? [];
  store.importErrors = store.importErrors ?? [];
  return store;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "demo-store.json");

declare global {
  var __samcoStore: DemoStore | undefined;
}

function persist(store: DemoStore) {
  if (!canPersistLocalFiles()) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
  } catch {
    // Hosted/read-only filesystems must keep the in-memory store instead of crashing render.
  }
}

export function getStore(): DemoStore {
  if (globalThis.__samcoStore) return globalThis.__samcoStore;
  try {
    if (canPersistLocalFiles() && fs.existsSync(DATA_FILE)) {
      try {
        globalThis.__samcoStore = normalizeStore(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as DemoStore);
        return globalThis.__samcoStore;
      } catch {
        // regenerate
      }
    }
  } catch {
    // unreadable local file — seed in memory
  }
  const seeded = createSeedStore();
  globalThis.__samcoStore = seeded;
  persist(seeded);
  return seeded;
}

export function mutateStore<T>(mutator: (store: DemoStore) => T): T {
  const store = getStore();
  const result = mutator(store);
  store.meta.generatedAt = new Date().toISOString();
  persist(store);
  return result;
}

export function resetStore(): DemoStore {
  const seeded = createSeedStore();
  globalThis.__samcoStore = seeded;
  persist(seeded);
  return seeded;
}

export function nextNumber(prefix: string): string {
  return mutateStore((store) => {
    const year = 2026;
    let seq = store.sequences.find((s) => s.prefix === prefix && s.year === year);
    if (!seq) {
      seq = { id: `seq-${prefix}`, prefix, year, nextValue: 1, padding: 4 };
      store.sequences.push(seq);
    }
    const value = seq.nextValue;
    seq.nextValue += 1;
    return `${prefix}-${year}-${String(value).padStart(seq.padding, "0")}`;
  });
}

export function addAuditLog(entry: {
  userId: string;
  action: string;
  module: string;
  recordRef: string;
  previousValue?: string | null;
  newValue?: string | null;
}) {
  mutateStore((store) => {
    store.auditLogs.unshift({
      id: `al-${Date.now()}`,
      userId: entry.userId,
      action: entry.action,
      module: entry.module,
      recordRef: entry.recordRef,
      previousValue: entry.previousValue ?? null,
      newValue: entry.newValue ?? null,
      createdAt: new Date().toISOString(),
    });
  });
}
