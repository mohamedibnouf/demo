import Link from "next/link";
import { getStore } from "@/server/data/store";

export function Traceability({ sourceEventId }: { sourceEventId: string }) {
  const store = getStore();
  const event = store.qualityEvents.find((e) => e.sourceEventId === sourceEventId);
  const links = [
    ...store.inspections.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `Inspection ${r.number}`, href: `/quality/production-inspection/${r.id}` })),
    ...store.productionConstraints.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `PC ${r.number}`, href: `/performance/production-constraints` })),
    ...store.ncrs.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `NCR ${r.number}`, href: `/quality/production-ncr/${r.id}` })),
    ...store.supplierNcrs.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `SNCR ${r.number}`, href: `/quality/supplier-ncr/${r.id}` })),
    ...store.capas.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `CAPA ${r.number}`, href: `/quality/capa/${r.id}` })),
    ...store.reworks.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `Rework ${r.number}`, href: `/quality/rework/${r.id}` })),
    ...store.rrrRecords.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `RRR ${r.number}`, href: `/quality/rrr/${r.id}` })),
    ...store.complaints.filter((r) => r.sourceEventId === sourceEventId).map((r) => ({ label: `Complaint ${r.number}`, href: `/quality/customer-complaints/${r.id}` })),
  ];

  const unit = store.productionUnits.find((u) => u.serialNumber === event?.serialNumber);
  const model = store.models.find((m) => m.id === (event?.modelId ?? unit?.modelId));
  const supplier = store.suppliers.find((s) => s.id === event?.supplierId);
  const material = store.materials.find((m) => m.id === event?.materialId);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs font-semibold uppercase text-muted">Quality event {sourceEventId}</p>
      <ol className="relative border-l border-line pl-4">
        {event ? (
          <li className="mb-3">
            <p className="font-medium">{event.type}</p>
            <p className="text-xs text-muted">{event.description}</p>
          </li>
        ) : null}
        {unit ? (
          <li className="mb-3">
            Serial {unit.serialNumber} · {model?.code} · {unit.orderId}
          </li>
        ) : null}
        {material ? <li className="mb-3">Material {material.partNumber} {supplier ? `· ${supplier.name}` : ""}</li> : null}
        {links.map((l) => (
          <li key={l.href + l.label} className="mb-2">
            <Link href={l.href} className="text-samco hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">KPI engines count this source_event_id once, regardless of workflow descendants.</p>
    </div>
  );
}
