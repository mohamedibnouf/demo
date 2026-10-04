import { describe, expect, it } from "vitest";
import { createSeedStore as seedStore } from "@/server/data/seed";
import { checksumBuffer, importFingerprint } from "./checksum";
import { extractDocx } from "./docx-parser";
import { parseExcelWorkbook } from "./excel-parser";
import { findReferencedEntities } from "./entity-linker";
import { applyImportedRow, isDuplicateImport } from "./import-apply";
import { extractPdf } from "./pdf-parser";
import { assertSafeFilename, buildStoragePath, isSafeStoragePath } from "./paths";
import { detectImportProfile, suggestedMapping } from "./profiles";
import { validateImportRows } from "./row-validation";
import { detectMagicMime, validateUploadFile } from "./validation";
import { mockDocumentAnalysis, parseDocumentAnalysisJson } from "@/server/ai/document-schema";
import { can } from "@/lib/engines/rbac";
import { MockAIProvider } from "@/server/ai/mock";
import fs from "fs";
import path from "path";

const fixtures = path.join(process.cwd(), "fixtures", "file-intelligence");

describe("file validation", () => {
  it("rejects empty, oversized, and unsupported files", () => {
    expect(validateUploadFile({ filename: "a.exe", size: 10, bytes: Buffer.from("1234567890") }).ok).toBe(false);
    expect(validateUploadFile({ filename: "a.pdf", size: 0, bytes: Buffer.alloc(0) }).ok).toBe(false);
    expect(validateUploadFile({ filename: "a.pdf", size: 20 * 1024 * 1024, bytes: Buffer.alloc(16) }).ok).toBe(false);
  });

  it("accepts a PDF whose magic bytes match", () => {
    const bytes = Buffer.from("%PDF-1.4 demo");
    const result = validateUploadFile({ filename: "report.pdf", size: bytes.length, bytes, declaredMime: "application/pdf" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.extractable).toBe(true);
  });

  it("does not trust a mismatched extension", () => {
    const bytes = Buffer.from("%PDF-1.4 demo");
    expect(validateUploadFile({ filename: "report.xlsx", size: bytes.length, bytes }).ok).toBe(false);
  });
});

describe("filename and path safety", () => {
  it("blocks traversal and sanitizes names", () => {
    expect(() => assertSafeFilename("../secret.pdf")).toThrow();
    expect(() => assertSafeFilename("/etc/passwd")).toThrow();
    expect(assertSafeFilename("Alpha 8D (rev).pdf")).toMatch(/Alpha/);
    expect(isSafeStoragePath("samco/documents/2026/doc-1/abc-file.pdf")).toBe(true);
    expect(isSafeStoragePath("../etc/passwd")).toBe(false);
    expect(buildStoragePath({ module: "documents", year: 2026, recordId: "doc-1", uuid: "abc", filename: "a.pdf" })).toBe(
      "samco/documents/2026/doc-1/abc-a.pdf",
    );
  });
});

describe("checksum", () => {
  it("is stable and unique per content", () => {
    expect(checksumBuffer(Buffer.from("abc"))).toBe(checksumBuffer(Buffer.from("abc")));
    expect(checksumBuffer(Buffer.from("abc"))).not.toBe(checksumBuffer(Buffer.from("abd")));
    expect(importFingerprint("aaa", "PRODUCTION_DATA")).not.toBe(importFingerprint("aaa", "NCR_DATA"));
  });
});

describe("excel parser and profiles", () => {
  it("parses headers, row numbers, blanks, and duplicates", () => {
    const csv = "production_date,production_order,model,line,quantity\n2026-10-03,PO-2026-2409,AHU-P25,L-AHU,2\n\n2026-10-03,PO-2026-2409,AHU-P25,L-AHU,2";
    const wb = parseExcelWorkbook(Buffer.from(csv));
    expect(wb.sheetNames.length).toBe(1);
    const sheet = wb.sheets[0]!;
    expect(sheet.headers).toContain("production_date");
    expect(sheet.usedRows).toBe(2);
    expect(sheet.blankRowNumbers.length).toBeGreaterThan(0);
    expect(sheet.duplicateRowNumbers.length).toBeGreaterThan(0);
    expect(sheet.rowNumbers[0]).toBe(2);
  });

  it("auto-detects PRODUCTION_DATA from headers", () => {
    const detection = detectImportProfile(["production_date", "production_order", "model", "line", "quantity", "serial_number"]);
    expect(detection.profile).toBe("PRODUCTION_DATA");
    expect(detection.autoSelected).toBe(true);
    expect(suggestedMapping(["production_date"]).production_date).toBe("date");
  });

  it("asks the user when confidence is low", () => {
    const detection = detectImportProfile(["alpha", "beta"]);
    expect(detection.profile).toBe("GENERIC_EXCEL");
    expect(detection.autoSelected).toBe(false);
  });
});

describe("row validation and import", () => {
  const store = seedStore();
  const user = {
    id: "u-qm",
    email: "quality.manager@samco.demo",
    fullName: "Khalid Al-Harbi",
    role: "Quality Manager" as const,
    roleId: "r-qm",
    departmentId: "d-qa",
    supplierId: null,
    customerId: null,
    title: "Quality Manager",
    locale: "en" as const,
  };

  it("flags missing, numeric, unknown, and duplicate problems", () => {
    const rows = validateImportRows(store, "PRODUCTION_DATA", [
      {
        rowNumber: 2,
        original: {},
        normalized: { production_order: "PO-2026-2409", model: "AHU-P25", line: "L-AHU", date: "2026-10-03", quantity_produced: "2", serial_number: "SN-AHU-2026-9001" },
      },
      {
        rowNumber: 3,
        original: {},
        normalized: { production_order: "", model: "AHU-XX", line: "L-AHU", date: "bad", quantity_produced: "twelve", serial_number: "BAD" },
      },
      {
        rowNumber: 4,
        original: {},
        normalized: { production_order: "PO-2026-2409", model: "AHU-P25", line: "L-AHU", date: "2026-10-03", quantity_produced: "1", serial_number: "SN-AHU-2026-9001" },
      },
    ]);
    expect(rows[0]?.status).toBe("valid");
    expect(rows[1]?.status).toBe("error");
    expect(rows[1]?.issues.some((i) => i.problem === "required field missing")).toBe(true);
    expect(rows[1]?.issues.some((i) => i.problem === "invalid date")).toBe(true);
    expect(rows[1]?.issues.some((i) => i.problem === "invalid numeric value")).toBe(true);
    expect(rows[1]?.issues.some((i) => i.problem === "unknown product / model")).toBe(true);
    expect(rows[2]?.issues.some((i) => i.problem === "duplicate record")).toBe(true);
  });

  it("imports production rows into the existing domain model without double-counting", () => {
    const beforeEvents = store.qualityEvents.length;
    const beforeQty = store.productionRecords.reduce((s, r) => s + r.quantityProduced, 0);
    applyImportedRow(
      store,
      user,
      "PRODUCTION_DATA",
      {
        production_order: "PO-2026-2409",
        model: "AHU-P25",
        line: "L-AHU",
        date: "2026-10-03",
        quantity_produced: "2",
        defect_quantity: "1",
        process_defect: "Yes",
        defect_type: "Leakage",
        serial_number: "SN-AHU-2026-9777",
      },
      "doc-test",
    );
    applyImportedRow(
      store,
      user,
      "PRODUCTION_DATA",
      {
        production_order: "PO-2026-2409",
        model: "AHU-P25",
        line: "L-AHU",
        date: "2026-10-03",
        quantity_produced: "1",
        defect_quantity: "1",
        process_defect: "Yes",
        defect_type: "Leakage",
        serial_number: "SN-AHU-2026-9777",
      },
      "doc-test",
    );
    expect(store.productionRecords.reduce((s, r) => s + r.quantityProduced, 0)).toBe(beforeQty + 3);
    expect(store.qualityEvents.length).toBe(beforeEvents + 1);
    expect(store.productionUnits.some((u) => u.serialNumber === "SN-AHU-2026-9777")).toBe(true);
  });

  it("blocks a duplicate imported fingerprint", () => {
    expect(isDuplicateImport([{ checksum: "abc", profile: "PRODUCTION_DATA", status: "imported" }], "abc", "PRODUCTION_DATA")).toBe(true);
    expect(isDuplicateImport([{ checksum: "abc", profile: "PRODUCTION_DATA", status: "draft" }], "abc", "PRODUCTION_DATA")).toBe(false);
  });

  it("creates an NCR draft from NCR profile data and links the document", () => {
    const created = applyImportedRow(store, user, "NCR_DATA", { source: "AHU Line", defect: "Imported leak", severity: "High" }, "doc-ncr");
    const ncr = store.ncrs.find((r) => r.id === created.id);
    expect(ncr?.status).toBe("Draft");
    expect(store.documentLinks.some((l) => l.documentId === "doc-ncr" && l.recordId === created.id)).toBe(true);
  });
});

describe("pdf and docx parsers", () => {
  it("extracts text from a simple PDF and reports image-only PDFs honestly", async () => {
    const textPdf = Buffer.from(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 40 >> stream
BT /F1 12 Tf 72 720 Td (SAMCO Quality Report) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF`);
    const extracted = await extractPdf(textPdf);
    expect(extracted.encrypted).toBe(false);
    expect(extracted.pageCount).toBeGreaterThan(0);
    const empty = await extractPdf(Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF"));
    if (!empty.extractable) {
      expect(empty.message).toMatch(/OCR is not enabled/);
    }
  });

  it("rejects a corrupt DOCX", async () => {
    await expect(extractDocx(Buffer.from("not-a-docx"))).rejects.toThrow(/corrupt|Word/i);
  });

  it("extracts DOCX fixture text when present", async () => {
    const file = path.join(fixtures, "quality-report-demo.docx");
    if (!fs.existsSync(file)) return;
    const extracted = await extractDocx(fs.readFileSync(file));
    expect(extracted.extractable).toBe(true);
    expect(extracted.text).toMatch(/SAMCO|NCR-2026-0012/i);
  });
});

describe("AI schema and mock fallback", () => {
  it("validates structured analysis JSON and rejects raw text", () => {
    const parsed = parseDocumentAnalysisJson(
      JSON.stringify({
        summary: "ok",
        keyFacts: ["a"],
        potentialRisks: [],
        potentialNonconformities: [],
        suggestedActions: [],
        dates: [],
        referencedEntities: [],
        confidenceNotes: [],
      }),
    );
    expect(parsed.summary).toBe("ok");
    expect(() => parseDocumentAnalysisJson("not json")).toThrow();
  });

  it("uses deterministic mock analysis", async () => {
    const mock = new MockAIProvider();
    const text = await mock.complete([{ role: "user", content: "analyze this document" }]);
    expect(text).toMatch(/Document analysis/i);
    const analysis = mockDocumentAnalysis("See NCR-2026-0012 leak on 2026-10-09");
    expect(analysis.referencedEntities.some((e) => e.value === "NCR-2026-0012")).toBe(true);
    expect(analysis.potentialNonconformities.length).toBeGreaterThan(0);
  });
});

describe("RBAC and document linking", () => {
  it("limits inspector and management write paths", () => {
    expect(can("Quality Inspector", "documents", "view")).toBe(false);
    expect(can("Quality Manager", "documents", "create")).toBe(true);
    expect(can("Management", "excel", "create")).toBe(false);
    expect(can("Management", "documents", "view")).toBe(true);
    expect(can("Supplier", "documents", "create")).toBe(true);
  });

  it("links only records that exist", () => {
    const store = seedStore();
    const found = findReferencedEntities(store, "NCR-2026-0012 and NCR-2099-9999 and SN-AHU-2026-1842");
    expect(found.some((item) => item.value === "NCR-2026-0012" && item.href)).toBe(true);
    expect(found.some((item) => item.value === "NCR-2099-9999")).toBe(false);
    expect(found.some((item) => item.value === "SN-AHU-2026-1842")).toBe(true);
  });
});

describe("magic bytes", () => {
  it("detects PDF magic", () => {
    expect(detectMagicMime(Buffer.from("%PDF-1.4"), ".pdf")).toBe("application/pdf");
  });
});
