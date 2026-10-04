import type { DemoStore } from "@/types";
import { getStore, resetStore } from "./store";
import { hasSupabaseConfig } from "@/lib/env";

export interface DataProvider {
  name: string;
  read(): DemoStore;
  reset(): DemoStore;
}

export class LocalDemoProvider implements DataProvider {
  name = "LocalDemoProvider";
  read() {
    return getStore();
  }
  reset() {
    return resetStore();
  }
}

export class SupabaseProvider implements DataProvider {
  name = "SupabaseProvider";
  read() {
    // Swap-ready: until a live project is configured, fall back to the local store.
    return getStore();
  }
  reset() {
    return resetStore();
  }
}

export function getDataProvider(): DataProvider {
  if (hasSupabaseConfig()) return new SupabaseProvider();
  return new LocalDemoProvider();
}
