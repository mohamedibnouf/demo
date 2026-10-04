import { SignJWT } from "jose";

const secret = new TextEncoder().encode("samco-demo-auth-secret-change-in-production-32b");
const user = {
  id: "u-qm",
  email: "quality.manager@samco.demo",
  fullName: "Khalid Al-Harbi",
  role: "Quality Manager",
  roleId: "r-qm",
  departmentId: "d-qa",
  supplierId: null,
  customerId: null,
  title: "Quality Manager",
  locale: "en",
};
const token = await new SignJWT({ user })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(secret);
const cookie = `samco_session=${token}`;

const insp = await (await fetch("http://localhost:3000/quality/production-inspection/insp-0041", { headers: { cookie } })).text();
const ids = [...insp.matchAll(/"id":"([a-f0-9]{40})"/g)].map((m) => m[1]);
console.log("inspection action ids", [...new Set(ids)]);
console.log("Create NCR", insp.includes("Create NCR"));
console.log("Move/Submit", /Move to|Submit/.test(insp));

const tasks = await (await fetch("http://localhost:3000/tasks", { headers: { cookie } })).text();
console.log("Upcoming Tasks", tasks.includes("Upcoming Tasks"));
console.log("My Tasks", tasks.includes("My Tasks"));
console.log("COPQ", tasks.includes("COPQ"));
console.log("calibration", tasks.includes("calibration") || tasks.includes("CAL-0042"));

const all = await (await fetch("http://localhost:3000/tasks?filter=all", { headers: { cookie } })).text();
console.log("all filter calibration", all.includes("CAL-0042") || all.includes("calibration"));
console.log("all filter NCR-2026-0012", all.includes("NCR-2026-0012"));
