import { RecordDetailPage } from "@/features/records/detail-page";
import { SupplierResponseForm } from "@/features/quality/supplier-response-form";
import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";

export default async function SupplierNcrDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  return (
    <div>
      <SupplierResponseForm
        id={id}
        canSubmit={authorize(user, "supplier_ncr", "submit")}
        canReview={authorize(user, "supplier_ncr", "review")}
      />
      <RecordDetailPage moduleKey="supplier_ncr" collection="supplierNcrs" id={id} title="Supplier NCR" backHref="/quality/supplier-ncr" />
    </div>
  );
}
