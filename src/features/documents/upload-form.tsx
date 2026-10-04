"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";

const ACCEPT = ".xlsx,.xls,.csv,.pdf,.docx,.png,.jpg,.jpeg,.webp,.gif";

export function DocumentUploadForm({ defaultModule = "documents" }: { defaultModule?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading" | "processing">("idle");

  function take(next: File | null) {
    setFile(next);
    setProgress(0);
  }

  function upload() {
    if (!file) {
      toast.error("Select a file first");
      return;
    }
    const form = new FormData();
    form.set("file", file);
    form.set("module", defaultModule);
    setPhase("uploading");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/documents/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as { id?: string; error?: string };
        if (xhr.status >= 400 || !json.id) {
          setPhase("idle");
          toast.error(json.error || "Upload failed");
          return;
        }
        setPhase("processing");
        toast.success("File stored. Opening analysis workspace.");
        router.push(`/documents/${json.id}`);
        router.refresh();
      } catch {
        setPhase("idle");
        toast.error("Upload failed");
      }
    };
    xhr.onerror = () => {
      setPhase("idle");
      toast.error("Network or storage failure during upload");
    };
    xhr.send(form);
  }

  return (
    <Card className={`border-dashed p-6 ${drag ? "border-samco bg-skyline/40" : ""}`}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files[0] ?? null);
        }}
        className="text-center"
      >
        <p className="text-sm font-semibold text-navy">Upload a SAMCO file</p>
        <p className="mt-1 text-xs text-muted">
          Drag and drop or browse. Excel, PDF, and DOCX are parsed server-side. Images are stored as evidence only.
        </p>
        <p className="mt-2 text-xs text-muted">Supported: XLSX, XLS, CSV, PDF, DOCX, PNG, JPG, WEBP, GIF · Max 10 MB · Private storage</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            aria-label="Browse files"
            onChange={(e) => take(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            Browse Files
          </Button>
          <Button type="button" disabled={!file || phase !== "idle"} onClick={upload}>
            {phase === "uploading" ? "Uploading…" : phase === "processing" ? "Processing…" : "Upload"}
          </Button>
        </div>
        {file ? (
          <dl className="mx-auto mt-4 grid max-w-lg gap-1 text-left text-sm">
            <div>
              <span className="text-muted">File name: </span>
              {file.name}
            </div>
            <div>
              <span className="text-muted">File type: </span>
              {file.type || file.name.split(".").pop()?.toUpperCase()}
            </div>
            <div>
              <span className="text-muted">File size: </span>
              {file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
            </div>
          </dl>
        ) : null}
        {phase !== "idle" ? (
          <div className="mx-auto mt-4 max-w-lg text-left">
            <div className="h-2 overflow-hidden rounded bg-ice">
              <div className="h-full bg-samco transition-all" style={{ width: `${phase === "processing" ? 100 : progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {phase === "uploading" ? `Upload progress ${progress}%` : "Processing and validating on the server…"}
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
