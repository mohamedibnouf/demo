"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/engines/rbac";
import { requireUser } from "@/server/auth/session";
import type { ImportProfileKey } from "@/types";
import {
  analyzeDocument,
  confirmImport,
  createDraftFromDocument,
  signedDownload,
  updateBatchMapping,
} from "./service";

export async function analyzeDocumentAction(documentId: string) {
  const user = await requireUser();
  const result = await analyzeDocument(user, documentId);
  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return { id: result.id, mode: result.mode, provider: result.provider };
}

export async function confirmImportAction(batchId: string) {
  const user = await requireUser();
  const result = confirmImport(user, batchId);
  revalidatePath("/documents");
  revalidatePath("/admin/excel");
  revalidatePath("/");
  return result;
}

export async function remapImportAction(batchId: string, profile: ImportProfileKey, mapping: Record<string, string>, sheetName?: string) {
  const user = await requireUser();
  updateBatchMapping(user, batchId, profile, mapping, sheetName);
  revalidatePath("/documents");
  revalidatePath("/admin/excel");
}

export async function createDocumentDraftAction(documentId: string, kind: "ncr" | "capa" | "risk" | "task", title: string) {
  const user = await requireUser();
  if (kind === "ncr" && !authorize(user, "production_ncr", "create")) throw new Error("Not authorized");
  if (kind === "capa" && !authorize(user, "capa", "create")) throw new Error("Not authorized");
  if (kind === "risk" && !authorize(user, "risk_register", "create")) throw new Error("Not authorized");
  if (kind === "task" && !authorize(user, "tasks", "edit") && !authorize(user, "documents", "create")) throw new Error("Not authorized");
  const created = await createDraftFromDocument(user, documentId, kind, title);
  revalidatePath("/documents");
  return created;
}

export async function downloadDocumentAction(documentId: string) {
  const user = await requireUser();
  return signedDownload(user, documentId);
}
