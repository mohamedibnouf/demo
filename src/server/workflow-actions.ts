"use server";

import { revalidatePath } from "next/cache";
import { authorize, isReadOnlyRole } from "@/lib/engines/rbac";
import { canStartReworkAttempt } from "@/lib/engines/rework";
import { isControlledOperationAllowed } from "@/lib/engines/calibration";
import { isDeviationAllowed } from "@/lib/engines/deviation";
import { requireUser } from "@/server/auth/session";
import { addAuditLog, getStore, mutateStore, nextNumber, resetStore } from "@/server/data/store";
import type { PermissionAction } from "@/types";

function guard(module: string, action: PermissionAction) {
  return async () => {
    const user = await requireUser();
    if (isReadOnlyRole(user.role) && action !== "view" && action !== "export") {
      throw new Error("Management is read-only on operational records");
    }
    if (!authorize(user, module, action)) throw new Error("Not authorized");
    return user;
  };
}

export async function transitionRecord(input: {
  collection:
    | "ncrs"
    | "capas"
    | "supplierNcrs"
    | "complaints"
    | "inspections"
    | "sampleEvaluations"
    | "ecns"
    | "deviations"
    | "reworks"
    | "rrrRecords"
    | "auditFindings"
    | "tasks";
  id: string;
  field?: string;
  value: string;
  module: string;
  action: PermissionAction;
  path: string;
}) {
  const user = await (await guard(input.module, input.action))();
  mutateStore((store) => {
    const list = store[input.collection] as unknown as Array<Record<string, unknown>>;
    const row = list.find((r) => r.id === input.id);
    if (!row) throw new Error("Record not found");
    const field = input.field ?? "status";
    const previous = String(row[field] ?? "");
    row[field] = input.value;
    if ("updatedAt" in row) row.updatedAt = new Date().toISOString();
    store.activities.unshift({
      id: `act-${Date.now()}`,
      type: `${input.action} ${input.collection}`,
      recordRef: String(row.number ?? row.id),
      href: input.path,
      description: `${user.fullName} set ${field} to ${input.value}`,
      actorId: user.id,
      createdAt: new Date().toISOString(),
    });
    addAuditLog({
      userId: user.id,
      action: input.action === "close" ? "Closed" : input.value === "Void" ? "Void" : "Edited",
      module: input.module,
      recordRef: String(row.number ?? row.id),
      previousValue: previous,
      newValue: input.value,
    });
  });
  revalidatePath(input.path);
  revalidatePath("/");
}

export async function voidRecord(collection: "ncrs" | "rrrRecords" | "deviations" | "ecns", id: string, reason: string, module: string, path: string) {
  const user = await (await guard(module, "close"))();
  if (!reason.trim()) throw new Error("Void/cancel requires a reason");
  mutateStore((store) => {
    const row = (store[collection] as unknown as Array<Record<string, unknown>>).find((r) => r.id === id);
    if (!row) throw new Error("Record not found");
    row.status = collection === "ncrs" ? "Void" : "Cancelled";
    row.voidReason = reason;
    addAuditLog({
      userId: user.id,
      action: "Void",
      module,
      recordRef: String(row.number ?? id),
      previousValue: "Active",
      newValue: `${String(row.status)}: ${reason}`,
    });
  });
  revalidatePath(path);
}

