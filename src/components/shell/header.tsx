"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";
import { logoutAction } from "@/server/auth/actions";
import type { SessionUser } from "@/types";
import { useState, useTransition } from "react";

export function Header({
  user,
  unread,
  demoMode,
}: {
  user: SessionUser;
  unread: number;
  demoMode: boolean;
}) {
  const [open, setOpen] = useState(false);
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
        <Link href="/notifications" className="relative rounded-md p-2 hover:bg-ice">
          <Bell size={18} />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 rounded-full bg-danger px-1 text-[10px] text-white">{unread}</span>
          ) : null}
        </Link>
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
              <Link href="/admin/users" className="block px-3 py-2 text-sm hover:bg-ice">
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
