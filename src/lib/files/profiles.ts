import type { ImportProfileKey } from "@/types";
import { normalizeHeader } from "./excel-parser";

export const SAMCO_FIELDS = {
  PRODUCTION_DATA: [
    "production_order",
    "serial_number",
    "model",
    "line",
    "date",
    "shift",
    "quantity_produced",
    "defect_quantity",
    "process_defect",
    "defect_type",
    "inspector",
    "status",
  ],
  RECEIVING_DATA: ["date", "supplier", "material_pn", "quantity", "reference"],
  COPQ_DATA: ["date", "department", "scrap_cost", "description", "model"],
  NCR_DATA: ["source", "defect", "severity", "model", "serial_number"],
  GENERIC_EXCEL: [],
} as const;

export const REQUIRED_FIELDS: Record<ImportProfileKey, string[]> = {
  PRODUCTION_DATA: ["production_order", "model", "line", "date", "quantity_produced"],
  RECEIVING_DATA: ["date", "supplier", "material_pn", "quantity"],
  COPQ_DATA: ["date", "department", "scrap_cost"],
  NCR_DATA: ["source", "defect", "severity"],
  GENERIC_EXCEL: [],
};

export const FIELD_ALIASES: Record<string, string> = {
  production_date: "date",
  date: "date",
  production_order: "production_order",
  order: "production_order",
  po: "production_order",
  serial_number: "serial_number",
  serial: "serial_number",
  product: "model",
  product_model: "model",
  model: "model",
  line: "line",
  station: "line",
  shift: "shift",
  quantity: "quantity_produced",
  quantity_produced: "quantity_produced",
  qty: "quantity_produced",
  defect_quantity: "defect_quantity",
  defect_qty: "defect_quantity",
  process_defect: "process_defect",
  defect_type: "defect_type",
  inspector: "inspector",
  status: "status",
  supplier: "supplier",
  material_pn: "material_pn",
  material: "material_pn",
  part_number: "material_pn",
  reference: "reference",
  department: "department",
  scrap_cost: "scrap_cost",
  description: "description",
  source: "source",
  defect: "defect",
  severity: "severity",
};

export const PROFILE_LABELS: Record<ImportProfileKey, string> = {
  PRODUCTION_DATA: "Production",
  RECEIVING_DATA: "Receiving",
  COPQ_DATA: "COPQ",
  NCR_DATA: "NCR",
  GENERIC_EXCEL: "Generic Excel",
};

export const LEGACY_FILE_TYPE: Record<Exclude<ImportProfileKey, "GENERIC_EXCEL">, "Production File" | "Receiving File" | "COPQ File" | "NCR File"> = {
  PRODUCTION_DATA: "Production File",
  RECEIVING_DATA: "Receiving File",
  COPQ_DATA: "COPQ File",
  NCR_DATA: "NCR File",
};

export interface ProfileDetection {
  profile: ImportProfileKey;
  confidence: number;
  mapping: Record<string, string>;
  autoSelected: boolean;
}

export function suggestedMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const field = FIELD_ALIASES[normalized];
    if (field) mapping[normalized] = field;
  }
  return mapping;
}

export function detectImportProfile(headers: string[]): ProfileDetection {
  const mapping = suggestedMapping(headers);
  const mapped = new Set(Object.values(mapping));
  const scores = (Object.keys(REQUIRED_FIELDS) as ImportProfileKey[])
    .filter((key) => key !== "GENERIC_EXCEL")
    .map((profile) => {
      const required = REQUIRED_FIELDS[profile];
      const matched = required.filter((field) => mapped.has(field)).length;
      return { profile, confidence: required.length ? matched / required.length : 0 };
    })
    .sort((a, b) => b.confidence - a.confidence);
  const best = scores[0];
  if (!best || best.confidence < 0.7) {
    return { profile: "GENERIC_EXCEL", confidence: best?.confidence ?? 0, mapping, autoSelected: false };
  }
  return { profile: best.profile, confidence: best.confidence, mapping, autoSelected: true };
}

export function applyMapping(row: Record<string, string>, mapping: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [source, target] of Object.entries(mapping)) {
    if (!target) continue;
    next[target] = row[source] ?? "";
  }
  return next;
}
