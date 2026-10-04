import { NextResponse } from "next/server";
import { getStore } from "@/server/data/store";

export async function GET(_: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params;
  const store = getStore();
  const audit = store.audits.find((a) => a.id === auditId);
  const questions = store.auditQuestions.filter((q) => q.auditId === auditId);
  const body = [
    `SAMCO IMS/QMS Audit Checklist`,
    `Audit: ${audit?.number ?? auditId}`,
    `Scope: ${audit?.scope ?? ""}`,
    "",
    ...questions.map((q, i) => `${i + 1}. [${q.standard} ${q.clause}] ${q.question}\n   Procedure: ${q.procedure}\n   Response:`),
  ].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${audit?.number ?? "checklist"}.txt"`,
    },
  });
}
