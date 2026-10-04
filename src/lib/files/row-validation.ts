import type { DemoStore, ImportProfileKey, ImportRowIssue, ImportRowStatus } from "@/types";
import { REQUIRED_FIELDS } from "./profiles";

const SERIAL_RE = /^SN-[A-Z0-9]+-\d{4}-\d{4}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidatedRow {
  rowNumber: number;
  status: ImportRowStatus;
  original: Record<string, string>;
  normalized: Record<string, string>;
  issues: ImportRowIssue[];
}

function issue(field: string, originalValue: string, problem: string, suggestion: string): ImportRowIssue {
  return { field, originalValue, problem, suggestion };
}

function lookupOrder(store: DemoStore, value: string) {
  return store.productionOrders.find((o) => o.number.toLowerCase() === value.toLowerCase() || o.id === value);
}

function lookupModel(store: DemoStore, value: string) {
  return store.models.find((m) => m.code.toLowerCase() === value.toLowerCase() || m.name.toLowerCase() === value.toLowerCase() || m.id === value);
}

function lookupLine(store: DemoStore, value: string) {
  return store.productionLines.find((l) => l.code.toLowerCase() === value.toLowerCase() || l.name.toLowerCase() === value.toLowerCase() || l.id === value);
}

function lookupSupplier(store: DemoStore, value: string) {
  return store.suppliers.find((s) => s.code.toLowerCase() === value.toLowerCase() || s.name.toLowerCase() === value.toLowerCase() || s.id === value);
}

function lookupMaterial(store: DemoStore, value: string) {
  return store.materials.find((m) => m.partNumber.toLowerCase() === value.toLowerCase() || m.id === value);
}

function lookupDepartment(store: DemoStore, value: string) {
  return store.departments.find((d) => d.code.toLowerCase() === value.toLowerCase() || d.name.toLowerCase() === value.toLowerCase() || d.id === value);
}

export function validateImportRows(
  store: DemoStore,
  profile: ImportProfileKey,
  rows: { rowNumber: number; original: Record<string, string>; normalized: Record<string, string> }[],
): ValidatedRow[] {
  const seenSerials = new Set<string>();
  const seenFingerprints = new Set<string>();
  return rows.map((row) => {
    const issues: ImportRowIssue[] = [];
    const values = row.normalized;
    for (const field of REQUIRED_FIELDS[profile]) {
      if (!values[field]?.trim()) {
        issues.push(issue(field, values[field] ?? "", "required field missing", `Provide ${field}`));
      }
    }

    const dateValue = values.date;
    if (dateValue && !DATE_RE.test(dateValue)) {
      issues.push(issue("date", dateValue, "invalid date", "Use YYYY-MM-DD"));
    }

    const numericFields = profile === "COPQ_DATA" ? ["scrap_cost"] : ["quantity_produced", "quantity", "defect_quantity"];
    for (const field of numericFields) {
      if (values[field] && Number.isNaN(Number(values[field]))) {
        issues.push(issue(field, values[field], "invalid numeric value", "Enter a number"));
      }
    }

    if (values.status) {
      const allowed = ["pass", "fail", "hold", "open", "closed", "ok", "ng"];
      if (!allowed.includes(values.status.toLowerCase())) {
        issues.push(issue("status", values.status, "invalid status", "Use Pass, Fail, Hold, Open, or Closed"));
      }
    }

    if (profile === "PRODUCTION_DATA") {
      if (values.production_order && !lookupOrder(store, values.production_order)) {
        issues.push(issue("production_order", values.production_order, "unknown production order", "Use a seeded PO such as PO-2026-2409"));
      }
      if (values.model && !lookupModel(store, values.model)) {
        issues.push(issue("model", values.model, "unknown product / model", "Use AHU-P25, AHU-S15, WRAC-18K, or another master model"));
      }
      if (values.line && !lookupLine(store, values.line)) {
        issues.push(issue("line", values.line, "unknown production line", "Use L-AHU, L-WRAC, or another master line code"));
      }
      if (values.serial_number) {
        if (!SERIAL_RE.test(values.serial_number)) {
          issues.push(issue("serial_number", values.serial_number, "invalid serial number", "Use SN-FAMILY-YYYY-####"));
        }
        if (seenSerials.has(values.serial_number.toUpperCase())) {
          issues.push(issue("serial_number", values.serial_number, "duplicate record", "Serial already appears in this file"));
        }
        seenSerials.add(values.serial_number.toUpperCase());
      }
      if (values.inspector && !store.profiles.some((p) => p.fullName.toLowerCase() === values.inspector!.toLowerCase())) {
        issues.push(issue("inspector", values.inspector, "unknown inspector", "Warning only — map to a SAMCO user or leave blank"));
      }
    }

    if (profile === "RECEIVING_DATA") {
      if (values.supplier && !lookupSupplier(store, values.supplier)) {
        issues.push(issue("supplier", values.supplier, "unknown supplier", "Use ALPHA, DELTA, OASIS, or another master supplier"));
      }
      if (values.material_pn && !lookupMaterial(store, values.material_pn)) {
        issues.push(issue("material_pn", values.material_pn, "unknown material", "Use CMP-EXP-4421 or another master part number"));
      }
    }

    if (profile === "COPQ_DATA" && values.department && !lookupDepartment(store, values.department)) {
      issues.push(issue("department", values.department, "unknown department", "Use Quality, Production, or another seeded department"));
    }

    if (profile === "NCR_DATA" && values.model && !lookupModel(store, values.model)) {
      issues.push(issue("model", values.model, "unknown product / model", "Use a master model code"));
    }

    const fingerprint = Object.values(values).join("|");
    if (seenFingerprints.has(fingerprint)) {
      issues.push(issue("*", fingerprint, "duplicate record", "This row repeats an earlier row"));
    }
    seenFingerprints.add(fingerprint);

    const hardIssues = issues.filter((item) => !item.problem.startsWith("unknown inspector"));
    const status: ImportRowStatus = hardIssues.length ? "error" : issues.length ? "warning" : "valid";

    return { rowNumber: row.rowNumber, status, original: row.original, normalized: values, issues };
  });
}
