import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { readStoredFile } from "@/server/documents/service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { id } = await context.params;
    const { doc, bytes } = await readStoredFile(user, id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.originalFilename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    const status = message === "Not authorized" ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
