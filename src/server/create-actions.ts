"use server";

import { authorize } from "@/lib/engines/rbac";
import { isControlledOperationAllowed } from "@/lib/engines/calibration";
import { requireUser } from "@/server/auth/session";
import { addAuditLog, getStore, mutateStore, nextNumber } from "@/server/data/store";

export async function createProductionInspection(input: {
  serialNumber: string;
  defectDescription: string;
  classification: "Process Defect" | "Component Defect";
  materialId?: string;
  supplierId?: string;
}) {
  const user = await requireUser();
  if (!authorize(user, "production_inspection", "create")) throw new Error("Not authorized");
  const store = getStore();
  const unit = store.productionUnits.find((u) => u.serialNumber === input.serialNumber);
  if (!unit) throw new Error("Serial number not found in production demo data");
  if (input.classification === "Component Defect" && (!input.materialId || !input.supplierId)) {
    throw new Error("Component defect requires Material PN and Supplier");
  }
  const gauge = store.equipment.find((e) => e.equipmentId === "CAL-0042");
  if (gauge && !isControlledOperationAllowed(gauge.status)) {
    throw new Error(`Controlled inspection blocked — ${gauge.equipmentId} is ${gauge.status}`);
  }
  const number = nextNumber("INSP");
  const eventId = `QE-${Date.now()}`;
  const id = `insp-${Date.now()}`;
  mutateStore((s) => {
    s.qualityEvents.unshift({
      id: eventId,
      sourceEventId: eventId,
      type: input.classification,
      occurredAt: new Date().toISOString(),
      serialNumber: input.serialNumber,
      modelId: unit.modelId,
      lineId: unit.lineId,
      supplierId: input.supplierId ?? null,
      materialId: input.materialId ?? null,
      defectTypeId: "dt-leak",
      description: input.defectDescription,
      departmentId: user.departmentId ?? "d-qa",
      originModule: "production_inspection",
      originRecordId: id,
    });
    s.inspections.unshift({
      id,
      number,
      kind: "Production",
      serialNumber: input.serialNumber,
      orderId: unit.orderId,
      modelId: unit.modelId,
      lineId: unit.lineId,
      materialId: input.materialId ?? null,
      supplierId: input.supplierId ?? null,
      inspectorId: user.id,
      inspectedAt: new Date().toISOString(),
      status: "Draft",
      defectTypeId: "dt-leak",
      defectDescription: input.defectDescription,
      classification: input.classification,
      sourceEventId: eventId,
      notes: "DEMO DATA",
    });
  });
  addAuditLog({ userId: user.id, action: "Created", module: "production_inspection", recordRef: number });
  return id;
}
