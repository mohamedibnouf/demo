import Link from "next/link";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Card } from "@/components/ui";

export function KpiGrid({
  kpis,
}: {
  kpis: {
    productionPpm: number;
    customerPpm: number;
    supplierSppm: number;
    ncrOpen: number;
    ffrPpm: number;
    fpy: number;
    copq: number;
    pcPercent: number;
    trends: Record<string, number>;
  };
}) {
  const cards = [
    ["Production PPM", formatNumber(kpis.productionPpm), kpis.trends.productionPpm, "/performance/kpi-reports"],
    ["Customer PPM", formatNumber(kpis.customerPpm), kpis.trends.customerPpm, "/performance/customer-ffr"],
    ["Supplier SPPM", formatNumber(kpis.supplierSppm), kpis.trends.supplierSppm, "/performance/supplier-sppm"],
    ["NCR Open", formatNumber(kpis.ncrOpen), kpis.trends.ncrOpen, "/quality/production-ncr"],
    ["FFR PPM", formatNumber(kpis.ffrPpm), kpis.trends.ffrPpm, "/performance/customer-ffr"],
    ["FPY", formatPercent(kpis.fpy), kpis.trends.fpy, "/performance/quality-dashboard"],
    ["Production Constraints", formatPercent(kpis.pcPercent), kpis.trends.pcPercent, "/performance/production-constraints"],
    ["COPQ", formatCurrency(kpis.copq), kpis.trends.copq, "/performance/copq"],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, trend, href]) => {
        const up = (trend ?? 0) > 0;
        const goodUp = label === "FPY";
        const positive = goodUp ? up : !up;
        return (
          <Link key={label} href={href}>
            <Card className="p-4 transition hover:border-samco">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
              <p className={`mt-1 text-xs ${positive ? "text-success" : "text-danger"}`}>
                {up ? "▲" : "▼"} {Math.abs(trend ?? 0).toFixed(1)}% vs previous period
              </p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
