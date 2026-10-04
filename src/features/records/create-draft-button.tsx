"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { createCatalogDraft, createLogbookDraft } from "@/server/create-actions";

export function CreateDraftButton({ slug, label }: { slug: string; label: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const res = await createCatalogDraft(slug);
            toast.success(`${label} draft created`);
            router.push(res.href);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Create failed");
          }
        })
      }
    >
      {pending ? "Creating…" : `Create ${label}`}
    </Button>
  );
}

export function CreateLogbookButton({ type }: { type: "CPU Coil" | "AHU Coil" | "Paint Shop" }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await createLogbookDraft(type);
            toast.success("Today’s logbook opened");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Create failed");
          }
        })
      }
    >
      {pending ? "Opening…" : "Open today’s logbook"}
    </Button>
  );
}
