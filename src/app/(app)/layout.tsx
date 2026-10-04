import { redirect } from "next/navigation";
import { readSession } from "@/server/auth/session";
import { getStore } from "@/server/data/store";
import { Sidebar } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await readSession();
  if (!user) redirect("/login");
  const mine = getStore().notifications.filter((n) => n.recipientId === user.id);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} unread={unread} demoMode={isDemoMode()} notifications={mine.slice(0, 8)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
