# SAMCO IMS/QMS — Interaction Audit

**Verified:** 4 October 2026 on `http://localhost:3000` (existing production server, not restarted)  
**Playwright:** 78/78 PASS after locator tightening

## Method

Every visible sidebar item was opened from the **actual** `NAV` config via the desktop `aside` navigation (exact link name). List modules were required to show a record count and a working **View** (exact name, so it cannot match “Management Review”). Seeded journeys then exercised Create / Related Records / filters / search / notifications / roles.

## Broken interactions found in this pass

| Page | Control | Expected Behavior | Previous Problem | Fix | Verification Result |
|---|---|---|---|---|---|
| All list pages | Playwright `getByRole('link', { name: 'View' })` | Open the row | Locator substring-matched sidebar **Management Review** and navigated there | Tests now use `{ name: 'View', exact: true }` | Sidebar 49/49 + View journeys PASS |
| Production Inspection list | Search `INSP-2026-0041` then first named link | Open insp-0041 | Persisted E2E-created inspections confused the first-match click | Click `a[href="/quality/production-inspection/insp-0041"]` | PASS |
| Full-page HTML health check | `assertHealthy(html)` | Detect real 404/500 copy | Next.js bundles contain the string “This page could not be found” | Assert against **visible `main` text** only | Smoke + sidebar PASS |

No new dead **application** buttons were found on the running build. The following were already fixed in the prior reliability pass and re-verified here:

| Page | Control | Expected | Prior problem | Re-verified |
|---|---|---|---|---|
| Catalog lists | Create | Draft → detail → list | Missing | NCR create→reopen PASS |
| Documents | Create NCR Draft | Opens NCR | Created CAPA | Not re-clicked this pass; server action still maps `ncr`→NCR |
| Header bell | Drawer | Unread / mark / open / View All | Bare link | PASS |
| PC table | View | PC detail | No route | PASS (`pc-0007`) |
| Search serial/order | Result link | Trace page | Generic list / Admin | PASS |
| Dashboard KPI / View All | Drill-down | Correct module | — | PASS |
| Reports / Management cards | Click | Navigate | Inert | Covered by sidebar + dashboard |
| Tasks | Filter + row | Target record | — | PASS (My Tasks → NCR-2026-0012) |
| Notifications | Drawer + page | Target NCR | — | PASS |

## Primary journeys verified

| Journey | Steps | Result |
|---|---|---|
| NCR | Sidebar → NCR-2026-0012 → Related → Create draft → reopen | PASS |
| CAPA | List → CAPA-2026-0008 → Related → SNCR-2026-0004 | PASS |
| Inspection | List → insp-0041 → Related → NCR-2026-0012 | PASS |
| Audit | Internal AUD-2026-0003 → Finding AF-2026-0007 → Create CAPA | PASS |
| Tasks | All / Due Soon / Overdue / My Tasks → NCR | PASS |
| Notifications | Drawer New NCR + page New NCR | PASS |
| Dashboard | NCR Open, View All, Open risk engine | PASS |
| Search | NCR-2026-0012 + SN-AHU-2026-1842 | PASS |
| Table chrome | Search, status filter, Clear, Next/Prev | PASS |
| Inspection create | Required defect + Save Draft | PASS |
| Alpha chain | Inspection → PC → NCR → SNCR → CAPA | PASS |
| Complaint | CC-2026-0009 → serial → CAPA origin | PASS |
| ECN | ECN-2026-0004 overview fields | PASS |
| Calibration | CAL-0042 | PASS |

## Source scan (href / push / Link / onClick)

Visible interactive targets in `src/` resolve to existing App Router pages (`/quality/*`, `/ims/*`, `/performance/*`, `/logbooks/*`, `/admin/*`, `/trace/*`, `/tasks`, `/risks`, `/search`, `/profile`, `/notifications`). No leftover “Coming Soon” / “Not Implemented” pages. Seeded task and notification `href` values point at live records.

## Intentionally limited (not dead)

| Control | Reason |
|---|---|
| Calibration Create | Equipment master — omitted on purpose |
| Management Create / workflow | Read-only; server `guard()` |
| QM Reset Demo | Admin only |
| Customer internal RCA | Stripped from projection |
| Supplier other-supplier SNCR | Isolation |
| EN/AR | Direction only |
| Charts | Display-only; KPI cards drill down |
| Document upload | Metadata stub |
| AI | Advisory mock unless API key |
| Notification configuration | Documented rules, not an editor |
| Most Create buttons | Demo **draft shell**, not a full field-edit wizard |

## Remaining BLOCKED

None for currently visible navigation or the seeded demo chains.

## Counts used in the final report

- Sidebar items: **49**
- Playwright tests: **78**
- Primary interactions exercised in Playwright: **120+** (49 nav clicks, 26 View/detail, plus create/filter/search/notify/role/cross-module actions)
