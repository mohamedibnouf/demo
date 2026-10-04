"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { PROFILE_LABELS } from "@/lib/files/profiles";
import { importCsv } from "@/server/excel";
import type { ImportBatch, ImportError, ImportJob } from "@/types";

const SAMPLE = `source,defect,severity,model,serial_number,quantity
AHU Line,Expansion valve leak,High,AHU-P25,SN-AHU-2026-1842,1
Unknown,Bad model,Low,AHU-XX,BAD,twelve`;

export function ExcelCenter({
  jobs,
  errors,
  batches,
}: {
  jobs: ImportJob[];
  errors: ImportError[];
  batches: ImportBatch[];
}) {
  const [type, setType] = useState<"Production File" | "Receiving File" | "COPQ File" | "NCR File">("NCR File");
  const [csv, setCsv] = useState(SAMPLE);
  const [pending, start] = useTransition();
  const [lastErrors, setLastErrors] = useState<ImportError[]>(errors.slice(0, 8));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        {(Object.keys(PROFILE_LABELS) as Array<keyof typeof PROFILE_LABELS>).map((key) => (
          <Card key={key} className="p-3">
            <p className="text-xs uppercase text-muted">Profile</p>
            <p className="font-semibold">{PROFILE_LABELS[key]}</p>
            <Link className="mt-2 inline-block text-sm text-samco" href="/documents/analyze">
              New Import
            </Link>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Workbook import</p>
            <p className="text-xs text-muted">Upload a real Excel file, parse sheets, validate rows, then confirm import.</p>
          </div>
          <Link href="/documents/analyze">
            <Button>New Import</Button>
          </Link>
        </div>
        <DataTable
          rows={batches.map((batch) => ({
            ...batch,
            profileLabel: PROFILE_LABELS[batch.profile],
            _href: `/documents/${batch.documentId}`,
          }))}
          columns={[
            { key: "file", header: "File" },
            { key: "profileLabel", header: "Profile" },
            { key: "status", header: "Import Status" },
            { key: "valid", header: "Rows Imported / Valid" },
            { key: "failed", header: "Rows Failed" },
            { key: "uploadedAt", header: "Date" },
          ]}
          searchKeys={["file", "profileLabel"]}
        />
      </Card>
      <Card className="p-4">
        <p className="text-sm font-semibold">Paste CSV (legacy validator)</p>
        <div className="mt-3 flex flex-wrap gap-3">
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
