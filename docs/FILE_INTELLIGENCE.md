# File Intelligence

Real document ingestion for the SAMCO IMS/QMS demo. Files are stored privately, parsed server-side, validated, and only imported after human confirmation.

## User path

Login as `quality.manager@samco.demo` / `SamcoDemo@2026`

Documents → Upload & Analyze → Browse Files → Upload → review extraction/validation → Analyze with AI and/or Confirm Import → open `/documents/[id]`

Admin → Excel Integration → New Import uses the same pipeline.

## Supported formats

| Type | Stored | Text / sheet extraction |
|---|---|---|
| `.xlsx` / `.xls` / `.csv` | Yes | Real server-side parse (`xlsx`) |
| `.pdf` | Yes | Text-based PDFs only (`unpdf` + fallback). No OCR. |
| `.docx` | Yes | Paragraphs, headings, tables (`mammoth`) |
| Images (PNG/JPG/WEBP/GIF) | Yes | Storage only. No text extraction is claimed. |

Maximum size: 10 MB (`MAX_UPLOAD_BYTES`).

## Storage

- Default: private local folder `data/uploads/` via `LocalFileStorage`
- When `SUPABASE_SERVICE_ROLE_KEY` is set: private bucket `samco-documents`
- Files are never public. Download requires an authenticated session (`/api/documents/[id]/file`)
- Paths are generated as `samco/{module}/{year}/{record-id}/{uuid}-{filename}`
- Client MIME/extension is never trusted alone; magic bytes are checked

## Processing statuses

`uploaded` → `processing` → `processed` | `failed`

Import statuses: `draft`, `validated`, `partially_valid`, `ready`, `imported`, `failed`, `cancelled`

Controlled records are not hard-deleted.

## Security

- Authentication + RBAC (`documents`, `excel`, `ai`)
- Inspector cannot view `/documents`
- Management is read-only (no upload/import/draft create)
- Service-role and `OPENAI_API_KEY` stay server-side
- Filename traversal (`..`, absolute paths, null bytes) is rejected

## Known limitations

- Hosted Supabase Storage is implemented but inactive until service-role env is set
- Scanned PDFs show: "No extractable text detected. OCR is not enabled for this document."
- Seeded demo documents `DOC-2026-0001..0003` are metadata unless a binary is uploaded
- Charts remain display-only; imported production rows feed existing KPI stores
