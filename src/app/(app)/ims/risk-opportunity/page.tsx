import { imsCatalog } from "@/features/catalog";
import { CatalogListPage } from "@/features/records/list-page";
import { getStore } from "@/server/data/store";
import { riskScore, scoreToLevel } from "@/lib/engines/risk-scoring";
import { Card } from "@/components/ui";

export default async function RiskRegisterPage() {
  const items = getStore().riskRegister;
  const cells = Array.from({ length: 5 }, (_, impact) =>
    Array.from({ length: 5 }, (__, prob) =>
      items.filter((r) => r.probability === prob + 1 && r.impact === 5 - impact).length,
    ),
  );
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted">5×5 risk matrix (Probability × Impact)</h2>
        <div className="grid grid-cols-6 gap-1 text-center text-xs">
          <div />
          {[1, 2, 3, 4, 5].map((p) => (
            <div key={p} className="font-semibold">
              P{p}
            </div>
          ))}
          {cells.map((row, i) => (
            <div key={i} className="contents">
              <div className="font-semibold">I{5 - i}</div>
              {row.map((count, j) => {
                const score = riskScore(j + 1, 5 - i);
                const level = scoreToLevel(score);
                const bg = level === "CRITICAL" ? "bg-red-600 text-white" : level === "HIGH" ? "bg-red-200" : level === "MEDIUM" ? "bg-amber-100" : "bg-emerald-50";
                return (
                  <div key={j} className={`rounded p-2 ${bg}`}>
                    {count}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
      <CatalogListPage spec={imsCatalog["risk-opportunity"]} />
    </div>
  );
}
