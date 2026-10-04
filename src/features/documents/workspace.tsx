"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge, Button, Card } from "@/components/ui";
import { RecordTabs } from "@/features/records/record-tabs";
import { DocumentActions } from "./document-actions";
import { analyzeDocumentAction, confirmImportAction, remapImportAction } from "@/server/documents/actions";
import { PROFILE_LABELS } from "@/lib/files/profiles";
import type {
  AuditLog,
  DocumentAnalysisResult,
  DocumentExtraction,
  DocumentLink,
  DocumentProcessingJob,
  DocumentRecord,
  ImportBatch,
  ImportProfileKey,
  ImportRow,
  Profile,
} from "@/types";

const PROFILES = Object.keys(PROFILE_LABELS) as ImportProfileKey[];

export function DocumentWorkspace({
  document,
  extraction,
  analysis,
  batch,
  rows,
  jobs,
  links,
  audits,
  uploader,
  canImport,
  canAnalyze,
  canCreateDrafts,
  downloadHref,
}: {
  document: DocumentRecord;
  extraction: DocumentExtraction | null;
  analysis: DocumentAnalysisResult | null;
  batch: ImportBatch | null;
  rows: ImportRow[];
  jobs: DocumentProcessingJob[];
  links: DocumentLink[];
  audits: AuditLog[];
  uploader: Profile | undefined;
  canImport: boolean;
  canAnalyze: boolean;
  canCreateDrafts: boolean;
  downloadHref: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [profile, setProfile] = useState<ImportProfileKey>(batch?.profile ?? "GENERIC_EXCEL");
  const [sheet, setSheet] = useState(batch?.sheetName ?? extraction?.sheetNames[0] ?? "");
  const [mapping, setMapping] = useState<Record<string, string>>(batch?.mapping ?? {});
  const [activeSheet, setActiveSheet] = useState(extraction?.tables[0]?.name ?? "");
  const [importResult, setImportResult] = useState<{ added: number; updated: number; failed: number } | null>(
    batch?.status === "imported" ? { added: batch.added, updated: batch.updated, failed: batch.failed } : null,
  );
  const [importError, setImportError] = useState<string | null>(null);

  const table = useMemo(
    () => extraction?.tables.find((item) => item.name === (activeSheet || extraction.tables[0]?.name)) ?? extraction?.tables[0],
    [extraction, activeSheet],
  );
  const sourceColumns = table?.headers ?? Object.keys(mapping);

  function runAnalyze() {
    start(async () => {
      try {
        const res = await analyzeDocumentAction(document.id);
        toast.success(`Analysis stored (${res.mode})`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Analysis failed");
      }
    });
  }

  function runRemap() {
    if (!batch) return;
    start(async () => {
      try {
        await remapImportAction(batch.id, profile, mapping, sheet || batch.sheetName);
        toast.success("Mapping updated and rows re-validated");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Validation failed");
      }
    });
  }

  function runImport() {
    if (!batch) return;
    start(async () => {
      try {
        const res = await confirmImportAction(batch.id);
        setImportResult(res);
        setImportError(null);
        toast.success(`Imported ${res.added} created, ${res.updated} updated. ${res.failed} invalid rows were skipped.`);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Import failed";
        setImportError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <RecordTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <Card className="p-4">
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <Field label="Document #" value={document.documentNumber} />
                  <Field label="Title" value={document.title} />
                  <Field label="Filename" value={document.originalFilename} />
                  <Field label="Size" value={document.sizeLabel} />
                  <Field label="Type" value={document.type} />
                  <Field label="Owner / uploaded by" value={uploader?.fullName ?? document.uploadedBy} />
                  <Field label="Upload date" value={document.uploadedAt} />
                  <Field label="Processing status" value={document.processingStatus} />
                  <Field label="Analysis status" value={document.status} />
                  <Field label="Checksum" value={document.checksum} />
                </dl>
                {document.summary ? <p className="mt-4 text-sm">{document.summary}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {downloadHref ? (
                    <a className="inline-flex rounded-md border border-line px-3 py-1.5 text-sm" href={downloadHref}>
                      Download
                    </a>
                  ) : (
                    <p className="text-xs text-muted">Seeded metadata only — upload a real file to store a binary.</p>
                  )}
                  {canAnalyze ? (
                    <Button disabled={pending} onClick={runAnalyze}>
                      Analyze with AI
                    </Button>
                  ) : null}
                </div>
              </Card>
            ),
          },
          {
            id: "preview",
            label: "Preview",
            content: (
              <Card className="p-4">
                {document.extension === ".pdf" && downloadHref ? (
                  <iframe title="PDF preview" src={downloadHref} className="h-[640px] w-full rounded border border-line" />
                ) : null}
                {extraction?.kind === "docx" ? (
                  <pre className="max-h-[540px] overflow-auto whitespace-pre-wrap text-sm">{extraction.text || "No extractable DOCX text."}</pre>
                ) : null}
                {extraction?.kind === "excel" && table ? (
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {extraction.sheetNames.map((name) => (
                        <Button key={name} variant={name === (activeSheet || table.name) ? "primary" : "secondary"} onClick={() => setActiveSheet(name)}>
                          {name}
                        </Button>
                      ))}
                    </div>
                    <p className="mb-2 text-sm text-muted">
                      Sheet: {table.name} · Rows: {table.rows.length}
                    </p>
                    <div className="overflow-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead>
                          <tr>
                            <th className="border-b border-line px-2 py-1">Row</th>
                            {table.headers.map((header) => (
                              <th key={header} className="border-b border-line px-2 py-1">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.slice(0, 25).map((row, idx) => (
                            <tr key={`${table.name}-${idx}`}>
                              <td className="border-b border-line px-2 py-1">{idx + 2}</td>
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="border-b border-line px-2 py-1">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
                {extraction?.kind === "none" ? <p className="text-sm text-muted">This file type is stored as evidence. Text extraction is not implemented.</p> : null}
                {!extraction && !downloadHref ? <p className="text-sm text-muted">No preview is available for this record.</p> : null}
              </Card>
            ),
          },
          {
            id: "extracted",
            label: "Extracted Data",
            content: (
              <div className="space-y-4">
                {extraction?.kind === "pdf" && !extraction.extractable ? (
                  <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-warning">
                    No extractable text detected. OCR is not enabled for this document.
                  </Card>
                ) : null}
                {extraction ? (
                  <Card className="p-4">
                    <p className="text-sm font-semibold">Structured extraction</p>
                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-muted">{extraction.text || "No extracted text."}</pre>
                  </Card>
                ) : (
                  <p className="text-sm text-muted">No extraction stored yet.</p>
                )}
                {batch ? (
                  <Card className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Badge tone="info">Valid {batch.valid}</Badge>
                      <Badge tone="warning">Warnings {batch.warnings}</Badge>
                      <Badge tone="danger">Invalid {batch.invalid}</Badge>
                      <Badge>{batch.status}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-sm">
                        Import profile
                        <select
                          className="mt-1 w-full rounded border border-line px-2 py-1.5"
                          value={profile}
                          onChange={(e) => setProfile(e.target.value as ImportProfileKey)}
                        >
                          {PROFILES.map((key) => (
                            <option key={key} value={key}>
                              {PROFILE_LABELS[key]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        Sheet
                        <select className="mt-1 w-full rounded border border-line px-2 py-1.5" value={sheet} onChange={(e) => setSheet(e.target.value)}>
                          {(extraction?.sheetNames ?? [batch.sheetName]).map((name) => (
                            <option key={name}>{name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted">Source column → SAMCO field</p>
                      <div className="space-y-2">
                        {sourceColumns.map((column) => (
                          <div key={column} className="grid grid-cols-[1fr_1fr] items-center gap-2 text-sm">
                            <span>{column}</span>
                            <input
                              className="rounded border border-line px-2 py-1"
                              value={mapping[column] ?? ""}
                              onChange={(e) => setMapping((current) => ({ ...current, [column]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button disabled={pending || !canImport} variant="secondary" onClick={runRemap}>
                      Re-validate mapping
                    </Button>
                    <div className="overflow-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead>
                          <tr>
                            <th className="border-b px-2 py-1">Row</th>
                            <th className="border-b px-2 py-1">Status</th>
                            <th className="border-b px-2 py-1">Field</th>
                            <th className="border-b px-2 py-1">Original</th>
                            <th className="border-b px-2 py-1">Problem</th>
                            <th className="border-b px-2 py-1">Suggested correction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.flatMap((row) =>
                            (row.issues.length ? row.issues : [{ field: "", originalValue: "", problem: "", suggestion: "" }]).map((issue, idx) => (
                              <tr key={`${row.id}-${idx}`}>
                                <td className="border-b px-2 py-1">{row.rowNumber}</td>
                                <td className="border-b px-2 py-1">{row.status}</td>
                                <td className="border-b px-2 py-1">{issue.field}</td>
                                <td className="border-b px-2 py-1">{issue.originalValue}</td>
                                <td className="border-b px-2 py-1">{issue.problem}</td>
                                <td className="border-b px-2 py-1">{issue.suggestion}</td>
                              </tr>
                            )),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : null}
              </div>
            ),
          },
          {
            id: "analysis",
            label: "Analysis",
            content: (
              <Card className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={analysis?.mode === "LIVE" ? "success" : "warning"}>AI Mode: {analysis?.mode ?? "DEMO"}</Badge>
                  {analysis ? <span className="text-xs text-muted">{analysis.provider}</span> : null}
                  {canAnalyze ? (
                    <Button disabled={pending} onClick={runAnalyze}>
                      Analyze with AI
                    </Button>
                  ) : null}
                </div>
                {analysis ? (
                  <div className="space-y-3 text-sm">
                    <Section title="SUMMARY" items={[analysis.summary]} />
                    <Section title="KEY INFORMATION" items={analysis.keyFacts} />
                    <Section title="POTENTIAL RISKS" items={analysis.potentialRisks} />
                    <Section title="POTENTIAL NONCONFORMITIES" items={analysis.potentialNonconformities} />
                    <Section title="POTENTIAL ACTIONS" items={analysis.suggestedActions} />
                    <Section title="DATES & DEADLINES" items={analysis.dates} />
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-muted">REFERENCED</h3>
                      <ul className="mt-1 space-y-1">
                        {analysis.referencedEntities.length ? (
                          analysis.referencedEntities.map((entity) => (
                            <li key={`${entity.type}-${entity.value}`}>
                              {entity.href ? (
                                <Link className="text-samco hover:underline" href={entity.href}>
                                  {entity.type} {entity.value}
                                </Link>
                              ) : (
                                <span>
                                  {entity.type} {entity.value} <span className="text-muted">(no matching record)</span>
                                </span>
                              )}
                            </li>
                          ))
                        ) : (
                          <li className="text-muted">No linked records.</li>
                        )}
                      </ul>
                    </div>
                    <Section title="CONFIDENCE NOTES" items={analysis.confidenceNotes} />
                    <p className="text-xs text-warning">AI-generated recommendation — human review required.</p>
                    {canCreateDrafts ? <DocumentActions title={analysis.potentialNonconformities[0] || analysis.summary} documentId={document.id} /> : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Run Analyze with AI after extraction. Mock analysis is used when no OpenAI key is configured.</p>
                )}
              </Card>
            ),
          },
          {
            id: "related",
            label: "Related Records",
            content: (
              <Card className="p-4">
                {links.length ? (
                  <ul className="space-y-2 text-sm">
                    {links.map((link) => (
                      <li key={link.id}>
                        <span className="text-muted">{link.recordType}: </span>
                        {link.recordRef}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No related records yet.</p>
                )}
              </Card>
            ),
          },
          {
            id: "processing",
            label: "Processing History",
            content: (
              <Card className="p-4">
                <ul className="space-y-2 text-sm">
                  {jobs.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.stage}</span> · {item.status} · {item.message}
                    </li>
                  ))}
                </ul>
              </Card>
            ),
          },
          {
            id: "audit",
            label: "Audit History",
            content: (
              <Card className="p-4">
                <ul className="space-y-2 text-sm">
                  {audits.length ? (
                    audits.map((item) => (
                      <li key={item.id}>
                        {item.createdAt} · {item.action} · {item.newValue}
                      </li>
                    ))
                  ) : (
                    <li className="text-muted">No audit events for this document yet.</li>
                  )}
                </ul>
              </Card>
            ),
          },
        ]}
      />
      {importResult || batch?.status === "imported" ? (
        <Card className="p-4 text-sm">
          Import completed: {(importResult ?? batch)?.added} created, {(importResult ?? batch)?.updated} updated,{" "}
          {(importResult ?? batch)?.failed} invalid skipped.
        </Card>
      ) : batch && canImport ? (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Confirm import</h2>
          <p className="mt-1 text-sm text-muted">
            File {batch.file} · Profile {PROFILE_LABELS[batch.profile]} · Rows {batch.processed} · Valid {batch.valid} ·
            Warnings {batch.warnings} · Invalid {batch.invalid} · Records to create {batch.valid + batch.warnings} · Records to update 0
          </p>
          <p className="mt-2 text-xs text-muted">Invalid rows are never imported. Import is not automatic.</p>
          <Button className="mt-3" disabled={pending || batch.valid + batch.warnings === 0} onClick={runImport}>
            Confirm Import
          </Button>
          {importError ? <p className="mt-2 text-sm text-danger">{importError}</p> : null}
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-muted">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.length ? items.map((item) => <li key={item}>{item}</li>) : <li className="text-muted">None</li>}
      </ul>
    </div>
  );
}
