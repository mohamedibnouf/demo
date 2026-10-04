"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { createProductionInspection } from "@/server/create-actions";

export function CreateInspectionForm({
  serials,
  materials,
  suppliers,
}: {
  serials: string[];
  materials: { id: string; partNumber: string }[];
  suppliers: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [classification, setClassification] = useState<"Process Defect" | "Component Defect">("Component Defect");

  return (
    <Card className="mb-4 p-4">
      <h2 className="text-sm font-semibold">New production inspection</h2>
      <form
        className="mt-3 grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            try {
              const id = await createProductionInspection({
                serialNumber: String(fd.get("serialNumber")),
                defectDescription: String(fd.get("defectDescription")),
                classification,
                materialId: String(fd.get("materialId") || "") || undefined,
                supplierId: String(fd.get("supplierId") || "") || undefined,
              });
              toast.success("Inspection draft saved");
              router.push(`/quality/production-inspection/${id}`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed");
            }
          });
        }}
      >
        <label className="text-sm">
          Serial Number
          <select name="serialNumber" className="mt-1 w-full rounded border border-line px-2 py-1.5" required>
            {serials.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Classification
          <select
            className="mt-1 w-full rounded border border-line px-2 py-1.5"
            value={classification}
            onChange={(e) => setClassification(e.target.value as typeof classification)}
          >
            <option>Process Defect</option>
            <option>Component Defect</option>
          </select>
        </label>
        {classification === "Component Defect" ? (
          <>
            <label className="text-sm">
              Material PN
              <select name="materialId" required className="mt-1 w-full rounded border border-line px-2 py-1.5">
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.partNumber}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Supplier
              <select name="supplierId" required className="mt-1 w-full rounded border border-line px-2 py-1.5">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <label className="text-sm md:col-span-2">
          Defect description
          <input name="defectDescription" required className="mt-1 w-full rounded border border-line px-2 py-1.5" />
        </label>
        <Button type="submit" disabled={pending}>
          Save Draft
        </Button>
      </form>
    </Card>
  );
}
