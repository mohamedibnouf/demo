import { inflateSync } from "zlib";

export interface PdfExtraction {
  pageCount: number;
  text: string;
  metadata: Record<string, string>;
  extractable: boolean;
  encrypted: boolean;
  message?: string;
}

function countPages(source: string): number {
  const matches = source.match(/\/Type\s*\/Page(?!s)\b/g);
  return matches?.length || 1;
}

function decodeLiteral(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractSimpleText(source: string): string {
  const literals = [...source.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)].map((match) =>
    decodeLiteral(match[0].slice(1, match[0].lastIndexOf(")"))),
  );
  const arrays = [...source.matchAll(/\[(.*?)\]\s*TJ/gs)].map((match) =>
    [...(match[1] ?? "").matchAll(/\((?:\\.|[^\\)])*\)/g)].map((item) => decodeLiteral(item[0].slice(1, -1))).join(""),
  );
  return [...literals, ...arrays].join(" ").replace(/\s+/g, " ").trim();
}

function inflateStreams(buffer: Buffer): string {
  const source = buffer.toString("latin1");
  const chunks: string[] = [source];
  const regex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source))) {
    try {
      const inflated = inflateSync(Buffer.from(match[1] ?? "", "latin1"));
      chunks.push(inflated.toString("utf8"));
    } catch {
      // stream was not flate-encoded
    }
  }
  return chunks.join("\n");
}

function readInfo(source: string): Record<string, string> {
  const info: Record<string, string> = {};
  for (const key of ["Title", "Author", "Subject", "Creator", "Producer"]) {
    const match = source.match(new RegExp(`/${key}\\s*\\((.*?)\\)`));
    if (match?.[1]) info[key.toLowerCase()] = decodeLiteral(match[1]);
  }
  return info;
}

export async function extractPdf(buffer: Buffer): Promise<PdfExtraction> {
  if (!buffer.length) throw new Error("The PDF is empty.");
  const header = buffer.slice(0, 8).toString("latin1");
  if (!header.startsWith("%PDF")) throw new Error("The PDF is corrupt or not a PDF file.");
  const latin = buffer.toString("latin1");
  if (/\/Encrypt\b/.test(latin)) {
    return {
      pageCount: countPages(latin),
      text: "",
      metadata: readInfo(latin),
      extractable: false,
      encrypted: true,
      message: "This PDF is password-protected and cannot be parsed.",
    };
  }

  try {
    const unpdf = await import("unpdf");
    const pdf = await unpdf.getDocumentProxy(new Uint8Array(buffer));
    const extracted = await unpdf.extractText(pdf, { mergePages: true });
    const text = (Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text).replace(/\s+/g, " ").trim();
    return {
      pageCount: extracted.totalPages || countPages(latin),
      text,
      metadata: readInfo(latin),
      extractable: Boolean(text),
      encrypted: false,
      message: text
        ? undefined
        : "No extractable text detected. OCR is not enabled for this document.",
    };
  } catch {
    const inflated = inflateStreams(buffer);
    const text = extractSimpleText(inflated);
    return {
      pageCount: countPages(latin),
      text,
      metadata: readInfo(latin),
      extractable: Boolean(text),
      encrypted: false,
      message: text
        ? undefined
        : "No extractable text detected. OCR is not enabled for this document.",
    };
  }
}
