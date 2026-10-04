"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { createDraftFromAnalysis } from "@/server/workflow-actions";

export function DocumentActions({ title }: { title: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  function make(kind: "task" | "risk" | "ncr" | "capa", label: string) {
    start(async () => {
      try {
        const res = await createDraftFromAnalysis(kind, title);
        toast.success(`${label} created as draft`);
        router.push(res.href);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed");
      }
    });
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button disabled={pending} variant="secondary" onClick={() => make("task", "Task")}>
        Create Task from Finding
      </Button>
      <Button disabled={pending} variant="secondary" onClick={() => make("risk", "Risk")}>
        Create Risk
      </Button>
      <Button disabled={pending} variant="secondary" onClick={() => make("ncr", "NCR draft")}>
        Create NCR Draft
      </Button>
      <Button disabled={pending} variant="secondary" onClick={() => make("capa", "CAPA draft")}>
        Create CAPA Draft
      </Button>
    </div>
  );
}
