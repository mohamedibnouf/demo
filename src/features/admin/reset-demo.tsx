"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { resetDemoDataAction } from "@/server/workflow-actions";

export function ResetDemoButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="mt-6">
      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Reset all demo data to the seeded scenario pack?")) return;
          start(async () => {
            await resetDemoDataAction();
            toast.success("Demo data reset");
            router.push("/");
            router.refresh();
          });
        }}
      >
        Reset Demo Data
      </Button>
    </div>
  );
}
