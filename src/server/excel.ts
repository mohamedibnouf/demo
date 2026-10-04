"use server";

import { authorize } from "@/lib/engines/rbac";
import { requireUser } from "@/server/auth/session";
import { addAuditLog, mutateStore } from "@/server/data/store";
import type { ImportJob } from "@/types";

export type ParsedImportRow = Record<string, string>;

const REQUIRED: Record<string, string[]> = {
  "Production File": ["production_date", "production_order", "model", "line", "quantity", "serial_number"],
  "Receiving File": ["date", "supplier", "material_pn", "quantity"],
  "COPQ File": ["date", "department", "scrap_cost"],
  "NCR File": ["source", "defect", "severity"],
};

function validateRow(type: string, row: ParsedImportRow, index: number) {
  const errors: { row: number; error: string; value: string; recommendation: string }[] = [];
  for (const col of REQUIRED[type] ?? []) {
    if (!row[col] || !String(row[col]).trim()) {
      errors.push({ row: index, error: `Missing ${col}`, value: "", recommendation: `Provide ${col}` });
    }
  }
  if (row.quantity && Number.isNaN(Number(row.quantity))) {
    errors.push({ row: index, error: "Quantity not numeric", value: row.quantity, recommendation: "Enter an integer" });
  }
  if (row.serial_number && !/^SN-/.test(row.serial_number) && type === "Production File") {
    errors.push({ row: index, error: "Serial format", value: row.serial_number, recommendation: "Use SN-FAMILY-YYYY-####" });
  }
  return errors;
}

export async function importCsv(type: keyof typeof REQUIRED, csv: string, fileName: string) {
  const user = await requireUser();
  if (!authorize(user, "excel", "create")) throw new Error("Not authorized");
  const lines = csv.trim().split(/\r?\n/);
  const header = (lines.shift() ?? "").split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const jobId = `imp-${Date.now()}`;
  let added = 0;
  let failed = 0;
  const errors: { row: number; error: string; value: string; recommendation: string }[] = [];

  lines.forEach((line, i) => {
    const cells = line.split(",");
    const row: ParsedImportRow = {};
    header.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    const rowErrors = validateRow(type, row, i + 2);
    if (rowErrors.length) {
      failed += 1;
      errors.push(...rowErrors);
      return;
    }
    added += 1;
  });

  mutateStore((store) => {
    store.importJobs.unshift({
      id: jobId,
      file: fileName,
      type: type as ImportJob["type"],
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
      status: failed ? (added ? "Partial" : "Failed") : "Imported",
      processed: lines.length,
      added,
      updated: 0,
      failed,
    });
    errors.forEach((e, idx) => {
      store.importErrors.push({ id: `ie-${jobId}-${idx}`, jobId, ...e });
    });
  });
  addAuditLog({ userId: user.id, action: "Created", module: "excel", recordRef: fileName, newValue: `${added} added, ${failed} failed` });
  return { jobId, added, failed, errors };
}
