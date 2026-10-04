import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

const STEPS = [
  ["1 Dashboard", "/", "KPI cards, charts, insights, tasks, activities"],
  ["2 Smart Insights", "/", "Leakage +18%, Alpha 31%, CAL-0042, CAPA due"],
  ["3 NCR", "/quality/production-ncr/ncr-0012", "NCR-2026-0012 from failed inspection"],
  ["4 Traceability", "/quality/production-ncr/ncr-0012", "QE-2026-0018 chain"],
  ["5 CAPA", "/quality/capa/capa-0008", "CAPA-2026-0008 linked to SNCR"],
  ["6 Risk", "/risks", "Business-rule engine vs AI explanation"],
  ["7 AI", "/ai-assistant", "Similar cases + advisory disclaimer"],
  ["8 Excel Import", "/admin/excel", "Profiles, New Import, invalid rows rejected"],
  ["8b File Intelligence", "/documents/analyze", "Upload Excel/PDF → extract → validate → confirm / create NCR draft"],
  ["9 Audit", "/ims/internal-audit/aud-3", "AUD-2026-0003 + AF-2026-0007"],
  ["10 Management Dashboard", "/performance/management-dashboard", "Read-only executive view"],
  ["11 Admin", "/admin/users", "Users, numbering, reset demo data"],
];

export default function DemoGuidePage() {
  return (
    <div>
      <PageHeader title="Demo presentation flow" subtitle="Internal to the demo. Seeded records are DEMO DATA." />
      <div className="space-y-2">
        {STEPS.map(([label, href, hint]) => (
          <Card key={label} className="p-3">
            <Link href={href!} className="font-medium text-samco hover:underline">
              {label}
            </Link>
            <p className="text-sm text-muted">{hint}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
