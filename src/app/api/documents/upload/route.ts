import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { ingestUploadedFile } from "@/server/documents/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }
    const moduleHint = String(form.get("module") || "documents");
    const result = await ingestUploadedFile(user, file, moduleHint);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message === "Not authorized" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
