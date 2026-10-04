import Link from "next/link";
import { format } from "date-fns";
import { readSession } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { computeKpis, ncrBySource, productionPerformance, qualityTrend, topDefects, auditStatusCounts } from "@/server/kpis";
import { runRiskEngine } from "@/server/risk-engine";
import { daysRemaining, dueLabel, dueTone } from "@/lib/engines/due-dates";
import { DEMO_AS_OF } from "@/lib/env";
import { KpiGrid } from "@/features/dashboard/kpi-grid";
import { DashboardFilters } from "@/features/dashboard/filters";
import { DonutChart, HorizontalBars, ProductionChart, TrendChart } from "@/components/charts";
import { Badge, Card } from "@/components/ui";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; familyId?: string; lineId?: string; supplierId?: string }>;
}) {
  const filters = await searchParams;
  const user = await readSession();
  const store = getStore();
  const kpis = computeKpis({
    year: 2026,
    month: filters.month && filters.month !== "all" ? Number(filters.month) : "all",
    familyId: (filters.familyId as "all") ?? "all",
    modelId: "all",
    lineId: (filters.lineId as "all") ?? "all",
    supplierId: (filters.supplierId as "all") ?? "all",
    departmentId: "all",
  });
  const perf = productionPerformance();
  const ncrSource = ncrBySource();
  const trend = qualityTrend();
  const defects = topDefects();
  const audits = auditStatusCounts();
  const risks = runRiskEngine();
  const asOf = store.meta.asOf || DEMO_AS_OF;
  const tasks = store.tasks
    .filter((t) => t.assigneeId === user?.id && t.status !== "Completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);
  const activities = store.activities.slice(0, 8);
  const riskSummary = {
    high: risks.filter((r) => r.level === "HIGH" || r.level === "CRITICAL").length,
    medium: risks.filter((r) => r.level === "MEDIUM").length,
    low: risks.filter((r) => r.level === "LOW").length,
    overdue: store.tasks.filter((t) => t.status !== "Completed" && daysRemaining(t.dueDate, asOf) < 0).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Welcome, {user?.fullName}</h1>
          <p className="text-sm text-muted">Quality Management System - SAMCO</p>
        </div>
        <p className="text-sm text-muted">{format(new Date(`${asOf}T09:15:00`), "EEEE, d MMMM yyyy · HH:mm")}</p>
      </div>

      <DashboardFilters />
      <KpiGrid kpis={kpis} />

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Smart Quality Insights</h2>
          <Link href="/risks" className="text-xs text-samco">
            Open risk engine
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {store.insights.map((ins) => (
            <Link key={ins.id} href={ins.href} className="rounded-md border border-line p-3 hover:border-samco">
              <Badge tone={ins.severity === "CRITICAL" || ins.severity === "HIGH" ? "danger" : "warning"}>{ins.severity}</Badge>
              <p className="mt-2 text-sm font-medium">{ins.title}</p>
              <p className="mt-1 text-xs text-muted">{ins.explanation}</p>
              <p className="mt-2 text-xs text-samco">Recommended: {ins.recommendedAction}</p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted">Production Performance</h2>
          <ProductionChart data={perf} />
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted">NCR by Source</h2>
          <DonutChart data={ncrSource} total={ncrSource.reduce((s, x) => s + x.value, 0)} />
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted">Quality Trend</h2>
          <TrendChart data={trend} />
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted">Top 5 Defect Types</h2>
          <HorizontalBars data={defects} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link href="/risks">
          <Card className="p-4 transition hover:border-samco">
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted">Risk Overview</h2>
            <ul className="space-y-2 text-sm">
              <li>High / Critical: {riskSummary.high}</li>
              <li>Medium: {riskSummary.medium}</li>
              <li>Low: {riskSummary.low}</li>
              <li>Overdue actions: {riskSummary.overdue}</li>
            </ul>
          </Card>
        </Link>
        <Link href="/ims/internal-audit">
          <Card className="p-4 transition hover:border-samco">
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted">Audit Status</h2>
            <ul className="space-y-2 text-sm">
              <li>Planned: {audits.planned}</li>
              <li>Completed: {audits.completed}</li>
              <li>Overdue: {audits.overdue}</li>
              <li>Open findings: {audits.openFindings}</li>
              <li>Closed findings: {audits.closedFindings}</li>
            </ul>
          </Card>
        </Link>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-muted">Upcoming Tasks</h2>
            <Link href="/tasks" className="text-xs text-samco">
              View All
            </Link>
          </div>
          <ul className="space-y-2">
            {tasks.map((task) => {
              const days = daysRemaining(task.dueDate, asOf);
              return (
                <li key={task.id}>
                  <Link href={task.recordHref} className="block rounded border border-line px-2 py-1.5 hover:border-samco">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted">
                      {task.recordRef} · <Badge tone={dueTone(days) === "danger" ? "danger" : dueTone(days) === "warning" ? "warning" : "info"}>{dueLabel(days)}</Badge>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted">Recent Activities</h2>
        <ul className="divide-y divide-line">
          {activities.map((act) => {
            const actor = store.profiles.find((p) => p.id === act.actorId);
            return (
              <li key={act.id} className="py-2">
                <Link href={act.href} className="hover:text-samco">
                  <p className="text-sm font-medium">
                    {act.type} · {act.recordRef}
                  </p>
                  <p className="text-xs text-muted">
                    {act.description} — {actor?.fullName} · {act.createdAt.replace("T", " ").slice(0, 16)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
