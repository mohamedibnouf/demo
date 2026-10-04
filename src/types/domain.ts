export type RoleName =
  | "Quality Manager"
  | "Quality Supervisor"
  | "Quality Engineer"
  | "Quality Inspector"
  | "Supply Chain"
  | "Product Engineer"
  | "Management"
  | "Admin"
  | "Supplier"
  | "Customer";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "submit"
  | "review"
  | "approve"
  | "verify"
  | "close"
  | "reopen"
  | "export";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "Open" | "In Progress" | "Completed" | "Cancelled";
export type Locale = "en" | "ar";

export type NcrStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Investigation"
  | "Action Required"
  | "Verification"
  | "Closed"
  | "Void";

export type CapaStatus =
  | "Draft"
  | "Open"
  | "In Progress"
  | "Pending Verification"
  | "Effective"
  | "Ineffective"
  | "Closed"
  | "Overdue";

export type ComplaintStatus =
  | "Submitted"
  | "Under Review"
  | "Investigation"
  | "Need More Information"
  | "Return for Investigation"
  | "Corrective Action"
  | "Final Decision"
  | "Closed";

export type SupplierNcrStatus =
  | "Issued"
  | "Supplier Submitted"
  | "Quality Review"
  | "Rejected — Revision Required"
  | "Accepted"
  | "Verification"
  | "Closed";

export type InspectionStatus = "Draft" | "Submitted" | "Under Review" | "Closed";
export type CalibrationStatus =
  | "Valid"
  | "Due Soon"
  | "Due"
  | "Expired"
  | "Under Calibration"
  | "Out of Calibration"
  | "Under Repair"
  | "Retired";

export type FindingClass = "Conformity" | "OFI" | "NC" | "Positive Finding";
export type DefectClass = "Process Defect" | "Component Defect";
export type RcaMethod = "5 Why" | "Fishbone" | "8D" | "Other";
export type Disposition =
  | "Use As Is"
  | "Sort On-Line"
  | "Sort Off-Line"
  | "Rework"
  | "RTV"
  | "Hold"
  | "RRR";

export type SampleStatus =
  | "Request"
  | "PE Manager Approval"
  | "QE Document Review"
  | "Quality Evaluation"
  | "QE Review"
  | "PE Review"
  | "Final Approval"
  | "Approved"
  | "Conditionally Approved"
  | "Not Approved"
  | "Temporary"
  | "Cancelled";

export type EcnStatus =
  | "Draft"
  | "Approved"
  | "Use Current Stock First"
  | "Ready for Implementation"
  | "Implemented — Awaiting Quality Verification"
  | "Verified"
  | "Closed"
  | "Cancelled";

export type AuditType = "Internal" | "External" | "Customer" | "Supplier";
export type IsoStandard = "ISO 9001" | "ISO 14001" | "ISO 45001" | "Multiple Standards";

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Role {
  id: string;
  name: RoleName;
}

