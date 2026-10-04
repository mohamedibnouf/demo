import { requireUser } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { daysRemaining, dueLabel } from "@/lib/engines/due-dates";
import { DEMO_AS_OF } from "@/lib/env";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";
import { completeTask } from "@/server/workflow-actions";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser();
  const { filter = "mine" } = await searchParams;
  const store = getStore();
  let rows = store.tasks;
  if (filter === "mine") rows = rows.filter((t) => t.assigneeId === user.id);
  if (filter === "overdue") rows = rows.filter((t) => daysRemaining(t.dueDate, DEMO_AS_OF) < 0 && t.status !== "Completed");
  if (filter === "soon") rows = rows.filter((t) => daysRemaining(t.dueDate, DEMO_AS_OF) <= 2);
  if (filter === "done") rows = rows.filter((t) => t.status === "Completed");
  if (filter === "high") rows = rows.filter((t) => t.priority === "High" || t.priority === "Critical");

  const decorated = rows.map((t) => ({
    ...t,
    due: dueLabel(daysRemaining(t.dueDate, store.meta.asOf)),
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
      <form
        className="mt-4 text-sm text-muted"
        action={async () => {
          "use server";
          const first = decorated.find((t) => t.status !== "Completed");
          if (first) await completeTask(first.id);
        }}
      >
        <button type="submit" className="text-samco hover:underline">
          Complete first open task in this view
        </button>
      </form>
    </div>
  );
}
