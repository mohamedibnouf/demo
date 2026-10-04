import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";
import { getStore } from "@/server/data/store";
import { isDocumentStorageConfigured } from "@/server/storage";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";
import { DocumentUploadForm } from "@/features/documents/upload-form";

export default async function DocumentAnalyzePage() {
  const user = await requireUser();
  if (!authorize(user, "documents", "view")) {
    return <p className="text-sm text-danger">You are not authorized to view documents.</p>;
  }
  const storageConfigured = isDocumentStorageConfigured();
  const docs = getStore().documents.map((doc) => ({
    ...doc,
    _href: `/documents/${doc.id}`,
  }));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Upload & Analyze"
        subtitle="Select a file, upload it to private storage, then review extraction, validation, and AI analysis before any import."
      />
      {authorize(user, "documents", "create") ? (
        storageConfigured ? (
          <DocumentUploadForm />
        ) : (
          <p className="rounded-md border border-line bg-white p-4 text-sm text-muted">Document storage is not configured for this environment.</p>
        )
      ) : (
        <p className="text-sm text-muted">You can view documents but are not authorized to upload.</p>
      )}
      <DataTable
        rows={docs}
        columns={[
          { key: "documentNumber", header: "Document #" },
          { key: "name", header: "File" },
          { key: "type", header: "Type" },
          { key: "processingStatus", header: "Processing" },
          { key: "status", header: "Analysis" },
          { key: "uploadedAt", header: "Uploaded" },
          { key: "summary", header: "Summary" },
        ]}
        searchKeys={["documentNumber", "name", "type", "summary"]}
      />
    </div>
  );
}
