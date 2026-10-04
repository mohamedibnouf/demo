import { randomUUID } from "crypto";
import { authorize } from "@/lib/engines/rbac";
import { checksumBuffer, importFingerprint } from "@/lib/files/checksum";
import { extractDocx } from "@/lib/files/docx-parser";
import { parseExcelWorkbook } from "@/lib/files/excel-parser";
import { findReferencedEntities } from "@/lib/files/entity-linker";
import { extractPdf } from "@/lib/files/pdf-parser";
import { applyMapping, detectImportProfile, LEGACY_FILE_TYPE, PROFILE_LABELS } from "@/lib/files/profiles";
import { assertSafeFilename, buildStoragePath } from "@/lib/files/paths";
import { applyImportedRow } from "@/lib/files/import-apply";
import { validateImportRows } from "@/lib/files/row-validation";
import { formatFileSize, typeLabel, validateUploadFile } from "@/lib/files/validation";
import { hrefForRef } from "@/lib/record-hrefs";
import { getAIProvider } from "@/server/ai";
import { mockDocumentAnalysis, parseDocumentAnalysisJson } from "@/server/ai/document-schema";
import { addAuditLog, getStore, mutateStore, nextNumber } from "@/server/data/store";
import { hydrateAllFileIntelligenceDocuments, hydrateFileIntelligenceDocument, isHostedFileIntelligenceEnabled, persistFileIntelligenceDocument } from "@/server/documents/hosted-metadata";
import { DOCUMENT_STORAGE_UNAVAILABLE, getStorageProvider, isDocumentStorageConfigured } from "@/server/storage";
import type { DocumentAnalysisResult, ImportBatchStatus, ImportProfileKey, SessionUser } from "@/types";

function job(documentId: string, stage: string, status: "running" | "completed" | "failed", message: string) {
  const now = new Date().toISOString();
  return {
    id: `dpj-${randomUUID()}`,
    documentId,
    stage,
    status,
    message,
    startedAt: now,
    completedAt: status === "running" ? null : now,
  };
}

function audit(user: SessionUser, action: string, recordRef: string, newValue?: string) {
  addAuditLog({ userId: user.id, action, module: "documents", recordRef, newValue: newValue ?? null });
}

export function assertDocumentAccess(user: SessionUser, action: "view" | "create" | "export" = "view") {
  if (!authorize(user, "documents", action)) throw new Error("Not authorized");
}

