import { SignJWT } from "jose";

const secret = new TextEncoder().encode("samco-demo-auth-secret-change-in-production-32b");

async function session(role, extra = {}) {
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

async function page(path, cookie) {
  const res = await fetch(`http://localhost:3000${path}`, { headers: { cookie } });
  return { status: res.status, html: await res.text() };
}

const qm = await session("Quality Manager");
const mgmt = await session("Management", { id: "u-mgmt", email: "management@samco.demo", roleId: "r-mgmt", departmentId: "d-mgmt", fullName: "Abdullah Al-Saud" });

const ncrDraft = await page("/quality/production-ncr/ncr-0015", qm);
console.log("QM draft NCR Save Draft", ncrDraft.html.includes("Save Draft"));
console.log("QM draft NCR Submit", ncrDraft.html.includes("Submit"));
console.log("QM draft NCR Create CAPA", ncrDraft.html.includes("Create CAPA Draft"));

const capaDraft = await page("/quality/capa/capa-0010", qm);
console.log("QM draft CAPA Move to Open", capaDraft.html.includes("Move to Open"));
console.log("QM draft CAPA Move to Submitted (should be false)", capaDraft.html.includes("Move to Submitted"));

const capaOpen = await page("/quality/capa/capa-0008", qm);
console.log("QM open CAPA Move to Pending Verification", capaOpen.html.includes("Pending Verification"));

const ncrMgmt = await page("/quality/production-ncr/ncr-0012", mgmt);
console.log("Management NCR read-only message", ncrMgmt.html.includes("read-only") || ncrMgmt.html.includes("Management may view"));
console.log("Management NCR no Submit", !ncrMgmt.html.includes(">Submit<") && !ncrMgmt.html.includes("Move to Action Required"));

const dash = await page("/", qm);
console.log("QM dashboard Complete RCA task", dash.html.includes("Complete RCA on NCR-2026-0012"));
console.log("QM dashboard CAL-0042 task", dash.html.includes("CAL-0042"));
console.log("QM dashboard Welcome Khalid", dash.html.includes("Khalid Al-Harbi"));

const tasks = await page("/tasks", qm);
console.log("QM my tasks NCR-2026-0012", tasks.html.includes("NCR-2026-0012"));
console.log("QM my tasks CAL-0042", tasks.html.includes("CAL-0042"));
