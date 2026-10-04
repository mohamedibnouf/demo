import * as XLSX from "xlsx";

export interface ExcelCell {
  raw: string;
  normalized: string;
}

export interface ExcelSheetPreview {
  name: string;
  headers: string[];
  rawHeaders: string[];
  rows: Record<string, string>[];
  rawRows: Record<string, string>[];
  rowNumbers: number[];
  usedRows: number;
  usedColumns: number;
  blankRowNumbers: number[];
  duplicateRowNumbers: number[];
}

export interface ExcelWorkbookPreview {
  sheetNames: string[];
  sheets: ExcelSheetPreview[];
}

export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[#]/g, "number")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 20000 && value < 80000) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed?.y && parsed.m && parsed.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
      }
    }
    return String(value);
  }
  return String(value).trim();
}

export function parseExcelWorkbook(bytes: Buffer | Uint8Array): ExcelWorkbookPreview {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, { type: "buffer", cellDates: true, raw: false });
  } catch {
    throw new Error("The Excel workbook is corrupt or unreadable.");
  }
  if (!workbook.SheetNames.length) {
    throw new Error("The workbook has no sheets.");
  }
  const sheets = workbook.SheetNames.map((name) => parseSheet(workbook.Sheets[name]!, name));
  return { sheetNames: workbook.SheetNames, sheets };
}

function parseSheet(sheet: XLSX.WorkSheet, name: string): ExcelSheetPreview {
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });
  const headerRowIndex = matrix.findIndex((row) => row.some((cell) => String(cell ?? "").trim()));
  if (headerRowIndex < 0) {
    return {
      name,
      headers: [],
      rawHeaders: [],
      rows: [],
      rawRows: [],
      rowNumbers: [],
      usedRows: 0,
      usedColumns: 0,
      blankRowNumbers: [],
      duplicateRowNumbers: [],
    };
  }
  const rawHeaders = (matrix[headerRowIndex] ?? []).map((cell) => String(cell ?? "").trim());
  const headers = rawHeaders.map((header, index) => normalizeHeader(header) || `column_${index + 1}`);
  const dataRows = matrix.slice(headerRowIndex + 1);
  const rows: Record<string, string>[] = [];
  const rawRows: Record<string, string>[] = [];
  const rowNumbers: number[] = [];
  const blankRowNumbers: number[] = [];
  const seen = new Map<string, number>();
  const duplicateRowNumbers: number[] = [];

  dataRows.forEach((row, offset) => {
    const excelRow = headerRowIndex + 2 + offset;
    const values = headers.map((_, idx) => cellToString(row[idx]));
    const raw: Record<string, string> = {};
    const normalized: Record<string, string> = {};
    headers.forEach((header, idx) => {
      raw[rawHeaders[idx] || header] = values[idx] ?? "";
      normalized[header] = values[idx] ?? "";
    });
    if (values.every((value) => !value)) {
      blankRowNumbers.push(excelRow);
      return;
    }
    const fingerprint = values.join("|");
    if (seen.has(fingerprint)) duplicateRowNumbers.push(excelRow);
    else seen.set(fingerprint, excelRow);
    rows.push(normalized);
    rawRows.push(raw);
    rowNumbers.push(excelRow);
  });

  return {
    name,
    headers,
    rawHeaders,
    rows,
    rawRows,
    rowNumbers,
    usedRows: rows.length,
    usedColumns: headers.filter(Boolean).length,
    blankRowNumbers,
    duplicateRowNumbers,
  };
}

export function parseCsvText(csv: string): ExcelWorkbookPreview {
  return parseExcelWorkbook(Buffer.from(csv, "utf8"));
}
