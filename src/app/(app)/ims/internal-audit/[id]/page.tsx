import Link from "next/link";
import { RecordDetailPage } from "@/features/records/detail-page";
import { getStore } from "@/server/data/store";
import { Card } from "@/components/ui";

export default async function InternalAuditDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questions = getStore().auditQuestions.filter((q) => q.auditId === id);
  return (
    <div className="space-y-4">
      <Card className="p-4 text-sm">
        <div className="flex flex-wrap gap-3">
          <Link href={`/api/checklist/${id}`} className="text-samco hover:underline">
            Download prepared checklist
          </Link>
          <span className="text-muted">Complete online below or upload a completed checklist in Documents.</span>
        </div>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {questions.map((q) => (
            <li key={q.id}>
              <strong>
                {q.standard} {q.clause}
              </strong>{" "}
              — {q.question}
              <div className="text-xs text-muted">{q.procedure}</div>
            </li>
          ))}
        </ol>
      </Card>
      <RecordDetailPage moduleKey="audit" collection="audits" id={id} title="Internal Audit" backHref="/ims/internal-audit" />
    </div>
  );
}
