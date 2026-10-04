import { requireUser } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/ui";
import { markNotificationRead } from "@/server/workflow-actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = getStore().notifications.filter((n) => n.recipientId === user.id);
  return (
    <div>
      <PageHeader title="Notification Center" subtitle="In-app events, unread state, and deep links" />
      <DataTable
        rows={rows.map((n) => ({ ...n, state: n.read ? "Read" : "Unread" }))}
        columns={[
          { key: "event", header: "Event", hrefField: "href" },
          { key: "recordRef", header: "Record" },
          { key: "message", header: "Message" },
          { key: "createdAt", header: "Time" },
          { key: "state", header: "Status" },
        ]}
        searchKeys={["event", "recordRef", "message"]}
      />
      <form
        className="mt-3"
        action={async () => {
          "use server";
          const unread = rows.find((n) => !n.read);
          if (unread) await markNotificationRead(unread.id);
        }}
      >
        <button type="submit" className="text-sm text-samco">
          Mark next unread as read
        </button>
      </form>
    </div>
  );
}
