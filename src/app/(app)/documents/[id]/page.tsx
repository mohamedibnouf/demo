import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";
import { getStore } from "@/server/data/store";
import { hydrateFileIntelligenceDocument } from "@/server/documents/hosted-metadata";
import { PageHeader } from "@/components/ui";
import { DocumentWorkspace } from "@/features/documents/workspace";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!authorize(user, "documents", "view")) {
    return <p className="text-sm text-danger">You are not authorized to view documents.</p>;
  }
  const { id } = await params;
  await hydrateFileIntelligenceDocument(id);
  const store = getStore();
  const document = store.documents.find((d) => d.id === id);
  if (!document) notFound();
  const extraction = store.documentExtractions.find((x) => x.documentId === id) ?? null;
  const analysis = store.documentAnalysisResults.find((x) => x.documentId === id) ?? null;
  const batch = store.importBatches.find((b) => b.documentId === id) ?? null;
  const rows = batch ? store.importRows.filter((r) => r.batchId === batch.id) : [];
  const jobs = store.documentProcessingJobs.filter((j) => j.documentId === id);
  const links = store.documentLinks.filter((l) => l.documentId === id);
  const audits = store.auditLogs.filter((a) => a.recordRef === document.documentNumber || a.recordRef === document.name || a.recordRef === document.id);
  const uploader = store.profiles.find((p) => p.id === document.uploadedBy);

  return (
    <div className="space-y-4">
      <PageHeader title={document.documentNumber} subtitle={`${document.title} · ${document.originalFilename}`} />
      <DocumentWorkspace
        document={document}
        extraction={extraction}
        analysis={analysis}
        batch={batch}
        rows={rows}
        jobs={jobs}
        links={links}
        audits={audits}
        uploader={uploader}
        canImport={authorize(user, "excel", "create") && user.role !== "Management"}
        canAnalyze={authorize(user, "ai", "view") || authorize(user, "documents", "create")}
        canCreateDrafts={user.role !== "Management"}
        downloadHref={document.storagePath ? `/api/documents/${document.id}/file` : null}
      />
    </div>
  );
}
