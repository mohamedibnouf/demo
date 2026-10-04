import { describe, expect, it } from "vitest";
import { calculateFpy } from "./fpy";
import { calculateFfrPpm } from "./ffr";
import { calculateSppm } from "./sppm";
import { assessRisk, riskScore } from "./risk-scoring";
import { daysRemaining, dueLabel } from "./due-dates";
import { countDistinctSourceEvents, assertSingleEventChain } from "./anti-double-count";
import { canStartReworkAttempt } from "./rework";
import { isControlledOperationAllowed, deriveCalibrationStatus } from "./calibration";
import { isDeviationAllowed } from "./deviation";
import { can, customerFacingComplaint } from "./rbac";
import { nextWorkflowStatus } from "./workflow";

describe("FPY", () => {
  it("uses process defects over units produced", () => {
    expect(calculateFpy(32, 1000)).toBe(96.8);
  });
  it("returns 0 when no production", () => {
    expect(calculateFpy(5, 0)).toBe(0);
  });
});

describe("FFR PPM", () => {
  it("uses rolling 12-month family production as denominator", () => {
    expect(calculateFfrPpm(18, 14458)).toBe(1245);
  });
});

describe("SPPM", () => {
  it("uses receiving quantity as denominator", () => {
    expect(calculateSppm(12, 33708)).toBe(356);
  });
});

describe("risk scoring", () => {
  it("multiplies probability and impact", () => {
    expect(riskScore(4, 5)).toBe(20);
    expect(assessRisk(4, 5).level).toBe("CRITICAL");
    expect(assessRisk(3, 3).level).toBe("MEDIUM");
    expect(assessRisk(1, 2).level).toBe("LOW");
  });
});

describe("due dates", () => {
  it("calculates remaining days and labels", () => {
    expect(daysRemaining("2026-10-04", "2026-10-04")).toBe(0);
    expect(dueLabel(0)).toBe("Due today");
    expect(daysRemaining("2026-10-02", "2026-10-04")).toBe(-2);
    expect(dueLabel(-2)).toBe("Overdue");
    expect(daysRemaining("2026-10-08", "2026-10-04")).toBe(4);
    expect(dueLabel(4)).toBe("4 days left");
  });
});

describe("anti-double-counting", () => {
  it("counts a supplier defect chain once", () => {
    const chain = [
      { sourceEventId: "QE-2026-0018" },
      { sourceEventId: "QE-2026-0018" },
      { sourceEventId: "QE-2026-0018" },
      { sourceEventId: "QE-2026-0018" },
    ];
    expect(countDistinctSourceEvents(chain)).toBe(1);
    expect(assertSingleEventChain("QE-2026-0018", chain.map((c) => c.sourceEventId))).toBe(true);
  });
});

describe("rework", () => {
  it("blocks a third attempt", () => {
    expect(canStartReworkAttempt(0).nextAttempt).toBe(1);
    expect(canStartReworkAttempt(1).nextAttempt).toBe(2);
    const third = canStartReworkAttempt(2);
    expect(third.allowed).toBe(false);
    expect(third.requiresManagement).toBe(true);
  });
});

describe("calibration", () => {
  it("blocks expired and out-of-calibration equipment", () => {
    expect(isControlledOperationAllowed("Valid")).toBe(true);
    expect(isControlledOperationAllowed("Due Soon")).toBe(true);
    expect(isControlledOperationAllowed("Expired")).toBe(false);
    expect(isControlledOperationAllowed("Out of Calibration")).toBe(false);
    expect(deriveCalibrationStatus("2026-10-08", "2026-10-04", "Valid")).toBe("Due Soon");
    expect(deriveCalibrationStatus("2026-09-30", "2026-10-04", "Valid")).toBe("Expired");
  });
});

describe("deviation", () => {
  it("blocks confirmed production orders", () => {
    expect(isDeviationAllowed(true)).toBe(false);
    expect(isDeviationAllowed(false)).toBe(true);
  });
});

describe("workflow status", () => {
  it("moves NCR draft to Submitted and CAPA draft to Open", () => {
    expect(nextWorkflowStatus("ncrs", "Draft")).toBe("Submitted");
    expect(nextWorkflowStatus("ncrs", "Investigation")).toBe("Action Required");
    expect(nextWorkflowStatus("capas", "Draft")).toBe("Open");
    expect(nextWorkflowStatus("capas", "In Progress")).toBe("Pending Verification");
    expect(nextWorkflowStatus("capas", "Pending Verification")).toBe("Effective");
  });
});

describe("RBAC", () => {
  it("prevents management from editing operational records", () => {
    expect(can("Management", "production_ncr", "view")).toBe(true);
    expect(can("Management", "production_ncr", "edit")).toBe(false);
    expect(can("Management", "production_ncr", "approve")).toBe(false);
  });
  it("limits supplier and customer modules", () => {
    expect(can("Supplier", "supplier_ncr", "submit")).toBe(true);
    expect(can("Supplier", "production_ncr", "view")).toBe(false);
    expect(can("Customer", "customer_complaint", "create")).toBe(true);
    expect(can("Customer", "capa", "view")).toBe(false);
  });
  it("strips internal investigation from customer view", () => {
    const visible = customerFacingComplaint({
      number: "CC-2026-0009",
      status: "Investigation",
      requestedInfo: null,
      decision: null,
      finalResponse: null,
      replacementStatus: "Not requested",
      type: "Leakage",
      description: "Water leak at coil joint",
      quantity: 1,
      serialNumber: "SN-AHU-2026-1104",
      submittedAt: "2026-09-18",
      internalRca: "Brazing process deviation — INTERNAL",
    });
    expect(JSON.stringify(visible)).not.toContain("INTERNAL");
    expect("internalRca" in visible).toBe(false);
  });
});
