"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { importCsv } from "@/server/excel";
import type { ImportError, ImportJob } from "@/types";

const SAMPLE = `source,defect,severity,model,serial_number,quantity
AHU Line,Expansion valve leak,High,AHU-P25,SN-AHU-2026-1842,1
Unknown,Bad model,Low,AHU-XX,BAD,twelve`;

export function ExcelCenter({ jobs, errors }: { jobs: ImportJob[]; errors: ImportError[] }) {
  const [type, setType] = useState<"Production File" | "Receiving File" | "COPQ File" | "NCR File">("NCR File");
  const [csv, setCsv] = useState(SAMPLE);
  const [pending, start] = useTransition();
  const [lastErrors, setLastErrors] = useState<ImportError[]>(errors.slice(0, 8));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="rounded border border-line px-2 py-1 text-sm">
            <option>Production File</option>
            <option>Receiving File</option>
            <option>COPQ File</option>
            <option>NCR File</option>
          </select>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  const res = await importCsv(type, csv, `demo-${type.replace(/\s+/g, "-").toLowerCase()}.csv`);
                  setLastErrors(res.errors.map((e, i) => ({ id: `tmp-${i}`, jobId: res.jobId, ...e })));
                  toast.success(`Processed with ${res.added} added, ${res.failed} failed`);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Import failed");
                }
              })
            }
          >
            Validate / import
          </Button>
        </div>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} className="mt-3 h-40 w-full rounded border border-line p-2 font-mono text-xs" />
      </Card>
      <DataTable
        rows={jobs}
        columns={[
          { key: "file", header: "File" },
          { key: "type", header: "Type" },
          { key: "uploadedAt", header: "Upload date" },
          { key: "status", header: "Status" },
          { key: "processed", header: "Processed" },
          { key: "added", header: "Added" },
          { key: "failed", header: "Failed" },
        ]}
        searchKeys={["file", "type"]}
      />
      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold">Validation errors</h2>
        <DataTable
          rows={lastErrors}
          columns={[
            { key: "row", header: "Row" },
            { key: "error", header: "Error" },
            { key: "value", header: "Value" },
            { key: "recommendation", header: "Recommended correction" },
          ]}
        />
        {lastErrors.length ? (
          <a
            className="mt-3 inline-block text-sm text-samco"
            href={`data:text/csv,${encodeURIComponent(lastErrors.map((e) => `${e.row},${e.error},${e.value},${e.recommendation}`).join("\n"))}`}
            download="import-errors.csv"
          >
            Download error report
          </a>
        ) : null}
      </Card>
    </div>
  );
}
