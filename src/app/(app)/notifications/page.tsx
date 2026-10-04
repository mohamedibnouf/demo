import { requireUser } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";
import { MarkReadButton } from "@/features/records/row-actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = getStore().notifications.filter((n) => n.recipientId === user.id);
  return (
    <div>
      <PageHeader title="Notification Center" subtitle="In-app events, unread state, and deep links" />
      <DataTable
        rows={rows.map((n) => ({ ...n, state: n.read ? "Read" : "Unread", _href: n.href }))}
        columns={[
          { key: "event", header: "Event", hrefField: "href" },
          { key: "recordRef", header: "Record" },
          { key: "message", header: "Message" },
          { key: "createdAt", header: "Time" },
          { key: "state", header: "Status" },
        ]}
        searchKeys={["event", "recordRef", "message"]}
      />
      <div className="mt-4 space-y-2">
        {rows.map((n) => (
          <div key={n.id} className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm">
            <span>{n.event} · {n.recordRef}</span>
            <MarkReadButton id={n.id} read={n.read} />
          </div>
        ))}
      </div>
    </div>
  );
}
