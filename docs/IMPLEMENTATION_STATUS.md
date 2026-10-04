# Implementation status

Last updated: 2026-10-04 (post NCR/CAPA crash verification)

## Phase honesty

A module is marked **complete** only when its required workflow and business logic work, not merely because a route renders.

| Phase | Status | Evidence |
|---|---|---|
| D0 Foundation, Auth, RBAC, Layout, Seed | **Complete** (local demo) | Login, JWT session, middleware gate, sidebar RBAC, LocalDemoProvider, seed pack. Hosted Supabase is schema-only. |
| D1 Dashboard, KPIs, charts, tasks, notifications | **Mostly complete** | Calculated KPIs, Recharts, insights, tasks, notifications. Comparison-period trend arrows are still seeded constants, not recomputed deltas. |
| D2 Production, Inspections, PC, NCR, CAPA | **Partially complete** | List/detail/status workflow and quality-event links work. Inspection → NCR and NCR → CAPA draft work. No standalone NCR/CAPA create form on the list pages. No field-level edit form (RCA, evidence, 5-Why). Detail is a generic key-value + timeline, not full tabbed workspace. |
| D3 Supplier NCR, Complaints, Rework, RRR, Deviation, SE, ECN | **Partially complete** | Portals, isolation, supplier response, complaint serial validation, rework attempt gate, deviation confirmed-order rule. Remaining work is module-specific forms and full stock/ECN readiness logic. |
| D4 Calibration, Logbooks, Paint Shop | **Partially complete** | Registers, due status, controlled-operation block, logbook readings, batches, oven tracker, destructive tests. Not every paint-shop interval slot is fully modeled. |
| D5 IMS, Risk register, Audits, MR | **Partially complete** | Lists, 5×5 matrix, checklist download, findings, reviews. Online checklist completion and full MR input pack are thin. |
| D6 Excel, Documents, AI, Insights, Risk Engine | **Mostly complete** | Real private upload, Excel/PDF/DOCX parse, two-step import, Zod-validated AI analysis, NCR/CAPA/Risk/Task drafts from documents. OCR is not implemented. Hosted Supabase Storage is adapter-ready. |
| D7 Admin, Reports, Search, Traceability, Audit Trail | **Partially complete** | Admin CRUD-lite screens, CSV reports, grouped search, source-event traceability, audit log page, Admin reset. Not a full configuration product. |
| D8 Polish, tests, security, build | **Mostly complete** | typecheck/lint/tests/build pass. Responsive shell exists. No browser e2e. Next.js 16 `middleware` deprecation warning remains. |

## What was fixed in this verification

1. **NCR/CAPA list crash** — Server Components were passing `href` functions into the client `DataTable`. Lists now pass serializable `_href` / `hrefField` only. Confirmed gone: no `Functions cannot be passed directly to Client Components` on NCR or CAPA.
2. **CAPA status machine** — Draft no longer advances to invalid `Submitted`. CAPA path is Draft → Open → In Progress → Pending Verification → Effective → Closed.
3. **Workflow refresh** — After a status action the page now `router.refresh()` so the badge/timeline update.
4. **Demo task assignment** — Primary Quality Manager login now owns the NCR-2026-0012 and CAL-0042 upcoming tasks so Dashboard / Tasks are populated for the recommended demo account.

## Routes verified (Quality Manager, live production server)

| Route | Result |
|---|---|
| POST `/login` wrong password | 303 `/login?error=1` |
| POST `/login` `quality.manager@samco.demo` / `SamcoDemo@2026` | 303 `/` + `samco_session` cookie |
| `/` | 200, greeting, KPI cards, insights |
| `/quality/production-ncr` | 200, includes `NCR-2026-0012` |
| `/quality/production-ncr/ncr-0012` | 200, Investigation, `QE-2026-0018`, timeline, QM actions |
| `/quality/production-ncr/ncr-0015` | 200, Draft, Save Draft + Submit |
| `/quality/capa` | 200, includes `CAPA-2026-0008` |
| `/quality/capa/capa-0008` | 200, origin SNCR, owner, due date, In Progress |
| `/quality/capa/capa-0010` | 200, **Move to Open** (not Submitted) |
| `/quality/production-inspection/insp-0041` | 200, **Create NCR** |
| `/tasks` and `/tasks?filter=all` | 200 |
| `/notifications` | 200 |
| Unauthenticated `/quality/production-ncr` | 307 `/login` |
| Management on NCR detail | Read-only message; no submit/transition |

## NCR / CAPA workflow (what works vs what does not)

**Works**

- Open seeded Production NCRs and CAPAs
- Status badges and next-step buttons for Quality Manager
- Create NCR **from a failed inspection** (`createNcrFromInspection`)
- Create CAPA **draft from NCR / SNCR / complaint / finding**
- Related records via `source_event_id` (Scenario A chain)
- Timeline / audit history section
- Void/cancel with reason
- Management cannot mutate operational records (server + UI)
- Anti-double-count engine tests still pass

**Does not yet work as full CRUD**

- No “New NCR” / “New CAPA” form on the list pages
- Cannot edit defect text, RCA method, evidence, or owner on a dedicated form (status-only updates)
- Recommended tabs (Overview / Actions / Evidence / Related / Timeline / Audit History) are not fully split
- Document Intelligence “Create NCR Draft” still creates a CAPA draft

## Test / build results (2026-10-04)

```
npm run typecheck   # pass
npm run lint        # pass
npm test            # 38/38 (18 prior + 20 file-intelligence)
npm run build       # pass, Next.js 16.3.8
npx playwright test # 85/85 (78 prior cases + 7 new)
```

Live HTTP verification script: `scripts/verify-demo.mjs` — 24/26. The two failures are **intentional gaps** (no standalone create forms), not crashes.

## Server logs after visiting tested routes

No runtime exceptions, no hydration errors, no DataTable function-serialization errors.  
Only: `Missing origin header from a forwarded Server Actions request` from the scripted login POST (expected; browser login sends Origin).

## Database / migration status

- **Runtime:** `LocalDemoProvider` → in-memory + `data/demo-store.json`
- **Schema ready, not connected:** `supabase/migrations/0001_init.sql`, `supabase/seed.sql`
- Hosted Postgres / Auth / Storage / live RLS are **not** running
- Seed regenerated on last verification restart (store file reset)

## Remaining TODOs (do not treat as started)

1. Standalone NCR and CAPA create forms + field-level edit
2. Proper tabbed record workspace
3. Compute dashboard trend % from `kpi_snapshots` instead of constants
5. Deepen D3–D7 module-specific workflows
6. Optional hosted Supabase cutover
7. Browser e2e / visual QA
8. Next.js 16 `middleware` → `proxy` migration

## Recommended next phase

**D2 completion first** — NCR/CAPA real CRUD and forms — before opening a new major phase.
