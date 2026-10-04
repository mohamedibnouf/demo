import { calculateFpy } from "@/lib/engines/fpy";
import { calculateConstraintPercent, calculatePpm } from "@/lib/engines/ppm";
import { calculateFfrPpm } from "@/lib/engines/ffr";
import { calculateSppm } from "@/lib/engines/sppm";
import { countDistinctSourceEvents } from "@/lib/engines/anti-double-count";
import type { DashboardFilters, DemoStore } from "@/types";
import { getStore } from "./data/store";

export function defaultFilters(): DashboardFilters {
  return {
    year: 2026,
    month: "all",
    familyId: "all",
    modelId: "all",
    lineId: "all",
    supplierId: "all",
    departmentId: "all",
  };
}

function inPeriod(date: string, filters: DashboardFilters) {
  const d = new Date(date);
  if (d.getFullYear() !== filters.year) return false;
  if (filters.month !== "all" && d.getMonth() + 1 !== filters.month) return false;
  return true;
}

export function filterProduction(store: DemoStore, filters: DashboardFilters) {
  return store.productionRecords.filter((r) => {
    if (!inPeriod(r.date, filters)) return false;
    const model = store.models.find((m) => m.id === r.modelId);
    if (filters.modelId !== "all" && r.modelId !== filters.modelId) return false;
    if (filters.familyId !== "all" && model?.familyId !== filters.familyId) return false;
    if (filters.lineId !== "all" && r.lineId !== filters.lineId) return false;
    return true;
  });
}

export function computeKpis(filters: DashboardFilters = defaultFilters()) {
  const store = getStore();
  const production = filterProduction(store, filters);
  const units = production.reduce((s, r) => s + r.quantityProduced, 0);
  const events = store.qualityEvents.filter((e) => {
    if (!inPeriod(e.occurredAt, filters)) return false;
    const model = store.models.find((m) => m.id === e.modelId);
    if (filters.modelId !== "all" && e.modelId !== filters.modelId) return false;
    if (filters.familyId !== "all" && model?.familyId !== filters.familyId) return false;
    if (filters.lineId !== "all" && e.lineId !== filters.lineId) return false;
    if (filters.supplierId !== "all" && e.supplierId !== filters.supplierId) return false;
    if (filters.departmentId !== "all" && e.departmentId !== filters.departmentId) return false;
    return true;
  });
  const processEvents = events.filter((e) => e.type === "Process Defect");
  const componentEvents = events.filter((e) => e.type === "Component Defect");
  const pcEvents = store.productionConstraints
    .filter((pc) => events.some((e) => e.sourceEventId === pc.sourceEventId))
    .map((pc) => ({ sourceEventId: pc.sourceEventId }));

  const receiving = store.receivingRecords.filter((r) => {
    if (!inPeriod(r.date, filters)) return false;
    if (filters.supplierId !== "all" && r.supplierId !== filters.supplierId) return false;
    return true;
  });
  const recvQty = receiving.reduce((s, r) => s + r.quantity, 0);

  const complaints = store.complaints.filter((c) => {
    if (!inPeriod(c.submittedAt, filters)) return false;
    const model = store.models.find((m) => m.id === c.modelId);
    if (filters.familyId !== "all" && model?.familyId !== filters.familyId) return false;
    return true;
  });
  const complaintUnits = complaints.reduce((s, c) => s + c.quantity, 0);
  const familyUnits = units || store.productionRecords.filter((r) => inPeriod(r.date, { ...filters, month: "all" })).reduce((s, r) => s + r.quantityProduced, 0);

  const copq = store.copqRecords
    .filter((c) => inPeriod(c.date, filters) || (filters.month === "all" && c.date.startsWith(String(filters.year))))
    .reduce((s, c) => s + c.scrapCost, 0);

  const ncrOpen = store.ncrs.filter((n) => !["Closed", "Void"].includes(n.status)).length;

  const productionPpm = calculatePpm(events.length, units || 1);
  const fpy = calculateFpy(processEvents.length, units || 1);
  const supplierSppm = calculateSppm(countDistinctSourceEvents(componentEvents), recvQty || 1);
  const ffrPpm = calculateFfrPpm(complaintUnits, familyUnits || 1);
  const pcPercent = calculateConstraintPercent(countDistinctSourceEvents(pcEvents), units || 1);
  const customerPpm = calculatePpm(complaints.length, familyUnits || 1);

  return {
    productionPpm,
    customerPpm,
    supplierSppm,
    ncrOpen,
    ffrPpm,
    fpy,
    copq,
    pcPercent,
    units,
    processDefects: processEvents.length,
    componentDefects: componentEvents.length,
    trends: {
      productionPpm: 2.7,
      customerPpm: 5.1,
      supplierSppm: 10.6,
      ncrOpen: 9.5,
      ffrPpm: 12.2,
      fpy: -0.2,
      copq: 8.4,
      pcPercent: 12.5,
    },
  };
}

export function productionPerformance() {
  const store = getStore();
  return store.modelFamilies.map((family) => {
    const recs = store.productionRecords.filter((r) => {
      const model = store.models.find((m) => m.id === r.modelId);
      return model?.familyId === family.id && r.date.startsWith("2026-");
    });
    const qty = recs.reduce((s, r) => s + r.quantityProduced, 0);
    const good = recs.reduce((s, r) => s + r.goodQty, 0);
    return {
      family: family.code,
      productionQty: qty,
      goodQty: good,
      fpy: qty ? Number(((good / qty) * 100).toFixed(1)) : 0,
    };
  });
}

export function ncrBySource() {
  const store = getStore();
  const buckets: Record<string, number> = {
    Production: 0,
    Supplier: 0,
    Customer: 0,
    "Incoming Inspection": 0,
    Warehouse: 0,
    Others: 0,
  };
  for (const ncr of store.ncrs) {
    const key =
      ncr.type === "Supplier-related NCR"
        ? "Supplier"
        : ncr.source.toLowerCase().includes("incoming")
          ? "Incoming Inspection"
          : ncr.source.toLowerCase().includes("warehouse")
            ? "Warehouse"
            : ncr.type === "Other" || ncr.type === "Internal NCR"
              ? "Others"
              : "Production";
    buckets[key] = (buckets[key] ?? 0) + 1;
  }
  buckets.Customer = store.complaints.length;
  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

export function qualityTrend() {
  const store = getStore();
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    const key = `2026-${month}`;
    return {
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]!,
      ncr: store.ncrs.filter((n) => n.createdAt.startsWith(key)).length || (i < 10 ? 6 + (i % 4) : 2),
      complaints: store.complaints.filter((c) => c.submittedAt.startsWith(key)).length || (i < 10 ? 2 + (i % 3) : 1),
      supplierNcr: store.supplierNcrs.filter((s) => s.issuedAt.startsWith(key)).length || (i < 10 ? 1 + (i % 2) : 0),
    };
  });
}

export function topDefects() {
  const store = getStore();
  const counts: Record<string, number> = {};
  for (const e of store.qualityEvents) {
    const dt = store.defectTypes.find((d) => d.id === e.defectTypeId)?.name ?? "Other";
    counts[dt] = (counts[dt] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function auditStatusCounts() {
  const store = getStore();
  return {
    planned: store.audits.filter((a) => a.status === "Planned").length,
    completed: store.audits.filter((a) => a.status === "Completed").length,
    overdue: store.audits.filter((a) => a.status === "Overdue").length + store.auditPlans.filter((p) => p.status === "Overdue").length,
    openFindings: store.auditFindings.filter((f) => f.status !== "Closed").length,
    closedFindings: store.auditFindings.filter((f) => f.status === "Closed").length,
  };
}
