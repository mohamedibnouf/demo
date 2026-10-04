import type { PermissionAction, RoleName, SessionUser } from "@/types";

export const MODULES = [
  "dashboard",
  "production_inspection",
  "incoming_inspection",
  "in_process_inspection",
  "final_inspection",
  "production_ncr",
  "internal_ncr",
  "supplier_ncr",
  "customer_complaint",
  "capa",
  "deviation",
  "sample_evaluation",
  "ecn",
  "rework",
  "rrr",
  "production_constraint",
  "calibration",
  "logbook",
  "ims_objective",
  "risk_register",
  "audit",
  "management_review",
  "tasks",
  "notifications",
  "reports",
  "admin",
  "excel",
  "documents",
  "ai",
  "users",
] as const;

export type ModuleKey = (typeof MODULES)[number];

const ALL: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "submit",
  "review",
  "approve",
  "verify",
  "close",
  "reopen",
  "export",
];

const OPERATIONAL: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "submit",
  "review",
  "verify",
  "close",
  "export",
];

function grant(modules: ModuleKey[], actions: PermissionAction[]): Record<string, PermissionAction[]> {
  return Object.fromEntries(modules.map((m) => [m, actions]));
}

const QUALITY_OPS: ModuleKey[] = [
  "dashboard",
  "production_inspection",
  "incoming_inspection",
  "in_process_inspection",
  "final_inspection",
  "production_ncr",
  "internal_ncr",
  "supplier_ncr",
  "customer_complaint",
  "capa",
  "deviation",
  "sample_evaluation",
  "ecn",
  "rework",
  "rrr",
  "production_constraint",
  "calibration",
  "logbook",
  "ims_objective",
  "risk_register",
  "audit",
  "management_review",
  "tasks",
  "notifications",
  "reports",
  "documents",
  "ai",
  "excel",
];

export const ROLE_MATRIX: Record<RoleName, Record<string, PermissionAction[]>> = {
  Admin: {
    ...grant(QUALITY_OPS, ALL),
    admin: ALL,
    users: ALL,
  },
  "Quality Manager": {
    ...grant(QUALITY_OPS, ALL),
    admin: ["view"],
    users: ["view"],
  },
  "Quality Supervisor": {
    ...grant(QUALITY_OPS, [...OPERATIONAL, "approve"]),
    ai: ["view"],
    excel: ["view", "export"],
  },
  "Quality Engineer": {
    ...grant(
      QUALITY_OPS.filter((m) => m !== "management_review"),
      ["view", "create", "edit", "submit", "review", "verify", "export"],
    ),
    management_review: ["view"],
    ai: ["view"],
    excel: ["view", "create", "export"],
  },
  "Quality Inspector": {
    dashboard: ["view"],
    production_inspection: ["view", "create", "edit", "submit"],
    incoming_inspection: ["view", "create", "edit", "submit"],
    in_process_inspection: ["view", "create", "edit", "submit"],
    final_inspection: ["view", "create", "edit", "submit"],
    production_ncr: ["view", "create", "submit"],
    production_constraint: ["view", "create", "submit"],
    rework: ["view", "create", "submit"],
    calibration: ["view"],
    logbook: ["view", "create", "edit", "submit"],
    tasks: ["view", "edit"],
    notifications: ["view"],
    reports: ["view"],
    ai: ["view"],
  },
  "Supply Chain": {
    dashboard: ["view"],
    incoming_inspection: ["view"],
    supplier_ncr: ["view", "create", "edit", "submit", "review"],
    production_ncr: ["view"],
    capa: ["view"],
    rrr: ["view", "create", "edit", "submit"],
    deviation: ["view"],
    tasks: ["view", "edit"],
    notifications: ["view"],
    reports: ["view", "export"],
    excel: ["view", "create", "export"],
    ai: ["view"],
  },
  "Product Engineer": {
    dashboard: ["view"],
    sample_evaluation: ["view", "create", "edit", "submit", "review", "approve"],
    ecn: ["view", "create", "edit", "submit", "approve"],
    deviation: ["view", "create", "edit", "submit"],
    production_ncr: ["view"],
    capa: ["view", "edit"],
    tasks: ["view", "edit"],
    notifications: ["view"],
    reports: ["view"],
    ai: ["view"],
  },
  Management: {
    ...grant(QUALITY_OPS, ["view", "export"]),
    admin: [],
    users: ["view"],
  },
  Supplier: {
    supplier_ncr: ["view", "submit"],
    tasks: ["view", "edit"],
    notifications: ["view"],
    documents: ["view", "create"],
  },
  Customer: {
    customer_complaint: ["view", "create", "submit"],
    notifications: ["view"],
    documents: ["view", "create"],
  },
};

export function can(role: RoleName, module: string, action: PermissionAction): boolean {
  const granted = ROLE_MATRIX[role]?.[module] ?? [];
  return granted.includes(action);
}

export function authorize(user: SessionUser | null, module: string, action: PermissionAction): boolean {
  if (!user) return false;
  return can(user.role, module, action);
}

export function assertAuthorized(user: SessionUser | null, module: string, action: PermissionAction): void {
  if (!authorize(user, module, action)) {
    throw new Error("Not authorized");
  }
}

export function isReadOnlyRole(role: RoleName): boolean {
  return role === "Management";
}

export function customerFacingComplaint(record: {
  number: string;
  status: string;
  requestedInfo: string | null;
  decision: string | null;
  finalResponse: string | null;
  replacementStatus: string | null;
  type: string;
  description: string;
  quantity: number;
  serialNumber: string;
  submittedAt: string;
  internalRca?: string | null;
}) {
  return {
    number: record.number,
    status: record.status,
    requestedInfo: record.requestedInfo,
    decision: record.decision,
    finalResponse: record.finalResponse,
    replacementStatus: record.replacementStatus,
    type: record.type,
    description: record.description,
    quantity: record.quantity,
    serialNumber: record.serialNumber,
    submittedAt: record.submittedAt,
  };
}
