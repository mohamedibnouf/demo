import type { DemoStore, SessionUser } from "@/types";
import { customerFacingComplaint } from "@/lib/engines/rbac";

export type CatalogModule = {
  title: string;
  subtitle: string;
  module: string;
  rows: (store: DemoStore, user: SessionUser) => Array<{ id: string }>;
  columns: { key: string; header: string }[];
  searchKeys: string[];
  href: (id: string) => string;
};

function scopedNcrs(store: DemoStore, type?: string) {
  return store.ncrs.filter((n) => (type ? n.type === type : true));
}

export const qualityCatalog: Record<string, CatalogModule> = {
  "production-inspection": {
    title: "Production Inspection",
    subtitle: "Serial-level tests, defects, and NCR creation",
    module: "production_inspection",
    rows: (s) => s.inspections.filter((i) => i.kind === "Production"),
    columns: [
      { key: "number", header: "Inspection No" },
      { key: "serialNumber", header: "Serial" },
      { key: "status", header: "Status" },
      { key: "classification", header: "Classification" },
      { key: "inspectedAt", header: "Date" },
    ],
    searchKeys: ["number", "serialNumber"],
    href: (id) => `/quality/production-inspection/${id}`,
  },
  "incoming-inspection": {
    title: "Incoming Inspection",
    subtitle: "Receiving quality with supplier and material traceability",
    module: "incoming_inspection",
    rows: (s) => s.inspections.filter((i) => i.kind === "Incoming"),
    columns: [
      { key: "number", header: "Inspection No" },
      { key: "supplierId", header: "Supplier" },
      { key: "status", header: "Status" },
      { key: "inspectedAt", header: "Date" },
    ],
    searchKeys: ["number"],
    href: (id) => `/quality/incoming-inspection/${id}`,
  },
  "in-process-inspection": {
    title: "In-Process Inspection",
    subtitle: "Line inspections linked to production orders",
    module: "in_process_inspection",
    rows: (s) => s.inspections.filter((i) => i.kind === "In-Process"),
    columns: [
      { key: "number", header: "Inspection No" },
      { key: "serialNumber", header: "Serial" },
      { key: "status", header: "Status" },
    ],
    searchKeys: ["number", "serialNumber"],
    href: (id) => `/quality/in-process-inspection/${id}`,
  },
  "final-inspection": {
    title: "Final Inspection",
    subtitle: "Release inspection before shipment",
    module: "final_inspection",
    rows: (s) => s.inspections.filter((i) => i.kind === "Final"),
    columns: [
      { key: "number", header: "Inspection No" },
      { key: "serialNumber", header: "Serial" },
      { key: "status", header: "Status" },
    ],
    searchKeys: ["number", "serialNumber"],
    href: (id) => `/quality/final-inspection/${id}`,
  },
  "production-ncr": {
    title: "Production NCR",
    subtitle: "Nonconformity workflow with RCA, disposition, and closure",
    module: "production_ncr",
    rows: (s) => scopedNcrs(s, "Production NCR"),
    columns: [
      { key: "number", header: "NCR Number" },
      { key: "severity", header: "Severity" },
      { key: "status", header: "Status" },
      { key: "defect", header: "Defect" },
      { key: "dueDate", header: "Due" },
    ],
    searchKeys: ["number", "defect"],
    href: (id) => `/quality/production-ncr/${id}`,
  },
  "internal-ncr": {
    title: "Internal NCR",
    subtitle: "System, document, and process nonconformities",
    module: "internal_ncr",
    rows: (s) => scopedNcrs(s, "Internal NCR"),
    columns: [
      { key: "number", header: "NCR Number" },
      { key: "status", header: "Status" },
      { key: "defect", header: "Nonconformity" },
    ],
    searchKeys: ["number", "defect"],
    href: (id) => `/quality/internal-ncr/${id}`,
  },
  "supplier-ncr": {
    title: "Supplier NCR",
    subtitle: "Supplier response → quality review → verification → closure",
    module: "supplier_ncr",
    rows: (s, u) => s.supplierNcrs.filter((n) => (u.role === "Supplier" ? n.supplierId === u.supplierId : true)),
    columns: [
      { key: "number", header: "SNCR" },
      { key: "status", header: "Status" },
      { key: "defect", header: "Defect" },
      { key: "dueDate", header: "Due" },
    ],
    searchKeys: ["number", "defect"],
    href: (id) => `/quality/supplier-ncr/${id}`,
  },
  "customer-complaints": {
    title: "Customer Complaints",
    subtitle: "Customer portal hides internal RCA and CAPA",
    module: "customer_complaint",
    rows: (s, u) => {
      const rows = s.complaints.filter((c) => (u.role === "Customer" ? c.customerId === u.customerId : true));
      if (u.role === "Customer") return rows.map((c) => ({ id: c.id, ...customerFacingComplaint(c) }));
      return rows;
    },
    columns: [
      { key: "number", header: "Complaint" },
      { key: "type", header: "Type" },
      { key: "status", header: "Status" },
      { key: "serialNumber", header: "Serial" },
    ],
    searchKeys: ["number", "serialNumber", "type"],
    href: (id) => `/quality/customer-complaints/${id}`,
  },
  capa: {
    title: "CAPA",
    subtitle: "Corrective and preventive actions linked to originating records",
    module: "capa",
    rows: (s) => s.capas,
    columns: [
      { key: "number", header: "CAPA" },
      { key: "originLabel", header: "Origin" },
      { key: "status", header: "Status" },
      { key: "dueDate", header: "Due" },
      { key: "problem", header: "Problem" },
    ],
    searchKeys: ["number", "problem"],
    href: (id) => `/quality/capa/${id}`,
  },
  deviation: {
    title: "Deviation",
    subtitle: "Blocked when the production order is confirmed",
    module: "deviation",
    rows: (s) => s.deviations,
    columns: [
      { key: "number", header: "Deviation" },
      { key: "status", header: "Status" },
      { key: "reason", header: "Reason" },
      { key: "validTo", header: "Valid to" },
    ],
    searchKeys: ["number", "reason"],
    href: (id) => `/quality/deviation/${id}`,
  },
  "sample-evaluation": {
    title: "Sample Evaluation",
    subtitle: "Multi-step PE / Quality approval workflow",
    module: "sample_evaluation",
    rows: (s) => s.sampleEvaluations,
    columns: [
      { key: "number", header: "Sample" },
      { key: "status", header: "Status" },
      { key: "notes", header: "Notes" },
    ],
    searchKeys: ["number", "notes"],
    href: (id) => `/quality/sample-evaluation/${id}`,
  },
  ecn: {
    title: "Engineering Change Notice",
    subtitle: "Stock strategy, readiness, implementation, quality verification",
    module: "ecn",
    rows: (s) => s.ecns,
    columns: [
      { key: "number", header: "ECN" },
      { key: "status", header: "Status" },
      { key: "stockStrategy", header: "Stock strategy" },
    ],
    searchKeys: ["number"],
    href: (id) => `/quality/ecn/${id}`,
  },
  rework: {
    title: "Rework",
    subtitle: "Maximum two attempts — third attempt requires management",
    module: "rework",
    rows: (s) => s.reworks,
    columns: [
      { key: "number", header: "Rework" },
      { key: "attempt", header: "Attempt" },
      { key: "status", header: "Status" },
      { key: "serialNumber", header: "Serial" },
    ],
    searchKeys: ["number", "serialNumber"],
    href: (id) => `/quality/rework/${id}`,
  },
  rrr: {
    title: "RRR — Rejection & Replacement",
    subtitle: "Scrap / RTV process. No separate Scrap module. COPQ is not auto-copied.",
    module: "rrr",
    rows: (s) => s.rrrRecords,
    columns: [
      { key: "number", header: "RRR" },
      { key: "reason", header: "Reason" },
      { key: "cost", header: "Cost" },
      { key: "status", header: "Status" },
    ],
    searchKeys: ["number", "reason"],
    href: (id) => `/quality/rrr/${id}`,
  },
  calibration: {
    title: "Calibration / Monitoring",
    subtitle: "Expired or out-of-calibration equipment blocks controlled inspections",
    module: "calibration",
    rows: (s) => s.equipment,
    columns: [
      { key: "equipmentId", header: "Equipment ID" },
      { key: "type", header: "Type" },
      { key: "status", header: "Status" },
      { key: "nextDue", header: "Next due" },
    ],
    searchKeys: ["equipmentId", "type", "serialNumber"],
    href: (id) => `/quality/calibration/${id}`,
  },
};

