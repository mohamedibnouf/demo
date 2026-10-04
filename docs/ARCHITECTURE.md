# Architecture

## Stack

- Next.js (App Router) + TypeScript strict
- React Server Components by default; Client Components only for interactivity
- Tailwind CSS
- Zod + React Hook Form
- Recharts, Lucide, date-fns
- Supabase schema (PostgreSQL, Auth, Storage, RLS) prepared for production swap
- Local demo data adapter so `npm run dev` works without a live Supabase project

## Directory layout

```
src/
  app/                 App Router pages and route handlers
  components/          Shared UI (layout, tables, charts, dialogs)
  features/            Isolated business modules
  lib/                 Cross-cutting utilities, engines, i18n, env
  server/              Auth, RBAC, data access, actions, AI, import
  types/               Shared domain types
  hooks/               Client hooks
supabase/
  migrations/          PostgreSQL + RLS
  seed.sql             Production-oriented seed (mirrors demo store)
```

Business logic lives in `src/lib/engines` and `src/server`. UI components do not compute FPY, PPM, SPPM, FFR, risk scores, or numbering.

## Data access

`DataProvider` is the persistence interface.

- `LocalDemoProvider` — default. In-memory store persisted to `data/demo-store.json`.
- `SupabaseProvider` — activated when `NEXT_PUBLIC_SUPABASE_URL` and keys are set.

Repositories are thin query/command wrappers. Feature modules call repositories and engines, never the raw store from Client Components.

## Auth and RBAC

- Demo mode issues an httpOnly JWT cookie signed with `AUTH_SECRET`.
- Role is never trusted from the client. Server actions load the session and check `role_permissions`.
- Permissions: view, create, edit, submit, review, approve, verify, close, reopen, export.
- Management is read-only on operational records.
- Supplier sees only that supplier’s root records.
- Customer sees only own complaints and permitted customer-facing fields (no internal RCA/CAPA).

## Quality event model

Every original defect or quality occurrence is a `quality_events` row with `source_event_id`.  
PC, NCR, Supplier NCR, CAPA, Rework, and RRR **reference** that event. KPI engines count the original event once.

## AI governance

`AIProvider` may suggest causes, similar cases, actions, and explanations.  
It must never approve, reject, verify, close, or mutate controlled records. Drafts created from AI/document analysis require human confirmation.

## Numbering

Sequences (`NCR-2026-0001`, …) are allocated server-side with a concurrency-safe increment on the store / database sequence table.

## i18n

`src/lib/i18n` holds English strings and an Arabic dictionary. The language selector switches `lang` + `dir`. Business codes (NCR, CAPA, FPY) stay in English per SRS consistency.

## Security defaults

- Deny unless allowed (RLS policies in SQL; equivalent checks in LocalDemoProvider).
- Private evidence stored in `LocalFileStorage` (`data/uploads`) or private Supabase bucket `samco-documents`. Downloads require an authenticated session. Signed URL pattern is used when the service-role adapter is configured.
- Secrets never sent to the client.
