# SAMCO IMS/QMS — Route / Navigation Audit

**Verified:** 4 October 2026 against production `next start` at `http://localhost:3000`  
**Source of truth:** `src/lib/navigation.ts` (49 sidebar items)  
**Accounts:** Quality Manager, Admin, Management, Supplier, Customer (password `SamcoDemo@2026`)  
**Automation:** Playwright **78/78 PASS** (`e2e/sidebar.spec.ts`, `e2e/journeys.spec.ts`, `e2e/cross-module.spec.ts`, `e2e/roles.spec.ts`, `e2e/navigation.smoke.spec.ts`)

PASS requires NAVIGATION → PAGE LOAD → DATA → PRIMARY ACTION → DETAIL/RESULT, not merely HTTP 200.

Required Role is the minimum `view` grant on the nav `module`. Quality Manager can see every sidebar item. Server `authorize()` / `guard()` also enforce direct URLs.

| Navigation Label | Route | Required Role | Loads | Data Works | Primary Action Works | Detail Works | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Dashboard | `/` | dashboard view | Yes | Yes | KPI / View All / insights | Yes | PASS | NCR Open → NCR list; View All → tasks |
| Production Inspection | `/quality/production-inspection` | production_inspection view | Yes | Yes | Save Draft form + View | Yes | PASS | Create form + list View → tabs + related NCR |
| Production NCR | `/quality/production-ncr` | production_ncr view | Yes | Yes | Create draft, search, filter, View | Yes | FIXED | Create added earlier; list→open→create→reopen verified |
| Supplier NCR | `/quality/supplier-ncr` | supplier_ncr view | Yes | Yes | Create + View + 8D/review | Yes | FIXED | Isolated for Supplier role |
| Customer Complaints | `/quality/customer-complaints` | customer_complaint view | Yes | Yes | Submit + View | Yes | PASS | Customer projection hides internal RCA |
| Internal NCR | `/quality/internal-ncr` | internal_ncr view | Yes | Yes | Create + View | Yes | FIXED | |
| CAPA | `/quality/capa` | capa view | Yes | Yes | Create + View + origin link | Yes | FIXED | Origin → SNCR-2026-0004 |
| Deviation | `/quality/deviation` | deviation view | Yes | Yes | Create + View | Yes | FIXED | Blocked after confirmed order |
| Sample Evaluation | `/quality/sample-evaluation` | sample_evaluation view | Yes | Yes | Create + View | Yes | FIXED | |
| ECN | `/quality/ecn` | ecn view | Yes | Yes | Create + View | Yes | FIXED | ECN-2026-0004 shows stock/order fields |
| Incoming Inspection | `/quality/incoming-inspection` | incoming_inspection view | Yes | Yes | Create + View | Yes | FIXED | |
| In-Process Inspection | `/quality/in-process-inspection` | in_process_inspection view | Yes | Yes | Create + View | Yes | FIXED | |
| Final Inspection | `/quality/final-inspection` | final_inspection view | Yes | Yes | Create + View | Yes | FIXED | |
| Rework | `/quality/rework` | rework view | Yes | Yes | Create + View | Yes | FIXED | Third attempt gated |
| RRR - Rejection & Replacement | `/quality/rrr` | rrr view | Yes | Yes | Create + View | Yes | FIXED | |
| Calibration / Monitoring | `/quality/calibration` | calibration view | Yes | Yes | View CAL-0042 | Yes | PARTIAL | No Create — equipment is master data |
| CPU Coil | `/logbooks/cpu-coil` | logbook view | Yes | Yes | Open today’s logbook | List only | FIXED | Dedicated logbook, not NCR |
| AHU Coil | `/logbooks/ahu-coil` | logbook view | Yes | Yes | Open today’s logbook | List only | FIXED | |
| Paint Shop | `/logbooks/paint-shop` | logbook view | Yes | Yes | Logbook + oven/destructive links | List only | PASS | |
| Oven Tracker | `/logbooks/oven-tracker` | logbook view | Yes | Yes | Table | List only | FIXED | Now in sidebar |
| Destructive Tests | `/logbooks/destructive-tests` | logbook view | Yes | Yes | Table | List only | FIXED | Now in sidebar |
| IMS Objectives | `/ims/objectives` | ims_objective view | Yes | Yes | Create + View | Yes | FIXED | |
| Risk & Opportunity | `/ims/risk-opportunity` | risk_register view | Yes | Yes | Matrix + Create + View | Yes | FIXED | |
| Annual Audit Plan | `/ims/annual-audit-plan` | audit view | Yes | Yes | Create + View | Yes | FIXED | |
| Internal Audit | `/ims/internal-audit` | audit view | Yes | Yes | Create + View AUD-2026-0003 | Yes | FIXED | |
| External Audit | `/ims/external-audit` | audit view | Yes | Yes | Create + View | Yes | FIXED | |
| Customer Audit | `/ims/customer-audit` | audit view | Yes | Yes | Create + View | Yes | FIXED | |
| Supplier Audit | `/ims/supplier-audit` | audit view | Yes | Yes | Create + View | Yes | FIXED | |
| Audit Findings | `/ims/audit-findings` | audit view | Yes | Yes | View AF-2026-0007 + Create CAPA | Yes | FIXED | |
| Management Review | `/ims/management-review` | management_review view | Yes | Yes | Create + View | Yes | FIXED | |
| Quality Dashboard | `/performance/quality-dashboard` | dashboard view | Yes | Yes | KPI drill-down | n/a | PASS | |
| Management Dashboard | `/performance/management-dashboard` | dashboard view | Yes | Yes | CAPA/risk cards | n/a | FIXED | Cards navigate |
| KPI & Reports | `/performance/kpi-reports` | reports view | Yes | Yes | KPI + Reports link | n/a | PASS | |
| COPQ | `/performance/copq` | reports view | Yes | Yes | Table | n/a | PASS | |
| Supplier SPPM | `/performance/supplier-sppm` | reports view | Yes | Yes | Table | n/a | PASS | |
| Customer FFR / PPM | `/performance/customer-ffr` | reports view | Yes | Yes | Table | n/a | PASS | |
| Production Constraints | `/performance/production-constraints` | production_constraint view | Yes | Yes | View PC-2026-0007 | Yes | FIXED | Detail route added earlier |
| AI Quality Assistant | `/ai-assistant` | ai view | Yes | Yes | Ask assistant | n/a | PARTIAL | Mock unless OpenAI key set |
| Users | `/admin/users` | users view | Yes | Yes | Search table | n/a | PASS | QM view-only; Inspector denied |
| Roles & Permissions | `/admin/roles` | admin view | Yes | Yes | Matrix table | n/a | PASS | Management direct URL denied |
| Master Data | `/admin/master-data` | admin view | Yes | Yes | Tables | n/a | PASS | |
| Workflow Configuration | `/admin/workflows` | admin view | Yes | Yes | Steps table | n/a | PASS | |
| Numbering Configuration | `/admin/numbering` | admin view | Yes | Yes | Sequences | n/a | PASS | |
| Excel Integration | `/admin/excel` | excel view | Yes | Yes | Validate/import | n/a | PASS | Invalid rows rejected |
| Notification Configuration | `/admin/notifications` | admin view | Yes | Yes | Rule card | n/a | PARTIAL | Documented rules, not an editor |
| Audit Trail | `/admin/audit-trail` | admin view | Yes | Yes | Log table | n/a | PASS | Reset is Admin-only |
| Reports | `/reports` | reports view | Yes | Yes | Cards + Export CSV | n/a | FIXED | Cards navigate |
| Tasks | `/tasks` | tasks view | Yes | Yes | Filters + open record + Complete | Yes | FIXED | My Tasks → NCR-2026-0012 |
| Smart Risks | `/risks` | risk_register view | Yes | Yes | Related CAPA link | Yes | FIXED | hrefForRef |

