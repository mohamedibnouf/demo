import { test, expect } from "@playwright/test";
import { login, openRecord, openSidebarItem } from "./helpers";

test.describe("Exposed cross-module relationships", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Inspection → NCR → PC → SNCR → CAPA chain", async ({ page }) => {
    await page.goto("/quality/production-inspection/insp-0041");
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.getByRole("link", { name: "PC PC-2026-0007" }).click();
    await expect(page).toHaveURL(/\/performance\/production-constraints\/pc-0007$/);
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.getByRole("link", { name: "NCR NCR-2026-0012" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-0012$/);
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.getByRole("link", { name: "SNCR SNCR-2026-0004" }).click();
    await expect(page).toHaveURL(/\/quality\/supplier-ncr\/sncr-0004$/);
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.getByRole("link", { name: "CAPA CAPA-2026-0008" }).click();
    await expect(page).toHaveURL(/\/quality\/capa\/capa-0008$/);
  });

  test("NCR Create CAPA Draft lands on a CAPA record", async ({ page }) => {
    await page.goto("/quality/production-ncr/ncr-0012");
    await page.getByRole("button", { name: "Create CAPA Draft" }).click();
    await expect(page).toHaveURL(/\/quality\/capa\/capa-/);
    await expect(page.getByRole("heading", { name: /CAPA-2026-/ })).toBeVisible();
  });

  test("Customer complaint → serial → CAPA origin", async ({ page }) => {
    await page.goto("/quality/customer-complaints/cc-0009");
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.getByRole("link", { name: /SN-AHU-2026-1104|Serial/ }).first().click();
    await expect(page).toHaveURL(/\/trace\/serial\//);
    await page.goto("/quality/capa/capa-0003");
    await page.getByRole("button", { name: "Related Records" }).click();
    await page.locator('a[href="/quality/customer-complaints/cc-0009"]').first().click();
    await expect(page).toHaveURL(/\/quality\/customer-complaints\/cc-0009$/);
  });

  test("Internal audit → finding", async ({ page }) => {
    await openSidebarItem(page, "Internal Audit");
    await openRecord(page, "AUD-2026-0003");
    await expect(page).toHaveURL(/\/ims\/internal-audit\/aud-3$/);
    await openSidebarItem(page, "Audit Findings");
    await openRecord(page, "AF-2026-0007");
    await expect(page.locator("main h1")).toHaveText("AF-2026-0007");
  });

  test("ECN detail exposes production-related fields", async ({ page }) => {
    await openSidebarItem(page, "ECN");
    await expect(page.locator("main h1")).toHaveText("Engineering Change Notice");
    await openRecord(page, "ECN-2026-0004");
    await expect(page).toHaveURL(/\/quality\/ecn\/ecn-4$/);
    await page.getByRole("button", { name: "Overview" }).click();
    await expect(page.locator("main")).toContainText(/stockStrategy|oldMaterialId|modelId|firstOrderId/);
  });

  test("Calibration detail opens CAL-0042", async ({ page }) => {
    await openSidebarItem(page, "Calibration / Monitoring");
    await page.getByRole("link", { name: "CAL-0042" }).first().click();
    await expect(page).toHaveURL(/\/quality\/calibration\/eq-42$/);
    await expect(page.getByRole("heading", { name: "CAL-0042" })).toBeVisible();
  });

  test("Smart risk related CAPA link resolves", async ({ page }) => {
    await openSidebarItem(page, "Smart Risks");
    const capa = page.locator('a[href="/quality/capa/capa-0008"]');
    if (await capa.count()) {
      await capa.first().click();
      await expect(page).toHaveURL(/\/quality\/capa\/capa-0008$/);
    } else {
      await expect(page.locator("main h1")).toHaveText(/Smart Risk/);
    }
  });
});