export interface Permission {
  id: string;
  module: string;
  action: PermissionAction;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface Profile {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  roleId: string;
  departmentId: string | null;
  supplierId: string | null;
  customerId: string | null;
  title: string;
  locale: Locale;
  active: boolean;
  avatarInitials: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  country: string;
  contact: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  country: string;
  contact: string;
  category: string;
}

export interface ModelFamily {
  id: string;
  code: string;
  name: string;
}

export interface ProductModel {
  id: string;
  familyId: string;
  code: string;
  name: string;
}

export interface ProductionLine {
  id: string;
  code: string;
  name: string;
  familyId: string;
}

export interface Material {
  id: string;
  partNumber: string;
  description: string;
  supplierId: string;
  category: string;
}

export interface DefectType {
  id: string;
  name: string;
  category: string;
}

export interface ComplaintType {
  id: string;
  name: string;
}

export interface ProductionOrder {
  id: string;
  number: string;
  modelId: string;
  plannedQty: number;
  confirmed: boolean;
  startDate: string;
  endDate: string;
}

export interface ProductionUnit {
  id: string;
  serialNumber: string;
  orderId: string;
  modelId: string;
  lineId: string;
  producedAt: string;
}

export interface ProductionRecord {
  id: string;
  date: string;
  orderId: string;
  modelId: string;
  lineId: string;
  quantityProduced: number;
  goodQty: number;
}

export interface ReceivingRecord {
  id: string;
  date: string;
  supplierId: string;
  materialId: string;
  quantity: number;
  reference: string;
}

export type QualityEventType =
  | "Process Defect"
  | "Component Defect"
  | "Customer Complaint"
  | "Audit Finding"
  | "Calibration"
  | "Other";

export interface QualityEvent {
  id: string;
  sourceEventId: string;
  type: QualityEventType;
  occurredAt: string;
  serialNumber: string | null;
  modelId: string | null;
  lineId: string | null;
  supplierId: string | null;
  materialId: string | null;
  defectTypeId: string | null;
  description: string;
  departmentId: string;
  originModule: string;
  originRecordId: string;
}

export interface InspectionResult {
  id: string;
  inspectionId: string;
  test: string;
  specification: string;
  actual: string;
  pass: boolean;
}

export interface ProductionInspection {
  id: string;
  number: string;
  kind: "Production" | "Incoming" | "In-Process" | "Final";
  serialNumber: string | null;
  orderId: string | null;
  modelId: string | null;
  lineId: string | null;
  materialId: string | null;
  supplierId: string | null;
  inspectorId: string;
  inspectedAt: string;
  status: InspectionStatus;
  defectTypeId: string | null;
  defectDescription: string | null;
  classification: DefectClass | null;
  sourceEventId: string | null;
  notes: string;
}

export interface ProductionConstraint {
  id: string;
  number: string;
  sourceEventId: string;
  serialNumber: string;
  orderId: string;
  modelId: string;
  defect: string;
  classification: DefectClass;
  action: string;
  disposition: Disposition;
  status: "Open" | "In Rework" | "Closed";
  createdAt: string;
}

export interface Ncr {
  id: string;
  number: string;
  type: "Production NCR" | "Internal NCR" | "Supplier-related NCR" | "Other";
  sapReference: string | null;
  source: string;
  departmentId: string;
  severity: Priority;
  defect: string;
  containment: string;
  rcaMethod: RcaMethod | null;
  rca: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  ownerId: string;
  dueDate: string;
  disposition: Disposition | null;
  status: NcrStatus;
  sourceEventId: string | null;
  supplierId: string | null;
  voidReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NcrAction {
  id: string;
  ncrId: string;
  action: string;
  ownerId: string;
  dueDate: string;
  status: TaskStatus;
}

export interface SupplierNcr {
  id: string;
  number: string;
  ncrId: string | null;
  sourceEventId: string;
  supplierId: string;
  materialId: string;
  defect: string;
  status: SupplierNcrStatus;
  issuedAt: string;
  ownerId: string;
  dueDate: string;
}

export interface SupplierNcrResponse {
  id: string;
  supplierNcrId: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  completionDate: string;
  evidence: string;
  submittedAt: string;
  submittedBy: string;
  reviewDecision: "Accepted" | "Rejected" | null;
  reviewNotes: string | null;
}

export interface CustomerComplaint {
  id: string;
  number: string;
  customerId: string;
  modelId: string;
  serialNumber: string;
  type: string;
  description: string;
  quantity: number;
  status: ComplaintStatus;
  requestedInfo: string | null;
  decision: string | null;
  finalResponse: string | null;
  replacementStatus: string | null;
  internalRca: string | null;
  sourceEventId: string | null;
  ownerId: string;
  submittedAt: string;
  submittedBy: string;
}

export interface Capa {
  id: string;
  number: string;
  originModule: string;
  originRecordId: string;
  originLabel: string;
  sourceEventId: string | null;
  problem: string;
  rootCause: string;
  containment: string;
  correctiveAction: string;
  preventiveAction: string;
  ownerId: string;
  dueDate: string;
  evidence: string | null;
  effectiveness: string | null;
  status: CapaStatus;
  createdAt: string;
}

export interface CapaAction {
  id: string;
  capaId: string;
  action: string;
  ownerId: string;
  dueDate: string;
  status: TaskStatus;
}

export interface Rework {
  id: string;
  number: string;
  sourceEventId: string;
  serialNumber: string;
  attempt: 1 | 2;
  date: string;
  reason: string;
  action: string;
  ownerId: string;
  result: "Pass" | "Fail" | "Pending";
  status: "HOLD" | "In Rework" | "Re-inspection" | "Closed" | "Management Decision Required";
}

export interface RrrRecord {
  id: string;
  number: string;
  source: string;
  sourceEventId: string | null;
  materialOrUnit: string;
  reason: string;
  quantity: number;
  cost: number;
  disposition: string;
  approval: string;
  evidence: string;
  status: "Draft" | "Submitted" | "Approved" | "Closed" | "Cancelled";
  createdAt: string;
}

export interface CopqRecord {
  id: string;
  date: string;
  departmentId: string;
  modelId: string | null;
  scrapCost: number;
  description: string;
  rrrId: string | null;
}

export interface Deviation {
  id: string;
  number: string;
  orderId: string;
  originalMaterialId: string;
  alternativeMaterialId: string;
  originalQty: number;
  alternativeQty: number;
  costDifference: number;
  reason: string;
  approval: string;
  validFrom: string;
  validTo: string;
  status: "Draft" | "Approved" | "Expired" | "Cancelled" | "Rejected";
  createdBy: string;
  createdAt: string;
}

export interface SampleEvaluation {
  id: string;
  number: string;
  supplierId: string;
  materialId: string;
  status: SampleStatus;
  requestedBy: string;
  requestedAt: string;
  notes: string;
  finalDecision: string | null;
}

export interface Ecn {
  id: string;
  number: string;
  oldMaterialId: string;
  newMaterialId: string;
  modelId: string;
  stockStrategy: "Use Current Stock First" | "Implement Immediately";
  status: EcnStatus;
  oldStock: number;
  newMaterialAvailable: boolean;
  firstOrderId: string | null;
  implementedAt: string | null;
  implementedBy: string | null;
  confirmedBy: string | null;
  receivingRef: string | null;
  remarks: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  equipmentId: string;
  type: string;
  serialNumber: string;
  location: string;
  ownerId: string;
  frequencyDays: number;
  lastCalibration: string;
  nextDue: string;
  certificate: string;
  status: CalibrationStatus;
  controlled: boolean;
}

export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  date: string;
  result: "Pass" | "Fail";
  performedBy: string;
  certificate: string;
  comments: string;
}

export interface DailyLogbook {
  id: string;
  type: "CPU Coil" | "AHU Coil" | "Paint Shop";
  date: string;
  lineId: string | null;
  shift: string;
  performedBy: string;
  reviewedBy: string | null;
  status: "Open" | "Reviewed";
  remarks: string;
}

export interface LogbookReading {
  id: string;
  logbookId: string;
  parameter: string;
  specification: string;
  actual: string;
  pass: boolean;
  time: string;
}

export interface PaintBatch {
  id: string;
  vendor: string;
  powderCode: string;
  powderName: string;
  color: string;
  batchNo: string;
  startedAt: string;
  endedAt: string | null;
  logbookId: string;
}

export interface DestructiveTest {
  id: string;
  date: string;
  panel: "Regular G90" | "Spangle G90" | "A40";
  test: "Impact Test" | "Straight Bend" | "Slant Bend" | "Scratch Test" | "Pencil Test";
  result: "Pass" | "Fail";
  paintBatchId: string;
  performedBy: string;
}

export interface OvenTracker {
  id: string;
  date: string;
  time: string;
  equipmentId: string;
  result: string;
  pass: boolean;
  performedBy: string;
  comments: string;
}

export interface ImsObjective {
  id: string;
  departmentId: string;
  standard: IsoStandard;
  objective: string;
  kpi: string;
  target: string;
  frequency: string;
  ownerId: string;
  actual: string;
  autoLinkedKpi: string | null;
  achievement: "On Track" | "Below Target" | "Achieved" | "At Risk";
  actionPlan: string;
  revision: number;
}

export interface ObjectiveMeasurement {
  id: string;
  objectiveId: string;
  period: string;
  actual: string;
  notes: string;
}

export interface RiskRegisterItem {
  id: string;
  departmentId: string;
  kind: "Risk" | "Opportunity";
  title: string;
  assessment: string;
  existingControls: string;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  residualProbability: 1 | 2 | 3 | 4 | 5;
  residualImpact: 1 | 2 | 3 | 4 | 5;
  ownerId: string;
  targetDate: string;
  review: string;
  effectiveness: string;
  linkedObjectiveId: string | null;
}

export interface RiskAction {
  id: string;
  riskId: string;
  action: string;
  ownerId: string;
  dueDate: string;
  status: TaskStatus;
}

export interface EngineRisk {
  id: string;
  level: RiskLevel;
  source: string;
  departmentId: string;
  description: string;
  detectedAt: string;
  relatedRecords: string[];
  suggestedAction: string;
  ownerId: string;
  targetDate: string;
  status: "Open" | "Monitoring" | "Mitigated";
  kind: "BUSINESS_RULE" | "AI_ENRICHED";
}

export interface AuditPlan {
  id: string;
  year: number;
  departmentId: string;
  process: string;
  standard: IsoStandard;
  plannedDate: string;
  auditorId: string;
  auditeeId: string;
  type: AuditType;
  status: "Planned" | "In Progress" | "Completed" | "Overdue";
}

export interface Audit {
  id: string;
  number: string;
  planId: string;
  type: AuditType;
  date: string;
  status: "Planned" | "In Progress" | "Completed" | "Overdue";
  scope: string;
}

export interface AuditQuestion {
  id: string;
  auditId: string;
  standard: IsoStandard;
  clause: string;
  subClause: string;
  procedure: string;
  question: string;
  response: string | null;
  result: FindingClass | null;
}

export interface AuditFinding {
  id: string;
  number: string;
  auditId: string;
  standard: IsoStandard;
  clause: string;
  procedure: string;
  departmentId: string;
  finding: string;
  evidence: string;
  classification: FindingClass;
  ownerId: string;
  targetDate: string;
  action: string;
  verification: string | null;
  status: "Open" | "Action Required" | "Verification" | "Closed";
}

export interface ManagementReview {
  id: string;
  number: string;
  meeting: string;
  period: string;
  attendees: string;
  inputs: string;
  decisions: string;
  createdAt: string;
}

export interface ManagementAction {
  id: string;
  reviewId: string;
  action: string;
  ownerId: string;
  dueDate: string;
  evidence: string | null;
  status: TaskStatus;
}

export interface TaskItem {
  id: string;
  title: string;
  module: string;
  recordRef: string;
  recordHref: string;
  assigneeId: string;
  departmentId: string | null;
  priority: Priority;
  dueDate: string;
  status: TaskStatus;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  event: string;
  recordRef: string;
  href: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  type: string;
  recordRef: string;
  href: string;
  description: string;
  actorId: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  status: "Uploaded" | "Processing" | "Analyzed" | "Failed";
  sizeLabel: string;
  summary: string | null;
}

export interface ImportJob {
  id: string;
  file: string;
  type: "Production File" | "Receiving File" | "COPQ File" | "NCR File";
  uploadedBy: string;
  uploadedAt: string;
  status: "Validated" | "Imported" | "Failed" | "Partial";
  processed: number;
  added: number;
  updated: number;
  failed: number;
}

export interface ImportError {
  id: string;
  jobId: string;
  row: number;
  error: string;
  value: string;
  recommendation: string;
}

export interface NumberingSequence {
  id: string;
  prefix: string;
  year: number;
  nextValue: number;
  padding: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  recordRef: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface WorkflowDefinition {
  id: string;
  module: string;
  name: string;
  steps: string[];
  active: boolean;
}

export interface AiAnalysis {
  id: string;
  topic: string;
  prompt: string;
  result: string;
  provider: string;
  createdAt: string;
  createdBy: string;
}

export interface Insight {
  id: string;
  severity: RiskLevel;
  title: string;
  explanation: string;
  relatedRecords: string[];
  recommendedAction: string;
  href: string;
}

export interface KpiSnapshot {
  id: string;
  period: string;
  productionPpm: number;
  customerPpm: number;
  supplierSppm: number;
  ncrOpen: number;
  ffrPpm: number;
  fpy: number;
  copq: number;
  pcPercent: number;
}

export interface DemoStore {
  meta: { generatedAt: string; isDemoData: true; asOf: string };
  departments: Department[];
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  profiles: Profile[];
  customers: Customer[];
  suppliers: Supplier[];
  modelFamilies: ModelFamily[];
  models: ProductModel[];
  productionLines: ProductionLine[];
  materials: Material[];
  defectTypes: DefectType[];
  complaintTypes: ComplaintType[];
  productionOrders: ProductionOrder[];
  productionUnits: ProductionUnit[];
  productionRecords: ProductionRecord[];
  receivingRecords: ReceivingRecord[];
  qualityEvents: QualityEvent[];
  inspections: ProductionInspection[];
  inspectionResults: InspectionResult[];
  productionConstraints: ProductionConstraint[];
  ncrs: Ncr[];
  ncrActions: NcrAction[];
  supplierNcrs: SupplierNcr[];
  supplierNcrResponses: SupplierNcrResponse[];
  complaints: CustomerComplaint[];
  capas: Capa[];
  capaActions: CapaAction[];
  reworks: Rework[];
  rrrRecords: RrrRecord[];
  copqRecords: CopqRecord[];
  deviations: Deviation[];
  sampleEvaluations: SampleEvaluation[];
  ecns: Ecn[];
  equipment: Equipment[];
  calibrationRecords: CalibrationRecord[];
  logbooks: DailyLogbook[];
  logbookReadings: LogbookReading[];
  paintBatches: PaintBatch[];
  destructiveTests: DestructiveTest[];
  ovenTrackers: OvenTracker[];
  imsObjectives: ImsObjective[];
  objectiveMeasurements: ObjectiveMeasurement[];
  riskRegister: RiskRegisterItem[];
  riskActions: RiskAction[];
  engineRisks: EngineRisk[];
  auditPlans: AuditPlan[];
  audits: Audit[];
  auditQuestions: AuditQuestion[];
  auditFindings: AuditFinding[];
  managementReviews: ManagementReview[];
  managementActions: ManagementAction[];
  tasks: TaskItem[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
  documents: DocumentRecord[];
  importJobs: ImportJob[];
  importErrors: ImportError[];
  sequences: NumberingSequence[];
  auditLogs: AuditLog[];
  workflows: WorkflowDefinition[];
  aiAnalyses: AiAnalysis[];
  insights: Insight[];
  kpiSnapshots: KpiSnapshot[];
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  roleId: string;
  departmentId: string | null;
  supplierId: string | null;
  customerId: string | null;
  title: string;
  locale: Locale;
}

export interface DashboardFilters {
  year: number;
  month: number | "all";
  familyId: string | "all";
  modelId: string | "all";
  lineId: string | "all";
  supplierId: string | "all";
  departmentId: string | "all";
}
