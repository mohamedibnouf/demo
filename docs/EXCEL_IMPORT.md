# Excel import

Two-step workbook import. Nothing is written to production/receiving/COPQ/NCR tables until **Confirm Import**.

## Profiles

| Profile | Typical headers |
|---|---|
| PRODUCTION_DATA | production order, serial, model, line, date, quantity, defect qty |
| RECEIVING_DATA | date, supplier, material PN, quantity |
| COPQ_DATA | date, department, scrap cost |
| NCR_DATA | source, defect, severity |
| GENERIC_EXCEL | stored/previewed only |

Headers are normalized (`Production Date` → `production_date`) and aliased (`quantity` → `quantity_produced`). If required-header confidence ≥ 0.7 the profile is auto-selected. Otherwise the user chooses a profile and corrects **SOURCE COLUMN → SAMCO FIELD**.

## Validation

Every row is classified Valid / Warning / Error. Failures are shown with row number, field, original value, problem, and suggested correction. Invalid rows are never imported.

Examples: required field missing, invalid date, non-numeric quantity, unknown production order / supplier / material / model, invalid serial, duplicate serial, unsupported status.

## Confirmation

Summary shows file, profile, rows, valid, warnings, invalid, records to create/update. Duplicate imports of the same checksum + profile are blocked.

## Domain integration

Confirmed PRODUCTION_DATA writes `production_records` (and new serials). Defect quantities create one `quality_events` row with a unique `source_event_id` (`excel_import`). Existing KPI engines count that event once. NCR/CAPA are not auto-created from production defects.

NCR_DATA creates **Draft** NCRs only.

The legacy Admin CSV textarea still validates/rejects invalid rows and does not invent business records beyond the existing import job log.
