import { z } from "zod";

export const DocumentAnalysisSchema = z.object({
  summary: z.string(),
  keyFacts: z.array(z.string()),
  potentialRisks: z.array(z.string()),
  potentialNonconformities: z.array(z.string()),
  suggestedActions: z.array(z.string()),
  dates: z.array(z.string()),
  referencedEntities: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
    }),
  ),
  confidenceNotes: z.array(z.string()),
});

export type DocumentAnalysisPayload = z.infer<typeof DocumentAnalysisSchema>;

export function parseDocumentAnalysisJson(raw: string): DocumentAnalysisPayload {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("AI output did not contain JSON");
  }
  const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
  return DocumentAnalysisSchema.parse(parsed);
}

export function mockDocumentAnalysis(text: string): DocumentAnalysisPayload {
  const dates = text.match(/\b20\d{2}-\d{2}-\d{2}\b/g) ?? [];
  const refs = [
    ...(text.match(/\b(?:NCR|CAPA|SNCR|ECN|PO)-20\d{2}-\d{4}\b/g) ?? []),
    ...(text.match(/\bSN-[A-Z0-9]+-20\d{2}-\d{4}\b/g) ?? []),
    ...(text.match(/\bCAL-\d{4}\b/g) ?? []),
  ];
  const leak = /leak|porosity|nonconform/i.test(text);
  return {
    summary: leak
      ? "Quality report describes a leakage / porosity issue that may require containment and supplier follow-up."
      : text.slice(0, 280) || "No extractable document text was available for analysis.",
    keyFacts: [
      text ? "Extracted text is stored separately from the original file." : "No extractable text was found.",
      refs.length ? `Detected identifiers: ${refs.slice(0, 6).join(", ")}` : "No controlled-record identifiers were detected.",
    ],
    potentialRisks: leak
      ? ["Repeat leakage if remaining stock is consumed without sort."]
      : ["Insufficient extracted text to confirm a process risk."],
    potentialNonconformities: leak
      ? ["Possible nonconformity against process control / incoming inspection requirements."]
      : [],
    suggestedActions: leak
      ? ["Create an NCR draft for human review.", "Hold suspect material until quality confirmation."]
      : ["Review the original file and add notes if the extraction is incomplete."],
    dates: [...new Set(dates)],
    referencedEntities: [...new Set(refs)].map((value) => ({
      type: value.startsWith("NCR")
        ? "NCR"
        : value.startsWith("CAPA")
          ? "CAPA"
          : value.startsWith("SN-")
            ? "Serial Number"
            : value.startsWith("PO-")
              ? "Production Order"
              : value.startsWith("CAL")
                ? "Equipment"
                : "Reference",
      value,
    })),
    confidenceNotes: [
      "Deterministic demo analysis. Human review is required before any controlled action.",
    ],
  };
}
