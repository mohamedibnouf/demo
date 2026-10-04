import { imsCatalog } from "@/features/catalog";
import { RecordDetailPage } from "@/features/records/detail-page";
import { notFound } from "next/navigation";

const COLLECTION: Record<string, Parameters<typeof RecordDetailPage>[0]["collection"]> = {
  objectives: "imsObjectives",
  "risk-opportunity": "riskRegister",
  "annual-audit-plan": "auditPlans",
  "internal-audit": "audits",
  "external-audit": "audits",
  "customer-audit": "audits",
  "supplier-audit": "audits",
  "audit-findings": "auditFindings",
  "management-review": "managementReviews",
};

export default async function ImsDetail({ params }: { params: Promise<{ module: string; id: string }> }) {
  const { module, id } = await params;
  const spec = imsCatalog[module];
  const collection = COLLECTION[module];
  if (!spec || !collection) notFound();
  return <RecordDetailPage moduleKey={spec.module} collection={collection} id={id} title={spec.title} backHref={`/ims/${module}`} />;
}
