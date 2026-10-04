import { qualityCatalog } from "@/features/catalog";
import { CatalogListPage } from "@/features/records/list-page";
import { CreateComplaintForm } from "@/features/quality/create-complaint-form";
import { getStore } from "@/server/data/store";
import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";

export default async function ComplaintsPage() {
  const user = await requireUser();
  const store = getStore();
  return (
    <div>
      {authorize(user, "customer_complaint", "create") ? (
        <CreateComplaintForm
          serials={store.productionUnits.map((u) => u.serialNumber)}
          models={store.models.map((m) => ({ id: m.id, code: m.code }))}
        />
      ) : null}
      <CatalogListPage spec={qualityCatalog["customer-complaints"]} />
    </div>
  );
}
