# SAMCO Integrated IMS/QMS Platform — Demo Scope

**Project:** SAMCO Integrated IMS/QMS Platform  
**Client:** Saudi Airconditioning Manufacturing Co. Ltd. (SAMCO) | Carrier  
**Type:** Interactive sales / demonstration system (not a static mockup)  
**Primary language:** English (Arabic / RTL architecture prepared)

## Purpose

This repository is a working enterprise-style Quality Management / Integrated Management System demo. It behaves like an application: authentication, RBAC, CRUD, workflows, calculated KPIs, notifications, tasks, Excel import, AI analysis, and linked records.

It is **not** the full production integration with SAP, live plant historians, or SAMCO production databases. Seeded records are **DEMO DATA** and must not be presented as actual SAMCO production figures.

## In scope

- Authentication and ten demo roles with server-side permission enforcement
- Main dashboard, management dashboard, KPI cards, and Recharts visualizations
- Production, inspections, Production Constraints (PC), NCR, CAPA
- Supplier NCR portal, customer complaint portal
- Rework (max two attempts), RRR (Rejection & Replacement — no separate Scrap module)
- Deviation, Sample Evaluation, ECN
- Calibration / monitoring with blocked operations when equipment is expired
- CPU Coil, AHU Coil, and Paint Shop daily logbooks; oven tracker; destructive tests
- IMS Objectives, Risk & Opportunity, audit management, management review
- Risk engine (deterministic business rules) and AI advisory assistant
- Excel Integration Center, document intelligence, reports, global search
- Admin portal: users, roles, master data, workflows, numbering, notifications
- Audit trail, soft cancel/void (no permanent delete of controlled records)
- Traceability timeline across quality events
- Demo presentation mode, demo guide, and reset (Admin only)

## Out of scope (demo adapters)

| Integration | Demo approach |
|---|---|
| Live Supabase project | Local persisted demo store + Supabase schema/migrations ready to swap |
| OpenAI / enterprise LLM | `AIProvider` interface + `MockAIProvider`; `OpenAIProvider` when key exists |
| SAP / production MES | Seeded production / receiving records |
| Email / SMS / WhatsApp | In-app notification center |
| Physical calibration lab | Equipment register + certificate metadata |
| Offline audit app | Downloadable checklist + upload completed checklist |

## Official terminology

Do not rename these terms in the UI:

- Production Constraints (PC) — **not** Turnback
- IMS Objectives
- RRR — Rejection & Replacement / scrap process (no separate Scrap module)
- FPY, Production PPM, Customer FFR PPM, Supplier SPPM, COPQ
- Quality Event (`source_event_id`) for anti-double-counting

## Demo acceptance

The demo is complete when the 30 acceptance criteria in the project charter are implemented and `typecheck`, `lint`, `test`, and `build` pass. See `IMPLEMENTATION_STATUS.md`.
