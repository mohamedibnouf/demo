import { describe, expect, it } from "vitest";
import { can, customerFacingComplaint } from "./rbac";
import { createSeedStore } from "@/server/data/seed";
import { ids } from "@/server/data/ids";

describe("supplier isolation", () => {
  it("limits supplier users to their own SNCR records", () => {
    const store = createSeedStore();
    const supplier = store.profiles.find((p) => p.id === ids.user.supplier)!;
    const visible = store.supplierNcrs.filter((n) => n.supplierId === supplier.supplierId);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((n) => n.supplierId === ids.supplier.alpha)).toBe(true);
    expect(can("Supplier", "production_ncr", "view")).toBe(false);
  });
});

describe("admin route protection", () => {
  it("does not grant Quality Inspector users or admin view", () => {
    expect(can("Quality Inspector", "users", "view")).toBe(false);
    expect(can("Quality Inspector", "admin", "view")).toBe(false);
    expect(can("Quality Manager", "admin", "edit")).toBe(false);
    expect(can("Quality Manager", "admin", "view")).toBe(true);
    expect(can("Admin", "admin", "edit")).toBe(true);
  });
});

describe("customer isolation", () => {
  it("hides internal investigation from the customer projection", () => {
    const store = createSeedStore();
    const complaint = store.complaints.find((c) => c.number === ids.scenario.complaintC)!;
    expect(complaint.internalRca).toBeTruthy();
    const view = customerFacingComplaint(complaint);
    expect("internalRca" in view).toBe(false);
    expect(can("Customer", "capa", "view")).toBe(false);
  });
});
