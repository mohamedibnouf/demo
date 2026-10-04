import { writeFileSync } from "fs";

const BASE = "http://localhost:3000";
const results = [];

function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function hasCrash(html) {
  return (
    html.includes("Application error") ||
    html.includes("Functions cannot be passed directly to Client Components") ||
    html.includes("Unhandled Runtime Error") ||
    html.includes("Hydration failed") ||
    html.includes("Minified React error") ||
    html.includes(">Server Error<")
  );
}

async function login(email, password) {
  const jar = [];
  const loginPage = await fetch(`${BASE}/login`);
  const html = await loginPage.text();
  const action = html.match(/name="\$ACTION_ID_([^"]+)"/)?.[1];
  if (!action) throw new Error("Could not find login server action id");
  const body = new FormData();
  body.set(`$ACTION_ID_${action}`, "");
  body.set("email", email);
  body.set("password", password);
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { Accept: "text/x-component, text/html" },
  });
  const setCookie = res.headers.getSetCookie?.() ?? (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  for (const c of setCookie) {
    const part = c.split(";")[0];
    if (part) jar.push(part);
  }
  return {
    status: res.status,
    location: res.headers.get("location"),
    cookies: jar,
    html: await res.text(),
    action,
  };
}

async function get(path, cookies) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: cookies.join("; ") },
    redirect: "manual",
  });
  const html = await res.text();
  return { status: res.status, location: res.headers.get("location"), html, len: html.length };
}

const bad = await login("quality.manager@samco.demo", "wrong-password");
log("Auth rejects invalid password", bad.status === 303 && (bad.location ?? "").includes("error=1"), `status=${bad.status} loc=${bad.location}`);

const good = await login("quality.manager@samco.demo", "SamcoDemo@2026");
const authed = good.cookies.some((c) => c.startsWith("samco_session="));
log(
  "Auth accepts quality.manager@samco.demo / SamcoDemo@2026",
  authed && good.status >= 300 && good.status < 400 && (good.location === "/" || (good.location ?? "").endsWith("/")),
  `status=${good.status} loc=${good.location} cookie=${authed}`,
);

const cookies = good.cookies;
const pages = [
  ["Dashboard", "/", ["Welcome", "Quality Management System - SAMCO", "Production PPM", "Smart Quality Insights"]],
  ["Production NCR list", "/quality/production-ncr", ["Production NCR", "NCR-2026-0012"]],
  ["Production NCR detail", "/quality/production-ncr/ncr-0012", ["NCR-2026-0012", "Investigation", "QE-2026-0018"]],
  ["Draft NCR detail", "/quality/production-ncr/ncr-0015", ["NCR-2026-0015", "Draft"]],
  ["CAPA list", "/quality/capa", ["CAPA", "CAPA-2026-0008"]],
  ["CAPA detail", "/quality/capa/capa-0008", ["CAPA-2026-0008", "In Progress", "SNCR-2026-0004"]],
  ["Tasks", "/tasks", ["Upcoming Tasks", "My Tasks"]],
  ["Tasks all", "/tasks?filter=all", ["CAL-0042", "NCR-2026-0012"]],
  ["Notifications", "/notifications", ["Notification Center", "NCR-2026-0012"]],
  ["Inspection (create-NCR source)", "/quality/production-inspection/insp-0041", ["INSP-2026-0041", "Create NCR"]],
];

const snapshots = {};
for (const [name, path, needles] of pages) {
  const page = await get(path, cookies);
  snapshots[path] = page;
  const crash = hasCrash(page.html);
  const missing = needles.filter((n) => !page.html.includes(n));
  log(`${name} ${path}`, page.status === 200 && !crash && missing.length === 0, `status=${page.status} crash=${crash} missing=${missing.join("|") || "none"} len=${page.len}`);
}

const ncrList = snapshots["/quality/production-ncr"];
log("NCR list has no Client-function crash", ncrList && !ncrList.html.includes("Functions cannot be passed directly"), ncrList ? `status=${ncrList.status}` : "missing");
const capaList = snapshots["/quality/capa"];
log("CAPA list has no Client-function crash", capaList && !capaList.html.includes("Functions cannot be passed directly"), capaList ? `status=${capaList.status}` : "missing");

const dash = snapshots["/"];
log("Dashboard KPI cards render", Boolean(dash?.html.includes("Production PPM") && dash.html.includes("NCR Open") && dash.html.includes("FPY")), "");
log("Quality Manager sees operational actions on NCR", Boolean(snapshots["/quality/production-ncr/ncr-0012"]?.html.includes("Move to") || snapshots["/quality/production-ncr/ncr-0012"]?.html.includes("Create CAPA")), "");
log("Quality Manager sees CAPA workflow actions", Boolean(snapshots["/quality/capa/capa-0008"]?.html.includes("Move to") || snapshots["/quality/capa/capa-0008"]?.html.includes("Pending Verification")), "");

const ncrCreateOnList = ncrList?.html.includes("New production NCR") || ncrList?.html.includes("Create NCR");
log("Standalone Create NCR form on list page", Boolean(ncrCreateOnList), ncrCreateOnList ? "present" : "not present — create is from inspection / document only");

const capaCreateOnList = capaList?.html.includes("New CAPA") || capaList?.html.includes("Create CAPA");
log("Standalone Create CAPA form on list page", Boolean(capaCreateOnList), capaCreateOnList ? "present" : "not present — create is from originating record");

const ncrDetail = snapshots["/quality/production-ncr/ncr-0012"]?.html ?? "";
log("NCR detail shows related source event", ncrDetail.includes("QE-2026-0018"), "");
log("NCR detail shows timeline/audit section", ncrDetail.includes("Timeline") || ncrDetail.includes("Audit History"), "");
log("NCR detail shows status badge Investigation", ncrDetail.includes("Investigation"), "");

const capaDetail = snapshots["/quality/capa/capa-0008"]?.html ?? "";
log("CAPA shows originating SNCR label", capaDetail.includes("SNCR-2026-0004") || capaDetail.includes("originLabel"), "");
log("CAPA shows owner / due date fields", capaDetail.includes("ownerId") && capaDetail.includes("dueDate"), "");
log("CAPA shows In Progress status", capaDetail.includes("In Progress"), "");

const unauth = await fetch(`${BASE}/quality/production-ncr`, { redirect: "manual" });
log("Unauthenticated NCR list redirects to login", unauth.status === 307 && (unauth.headers.get("location") ?? "").includes("/login"), `status=${unauth.status}`);

writeFileSync("data/verify-last.json", JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
