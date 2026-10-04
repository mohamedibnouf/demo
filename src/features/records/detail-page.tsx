import Link from "next/link";
import { notFound } from "next/navigation";
import { authorize, isReadOnlyRole } from "@/lib/engines/rbac";
import { requireUser } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";
import { WorkflowButtons } from "./workflow-buttons";
import { Traceability } from "@/features/traceability/traceability";

export async function RecordDetailPage({
  moduleKey,
  collection,
  id,
  title,
  backHref,
}: {
  moduleKey: string;
  collection: keyof ReturnType<typeof getStore>;
  id: string;
  title: string;
  backHref: string;
}) {
  const user = await requireUser();
  if (!authorize(user, moduleKey, "view")) {
    return <p className="text-sm text-danger">You are not authorized to view this record.</p>;
  }
  const store = getStore();
  const list = store[collection];
  if (!Array.isArray(list)) notFound();
  const record = (list as unknown as Array<Record<string, unknown>>).find((r) => r.id === id);
  if (!record) notFound();

  if (user.role === "Supplier" && record.supplierId && record.supplierId !== user.supplierId) {
    return <p className="text-sm text-danger">Supplier isolation: this record is not visible to your organization.</p>;
  }
  if (user.role === "Customer" && record.customerId && record.customerId !== user.customerId) {
    return <p className="text-sm text-danger">You can only view your own complaints.</p>;
  }

  const visible = { ...record };
  if (user.role === "Customer") {
    delete visible.internalRca;
  }

  const sourceEventId = typeof record.sourceEventId === "string" ? record.sourceEventId : null;
  const timeline = store.auditLogs.filter((l) => l.recordRef === record.number || l.recordRef === record.id).slice(0, 20);
  const canAct = !isReadOnlyRole(user.role) && authorize(user, moduleKey, "edit");

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        <Link href={backHref} className="text-samco hover:underline">
          {title}
        </Link>{" "}
        / {String(record.number ?? record.equipmentId ?? record.id)}
      </p>
      <PageHeader
        title={String(record.number ?? record.equipmentId ?? record.title ?? title)}
        subtitle={String(record.defect ?? record.problem ?? record.finding ?? record.scope ?? record.type ?? "")}
        actions={
          record.status ? <Badge tone={statusTone(String(record.status))}>{String(record.status)}</Badge> : null
        }
      />

      {canAct ? (
        <WorkflowButtons
          id={id}
          collection={collection as never}
          moduleKey={moduleKey}
          status={String(record.status ?? "")}
          path={`${backHref}/${id}`}
          sourceEventId={sourceEventId}
          serialNumber={typeof record.serialNumber === "string" ? record.serialNumber : null}
        />
      ) : (
        <p className="mb-4 text-xs text-muted">
          {isReadOnlyRole(user.role) ? "Management may view and export only." : "You do not have edit permission on this module."}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Overview</h2>
          <dl className="grid gap-2 sm:grid-cols-2">
            {Object.entries(visible)
              .filter(([k, v]) => !["id"].includes(k) && v !== null && v !== undefined && typeof v !== "object")
              .slice(0, 24)
              .map(([k, v]) => (
                <div key={k} className="rounded bg-ice px-3 py-2">
                  <dt className="text-[11px] uppercase text-muted">{k}</dt>
                  <dd className="text-sm font-medium">{String(v)}</dd>
                </div>
              ))}
          </dl>
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Timeline / Audit History</h2>
            <ul className="space-y-2 text-sm">
              {timeline.length ? (
                timeline.map((log) => (
                  <li key={log.id} className="border-b border-line pb-2">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted">
                      {log.createdAt.replace("T", " ").slice(0, 16)} · {log.newValue}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-muted">No audit events yet for this record.</li>
              )}
            </ul>
          </Card>
          {sourceEventId ? (
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Related Records</h2>
              <Traceability sourceEventId={sourceEventId} />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
