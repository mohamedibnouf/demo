import fs from "fs";
import path from "path";
import type { DemoStore } from "@/types";
import { createSeedStore } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "demo-store.json");

declare global {
  var __samcoStore: DemoStore | undefined;
}

function persist(store: DemoStore) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
}

export function getStore(): DemoStore {
  if (globalThis.__samcoStore) return globalThis.__samcoStore;
  if (fs.existsSync(DATA_FILE)) {
    try {
      globalThis.__samcoStore = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as DemoStore;
      return globalThis.__samcoStore;
    } catch {
      // regenerate
    }
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
