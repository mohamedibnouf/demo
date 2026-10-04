import { qualityCatalog } from "@/features/catalog";
import { RecordDetailPage } from "@/features/records/detail-page";
import { notFound } from "next/navigation";

const COLLECTION: Record<string, Parameters<typeof RecordDetailPage>[0]["collection"]> = {
  "production-inspection": "inspections",
  "incoming-inspection": "inspections",
  "in-process-inspection": "inspections",
  "final-inspection": "inspections",
  "production-ncr": "ncrs",
  "internal-ncr": "ncrs",
  "supplier-ncr": "supplierNcrs",
  "customer-complaints": "complaints",
  capa: "capas",
  deviation: "deviations",
  "sample-evaluation": "sampleEvaluations",
  ecn: "ecns",
  rework: "reworks",
  rrr: "rrrRecords",
  calibration: "equipment",
};

export default async function QualityDetail({ params }: { params: Promise<{ module: string; id: string }> }) {
  const { module, id } = await params;
  const spec = qualityCatalog[module];
  const collection = COLLECTION[module];
  if (!spec || !collection) notFound();
  return (
    <RecordDetailPage
      moduleKey={spec.module}
      collection={collection}
      id={id}
      title={spec.title}
      backHref={`/quality/${module}`}
    />
  );
}
