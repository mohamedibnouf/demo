import { getStore } from "@/server/data/store";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";

export default async function DestructiveTestsPage() {
  const store = getStore();
  const rows = store.destructiveTests.map((t) => ({
    ...t,
    batch: store.paintBatches.find((b) => b.id === t.paintBatchId)?.batchNo ?? t.paintBatchId,
  }));
  return (
    <div>
      <PageHeader title="Destructive Tests" subtitle="Regular G90 / Spangle G90 / A40 traced to powder paint batch" />
      <DataTable
        rows={rows}
        columns={[
          { key: "date", header: "Date" },
          { key: "panel", header: "Panel" },
          { key: "test", header: "Test" },
          { key: "result", header: "Result" },
          { key: "batch", header: "Paint batch" },
        ]}
        searchKeys={["panel", "test", "batch"]}
      />
    </div>
  );
}
