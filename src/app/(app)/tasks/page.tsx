import { requireUser } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { daysRemaining, dueLabel } from "@/lib/engines/due-dates";
import { DEMO_AS_OF } from "@/lib/env";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";
import { CompleteTaskButton } from "@/features/records/row-actions";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser();
  const { filter = "mine" } = await searchParams;
  const store = getStore();
  let rows = store.tasks;
  if (filter === "mine") rows = rows.filter((t) => t.assigneeId === user.id);
  if (filter === "overdue") rows = rows.filter((t) => daysRemaining(t.dueDate, DEMO_AS_OF) < 0 && t.status !== "Completed");
  if (filter === "soon") rows = rows.filter((t) => daysRemaining(t.dueDate, DEMO_AS_OF) <= 2 && t.status !== "Completed");
  if (filter === "done") rows = rows.filter((t) => t.status === "Completed");
  if (filter === "high") rows = rows.filter((t) => t.priority === "High" || t.priority === "Critical");

  const decorated = rows.map((t) => ({
    ...t,
    due: dueLabel(daysRemaining(t.dueDate, store.meta.asOf)),
    _href: t.recordHref,
  }));

  return (
    <div>
      <PageHeader title="Upcoming Tasks" subtitle="Due dates are calculated from the demo as-of date" />
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        {[
          ["mine", "My Tasks"],
          ["high", "Priority"],
          ["soon", "Due Soon"],
          ["overdue", "Overdue"],
          ["done", "Completed"],
          ["all", "Department / All"],
        ].map(([id, label]) => (
          <a key={id} href={`/tasks?filter=${id}`} className={`rounded border px-2 py-1 ${filter === id ? "border-samco bg-skyline" : "border-line"}`}>
            {label}
          </a>
        ))}
      </div>
      <DataTable
        rows={decorated}
        columns={[
          { key: "title", header: "Task", hrefField: "recordHref" },
          { key: "module", header: "Module" },
          { key: "recordRef", header: "Reference" },
          { key: "priority", header: "Priority" },
          { key: "due", header: "Due" },
          { key: "status", header: "Status" },
        ]}
        searchKeys={["title", "recordRef", "module"]}
      />
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase text-muted">Complete a task</p>
        {decorated.filter((t) => t.status !== "Completed").slice(0, 6).map((task) => (
          <div key={task.id} className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm">
            <span>{task.title}</span>
            <CompleteTaskButton id={task.id} />
          </div>
        ))}
        {!decorated.some((t) => t.status !== "Completed") ? <p className="text-sm text-muted">No open tasks in this view.</p> : null}
      </div>
    </div>
  );
}
