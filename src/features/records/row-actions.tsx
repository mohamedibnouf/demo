"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { completeTask, markNotificationRead } from "@/server/workflow-actions";

export function CompleteTaskButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      disabled={pending || disabled}
      title={disabled ? "Already completed" : "Mark this task complete"}
      onClick={() =>
        start(async () => {
          try {
            await completeTask(id);
            toast.success("Task completed");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed");
          }
        })
      }
    >
      Complete
    </Button>
  );
}

export function MarkReadButton({ id, read }: { id: string; read: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      disabled={pending || read}
      title={read ? "Already read" : "Mark this notification as read"}
      onClick={() =>
        start(async () => {
          try {
            await markNotificationRead(id);
            toast.success("Marked as read");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed");
          }
        })
      }
    >
      {read ? "Read" : "Mark read"}
    </Button>
  );
}