export async function createNcrFromInspection(inspectionId: string) {
  const user = await (await guard("production_ncr", "create"))();
  const store = getStore();
  const insp = store.inspections.find((i) => i.id === inspectionId);
  if (!insp) throw new Error("Inspection not found");
  const number = nextNumber("NCR");
  const id = `ncr-${Date.now()}`;
  mutateStore((s) => {
    s.ncrs.unshift({
      id,
      number,
      type: insp.classification === "Component Defect" ? "Supplier-related NCR" : "Production NCR",
      sapReference: null,
      source: insp.number,
      departmentId: user.departmentId ?? "d-qa",
      severity: "High",
      defect: insp.defectDescription ?? "Inspection failure",
      containment: "Hold unit pending disposition",
      rcaMethod: null,
      rca: null,
      correctiveAction: null,
      preventiveAction: null,
      ownerId: user.id,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      disposition: "Hold",
      status: "Draft",
      sourceEventId: insp.sourceEventId,
      supplierId: insp.supplierId,
      voidReason: null,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  addAuditLog({ userId: user.id, action: "Created", module: "production_ncr", recordRef: number, newValue: "Draft from inspection" });
  return id;
}

export async function createCapaFrom(originModule: string, originRecordId: string, originLabel: string, problem: string, sourceEventId: string | null) {
  const user = await (await guard("capa", "create"))();
  const number = nextNumber("CAPA");
  const id = `capa-${Date.now()}`;
  mutateStore((s) => {
    s.capas.unshift({
      id,
      number,
      originModule,
      originRecordId,
      originLabel,
      sourceEventId,
      problem,
      rootCause: "",
      containment: "",
      correctiveAction: "",
      preventiveAction: "",
      ownerId: user.id,
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
      evidence: null,
      effectiveness: null,
      status: "Draft",
      createdAt: new Date().toISOString(),
    });
  });
  return id;
}

export async function submitInspection(id: string) {
  const user = await (await guard("production_inspection", "submit"))();
  const store = getStore();
  const insp = store.inspections.find((i) => i.id === id);
  if (!insp) throw new Error("Inspection not found");
  if (insp.kind !== "Incoming") {
    const gauge = store.equipment.find((e) => e.equipmentId === "CAL-0042");
    if (gauge && !isControlledOperationAllowed(gauge.status)) {
      throw new Error(`Controlled operation blocked — ${gauge.equipmentId} is ${gauge.status}`);
    }
  }
  await transitionRecord({
    collection: "inspections",
    id,
    value: "Submitted",
    module: "production_inspection",
    action: "submit",
    path: `/quality/production-inspection/${id}`,
  });
  return user.id;
}

export async function startRework(sourceEventId: string, serialNumber: string) {
  const user = await (await guard("rework", "create"))();
  const store = getStore();
  const existing = store.reworks.filter((r) => r.sourceEventId === sourceEventId).length;
  const gate = canStartReworkAttempt(existing);
  if (!gate.allowed || !gate.nextAttempt) {
    throw new Error("Third rework attempt is blocked. Management decision required.");
  }
  const number = nextNumber("RW");
  const id = `rw-${Date.now()}`;
  mutateStore((s) => {
    s.reworks.unshift({
      id,
      number,
      sourceEventId,
      serialNumber,
      attempt: gate.nextAttempt!,
      date: new Date().toISOString(),
      reason: "Quality rework",
      action: `Rework attempt ${gate.nextAttempt}`,
      ownerId: user.id,
      result: "Pending",
      status: "In Rework",
    });
  });
  return id;
}

export async function createDeviation(orderId: string, reason: string) {
  const user = await (await guard("deviation", "create"))();
  const order = getStore().productionOrders.find((o) => o.id === orderId);
  if (!order) throw new Error("Production order not found");
  if (!isDeviationAllowed(order.confirmed)) {
    throw new Error("Deviation is not allowed after the production order is confirmed");
  }
  const number = nextNumber("DEV");
  const id = `dev-${Date.now()}`;
  mutateStore((s) => {
    s.deviations.unshift({
      id,
      number,
      orderId,
      originalMaterialId: s.materials[0]!.id,
      alternativeMaterialId: s.materials[1]!.id,
      originalQty: 1,
      alternativeQty: 1,
      costDifference: 0,
      reason,
      approval: user.fullName,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      status: "Draft",
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    });
  });
  return id;
}

export async function createComplaintDraft(input: {
  modelId: string;
  serialNumber: string;
  type: string;
  description: string;
  quantity: number;
}) {
  const user = await (await guard("customer_complaint", "create"))();
  const store = getStore();
  const unit = store.productionUnits.find((u) => u.serialNumber === input.serialNumber);
  if (!unit) {
    throw new Error("Serial number was not found in production demo data");
  }
  const number = nextNumber("CC");
  const id = `cc-${Date.now()}`;
  mutateStore((s) => {
    s.complaints.unshift({
      id,
      number,
      customerId: user.customerId ?? s.customers[0]!.id,
      modelId: input.modelId || unit.modelId,
      serialNumber: input.serialNumber,
      type: input.type,
      description: input.description,
      quantity: input.quantity,
      status: "Submitted",
      requestedInfo: null,
      decision: null,
      finalResponse: null,
      replacementStatus: "Not requested",
      internalRca: null,
      sourceEventId: null,
      ownerId: "u-qe",
      submittedAt: new Date().toISOString(),
      submittedBy: user.id,
    });
  });
  return id;
}

export async function submitSupplierResponse(supplierNcrId: string, payload: {
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  completionDate: string;
  evidence: string;
}) {
  const user = await (await guard("supplier_ncr", "submit"))();
  const store = getStore();
  const sncr = store.supplierNcrs.find((s) => s.id === supplierNcrId);
  if (!sncr) throw new Error("Supplier NCR not found");
  if (user.role === "Supplier" && user.supplierId !== sncr.supplierId) {
    throw new Error("Supplier isolation: record does not belong to your organization");
  }
  mutateStore((s) => {
    s.supplierNcrResponses.unshift({
      id: `sncrr-${Date.now()}`,
      supplierNcrId,
      ...payload,
      submittedAt: new Date().toISOString(),
      submittedBy: user.id,
      reviewDecision: null,
      reviewNotes: null,
    });
    const rec = s.supplierNcrs.find((r) => r.id === supplierNcrId);
    if (rec) rec.status = "Supplier Submitted";
  });
}

export async function reviewSupplierResponse(supplierNcrId: string, decision: "Accepted" | "Rejected", notes: string) {
  const user = await (await guard("supplier_ncr", "review"))();
  mutateStore((s) => {
    const rec = s.supplierNcrs.find((r) => r.id === supplierNcrId);
    const resp = s.supplierNcrResponses.find((r) => r.supplierNcrId === supplierNcrId);
    if (rec) rec.status = decision === "Accepted" ? "Accepted" : "Rejected — Revision Required";
    if (resp) {
      resp.reviewDecision = decision;
      resp.reviewNotes = notes;
    }
    addAuditLog({
      userId: user.id,
      action: decision === "Accepted" ? "Approved" : "Rejected",
      module: "supplier_ncr",
      recordRef: rec?.number ?? supplierNcrId,
      newValue: notes,
    });
  });
}

export async function createDraftFromAnalysis(kind: "task" | "risk" | "ncr" | "capa", title: string) {
  const user = await requireUser();
  if (kind === "task") {
    const id = `tsk-${Date.now()}`;
    mutateStore((s) => {
      s.tasks.unshift({
        id,
        title: `[DRAFT] ${title}`,
        module: "documents",
        recordRef: "DOC-ANALYSIS",
        recordHref: "/documents/analyze",
        assigneeId: user.id,
        departmentId: user.departmentId,
        priority: "Medium",
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        status: "Open",
      });
    });
    return { href: "/tasks", id };
  }
  if (kind === "risk") {
    const id = `risk-${Date.now()}`;
    mutateStore((s) => {
      s.riskRegister.unshift({
        id,
        departmentId: user.departmentId ?? "d-qa",
        kind: "Risk",
        title: `[DRAFT] ${title}`,
        assessment: "Created from document analysis — requires confirmation",
        existingControls: "",
        probability: 3,
        impact: 3,
        residualProbability: 3,
        residualImpact: 3,
        ownerId: user.id,
        targetDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
        review: "Pending confirmation",
        effectiveness: "Draft",
        linkedObjectiveId: null,
      });
    });
    return { href: `/ims/risk-opportunity/${id}`, id };
  }
  if (kind === "ncr") {
    const id = await createCapaFrom("documents", "analysis", "Document analysis", title, null);
    return { href: `/quality/capa/${id}`, id };
  }
  const id = await createCapaFrom("documents", "analysis", "Document analysis", title, null);
  return { href: `/quality/capa/${id}`, id };
}

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  mutateStore((s) => {
    const n = s.notifications.find((x) => x.id === id && x.recipientId === user.id);
    if (n) n.read = true;
  });
}

export async function resetDemoDataAction() {
  const user = await requireUser();
  if (user.role !== "Admin") throw new Error("Only Admin may reset demo data");
  resetStore();
  addAuditLog({ userId: user.id, action: "Master Data Changed", module: "admin", recordRef: "DEMO_STORE", newValue: "Reset" });
}

export async function completeTask(id: string) {
  await transitionRecord({
    collection: "tasks",
    id,
    value: "Completed",
    module: "tasks",
    action: "edit",
    path: "/tasks",
  });
}
