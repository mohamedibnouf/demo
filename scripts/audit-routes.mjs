import { SignJWT } from "jose";
import { writeFileSync } from "fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const secret = new TextEncoder().encode("samco-demo-auth-secret-change-in-production-32b");

const NAV = [
  ["Dashboard", "/"],
  ["Production Inspection", "/quality/production-inspection"],
  ["Production NCR", "/quality/production-ncr"],
  ["Supplier NCR", "/quality/supplier-ncr"],
  ["Customer Complaints", "/quality/customer-complaints"],
  ["Internal NCR", "/quality/internal-ncr"],
  ["CAPA", "/quality/capa"],
  ["Deviation", "/quality/deviation"],
  ["Sample Evaluation", "/quality/sample-evaluation"],
  ["ECN", "/quality/ecn"],
  ["Incoming Inspection", "/quality/incoming-inspection"],
  ["In-Process Inspection", "/quality/in-process-inspection"],
  ["Final Inspection", "/quality/final-inspection"],
  ["Rework", "/quality/rework"],
  ["RRR", "/quality/rrr"],
  ["Calibration / Monitoring", "/quality/calibration"],
  ["CPU Coil", "/logbooks/cpu-coil"],
  ["AHU Coil", "/logbooks/ahu-coil"],
  ["Paint Shop", "/logbooks/paint-shop"],
  ["Oven Tracker", "/logbooks/oven-tracker"],
  ["Destructive Tests", "/logbooks/destructive-tests"],
  ["IMS Objectives", "/ims/objectives"],
  ["Risk & Opportunity", "/ims/risk-opportunity"],
  ["Annual Audit Plan", "/ims/annual-audit-plan"],
  ["Internal Audit", "/ims/internal-audit"],
  ["External Audit", "/ims/external-audit"],
  ["Customer Audit", "/ims/customer-audit"],
  ["Supplier Audit", "/ims/supplier-audit"],
  ["Audit Findings", "/ims/audit-findings"],
  ["Management Review", "/ims/management-review"],
  ["Quality Dashboard", "/performance/quality-dashboard"],
  ["Management Dashboard", "/performance/management-dashboard"],
  ["KPI & Reports", "/performance/kpi-reports"],
  ["COPQ", "/performance/copq"],
  ["Supplier SPPM", "/performance/supplier-sppm"],
  ["Customer FFR / PPM", "/performance/customer-ffr"],
  ["Production Constraints", "/performance/production-constraints"],
  ["AI Quality Assistant", "/ai-assistant"],
  ["Users", "/admin/users"],
  ["Roles & Permissions", "/admin/roles"],
  ["Master Data", "/admin/master-data"],
  ["Workflow Configuration", "/admin/workflows"],
  ["Numbering Configuration", "/admin/numbering"],
  ["Excel Integration", "/admin/excel"],
  ["Notification Configuration", "/admin/notifications"],
  ["Audit Trail", "/admin/audit-trail"],
  ["Reports", "/reports"],
  ["Tasks", "/tasks"],
  ["Smart Risks", "/risks"],
  ["Notifications", "/notifications"],
  ["Search NCR", "/search?q=NCR-2026-0012"],
  ["Search serial", "/search?q=SN-AHU-2026-1842"],
  ["Search CAPA", "/search?q=CAPA-2026-0008"],
  ["Search CAL", "/search?q=CAL-0042"],
  ["Demo guide", "/demo-guide"],
  ["Documents", "/documents/analyze"],
  ["NCR detail", "/quality/production-ncr/ncr-0012"],
  ["CAPA detail", "/quality/capa/capa-0008"],
  ["SNCR detail", "/quality/supplier-ncr/sncr-0004"],
  ["Complaint detail", "/quality/customer-complaints/cc-0009"],
  ["Inspection detail", "/quality/production-inspection/insp-0041"],
  ["Internal audit detail", "/ims/internal-audit/aud-3"],
  ["Finding detail", "/ims/audit-findings/af-0007"],
  ["Calibration detail", "/quality/calibration/eq-42"],
  ["Profile", "/profile"],
  ["PC detail", "/performance/production-constraints/pc-0007"],
  ["Serial trace", "/trace/serial/SN-AHU-2026-1842"],
  ["Search complaint", "/search?q=Complaint"],
  ["Search audit", "/search?q=AUD"],
];

async function cookieFor(role, extra = {}) {
  const user = {
    id: extra.id ?? "u-qm",
    email: extra.email ?? "quality.manager@samco.demo",
    fullName: extra.fullName ?? "Khalid Al-Harbi",
    role,
    roleId: extra.roleId ?? "r-qm",
    departmentId: extra.departmentId ?? "d-qa",
    supplierId: extra.supplierId ?? null,
    customerId: extra.customerId ?? null,
    title: role,
    locale: "en",
  };
  const token = await new SignJWT({ user }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret);
  return `samco_session=${token}`;
}

function problems(html, status) {
  const issues = [];
  if (status >= 500) issues.push(`HTTP ${status}`);
  if (status === 404) issues.push("HTTP 404");
  if (html.includes("Functions cannot be passed directly to Client Components")) issues.push("RSC function crash");
  if (html.includes("Application error")) issues.push("Application error");
  if (html.includes("Unhandled Runtime Error")) issues.push("Runtime error");
  if (html.includes("Coming Soon") || html.includes("Not Implemented")) issues.push("placeholder");
  if (html.length < 2000 && status === 200) issues.push("suspiciously small page");
  return issues;
}

const qm = await cookieFor("Quality Manager");
const rows = [];
for (const [label, path] of NAV) {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie: qm }, redirect: "manual" });
  const html = await res.text();
  const issues = problems(html, res.status);
  const ok = res.status === 200 && issues.length === 0;
  rows.push({ label, path, status: res.status, ok, issues, len: html.length, titleHit: html.includes(label.split(" ")[0]) });
  console.log(`${ok ? "PASS" : "FAIL"} ${res.status} ${path} ${issues.join(",")}`);
}

const roles = [
  ["Quality Inspector", { id: "u-qi", email: "inspector@samco.demo", roleId: "r-qi" }, "/admin/users", true],
  ["Supplier", { id: "u-sup", email: "supplier@samco.demo", roleId: "r-supplier", supplierId: "s-alpha", departmentId: null }, "/quality/production-ncr", true],
  ["Customer", { id: "u-cust", email: "customer@samco.demo", roleId: "r-customer", customerId: "c-gulf", departmentId: null }, "/quality/capa", true],
  ["Management", { id: "u-mgmt", email: "management@samco.demo", roleId: "r-mgmt", departmentId: "d-mgmt", fullName: "Abdullah Al-Saud" }, "/quality/production-ncr/ncr-0012", false],
];

const roleChecks = [];
for (const [role, extra, path, expectDenied] of roles) {
  const cookie = await cookieFor(role, extra);
  const res = await fetch(`${BASE}${path}`, { headers: { cookie } });
  const html = await res.text();
  const denied = html.includes("not authorized") || html.includes("isolation") || html.includes("read-only") || html.includes("Management may view") || html.includes("Administration access");
  const pass = expectDenied ? denied : res.status === 200;
  roleChecks.push({ role, path, expectDenied, denied, status: res.status, pass });
  console.log(`${pass ? "PASS" : "FAIL"} role ${role} ${path} denied=${denied}`);
}

writeFileSync("data/route-audit-run.json", JSON.stringify({ rows, roleChecks }, null, 2));
const failed = rows.filter((r) => !r.ok);
console.log(`\nRoutes ${rows.length - failed.length}/${rows.length} OK`);
if (failed.length) process.exitCode = 1;
