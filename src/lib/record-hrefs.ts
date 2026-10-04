import type { DemoStore } from "@/types";

export function hrefForRef(store: DemoStore, ref: string): string | null {
  const token = ref.trim();
  if (!token) return null;

  const ncr = store.ncrs.find((r) => r.number === token || r.id === token);
  if (ncr) {
    return ncr.type === "Internal NCR" ? `/quality/internal-ncr/${ncr.id}` : `/quality/production-ncr/${ncr.id}`;
  }
  const capa = store.capas.find((r) => r.number === token || r.id === token);
  if (capa) return `/quality/capa/${capa.id}`;
  const sncr = store.supplierNcrs.find((r) => r.number === token || r.id === token);
  if (sncr) return `/quality/supplier-ncr/${sncr.id}`;
  const complaint = store.complaints.find((r) => r.number === token || r.id === token);
  if (complaint) return `/quality/customer-complaints/${complaint.id}`;
  const inspection = store.inspections.find((r) => r.number === token || r.id === token);
  if (inspection) {
    const kind =
      inspection.kind === "Incoming"
        ? "incoming-inspection"
        : inspection.kind === "In-Process"
          ? "in-process-inspection"
          : inspection.kind === "Final"
            ? "final-inspection"
            : "production-inspection";
    return `/quality/${kind}/${inspection.id}`;
  }
  const pc = store.productionConstraints.find((r) => r.number === token || r.id === token);
  if (pc) return `/performance/production-constraints/${pc.id}`;
  const finding = store.auditFindings.find((r) => r.number === token || r.id === token);
  if (finding) return `/ims/audit-findings/${finding.id}`;
  const audit = store.audits.find((r) => r.number === token || r.id === token);
  if (audit) {
    const path =
      audit.type === "External"
        ? "external-audit"
        : audit.type === "Customer"
          ? "customer-audit"
          : audit.type === "Supplier"
            ? "supplier-audit"
            : "internal-audit";
    return `/ims/${path}/${audit.id}`;
  }
  const ecn = store.ecns.find((r) => r.number === token || r.id === token);
  if (ecn) return `/quality/ecn/${ecn.id}`;
  const equipment = store.equipment.find((r) => r.equipmentId === token || r.id === token);
  if (equipment) return `/quality/calibration/${equipment.id}`;
  const risk = store.riskRegister.find((r) => r.id === token || r.title === token);
  if (risk) return `/ims/risk-opportunity/${risk.id}`;
  const objective = store.imsObjectives.find((r) => r.id === token);
  if (objective) return `/ims/objectives/${objective.id}`;
  const unit = store.productionUnits.find((r) => r.serialNumber === token || r.id === token);
  if (unit) return `/trace/serial/${encodeURIComponent(unit.serialNumber)}`;
  const order = store.productionOrders.find((r) => r.number === token || r.id === token);
  if (order) return `/trace/order/${order.id}`;
  const supplier = store.suppliers.find((r) => r.name === token || r.code === token || r.id === token);
  if (supplier) return `/trace/supplier/${supplier.id}`;
  const material = store.materials.find((r) => r.partNumber === token || r.id === token);
  if (material) return `/trace/material/${material.id}`;
  const document = store.documents.find((r) => r.documentNumber === token || r.id === token || r.name === token);
  if (document) return `/documents/${document.id}`;
  return null;
}
