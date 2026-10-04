"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RecordTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "overview");
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-t px-3 py-2 text-sm",
              active === tab.id ? "bg-white font-semibold text-samco" : "text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} hidden={tab.id !== active}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
