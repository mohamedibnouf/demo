import Link from "next/link";
import { runRiskEngine } from "@/server/risk-engine";
import { getStore } from "@/server/data/store";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function RisksPage() {
  const risks = runRiskEngine();
  const store = getStore();
  return (
    <div>
      <PageHeader
        title="Smart Risk / Early Warning Engine"
        subtitle="Business-rule risks are deterministic. AI may explain them but does not raise the flag."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {risks.map((risk) => {
          const owner = store.profiles.find((p) => p.id === risk.ownerId);
          const dept = store.departments.find((d) => d.id === risk.departmentId);
          return (
            <Card key={risk.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={risk.level === "CRITICAL" || risk.level === "HIGH" ? "danger" : risk.level === "MEDIUM" ? "warning" : "info"}>
                  {risk.level}
                </Badge>
                <span className="text-xs text-muted">{risk.kind}</span>
              </div>
              <h2 className="mt-2 font-semibold">{risk.source}</h2>
              <p className="mt-1 text-sm">{risk.description}</p>
              <p className="mt-2 text-xs text-muted">
                {dept?.name} · {owner?.fullName} · Detected {risk.detectedAt} · Target {risk.targetDate}
              </p>
              <p className="mt-2 text-sm">Suggested action: {risk.suggestedAction}</p>
              <p className="mt-2 text-xs text-samco">Related: {risk.relatedRecords.join(", ")}</p>
              <Link href="/ai-assistant" className="mt-3 inline-block text-xs text-samco">
                Ask AI to explain this risk
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
