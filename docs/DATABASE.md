# Database

The canonical schema is PostgreSQL (Supabase). The demo runs against `LocalDemoProvider`, which mirrors these tables in a persisted TypeScript store.

All seeded rows carry `is_demo_data = true` where applicable. They are **not** actual SAMCO production records.

## Core identity

| Table | Purpose |
|---|---|
| departments | Quality, Production, Supply Chain, Product Engineering, Paint Shop, Management |
| roles | Ten application roles |
| permissions | Module × action matrix |
| role_permissions | Role grants |
| profiles | Users linked to department / optional supplier or customer |
| user_roles | User ↔ role |

## Master data

customers, suppliers, model_families, models, production_lines, materials, defect_types, complaint_types, ncr_dispositions

## Production & receiving

- `production_orders` — may span multiple dates/lines; `confirmed` blocks new deviations
- `production_units` — serial numbers
- `production_records` — qty by date/line/order
- `receiving_records` — supplier receipts used by SPPM denominator

## Quality spine

- `quality_events` — unique `source_event_id`; anti-double-counting root
- `production_inspections` + `inspection_results`
- `production_constraints`
- `ncrs` + `ncr_actions`
- `supplier_ncrs` + `supplier_ncr_responses`
- `customer_complaints`
- `capas` + `capa_actions`
- `reworks`, `rrr_records`
- `deviations`, `sample_evaluations`, `ecns`

## IMS / calibration / logbooks

equipment, calibration_records, daily_logbooks, logbook_readings, paint_batches, destructive_tests, oven_tracker, ims_objectives, objective_measurements, risk_register, risk_actions

## Audit & management

audit_plans, audits, audit_checklists, audit_questions, audit_findings, management_reviews, management_actions

## Platform

tasks, notifications, documents, document_versions, document_processing_jobs, document_extractions, document_analysis_results, import_jobs, import_batches, import_rows, import_errors, workflow_definitions, workflow_instances, workflow_history, numbering_sequences, audit_logs, ai_analysis, ai_recommendations, kpi_snapshots, activities

## KPI assumptions (documented because the SRS leaves some numerators configurable)

| KPI | Demo formula |
|---|---|
| FPY | `(1 - (process_defect_events / units_produced)) * 100` |
| Production PPM | `(quality_events of type process or component counted once / units_produced) * 1,000,000` |
| Customer FFR PPM | `(complaint units of model family / units produced of same family in rolling 12 months) * 1,000,000` |
| Supplier SPPM | `(distinct source component defects for supplier / receiving qty) * 1,000,000` |
| Production Constraints % | `(distinct PC-linked source events / units produced) * 100` |
| COPQ | Scrap cost ($) from COPQ source records only — RRR cost is **not** auto-copied |

Workflow descendants (PC → NCR → SNCR → CAPA) do not increment the original defect again.

## RLS philosophy

Deny by default. Policies grant:

- Authenticated staff: module permissions
- Management: SELECT on operational tables
- Supplier: own `supplier_id`
- Customer: own `customer_id` complaints and public response fields
- Admin: configuration tables

See `supabase/migrations/`.
