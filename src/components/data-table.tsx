"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge, EmptyState, statusTone } from "./ui";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  hrefField?: keyof T | string;
  link?: boolean;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchKeys = [],
  pageSize = 12,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const hasHref = rows.some((row) => Boolean((row as { _href?: string })._href));
  const statuses = useMemo(() => {
    const values = rows
      .map((row) => String((row as { status?: string }).status ?? ""))
      .filter(Boolean);
    return Array.from(new Set(values));
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let next = rows;
    if (status !== "all") {
      next = next.filter((row) => String((row as { status?: string }).status ?? "") === status);
    }
    if (query) {
      next = next.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(query)),
      );
    }
    if (sort) {
      next = [...next].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sort] ?? "");
        const bv = String((b as Record<string, unknown>)[sort] ?? "");
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return next;
  }, [rows, q, status, searchKeys, sort, dir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (!rows.length) {
    return <EmptyState title="No records yet" hint="Create a record or reset demo data from Admin." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search this table"
          className="w-full max-w-sm rounded-md border border-line px-3 py-1.5 text-sm"
        />
        {statuses.length ? (
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-line px-2 py-1.5 text-sm"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {statuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          className="text-xs text-samco hover:underline"
          onClick={() => {
            setQ("");
            setStatus("all");
            setPage(1);
          }}
        >
          Clear filters
        </button>
        <p className="text-xs text-muted">{filtered.length} records</p>
      </div>
      <div className="overflow-x-auto">
        <table className="enterprise-table w-full min-w-[720px] text-left text-sm">
          <thead className="bg-ice">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)}>
                  <button
                    type="button"
                    className="uppercase"
                    onClick={() => {
                      if (sort === col.key) setDir(dir === "asc" ? "desc" : "asc");
                      else setSort(String(col.key));
                    }}
                  >
                    {col.header}
                  </button>
                </th>
              ))}
              {hasHref ? <th>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {!slice.length ? (
              <tr>
                <td colSpan={columns.length + (hasHref ? 1 : 0)} className="px-3 py-8 text-center text-sm text-muted">
                  No records match the current filters.
                </td>
              </tr>
            ) : null}
            {slice.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => {
                  const raw = (row as Record<string, unknown>)[String(col.key)];
                  const content = col.render
                    ? col.render(row)
                    : typeof raw === "string" && ["status", "severity", "priority", "achievement", "classification"].includes(String(col.key))
                      ? <Badge tone={statusTone(String(raw))}>{String(raw)}</Badge>
                      : String(raw ?? "—");
                  const href = col.hrefField
                    ? String((row as Record<string, unknown>)[String(col.hrefField)] ?? "")
                    : col.link
                      ? String((row as { _href?: string })._href ?? "")
                      : undefined;
                  return (
                    <td key={String(col.key)}>
                      {href ? (
                        <Link href={href} className="font-medium text-samco hover:underline">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
                {hasHref ? (
                  <td>
                    {(row as { _href?: string })._href ? (
                      <Link href={String((row as { _href?: string })._href)} className="text-samco hover:underline">
                        View
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line px-3 py-2 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-line px-2 py-1 disabled:opacity-40">
          Prev
        </button>
        <span className="text-muted">
          {page} / {pages}
        </span>
        <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded border border-line px-2 py-1 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}
