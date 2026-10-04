"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { createDocumentDraftAction } from "@/server/documents/actions";

export function DocumentActions({ title, documentId }: { title: string; documentId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  function make(kind: "task" | "risk" | "ncr" | "capa", label: string) {
    start(async () => {
      try {
        const res = await createDocumentDraftAction(documentId, kind, title);
        toast.success(`${label} created as draft — human review required`);
        router.push(res.href);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed");
      }
    });
  }
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs text-warning">AI-generated recommendation — human review required.</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} variant="secondary" onClick={() => make("task", "Task")}>
          Create Task Draft
        </Button>
        <Button disabled={pending} variant="secondary" onClick={() => make("risk", "Risk")}>
          Create Risk Draft
        </Button>
        <Button disabled={pending} variant="secondary" onClick={() => make("ncr", "NCR draft")}>
          Create NCR Draft
        </Button>
        <Button disabled={pending} variant="secondary" onClick={() => make("capa", "CAPA draft")}>
          Create CAPA Draft
        </Button>
      </div>
    </div>
  );
}
