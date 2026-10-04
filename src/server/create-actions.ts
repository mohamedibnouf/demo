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

export async function createStandaloneNcr(title: string) {
  const user = await requireUser();
  if (!authorize(user, "production_ncr", "create")) throw new Error("Not authorized");
  const number = nextNumber("NCR");
  const id = `ncr-${Date.now()}`;
  mutateStore((s) => {
    s.ncrs.unshift({
      id,
      number,
      type: "Production NCR",
      sapReference: null,
      source: "Manual / document analysis",
      departmentId: user.departmentId ?? "d-qa",
      severity: "Medium",
      defect: title,
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
  });
  addAuditLog({ userId: user.id, action: "Created", module: "production_ncr", recordRef: number, newValue: "Draft" });
  return id;
}

export async function createCatalogDraft(slug: string): Promise<{ href: string; id: string }> {
  const user = await requireUser();
  const store = getStore();
  const due = new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10);
  const today = new Date().toISOString();
  const unit = store.productionUnits[0];
  const order = store.productionOrders.find((o) => !o.confirmed) ?? store.productionOrders[0];
  const material = store.materials[0];
  const altMaterial = store.materials[1] ?? material;
  const supplier = store.suppliers[0];

  const drafts: Record<string, () => { href: string; id: string; module: string }> = {
    "incoming-inspection": () => {
      if (!authorize(user, "incoming_inspection", "create")) throw new Error("Not authorized");
      const id = `insp-${Date.now()}`;
      const number = nextNumber("INSP");
      mutateStore((s) => {
        s.inspections.unshift({
          id,
          number,
          kind: "Incoming",
          serialNumber: null,
          orderId: null,
          modelId: null,
          lineId: null,
          materialId: material?.id ?? null,
          supplierId: supplier?.id ?? null,
          inspectorId: user.id,
          inspectedAt: today,
          status: "Draft",
          defectTypeId: null,
          defectDescription: "Demo incoming inspection draft",
          classification: null,
          sourceEventId: null,
          notes: "DEMO DATA",
        });
      });
      return { href: `/quality/incoming-inspection/${id}`, id, module: "incoming_inspection" };
    },
    "in-process-inspection": () => {
      if (!authorize(user, "in_process_inspection", "create")) throw new Error("Not authorized");
      const id = `insp-${Date.now()}`;
      const number = nextNumber("INSP");
      mutateStore((s) => {
        s.inspections.unshift({
          id,
          number,
          kind: "In-Process",
          serialNumber: unit?.serialNumber ?? null,
          orderId: unit?.orderId ?? null,
          modelId: unit?.modelId ?? null,
          lineId: unit?.lineId ?? null,
          materialId: null,
          supplierId: null,
          inspectorId: user.id,
          inspectedAt: today,
          status: "Draft",
          defectTypeId: null,
          defectDescription: "Demo in-process inspection draft",
          classification: null,
          sourceEventId: null,
          notes: "DEMO DATA",
        });
      });
      return { href: `/quality/in-process-inspection/${id}`, id, module: "in_process_inspection" };
    },
    "final-inspection": () => {
      if (!authorize(user, "final_inspection", "create")) throw new Error("Not authorized");
      const id = `insp-${Date.now()}`;
      const number = nextNumber("INSP");
      mutateStore((s) => {
        s.inspections.unshift({
          id,
          number,
          kind: "Final",
          serialNumber: unit?.serialNumber ?? null,
          orderId: unit?.orderId ?? null,
          modelId: unit?.modelId ?? null,
          lineId: unit?.lineId ?? null,
          materialId: null,
          supplierId: null,
          inspectorId: user.id,
          inspectedAt: today,
          status: "Draft",
          defectTypeId: null,
          defectDescription: "Demo final inspection draft",
          classification: null,
          sourceEventId: null,
          notes: "DEMO DATA",
        });
      });
      return { href: `/quality/final-inspection/${id}`, id, module: "final_inspection" };
    },
    "production-ncr": () => {
      if (!authorize(user, "production_ncr", "create")) throw new Error("Not authorized");
      const id = `ncr-${Date.now()}`;
      const number = nextNumber("NCR");
      mutateStore((s) => {
        s.ncrs.unshift({
          id,
          number,
          type: "Production NCR",
          sapReference: null,
          source: "Manual draft",
          departmentId: user.departmentId ?? "d-qa",
          severity: "Medium",
          defect: "Demo production nonconformity draft",
          containment: "Hold pending review",
          rcaMethod: null,
          rca: null,
          correctiveAction: null,
          preventiveAction: null,
          ownerId: user.id,
          dueDate: due,
          disposition: "Hold",
          status: "Draft",
          sourceEventId: null,
          supplierId: null,
          voidReason: null,
          createdBy: user.id,
          createdAt: today,
          updatedAt: today,
        });
      });
      return { href: `/quality/production-ncr/${id}`, id, module: "production_ncr" };
    },
    "internal-ncr": () => {
      if (!authorize(user, "internal_ncr", "create")) throw new Error("Not authorized");
      const id = `ncr-${Date.now()}`;
      const number = nextNumber("NCR");
      mutateStore((s) => {
        s.ncrs.unshift({
          id,
          number,
          type: "Internal NCR",
          sapReference: null,
          source: "Manual draft",
          departmentId: user.departmentId ?? "d-qa",
          severity: "Low",
          defect: "Demo internal process / document nonconformity",
          containment: "Document hold",
          rcaMethod: null,
          rca: null,
          correctiveAction: null,
          preventiveAction: null,
          ownerId: user.id,
          dueDate: due,
          disposition: null,
          status: "Draft",
          sourceEventId: null,
          supplierId: null,
          voidReason: null,
          createdBy: user.id,
          createdAt: today,
          updatedAt: today,
        });
      });
      return { href: `/quality/internal-ncr/${id}`, id, module: "internal_ncr" };
    },
    "supplier-ncr": () => {
      if (!authorize(user, "supplier_ncr", "create")) throw new Error("Not authorized");
      const id = `sncr-${Date.now()}`;
      const number = nextNumber("SNCR");
      mutateStore((s) => {
        s.supplierNcrs.unshift({
          id,
          number,
          ncrId: null,
          sourceEventId: `QE-${Date.now()}`,
          supplierId: user.supplierId ?? supplier?.id ?? "s-alpha",
          materialId: material?.id ?? "mat-exp",
          defect: "Demo supplier nonconformity draft",
          status: "Issued",
          issuedAt: today,
          ownerId: user.id,
          dueDate: due,
        });
      });
      return { href: `/quality/supplier-ncr/${id}`, id, module: "supplier_ncr" };
    },
    capa: () => {
      if (!authorize(user, "capa", "create")) throw new Error("Not authorized");
      const id = `capa-${Date.now()}`;
      const number = nextNumber("CAPA");
      mutateStore((s) => {
        s.capas.unshift({
          id,
          number,
          originModule: "capa",
          originRecordId: id,
          originLabel: "Manual CAPA draft",
          sourceEventId: null,
          problem: "Demo CAPA draft — confirm problem statement",
          rootCause: "",
          containment: "",
          correctiveAction: "",
          preventiveAction: "",
          ownerId: user.id,
          dueDate: due,
          evidence: null,
          effectiveness: null,
          status: "Draft",
          createdAt: today,
        });
      });
      return { href: `/quality/capa/${id}`, id, module: "capa" };
    },
    deviation: () => {
      if (!authorize(user, "deviation", "create")) throw new Error("Not authorized");
      if (!order || order.confirmed) throw new Error("No unconfirmed production order is available for a deviation draft");
      const id = `dev-${Date.now()}`;
      const number = nextNumber("DEV");
      mutateStore((s) => {
        s.deviations.unshift({
          id,
          number,
          orderId: order.id,
          originalMaterialId: material?.id ?? "mat-exp",
          alternativeMaterialId: altMaterial?.id ?? "mat-exp",
          originalQty: 1,
          alternativeQty: 1,
          costDifference: 0,
          reason: "Demo deviation draft",
          approval: user.fullName,
          validFrom: today.slice(0, 10),
          validTo: due,
          status: "Draft",
          createdBy: user.id,
          createdAt: today,
        });
      });
      return { href: `/quality/deviation/${id}`, id, module: "deviation" };
    },
    "sample-evaluation": () => {
      if (!authorize(user, "sample_evaluation", "create")) throw new Error("Not authorized");
      const id = `se-${Date.now()}`;
      const number = nextNumber("SE");
      mutateStore((s) => {
        s.sampleEvaluations.unshift({
          id,
          number,
          supplierId: supplier?.id ?? "s-alpha",
          materialId: material?.id ?? "mat-exp",
          status: "Request",
          requestedBy: user.id,
          requestedAt: today,
          notes: "Demo sample evaluation draft",
          finalDecision: null,
        });
      });
      return { href: `/quality/sample-evaluation/${id}`, id, module: "sample_evaluation" };
    },
    ecn: () => {
      if (!authorize(user, "ecn", "create")) throw new Error("Not authorized");
      const id = `ecn-${Date.now()}`;
      const number = nextNumber("ECN");
      mutateStore((s) => {
        s.ecns.unshift({
          id,
          number,
          oldMaterialId: material?.id ?? "mat-exp",
          newMaterialId: altMaterial?.id ?? "mat-exp",
          modelId: unit?.modelId ?? "m-ahu-p",
          stockStrategy: "Use Current Stock First",
          status: "Draft",
          oldStock: 0,
          newMaterialAvailable: false,
          firstOrderId: null,
          implementedAt: null,
          implementedBy: null,
          confirmedBy: null,
          receivingRef: null,
          remarks: "Demo ECN draft",
          createdAt: today,
        });
      });
      return { href: `/quality/ecn/${id}`, id, module: "ecn" };
    },
    rework: () => {
      if (!authorize(user, "rework", "create")) throw new Error("Not authorized");
      const id = `rw-${Date.now()}`;
      const number = nextNumber("RW");
      mutateStore((s) => {
        s.reworks.unshift({
          id,
          number,
          sourceEventId: `QE-${Date.now()}`,
          serialNumber: unit?.serialNumber ?? "SN-DEMO",
          attempt: 1,
          date: today,
          reason: "Demo rework draft",
          action: "Pending assignment",
          ownerId: user.id,
          result: "Pending",
          status: "HOLD",
        });
      });
      return { href: `/quality/rework/${id}`, id, module: "rework" };
    },
    rrr: () => {
      if (!authorize(user, "rrr", "create")) throw new Error("Not authorized");
      const id = `rrr-${Date.now()}`;
      const number = nextNumber("RRR");
      mutateStore((s) => {
        s.rrrRecords.unshift({
          id,
          number,
          source: "Manual draft",
          sourceEventId: null,
          materialOrUnit: unit?.serialNumber ?? material?.partNumber ?? "DEMO",
          reason: "Demo RRR draft",
          quantity: 1,
          cost: 0,
          disposition: "Hold",
          approval: user.fullName,
          evidence: "",
          status: "Draft",
          createdAt: today,
        });
      });
      return { href: `/quality/rrr/${id}`, id, module: "rrr" };
    },
    objectives: () => {
      if (!authorize(user, "ims_objective", "create")) throw new Error("Not authorized");
      const id = `obj-${Date.now()}`;
      mutateStore((s) => {
        s.imsObjectives.unshift({
          id,
          departmentId: user.departmentId ?? "d-qa",
          standard: "ISO 9001",
          objective: "Demo IMS objective draft",
          kpi: "TBD",
          target: "TBD",
          frequency: "Monthly",
          ownerId: user.id,
          actual: "—",
          autoLinkedKpi: null,
          achievement: "On Track",
          actionPlan: "Confirm target and KPI link",
          revision: 1,
        });
      });
      return { href: `/ims/objectives/${id}`, id, module: "ims_objective" };
    },
    "risk-opportunity": () => {
      if (!authorize(user, "risk_register", "create")) throw new Error("Not authorized");
      const id = `risk-${Date.now()}`;
      mutateStore((s) => {
        s.riskRegister.unshift({
          id,
          departmentId: user.departmentId ?? "d-qa",
          kind: "Risk",
          title: "Demo risk draft",
          assessment: "Requires confirmation",
          existingControls: "",
          probability: 3,
          impact: 3,
          residualProbability: 3,
          residualImpact: 3,
          ownerId: user.id,
          targetDate: due,
          review: "Pending",
          effectiveness: "Draft",
          linkedObjectiveId: null,
        });
      });
      return { href: `/ims/risk-opportunity/${id}`, id, module: "risk_register" };
    },
    "annual-audit-plan": () => {
      if (!authorize(user, "audit", "create")) throw new Error("Not authorized");
      const id = `ap-${Date.now()}`;
      mutateStore((s) => {
        s.auditPlans.unshift({
          id,
          year: 2026,
          departmentId: user.departmentId ?? "d-qa",
          process: "Demo planned process audit",
          standard: "ISO 9001",
          plannedDate: due,
          auditorId: user.id,
          auditeeId: user.id,
          type: "Internal",
          status: "Planned",
        });
      });
      return { href: `/ims/annual-audit-plan/${id}`, id, module: "audit" };
    },
    "internal-audit": () => makeAudit("Internal", "internal-audit"),
    "external-audit": () => makeAudit("External", "external-audit"),
    "customer-audit": () => makeAudit("Customer", "customer-audit"),
    "supplier-audit": () => makeAudit("Supplier", "supplier-audit"),
    "audit-findings": () => {
      if (!authorize(user, "audit", "create")) throw new Error("Not authorized");
      const id = `af-${Date.now()}`;
      const number = nextNumber("AF");
      const audit = store.audits[0];
      mutateStore((s) => {
        s.auditFindings.unshift({
          id,
          number,
          auditId: audit?.id ?? "aud-3",
          standard: "ISO 9001",
          clause: "10.2",
          procedure: "QP-CAPA-01",
          departmentId: user.departmentId ?? "d-qa",
          finding: "Demo audit finding draft",
          evidence: "",
          classification: "OFI",
          ownerId: user.id,
          targetDate: due,
          action: "",
          verification: null,
          status: "Open",
        });
      });
      return { href: `/ims/audit-findings/${id}`, id, module: "audit" };
    },
    "management-review": () => {
      if (!authorize(user, "management_review", "create")) throw new Error("Not authorized");
      const id = `mr-${Date.now()}`;
      const number = nextNumber("MR");
      mutateStore((s) => {
        s.managementReviews.unshift({
          id,
          number,
          meeting: "Demo management review draft",
          period: "2026 Q4",
          attendees: user.fullName,
          inputs: "Confirm IMS inputs",
          decisions: "",
          createdAt: today,
        });
      });
      return { href: `/ims/management-review/${id}`, id, module: "management_review" };
    },
  };

  function makeAudit(type: "Internal" | "External" | "Customer" | "Supplier", path: string) {
    if (!authorize(user, "audit", "create")) throw new Error("Not authorized");
    const id = `aud-${Date.now()}`;
    const prefix = type === "Internal" ? "AUD" : type === "External" ? "EXT" : type === "Customer" ? "CAU" : "SAU";
    const number = nextNumber(prefix);
    mutateStore((s) => {
      s.audits.unshift({
        id,
        number,
        planId: s.auditPlans[0]?.id ?? "ap-d-qa-0",
        type,
        date: new Date().toISOString().slice(0, 10),
        status: "Planned",
        scope: `Demo ${type.toLowerCase()} audit draft`,
      });
    });
    return { href: `/ims/${path}/${id}`, id, module: "audit" };
  }

  const factory = drafts[slug];
  if (!factory) throw new Error("Create is not available for this module in the demo");
  const created = factory();
  addAuditLog({ userId: user.id, action: "Created", module: created.module, recordRef: created.id, newValue: "Draft" });
  return { href: created.href, id: created.id };
}

export async function createLogbookDraft(type: "CPU Coil" | "AHU Coil" | "Paint Shop") {
  const user = await requireUser();
  if (!authorize(user, "logbook", "create")) throw new Error("Not authorized");
  const id = `lb-${Date.now()}`;
  mutateStore((s) => {
    s.logbooks.unshift({
      id,
      type,
      date: new Date().toISOString().slice(0, 10),
      lineId: type === "Paint Shop" ? "l-paint" : type === "AHU Coil" ? "l-ahu" : "l-cpu",
      shift: "A",
      performedBy: user.id,
      reviewedBy: null,
      status: "Open",
      remarks: "Demo logbook opened today",
    });
  });
  addAuditLog({ userId: user.id, action: "Created", module: "logbook", recordRef: id, newValue: type });
  return id;
}

export async function createDocumentStub(name: string) {
  const user = await requireUser();
  if (!authorize(user, "documents", "create") && !authorize(user, "documents", "view")) throw new Error("Not authorized");
  const id = `doc-${Date.now()}`;
  const now = new Date().toISOString();
  const filename = name || `demo-upload-${id}.pdf`;
  mutateStore((s) => {
    s.documents.unshift({
      id,
      documentNumber: nextNumber("DOC"),
      title: filename,
      name: filename,
      type: "PDF",
      originalFilename: filename,
      storedFilename: filename,
      mimeType: "application/pdf",
      extension: ".pdf",
      sizeBytes: 0,
      sizeLabel: "0 B",
      storageBucket: "samco-documents-local",
      storagePath: "",
      checksum: `stub-${id}`,
      module: "documents",
      recordType: null,
      recordId: null,
      uploadedAt: now,
      uploadedBy: user.id,
      status: "Uploaded",
      processingStatus: "processed",
      processedAt: now,
      createdAt: now,
      updatedAt: now,
      summary: "Metadata-only stub. Use Upload & Analyze to store a real file.",
    });
  });
  return id;
}
