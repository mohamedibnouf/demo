import { formatFileSize, typeLabel } from "@/lib/files/validation";
import { hasSupabaseServiceRole } from "@/lib/env";
import { getStore } from "@/server/data/store";
import { createSupabaseAdminClient } from "@/server/data/supabase-admin";
import type {
  DocumentAnalysisResult,
  DocumentExtraction,
  DocumentProcessingJob,
  DocumentRecord,
  DocumentVersion,
  ImportBatch,
  ImportError,
  ImportRow,
} from "@/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function asUuidOrNull(value: string | null | undefined): string | null {
  return value && UUID_RE.test(value) ? value : null;
}

export function isHostedFileIntelligenceEnabled(): boolean {
  return hasSupabaseServiceRole();
}

function extras(doc: DocumentRecord) {
  return {
    uploadedBy: doc.uploadedBy,
    name: doc.name,
    type: doc.type,
    sizeLabel: doc.sizeLabel,
    summary: doc.summary ?? "",
  };
}

export async function persistFileIntelligenceDocument(documentId: string) {
  if (!isHostedFileIntelligenceEnabled()) return;
  const store = getStore();
  const doc = store.documents.find((item) => item.id === documentId);
  if (!doc) return;
  const client = createSupabaseAdminClient();

  const { error: docError } = await client.from("documents").upsert({
    id: doc.id,
    document_number: doc.documentNumber,
    title: doc.title,
    original_filename: doc.originalFilename,
    stored_filename: doc.storedFilename,
    mime_type: doc.mimeType,
    extension: doc.extension,
    size_bytes: doc.sizeBytes,
    storage_bucket: doc.storageBucket,
    storage_path: doc.storagePath,
    checksum: doc.checksum,
    module: doc.module,
    record_type: doc.recordType,
    record_id: doc.recordId,
    status: doc.status,
    processing_status: doc.processingStatus,
    uploaded_by: asUuidOrNull(doc.uploadedBy),
    uploaded_at: doc.uploadedAt,
    processed_at: doc.processedAt,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  });
  if (docError) throw new Error(`Document metadata could not be saved: ${docError.message}`);

  const versions = store.documentVersions.filter((item) => item.documentId === documentId);
  if (versions.length) {
    const { error } = await client.from("document_versions").upsert(
      versions.map((item) => ({
        id: item.id,
        document_id: item.documentId,
        version: item.version,
        storage_path: item.storagePath,
        checksum: item.checksum,
        uploaded_by: asUuidOrNull(item.uploadedBy),
        uploaded_at: item.uploadedAt,
      })),
    );
    if (error) throw new Error(`Document version metadata could not be saved: ${error.message}`);
  }

  const jobs = store.documentProcessingJobs.filter((item) => item.documentId === documentId);
  if (jobs.length) {
    const { error } = await client.from("document_processing_jobs").upsert(
      jobs.map((item) => ({
        id: item.id,
        document_id: item.documentId,
        stage: item.stage,
        status: item.status,
        message: item.message,
        started_at: item.startedAt,
        completed_at: item.completedAt,
      })),
    );
    if (error) throw new Error(`Document job metadata could not be saved: ${error.message}`);
  }

  const extractions = store.documentExtractions.filter((item) => item.documentId === documentId);
  const extractionRows = (extractions.length ? extractions : []).map((item) => ({
    id: item.id,
    document_id: item.documentId,
    kind: item.kind,
    page_count: item.pageCount,
    sheet_names: item.sheetNames,
    text: item.text,
    tables: item.tables,
    metadata: { ...item.metadata, ...extras(doc) },
    ocr_enabled: item.ocrEnabled,
    extractable: item.extractable,
    created_at: item.createdAt,
  }));
  if (!extractionRows.length) {
    extractionRows.push({
      id: `dx-meta-${documentId}`,
      document_id: documentId,
      kind: "none",
      page_count: null,
      sheet_names: [],
      text: "",
      tables: [],
      metadata: extras(doc),
      ocr_enabled: false,
      extractable: false,
      created_at: doc.createdAt,
    });
  }
  const { error: extractionError } = await client.from("document_extractions").upsert(extractionRows);
  if (extractionError) throw new Error(`Document extraction metadata could not be saved: ${extractionError.message}`);

  const analyses = store.documentAnalysisResults.filter((item) => item.documentId === documentId);
  if (analyses.length) {
    const { error } = await client.from("document_analysis_results").upsert(
      analyses.map((item) => ({
        id: item.id,
        document_id: item.documentId,
        provider: item.provider,
        mode: item.mode,
        summary: item.summary,
        payload: item,
        created_at: item.createdAt,
        created_by: asUuidOrNull(item.createdBy),
      })),
    );
    if (error) throw new Error(`Document analysis metadata could not be saved: ${error.message}`);
  }

  const batches = store.importBatches.filter((item) => item.documentId === documentId);
  if (batches.length) {
    const { error } = await client.from("import_batches").upsert(
      batches.map((item) => ({
        id: item.id,
        document_id: item.documentId,
        file: item.file,
        profile: item.profile,
        checksum: item.checksum,
        uploaded_by: asUuidOrNull(item.uploadedBy),
        uploaded_at: item.uploadedAt,
        confirmed_at: item.confirmedAt,
        status: item.status,
        processed: item.processed,
        valid: item.valid,
        warnings: item.warnings,
        invalid: item.invalid,
        added: item.added,
        updated: item.updated,
        failed: item.failed,
        mapping: item.mapping,
        sheet_name: item.sheetName,
      })),
    );
    if (error) throw new Error(`Import batch metadata could not be saved: ${error.message}`);
    const batchIds = batches.map((item) => item.id);
    const rows = store.importRows.filter((item) => batchIds.includes(item.batchId));
    if (rows.length) {
      const { error: rowError } = await client.from("import_rows").upsert(
        rows.map((item) => ({
          id: item.id,
          batch_id: item.batchId,
          row_number: item.rowNumber,
          status: item.status,
          original: item.original,
          normalized: item.normalized,
          issues: item.issues,
          imported_record_id: item.importedRecordId,
          imported_record_type: item.importedRecordType,
        })),
      );
      if (rowError) throw new Error(`Import row metadata could not be saved: ${rowError.message}`);
    }
  }

  const errors = store.importErrors.filter((item) => item.id.includes(documentId) || batches.some((batch) => item.jobId === batch.id || item.jobId === `imp-${batch.id}`));
  if (errors.length) {
    const { error } = await client.from("import_errors").upsert(
      errors.map((item) => ({
        id: item.id,
        job_id: item.jobId,
        row: item.row,
        error: item.error,
        value: item.value,
        recommendation: item.recommendation,
      })),
    );
    if (error) throw new Error(`Import error metadata could not be saved: ${error.message}`);
  }
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

function toDocument(row: Record<string, unknown>, meta: Record<string, string>): DocumentRecord {
  const extension = String(row.extension ?? "");
  const sizeBytes = Number(row.size_bytes ?? 0);
  const originalFilename = String(row.original_filename ?? "document");
  return {
    id: String(row.id),
    documentNumber: String(row.document_number ?? ""),
    title: String(row.title ?? originalFilename),
    name: meta.name || originalFilename,
    type: meta.type || typeLabel(extension),
    originalFilename,
    storedFilename: String(row.stored_filename ?? originalFilename),
    mimeType: String(row.mime_type ?? "application/octet-stream"),
    extension,
    sizeBytes,
    sizeLabel: meta.sizeLabel || formatFileSize(sizeBytes),
    storageBucket: String(row.storage_bucket ?? "samco-documents"),
    storagePath: String(row.storage_path ?? ""),
    checksum: String(row.checksum ?? ""),
    module: String(row.module ?? "documents"),
    recordType: (row.record_type as string | null) ?? null,
    recordId: (row.record_id as string | null) ?? null,
    status: (row.status as DocumentRecord["status"]) || "Uploaded",
    processingStatus: (row.processing_status as DocumentRecord["processingStatus"]) || "uploaded",
    uploadedBy: meta.uploadedBy || String(row.uploaded_by ?? ""),
    uploadedAt: String(row.uploaded_at ?? ""),
    processedAt: (row.processed_at as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    summary: meta.summary || null,
  };
}

export async function hydrateFileIntelligenceDocument(documentId: string) {
  if (!isHostedFileIntelligenceEnabled()) return;
  const store = getStore();
  if (store.documents.some((item) => item.id === documentId)) return;
  const client = createSupabaseAdminClient();
  const { data: row, error } = await client.from("documents").select("*").eq("id", documentId).maybeSingle();
  if (error) throw new Error(`Document metadata could not be loaded: ${error.message}`);
  if (!row) return;

  const [{ data: versions }, { data: jobs }, { data: extractions }, { data: analyses }, { data: batches }] = await Promise.all([
    client.from("document_versions").select("*").eq("document_id", documentId),
    client.from("document_processing_jobs").select("*").eq("document_id", documentId),
    client.from("document_extractions").select("*").eq("document_id", documentId),
    client.from("document_analysis_results").select("*").eq("document_id", documentId),
    client.from("import_batches").select("*").eq("document_id", documentId),
  ]);

  const batchIds = (batches ?? []).map((item) => String(item.id));
  const { data: rows } = batchIds.length
    ? await client.from("import_rows").select("*").in("batch_id", batchIds)
    : { data: [] as Record<string, unknown>[] };
  const { data: importErrors } = await client.from("import_errors").select("*").or(`id.ilike.%${documentId}%,job_id.ilike.%${documentId}%`);

  const meta = ((extractions ?? []).find((item) => item.metadata)?.metadata ?? {}) as Record<string, string>;
  const document = toDocument(row as Record<string, unknown>, meta);

  store.documents = mergeById(store.documents, [document]);
  store.documentVersions = mergeById(
    store.documentVersions,
    (versions ?? []).map(
      (item): DocumentVersion => ({
        id: String(item.id),
        documentId: String(item.document_id),
        version: Number(item.version),
        storagePath: String(item.storage_path),
        checksum: String(item.checksum ?? ""),
        uploadedBy: String(item.uploaded_by ?? document.uploadedBy),
        uploadedAt: String(item.uploaded_at ?? document.uploadedAt),
      }),
    ),
  );
  store.documentProcessingJobs = mergeById(
    store.documentProcessingJobs,
    (jobs ?? []).map(
      (item): DocumentProcessingJob => ({
        id: String(item.id),
        documentId: String(item.document_id),
        stage: String(item.stage),
        status: item.status as DocumentProcessingJob["status"],
        message: String(item.message ?? ""),
        startedAt: String(item.started_at),
        completedAt: (item.completed_at as string | null) ?? null,
      }),
    ),
  );
  store.documentExtractions = mergeById(
    store.documentExtractions,
    (extractions ?? []).map(
      (item): DocumentExtraction => ({
        id: String(item.id),
        documentId: String(item.document_id),
        kind: item.kind as DocumentExtraction["kind"],
        pageCount: (item.page_count as number | null) ?? null,
        sheetNames: (item.sheet_names as string[]) ?? [],
        text: String(item.text ?? ""),
        tables: (item.tables as DocumentExtraction["tables"]) ?? [],
        metadata: (item.metadata as Record<string, string>) ?? {},
        ocrEnabled: Boolean(item.ocr_enabled),
        extractable: Boolean(item.extractable),
        createdAt: String(item.created_at),
      }),
    ),
  );
  store.documentAnalysisResults = mergeById(
    store.documentAnalysisResults,
    (analyses ?? []).map((item): DocumentAnalysisResult => {
      const payload = (item.payload ?? {}) as Partial<DocumentAnalysisResult>;
      return {
        id: String(item.id),
        documentId: String(item.document_id),
        provider: String(item.provider),
        mode: (item.mode as DocumentAnalysisResult["mode"]) || "DEMO",
        summary: String(item.summary ?? payload.summary ?? ""),
        keyFacts: payload.keyFacts ?? [],
        potentialRisks: payload.potentialRisks ?? [],
        potentialNonconformities: payload.potentialNonconformities ?? [],
        suggestedActions: payload.suggestedActions ?? [],
        dates: payload.dates ?? [],
        referencedEntities: payload.referencedEntities ?? [],
        confidenceNotes: payload.confidenceNotes ?? [],
        createdAt: String(item.created_at),
        createdBy: payload.createdBy || String(item.created_by ?? ""),
      };
    }),
  );
  store.importBatches = mergeById(
    store.importBatches,
    (batches ?? []).map(
      (item): ImportBatch => ({
        id: String(item.id),
        documentId: String(item.document_id),
        file: String(item.file),
        profile: item.profile as ImportBatch["profile"],
        checksum: String(item.checksum ?? ""),
        uploadedBy: String(item.uploaded_by ?? document.uploadedBy),
        uploadedAt: String(item.uploaded_at),
        confirmedAt: (item.confirmed_at as string | null) ?? null,
        status: item.status as ImportBatch["status"],
        processed: Number(item.processed ?? 0),
        valid: Number(item.valid ?? 0),
        warnings: Number(item.warnings ?? 0),
        invalid: Number(item.invalid ?? 0),
        added: Number(item.added ?? 0),
        updated: Number(item.updated ?? 0),
        failed: Number(item.failed ?? 0),
        mapping: (item.mapping as Record<string, string>) ?? {},
        sheetName: String(item.sheet_name ?? ""),
      }),
    ),
  );
  store.importRows = mergeById(
    store.importRows,
    (rows ?? []).map(
      (item): ImportRow => ({
        id: String(item.id),
        batchId: String(item.batch_id),
        rowNumber: Number(item.row_number),
        status: item.status as ImportRow["status"],
        original: (item.original as Record<string, string>) ?? {},
        normalized: (item.normalized as Record<string, string>) ?? {},
        issues: (item.issues as ImportRow["issues"]) ?? [],
        importedRecordId: (item.imported_record_id as string | null) ?? null,
        importedRecordType: (item.imported_record_type as string | null) ?? null,
      }),
    ),
  );
  store.importErrors = mergeById(
    store.importErrors,
    (importErrors ?? []).map(
      (item): ImportError => ({
        id: String(item.id),
        jobId: String(item.job_id ?? ""),
        row: Number(item.row ?? 0),
        error: String(item.error ?? ""),
        value: String(item.value ?? ""),
        recommendation: String(item.recommendation ?? ""),
      }),
    ),
  );
}

export async function hydrateAllFileIntelligenceDocuments() {
  if (!isHostedFileIntelligenceEnabled()) return;
  const client = createSupabaseAdminClient();
  const { data, error } = await client.from("documents").select("id");
  if (error) throw new Error(`Document list metadata could not be loaded: ${error.message}`);
  for (const row of data ?? []) {
    await hydrateFileIntelligenceDocument(String(row.id));
  }
}
