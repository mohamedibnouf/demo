import { test, expect } from "@playwright/test";
import { ACCOUNTS, assertHealthy, login } from "./helpers";

const SIDEBAR = [
  "/",
  "/quality/production-inspection",
  "/quality/production-ncr",
  "/quality/supplier-ncr",
  "/quality/customer-complaints",
  "/quality/internal-ncr",
  "/quality/capa",
  "/quality/deviation",
  "/quality/sample-evaluation",
  "/quality/ecn",
  "/quality/incoming-inspection",
  "/quality/in-process-inspection",
  "/quality/final-inspection",
  "/quality/rework",
  "/quality/rrr",
  "/quality/calibration",
  "/logbooks/cpu-coil",
  "/logbooks/ahu-coil",
  "/logbooks/paint-shop",
  "/logbooks/oven-tracker",
  "/logbooks/destructive-tests",
  "/ims/objectives",
  "/ims/risk-opportunity",
  "/ims/annual-audit-plan",
  "/ims/internal-audit",
  "/ims/external-audit",
  "/ims/customer-audit",
  "/ims/supplier-audit",
  "/ims/audit-findings",
  "/ims/management-review",
  "/performance/quality-dashboard",
  "/performance/management-dashboard",
  "/performance/kpi-reports",
  "/performance/copq",
  "/performance/supplier-sppm",
  "/performance/customer-ffr",
  "/performance/production-constraints",
  "/ai-assistant",
  "/admin/users",
  "/admin/roles",
  "/admin/master-data",
  "/admin/workflows",
  "/admin/numbering",
  "/admin/excel",
  "/admin/notifications",
  "/admin/audit-trail",
  "/reports",
  "/tasks",
  "/risks",
  "/notifications",
];

const DETAILS = [
  "/quality/production-ncr/ncr-0012",
  "/quality/capa/capa-0008",
  "/quality/supplier-ncr/sncr-0004",
  "/quality/customer-complaints/cc-0009",
  "/quality/production-inspection/insp-0041",
  "/performance/production-constraints/pc-0007",
  "/ims/internal-audit/aud-3",
  "/ims/audit-findings/af-0007",
  "/quality/calibration/eq-42",
  "/trace/serial/SN-AHU-2026-1842",
  "/profile",
];

test.describe("SAMCO navigation smoke", () => {
  test("Quality Manager can sign in and open dashboard", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await login(page);
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
    await assertHealthy(page);
    expect(errors).toEqual([]);
  });

  test("sidebar and detail routes render", async ({ page }) => {
    await login(page);
    for (const href of [...SIDEBAR, ...DETAILS, "/search?q=NCR-2026-0012", "/search?q=SN-AHU-2026-1842"]) {
      const res = await page.goto(href);
      expect(res?.ok(), href).toBeTruthy();
      await assertHealthy(page);
    }
  });

  test("NCR list opens a detail record", async ({ page }) => {
    await login(page);
    await page.goto("/quality/production-ncr");
    await page.getByPlaceholder("Search this table").fill("NCR-2026-0012");
    await page.getByRole("link", { name: "NCR-2026-0012" }).first().click();
    await expect(page).toHaveURL(/production-ncr\/ncr-0012/);
    await expect(page.getByRole("heading", { name: /NCR-2026-0012/ })).toBeVisible();
  });

  test("dashboard KPI card drills down", async ({ page }) => {
    await login(page);
    await page.goto("/");
    await page.getByRole("link", { name: /NCR Open/ }).click();
    await expect(page).toHaveURL(/production-ncr/);
  });

  test("notification drawer opens", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByRole("banner").getByRole("link", { name: "View All" })).toBeVisible();
    await expect(page.getByRole("banner").getByText(/Notifications|No notifications/)).toBeVisible();
  });

  test("Create NCR draft then open it from the list", async ({ page }) => {
    await login(page);
    await page.goto("/quality/production-ncr");
    await page.getByRole("button", { name: "Create Production NCR" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-/);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.getByRole("link", { name: "Production NCR" }).first().click();
    await expect(page).toHaveURL(/\/quality\/production-ncr$/);
    await expect(page.getByText(/NCR-2026-/).first()).toBeVisible();
  });

  test("Quality Inspector is denied administration", async ({ page }) => {
    await login(page, ACCOUNTS.inspector);
    await page.goto("/admin/users");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
  });
});
