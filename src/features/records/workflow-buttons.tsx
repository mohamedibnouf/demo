"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import {
  createCapaFrom,
  createNcrFromInspection,
  startRework,
  transitionRecord,
  voidRecord,
} from "@/server/workflow-actions";
import { nextWorkflowStatus } from "@/lib/engines/workflow";

export function WorkflowButtons({
  id,
  collection,
  moduleKey,
  status,
  path,
  sourceEventId,
  serialNumber,
}: {
  id: string;
  collection: string;
  moduleKey: string;
  status: string;
  path: string;
  sourceEventId: string | null;
  serialNumber: string | null;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const next = nextWorkflowStatus(collection, status);

  function run(label: string, fn: () => Promise<unknown>) {
    start(async () => {
      try {
        await fn();
        toast.success(label);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {status === "Draft" ? (
        <Button
          disabled={pending}
          variant="secondary"
          onClick={() =>
            run("Draft saved", () =>
              transitionRecord({ collection: collection as "ncrs", id, value: "Draft", module: moduleKey, action: "edit", path }),
            )
          }
        >
          Save Draft
        </Button>
      ) : null}
      {next ? (
        <Button
          disabled={pending}
          onClick={() =>
            run(next, () =>
              transitionRecord({
                collection: collection as "ncrs",
                id,
                value: next,
                module: moduleKey,
                action: next === "Closed" || next === "Approved" ? "close" : next === "Submitted" ? "submit" : "edit",
                path,
              }),
            )
          }
        >
          {next === "Submitted" ? "Submit" : `Move to ${next}`}
        </Button>
      ) : null}
      {collection === "inspections" ? (
        <Button
          disabled={pending}
          variant="secondary"
          onClick={() =>
            run("NCR draft created", async () => {
              const ncrId = await createNcrFromInspection(id);
              router.push(`/quality/production-ncr/${ncrId}`);
            })
          }
        >
          Create NCR
        </Button>
      ) : null}
      {["ncrs", "supplierNcrs", "complaints", "auditFindings", "riskRegister", "imsObjectives"].includes(collection) ? (
        <Button
          disabled={pending}
          variant="secondary"
          onClick={() =>
            run("CAPA draft created", async () => {
              const capaId = await createCapaFrom(moduleKey, id, String(id), "Draft CAPA from record", sourceEventId);
              router.push(`/quality/capa/${capaId}`);
            })
          }
        >
          Create CAPA Draft
        </Button>
      ) : null}
      {sourceEventId && serialNumber ? (
        <Button
          disabled={pending}
          variant="secondary"
          onClick={() =>
            run("Rework started", async () => {
              const rw = await startRework(sourceEventId, serialNumber);
              router.push(`/quality/rework/${rw}`);
            })
          }
        >
          Start Rework
        </Button>
      ) : null}
      {["ncrs", "rrrRecords", "deviations", "ecns"].includes(collection) ? (
        <Button
          disabled={pending}
          variant="danger"
          onClick={() => {
            const reason = window.prompt("Void / cancel reason (required)");
            if (!reason) return;
            run("Record voided", () => voidRecord(collection as "ncrs" | "rrrRecords" | "deviations" | "ecns", id, reason, moduleKey, path));
          }}
        >
          Void / Cancel
        </Button>
      ) : null}
    </div>
  );
}
