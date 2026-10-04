import Link from "next/link";
import { getStore } from "@/server/data/store";
import { computeKpis } from "@/server/kpis";
import { Card, PageHeader } from "@/components/ui";

export default async function ReportsPage() {
  const kpis = computeKpis();
  const store = getStore();
  const reports = [
    ["Production Quality", `FPY ${kpis.fpy}% · PPM ${kpis.productionPpm}`, "/performance/quality-dashboard"],
    ["NCR", `${store.ncrs.length} records · ${kpis.ncrOpen} open`, "/quality/production-ncr"],
    ["CAPA", `${store.capas.length} records`, "/quality/capa"],
    ["Supplier Quality", `SPPM ${kpis.supplierSppm}`, "/performance/supplier-sppm"],
    ["Customer Quality", `FFR ${kpis.ffrPpm}`, "/performance/customer-ffr"],
    ["Audit", `${store.audits.length} audits · ${store.auditFindings.length} findings`, "/ims/internal-audit"],
    ["Calibration", `${store.equipment.filter((e) => e.status !== "Valid").length} attention items`, "/quality/calibration"],
    ["IMS Objectives", `${store.imsObjectives.filter((o) => o.achievement !== "On Track" && o.achievement !== "Achieved").length} off-track`, "/ims/objectives"],
    ["Risk", `${store.riskRegister.length} register items`, "/ims/risk-opportunity"],
    ["COPQ", `$${kpis.copq.toLocaleString()}`, "/performance/copq"],
    ["Management Summary", "See Management Dashboard", "/performance/management-dashboard"],
  ] as const;

  const csv = ["Report,Value", ...reports.map(([name, value]) => `${name},${value}`)].join("\n");

  return (
    <div>
      <PageHeader title="Reports Center" subtitle="Filters inherit dashboard year. Demo export: CSV." />
      <div className="grid gap-3 md:grid-cols-2">
        {reports.map(([name, value, href]) => (
          <Link key={name} href={href}>
            <Card className="p-4 transition hover:border-samco">
              <p className="text-xs uppercase text-muted">{name}</p>
              <p className="mt-1 font-medium">{value}</p>
            </Card>
          </Link>
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
