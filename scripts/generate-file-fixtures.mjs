import fs from "fs";
import path from "path";
import zlib from "zlib";
import XLSX from "xlsx";

const out = path.join(process.cwd(), "fixtures", "file-intelligence");
fs.mkdirSync(out, { recursive: true });

const production = [
  ["production_date", "production_order", "model", "line", "quantity", "serial_number", "shift", "defect_quantity", "process_defect", "defect_type", "inspector", "status"],
  ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "2", "SN-AHU-2026-9001", "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
  ["2026-10-03", "PO-2026-2408", "AHU-S15", "L-AHU", "1", "SN-AHU-2026-9002", "A", "1", "Yes", "Leakage", "Khalid Al-Harbi", "Fail"],
  ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "1", "SN-AHU-2026-9003", "B", "0", "No", "", "Night Inspector", "Pass"],
  ["2026-10-03", "", "AHU-P25", "L-AHU", "1", "SN-AHU-2026-9004", "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
  ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "twelve", "SN-AHU-2026-9005", "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
  ["2026-10-03", "PO-2026-2409", "AHU-XX", "L-AHU", "1", "BAD", "A", "0", "No", "", "Khalid Al-Harbi", "Weird"],
  ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "1", "SN-AHU-2026-9001", "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
];
const ncr = [
  ["source", "defect", "severity", "model", "serial_number"],
  ["AHU Line", "Expansion valve leak", "High", "AHU-P25", "SN-AHU-2026-1842"],
  ["Unknown", "Bad model", "Low", "AHU-XX", "BAD"],
];

function writeSheet(name, rows, file) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  XLSX.writeFile(wb, path.join(out, file));
}

writeSheet("Production Data", production, "production-demo.xlsx");
writeSheet("NCR Data", ncr, "ncr-demo.xlsx");

const pdfText = [
  "SAMCO Quality Report",
  "Potential nonconformity: flare-seat porosity on Alpha expansion valves.",
  "Referenced NCR-2026-0012 and CAPA-2026-0008 for serial SN-AHU-2026-1842.",
  "Supplier Alpha Components. Target date 2026-10-09.",
  "Recommended action: hold remaining lot and create an NCR draft for human review.",
].join(" ");

function makePdf(text) {
  const stream = `BT /F1 11 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj + "\n";
  }
  const xref = body.length;
  body += `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  body += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return body;
}

fs.writeFileSync(path.join(out, "quality-report-demo.pdf"), makePdf(pdfText));
fs.writeFileSync(path.join(out, "image-only-demo.pdf"), makePdf(""));

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function zipStore(files) {
  const chunks = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const data = Buffer.from(file.data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const entry = Buffer.concat([local, name, data]);
    chunks.push(entry);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += entry.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>SAMCO Quality Report</w:t></w:r></w:p>
    <w:p><w:r><w:t>Potential nonconformity: flare-seat porosity. See NCR-2026-0012, CAPA-2026-0008, serial SN-AHU-2026-1842, supplier Alpha Components. Date 2026-10-09.</w:t></w:r></w:p>
  </w:body>
</w:document>`;

const docx = zipStore([
  { name: "[Content_Types].xml", data: `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
  { name: "_rels/.rels", data: `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
  { name: "word/_rels/document.xml.rels", data: `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>` },
  { name: "word/document.xml", data: documentXml },
]);
fs.writeFileSync(path.join(out, "quality-report-demo.docx"), docx);
fs.mkdirSync(path.join(process.cwd(), "data", "uploads"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "data", "uploads", ".gitkeep"), "");
console.log("fixtures written to", out);
void zlib;
