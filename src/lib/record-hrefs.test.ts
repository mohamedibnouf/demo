import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/server/data/seed";
import { hrefForRef } from "./record-hrefs";

describe("hrefForRef", () => {
  const store = createSeedStore();

  it("resolves the Alpha leakage chain to existing detail routes", () => {
    expect(hrefForRef(store, "ncr-0012")).toBe("/quality/production-ncr/ncr-0012");
    expect(hrefForRef(store, "capa-0008")).toBe("/quality/capa/capa-0008");
    expect(hrefForRef(store, "sncr-0004")).toBe("/quality/supplier-ncr/sncr-0004");
    expect(hrefForRef(store, "insp-0041")).toBe("/quality/production-inspection/insp-0041");
    expect(hrefForRef(store, "pc-0007")).toBe("/performance/production-constraints/pc-0007");
    expect(hrefForRef(store, "SN-AHU-2026-1842")).toBe("/trace/serial/SN-AHU-2026-1842");
    expect(hrefForRef(store, "CAL-0042")).toBe("/quality/calibration/eq-42");
    expect(hrefForRef(store, "af-0007")).toBe("/ims/audit-findings/af-0007");
  });
});
