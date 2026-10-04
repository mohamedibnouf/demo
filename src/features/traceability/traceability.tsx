import Link from "next/link";
import { getStore } from "@/server/data/store";

export function Traceability({ sourceEventId }: { sourceEventId: string }) {
  const store = getStore();
  const event = store.qualityEvents.find((e) => e.sourceEventId === sourceEventId);
  const links = [
    ...store.inspections
      .filter((r) => r.sourceEventId === sourceEventId)
      .map((r) => ({
        label: `Inspection ${r.number}`,
        href: `/quality/${r.kind === "Incoming" ? "incoming-inspection" : r.kind === "In-Process" ? "in-process-inspection" : r.kind === "Final" ? "final-inspection" : "production-inspection"}/${r.id}`,
      })),
    ...store.productionConstraints
      .filter((r) => r.sourceEventId === sourceEventId)
      .map((r) => ({ label: `PC ${r.number}`, href: `/performance/production-constraints/${r.id}` })),
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
  const order = store.productionOrders.find((o) => o.id === unit?.orderId);

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
            <Link href={`/trace/serial/${encodeURIComponent(unit.serialNumber)}`} className="text-samco hover:underline">
              Serial {unit.serialNumber}
            </Link>{" "}
            · {model?.code}
            {order ? (
              <>
                {" "}
                ·{" "}
                <Link href={`/trace/order/${order.id}`} className="text-samco hover:underline">
                  {order.number}
                </Link>
              </>
            ) : null}
          </li>
        ) : null}
        {material ? (
          <li className="mb-3">
            <Link href={`/trace/material/${material.id}`} className="text-samco hover:underline">
              Material {material.partNumber}
            </Link>
            {supplier ? (
              <>
                {" "}
                ·{" "}
                <Link href={`/trace/supplier/${supplier.id}`} className="text-samco hover:underline">
                  {supplier.name}
                </Link>
              </>
            ) : null}
          </li>
        ) : null}
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
