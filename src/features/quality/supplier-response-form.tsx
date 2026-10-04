"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { reviewSupplierResponse, submitSupplierResponse } from "@/server/workflow-actions";

export function SupplierResponseForm({ id, canSubmit, canReview }: { id: string; canSubmit: boolean; canReview: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-2">
      {canSubmit ? (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Supplier response</h2>
          <form
            className="mt-2 space-y-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                try {
                  await submitSupplierResponse(id, {
                    rootCause: String(fd.get("rootCause")),
                    correctiveAction: String(fd.get("correctiveAction")),
                    preventiveAction: String(fd.get("preventiveAction")),
                    completionDate: String(fd.get("completionDate")),
                    evidence: String(fd.get("evidence")),
                  });
                  toast.success("Response submitted");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed");
                }
              });
            }}
          >
            <input name="rootCause" placeholder="Root cause" required className="w-full rounded border border-line px-2 py-1" />
            <input name="correctiveAction" placeholder="Corrective action" required className="w-full rounded border border-line px-2 py-1" />
            <input name="preventiveAction" placeholder="Preventive action" required className="w-full rounded border border-line px-2 py-1" />
            <input name="completionDate" type="date" required className="w-full rounded border border-line px-2 py-1" />
            <input name="evidence" placeholder="Evidence file name" className="w-full rounded border border-line px-2 py-1" />
            <Button type="submit" disabled={pending}>
              Supplier Submit
            </Button>
          </form>
        </Card>
      ) : null}
      {canReview ? (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Quality review</h2>
          <div className="mt-2 flex gap-2">
            <Button disabled={pending} onClick={() => start(() => reviewSupplierResponse(id, "Accepted", "Accepted for verification"))}>
              Accept
            </Button>
            <Button variant="danger" disabled={pending} onClick={() => start(() => reviewSupplierResponse(id, "Rejected", "Return for revision"))}>
              Reject
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
