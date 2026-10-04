import { qualityCatalog } from "@/features/catalog";
import { CatalogListPage } from "@/features/records/list-page";
import { CreateInspectionForm } from "@/features/quality/create-inspection-form";
import { getStore } from "@/server/data/store";
import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";

export default async function ProductionInspectionPage() {
  const user = await requireUser();
  const store = getStore();
  return (
    <div>
      {authorize(user, "production_inspection", "create") ? (
        <CreateInspectionForm
          serials={store.productionUnits.map((u) => u.serialNumber)}
          materials={store.materials.map((m) => ({ id: m.id, partNumber: m.partNumber }))}
          suppliers={store.suppliers.map((s) => ({ id: s.id, name: s.name }))}
        />
      ) : null}
      <CatalogListPage spec={qualityCatalog["production-inspection"]} />
    </div>
  );
}
