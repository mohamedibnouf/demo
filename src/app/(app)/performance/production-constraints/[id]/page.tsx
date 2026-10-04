import { RecordDetailPage } from "@/features/records/detail-page";

export default async function ProductionConstraintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RecordDetailPage
      moduleKey="production_constraint"
      collection="productionConstraints"
      id={id}
      title="Production Constraints"
      backHref="/performance/production-constraints"
    />
  );
}