export const imsCatalog: Record<string, CatalogModule> = {
  objectives: {
    title: "IMS Objectives",
    subtitle: "ISO 9001 / 14001 / 45001 — actuals retrieved from internal KPIs where linked",
    module: "ims_objective",
    rows: (s) => s.imsObjectives,
    columns: [
      { key: "objective", header: "Objective" },
      { key: "standard", header: "Standard" },
      { key: "target", header: "Target" },
      { key: "actual", header: "Actual" },
      { key: "achievement", header: "Status" },
    ],
    searchKeys: ["objective", "kpi"],
    href: (id) => `/ims/objectives/${id}`,
  },
  "risk-opportunity": {
    title: "Risk & Opportunity Register",
    subtitle: "Probability × Impact matrix with residual assessment",
    module: "risk_register",
    rows: (s) => s.riskRegister,
    columns: [
      { key: "title", header: "Risk / Opportunity" },
      { key: "kind", header: "Type" },
      { key: "probability", header: "P" },
      { key: "impact", header: "I" },
      { key: "targetDate", header: "Target" },
    ],
    searchKeys: ["title"],
    href: (id) => `/ims/risk-opportunity/${id}`,
  },
  "annual-audit-plan": {
    title: "Annual Audit Plan",
    subtitle: "2026 integrated audit programme",
    module: "audit",
    rows: (s) => s.auditPlans,
    columns: [
      { key: "process", header: "Process" },
      { key: "type", header: "Type" },
      { key: "standard", header: "Standard" },
      { key: "plannedDate", header: "Planned" },
      { key: "status", header: "Status" },
    ],
    searchKeys: ["process"],
    href: (id) => `/ims/annual-audit-plan/${id}`,
  },
  "internal-audit": {
    title: "Internal Audit",
    subtitle: "Online checklist or offline complete-and-upload",
    module: "audit",
    rows: (s) => s.audits.filter((a) => a.type === "Internal"),
    columns: [
      { key: "number", header: "Audit" },
      { key: "scope", header: "Scope" },
      { key: "status", header: "Status" },
      { key: "date", header: "Date" },
    ],
    searchKeys: ["number", "scope"],
    href: (id) => `/ims/internal-audit/${id}`,
  },
  "external-audit": {
    title: "External Audit",
    subtitle: "Certification and surveillance audits",
    module: "audit",
    rows: (s) => s.audits.filter((a) => a.type === "External"),
    columns: [
      { key: "number", header: "Audit" },
      { key: "scope", header: "Scope" },
      { key: "status", header: "Status" },
    ],
    searchKeys: ["number"],
    href: (id) => `/ims/external-audit/${id}`,
  },
  "customer-audit": {
    title: "Customer Audit",
    subtitle: "Customer process and product audits",
    module: "audit",
    rows: (s) => s.audits.filter((a) => a.type === "Customer"),
    columns: [
      { key: "number", header: "Audit" },
      { key: "scope", header: "Scope" },
      { key: "status", header: "Status" },
    ],
    searchKeys: ["number"],
    href: (id) => `/ims/customer-audit/${id}`,
  },
  "supplier-audit": {
    title: "Supplier Audit",
    subtitle: "Supplier process audits including Alpha Q4 plan",
    module: "audit",
    rows: (s) => s.audits.filter((a) => a.type === "Supplier"),
    columns: [
      { key: "number", header: "Audit" },
      { key: "scope", header: "Scope" },
      { key: "status", header: "Status" },
    ],
    searchKeys: ["number"],
    href: (id) => `/ims/supplier-audit/${id}`,
  },
  "audit-findings": {
    title: "Audit Findings",
    subtitle: "NC / OFI / Conformity / Positive — CAPA is never automatic",
    module: "audit",
    rows: (s) => s.auditFindings,
    columns: [
      { key: "number", header: "Finding" },
      { key: "classification", header: "Class" },
      { key: "status", header: "Status" },
      { key: "targetDate", header: "Target" },
    ],
    searchKeys: ["number", "finding"],
    href: (id) => `/ims/audit-findings/${id}`,
  },
  "management-review": {
    title: "Management Review",
    subtitle: "Integrated inputs, decisions, and follow-up actions",
    module: "management_review",
    rows: (s) => s.managementReviews,
    columns: [
      { key: "number", header: "Review" },
      { key: "meeting", header: "Meeting" },
      { key: "period", header: "Period" },
    ],
    searchKeys: ["number", "meeting"],
    href: (id) => `/ims/management-review/${id}`,
  },
};
