import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";
import { getStore } from "@/server/data/store";
import { hrefForRef } from "@/lib/record-hrefs";
import { DataTable } from "@/components/data-table";
import { Button, PageHeader } from "@/components/ui";

export default async function DocumentsPage() {
  const user = await requireUser();
  if (!authorize(user, "documents", "view")) {
    return <p className="text-sm text-danger">You are not authorized to view documents.</p>;
  }
  const store = getStore();
  const rows = store.documents.map((doc) => {
    const uploader = store.profiles.find((p) => p.id === doc.uploadedBy);
    const related = doc.recordId ? hrefForRef(store, doc.recordId) : store.documentLinks.find((l) => l.documentId === doc.id);
    const relatedHref = typeof related === "string" ? related : related ? hrefForRef(store, related.recordId) : null;
    const relatedLabel = doc.recordId
      ? store.documentLinks.find((l) => l.documentId === doc.id)?.recordRef ?? doc.recordId
      : "—";
    return {
      ...doc,
      file: doc.originalFilename,
      uploadedByName: uploader?.fullName ?? doc.uploadedBy,
      relatedLabel,
      relatedHref: relatedHref ?? "",
      _href: `/documents/${doc.id}`,
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        subtitle="Controlled document register with private storage, extraction, and import history"
        actions={
          authorize(user, "documents", "create") ? (
            <Link href="/documents/analyze">
              <Button>Upload & Analyze</Button>
            </Link>
          ) : null
        }
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "documentNumber", header: "Document #" },
          { key: "title", header: "Title" },
          { key: "file", header: "File" },
          { key: "type", header: "Type" },
          { key: "module", header: "Module" },
          { key: "relatedLabel", header: "Related Record" },
          { key: "processingStatus", header: "Processing Status" },
          { key: "uploadedByName", header: "Uploaded By" },
          { key: "uploadedAt", header: "Uploaded At" },
        ]}
        searchKeys={["documentNumber", "title", "file", "relatedLabel", "uploadedByName"]}
      />
    </div>
  );
}
