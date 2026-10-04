import { test, expect } from "@playwright/test";
import { assertHealthy, login, openRecord, openSidebarItem } from "./helpers";

test.describe("Primary module journeys", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("NCR list → open → create draft → reopen from list", async ({ page }) => {
    await openSidebarItem(page, "Production NCR");
    await openRecord(page, "NCR-2026-0012");
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-0012$/);
    await expect(page.getByRole("heading", { name: "NCR-2026-0012" })).toBeVisible();
    await page.getByRole("button", { name: "Related Records" }).click();
    await expect(page.getByRole("link", { name: /CAPA CAPA-2026-0008|NCR NCR-2026-0012|SNCR SNCR-2026-0004/ }).first()).toBeVisible();
    await openSidebarItem(page, "Production NCR");
    await page.getByRole("button", { name: "Create Production NCR" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-/);
    const number = (await page.locator("main h1").innerText()).trim();
    await openSidebarItem(page, "Production NCR");
    await openRecord(page, number);
    await expect(page.locator("main h1")).toHaveText(number);
    await assertHealthy(page);
  });

  test("CAPA list → open → originating record", async ({ page }) => {
    await openSidebarItem(page, "CAPA");
    await openRecord(page, "CAPA-2026-0008");
    await expect(page).toHaveURL(/\/quality\/capa\/capa-0008$/);
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.getByRole("link", { name: /SNCR-2026-0004|SNCR SNCR-2026-0004/ }).first().click();
    await expect(page).toHaveURL(/\/quality\/supplier-ncr\/sncr-0004$/);
    await expect(page.getByRole("heading", { name: "SNCR-2026-0004" })).toBeVisible();
  });

  test("Inspection list → open → related quality records", async ({ page }) => {
    await openSidebarItem(page, "Production Inspection");
    await page.locator('a[href="/quality/production-inspection/insp-0041"]').first().click();
    await expect(page).toHaveURL(/\/quality\/production-inspection\/insp-0041$/);
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.getByRole("link", { name: "NCR NCR-2026-0012" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-0012$/);
  });

  test("Audit finding → related CAPA", async ({ page }) => {
    await openSidebarItem(page, "Audit Findings");
    await openRecord(page, "AF-2026-0007");
    await expect(page).toHaveURL(/\/ims\/audit-findings\/af-0007$/);
    await page.getByRole("button", { name: "Create CAPA Draft" }).click();
    await expect(page).toHaveURL(/\/quality\/capa\/capa-/);
    await expect(page.getByRole("button", { name: "Related Records" })).toBeVisible();
  });

  test("Tasks filters → target record", async ({ page }) => {
    await openSidebarItem(page, "Tasks");
    await page.getByRole("link", { name: "Department / All" }).click();
    await expect(page).toHaveURL(/filter=all/);
    await page.getByRole("link", { name: "Due Soon" }).click();
    await expect(page).toHaveURL(/filter=soon/);
    await page.getByRole("link", { name: "Overdue", exact: true }).click();
    await expect(page).toHaveURL(/filter=overdue/);
    await page.getByRole("link", { name: "My Tasks" }).click();
    await page.getByRole("link", { name: "Complete RCA on NCR-2026-0012" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-0012$/);
  });

  test("Notifications drawer and page open target record", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click();
    await page.getByRole("banner").getByRole("link", { name: "New NCR" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-0012$/);
    await page.goto("/notifications");
    await page.getByRole("link", { name: "New NCR" }).first().click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-0012$/);
  });

  test("Dashboard KPI and View All drill-down", async ({ page }) => {
    await openSidebarItem(page, "Dashboard");
    await page.getByRole("link", { name: /NCR Open/ }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr$/);
    await openSidebarItem(page, "Dashboard");
    await page.getByRole("main").getByRole("link", { name: "View All" }).click();
    await expect(page).toHaveURL(/\/tasks/);
    await openSidebarItem(page, "Dashboard");
    await page.getByRole("link", { name: "Open risk engine" }).click();
    await expect(page).toHaveURL(/\/risks$/);
  });

  test("Search results open valid records", async ({ page }) => {
    await page.locator('form').filter({ has: page.locator('input[name="q"]') }).locator('input[name="q"]').fill("NCR-2026-0012");
    await page.locator('form').filter({ has: page.locator('input[name="q"]') }).locator('input[name="q"]').press("Enter");
    await expect(page).toHaveURL(/search\?q=NCR-2026-0012/);
    await page.getByRole("link", { name: "NCR-2026-0012" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-0012$/);
    await page.goto("/search?q=SN-AHU-2026-1842");
    await page.getByRole("link", { name: "SN-AHU-2026-1842" }).click();
    await expect(page).toHaveURL(/\/trace\/serial\/SN-AHU-2026-1842$/);
  });

  test("Table search, status filter, and pagination", async ({ page }) => {
    await openSidebarItem(page, "Production NCR");
    await page.getByPlaceholder("Search this table").fill("NCR-2026-0012");
    await expect(page.getByRole("link", { name: "NCR-2026-0012" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByLabel("Filter by status").selectOption("Draft");
    await expect(page.getByText(/\d+ records/)).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    const next = page.getByRole("button", { name: "Next" });
    if (await next.isEnabled()) {
      await next.click();
      await expect(page.getByText(/2 \/ /)).toBeVisible();
      await page.getByRole("button", { name: "Prev" }).click();
    }
  });

  test("Inspection create draft with validation", async ({ page }) => {
    await openSidebarItem(page, "Production Inspection");
    await page.getByRole("textbox", { name: /Defect description/ }).fill("E2E nitrogen decay confirmation");
    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page).toHaveURL(/\/quality\/production-inspection\/insp-/);
    await expect(page.getByRole("heading", { name: /INSP-2026-/ })).toBeVisible();
  });
});
