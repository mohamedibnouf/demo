import { requireUser } from "@/server/auth/session";
import { authorize } from "@/lib/engines/rbac";
import { getStore } from "@/server/data/store";
import { hydrateAllFileIntelligenceDocuments } from "@/server/documents/hosted-metadata";
import { DataTable } from "@/components/data-table";
import { Card, PageHeader } from "@/components/ui";
import { ExcelCenter } from "@/features/admin/excel-center";
import { ResetDemoButton } from "@/features/admin/reset-demo";
import { can } from "@/lib/engines/rbac";
import { ROLE_MATRIX } from "@/lib/engines/rbac";

export default async function AdminPage({ params }: { params: Promise<{ module: string }> }) {
  const user = await requireUser();
  const { module } = await params;
  if (module === "excel") await hydrateAllFileIntelligenceDocuments();
  const store = getStore();
  const adminOk = authorize(user, module === "excel" ? "excel" : module === "users" ? "users" : "admin", "view");
  if (!adminOk) return <p className="text-sm text-danger">You are not authorized to view this administration module.</p>;

  const viewOnly = user.role !== "Admin";

  if (module === "users") {
    return (
      <div>
        <PageHeader title="Users" subtitle="Demo identities — password is shared and documented" />
        {viewOnly ? <p className="mb-3 text-xs text-muted">View only. Changing users requires the Admin role.</p> : null}
        <DataTable
          rows={store.profiles.map((p) => ({ ...p, activeLabel: p.active ? "Yes" : "No" }))}
          columns={[
            { key: "fullName", header: "Name" },
            { key: "email", header: "Email" },
            { key: "title", header: "Title" },
            { key: "activeLabel", header: "Active" },
          ]}
          searchKeys={["fullName", "email"]}
        />
      </div>
    );
  }

  if (module === "roles") {
    const rows = store.roles.map((r) => ({
      id: r.id,
      name: r.name,
      modules: Object.keys(ROLE_MATRIX[r.name] ?? {}).length,
    }));
    return (
      <div>
        <PageHeader title="Roles & Permissions" subtitle="Server-side matrix: view / create / edit / submit / review / approve / verify / close / reopen / export" />
        <DataTable rows={rows} columns={[{ key: "name", header: "Role" }, { key: "modules", header: "Modules granted" }]} searchKeys={["name"]} />
        <Card className="mt-4 p-4 text-sm text-muted">
          Management is read-only. Supplier and Customer are isolated. UI hides unauthorized actions; server actions re-check.
        </Card>
      </div>
    );
  }

  if (module === "master-data") {
    return (
      <div className="space-y-4">
        <PageHeader title="Master Data" subtitle="Departments, suppliers, customers, models, lines, materials" />
        <DataTable rows={store.departments} columns={[{ key: "code", header: "Code" }, { key: "name", header: "Department" }]} searchKeys={["name"]} />
        <DataTable rows={store.suppliers} columns={[{ key: "code", header: "Code" }, { key: "name", header: "Supplier" }, { key: "category", header: "Category" }]} searchKeys={["name"]} />
        <DataTable rows={store.models} columns={[{ key: "code", header: "Model" }, { key: "name", header: "Name" }]} searchKeys={["code", "name"]} />
      </div>
    );
  }

  if (module === "workflows") {
    return (
      <div>
        <PageHeader title="Workflow Configuration" subtitle="Controlled status sequences" />
        <DataTable
          rows={store.workflows.map((w) => ({ ...w, stepsLabel: w.steps.join(" → ") }))}
          columns={[{ key: "name", header: "Workflow" }, { key: "module", header: "Module" }, { key: "stepsLabel", header: "Steps" }]}
          searchKeys={["name"]}
        />
      </div>
    );
  }

  if (module === "numbering") {
    return (
      <div>
        <PageHeader title="Numbering Configuration" subtitle="Server-side concurrency-safe sequences" />
        <DataTable
          rows={store.sequences}
          columns={[{ key: "prefix", header: "Prefix" }, { key: "year", header: "Year" }, { key: "nextValue", header: "Next" }, { key: "padding", header: "Padding" }]}
          searchKeys={["prefix"]}
        />
      </div>
    );
  }

  if (module === "excel") {
    return (
      <div>
        <PageHeader title="Excel Integration" subtitle="Invalid rows never enter the database" />
        <ExcelCenter jobs={store.importJobs} errors={store.importErrors} batches={store.importBatches} />
      </div>
    );
  }

  if (module === "notifications") {
    return (
      <div>
        <PageHeader title="Notification Configuration" subtitle="Recipients, timing, and escalation (demo rules)" />
        <Card className="p-4 text-sm">
          <p>NCR / CAPA / Finding overdue escalate to Quality Manager after 1 day.</p>
          <p className="mt-2">Calibration due-soon notifies the equipment owner 7 days prior.</p>
          <p className="mt-2">Supplier response notifies Supply Chain and Quality Engineer.</p>
        </Card>
      </div>
    );
  }

  if (module === "audit-trail") {
    return (
      <div>
        <PageHeader title="Audit Trail" subtitle="Created, edited, submitted, approved, voided — with user and values" />
        <DataTable
          rows={store.auditLogs}
          columns={[
            { key: "createdAt", header: "Date/Time" },
            { key: "action", header: "Action" },
            { key: "module", header: "Module" },
            { key: "recordRef", header: "Record" },
            { key: "newValue", header: "New value" },
          ]}
          searchKeys={["action", "module", "recordRef"]}
        />
        {user.role === "Admin" && can(user.role, "admin", "edit") ? <ResetDemoButton /> : null}
      </div>
    );
  }

  return <p>Unknown administration module.</p>;
}