## Extra routes exercised

| Navigation Label | Route | Required Role | Loads | Data Works | Primary Action Works | Detail Works | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Notifications | `/notifications` | signed-in | Yes | Yes | Mark read + open New NCR | Yes | FIXED | Drawer + page |
| Search | `/search?q=` | signed-in | Yes | Yes | Open NCR + serial | Yes | FIXED | |
| Profile | `/profile` | signed-in | Yes | Yes | View identity | n/a | FIXED | |
| NCR-2026-0012 | `/quality/production-ncr/ncr-0012` | production_ncr view | Yes | Yes | Related + Create CAPA | Yes | PASS | Alpha chain |
| CAPA-2026-0008 | `/quality/capa/capa-0008` | capa view | Yes | Yes | Origin SNCR | Yes | PASS | |
| SNCR-2026-0004 | `/quality/supplier-ncr/sncr-0004` | supplier_ncr view | Yes | Yes | Response/review | Yes | PASS | |
| CC-2026-0009 | `/quality/customer-complaints/cc-0009` | customer_complaint view | Yes | Yes | Serial + CAPA origin | Yes | PASS | |
| INSP-2026-0041 | `/quality/production-inspection/insp-0041` | production_inspection view | Yes | Yes | Related NCR/PC | Yes | PASS | |
| PC-2026-0007 | `/performance/production-constraints/pc-0007` | production_constraint view | Yes | Yes | Related NCR | Yes | FIXED | |
| AUD-2026-0003 | `/ims/internal-audit/aud-3` | audit view | Yes | Yes | Open finding | Yes | PASS | |
| AF-2026-0007 | `/ims/audit-findings/af-0007` | audit view | Yes | Yes | Create CAPA | Yes | PASS | |
| CAL-0042 | `/quality/calibration/eq-42` | calibration view | Yes | Yes | Overview | Yes | PASS | |
| Serial | `/trace/serial/SN-AHU-2026-1842` | signed-in | Yes | Yes | Related event | Yes | FIXED | |
| Login | `/login` | public | Yes | Yes | Sign in | n/a | PASS | |

## Role verification

| Role | UI visibility | Direct URL | Result |
|---|---|---|---|
| Quality Manager | Full sidebar including Admin | Admin view-only; no Reset | PASS |
| Admin | Full sidebar | Audit Trail allowed | PASS |
| Management | Operational + Users + Excel; no Roles/Workflows/Audit Trail | `/admin/roles` denied; NCR has no Create; read-only banner | PASS |
| Supplier | Supplier NCR + Tasks only | `/quality/production-ncr` and `/quality/capa` denied | PASS |
| Customer | Complaints only | `/quality/capa` denied; CC-2026-0009 hides INTERNAL RCA | PASS |
| Quality Inspector | No Admin | `/admin/users` denied | PASS |

## Summary

| Status | Count (sidebar + extras) |
|---|---|
| PASS | 25 |
| FIXED | 35 |
| PARTIAL | 3 |
| BLOCKED | 0 |
| UNKNOWN | 0 |
