import { notFound } from "next/navigation";
import { authorize } from "@/lib/engines/rbac";
import { requireUser } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";
import type { CatalogModule } from "../catalog";
import { CreateDraftButton } from "./create-draft-button";

const SKIP_GENERIC_CREATE = new Set(["production_inspection", "customer_complaint", "calibration"]);

export async function CatalogListPage({ spec }: { spec?: CatalogModule }) {
  if (!spec) notFound();
  const user = await requireUser();
  if (!authorize(user, spec.module, "view")) {
    return <p className="text-sm text-danger">You are not authorized to view this module.</p>;
  }
  const rows = spec.rows(getStore(), user).map((row) => ({ ...row, _href: spec.href(row.id) }));
  const slug = spec.href("__id__").split("/").filter(Boolean).at(-2) ?? "";
  const canCreate = authorize(user, spec.module, "create") && !SKIP_GENERIC_CREATE.has(spec.module);

  return (
    <div>
      <PageHeader
        title={spec.title}
        subtitle={spec.subtitle}
        actions={canCreate ? <CreateDraftButton slug={slug} label={spec.title} /> : null}
      />
      <DataTable
        rows={rows}
        columns={spec.columns.map((c, i) => ({
          ...c,
          link: i === 0,
        }))}
        searchKeys={spec.searchKeys as never}
      />
    </div>
  );
}
