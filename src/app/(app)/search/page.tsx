import Link from "next/link";
import { getStore } from "@/server/data/store";
import { hrefForRef } from "@/lib/record-hrefs";
import { Card, PageHeader } from "@/components/ui";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const store = getStore();
  const groups = [
    ["NCR", store.ncrs.filter((r) => r.number.toLowerCase().includes(query) || r.defect.toLowerCase().includes(query)).map((r) => ({ href: hrefForRef(store, r.id) ?? `/quality/production-ncr/${r.id}`, label: r.number }))],
    ["CAPA", store.capas.filter((r) => r.number.toLowerCase().includes(query) || r.problem.toLowerCase().includes(query)).map((r) => ({ href: `/quality/capa/${r.id}`, label: r.number }))],
    ["Complaints", store.complaints.filter((r) => r.number.toLowerCase().includes(query) || r.serialNumber.toLowerCase().includes(query)).map((r) => ({ href: `/quality/customer-complaints/${r.id}`, label: r.number }))],
    ["Serials", store.productionUnits.filter((r) => r.serialNumber.toLowerCase().includes(query)).map((r) => ({ href: `/trace/serial/${encodeURIComponent(r.serialNumber)}`, label: r.serialNumber }))],
    ["Orders", store.productionOrders.filter((r) => r.number.toLowerCase().includes(query)).map((r) => ({ href: `/trace/order/${r.id}`, label: r.number }))],
    ["Suppliers", store.suppliers.filter((r) => r.name.toLowerCase().includes(query) || r.code.toLowerCase().includes(query)).map((r) => ({ href: `/trace/supplier/${r.id}`, label: r.name }))],
    ["Materials", store.materials.filter((r) => r.partNumber.toLowerCase().includes(query)).map((r) => ({ href: `/trace/material/${r.id}`, label: r.partNumber }))],
    ["ECN", store.ecns.filter((r) => r.number.toLowerCase().includes(query)).map((r) => ({ href: `/quality/ecn/${r.id}`, label: r.number }))],
    ["Audits", store.audits.filter((r) => r.number.toLowerCase().includes(query) || r.scope.toLowerCase().includes(query)).map((r) => ({ href: hrefForRef(store, r.id) ?? `/ims/internal-audit/${r.id}`, label: r.number }))],
    ["Equipment", store.equipment.filter((r) => r.equipmentId.toLowerCase().includes(query)).map((r) => ({ href: `/quality/calibration/${r.id}`, label: r.equipmentId }))],
    ["Users", store.profiles.filter((r) => r.fullName.toLowerCase().includes(query) || r.email.toLowerCase().includes(query)).map((r) => ({ href: `/profile`, label: r.fullName }))],
    ["Documents", store.documents.filter((r) => [r.documentNumber, r.name, r.title, r.originalFilename].join(" ").toLowerCase().includes(query)).map((r) => ({ href: `/documents/${r.id}`, label: r.documentNumber }))],
  ] as const;

  return (
    <div>
      <PageHeader title="Global Search" subtitle={query ? `Results for “${q}”` : "Enter a query from the header"} />
      {!query ? <p className="text-sm text-muted">Try NCR-2026-0012, SN-AHU-2026-1842, CAL-0042, Alpha, or Khalid.</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {groups.map(([name, items]) => (
          <Card key={name} className="p-4">
            <h2 className="text-sm font-semibold">{name}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {items.length ? (
                items.slice(0, 8).map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-samco hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-muted">No matches</li>
              )}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
