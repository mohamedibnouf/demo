import { getStore } from "@/server/data/store";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";

export default async function OvenTrackerPage() {
  const rows = getStore().ovenTrackers;
  return (
    <div>
      <PageHeader title="Oven Tracker" subtitle="Once daily. Controlled equipment must be valid." />
      <DataTable
        rows={rows.map((r) => ({ ...r, verdict: r.pass ? "Pass" : "Fail" }))}
        columns={[
          { key: "date", header: "Date" },
          { key: "time", header: "Time" },
          { key: "result", header: "Result" },
          { key: "verdict", header: "Pass/Fail" },
          { key: "comments", header: "Comments" },
        ]}
      />
    </div>
  );
}
