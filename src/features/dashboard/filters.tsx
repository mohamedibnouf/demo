import { getStore } from "@/server/data/store";

export function DashboardFilters() {
  const store = getStore();
  return (
    <form className="flex flex-wrap gap-2 rounded-lg border border-line bg-white p-3 text-sm" action="/" method="get">
      <select name="month" className="rounded border border-line px-2 py-1" defaultValue="all">
        <option value="all">All months 2026</option>
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i} value={i + 1}>
            {new Date(2026, i, 1).toLocaleString("en", { month: "long" })}
          </option>
        ))}
      </select>
      <select name="familyId" className="rounded border border-line px-2 py-1" defaultValue="all">
        <option value="all">All families</option>
        {store.modelFamilies.map((f) => (
          <option key={f.id} value={f.id}>
            {f.code}
          </option>
        ))}
      </select>
      <select name="lineId" className="rounded border border-line px-2 py-1" defaultValue="all">
        <option value="all">All lines</option>
        {store.productionLines.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <select name="supplierId" className="rounded border border-line px-2 py-1" defaultValue="all">
        <option value="all">All suppliers</option>
        {store.suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded bg-samco px-3 py-1 text-white">
        Apply filters
      </button>
    </form>
  );
}
