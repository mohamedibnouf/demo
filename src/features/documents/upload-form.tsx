"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { createDocumentStub } from "@/server/create-actions";

export function DocumentUploadForm() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Card className="border-dashed p-6 text-center">
      <p className="text-sm font-medium">Demo document intake</p>
      <p className="mt-1 text-xs text-muted">PDF, DOCX, XLSX, CSV, images. Files stay in the local demo store.</p>
      <form
        className="mt-3 flex flex-wrap items-center justify-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            try {
              await createDocumentStub(String(fd.get("name") || "demo-upload.pdf"));
              toast.success("Document recorded in the demo store");
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Upload failed");
            }
          });
        }}
      >
        <input
          name="name"
          required
          placeholder="ALPHA-8D-229.pdf"
          className="rounded border border-line px-3 py-1.5 text-sm"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record upload"}
        </Button>
      </form>
    </Card>
  );
}
