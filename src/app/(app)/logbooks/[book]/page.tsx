import Link from "next/link";
import { getStore } from "@/server/data/store";
import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";
import { DataTable } from "@/components/data-table";
import { Card, PageHeader } from "@/components/ui";
import { CreateLogbookButton } from "@/features/records/create-draft-button";
import { notFound } from "next/navigation";

const BOOKS = {
  "cpu-coil": "CPU Coil",
  "ahu-coil": "AHU Coil",
  "paint-shop": "Paint Shop",
} as const;

export default async function LogbookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params;
  const type = BOOKS[book as keyof typeof BOOKS];
  if (!type) notFound();
  const user = await requireUser();
  if (!authorize(user, "logbook", "view")) return <p className="text-sm text-danger">Not authorized.</p>;
  const store = getStore();
  const rows = store.logbooks.filter((l) => l.type === type);
  const latest = rows[0];
  const readings = store.logbookReadings.filter((r) => r.logbookId === latest?.id);
  const batches = type === "Paint Shop" ? store.paintBatches : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${type} Daily Logbook`}
        subtitle="Dedicated logbook — not a generic NCR screen"
        actions={authorize(user, "logbook", "create") ? <CreateLogbookButton type={type} /> : null}
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "date", header: "Date" },
          { key: "shift", header: "Shift" },
          { key: "status", header: "Status" },
          { key: "remarks", header: "Remarks" },
        ]}
        searchKeys={["date", "remarks"]}
      />
      {latest ? (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted">Latest readings · {latest.date}</h2>
          <DataTable
            rows={readings.map((r) => ({ ...r, result: r.pass ? "Pass" : "Fail" }))}
            columns={[
              { key: "time", header: "Time" },
              { key: "parameter", header: "Parameter" },
              { key: "specification", header: "Specification" },
              { key: "actual", header: "Actual" },
              { key: "result", header: "Pass/Fail" },
            ]}
          />
        </Card>
      ) : null}
      {type === "Paint Shop" ? (
        <p className="text-sm">
          Related:{" "}
          <Link className="text-samco" href="/logbooks/oven-tracker">
            Oven Tracker
          </Link>{" "}
          ·{" "}
          <Link className="text-samco" href="/logbooks/destructive-tests">
            Destructive Tests
          </Link>
        </p>
      ) : null}
      {batches.length ? (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted">Powder paint batch history</h2>
          <DataTable
            rows={batches}
            columns={[
              { key: "vendor", header: "Vendor" },
              { key: "powderCode", header: "Code" },
              { key: "powderName", header: "Name" },
              { key: "color", header: "Color" },
              { key: "batchNo", header: "Batch" },
              { key: "startedAt", header: "Start" },
            ]}
            searchKeys={["batchNo", "vendor"]}
          />
        </Card>
      ) : null}
    </div>
  );
}
