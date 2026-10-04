# Demo script (15–20 minutes)

Open `/demo-guide` while presenting. Login as **quality.manager@samco.demo** / `SamcoDemo@2026`.

## 1. Dashboard (2 min)

- Greeting, date/time, Demo Environment badge
- KPI cards: Production PPM, Customer PPM, Supplier SPPM, NCR Open, FFR, FPY, COPQ, PC
- Click Production PPM and FPY to show drill-down
- Combination chart by family (WRAC, DFS, PAC, FCU, AHU, LSS)
- Point out Smart Quality Insights (leakage trend, Alpha Components, CAPA due, CAL-0042)

## 2. Scenario A — Supplier defect (5 min)

1. Production Inspection `INSP-2026-0041` — component defect, Material PN, supplier required  
2. Failed inspection created Quality Event `QE-2026-0018`  
3. Production Constraint `PC-2026-0007`  
4. Production NCR `NCR-2026-0012`  
5. Supplier NCR `SNCR-2026-0004`  
6. Switch to `supplier@samco.demo` — only Alpha records  
7. CAPA `CAPA-2026-0008` linked to the same `source_event_id`  
8. `/risks` — repeated supplier deterioration  
9. Dashboard SPPM reflects one original defect, not four  
10. `/ai-assistant` — similar previous leakage/component cases  
11. Traceability graph from NCR → serial → receiving → CAPA

## 3. Scenario B — Calibration (2 min)

- Equipment `CAL-0042` due in 4 days  
- Task + notification + risk flag  
- AI recommends scheduling  
- Show that expired / out-of-calibration equipment blocks controlled inspection submit

## 4. Scenario C — Customer complaint (3 min)

- `customer@samco.demo` submits / views leakage complaint on a known serial  
- Serial resolves production history  
- Quality Manager sees internal investigation; customer does not  
- FFR PPM and Smart Insight for noise/leakage trend  
- Optional: create CAPA draft from complaint

## 5. Scenario D — Audit (2 min)

- Annual plan → Internal Audit checklist (ISO 9001 clauses)  
- NC finding → task for responsible employee  
- Due / overdue notification + risk  
- Optional CAPA (not auto-created)  
- Management Review input

## 6. Excel, AI, Admin (3 min)

- Administration → Excel Integration — New Import + validation errors  
- `/documents/analyze` — create Task / Risk / NCR / CAPA **drafts**  
- Management dashboard (read-only)  
- Admin: numbering, roles, reset demo data

## 7. FILE INTELLIGENCE DEMO

### Scenario A — Production Excel

1. Login Quality Manager  
2. Documents → Upload & Analyze  
3. Upload `fixtures/file-intelligence/production-demo.xlsx`  
4. Profile detects Production  
5. Preview sheet + row validation (valid / warning / invalid)  
6. Confirm Import — invalid rows stay out  
7. Open Dashboard / Quality Dashboard and note that imported quantity and any imported defect event use the existing KPI stores (no parallel fake source)

### Scenario B — Quality report PDF

1. Documents → Upload & Analyze  
2. Upload `fixtures/file-intelligence/quality-report-demo.pdf`  
3. Extracted text + identifiers (NCR-2026-0012, serial, supplier)  
4. Analyze with AI (LIVE if a key is set, otherwise DEMO)  
5. Show potential risk / nonconformity  
6. Create NCR Draft — human review required  
7. Open the new NCR; source document remains linked

## Close

Remind the audience: AI is advisory; controlled records require authorized SAMCO personnel; KPI engines anti-double-count original quality events.
