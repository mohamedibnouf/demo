import { daysRemaining } from "@/lib/engines/due-dates";
import { DEMO_AS_OF } from "@/lib/env";
import type { EngineRisk } from "@/types";
import { getStore, mutateStore } from "./data/store";
import { ids } from "./data/ids";

export function runRiskEngine(): EngineRisk[] {
  const store = getStore();
  const asOf = store.meta.asOf || DEMO_AS_OF;
  const risks: EngineRisk[] = [];

  const overdueCapas = store.capas.filter((c) => !["Closed", "Effective", "Cancelled"].includes(c.status) && daysRemaining(c.dueDate, asOf) < 0);
  if (overdueCapas.length) {
    risks.push(rule("rk-capa-od", "HIGH", "CAPA", ids.dept.quality, `${overdueCapas.length} CAPA overdue, including ${overdueCapas[0]?.number}`, overdueCapas.map((c) => c.number), "Escalate owners and verify containment", overdueCapas[0]!.ownerId, overdueCapas[0]!.dueDate));
  }

  const dueSoon = store.capas.filter((c) => !["Closed", "Effective"].includes(c.status) && daysRemaining(c.dueDate, asOf) >= 0 && daysRemaining(c.dueDate, asOf) <= 7);
  if (dueSoon.length) {
    risks.push(rule("rk-capa-soon", "MEDIUM", "CAPA", ids.dept.quality, `${dueSoon.length} CAPA approaching due date within 7 days`, dueSoon.map((c) => c.number), "Confirm evidence pack before due date", dueSoon[0]!.ownerId, dueSoon[0]!.dueDate));
  }

  const alphaEvents = store.qualityEvents.filter((e) => e.supplierId === ids.supplier.alpha);
  if (alphaEvents.length >= 3) {
    risks.push(rule("rk-alpha", "CRITICAL", "Supplier SPPM", ids.dept.supply, `Repeated defect / supplier deterioration — Alpha Components (${alphaEvents.length} distinct component events)`, alphaEvents.map((e) => e.id), "Hold lot, complete SNCR review, schedule process audit", ids.user.sc, asOf));
  }

  const leak = store.qualityEvents.filter((e) => e.defectTypeId === "dt-leak");
  if (leak.length >= 4) {
    risks.push(rule("rk-leak", "HIGH", "NCR frequency", ids.dept.quality, `High leakage NCR frequency (${leak.length} source events)`, leak.map((e) => e.id), "Focus AHU nitrogen-decay and brazing controls", ids.user.qe, asOf));
  }

  const complaintNoise = store.complaints.filter((c) => c.type === "Noise" || c.type === "Leakage");
  if (complaintNoise.length >= 4) {
    risks.push(rule("rk-cc", "MEDIUM", "Customer Complaint", ids.dept.quality, "Customer complaint increase — leakage and noise trending up", complaintNoise.map((c) => c.number), "Open customer quality review for Gulf / hospitality accounts", ids.user.qe, asOf));
  }

  const overdueFindings = store.auditFindings.filter((f) => f.status !== "Closed" && daysRemaining(f.targetDate, asOf) < 0);
  if (overdueFindings.length) {
    risks.push(rule("rk-af", "HIGH", "Audit Finding", ids.dept.quality, `${overdueFindings.length} overdue audit finding(s)`, overdueFindings.map((f) => f.number), "Complete action and verification", overdueFindings[0]!.ownerId, overdueFindings[0]!.targetDate));
  }

  for (const eq of store.equipment.filter((e) => e.controlled)) {
    const days = daysRemaining(eq.nextDue, asOf);
    if (eq.status === "Expired" || days < 0) {
      risks.push(rule(`rk-cal-${eq.id}`, "CRITICAL", "Calibration", ids.dept.quality, `${eq.equipmentId} is expired / out of calibration`, [eq.equipmentId], "Remove from service and block controlled inspections", eq.ownerId, eq.nextDue));
    } else if (days <= 7) {
      risks.push(rule(`rk-cal-${eq.id}`, "HIGH", "Calibration", ids.dept.quality, `${eq.equipmentId} expires in ${days} days`, [eq.equipmentId], "Schedule calibration immediately", eq.ownerId, eq.nextDue));
    }
  }

  const below = store.imsObjectives.filter((o) => o.achievement === "Below Target" || o.achievement === "At Risk");
  for (const o of below) {
    risks.push(rule(`rk-obj-${o.id}`, "MEDIUM", "IMS Objective", o.departmentId, `IMS objective below target: ${o.objective} (actual ${o.actual} vs ${o.target})`, [o.id], o.actionPlan, o.ownerId, asOf));
  }

  const delayedEcn = store.ecns.filter((e) => e.status === "Use Current Stock First" || e.status === "Ready for Implementation");
  if (delayedEcn.length) {
    risks.push(rule("rk-ecn", "MEDIUM", "ECN", ids.dept.engineering, `${delayedEcn.length} ECN implementation delayed or waiting stock strategy`, delayedEcn.map((e) => e.number), "Monitor old stock and new PN receiving", ids.user.pe, asOf));
  }

  const openPc = store.productionConstraints.filter((p) => p.status !== "Closed");
  if (openPc.length >= 3) {
    risks.push(rule("rk-pc", "MEDIUM", "Production Constraints", ids.dept.production, `Repeated production constraints — ${openPc.length} open`, openPc.map((p) => p.number), "Review line constraints in daily meeting", ids.user.qm, asOf));
  }

  const snapshots = store.kpiSnapshots;
  if (snapshots.length >= 2) {
    const last = snapshots[snapshots.length - 1]!;
    const prev = snapshots[snapshots.length - 2]!;
    if (last.fpy < prev.fpy) {
      risks.push(rule("rk-kpi-fpy", "MEDIUM", "KPI movement", ids.dept.quality, `Abnormal KPI movement — FPY declined ${prev.fpy} → ${last.fpy}`, ["fpy"], "Drill into AHU family FPY", ids.user.qm, asOf));
    }
  }

  mutateStore((s) => {
    s.engineRisks = risks;
  });
  return risks;
}

function rule(
  id: string,
  level: EngineRisk["level"],
  source: string,
  departmentId: string,
  description: string,
  relatedRecords: string[],
  suggestedAction: string,
  ownerId: string,
  targetDate: string,
): EngineRisk {
  return {
    id,
    level,
    source,
    departmentId,
    description,
    detectedAt: DEMO_AS_OF,
    relatedRecords,
    suggestedAction,
    ownerId,
    targetDate,
    status: "Open",
    kind: "BUSINESS_RULE",
  };
}
