import { notFound } from "next/navigation";
import { authorize } from "@/lib/engines/rbac";
import { requireUser } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";
import type { CatalogModule } from "../catalog";

export async function CatalogListPage({ spec }: { spec?: CatalogModule }) {
  if (!spec) notFound();
  const user = await requireUser();
  if (!authorize(user, spec.module, "view")) {
    return <p className="text-sm text-danger">You are not authorized to view this module.</p>;
  }
  const rows = spec.rows(getStore(), user).map((row) => ({ ...row, _href: spec.href(row.id) }));
  return (
    <div>
      <PageHeader title={spec.title} subtitle={spec.subtitle} />
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
