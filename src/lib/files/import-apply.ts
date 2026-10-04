import { randomUUID } from "crypto";
import type { DemoStore, ImportProfileKey, SessionUser } from "@/types";

export function applyImportedRow(
  store: DemoStore,
  user: SessionUser,
  profile: ImportProfileKey,
  values: Record<string, string>,
  documentId: string,
): { id: string; type: string; updated: boolean } {
  if (profile === "PRODUCTION_DATA") return importProduction(store, user, values, documentId);
  if (profile === "RECEIVING_DATA") return importReceiving(store, values);
  if (profile === "COPQ_DATA") return importCopq(store, values);
  if (profile === "NCR_DATA") return importNcrDraft(store, user, values, documentId);
  return { id: `gen-${randomUUID()}`, type: "generic_row", updated: false };
}

export function isDuplicateImport(existingChecksums: { checksum: string; profile: string; status: string }[], checksum: string, profile: string) {
  return existingChecksums.some((item) => item.status === "imported" && item.checksum === checksum && item.profile === profile);
}

function importProduction(store: DemoStore, user: SessionUser, values: Record<string, string>, documentId: string) {
  const orderNo = values.production_order ?? "";
  const lineCode = values.line ?? "";
  const date = values.date ?? "";
  const serial = values.serial_number ?? "";
  const order = store.productionOrders.find((o) => o.number.toLowerCase() === orderNo.toLowerCase());
  const model =
    store.models.find((m) => m.code.toLowerCase() === (values.model ?? "").toLowerCase()) ??
    store.models.find((m) => m.id === order?.modelId);
  const line = store.productionLines.find((l) => l.code.toLowerCase() === lineCode.toLowerCase() || l.name.toLowerCase() === lineCode.toLowerCase());
  if (!order || !model || !line) throw new Error("Production master data could not be resolved during import.");
  const qty = Number(values.quantity_produced || 0);
  const defectQty = Number(values.defect_quantity || 0);
  const existing = store.productionRecords.find((r) => r.date === date && r.orderId === order.id && r.lineId === line.id);
  let id: string;
  let updated = false;
  if (existing) {
    existing.quantityProduced += qty;
    existing.goodQty += Math.max(0, qty - defectQty);
    id = existing.id;
    updated = true;
  } else {
    id = `pr-imp-${randomUUID()}`;
    store.productionRecords.push({
      id,
      date,
      orderId: order.id,
      modelId: model.id,
      lineId: line.id,
      quantityProduced: qty,
      goodQty: Math.max(0, qty - defectQty),
    });
  }
  if (serial && !store.productionUnits.some((u) => u.serialNumber === serial)) {
    store.productionUnits.push({
      id: `pu-imp-${randomUUID()}`,
      serialNumber: serial,
      orderId: order.id,
      modelId: model.id,
      lineId: line.id,
      producedAt: date,
    });
  }
  if (defectQty > 0) {
    const already = store.qualityEvents.find(
      (e) =>
        e.serialNumber === (serial || null) &&
        e.originModule === "excel_import" &&
        e.description === (values.defect_type || "Imported defect"),
    );
    if (!already) {
      const sourceEventId = `QE-IMP-${randomUUID()}`;
      store.qualityEvents.push({
        id: sourceEventId,
        sourceEventId,
        type: /process/i.test(values.process_defect || "") || values.process_defect === "Yes" ? "Process Defect" : "Component Defect",
        occurredAt: `${date}T08:00:00.000Z`,
        serialNumber: serial || null,
        modelId: model.id,
        lineId: line.id,
        supplierId: null,
        materialId: null,
        defectTypeId: store.defectTypes.find((d) => d.name.toLowerCase() === (values.defect_type || "").toLowerCase())?.id ?? null,
        description: values.defect_type || "Imported production defect",
        departmentId: user.departmentId ?? "d-qa",
        originModule: "excel_import",
        originRecordId: documentId,
      });
    }
  }
  return { id, type: "production_record", updated };
}

function importReceiving(store: DemoStore, values: Record<string, string>) {
  const supplierName = values.supplier ?? "";
  const materialPn = values.material_pn ?? "";
  const supplier = store.suppliers.find((s) => s.code.toLowerCase() === supplierName.toLowerCase() || s.name.toLowerCase() === supplierName.toLowerCase());
  const material = store.materials.find((m) => m.partNumber.toLowerCase() === materialPn.toLowerCase());
  if (!supplier || !material) throw new Error("Receiving master data could not be resolved during import.");
  const id = `rr-imp-${randomUUID()}`;
  store.receivingRecords.push({
    id,
    date: values.date ?? "",
    supplierId: supplier.id,
    materialId: material.id,
    quantity: Number(values.quantity || 0),
    reference: values.reference || "Excel import",
  });
  return { id, type: "receiving_record", updated: false };
}

function importCopq(store: DemoStore, values: Record<string, string>) {
  const departmentName = values.department ?? "";
  const department =
    store.departments.find((d) => d.name.toLowerCase() === departmentName.toLowerCase() || d.code.toLowerCase() === departmentName.toLowerCase()) ??
    store.departments[0];
  const modelCode = values.model ?? "";
  const model = modelCode ? store.models.find((m) => m.code.toLowerCase() === modelCode.toLowerCase()) : null;
  const id = `copq-imp-${randomUUID()}`;
  store.copqRecords.push({
    id,
    date: values.date ?? "",
    departmentId: department?.id ?? "d-qa",
    modelId: model?.id ?? null,
    scrapCost: Number(values.scrap_cost || 0),
    description: values.description || "Imported COPQ",
    rrrId: null,
  });
  return { id, type: "copq_record", updated: false };
}

function importNcrDraft(store: DemoStore, user: SessionUser, values: Record<string, string>, documentId: string) {
  const year = 2026;
  let seq = store.sequences.find((s) => s.prefix === "NCR" && s.year === year);
  if (!seq) {
    seq = { id: "seq-NCR", prefix: "NCR", year, nextValue: 1, padding: 4 };
    store.sequences.push(seq);
  }
  const number = `NCR-${year}-${String(seq.nextValue).padStart(seq.padding, "0")}`;
  seq.nextValue += 1;
  const id = `ncr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  store.ncrs.unshift({
    id,
    number,
    type: "Production NCR",
    sapReference: null,
    source: values.source || "Excel import",
    departmentId: user.departmentId ?? "d-qa",
    severity: /critical/i.test(values.severity ?? "") ? "Critical" : /high/i.test(values.severity ?? "") ? "High" : /low/i.test(values.severity ?? "") ? "Low" : "Medium",
    defect: values.defect ?? "Imported defect",
    containment: "Hold pending quality review",
    rcaMethod: null,
    rca: null,
    correctiveAction: null,
    preventiveAction: null,
    ownerId: user.id,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    disposition: "Hold",
    status: "Draft",
    sourceEventId: null,
    supplierId: null,
    voidReason: null,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  store.documentLinks.unshift({
    id: `dl-${id}`,
    documentId,
    recordType: "production_ncr",
    recordId: id,
    recordRef: number,
    createdAt: new Date().toISOString(),
    createdBy: user.id,
  });
  return { id, type: "production_ncr", updated: false };
}
