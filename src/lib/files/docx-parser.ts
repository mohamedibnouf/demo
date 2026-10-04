import mammoth from "mammoth";

export interface DocxExtraction {
  text: string;
  html: string;
  headings: string[];
  tables: { name: string; headers: string[]; rows: string[][] }[];
  extractable: boolean;
  message?: string;
}

function tablesFromHtml(html: string) {
  const tables: { name: string; headers: string[]; rows: string[][] }[] = [];
  const blocks = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  blocks.forEach((block, index) => {
    const rows = [...block.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((row) =>
      [...(row[0] ?? "").matchAll(/<t[dh][\s\S]*?>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
        (cell[1] ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(),
      ),
    );
    if (!rows.length) return;
    tables.push({
      name: `Table ${index + 1}`,
      headers: rows[0] ?? [],
      rows: rows.slice(1),
    });
  });
  return tables;
}

export async function extractDocx(buffer: Buffer): Promise<DocxExtraction> {
  if (!buffer.length) throw new Error("The DOCX is empty.");
  if (buffer.slice(0, 2).toString("latin1") !== "PK") {
    throw new Error("The DOCX is corrupt or not a Word document.");
  }
  try {
    const raw = await mammoth.extractRawText({ buffer });
    const html = await mammoth.convertToHtml({ buffer });
    const text = raw.value.replace(/\r/g, "").trim();
    const headings = [...html.value.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map((match) =>
      (match[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    );
    return {
      text,
      html: html.value,
      headings: headings.filter(Boolean),
      tables: tablesFromHtml(html.value),
      extractable: Boolean(text),
      message: text ? undefined : "No extractable text was found in this Word document.",
    };
  } catch {
    throw new Error("The DOCX is corrupt or could not be parsed.");
  }
}
