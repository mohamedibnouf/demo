export type NavItem = {
  href: string;
  label: string;
  module: string;
};

export type NavSection = {
  title: string | null;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    title: null,
    items: [{ href: "/", label: "Dashboard", module: "dashboard" }],
  },
  {
    title: "Quality Management",
    items: [
      { href: "/quality/production-inspection", label: "Production Inspection", module: "production_inspection" },
      { href: "/quality/production-ncr", label: "Production NCR", module: "production_ncr" },
      { href: "/quality/supplier-ncr", label: "Supplier NCR", module: "supplier_ncr" },
      { href: "/quality/customer-complaints", label: "Customer Complaints", module: "customer_complaint" },
      { href: "/quality/internal-ncr", label: "Internal NCR", module: "internal_ncr" },
      { href: "/quality/capa", label: "CAPA", module: "capa" },
      { href: "/quality/deviation", label: "Deviation", module: "deviation" },
      { href: "/quality/sample-evaluation", label: "Sample Evaluation", module: "sample_evaluation" },
      { href: "/quality/ecn", label: "ECN", module: "ecn" },
      { href: "/quality/incoming-inspection", label: "Incoming Inspection", module: "incoming_inspection" },
      { href: "/quality/in-process-inspection", label: "In-Process Inspection", module: "in_process_inspection" },
      { href: "/quality/final-inspection", label: "Final Inspection", module: "final_inspection" },
      { href: "/quality/rework", label: "Rework", module: "rework" },
      { href: "/quality/rrr", label: "RRR - Rejection & Replacement", module: "rrr" },
      { href: "/quality/calibration", label: "Calibration / Monitoring", module: "calibration" },
    ],
  },
  {
    title: "Daily Logbooks",
    items: [
      { href: "/logbooks/cpu-coil", label: "CPU Coil", module: "logbook" },
      { href: "/logbooks/ahu-coil", label: "AHU Coil", module: "logbook" },
      { href: "/logbooks/paint-shop", label: "Paint Shop", module: "logbook" },
    ],
  },
  {
    title: "IMS & Compliance",
    items: [
      { href: "/ims/objectives", label: "IMS Objectives", module: "ims_objective" },
      { href: "/ims/risk-opportunity", label: "Risk & Opportunity", module: "risk_register" },
      { href: "/ims/annual-audit-plan", label: "Annual Audit Plan", module: "audit" },
      { href: "/ims/internal-audit", label: "Internal Audit", module: "audit" },
      { href: "/ims/external-audit", label: "External Audit", module: "audit" },
      { href: "/ims/customer-audit", label: "Customer Audit", module: "audit" },
      { href: "/ims/supplier-audit", label: "Supplier Audit", module: "audit" },
      { href: "/ims/audit-findings", label: "Audit Findings", module: "audit" },
      { href: "/ims/management-review", label: "Management Review", module: "management_review" },
    ],
  },
  {
    title: "Quality Performance",
    items: [
      { href: "/performance/quality-dashboard", label: "Quality Dashboard", module: "dashboard" },
      { href: "/performance/management-dashboard", label: "Management Dashboard", module: "dashboard" },
      { href: "/performance/kpi-reports", label: "KPI & Reports", module: "reports" },
      { href: "/performance/copq", label: "COPQ", module: "reports" },
      { href: "/performance/supplier-sppm", label: "Supplier SPPM", module: "reports" },
      { href: "/performance/customer-ffr", label: "Customer FFR / PPM", module: "reports" },
      { href: "/performance/production-constraints", label: "Production Constraints", module: "production_constraint" },
    ],
  },
  {
    title: null,
    items: [{ href: "/ai-assistant", label: "AI Quality Assistant", module: "ai" }],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/users", label: "Users", module: "users" },
      { href: "/admin/roles", label: "Roles & Permissions", module: "admin" },
      { href: "/admin/master-data", label: "Master Data", module: "admin" },
      { href: "/admin/workflows", label: "Workflow Configuration", module: "admin" },
      { href: "/admin/numbering", label: "Numbering Configuration", module: "admin" },
      { href: "/admin/excel", label: "Excel Integration", module: "excel" },
      { href: "/admin/notifications", label: "Notification Configuration", module: "admin" },
      { href: "/admin/audit-trail", label: "Audit Trail", module: "admin" },
    ],
  },
  {
    title: null,
    items: [
      { href: "/reports", label: "Reports", module: "reports" },
      { href: "/tasks", label: "Tasks", module: "tasks" },
      { href: "/risks", label: "Smart Risks", module: "risk_register" },
    ],
  },
];
