import Link from "next/link";
import { computeKpis, productionPerformance } from "@/server/kpis";
import { getStore } from "@/server/data/store";
import { calculateSppm } from "@/lib/engines/sppm";
import { calculateFfrPpm } from "@/lib/engines/ffr";
import { countDistinctSourceEvents } from "@/lib/engines/anti-double-count";
import { KpiGrid } from "@/features/dashboard/kpi-grid";
import { ProductionChart } from "@/components/charts";
import { Card, PageHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { runRiskEngine } from "@/server/risk-engine";
import { requireUser } from "@/server/auth/session";

export default async function PerformancePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const user = await requireUser();
  const kpis = computeKpis();
  const store = getStore();

  if (module === "quality-dashboard") {
    return (
      <div className="space-y-4">
        <PageHeader title="Quality Dashboard" subtitle="Operational quality KPIs calculated from quality events" />
        <KpiGrid kpis={kpis} />
        <Card className="p-4">
          <ProductionChart data={productionPerformance()} />
        </Card>
      </div>
    );
  }

  if (module === "management-dashboard") {
    const risks = runRiskEngine();
    return (
      <div className="space-y-4">
        <PageHeader title="Management Dashboard" subtitle="Executive view — management cannot modify operational records" />
        {user.role === "Management" ? <p className="text-sm text-muted">Read-only. Drill down is permitted; edits are blocked server-side.</p> : null}
        <KpiGrid kpis={kpis} />
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/quality/capa">
            <Card className="p-4 transition hover:border-samco">
              <p className="text-xs uppercase text-muted">Open CAPA</p>
              <p className="text-2xl font-semibold">{store.capas.filter((c) => !["Closed", "Effective"].includes(c.status)).length}</p>
            </Card>
          </Link>
          <Link href="/quality/capa">
            <Card className="p-4 transition hover:border-samco">
              <p className="text-xs uppercase text-muted">Overdue CAPA</p>
              <p className="text-2xl font-semibold">{store.capas.filter((c) => c.status === "Overdue").length}</p>
            </Card>
          </Link>
          <Link href="/risks">
            <Card className="p-4 transition hover:border-samco">
              <p className="text-xs uppercase text-muted">Significant risks</p>
              <p className="text-2xl font-semibold">{risks.filter((r) => r.level === "HIGH" || r.level === "CRITICAL").length}</p>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  if (module === "copq") {
    return (
      <div className="space-y-4">
        <PageHeader title="COPQ" subtitle="Demo definition: scrap cost ($) from COPQ source only. RRR cost is not auto-copied." />
        <Card className="p-4 text-2xl font-semibold">${kpis.copq.toLocaleString()}</Card>
        <DataTable
          rows={store.copqRecords}
          columns={[
            { key: "date", header: "Period" },
            { key: "description", header: "Description" },
            { key: "scrapCost", header: "Scrap $" },
          ]}
          searchKeys={["description"]}
        />
      </div>
    );
  }

  if (module === "supplier-sppm") {
    const rows = store.suppliers.map((s) => {
      const defects = store.qualityEvents.filter((e) => e.supplierId === s.id && e.type === "Component Defect");
      const qty = store.receivingRecords.filter((r) => r.supplierId === s.id).reduce((a, r) => a + r.quantity, 0);
      return { id: s.id, name: s.name, defects: countDistinctSourceEvents(defects), receiving: qty, sppm: calculateSppm(countDistinctSourceEvents(defects), qty || 1) };
    });
    return (
      <div className="space-y-4">
        <PageHeader title="Supplier SPPM" subtitle="Distinct source_event_id / receiving quantity × 1,000,000" />
        <DataTable rows={rows} columns={[{ key: "name", header: "Supplier" }, { key: "defects", header: "Component defects" }, { key: "receiving", header: "Receiving qty" }, { key: "sppm", header: "SPPM" }]} searchKeys={["name"]} />
      </div>
    );
  }

  if (module === "customer-ffr") {
    const rows = store.modelFamilies.map((f) => {
      const modelIds = store.models.filter((m) => m.familyId === f.id).map((m) => m.id);
      const units = store.complaints.filter((c) => modelIds.includes(c.modelId)).reduce((a, c) => a + c.quantity, 0);
      const produced = store.productionRecords.filter((r) => modelIds.includes(r.modelId)).reduce((a, r) => a + r.quantityProduced, 0);
      return { id: f.id, family: f.code, complaintUnits: units, produced, ffr: calculateFfrPpm(units, produced || 1) };
    });
    return (
      <div className="space-y-4">
        <PageHeader title="Customer FFR / PPM" subtitle="Complaint units / rolling production of the same model family × 1,000,000" />
        <DataTable rows={rows} columns={[{ key: "family", header: "Family" }, { key: "complaintUnits", header: "Complaint units" }, { key: "produced", header: "Units produced" }, { key: "ffr", header: "FFR PPM" }]} searchKeys={["family"]} />
      </div>
    );
  }

  if (module === "production-constraints") {
    return (
      <div className="space-y-4">
        <PageHeader title="Production Constraints (PC)" subtitle="Official term — not Turnback. Linked to originating quality events to prevent double counting." />
        <DataTable
          rows={store.productionConstraints.map((r) => ({ ...r, _href: `/performance/production-constraints/${r.id}` }))}
          columns={[
            { key: "number", header: "PC", link: true },
            { key: "serialNumber", header: "Serial" },
            { key: "defect", header: "Defect" },
            { key: "classification", header: "Class" },
            { key: "status", header: "Status" },
          ]}
          searchKeys={["number", "serialNumber", "defect"]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="KPI & Reports" subtitle="Calculated KPIs with documented demo assumptions" />
      <KpiGrid kpis={kpis} />
      <Link href="/reports" className="text-sm text-samco">
        Open Reports Center
      </Link>
    </div>
  );
}
