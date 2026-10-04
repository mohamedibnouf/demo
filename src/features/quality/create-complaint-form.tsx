"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { createComplaintDraft } from "@/server/workflow-actions";

export function CreateComplaintForm({
  serials,
  models,
}: {
  serials: string[];
  models: { id: string; code: string }[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Card className="mb-4 p-4">
      <h2 className="text-sm font-semibold">Submit complaint</h2>
      <form
        className="mt-3 grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            try {
              const id = await createComplaintDraft({
                modelId: String(fd.get("modelId")),
                serialNumber: String(fd.get("serialNumber")),
                type: String(fd.get("type")),
                description: String(fd.get("description")),
                quantity: Number(fd.get("quantity") || 1),
              });
              toast.success("Complaint submitted");
              router.push(`/quality/customer-complaints/${id}`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed");
            }
          });
        }}
      >
        <label className="text-sm">
          Serial Number
          <select name="serialNumber" className="mt-1 w-full rounded border border-line px-2 py-1.5">
            {serials.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Model
          <select name="modelId" className="mt-1 w-full rounded border border-line px-2 py-1.5">
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Complaint type
          <select name="type" className="mt-1 w-full rounded border border-line px-2 py-1.5">
            {["Performance", "Appearance", "Noise", "Leakage", "Electrical", "Mechanical", "Other"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Quantity
          <input name="quantity" type="number" min={1} defaultValue={1} className="mt-1 w-full rounded border border-line px-2 py-1.5" />
        </label>
        <label className="text-sm md:col-span-2">
          Description
          <input name="description" required className="mt-1 w-full rounded border border-line px-2 py-1.5" />
        </label>
        <Button type="submit" disabled={pending}>
          Submit
        </Button>
      </form>
    </Card>
  );
}
