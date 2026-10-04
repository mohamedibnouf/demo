import type {
  Audit,
  AuditFinding,
  AuditLog,
  Capa,
  CapaAction,
  CustomerComplaint,
  DailyLogbook,
  DemoStore,
  Deviation,
  Ecn,
  Equipment,
  ImsObjective,
  LogbookReading,
  Ncr,
  NcrAction,
  NotificationItem,
  ProductionConstraint,
  ProductionInspection,
  ProductionRecord,
  QualityEvent,
  Rework,
  RiskRegisterItem,
  RolePermission,
  SupplierNcr,
  TaskItem,
  Permission,
} from "@/types";
import { DEMO_AS_OF } from "@/lib/env";
import { deriveCalibrationStatus } from "@/lib/engines/calibration";
import { ids } from "./ids";

const AS_OF = DEMO_AS_OF;

function iso(offsetDays: number, hour = 9): string {
  const d = new Date(`${AS_OF}T${String(hour).padStart(2, "0")}:15:00`);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function day(offsetDays: number): string {
  return iso(offsetDays).slice(0, 10);
}

export function createSeedStore(): DemoStore {
  const departments = [
    { id: ids.dept.quality, name: "Quality", code: "QA" },
    { id: ids.dept.production, name: "Production", code: "PRD" },
    { id: ids.dept.supply, name: "Supply Chain", code: "SC" },
    { id: ids.dept.engineering, name: "Product Engineering", code: "PE" },
    { id: ids.dept.paint, name: "Paint Shop", code: "PNT" },
    { id: ids.dept.management, name: "Management", code: "MGT" },
  ];

  const roles = [
    { id: ids.role.qm, name: "Quality Manager" as const },
    { id: ids.role.qs, name: "Quality Supervisor" as const },
    { id: ids.role.qe, name: "Quality Engineer" as const },
    { id: ids.role.qi, name: "Quality Inspector" as const },
    { id: ids.role.sc, name: "Supply Chain" as const },
    { id: ids.role.pe, name: "Product Engineer" as const },
    { id: ids.role.mgmt, name: "Management" as const },
    { id: ids.role.admin, name: "Admin" as const },
    { id: ids.role.supplier, name: "Supplier" as const },
    { id: ids.role.customer, name: "Customer" as const },
  ];

  const profiles = [
    p(ids.user.qm, "quality.manager@samco.demo", "Khalid Al-Harbi", ids.role.qm, ids.dept.quality, "Quality Manager", "KH"),
    p(ids.user.qs, "quality.supervisor@samco.demo", "Noura Al-Otaibi", ids.role.qs, ids.dept.quality, "Quality Supervisor", "NO"),
    p(ids.user.qe, "quality.engineer@samco.demo", "Omar Al-Qahtani", ids.role.qe, ids.dept.quality, "Quality Engineer", "OQ"),
    p(ids.user.qi, "inspector@samco.demo", "Yusuf Al-Dosari", ids.role.qi, ids.dept.quality, "Quality Inspector", "YD"),
    p(ids.user.sc, "supplychain@samco.demo", "Lina Al-Mutairi", ids.role.sc, ids.dept.supply, "Supply Chain Specialist", "LM"),
    p(ids.user.pe, "product.engineer@samco.demo", "Faisal Al-Shammari", ids.role.pe, ids.dept.engineering, "Product Engineer", "FS"),
    p(ids.user.mgmt, "management@samco.demo", "Abdullah Al-Saud", ids.role.mgmt, ids.dept.management, "Plant Director", "AS"),
    p(ids.user.admin, "admin@samco.demo", "Reem Al-Faisal", ids.role.admin, ids.dept.management, "System Administrator", "RF"),
    p(ids.user.supplier, "supplier@samco.demo", "Hiroshi Tanaka", ids.role.supplier, null, "Quality Contact — Alpha Components", "HT", ids.supplier.alpha),
    p(ids.user.customer, "customer@samco.demo", "James Whitaker", ids.role.customer, null, "Facilities Manager — Gulf Climate", "JW", undefined, ids.customer.gulf),
    p(ids.user.qi2, "inspector.ahu@samco.demo", "Hassan Al-Ghamdi", ids.role.qi, ids.dept.quality, "AHU Line Inspector", "HG"),
    p(ids.user.paint, "paint.lead@samco.demo", "Majed Al-Harthi", ids.role.qi, ids.dept.paint, "Paint Shop Lead", "MH"),
    p(ids.user.supplier2, "supplier.delta@samco.demo", "Priya Mehta", ids.role.supplier, null, "Quality Contact — Delta Metals", "PM", ids.supplier.delta),
  ];

  const suppliers = [
    { id: ids.supplier.alpha, name: "Alpha Components", code: "ALPHA", country: "Japan", contact: "Hiroshi Tanaka", category: "Expansion valves / controls" },
    { id: ids.supplier.delta, name: "Delta Metals", code: "DELTA", country: "India", contact: "Priya Mehta", category: "Copper tube" },
    { id: ids.supplier.oasis, name: "Oasis Compressors", code: "OASIS", country: "USA", contact: "Mark Brennan", category: "Compressors" },
    { id: ids.supplier.najd, name: "Najd Copper Works", code: "NAJD", country: "KSA", contact: "Sami Al-Naimi", category: "Coil components" },
    { id: ids.supplier.gulfcoil, name: "Gulf Coil Products", code: "GCOIL", country: "UAE", contact: "Aisha Rahman", category: "Fins / headers" },
    { id: ids.supplier.east, name: "Eastern Controls", code: "ECTL", country: "Germany", contact: "Lukas Weber", category: "PCB / sensors" },
    { id: ids.supplier.redsea, name: "Red Sea Insulation", code: "RSI", country: "KSA", contact: "Huda Al-Qahtani", category: "Insulation" },
    { id: ids.supplier.fantech, name: "FanTech Asia", code: "FAN", country: "Malaysia", contact: "Wei Ling", category: "Fans / motors" },
  ];

  const customers = [
    { id: ids.customer.gulf, name: "Gulf Climate Solutions", code: "GCS", country: "UAE", contact: "James Whitaker" },
    { id: ids.customer.riyadh, name: "Riyadh Facilities Group", code: "RFG", country: "KSA", contact: "Nasser Al-Bishi" },
    { id: ids.customer.jeddah, name: "Jeddah Hospitality Holdings", code: "JHH", country: "KSA", contact: "Maha Al-Harbi" },
    { id: ids.customer.dammam, name: "Dammam Industrial Parks", code: "DIP", country: "KSA", contact: "Tariq Al-Dosari" },
    { id: ids.customer.nebula, name: "Nebula Data Centers", code: "NDC", country: "KSA", contact: "Elena Rossi" },
    { id: ids.customer.oasis, name: "Oasis Mall Group", code: "OMG", country: "KSA", contact: "Fahad Al-Otaibi" },
    { id: ids.customer.metro, name: "Metro Air Services", code: "MAS", country: "Bahrain", contact: "Ali Hassan" },
    { id: ids.customer.desert, name: "Desert Cooling LLC", code: "DCL", country: "Qatar", contact: "Saad Al-Kuwari" },
    { id: ids.customer.highland, name: "Highland Hotels", code: "HLH", country: "KSA", contact: "Rania Saleh" },
    { id: ids.customer.coastal, name: "Coastal Projects Co.", code: "CPC", country: "KSA", contact: "Ibrahim Al-Ghamdi" },
  ];

  const modelFamilies = [
    { id: ids.family.wrac, code: "WRAC", name: "Window / Room AC" },
    { id: ids.family.dfs, code: "DFS", name: "Ducted Split / Floor Standing" },
    { id: ids.family.pac, code: "PAC", name: "Packaged AC" },
    { id: ids.family.fcu, code: "FCU", name: "Fan Coil Unit" },
    { id: ids.family.ahu, code: "AHU", name: "Air Handling Unit" },
    { id: ids.family.lss, code: "LSS", name: "Large Special Systems" },
  ];

  const models = [
    m("m-wrac-18", ids.family.wrac, "WRAC-18K", "Window AC 18,000 BTU"),
    m("m-wrac-24", ids.family.wrac, "WRAC-24K", "Window AC 24,000 BTU"),
    m("m-dfs-36", ids.family.dfs, "DFS-36", "Ducted split 36k"),
    m("m-dfs-60", ids.family.dfs, "DFS-60", "Ducted split 60k"),
    m("m-pac-10", ids.family.pac, "PAC-10T", "Packaged 10 Ton"),
    m("m-pac-15", ids.family.pac, "PAC-15T", "Packaged 15 Ton"),
    m("m-fcu-c", ids.family.fcu, "FCU-C400", "Ceiling FCU 400 CFM"),
    m("m-fcu-h", ids.family.fcu, "FCU-H800", "Hi-static FCU 800 CFM"),
    m("m-ahu-s", ids.family.ahu, "AHU-S15", "Standard AHU 15,000 CMH"),
    m("m-ahu-p", ids.family.ahu, "AHU-P25", "Premium AHU 25,000 CMH"),
    m("m-ahu-h", ids.family.ahu, "AHU-H40", "Hospital AHU 40,000 CMH"),
    m("m-lss-ch", ids.family.lss, "LSS-CH500", "Custom handler 500 TR plant"),
    m("m-lss-dx", ids.family.lss, "LSS-DX80", "Special DX 80 Ton"),
    m("m-wrac-12", ids.family.wrac, "WRAC-12K", "Window AC 12,000 BTU"),
    m("m-pac-20", ids.family.pac, "PAC-20T", "Packaged 20 Ton"),
  ];

  const productionLines = [
    { id: "l-wrac", code: "L-WRAC", name: "WRAC Line 1", familyId: ids.family.wrac },
    { id: "l-dfs", code: "L-DFS", name: "DFS Line 1", familyId: ids.family.dfs },
    { id: "l-pac", code: "L-PAC", name: "PAC Line 1", familyId: ids.family.pac },
    { id: "l-fcu", code: "L-FCU", name: "FCU Line 1", familyId: ids.family.fcu },
    { id: "l-ahu", code: "L-AHU", name: "AHU Line 1", familyId: ids.family.ahu },
    { id: "l-lss", code: "L-LSS", name: "LSS Bay", familyId: ids.family.lss },
  ];

  const materials = [
    mat("mat-exp", "CMP-EXP-4421", "Electronic expansion valve 4421", ids.supplier.alpha, "Controls"),
    mat("mat-pcb", "CMP-PCB-8802", "Main control PCB", ids.supplier.east, "Electronics"),
    mat("mat-cu", "RM-CU-3/8", "Copper tube 3/8", ids.supplier.delta, "Raw"),
    mat("mat-comp", "CMP-COMP-Z300", "Scroll compressor Z300", ids.supplier.oasis, "Compressor"),
    mat("mat-fin", "RM-FIN-ALU", "Aluminum fin stock", ids.supplier.gulfcoil, "Coil"),
    mat("mat-fan", "CMP-FAN-450", "450mm backward fan", ids.supplier.fantech, "Air"),
    mat("mat-ins", "RM-INS-NBR", "NBR insulation sheet", ids.supplier.redsea, "Insulation"),
    mat("mat-hdr", "CMP-HDR-22", "Coil header 22mm", ids.supplier.najd, "Coil"),
  ];

  const defectTypes = [
    { id: "dt-leak", name: "Leakage", category: "Performance" },
    { id: "dt-perf", name: "Performance", category: "Performance" },
    { id: "dt-app", name: "Appearance", category: "Visual" },
    { id: "dt-elec", name: "Electrical", category: "Electrical" },
    { id: "dt-mech", name: "Mechanical", category: "Mechanical" },
    { id: "dt-noise", name: "Noise", category: "Performance" },
    { id: "dt-dim", name: "Dimensional", category: "Process" },
  ];

  const complaintTypes = [
    { id: "ct-perf", name: "Performance" },
    { id: "ct-app", name: "Appearance" },
    { id: "ct-noise", name: "Noise" },
    { id: "ct-leak", name: "Leakage" },
    { id: "ct-elec", name: "Electrical" },
    { id: "ct-mech", name: "Mechanical" },
    { id: "ct-oth", name: "Other" },
  ];

  const productionOrders = models.map((model, i) => ({
    id: `po-${model.id}`,
    number: `PO-2026-${String(2400 + i).padStart(4, "0")}`,
    modelId: model.id,
    plannedQty: 80 + i * 12,
    confirmed: i % 4 !== 0,
    startDate: day(-40 + i),
    endDate: day(20 + i),
  }));

  const productionRecords: ProductionRecord[] = [];
  const productionUnits = [];
  const familyLine = Object.fromEntries(productionLines.map((l) => [l.familyId, l.id]));
  let serialSeq = 1000;
  for (let month = 0; month < 12; month++) {
    const date = `2026-${String(month + 1).padStart(2, "0")}-12`;
    for (const model of models) {
      const family = modelFamilies.find((f) => f.id === model.familyId)!;
      const qty = 40 + ((month + family.code.length + model.code.length) % 35);
      const defects = month > 7 && family.code === "AHU" ? 3 : month % 5 === 0 ? 2 : 1;
      productionRecords.push({
        id: `pr-${model.id}-${month}`,
        date,
        orderId: `po-${model.id}`,
        modelId: model.id,
        lineId: familyLine[model.familyId] ?? "l-ahu",
        quantityProduced: qty,
        goodQty: qty - defects,
      });
    }
  }

  for (const model of models.slice(0, 8)) {
    for (let i = 0; i < 6; i++) {
      serialSeq += 1;
      productionUnits.push({
        id: `pu-${serialSeq}`,
        serialNumber: `SN-${model.code.split("-")[0]}-2026-${serialSeq}`,
        orderId: `po-${model.id}`,
        modelId: model.id,
        lineId: familyLine[model.familyId] ?? "l-ahu",
        producedAt: day(-18 + i),
      });
    }
  }

  productionUnits.push(
    {
      id: "pu-1842",
      serialNumber: ids.scenario.serialA,
      orderId: "po-m-ahu-p",
      modelId: "m-ahu-p",
      lineId: "l-ahu",
      producedAt: day(-9),
    },
    {
      id: "pu-1104",
      serialNumber: ids.scenario.serialC,
      orderId: "po-m-ahu-s",
      modelId: "m-ahu-s",
      lineId: "l-ahu",
      producedAt: day(-28),
    },
  );

  const receivingRecords = suppliers.flatMap((s, si) =>
    [0, 1, 2, 3, 4, 5].map((n) => ({
      id: `rcv-${s.id}-${n}`,
      date: day(-80 + n * 12),
      supplierId: s.id,
      materialId: materials[si % materials.length]!.id,
      quantity: 800 + si * 120 + n * 40,
      reference: `GR-${2026}${String(si + 1).padStart(2, "0")}${n}`,
    })),
  );

  const qualityEvents: QualityEvent[] = [];
  const inspections: ProductionInspection[] = [];
  const inspectionResults: DemoStore["inspectionResults"] = [];
  const productionConstraints: ProductionConstraint[] = [];
  const ncrs: Ncr[] = [];
  const ncrActions: NcrAction[] = [];
  const supplierNcrs: SupplierNcr[] = [];
  const supplierNcrResponses = [];
  const capas: Capa[] = [];
  const capaActions: CapaAction[] = [];

  // Scenario A — Alpha expansion valve
  qualityEvents.push({
    id: ids.scenario.eventA,
    sourceEventId: ids.scenario.eventA,
    type: "Component Defect",
    occurredAt: iso(-8, 10),
    serialNumber: ids.scenario.serialA,
    modelId: "m-ahu-p",
    lineId: "l-ahu",
    supplierId: ids.supplier.alpha,
    materialId: "mat-exp",
    defectTypeId: "dt-leak",
    description: "Expansion valve CMP-EXP-4421 leaking at flare after charge",
    departmentId: ids.dept.quality,
    originModule: "production_inspection",
    originRecordId: "insp-0041",
  });

  inspections.push({
    id: "insp-0041",
    number: ids.scenario.inspectionA,
    kind: "Production",
    serialNumber: ids.scenario.serialA,
    orderId: "po-m-ahu-p",
    modelId: "m-ahu-p",
    lineId: "l-ahu",
    materialId: "mat-exp",
    supplierId: ids.supplier.alpha,
    inspectorId: ids.user.qi,
    inspectedAt: iso(-8, 10),
    status: "Submitted",
    defectTypeId: "dt-leak",
    defectDescription: "Nitrogen decay failed at expansion valve joint",
    classification: "Component Defect",
    sourceEventId: ids.scenario.eventA,
    notes: "Repeat Alpha valve leak — third occurrence this quarter",
  });

  for (const [i, test] of [
    ["Nitrogen decay", "≤ 0.5 psi / 10 min", "1.8 psi", false],
    ["Nameplate / wiring", "Per WI-AHU-07", "OK", true],
    ["Airflow", "24,000–26,000 CMH", "25,100 CMH", true],
  ].entries()) {
    inspectionResults.push({
      id: `ir-41-${i}`,
      inspectionId: "insp-0041",
      test: test[0] as string,
      specification: test[1] as string,
      actual: test[2] as string,
      pass: test[3] as boolean,
    });
  }

  productionConstraints.push({
    id: "pc-0007",
    number: ids.scenario.pcA,
    sourceEventId: ids.scenario.eventA,
    serialNumber: ids.scenario.serialA,
    orderId: "po-m-ahu-p",
    modelId: "m-ahu-p",
    defect: "Expansion valve leak — component",
    classification: "Component Defect",
    action: "Hold unit, isolate remaining Alpha lot",
    disposition: "Hold",
    status: "In Rework",
    createdAt: iso(-8, 11),
  });

  ncrs.push(
    ncr(
      "ncr-0012",
      ids.scenario.ncrA,
      "Production NCR",
      "AHU Line / Incoming valve lot",
      ids.dept.quality,
      "High",
      "CMP-EXP-4421 leak after refrigerant charge",
      "Quarantine lot ALPHA-VLV-229, hold SN-AHU-2026-1842",
      ids.user.qe,
      day(2),
      "Investigation",
      ids.scenario.eventA,
      ids.supplier.alpha,
    ),
  );

  supplierNcrs.push({
    id: "sncr-0004",
    number: ids.scenario.sncrA,
    ncrId: "ncr-0012",
    sourceEventId: ids.scenario.eventA,
    supplierId: ids.supplier.alpha,
    materialId: "mat-exp",
    defect: "Expansion valve leakage — flare seat porosity",
    status: "Supplier Submitted",
    issuedAt: iso(-7, 8),
    ownerId: ids.user.sc,
    dueDate: day(1),
  });

  supplierNcrResponses.push({
    id: "sncrr-0004",
    supplierNcrId: "sncr-0004",
    rootCause: "Machining burr on flare seat from tool wear after 18,000 cycles",
    correctiveAction: "100% air decay on lot ALPHA-VLV-229; replace tool insert",
    preventiveAction: "Tool-life interlock at 15,000 cycles; incoming C=0 sampling",
    completionDate: day(5),
    evidence: "ALPHA-8D-229.pdf",
    submittedAt: iso(-2, 16),
    submittedBy: ids.user.supplier,
    reviewDecision: null,
    reviewNotes: null,
  });

  capas.push(
    capa(
      "capa-0008",
      ids.scenario.capaA,
      "supplier_ncr",
      "sncr-0004",
      ids.scenario.sncrA,
      ids.scenario.eventA,
      "Repeat Alpha Components expansion valve leakage on AHU-P25",
      "Supplier tool wear + incoming sampling gap",
      "Hold remaining valves; sort on-line",
      "Tighten incoming inspection to C=0 for CMP-EXP-4421",
      "Add supplier process audit to 2026 Q4 plan",
      ids.user.qe,
      day(5),
      "In Progress",
    ),
  );

  // Additional inspections / events
  const extraDefects: Array<[string, string, string, string, "Process Defect" | "Component Defect", string | null, string | null]> = [
    ["insp-0001", "INSP-2026-0001", "SN-WRAC-2026-1004", "m-wrac-18", "Process Defect", null, null],
    ["insp-0002", "INSP-2026-0002", "SN-DFS-2026-1022", "m-dfs-36", "Process Defect", null, null],
    ["insp-0003", "INSP-2026-0003", "SN-PAC-2026-1031", "m-pac-10", "Component Defect", "mat-comp", ids.supplier.oasis],
    ["insp-0004", "INSP-2026-0004", "SN-FCU-2026-1040", "m-fcu-c", "Process Defect", null, null],
    ["insp-0005", "INSP-2026-0005", ids.scenario.serialC, "m-ahu-s", "Process Defect", null, null],
    ["insp-0018", "INSP-2026-0018", "SN-AHU-2026-1088", "m-ahu-p", "Component Defect", "mat-exp", ids.supplier.alpha],
    ["insp-0022", "INSP-2026-0022", "SN-LSS-2026-1090", "m-lss-ch", "Process Defect", null, null],
    ["insp-0029", "INSP-2026-0029", "SN-WRAC-2026-1011", "m-wrac-24", "Component Defect", "mat-pcb", ids.supplier.east],
    ["insp-0033", "INSP-2026-0033", "SN-PAC-2026-1038", "m-pac-15", "Process Defect", null, null],
    ["insp-0037", "INSP-2026-0037", "SN-AHU-2026-1112", "m-ahu-h", "Component Defect", "mat-exp", ids.supplier.alpha],
  ];

  extraDefects.forEach((row, idx) => {
    const qid = `QE-2026-${String(idx + 1).padStart(4, "0")}`;
    if (qid === ids.scenario.eventA) return;
    qualityEvents.push({
      id: qid,
      sourceEventId: qid,
      type: row[4],
      occurredAt: iso(-30 + idx * 2, 11),
      serialNumber: row[2],
      modelId: row[3],
      lineId: familyLine[models.find((x) => x.id === row[3])?.familyId ?? ids.family.ahu] ?? "l-ahu",
      supplierId: row[6],
      materialId: row[5],
      defectTypeId: idx % 2 === 0 ? "dt-leak" : idx % 3 === 0 ? "dt-elec" : "dt-perf",
      description: `${row[4]} on ${row[2]}`,
      departmentId: ids.dept.quality,
      originModule: "production_inspection",
      originRecordId: row[0],
    });
    inspections.push({
      id: row[0],
      number: row[1],
      kind: idx % 4 === 0 ? "Final" : idx % 3 === 0 ? "Incoming" : idx % 2 === 0 ? "In-Process" : "Production",
      serialNumber: row[2],
      orderId: `po-${row[3]}`,
      modelId: row[3],
      lineId: "l-ahu",
      materialId: row[5],
      supplierId: row[6],
      inspectorId: idx % 2 === 0 ? ids.user.qi : ids.user.qi2,
      inspectedAt: iso(-30 + idx * 2, 11),
      status: idx === 0 ? "Draft" : "Closed",
      defectTypeId: "dt-leak",
      defectDescription: row[4],
      classification: row[4],
      sourceEventId: qid,
      notes: "DEMO DATA",
    });
  });

  const ncrSeed: Array<[string, string, Ncr["type"], string, string, Ncr["status"], string | null]> = [
    ["ncr-0001", "NCR-2026-0001", "Production NCR", "Brazing porosity on DFS coil", "Medium", "Closed", "QE-2026-0002"],
    ["ncr-0002", "NCR-2026-0002", "Internal NCR", "Work instruction revision skipped", "Low", "Closed", null],
    ["ncr-0003", "NCR-2026-0003", "Supplier-related NCR", "Oasis compressor oil residue", "High", "Verification", "QE-2026-0003"],
    ["ncr-0004", "NCR-2026-0004", "Production NCR", "Paint orange peel PAC cabinet", "Low", "Closed", null],
    ["ncr-0005", "NCR-2026-0005", "Production NCR", "AHU drain pan leak — process", "High", "Action Required", "QE-2026-0005"],
    ["ncr-0006", "NCR-2026-0006", "Internal NCR", "Gauge used past due date", "Medium", "Closed", null],
    ["ncr-0007", "NCR-2026-0007", "Supplier-related NCR", "Eastern PCB conformal coat void", "High", "Under Review", "QE-2026-0008"],
    ["ncr-0008", "NCR-2026-0008", "Production NCR", "FCU impeller rub", "Medium", "Closed", "QE-2026-0004"],
    ["ncr-0009", "NCR-2026-0009", "Other", "Warehouse mix-up of insulation lots", "Low", "Submitted", null],
    ["ncr-0010", "NCR-2026-0010", "Production NCR", "LSS frame dimensional out of spec", "Medium", "Investigation", "QE-2026-0007"],
    ["ncr-0011", "NCR-2026-0011", "Internal NCR", "Training matrix gap on new inspector", "Low", "Closed", null],
    ["ncr-0013", "NCR-2026-0013", "Production NCR", "WRAC nameplate adhesion", "Low", "Closed", "QE-2026-0001"],
    ["ncr-0014", "NCR-2026-0014", "Supplier-related NCR", "Alpha valve leak — prior lot", "High", "Closed", "QE-2026-0006"],
    ["ncr-0015", "NCR-2026-0015", "Production NCR", "AHU panel fastener torque", "Medium", "Draft", null],
    ["ncr-0016", "NCR-2026-0016", "Production NCR", "PAC charge weight high", "Medium", "Action Required", "QE-2026-0009"],
    ["ncr-0017", "NCR-2026-0017", "Internal NCR", "Document control delay WI-QA-12", "Low", "Under Review", null],
    ["ncr-0018", "NCR-2026-0018", "Supplier-related NCR", "FanTech balance out of spec", "Medium", "Investigation", null],
    ["ncr-0019", "NCR-2026-0019", "Production NCR", "AHU filter frame gap", "Medium", "Submitted", null],
    ["ncr-0020", "NCR-2026-0020", "Other", "Incoming label mismatch", "Low", "Closed", null],
    ["ncr-0021", "NCR-2026-0021", "Production NCR", "DFS vibration at 60Hz", "High", "Verification", null],
    ["ncr-0022", "NCR-2026-0022", "Internal NCR", "5S audit aisle blocked", "Low", "Closed", null],
    ["ncr-0023", "NCR-2026-0023", "Production NCR", "FCU condensate slope", "Medium", "Action Required", null],
    ["ncr-0024", "NCR-2026-0024", "Supplier-related NCR", "Najd header ovality", "Medium", "Closed", null],
    ["ncr-0025", "NCR-2026-0025", "Production NCR", "LSS wiring ferrule", "Low", "Draft", null],
    ["ncr-0026", "NCR-2026-0026", "Production NCR", "AHU leakage repeat — Alpha related", "High", "Action Required", "QE-2026-0010"],
  ];

  ncrSeed.forEach((row, i) => {
    ncrs.push(
      ncr(row[0], row[1], row[2], row[3], ids.dept.quality, row[4] as Ncr["severity"], row[3], "Contain and tag", ids.user.qe, day(-10 + i), row[5], row[6], row[2].includes("Supplier") ? ids.supplier.alpha : null),
    );
  });

  for (let i = 1; i <= 10; i++) {
    if (i === 4) continue;
    supplierNcrs.push({
      id: `sncr-${String(i).padStart(4, "0")}`,
      number: `SNCR-2026-${String(i).padStart(4, "0")}`,
      ncrId: i === 1 ? "ncr-0003" : null,
      sourceEventId: i <= 3 ? `QE-2026-000${i}` : i === 6 ? "QE-2026-0006" : `QE-2026-000${Math.min(i, 9)}`,
      supplierId: i % 3 === 0 ? ids.supplier.oasis : i % 2 === 0 ? ids.supplier.alpha : ids.supplier.east,
      materialId: i % 2 === 0 ? "mat-exp" : "mat-pcb",
      defect: i % 2 === 0 ? "Component leak / porosity" : "Electrical coating void",
      status: i < 4 ? "Closed" : i === 5 ? "Quality Review" : "Issued",
      issuedAt: iso(-40 + i * 3),
      ownerId: ids.user.sc,
      dueDate: day(-5 + i),
    });
  }

  const capaSeed: Array<[string, string, string, string, Capa["status"], string, string | null]> = [
    ["capa-0001", "CAPA-2026-0001", "ncr", "ncr-0001", "Closed", "Brazing gas mix out of range", null],
    ["capa-0002", "CAPA-2026-0002", "ncr", "ncr-0003", "Pending Verification", "Compressor cleanliness", "QE-2026-0003"],
    ["capa-0003", "CAPA-2026-0003", "customer_complaint", "cc-0009", "In Progress", "AHU leakage at coil joint", "QE-2026-0005"],
    ["capa-0004", "CAPA-2026-0004", "audit_finding", "af-0007", "Open", "Documented procedure not followed", null],
    ["capa-0005", "CAPA-2026-0005", "ims_objective", "obj-fpy", "In Progress", "AHU FPY below target", null],
    ["capa-0006", "CAPA-2026-0006", "risk_register", "risk-alpha", "Open", "Supplier deterioration Alpha", ids.scenario.eventA],
    ["capa-0007", "CAPA-2026-0007", "ncr", "ncr-0007", "Overdue", "PCB coating process", "QE-2026-0008"],
    ["capa-0009", "CAPA-2026-0009", "customer_complaint", "cc-0004", "Closed", "Noise complaint DFS", null],
    ["capa-0010", "CAPA-2026-0010", "ncr", "ncr-0010", "Draft", "LSS frame fixture wear", "QE-2026-0007"],
    ["capa-0011", "CAPA-2026-0011", "management_review", "mr-0001", "In Progress", "Q2 COPQ spike follow-up", null],
    ["capa-0012", "CAPA-2026-0012", "supplier_ncr", "sncr-0006", "Effective", "Prior Alpha leak lot", "QE-2026-0006"],
    ["capa-0013", "CAPA-2026-0013", "audit_finding", "af-0002", "Closed", "Calibration recall process", null],
    ["capa-0014", "CAPA-2026-0014", "other", "manual", "In Progress", "Paint shop humidity control", null],
    ["capa-0015", "CAPA-2026-0015", "ncr", "ncr-0016", "Open", "PAC overcharge", "QE-2026-0009"],
    ["capa-0016", "CAPA-2026-0016", "customer_complaint", "cc-0011", "Pending Verification", "Electrical trip", null],
  ];

  capaSeed.forEach((row, i) => {
    capas.push(
      capa(row[0], row[1], row[2], row[3], row[1], row[6], row[5], "Process / supplier / method", "Contain affected units", "Correct process", "Prevent recurrence", ids.user.qe, day(i === 6 ? -2 : i < 3 ? 7 : 3 + i), row[4]),
    );
  });

  capaActions.push(
    { id: "ca-1", capaId: "capa-0008", action: " incoming C=0 sampling CMP-EXP-4421", ownerId: ids.user.qi, dueDate: day(2), status: "Open" },
    { id: "ca-2", capaId: "capa-0007", action: "Supplier process audit Eastern Controls", ownerId: ids.user.sc, dueDate: day(-2), status: "Open" },
    { id: "ca-3", capaId: "capa-0003", action: "Re-braze procedure refresh AHU", ownerId: ids.user.qi2, dueDate: day(7), status: "In Progress" },
  );

  const complaints: CustomerComplaint[] = [
    cc("cc-0009", ids.scenario.complaintC, ids.customer.gulf, "m-ahu-s", ids.scenario.serialC, "Leakage", "Water leak at coil joint after 6 weeks", 1, "Investigation", "Brazing heat input low on return bend — INTERNAL"),
    cc("cc-0001", "CC-2026-0001", ids.customer.riyadh, "m-wrac-24", "SN-WRAC-2026-1004", "Noise", "Excessive rattle at high fan", 2, "Closed", null),
    cc("cc-0002", "CC-2026-0002", ids.customer.jeddah, "m-dfs-36", "SN-DFS-2026-1022", "Performance", "Insufficient cooling at 46C ambient", 1, "Final Decision", null),
    cc("cc-0003", "CC-2026-0003", ids.customer.dammam, "m-pac-10", "SN-PAC-2026-1031", "Electrical", "Random trip on start", 1, "Corrective Action", null),
    cc("cc-0004", "CC-2026-0004", ids.customer.nebula, "m-dfs-60", "SN-DFS-2026-1028", "Noise", "Tonal noise in server corridor", 3, "Closed", "Fan balance"),
    cc("cc-0005", "CC-2026-0005", ids.customer.oasis, "m-fcu-c", "SN-FCU-2026-1040", "Appearance", "Cabinet scratch on arrival", 4, "Closed", null),
    cc("cc-0006", "CC-2026-0006", ids.customer.metro, "m-ahu-p", "SN-AHU-2026-1088", "Leakage", "Drain overflow", 1, "Under Review", null),
    cc("cc-0007", "CC-2026-0007", ids.customer.desert, "m-pac-15", "SN-PAC-2026-1038", "Mechanical", "Damper actuator stall", 1, "Need More Information", null),
    cc("cc-0008", "CC-2026-0008", ids.customer.highland, "m-wrac-18", "SN-WRAC-2026-1008", "Noise", "Night-time compressor knock", 2, "Investigation", null),
    cc("cc-0010", "CC-2026-0010", ids.customer.coastal, "m-lss-dx", "SN-LSS-2026-1090", "Performance", "Capacity short on zone 3", 1, "Submitted", null),
    cc("cc-0011", "CC-2026-0011", ids.customer.gulf, "m-ahu-h", "SN-AHU-2026-1112", "Electrical", "Heater interlock trip", 1, "Corrective Action", "Sensor polarity — INTERNAL"),
    cc("cc-0012", "CC-2026-0012", ids.customer.riyadh, "m-fcu-h", "SN-FCU-2026-1048", "Leakage", "Valve packing weep", 2, "Under Review", null),
    cc("cc-0013", "CC-2026-0013", ids.customer.jeddah, "m-dfs-36", "SN-DFS-2026-1024", "Noise", "Air rush at grille", 1, "Closed", null),
    cc("cc-0014", "CC-2026-0014", ids.customer.nebula, "m-ahu-p", "SN-AHU-2026-1099", "Performance", "Filter dP high", 1, "Investigation", null),
    cc("cc-0015", "CC-2026-0015", ids.customer.gulf, "m-ahu-s", "SN-AHU-2026-1108", "Leakage", "Second leakage report same site", 1, "Submitted", null),
  ];

  const reworks: Rework[] = [
    { id: "rw-1", number: "RW-2026-0001", sourceEventId: ids.scenario.eventA, serialNumber: ids.scenario.serialA, attempt: 1 as const, date: iso(-6), reason: "Replace Alpha valve", action: "Replace CMP-EXP-4421", ownerId: ids.user.qi, result: "Fail" as const, status: "HOLD" as const },
    { id: "rw-2", number: "RW-2026-0002", sourceEventId: ids.scenario.eventA, serialNumber: ids.scenario.serialA, attempt: 2 as const, date: iso(-3), reason: "Second valve + re-braze", action: "Replace and nitrogen test", ownerId: ids.user.qi2, result: "Pending" as const, status: "Re-inspection" as const },
    { id: "rw-3", number: "RW-2026-0003", sourceEventId: "QE-2026-0002", serialNumber: "SN-DFS-2026-1022", attempt: 1 as const, date: iso(-20), reason: "Re-braze", action: "Re-braze return bend", ownerId: ids.user.qi, result: "Pass" as const, status: "Closed" as const },
  ];
  for (let i = 4; i <= 10; i++) {
    reworks.push({
      id: `rw-${i}`,
      number: `RW-2026-${String(i).padStart(4, "0")}`,
      sourceEventId: `QE-2026-000${Math.min(i, 9)}`,
      serialNumber: `SN-DEMO-${1100 + i}`,
      attempt: 1,
      date: iso(-25 + i),
      reason: "Cosmetic / process rework",
      action: "Rework per WI-RW-02",
      ownerId: ids.user.qi,
      result: i % 3 === 0 ? "Fail" : "Pass",
      status: i % 3 === 0 ? "HOLD" : "Closed",
    });
  }

  const rrrRecords = [
    { id: "rrr-1", number: "RRR-2026-0001", source: "NCR-2026-0003", sourceEventId: "QE-2026-0003", materialOrUnit: "CMP-COMP-Z300", reason: "Oil contamination", quantity: 2, cost: 4200, disposition: "RTV", approval: "Khalid Al-Harbi", evidence: "RRR-0001.pdf", status: "Closed" as const, createdAt: iso(-22) },
    { id: "rrr-2", number: "RRR-2026-0002", source: "PC-2026-0007", sourceEventId: ids.scenario.eventA, materialOrUnit: "CMP-EXP-4421", reason: "Porous flare seat", quantity: 14, cost: 1860, disposition: "RTV", approval: "Pending", evidence: "", status: "Submitted" as const, createdAt: iso(-7) },
    { id: "rrr-3", number: "RRR-2026-0003", source: "Incoming", sourceEventId: null, materialOrUnit: "RM-CU-3/8", reason: "Ovality", quantity: 120, cost: 960, disposition: "Scrap", approval: "Lina Al-Mutairi", evidence: "RRR-0003.pdf", status: "Approved" as const, createdAt: iso(-14) },
    { id: "rrr-4", number: "RRR-2026-0004", source: "Final Inspection", sourceEventId: "QE-2026-0001", materialOrUnit: "SN-WRAC-2026-1004", reason: "Cabinet damage", quantity: 1, cost: 310, disposition: "Scrap", approval: "Noura Al-Otaibi", evidence: "RRR-0004.pdf", status: "Closed" as const, createdAt: iso(-18) },
    { id: "rrr-5", number: "RRR-2026-0005", source: "Warehouse", sourceEventId: null, materialOrUnit: "RM-INS-NBR", reason: "Expired adhesive", quantity: 40, cost: 220, disposition: "Scrap", approval: "Lina Al-Mutairi", evidence: "", status: "Draft" as const, createdAt: iso(-4) },
    { id: "rrr-6", number: "RRR-2026-0006", source: "NCR-2026-0007", sourceEventId: "QE-2026-0008", materialOrUnit: "CMP-PCB-8802", reason: "Coating void", quantity: 6, cost: 1500, disposition: "RTV", approval: "Omar Al-Qahtani", evidence: "RRR-0006.pdf", status: "Approved" as const, createdAt: iso(-11) },
  ];

  const copqRecords = [
    { id: "copq-1", date: "2026-01-31", departmentId: ids.dept.production, modelId: "m-wrac-18", scrapCost: 3200, description: "Jan scrap — cabinets", rrrId: null },
    { id: "copq-2", date: "2026-02-28", departmentId: ids.dept.production, modelId: "m-dfs-36", scrapCost: 2800, description: "Feb scrap — coils", rrrId: null },
    { id: "copq-3", date: "2026-03-31", departmentId: ids.dept.paint, modelId: "m-pac-10", scrapCost: 4100, description: "Mar paint rejects", rrrId: null },
    { id: "copq-4", date: "2026-04-30", departmentId: ids.dept.production, modelId: "m-ahu-s", scrapCost: 3600, description: "Apr AHU panels", rrrId: null },
    { id: "copq-5", date: "2026-05-31", departmentId: ids.dept.supply, modelId: null, scrapCost: 2900, description: "May incoming scrap", rrrId: null },
    { id: "copq-6", date: "2026-06-30", departmentId: ids.dept.production, modelId: "m-ahu-p", scrapCost: 6200, description: "Jun AHU leakage scrap", rrrId: null },
    { id: "copq-7", date: "2026-07-31", departmentId: ids.dept.production, modelId: "m-fcu-c", scrapCost: 2500, description: "Jul FCU", rrrId: null },
    { id: "copq-8", date: "2026-08-31", departmentId: ids.dept.paint, modelId: "m-pac-15", scrapCost: 4700, description: "Aug powder batch", rrrId: null },
    { id: "copq-9", date: "2026-09-30", departmentId: ids.dept.production, modelId: "m-ahu-p", scrapCost: 7800, description: "Sep Alpha-related scrap (COPQ source, not RRR copy)", rrrId: null },
    { id: "copq-10", date: "2026-10-04", departmentId: ids.dept.production, modelId: "m-ahu-p", scrapCost: 5050, description: "Oct MTD scrap", rrrId: null },
  ];

  const deviations: Deviation[] = [
    { id: "dev-1", number: "DEV-2026-0001", orderId: "po-m-wrac-12", originalMaterialId: "mat-ins", alternativeMaterialId: "mat-fin", originalQty: 40, alternativeQty: 40, costDifference: 120, reason: "Insulation lot delay", approval: "Faisal Al-Shammari", validFrom: day(-20), validTo: day(10), status: "Approved" as const, createdBy: ids.user.pe, createdAt: iso(-20) },
    { id: "dev-2", number: "DEV-2026-0002", orderId: "po-m-lss-dx", originalMaterialId: "mat-fan", alternativeMaterialId: "mat-fan", originalQty: 4, alternativeQty: 4, costDifference: 0, reason: "Alternate fan revision", approval: "Pending", validFrom: day(-2), validTo: day(30), status: "Draft" as const, createdBy: ids.user.pe, createdAt: iso(-2) },
  ];
  for (let i = 3; i <= 8; i++) {
    deviations.push({
      id: `dev-${i}`,
      number: `DEV-2026-${String(i).padStart(4, "0")}`,
      orderId: productionOrders[i]!.id,
      originalMaterialId: "mat-cu",
      alternativeMaterialId: "mat-hdr",
      originalQty: 10,
      alternativeQty: 10,
      costDifference: 80 * i,
      reason: "Material substitution request",
      approval: i < 6 ? "Approved" : "Pending",
      validFrom: day(-30 + i * 3),
      validTo: day(15),
      status: i === 7 ? "Expired" : i < 6 ? "Approved" : "Draft",
      createdBy: ids.user.pe,
      createdAt: iso(-30 + i * 3),
    });
  }

  const sampleEvaluations = [
    { id: "se-1", number: "SE-2026-0001", supplierId: ids.supplier.alpha, materialId: "mat-exp", status: "Quality Evaluation" as const, requestedBy: ids.user.pe, requestedAt: iso(-12), notes: "New valve revision B", finalDecision: null },
    { id: "se-2", number: "SE-2026-0002", supplierId: ids.supplier.fantech, materialId: "mat-fan", status: "Approved" as const, requestedBy: ids.user.pe, requestedAt: iso(-40), notes: "Low-noise fan", finalDecision: "Approved" },
    { id: "se-3", number: "SE-2026-0003", supplierId: ids.supplier.east, materialId: "mat-pcb", status: "Not Approved" as const, requestedBy: ids.user.qe, requestedAt: iso(-50), notes: "Coating process change", finalDecision: "Not Approved" },
    { id: "se-4", number: "SE-2026-0004", supplierId: ids.supplier.gulfcoil, materialId: "mat-fin", status: "Temporary" as const, requestedBy: ids.user.pe, requestedAt: iso(-15), notes: "Fin alloy trial", finalDecision: "Temporary — 90 days" },
    { id: "se-5", number: "SE-2026-0005", supplierId: ids.supplier.oasis, materialId: "mat-comp", status: "PE Review" as const, requestedBy: ids.user.pe, requestedAt: iso(-8), notes: "Oil type change", finalDecision: null },
    { id: "se-6", number: "SE-2026-0006", supplierId: ids.supplier.najd, materialId: "mat-hdr", status: "QE Document Review" as const, requestedBy: ids.user.sc, requestedAt: iso(-6), notes: "Header drawing rev C", finalDecision: null },
    { id: "se-7", number: "SE-2026-0007", supplierId: ids.supplier.redsea, materialId: "mat-ins", status: "Final Approval" as const, requestedBy: ids.user.pe, requestedAt: iso(-4), notes: "Thicker NBR", finalDecision: null },
    { id: "se-8", number: "SE-2026-0008", supplierId: ids.supplier.delta, materialId: "mat-cu", status: "Request" as const, requestedBy: ids.user.sc, requestedAt: iso(-1), notes: "Soft-annealed tube", finalDecision: null },
  ];

  const ecns: Ecn[] = [
    { id: "ecn-1", number: "ECN-2026-0001", oldMaterialId: "mat-exp", newMaterialId: "mat-exp", modelId: "m-ahu-p", stockStrategy: "Use Current Stock First" as const, status: "Use Current Stock First" as const, oldStock: 220, newMaterialAvailable: false, firstOrderId: null, implementedAt: null, implementedBy: null, confirmedBy: null, receivingRef: null, remarks: "Rev B valve — consume current stock", createdAt: iso(-16) },
    { id: "ecn-2", number: "ECN-2026-0002", oldMaterialId: "mat-fan", newMaterialId: "mat-fan", modelId: "m-dfs-60", stockStrategy: "Implement Immediately" as const, status: "Verified" as const, oldStock: 0, newMaterialAvailable: true, firstOrderId: "po-m-dfs-60", implementedAt: iso(-21), implementedBy: ids.user.pe, confirmedBy: ids.user.qe, receivingRef: "GR-2026032", remarks: "Low-noise fan implemented", createdAt: iso(-30) },
  ];
  for (let i = 3; i <= 10; i++) {
    ecns.push({
      id: `ecn-${i}`,
      number: `ECN-2026-${String(i).padStart(4, "0")}`,
      oldMaterialId: materials[i % materials.length]!.id,
      newMaterialId: materials[(i + 1) % materials.length]!.id,
      modelId: models[i]!.id,
      stockStrategy: i % 2 === 0 ? "Use Current Stock First" : "Implement Immediately",
      status: i === 4 ? "Ready for Implementation" : i < 6 ? "Approved" : "Draft",
      oldStock: 40 * i,
      newMaterialAvailable: i % 2 === 1,
      firstOrderId: i === 4 ? productionOrders[i]!.id : null,
      implementedAt: null,
      implementedBy: null,
      confirmedBy: null,
      receivingRef: null,
      remarks: "Engineering change — DEMO DATA",
      createdAt: iso(-40 + i * 3),
    });
  }

  const equipment: Equipment[] = [
    eq("eq-42", ids.scenario.calB, "Nitrogen decay gauge", "ND-88421", "AHU Line", ids.user.qi, 180, day(-176), day(4), "CERT-88421", true),
    eq("eq-1", "CAL-0001", "Torque wrench 10-50Nm", "TW-10021", "WRAC Line", ids.user.qi, 365, day(-200), day(165), "CERT-10021", true),
    eq("eq-2", "CAL-0002", "Micrometer 0-25", "MC-3301", "Metrology", ids.user.qe, 365, day(-300), day(-12), "CERT-3301", true),
    eq("eq-3", "CAL-0003", "Multimeter", "MM-7781", "Electrical", ids.user.qi2, 365, day(-100), day(80), "CERT-7781", true),
    eq("eq-4", "CAL-0004", "Oven logger", "OV-220", "Paint Shop", ids.user.paint, 180, day(-170), day(2), "CERT-220", true),
    eq("eq-5", "CAL-0005", "Airflow hood", "AF-901", "AHU Line", ids.user.qi2, 365, day(-40), day(200), "CERT-901", true),
  ];
  for (let i = 6; i <= 20; i++) {
    equipment.push(
      eq(`eq-${i}`, `CAL-${String(i).padStart(4, "0")}`, `Gauge set ${i}`, `GS-${2000 + i}`, i % 2 === 0 ? "Metrology" : "Production", ids.user.qi, 180, day(-90 - i), day(20 + i * 3), `CERT-${2000 + i}`, i % 4 !== 0),
    );
  }
  equipment.forEach((e) => {
    e.status = deriveCalibrationStatus(e.nextDue, AS_OF, e.status);
  });
  equipment[2]!.status = "Expired";

  const calibrationRecords = equipment.slice(0, 12).map((e, i) => ({
    id: `calrec-${i}`,
    equipmentId: e.id,
    date: e.lastCalibration,
    result: "Pass" as const,
    performedBy: ids.user.qe,
    certificate: e.certificate,
    comments: "External lab — DEMO DATA",
  }));

  const logbooks: DailyLogbook[] = [];
  const logbookReadings: LogbookReading[] = [];
  for (let i = 0; i < 8; i++) {
    logbooks.push({
      id: `lb-cpu-${i}`,
      type: "CPU Coil",
      date: day(-i),
      lineId: "l-wrac",
      shift: "A",
      performedBy: ids.user.qi,
      reviewedBy: i > 0 ? ids.user.qs : null,
      status: i > 0 ? "Reviewed" : "Open",
      remarks: "Circuit pressure / leak check",
    });
    logbooks.push({
      id: `lb-ahu-${i}`,
      type: "AHU Coil",
      date: day(-i),
      lineId: "l-ahu",
      shift: "A",
      performedBy: ids.user.qi2,
      reviewedBy: i > 0 ? ids.user.qe : null,
      status: i > 0 ? "Reviewed" : "Open",
      remarks: "Header leak and fin comb",
    });
    logbooks.push({
      id: `lb-pnt-${i}`,
      type: "Paint Shop",
      date: day(-i),
      lineId: null,
      shift: "A",
      performedBy: ids.user.paint,
      reviewedBy: i > 1 ? ids.user.qs : null,
      status: i > 1 ? "Reviewed" : "Open",
      remarks: "Six interval readings captured",
    });
    [
      ["Suction pressure", "110-130 psi", "122"],
      ["Discharge pressure", "280-320 psi", "301"],
      ["Leak check", "No bubbles", "Pass"],
    ].forEach((r, ri) => {
      logbookReadings.push({
        id: `lbr-cpu-${i}-${ri}`,
        logbookId: `lb-cpu-${i}`,
        parameter: r[0]!,
        specification: r[1]!,
        actual: r[2]!,
        pass: true,
        time: "08:00",
      });
    });
    const temps = [
      ["Water Dry-Off Temperature", "110-130 C", i === 0 ? "136" : "121"],
      ["Top Coat Temperature", "180-200 C", "191"],
      ["Holding Zone Temperature", "160-180 C", "171"],
      ["Degreasing Temperature", "50-60 C", "55"],
      ["Phosphate Tank Temperature", "45-55 C", "50"],
    ];
    temps.forEach((r, ri) => {
      logbookReadings.push({
        id: `lbr-pnt-${i}-${ri}`,
        logbookId: `lb-pnt-${i}`,
        parameter: r[0]!,
        specification: r[1]!,
        actual: r[2]!,
        pass: !(i === 0 && ri === 0),
        time: "08:00",
      });
    });
  }

  const paintBatches = [
    { id: "pb-1", vendor: "Akzo Nobel", powderCode: "PN-RAL9016", powderName: "Traffic White", color: "RAL 9016", batchNo: "PB-9016-228", startedAt: iso(-10), endedAt: iso(-3), logbookId: "lb-pnt-3" },
    { id: "pb-2", vendor: "Jotun", powderCode: "PN-RAL7035", powderName: "Light Grey", color: "RAL 7035", batchNo: "PB-7035-041", startedAt: iso(-3), endedAt: null, logbookId: "lb-pnt-0" },
  ];

  const destructiveTests = [
    { id: "dt1", date: day(-2), panel: "Regular G90" as const, test: "Impact Test" as const, result: "Pass" as const, paintBatchId: "pb-2", performedBy: ids.user.paint },
    { id: "dt2", date: day(-2), panel: "Spangle G90" as const, test: "Straight Bend" as const, result: "Pass" as const, paintBatchId: "pb-2", performedBy: ids.user.paint },
    { id: "dt3", date: day(-2), panel: "A40" as const, test: "Scratch Test" as const, result: "Fail" as const, paintBatchId: "pb-2", performedBy: ids.user.paint },
    { id: "dt4", date: day(-5), panel: "Regular G90" as const, test: "Pencil Test" as const, result: "Pass" as const, paintBatchId: "pb-1", performedBy: ids.user.paint },
    { id: "dt5", date: day(-5), panel: "A40" as const, test: "Slant Bend" as const, result: "Pass" as const, paintBatchId: "pb-1", performedBy: ids.user.paint },
  ];

  const ovenTrackers = [
    { id: "ov-1", date: day(0), time: "06:40", equipmentId: "eq-4", result: "Profile within band", pass: true, performedBy: ids.user.paint, comments: "Daily oven tracker" },
    { id: "ov-2", date: day(-1), time: "06:38", equipmentId: "eq-4", result: "Profile within band", pass: true, performedBy: ids.user.paint, comments: "" },
  ];

  const imsObjectives: ImsObjective[] = [
    { id: "obj-fpy", departmentId: ids.dept.quality, standard: "ISO 9001" as const, objective: "Improve first pass yield on AHU", kpi: "FPY %", target: "≥ 97.5%", frequency: "Monthly", ownerId: ids.user.qm, actual: "96.8%", autoLinkedKpi: "fpy", achievement: "Below Target" as const, actionPlan: "AHU brazing + incoming valve control", revision: 2 },
    { id: "obj-ppm", departmentId: ids.dept.quality, standard: "ISO 9001" as const, objective: "Reduce production PPM", kpi: "Production PPM", target: "≤ 350", frequency: "Monthly", ownerId: ids.user.qm, actual: "412", autoLinkedKpi: "productionPpm", achievement: "At Risk" as const, actionPlan: "Focus AHU / PAC leakage", revision: 1 },
    { id: "obj-sppm", departmentId: ids.dept.supply, standard: "ISO 9001" as const, objective: "Supplier SPPM reduction", kpi: "SPPM", target: "≤ 250", frequency: "Monthly", ownerId: ids.user.sc, actual: "356", autoLinkedKpi: "supplierSppm", achievement: "Below Target" as const, actionPlan: "Alpha + Eastern containment", revision: 1 },
    { id: "obj-env", departmentId: ids.dept.paint, standard: "ISO 14001" as const, objective: "Reduce powder waste", kpi: "kg waste / 1000 units", target: "≤ 4.0", frequency: "Monthly", ownerId: ids.user.paint, actual: "4.6", autoLinkedKpi: null, achievement: "Below Target" as const, actionPlan: "Booth recovery audit", revision: 1 },
    { id: "obj-ohs", departmentId: ids.dept.production, standard: "ISO 45001" as const, objective: "Zero recordable incidents", kpi: "TRIR", target: "0", frequency: "Monthly", ownerId: ids.user.qs, actual: "0", autoLinkedKpi: null, achievement: "On Track" as const, actionPlan: "Continue LOTO audits", revision: 1 },
  ];
  for (let i = 6; i <= 12; i++) {
    imsObjectives.push({
      id: `obj-${i}`,
      departmentId: departments[i % departments.length]!.id,
      standard: i % 3 === 0 ? "ISO 14001" : i % 2 === 0 ? "ISO 45001" : "ISO 9001",
      objective: `Department objective ${i}`,
      kpi: "On-time actions %",
      target: "≥ 95%",
      frequency: "Quarterly",
      ownerId: ids.user.qm,
      actual: `${90 + (i % 8)}%`,
      autoLinkedKpi: null,
      achievement: i % 4 === 0 ? "At Risk" : "On Track",
      actionPlan: "Monitor via management review",
      revision: 1,
    });
  }

  const riskRegister: RiskRegisterItem[] = [
    { id: "risk-alpha", departmentId: ids.dept.supply, kind: "Risk" as const, title: "Alpha Components valve quality deterioration", assessment: "Repeat leaks in Q3-Q4", existingControls: "Incoming sampling AQL 1.0", probability: 4 as const, impact: 5 as const, residualProbability: 3 as const, residualImpact: 4 as const, ownerId: ids.user.sc, targetDate: day(10), review: "Weekly", effectiveness: "Partial", linkedObjectiveId: "obj-sppm" },
    { id: "risk-cal", departmentId: ids.dept.quality, kind: "Risk" as const, title: "Controlled gauge expiry on AHU line", assessment: "CAL-0042 due in 4 days", existingControls: "Calibration calendar", probability: 3 as const, impact: 4 as const, residualProbability: 2 as const, residualImpact: 3 as const, ownerId: ids.user.qe, targetDate: day(3), review: "Daily", effectiveness: "Monitoring", linkedObjectiveId: "obj-fpy" },
  ];
  for (let i = 3; i <= 20; i++) {
    const pr = ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5;
    const im = (((i + 2) % 5) + 1) as 1 | 2 | 3 | 4 | 5;
    riskRegister.push({
      id: `risk-${i}`,
      departmentId: departments[i % 6]!.id,
      kind: i % 5 === 0 ? "Opportunity" : "Risk",
      title: i % 5 === 0 ? `Digital checklist opportunity ${i}` : `Process risk ${i}`,
      assessment: "Workshop scored",
      existingControls: "SOP + supervisor audit",
      probability: pr,
      impact: im,
      residualProbability: Math.max(1, pr - 1) as 1 | 2 | 3 | 4 | 5,
      residualImpact: im,
      ownerId: ids.user.qm,
      targetDate: day(10 + i),
      review: "Quarterly",
      effectiveness: "Open",
      linkedObjectiveId: i % 4 === 0 ? "obj-fpy" : null,
    });
  }

  const riskActions = riskRegister.slice(0, 8).map((r, i) => ({
    id: `ra-${i}`,
    riskId: r.id,
    action: `Mitigation action for ${r.title}`,
    ownerId: r.ownerId,
    dueDate: r.targetDate,
    status: i === 0 ? ("In Progress" as const) : ("Open" as const),
  }));

  const auditPlans = departments.flatMap((d, di) =>
    (["Internal", "Internal", "Supplier"] as const).map((type, ti) => ({
      id: `ap-${d.id}-${ti}`,
      year: 2026,
      departmentId: d.id,
      process: ti === 2 ? "Supplier quality" : `${d.name} core process`,
      standard: ti === 1 ? ("ISO 14001" as const) : ("ISO 9001" as const),
      plannedDate: day(-20 + di * 8 + ti * 3),
      auditorId: ids.user.qe,
      auditeeId: ids.user.qs,
      type,
      status: di === 0 && ti === 0 ? ("In Progress" as const) : di > 3 ? ("Planned" as const) : ("Completed" as const),
    })),
  );

  const audits: Audit[] = [
    { id: "aud-3", number: ids.scenario.auditD, planId: "ap-d-qa-0", type: "Internal" as const, date: day(-3), status: "In Progress" as const, scope: "QMS clause 8 & 10 — AHU / NCR" },
    { id: "aud-1", number: "AUD-2026-0001", planId: "ap-d-prod-0", type: "Internal" as const, date: day(-40), status: "Completed" as const, scope: "Production process control" },
    { id: "aud-2", number: "AUD-2026-0002", planId: "ap-d-sc-2", type: "Supplier" as const, date: day(-24), status: "Completed" as const, scope: "Alpha Components process audit" },
  ];
  for (let i = 4; i <= 10; i++) {
    audits.push({
      id: `aud-${i}`,
      number: `AUD-2026-${String(i).padStart(4, "0")}`,
      planId: auditPlans[i]!.id,
      type: i % 4 === 0 ? "Customer" : i % 3 === 0 ? "External" : "Internal",
      date: day(-50 + i * 5),
      status: i > 8 ? "Planned" : "Completed",
      scope: "ISO integrated audit — DEMO DATA",
    });
  }

  const auditQuestions = [
    q("aq-1", "aud-3", "8.5.1", "Control of production", "WI-AHU-07", "Are brazing parameters recorded at the specified frequency?"),
    q("aq-2", "aud-3", "8.7", "Control of nonconforming outputs", "QP-NCR-01", "Are component defects linked to a single quality event?"),
    q("aq-3", "aud-3", "10.2", "Nonconformity and corrective action", "QP-CAPA-01", "Is CAPA effectiveness verified with evidence?"),
    q("aq-4", "aud-3", "7.1.5", "Monitoring and measuring resources", "QP-CAL-01", "Is expired equipment prevented from use?"),
  ];

  const auditFindings: AuditFinding[] = [
    { id: "af-0007", number: ids.scenario.findingD, auditId: "aud-3", standard: "ISO 9001" as const, clause: "8.5.1", procedure: "WI-AHU-07", departmentId: ids.dept.production, finding: "Two AHU brazing logs missing gas mix for night shift (21 Sep)", evidence: "Logbook gap 21-Sep shift B", classification: "NC" as const, ownerId: ids.user.qi2, targetDate: day(2), action: "Retrain and add shift checklist", verification: null, status: "Action Required" as const },
    { id: "af-0001", number: "AF-2026-0001", auditId: "aud-1", standard: "ISO 9001" as const, clause: "8.5.2", procedure: "WI-ID-01", departmentId: ids.dept.production, finding: "Identification labels consistent", evidence: "12/12 samples", classification: "Conformity" as const, ownerId: ids.user.qs, targetDate: day(-30), action: "None", verification: "N/A", status: "Closed" as const },
    { id: "af-0002", number: "AF-2026-0002", auditId: "aud-1", standard: "ISO 9001" as const, clause: "7.1.5", procedure: "QP-CAL-01", departmentId: ids.dept.quality, finding: "Recall list not updated same day", evidence: "CAL-0002", classification: "OFI" as const, ownerId: ids.user.qe, targetDate: day(-10), action: "Same-day recall SOP", verification: "Effective", status: "Closed" as const },
  ];
  for (let i = 3; i <= 20; i++) {
    if (i === 7) continue;
    auditFindings.push({
      id: `af-${String(i).padStart(4, "0")}`,
      number: `AF-2026-${String(i).padStart(4, "0")}`,
      auditId: audits[i % audits.length]!.id,
      standard: "ISO 9001",
      clause: "9.2",
      procedure: "QP-AUD-01",
      departmentId: departments[i % 6]!.id,
      finding: i % 4 === 0 ? "Positive 5S ownership" : `Finding ${i} — process evidence gap`,
      evidence: "Auditor notes",
      classification: i % 5 === 0 ? "NC" : i % 4 === 0 ? "Positive Finding" : i % 3 === 0 ? "OFI" : "Conformity",
      ownerId: ids.user.qe,
      targetDate: day(i - 8),
      action: i % 5 === 0 ? "Create CAPA if approved" : "Corrective containment",
      verification: i < 8 ? "Closed" : null,
      status: i < 8 ? "Closed" : "Open",
    });
  }

  const managementReviews = [
    { id: "mr-0001", number: "MR-2026-0001", meeting: "Q2 Management Review", period: "2026-Q2", attendees: "Abdullah Al-Saud, Khalid Al-Harbi, Lina Al-Mutairi, Faisal Al-Shammari", inputs: "KPIs, NCR, CAPA, complaints, SPPM, audits, IMS, risks, ECN, calibration", decisions: "Escalate Alpha; fund incoming C=0; hold AHU FPY special review", createdAt: iso(-70) },
    { id: "mr-0002", number: "MR-2026-0002", meeting: "Q3 Management Review", period: "2026-Q3", attendees: "Plant leadership team", inputs: "Q3 pack including COPQ and customer FFR", decisions: "Open special leakage task force", createdAt: iso(-12) },
  ];

  const managementActions = [
    { id: "ma-1", reviewId: "mr-0002", action: "Weekly Alpha leak war-room until SPPM < 250", ownerId: ids.user.qm, dueDate: day(7), evidence: null, status: "In Progress" as const },
    { id: "ma-2", reviewId: "mr-0002", action: "Calibrate / replace ND gauge CAL-0042 before expiry", ownerId: ids.user.qe, dueDate: day(3), evidence: null, status: "Open" as const },
    { id: "ma-3", reviewId: "mr-0001", action: "Close overdue CAPA-2026-0007", ownerId: ids.user.sc, dueDate: day(-2), evidence: null, status: "Open" as const },
  ];

  const tasks: TaskItem[] = [
    t("tsk-cal", "Schedule calibration for CAL-0042", "calibration", ids.scenario.calB, "/quality/calibration/eq-42", ids.user.qm, ids.dept.quality, "High", day(4)),
    t("tsk-capa8", "Verify Alpha incoming C=0 sampling", "capa", ids.scenario.capaA, "/quality/capa/capa-0008", ids.user.qi, ids.dept.quality, "High", day(2)),
    t("tsk-find", "Close NC finding AF-2026-0007", "audit", ids.scenario.findingD, "/ims/audit-findings/af-0007", ids.user.qi2, ids.dept.production, "Critical", day(2)),
    t("tsk-ncr", "Complete RCA on NCR-2026-0012", "production_ncr", ids.scenario.ncrA, "/quality/production-ncr/ncr-0012", ids.user.qm, ids.dept.quality, "High", day(0)),
    t("tsk-sncr", "Review Alpha 8D response", "supplier_ncr", ids.scenario.sncrA, "/quality/supplier-ncr/sncr-0004", ids.user.sc, ids.dept.supply, "High", day(1)),
    t("tsk-overdue", "Close overdue CAPA-2026-0007", "capa", "CAPA-2026-0007", "/quality/capa/capa-0007", ids.user.sc, ids.dept.supply, "Critical", day(-2)),
    t("tsk-se", "Evaluate sample SE-2026-0001", "sample_evaluation", "SE-2026-0001", "/quality/sample-evaluation/se-1", ids.user.qe, ids.dept.quality, "Medium", day(5)),
    t("tsk-ecn", "Monitor stock for ECN-2026-0001", "ecn", "ECN-2026-0001", "/quality/ecn/ecn-1", ids.user.pe, ids.dept.engineering, "Medium", day(7)),
  ];
  for (let i = 9; i <= 32; i++) {
    tasks.push(
      t(`tsk-${i}`, `Follow-up action ${i}`, "tasks", `TSK-${i}`, "/tasks", i % 2 === 0 ? ids.user.qi : ids.user.qe, ids.dept.quality, i % 5 === 0 ? "High" : "Medium", day(i % 9 === 0 ? -1 : i % 3)),
    );
  }
  tasks.push(t("tsk-done", "September COPQ pack issued", "reports", "COPQ-2026-09", "/performance/copq", ids.user.qm, ids.dept.quality, "Low", day(-5), "Completed"));

  const notifications: NotificationItem[] = [
    n("nt-1", ids.user.qm, "New NCR", ids.scenario.ncrA, "/quality/production-ncr/ncr-0012", "NCR-2026-0012 created from failed AHU inspection", iso(-8, 11), false),
    n("nt-2", ids.user.qe, "Calibration Due", ids.scenario.calB, "/quality/calibration/eq-42", "CAL-0042 expires in 4 days", iso(-1, 7), false),
    n("nt-3", ids.user.sc, "Corrective Action Submitted", ids.scenario.sncrA, "/quality/supplier-ncr/sncr-0004", "Alpha Components submitted 8D response", iso(-2, 16), false),
    n("nt-4", ids.user.qi2, "Finding Due", ids.scenario.findingD, "/ims/audit-findings/af-0007", "AF-2026-0007 target date in 2 days", iso(0, 7), false),
    n("nt-5", ids.user.supplier, "Approval Required", ids.scenario.sncrA, "/quality/supplier-ncr/sncr-0004", "Quality review pending for your 8D", iso(-2, 16), true),
    n("nt-6", ids.user.customer, "Customer Complaint Updated", ids.scenario.complaintC, "/quality/customer-complaints/cc-0009", "CC-2026-0009 moved to Investigation", iso(-5, 12), false),
  ];
  for (let i = 7; i <= 50; i++) {
    notifications.push(
      n(
        `nt-${i}`,
        i % 2 === 0 ? ids.user.qm : ids.user.qe,
        i % 4 === 0 ? "CAPA Overdue" : "NCR Overdue",
        `NCR-2026-${String(i).padStart(4, "0")}`,
        "/notifications",
        `Automated reminder ${i} — DEMO DATA`,
        iso(-i),
        i > 20,
      ),
    );
  }

  const activities = [
    a("act-1", "New NCR Created", ids.scenario.ncrA, "/quality/production-ncr/ncr-0012", "Inspector raised NCR from failed AHU nitrogen decay", ids.user.qi, iso(-8, 11)),
    a("act-2", "Customer Complaint Updated", ids.scenario.complaintC, "/quality/customer-complaints/cc-0009", "Complaint moved to Investigation", ids.user.qe, iso(-5, 12)),
    a("act-3", "CAPA Assigned", ids.scenario.capaA, "/quality/capa/capa-0008", "CAPA assigned to Quality Engineer for Alpha leak", ids.user.qm, iso(-6, 9)),
    a("act-4", "Audit Finding Closed", "AF-2026-0002", "/ims/audit-findings/af-0002", "OFI on calibration recall closed", ids.user.qs, iso(-10, 15)),
    a("act-5", "Sample Evaluation Completed", "SE-2026-0002", "/quality/sample-evaluation/se-2", "Low-noise fan sample approved", ids.user.pe, iso(-18, 11)),
    a("act-6", "ECN Implemented", "ECN-2026-0002", "/quality/ecn/ecn-2", "Low-noise fan ECN implemented on DFS-60", ids.user.pe, iso(-21, 14)),
    a("act-7", "Supplier NCR Response Received", ids.scenario.sncrA, "/quality/supplier-ncr/sncr-0004", "Alpha submitted 8D for SNCR-2026-0004", ids.user.supplier, iso(-2, 16)),
    a("act-8", "Deviation Approved", "DEV-2026-0001", "/quality/deviation/dev-1", "Insulation substitution approved on unconfirmed order", ids.user.pe, iso(-19, 10)),
  ];

  const documents = [
    { id: "doc-1", name: "ALPHA-8D-229.pdf", type: "PDF", uploadedAt: iso(-2), uploadedBy: ids.user.supplier, status: "Analyzed" as const, sizeLabel: "420 KB", summary: "Supplier 8D for expansion valve porosity." },
    { id: "doc-2", name: "AHU-Leak-Trend.xlsx", type: "XLSX", uploadedAt: iso(-4), uploadedBy: ids.user.qe, status: "Analyzed" as const, sizeLabel: "88 KB", summary: "Monthly leakage counts by line." },
    { id: "doc-3", name: "CAL-0042-Certificate.pdf", type: "PDF", uploadedAt: iso(-176), uploadedBy: ids.user.qe, status: "Uploaded" as const, sizeLabel: "210 KB", summary: null },
  ];

  const importJobs = [
    { id: "imp-1", file: "production-sep-2026.xlsx", type: "Production File" as const, uploadedBy: ids.user.sc, uploadedAt: iso(-6), status: "Imported" as const, processed: 180, added: 172, updated: 6, failed: 2 },
    { id: "imp-2", file: "ncr-load-demo.xlsx", type: "NCR File" as const, uploadedBy: ids.user.qe, uploadedAt: iso(-3), status: "Partial" as const, processed: 20, added: 16, updated: 0, failed: 4 },
  ];
  const importErrors = [
    { id: "ie-1", jobId: "imp-2", row: 7, error: "Unknown model code", value: "AHU-XX", recommendation: "Use AHU-S15 / AHU-P25 / AHU-H40" },
    { id: "ie-2", jobId: "imp-2", row: 12, error: "Duplicate NCR number", value: "NCR-2026-0012", recommendation: "Leave number blank for auto-sequence" },
    { id: "ie-3", jobId: "imp-1", row: 44, error: "Quantity not numeric", value: "twelve", recommendation: "Enter integer quantity" },
  ];

  const sequences = ["NCR", "CAPA", "CC", "SNCR", "ECN", "DEV", "AUD", "RRR", "INSP", "PC", "SE", "RW", "AF", "MR"].map((prefix) => ({
    id: `seq-${prefix}`,
    prefix,
    year: 2026,
    nextValue: 40,
    padding: 4,
  }));

  const auditLogs: AuditLog[] = activities.map((act, i) => ({
    id: `al-${i}`,
    userId: act.actorId,
    action: act.type.includes("Created") ? "Created" : "Edited",
    module: act.type,
    recordRef: act.recordRef,
    previousValue: null,
    newValue: act.description,
    createdAt: act.createdAt,
  }));

  const workflows = [
    { id: "wf-ncr", module: "production_ncr", name: "Production NCR", steps: ["Draft", "Submitted", "Under Review", "Investigation", "Action Required", "Verification", "Closed"], active: true },
    { id: "wf-capa", module: "capa", name: "CAPA", steps: ["Draft", "Open", "In Progress", "Pending Verification", "Effective", "Closed"], active: true },
    { id: "wf-sncr", module: "supplier_ncr", name: "Supplier NCR", steps: ["Issued", "Supplier Submitted", "Quality Review", "Accepted", "Verification", "Closed"], active: true },
    { id: "wf-se", module: "sample_evaluation", name: "Sample Evaluation", steps: ["Request", "PE Manager Approval", "QE Document Review", "Quality Evaluation", "QE Review", "PE Review", "Final Approval"], active: true },
  ];

  const insights = [
    { id: "ins-1", severity: "HIGH" as const, title: "Leakage defects increased 18% compared with the previous month.", explanation: "AHU and PAC nitrogen-decay failures rose from 11 to 13 events. Alpha valve lot ALPHA-VLV-229 is the largest contributor.", relatedRecords: [ids.scenario.ncrA, ids.scenario.sncrA], recommendedAction: "Hold remaining Alpha lot and complete C=0 incoming.", href: "/quality/production-ncr/ncr-0012" },
    { id: "ins-2", severity: "HIGH" as const, title: "Supplier ALPHA COMPONENTS represents 31% of component-related NCRs.", explanation: "Distinct source events tied to Alpha exceed other suppliers this quarter.", relatedRecords: [ids.scenario.sncrA, "SNCR-2026-0006"], recommendedAction: "Escalate to supplier performance review.", href: "/performance/supplier-sppm" },
    { id: "ins-3", severity: "MEDIUM" as const, title: "3 CAPA actions are likely to become overdue within 7 days.", explanation: "CAPA-2026-0008, CAPA-2026-0005 and management action MA-2 share clustered due dates.", relatedRecords: [ids.scenario.capaA], recommendedAction: "Rebalance owners or extend with documented reason.", href: "/quality/capa" },
    { id: "ins-4", severity: "MEDIUM" as const, title: "FPY for AHU line declined for two consecutive reporting periods.", explanation: "AHU good-qty ratio declined in August and September versus the family target of 97.5%.", relatedRecords: ["obj-fpy"], recommendedAction: "Open special review at next production meeting.", href: "/performance/quality-dashboard" },
    { id: "ins-5", severity: "CRITICAL" as const, title: "Calibration certificate CAL-0042 expires in 4 days.", explanation: "Nitrogen decay gauge is controlled equipment on the AHU line. Expired status will block inspections.", relatedRecords: [ids.scenario.calB], recommendedAction: "Schedule calibration before 8 Oct 2026.", href: "/quality/calibration/eq-42" },
    { id: "ins-6", severity: "MEDIUM" as const, title: "Customer complaints related to noise are trending upward.", explanation: "Noise complaints from hospitality and data-center customers increased versus Q2.", relatedRecords: ["CC-2026-0004", "CC-2026-0008"], recommendedAction: "Review fan balance and compressor isolation.", href: "/performance/customer-ffr" },
  ];

  const kpiSnapshots = [
    { id: "k1", period: "2026-07", productionPpm: 388, customerPpm: 241, supplierSppm: 298, ncrOpen: 18, ffrPpm: 980, fpy: 97.2, copq: 2500, pcPercent: 1.4 },
    { id: "k2", period: "2026-08", productionPpm: 401, customerPpm: 255, supplierSppm: 322, ncrOpen: 21, ffrPpm: 1110, fpy: 97.0, copq: 4700, pcPercent: 1.6 },
    { id: "k3", period: "2026-09", productionPpm: 412, customerPpm: 268, supplierSppm: 356, ncrOpen: 23, ffrPpm: 1245, fpy: 96.8, copq: 7800, pcPercent: 1.8 },
  ];

  const permissions: Permission[] = [];
  const rolePermissions: RolePermission[] = [];

  const morePc: ProductionConstraint[] = [
    { id: "pc-0001", number: "PC-2026-0001", sourceEventId: "QE-2026-0001", serialNumber: "SN-WRAC-2026-1004", orderId: "po-m-wrac-18", modelId: "m-wrac-18", defect: "Nameplate adhesion", classification: "Process Defect" as const, action: "Replace nameplate", disposition: "Rework" as const, status: "Closed" as const, createdAt: iso(-28) },
    { id: "pc-0002", number: "PC-2026-0002", sourceEventId: "QE-2026-0002", serialNumber: "SN-DFS-2026-1022", orderId: "po-m-dfs-36", modelId: "m-dfs-36", defect: "Coil leak", classification: "Process Defect" as const, action: "Re-braze", disposition: "Rework" as const, status: "Closed" as const, createdAt: iso(-26) },
  ];
  for (let i = 3; i <= 10; i++) {
    if (i === 7) continue;
    morePc.push({
      id: `pc-${String(i).padStart(4, "0")}`,
      number: `PC-2026-${String(i).padStart(4, "0")}`,
      sourceEventId: `QE-2026-${String(i).padStart(4, "0")}`,
      serialNumber: `SN-DEMO-${1200 + i}`,
      orderId: productionOrders[i % productionOrders.length]!.id,
      modelId: models[i % models.length]!.id,
      defect: "Line constraint — DEMO DATA",
      classification: i % 2 === 0 ? "Component Defect" : "Process Defect",
      action: "Hold and disposition",
      disposition: "Hold",
      status: i > 8 ? "Open" : "Closed",
      createdAt: iso(-20 + i),
    });
  }

  return {
    meta: { generatedAt: new Date().toISOString(), isDemoData: true, asOf: AS_OF },
    departments,
    roles,
    permissions,
    rolePermissions,
    profiles,
    customers,
    suppliers,
    modelFamilies,
    models,
    productionLines,
    materials,
    defectTypes,
    complaintTypes,
    productionOrders,
    productionUnits,
    productionRecords,
    receivingRecords,
    qualityEvents,
    inspections,
    inspectionResults,
    productionConstraints: [...productionConstraints, ...morePc],
    ncrs,
    ncrActions,
    supplierNcrs,
    supplierNcrResponses,
    complaints,
    capas,
    capaActions,
    reworks,
    rrrRecords,
    copqRecords,
    deviations,
    sampleEvaluations,
    ecns,
    equipment,
    calibrationRecords,
    logbooks,
    logbookReadings,
    paintBatches,
    destructiveTests,
    ovenTrackers,
    imsObjectives,
    objectiveMeasurements: imsObjectives.map((o, i) => ({
      id: `om-${i}`,
      objectiveId: o.id,
      period: "2026-09",
      actual: o.actual,
      notes: "Auto-linked where KPI exists",
    })),
    riskRegister,
    riskActions,
    engineRisks: [],
    auditPlans,
    audits,
    auditQuestions,
    auditFindings,
    managementReviews,
    managementActions,
    tasks,
    notifications,
    activities,
    documents,
    importJobs,
    importErrors,
    sequences,
    auditLogs,
    workflows,
    aiAnalyses: [],
    insights,
    kpiSnapshots,
  };
}

function p(
  id: string,
  email: string,
  fullName: string,
  roleId: string,
  departmentId: string | null,
  title: string,
  avatarInitials: string,
  supplierId?: string,
  customerId?: string,
) {
  return {
    id,
    email,
    passwordHash: "DEMO",
    fullName,
    roleId,
    departmentId,
    supplierId: supplierId ?? null,
    customerId: customerId ?? null,
    title,
    locale: "en" as const,
    active: true,
    avatarInitials,
  };
}

function m(id: string, familyId: string, code: string, name: string) {
  return { id, familyId, code, name };
}

function mat(id: string, partNumber: string, description: string, supplierId: string, category: string) {
  return { id, partNumber, description, supplierId, category };
}

function ncr(
  id: string,
  number: string,
  type: Ncr["type"],
  source: string,
  departmentId: string,
  severity: Ncr["severity"],
  defect: string,
  containment: string,
  ownerId: string,
  dueDate: string,
  status: Ncr["status"],
  sourceEventId: string | null,
  supplierId: string | null,
): Ncr {
  return {
    id,
    number,
    type,
    sapReference: null,
    source,
    departmentId,
    severity,
    defect,
    containment,
    rcaMethod: status === "Draft" ? null : "5 Why",
    rca: status === "Draft" ? null : "Method / machine / material review — DEMO DATA",
    correctiveAction: status === "Closed" ? "Action completed and verified" : "In progress",
    preventiveAction: "Standardize and train",
    ownerId,
    dueDate,
    disposition: "Hold",
    status,
    sourceEventId,
    supplierId,
    voidReason: null,
    createdBy: ids.user.qi,
    createdAt: `${dueDate}T08:00:00.000Z`,
    updatedAt: `${dueDate}T08:00:00.000Z`,
  };
}

function capa(
  id: string,
  number: string,
  originModule: string,
  originRecordId: string,
  originLabel: string,
  sourceEventId: string | null,
  problem: string,
  rootCause: string,
  containment: string,
  correctiveAction: string,
  preventiveAction: string,
  ownerId: string,
  dueDate: string,
  status: Capa["status"],
): Capa {
  return {
    id,
    number,
    originModule,
    originRecordId,
    originLabel,
    sourceEventId,
    problem,
    rootCause,
    containment,
    correctiveAction,
    preventiveAction,
    ownerId,
    dueDate,
    evidence: status === "Closed" || status === "Effective" ? "Verification pack attached" : null,
    effectiveness: status === "Effective" || status === "Closed" ? "Effective" : null,
    status,
    createdAt: `${dueDate}T08:00:00.000Z`,
  };
}

function cc(
  id: string,
  number: string,
  customerId: string,
  modelId: string,
  serialNumber: string,
  type: string,
  description: string,
  quantity: number,
  status: CustomerComplaint["status"],
  internalRca: string | null,
): CustomerComplaint {
  return {
    id,
    number,
    customerId,
    modelId,
    serialNumber,
    type,
    description,
    quantity,
    status,
    requestedInfo: status === "Need More Information" ? "Please share installation photos and runtime hours." : null,
    decision: status === "Closed" || status === "Final Decision" ? "Replacement parts authorized" : null,
    finalResponse: status === "Closed" ? "Unit corrected. Thank you for your patience." : null,
    replacementStatus: status === "Closed" ? "Shipped" : "Not requested",
    internalRca,
    sourceEventId: number === ids.scenario.complaintC ? "QE-2026-0005" : null,
    ownerId: ids.user.qe,
    submittedAt: day(-20),
    submittedBy: customerId === ids.customer.gulf ? ids.user.customer : ids.user.qe,
  };
}

function eq(
  id: string,
  equipmentId: string,
  type: string,
  serialNumber: string,
  location: string,
  ownerId: string,
  frequencyDays: number,
  lastCalibration: string,
  nextDue: string,
  certificate: string,
  controlled: boolean,
): Equipment {
  return {
    id,
    equipmentId,
    type,
    serialNumber,
    location,
    ownerId,
    frequencyDays,
    lastCalibration,
    nextDue,
    certificate,
    status: "Valid",
    controlled,
  };
}

function q(id: string, auditId: string, clause: string, subClause: string, procedure: string, question: string) {
  return {
    id,
    auditId,
    standard: "ISO 9001" as const,
    clause,
    subClause,
    procedure,
    question,
    response: null,
    result: null,
  };
}

function t(
  id: string,
  title: string,
  module: string,
  recordRef: string,
  recordHref: string,
  assigneeId: string,
  departmentId: string,
  priority: TaskItem["priority"],
  dueDate: string,
  status: TaskItem["status"] = "Open",
): TaskItem {
  return { id, title, module, recordRef, recordHref, assigneeId, departmentId, priority, dueDate, status };
}

function n(
  id: string,
  recipientId: string,
  event: string,
  recordRef: string,
  href: string,
  message: string,
  createdAt: string,
  read: boolean,
): NotificationItem {
  return { id, recipientId, event, recordRef, href, message, createdAt, read };
}

function a(
  id: string,
  type: string,
  recordRef: string,
  href: string,
  description: string,
  actorId: string,
  createdAt: string,
) {
  return { id, type, recordRef, href, description, actorId, createdAt };
}