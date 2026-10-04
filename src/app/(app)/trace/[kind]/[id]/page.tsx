import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/server/data/store";
import { Card, PageHeader } from "@/components/ui";
import { Traceability } from "@/features/traceability/traceability";

export default async function TracePage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const decoded = decodeURIComponent(id);
  const store = getStore();

  if (kind === "serial") {
    const unit = store.productionUnits.find((u) => u.serialNumber === decoded || u.id === decoded);
    if (!unit) notFound();
    const order = store.productionOrders.find((o) => o.id === unit.orderId);
    const model = store.models.find((m) => m.id === unit.modelId);
    const event = store.qualityEvents.find((e) => e.serialNumber === unit.serialNumber);
    const complaint = store.complaints.find((c) => c.serialNumber === unit.serialNumber);
    return (
      <div className="space-y-4">
        <PageHeader title={unit.serialNumber} subtitle={`${model?.code ?? "Model"} · ${order?.number ?? unit.orderId}`} />
        <Card className="p-4 text-sm">
          <p>Produced {unit.producedAt.slice(0, 10)} on line {unit.lineId}.</p>
          {order ? (
            <p className="mt-2">
              Production order:{" "}
              <Link href={`/trace/order/${order.id}`} className="text-samco hover:underline">
                {order.number}
              </Link>
            </p>
          ) : null}
          {complaint ? (
            <p className="mt-2">
              Customer complaint:{" "}
              <Link href={`/quality/customer-complaints/${complaint.id}`} className="text-samco hover:underline">
                {complaint.number}
              </Link>
            </p>
          ) : null}
        </Card>
        {event ? <Traceability sourceEventId={event.sourceEventId} /> : <p className="text-sm text-muted">No quality event is linked to this serial.</p>}
      </div>
    );
  }

  if (kind === "order") {
    const order = store.productionOrders.find((o) => o.id === decoded || o.number === decoded);
    if (!order) notFound();
    const units = store.productionUnits.filter((u) => u.orderId === order.id);
    const model = store.models.find((m) => m.id === order.modelId);
    const ecn = store.ecns.find((e) => e.firstOrderId === order.id || e.modelId === order.modelId);
    return (
      <div className="space-y-4">
        <PageHeader title={order.number} subtitle={`${model?.code ?? order.modelId} · ${order.confirmed ? "Confirmed" : "Open"}`} />
        <Card className="p-4 text-sm">
          <p>
            Planned qty {order.plannedQty}. Window {order.startDate} → {order.endDate}.
          </p>
          {ecn ? (
            <p className="mt-2">
              Related ECN:{" "}
              <Link href={`/quality/ecn/${ecn.id}`} className="text-samco hover:underline">
                {ecn.number}
              </Link>
            </p>
          ) : null}
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold">Serials on this order</h2>
          <ul className="space-y-1 text-sm">
            {units.map((u) => (
              <li key={u.id}>
                <Link href={`/trace/serial/${encodeURIComponent(u.serialNumber)}`} className="text-samco hover:underline">
                  {u.serialNumber}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  if (kind === "supplier") {
    const supplier = store.suppliers.find((s) => s.id === decoded || s.code === decoded);
    if (!supplier) notFound();
    const sncrs = store.supplierNcrs.filter((n) => n.supplierId === supplier.id);
    const materials = store.materials.filter((m) => store.receivingRecords.some((r) => r.supplierId === supplier.id && r.materialId === m.id) || sncrs.some((n) => n.materialId === m.id));
    return (
      <div className="space-y-4">
        <PageHeader title={supplier.name} subtitle={`${supplier.code} · ${supplier.category}`} />
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold">Supplier NCRs</h2>
          <ul className="space-y-1 text-sm">
            {sncrs.map((n) => (
              <li key={n.id}>
                <Link href={`/quality/supplier-ncr/${n.id}`} className="text-samco hover:underline">
                  {n.number}
                </Link>
              </li>
            ))}
            {!sncrs.length ? <li className="text-muted">No supplier NCRs.</li> : null}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold">Materials</h2>
          <ul className="space-y-1 text-sm">
            {materials.slice(0, 12).map((m) => (
              <li key={m.id}>
                <Link href={`/trace/material/${m.id}`} className="text-samco hover:underline">
                  {m.partNumber}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  if (kind === "material") {
    const material = store.materials.find((m) => m.id === decoded || m.partNumber === decoded);
    if (!material) notFound();
    const receiving = store.receivingRecords.filter((r) => r.materialId === material.id);
    const supplierIds = new Set(receiving.map((r) => r.supplierId));
    return (
      <div className="space-y-4">
        <PageHeader title={material.partNumber} subtitle={material.description ?? "Material"} />
        <Card className="p-4 text-sm">
          <p>Receiving lots: {receiving.length}.</p>
          <ul className="mt-2 space-y-1">
            {[...supplierIds].map((sid) => {
              const supplier = store.suppliers.find((s) => s.id === sid);
              return supplier ? (
                <li key={sid}>
                  <Link href={`/trace/supplier/${supplier.id}`} className="text-samco hover:underline">
                    {supplier.name}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </Card>
      </div>
    );
  }

  notFound();
}
