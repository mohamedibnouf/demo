"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/navigation";
import { can } from "@/lib/engines/rbac";
import type { RoleName } from "@/types";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: RoleName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">SAMCO | Carrier</p>
        <p className="mt-1 text-sm font-semibold">IMS / QMS Platform</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((section) => {
          const items = section.items.filter((item) => can(role, item.module, "view"));
          if (!items.length) return null;
          return (
            <div key={section.title ?? items[0]!.href} className="mb-4">
              {section.title ? (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              ) : null}
              {items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "mb-0.5 block rounded-md px-2.5 py-1.5 text-[13px]",
                      active ? "bg-samco text-white" : "text-slate-200 hover:bg-navy-700",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 rounded-md bg-navy p-2 text-white lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">
            <button type="button" className="absolute right-3 top-3 text-white" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
