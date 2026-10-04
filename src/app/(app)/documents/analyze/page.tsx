import { getStore } from "@/server/data/store";
import { Card, PageHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { DocumentActions } from "@/features/documents/document-actions";

export default async function DocumentAnalyzePage() {
  const docs = getStore().documents;
  return (
    <div className="space-y-4">
      <PageHeader title="Document Intelligence" subtitle="Upload metadata is stored. Parsed analysis is advisory. Drafts require human confirmation." />
      <Card className="border-dashed p-6 text-center text-sm text-muted">
        Demo upload zone — PDF, DOCX, XLSX, CSV, images. Files stay in the local demo store.
      </Card>
      <DataTable
        rows={docs}
        columns={[
          { key: "name", header: "Document" },
          { key: "type", header: "Type" },
          { key: "uploadedAt", header: "Uploaded" },
          { key: "status", header: "Status" },
          { key: "summary", header: "Summary" },
        ]}
        searchKeys={["name", "type"]}
      />
      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase text-muted">Document analysis · ALPHA-8D-229.pdf</h2>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>Summary: Supplier 8D attributes leak to tool wear on flare seat.</div>
          <div>Detected KPIs: SPPM, incoming reject rate</div>
          <div>Detected dates: completion 2026-10-09</div>
          <div>Detected risks: repeat leak if stock consumed</div>
          <div>Detected actions: C=0 sampling, tool interlock</div>
          <div>Responsible persons: Hiroshi Tanaka / Incoming inspector</div>
          <div>Upcoming deadlines: 5 days</div>
          <div>Quality issues: flare-seat porosity</div>
        </dl>
        <DocumentActions title="Alpha 8D flare-seat porosity" />
      </Card>
    </div>
  );
}
