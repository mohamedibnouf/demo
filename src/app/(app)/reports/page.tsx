import { getStore } from "@/server/data/store";
import { computeKpis } from "@/server/kpis";
import { Card, PageHeader } from "@/components/ui";

export default async function ReportsPage() {
  const kpis = computeKpis();
  const store = getStore();
  const reports = [
    ["Production Quality", `FPY ${kpis.fpy}% · PPM ${kpis.productionPpm}`],
    ["NCR", `${store.ncrs.length} records · ${kpis.ncrOpen} open`],
    ["CAPA", `${store.capas.length} records`],
    ["Supplier Quality", `SPPM ${kpis.supplierSppm}`],
    ["Customer Quality", `FFR ${kpis.ffrPpm}`],
    ["Audit", `${store.audits.length} audits · ${store.auditFindings.length} findings`],
    ["Calibration", `${store.equipment.filter((e) => e.status !== "Valid").length} attention items`],
    ["IMS Objectives", `${store.imsObjectives.filter((o) => o.achievement !== "On Track" && o.achievement !== "Achieved").length} off-track`],
    ["Risk", `${store.riskRegister.length} register items`],
    ["COPQ", `$${kpis.copq.toLocaleString()}`],
    ["Management Summary", "See Management Dashboard"],
  ];

  const csv = ["Report,Value", ...reports.map((r) => r.join(","))].join("\n");

  return (
    <div>
      <PageHeader title="Reports Center" subtitle="Filters inherit dashboard year. Demo export: CSV." />
      <div className="grid gap-3 md:grid-cols-2">
        {reports.map(([name, value]) => (
          <Card key={name} className="p-4">
            <p className="text-xs uppercase text-muted">{name}</p>
            <p className="mt-1 font-medium">{value}</p>
          </Card>
        ))}
      </div>
      <a
        className="mt-4 inline-block text-sm text-samco"
        href={`data:text/csv,${encodeURIComponent(csv)}`}
        download="samco-qms-reports.csv"
      >
        Export CSV
      </a>
    </div>
  );
}