export async function ingestUploadedFile(user: SessionUser, file: File, moduleHint = "documents") {
  assertDocumentAccess(user, "create");
  if (!isDocumentStorageConfigured()) {
    throw new Error(DOCUMENT_STORAGE_UNAVAILABLE);
  }
  const filename = assertSafeFilename(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  const check = validateUploadFile({
    filename,
    size: file.size || bytes.length,
    declaredMime: file.type,
    bytes,
  });
  if (!check.ok) throw new Error(check.error);

  const checksum = checksumBuffer(bytes);
  const id = `doc-${Date.now()}`;
  const documentNumber = isHostedFileIntelligenceEnabled()
    ? `DOC-${new Date().getFullYear()}-${id.replace(/\D/g, "").slice(-8)}`
    : nextNumber("DOC");
  const storage = getStorageProvider();
  const storagePath = buildStoragePath({
    module: moduleHint,
    year: new Date().getFullYear(),
    recordId: id,
    uuid: randomUUID(),
    filename,
  });

  try {
    await storage.put(storagePath, bytes, check.detectedMime);
  } catch (error) {
    throw new Error(error instanceof Error ? `Storage failure: ${error.message}` : "Storage failure");
  }

  const now = new Date().toISOString();
  mutateStore((store) => {
    store.documents.unshift({
      id,
      documentNumber,
      title: filename,
      name: filename,
      type: typeLabel(check.extension),
      originalFilename: filename,
      storedFilename: storagePath.split("/").pop() ?? filename,
      mimeType: check.detectedMime,
      extension: check.extension,
      sizeBytes: bytes.length,
      sizeLabel: formatFileSize(bytes.length),
      storageBucket: storage.bucket,
      storagePath,
      checksum,
      module: moduleHint,
      recordType: null,
      recordId: null,
      status: "Processing",
      processingStatus: "processing",
      uploadedBy: user.id,
      uploadedAt: now,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
      summary: null,
    });
    store.documentVersions.unshift({
      id: `dv-${id}`,
      documentId: id,
      version: 1,
      storagePath,
      checksum,
      uploadedBy: user.id,
      uploadedAt: now,
    });
    store.documentProcessingJobs.unshift(job(id, "uploaded", "completed", "File stored in the private document bucket"));
  });
  audit(user, "DOCUMENT_UPLOADED", documentNumber, filename);

  try {
    await processDocument(user, id, bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    mutateStore((store) => {
      const doc = store.documents.find((d) => d.id === id);
      if (doc) {
        doc.processingStatus = "failed";
        doc.status = "Failed";
        doc.updatedAt = new Date().toISOString();
        doc.summary = message;
      }
      store.documentProcessingJobs.unshift(job(id, "failed", "failed", message));
    });
    audit(user, "DOCUMENT_PROCESSING_FAILED", documentNumber, message);
  }

  await persistFileIntelligenceDocument(id);
  return { id, documentNumber };
}

export async function processDocument(user: SessionUser, documentId: string, bytes?: Buffer) {
  await hydrateFileIntelligenceDocument(documentId);
  const store = getStore();
  const doc = store.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Document not found");
  const buffer = bytes ?? (doc.storagePath ? await getStorageProvider().get(doc.storagePath) : Buffer.alloc(0));
  const ext = doc.extension;

  if ([".xlsx", ".xls", ".csv"].includes(ext)) {
    await processExcel(user, doc.id, buffer);
    return;
  }
  if (ext === ".pdf") {
    await processPdf(user, doc.id, buffer);
    return;
  }
  if (ext === ".docx") {
    await processDocx(user, doc.id, buffer);
    return;
  }

  mutateStore((s) => {
    const current = s.documents.find((d) => d.id === documentId);
    if (current) {
      current.processingStatus = "processed";
      current.status = "Uploaded";
      current.processedAt = new Date().toISOString();
      current.updatedAt = current.processedAt;
      current.summary = "Stored as evidence. Text extraction is not implemented for this file type.";
    }
    s.documentExtractions.unshift({
      id: `dx-${documentId}`,
      documentId,
      kind: "none",
      pageCount: null,
      sheetNames: [],
      text: "",
      tables: [],
      metadata: { note: "storage-only" },
      ocrEnabled: false,
      extractable: false,
      createdAt: new Date().toISOString(),
    });
    s.documentProcessingJobs.unshift(job(documentId, "stored", "completed", "Evidence file stored. No text extraction for this type."));
  });
}

async function processExcel(user: SessionUser, documentId: string, buffer: Buffer) {
  let workbook;
  try {
    workbook = parseExcelWorkbook(buffer);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Excel parsing failed");
  }
  const primary = workbook.sheets[0];
  if (!primary) throw new Error("The workbook has no usable sheet.");
  const detection = detectImportProfile(primary.headers);
  const mappedRows = primary.rows.map((row, index) => ({
    rowNumber: primary.rowNumbers[index] ?? index + 2,
    original: primary.rawRows[index] ?? row,
    normalized: applyMapping(row, detection.mapping),
  }));
  const store = getStore();
  const validated = validateImportRows(store, detection.profile, mappedRows);
  const valid = validated.filter((r) => r.status === "valid").length;
  const warnings = validated.filter((r) => r.status === "warning").length;
  const invalid = validated.filter((r) => r.status === "error").length;
  const batchStatus: ImportBatchStatus = invalid && valid + warnings ? "partially_valid" : invalid ? "failed" : warnings ? "validated" : "ready";
  const batchId = `ib-${documentId}`;

  mutateStore((s) => {
    const doc = s.documents.find((d) => d.id === documentId);
    if (doc) {
      doc.processingStatus = "processed";
      doc.status = "Uploaded";
      doc.processedAt = new Date().toISOString();
      doc.updatedAt = doc.processedAt;
      doc.module = "excel";
      doc.summary = `${PROFILE_LABELS[detection.profile]} · ${primary.usedRows} rows · ${valid} valid · ${warnings} warnings · ${invalid} invalid`;
    }
    s.documentExtractions = s.documentExtractions.filter((x) => x.documentId !== documentId);
    s.documentExtractions.unshift({
      id: `dx-${documentId}`,
      documentId,
      kind: "excel",
      pageCount: null,
      sheetNames: workbook.sheetNames,
      text: workbook.sheets.map((sheet) => `${sheet.name}: ${sheet.headers.join(", ")}`).join("\n"),
      tables: workbook.sheets.map((sheet) => ({
        name: sheet.name,
        headers: sheet.headers,
        rows: sheet.rows.map((row) => sheet.headers.map((header) => row[header] ?? "")),
      })),
      metadata: {
        detectedProfile: detection.profile,
        confidence: String(detection.confidence),
        autoSelected: String(detection.autoSelected),
      },
      ocrEnabled: false,
      extractable: true,
      createdAt: new Date().toISOString(),
    });
    s.importBatches = s.importBatches.filter((b) => b.documentId !== documentId);
    s.importRows = s.importRows.filter((r) => r.batchId !== batchId);
    s.importBatches.unshift({
      id: batchId,
      documentId,
      file: doc?.originalFilename ?? "workbook.xlsx",
      profile: detection.profile,
      checksum: doc?.checksum ?? "",
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
      confirmedAt: null,
      status: batchStatus,
      processed: validated.length,
      valid,
      warnings,
      invalid,
      added: 0,
      updated: 0,
      failed: invalid,
      mapping: detection.mapping,
      sheetName: primary.name,
    });
    validated.forEach((row, idx) => {
      s.importRows.push({
        id: `ir-${batchId}-${idx}`,
        batchId,
        rowNumber: row.rowNumber,
        status: row.status,
        original: row.original,
        normalized: row.normalized,
        issues: row.issues,
        importedRecordId: null,
        importedRecordType: null,
      });
    });
    s.documentProcessingJobs.unshift(job(documentId, "parsed", "completed", `Parsed ${workbook.sheetNames.length} sheet(s)`));
    s.documentProcessingJobs.unshift(job(documentId, "validated", "completed", `${valid} valid, ${warnings} warnings, ${invalid} invalid`));
  });
  audit(user, "IMPORT_VALIDATED", getStore().documents.find((d) => d.id === documentId)?.documentNumber ?? documentId, batchStatus);
}

async function processPdf(user: SessionUser, documentId: string, buffer: Buffer) {
  const extracted = await extractPdf(buffer);
  mutateStore((s) => {
    const doc = s.documents.find((d) => d.id === documentId);
    if (doc) {
      doc.processingStatus = extracted.encrypted ? "failed" : "processed";
      doc.status = extracted.encrypted ? "Failed" : "Uploaded";
      doc.processedAt = new Date().toISOString();
      doc.updatedAt = doc.processedAt;
      doc.summary = extracted.message ?? `Extracted ${extracted.pageCount} page(s)`;
    }
    s.documentExtractions = s.documentExtractions.filter((x) => x.documentId !== documentId);
    s.documentExtractions.unshift({
      id: `dx-${documentId}`,
      documentId,
      kind: "pdf",
      pageCount: extracted.pageCount,
      sheetNames: [],
      text: extracted.text,
      tables: [],
      metadata: extracted.metadata,
      ocrEnabled: false,
      extractable: extracted.extractable,
      createdAt: new Date().toISOString(),
    });
    s.documentProcessingJobs.unshift(
      job(documentId, "parsed", extracted.encrypted ? "failed" : "completed", extracted.message ?? "PDF text extracted"),
    );
  });
}

async function processDocx(user: SessionUser, documentId: string, buffer: Buffer) {
  const extracted = await extractDocx(buffer);
  mutateStore((s) => {
    const doc = s.documents.find((d) => d.id === documentId);
    if (doc) {
      doc.processingStatus = "processed";
      doc.status = "Uploaded";
      doc.processedAt = new Date().toISOString();
      doc.updatedAt = doc.processedAt;
      doc.summary = extracted.message ?? `Extracted ${extracted.text.split(/\s+/).filter(Boolean).length} words`;
    }
    s.documentExtractions = s.documentExtractions.filter((x) => x.documentId !== documentId);
    s.documentExtractions.unshift({
      id: `dx-${documentId}`,
      documentId,
      kind: "docx",
      pageCount: null,
      sheetNames: extracted.headings,
      text: extracted.text,
      tables: extracted.tables,
      metadata: { headings: String(extracted.headings.length) },
      ocrEnabled: false,
      extractable: extracted.extractable,
      createdAt: new Date().toISOString(),
    });
    s.documentProcessingJobs.unshift(job(documentId, "parsed", "completed", extracted.message ?? "DOCX text extracted"));
  });
}

export async function updateBatchMapping(user: SessionUser, batchId: string, profile: ImportProfileKey, mapping: Record<string, string>, sheetName?: string) {
  assertDocumentAccess(user, "create");
  await hydrateAllFileIntelligenceDocuments();
  const store = getStore();
  const batch = store.importBatches.find((b) => b.id === batchId);
  if (!batch) throw new Error("Import batch not found");
  if (batch.status === "imported") throw new Error("This import has already been confirmed.");
  const extraction = store.documentExtractions.find((x) => x.documentId === batch.documentId);
  const table = extraction?.tables.find((t) => t.name === (sheetName || batch.sheetName)) ?? extraction?.tables[0];
  if (!table) throw new Error("No extracted sheet is available to remap.");
  const rows = table.rows.map((cells, index) => {
    const original: Record<string, string> = {};
    const source: Record<string, string> = {};
    table.headers.forEach((header, idx) => {
      original[header] = cells[idx] ?? "";
      source[header] = cells[idx] ?? "";
    });
    return {
      rowNumber: index + 2,
      original,
      normalized: applyMapping(source, mapping),
    };
  });
  const validated = validateImportRows(store, profile, rows);
  const valid = validated.filter((r) => r.status === "valid").length;
  const warnings = validated.filter((r) => r.status === "warning").length;
  const invalid = validated.filter((r) => r.status === "error").length;
  mutateStore((s) => {
    const current = s.importBatches.find((b) => b.id === batchId);
    if (!current) return;
    current.profile = profile;
    current.mapping = mapping;
    current.sheetName = sheetName || current.sheetName;
    current.valid = valid;
    current.warnings = warnings;
    current.invalid = invalid;
    current.processed = validated.length;
    current.failed = invalid;
    current.status = invalid && valid + warnings ? "partially_valid" : invalid ? "failed" : "ready";
    s.importRows = s.importRows.filter((r) => r.batchId !== batchId);
    validated.forEach((row, idx) => {
      s.importRows.push({
        id: `ir-${batchId}-${idx}`,
        batchId,
        rowNumber: row.rowNumber,
        status: row.status,
        original: row.original,
        normalized: row.normalized,
        issues: row.issues,
        importedRecordId: null,
        importedRecordType: null,
      });
    });
  });
  await persistFileIntelligenceDocument(batch.documentId);
}

export async function confirmImport(user: SessionUser, batchId: string) {
  if (!authorize(user, "excel", "create")) throw new Error("Not authorized");
  await hydrateAllFileIntelligenceDocuments();
  const store = getStore();
  const batch = store.importBatches.find((b) => b.id === batchId);
  if (!batch) throw new Error("Import batch not found");
  if (batch.status === "imported") throw new Error("This file has already been imported.");
  if (batch.status === "cancelled") throw new Error("This import was cancelled.");
  const fingerprint = importFingerprint(batch.checksum, batch.profile);
  const duplicate = store.importBatches.find(
    (b) => b.id !== batch.id && b.status === "imported" && importFingerprint(b.checksum, b.profile) === fingerprint,
  );
  if (duplicate) {
    throw new Error(`Duplicate import blocked. The same file was imported on ${duplicate.confirmedAt?.slice(0, 10) ?? "a previous date"}.`);
  }
  const rows = store.importRows.filter((r) => r.batchId === batchId && r.status !== "error");
  if (!rows.length) throw new Error("There are no valid rows to import.");

  let added = 0;
  let updated = 0;
  mutateStore((s) => {
    for (const row of rows) {
      const result = applyImportedRow(s, user, batch.profile, row.normalized, batch.documentId);
      row.importedRecordId = result.id;
      row.importedRecordType = result.type;
      if (result.updated) updated += 1;
      else added += 1;
    }
    const current = s.importBatches.find((b) => b.id === batchId);
    if (current) {
      current.status = "imported";
      current.confirmedAt = new Date().toISOString();
      current.added = added;
      current.updated = updated;
    }
    const doc = s.documents.find((d) => d.id === batch.documentId);
    if (doc) {
      doc.summary = `Imported ${added} new / ${updated} updated ${PROFILE_LABELS[batch.profile]} records`;
      doc.updatedAt = new Date().toISOString();
    }
    if (batch.profile !== "GENERIC_EXCEL") {
      s.importJobs.unshift({
        id: `imp-${batchId}`,
        file: batch.file,
        type: LEGACY_FILE_TYPE[batch.profile as Exclude<ImportProfileKey, "GENERIC_EXCEL">],
        uploadedBy: user.id,
        uploadedAt: batch.uploadedAt,
        status: current?.invalid ? "Partial" : "Imported",
        processed: batch.processed,
        added,
        updated,
        failed: batch.invalid,
      });
    }
    s.documentProcessingJobs.unshift(job(batch.documentId, "imported", "completed", `${added} created, ${updated} updated`));
  });
  audit(user, "IMPORT_CONFIRMED", batch.file, `${added} created, ${updated} updated`);
  audit(user, "IMPORT_COMPLETED", batch.file, batch.profile);
  await persistFileIntelligenceDocument(batch.documentId);
  return { added, updated, failed: batch.invalid };
}

export async function analyzeDocument(user: SessionUser, documentId: string) {
  if (!authorize(user, "ai", "view") && !authorize(user, "documents", "create")) {
    throw new Error("Not authorized");
  }
  await hydrateFileIntelligenceDocument(documentId);
  const store = getStore();
  const doc = store.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Document not found");
  const extraction = store.documentExtractions.find((x) => x.documentId === documentId);
  const text = extraction?.text ?? "";
  audit(user, "AI_ANALYSIS_REQUESTED", doc.documentNumber, doc.name);
  const provider = getAIProvider();
  let payload = mockDocumentAnalysis(text);
  let mode: "LIVE" | "DEMO" = provider.name === "OpenAIProvider" ? "LIVE" : "DEMO";
  let providerName = provider.name;
  if (provider.name === "OpenAIProvider") {
    try {
      const raw = await provider.complete([
        {
          role: "user",
          content: `Analyze this SAMCO quality document. Return ONLY JSON with keys summary, keyFacts, potentialRisks, potentialNonconformities, suggestedActions, dates, referencedEntities[{type,value}], confidenceNotes.\nNever approve, reject, verify, close, or decide compliance.\nDocument:\n${text.slice(0, 8000)}`,
        },
      ]);
      payload = parseDocumentAnalysisJson(raw);
    } catch (error) {
      payload = mockDocumentAnalysis(text);
      mode = "DEMO";
      providerName = "MockAIProvider";
      payload.confidenceNotes = [
        `Live AI failed (${error instanceof Error ? error.message : "unknown"}). Deterministic demo analysis was used. The original file is unchanged.`,
        ...payload.confidenceNotes,
      ];
    }
  }
  const linked = findReferencedEntities(store, `${text}\n${payload.referencedEntities.map((e) => e.value).join(" ")}`);
  const referenced = payload.referencedEntities.map((entity) => {
    const match = linked.find((item) => item.value === entity.value) ?? (hrefForRef(store, entity.value)
      ? { type: entity.type, value: entity.value, recordId: entity.value, href: hrefForRef(store, entity.value) }
      : null);
    return match ?? { type: entity.type, value: entity.value, recordId: null, href: null };
  });
  for (const extra of linked) {
    if (!referenced.some((item) => item.value === extra.value)) referenced.push(extra);
  }
  const result: DocumentAnalysisResult = {
    id: `dar-${documentId}-${Date.now()}`,
    documentId,
    provider: providerName,
    mode,
    summary: payload.summary,
    keyFacts: payload.keyFacts,
    potentialRisks: payload.potentialRisks,
    potentialNonconformities: payload.potentialNonconformities,
    suggestedActions: payload.suggestedActions,
    dates: payload.dates,
    referencedEntities: referenced,
    confidenceNotes: payload.confidenceNotes,
    createdAt: new Date().toISOString(),
    createdBy: user.id,
  };
  mutateStore((s) => {
    s.documentAnalysisResults.unshift(result);
    const current = s.documents.find((d) => d.id === documentId);
    if (current) {
      current.status = "Analyzed";
      current.summary = payload.summary;
      current.updatedAt = result.createdAt;
    }
    s.documentProcessingJobs.unshift(job(documentId, "analyzed", "completed", `${mode} analysis stored`));
    s.aiAnalyses.unshift({
      id: `ai-${result.id}`,
      topic: "Uploaded Document Analysis",
      prompt: `Analyze ${doc.name}`,
      result: payload.summary,
      provider: providerName,
      createdAt: result.createdAt,
      createdBy: user.id,
    });
  });
  audit(user, "DOCUMENT_ANALYZED", doc.documentNumber, mode);
  audit(user, "AI_ANALYSIS_COMPLETED", doc.documentNumber, providerName);
  await persistFileIntelligenceDocument(documentId);
  return result;
}

export async function createDraftFromDocument(
  user: SessionUser,
  documentId: string,
  kind: "ncr" | "capa" | "risk" | "task",
  title: string,
) {
  await hydrateFileIntelligenceDocument(documentId);
  const doc = getStore().documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Document not found");
  const { createDraftFromAnalysis } = await import("@/server/workflow-actions");
  const created = await createDraftFromAnalysis(kind, title, documentId);
  mutateStore((s) => {
    s.documentLinks.unshift({
      id: `dl-${created.id}`,
      documentId,
      recordType: kind === "ncr" ? "production_ncr" : kind,
      recordId: created.id,
      recordRef: title,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    });
    const current = s.documents.find((d) => d.id === documentId);
    if (current && !current.recordId) {
      current.recordType = kind === "ncr" ? "production_ncr" : kind;
      current.recordId = created.id;
    }
  });
  audit(user, "DOCUMENT_LINKED", doc.documentNumber, created.id);
  await persistFileIntelligenceDocument(documentId);
  return created;
}

export async function signedDownload(user: SessionUser, documentId: string) {
  assertDocumentAccess(user, "view");
  await hydrateFileIntelligenceDocument(documentId);
  const doc = getStore().documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Document not found");
  if (!doc.storagePath) throw new Error("This seeded document has no stored binary. Upload a file to preview or download it.");
  audit(user, "DOCUMENT_VIEWED", doc.documentNumber, doc.name);
  return `/api/documents/${doc.id}/file`;
}

export async function readStoredFile(user: SessionUser, documentId: string) {
  assertDocumentAccess(user, "view");
  await hydrateFileIntelligenceDocument(documentId);
  const doc = getStore().documents.find((d) => d.id === documentId);
  if (!doc?.storagePath) throw new Error("Stored file is not available");
  return {
    doc,
    bytes: await getStorageProvider().get(doc.storagePath),
  };
}
