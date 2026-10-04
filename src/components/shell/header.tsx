"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";
import { logoutAction } from "@/server/auth/actions";
import { markNotificationRead } from "@/server/workflow-actions";
import type { NotificationItem, SessionUser } from "@/types";
import { useState, useTransition } from "react";

export function Header({
  user,
  unread,
  demoMode,
  notifications,
}: {
  user: SessionUser;
  unread: number;
  demoMode: boolean;
  notifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [lang, setLang] = useState(user.locale);
  const [, start] = useTransition();
  const router = useRouter();

  function switchLang(next: "en" | "ar") {
    setLang(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:px-6">
      <div className="pl-10 lg:pl-0">
        <p className="text-sm font-semibold text-navy">Saudi Airconditioning Mfg. Co. Ltd. | Carrier</p>
      </div>
      <div className="flex items-center gap-3">
        {demoMode ? (
          <span className="hidden rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-warning sm:inline">
            Demo Environment
          </span>
        ) : null}
        <form
          className="hidden md:block"
          action={(fd) => {
            const q = String(fd.get("q") ?? "");
            if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            name="q"
            placeholder="Search NCR, serial, CAPA, order…"
            className="w-64 rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </form>
        <div className="relative">
          <button
            type="button"
            className="relative rounded-md p-2 hover:bg-ice"
            aria-label="Notifications"
            onClick={() => setBellOpen((v) => !v)}
          >
            <Bell size={18} />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 rounded-full bg-danger px-1 text-[10px] text-white">{unread}</span>
            ) : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 z-30 mt-1 w-80 rounded-md border border-line bg-white p-2 shadow-lg">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase text-muted">Notifications</p>
                <Link href="/notifications" className="text-xs text-samco" onClick={() => setBellOpen(false)}>
                  View All
                </Link>
              </div>
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {notifications.length ? (
                  notifications.map((n) => (
                    <li key={n.id} className="rounded border border-line p-2">
                      <Link
                        href={n.href}
                        className="block text-sm font-medium hover:text-samco"
                        onClick={() => {
                          if (!n.read) start(() => markNotificationRead(n.id));
                          setBellOpen(false);
                        }}
                      >
                        {n.event}
                      </Link>
                      <p className="text-xs text-muted">{n.message}</p>
                      {!n.read ? (
                        <button
                          type="button"
                          className="mt-1 text-xs text-samco"
                          onClick={() => start(async () => { await markNotificationRead(n.id); router.refresh(); })}
                        >
                          Mark as read
                        </button>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted">Read</p>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="px-2 py-4 text-sm text-muted">No notifications for this user.</li>
                )}
              </ul>
            </div>
          ) : null}
        </div>
        <select
          value={lang}
          onChange={(e) => switchLang(e.target.value as "en" | "ar")}
          className="rounded-md border border-line bg-white px-2 py-1 text-xs"
          aria-label="Language"
        >
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>
        <div className="relative">
          <button type="button" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-ice" onClick={() => setOpen((v) => !v)}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-samco text-xs font-semibold text-white">
              {user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            <span className="hidden text-left text-xs sm:block">
              <span className="block font-semibold text-ink">{user.fullName}</span>
              <span className="text-muted">{user.role}</span>
            </span>
            <ChevronDown size={14} />
          </button>
          {open ? (
            <div className="absolute right-0 z-30 mt-1 w-48 rounded-md border border-line bg-white py-1 shadow-lg">
              <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-ice">
                Profile
              </Link>
              <Link href="/demo-guide" className="block px-3 py-2 text-sm hover:bg-ice">
                Demo guide
              </Link>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-ice"
                onClick={() => start(() => logoutAction())}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
