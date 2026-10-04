import { requireUser } from "@/server/auth/session";
import { Card, PageHeader } from "@/components/ui";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div>
      <PageHeader title="Profile" subtitle="Signed-in demo identity. Password is shared and documented." />
      <Card className="max-w-xl p-4 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted">Name</dt>
            <dd className="font-medium">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted">Role</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted">Title</dt>
            <dd className="font-medium">{user.title}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">Role changes are Admin-only. This page does not grant administration access.</p>
      </Card>
    </div>
  );
}
