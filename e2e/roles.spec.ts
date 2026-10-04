import { test, expect } from "@playwright/test";
import { ACCOUNTS, login, openSidebarItem, primaryNav } from "./helpers";

test.describe("Demo role visibility and direct-route authorization", () => {
  test("Quality Manager sees operational and view-only admin branches", async ({ page }) => {
    await login(page, ACCOUNTS.qm);
    await expect(primaryNav(page).getByRole("link", { name: "Production NCR", exact: true })).toBeVisible();
    await expect(primaryNav(page).getByRole("link", { name: "Users", exact: true })).toBeVisible();
    await expect(primaryNav(page).getByRole("link", { name: "Audit Trail", exact: true })).toBeVisible();
    await openSidebarItem(page, "Audit Trail");
    await expect(page.getByRole("heading", { name: "Audit Trail" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reset/ })).toHaveCount(0);
  });

  test("Admin can open Audit Trail and is not denied", async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await openSidebarItem(page, "Audit Trail");
    await expect(page.getByRole("heading", { name: "Audit Trail" })).toBeVisible();
    await expect(page.getByText(/not authorized/i)).toHaveCount(0);
  });

  test("Management can view NCR but cannot create or edit", async ({ page }) => {
    await login(page, ACCOUNTS.management);
    await expect(primaryNav(page).getByRole("link", { name: "Production NCR", exact: true })).toBeVisible();
    await expect(primaryNav(page).getByRole("link", { name: "Roles & Permissions", exact: true })).toHaveCount(0);
    await openSidebarItem(page, "Production NCR");
    await expect(page.getByRole("button", { name: "Create Production NCR" })).toHaveCount(0);
    await page.getByPlaceholder("Search this table").fill("NCR-2026-0012");
    await page.getByRole("link", { name: "NCR-2026-0012" }).first().click();
    await expect(page.getByText("Management may view and export only.")).toBeVisible();
    await page.goto("/admin/roles");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
  });

  test("Supplier sees only permitted branches and is denied internal NCR/CAPA", async ({ page }) => {
    await login(page, ACCOUNTS.supplier);
    await expect(page).toHaveURL(/\/quality\/supplier-ncr/);
    await expect(primaryNav(page).getByRole("link", { name: "Supplier NCR", exact: true })).toBeVisible();
    await expect(primaryNav(page).getByRole("link", { name: "Tasks", exact: true })).toBeVisible();
    await expect(primaryNav(page).getByRole("link", { name: "Production NCR", exact: true })).toHaveCount(0);
    await expect(primaryNav(page).getByRole("link", { name: "CAPA", exact: true })).toHaveCount(0);
    await page.goto("/quality/production-ncr");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
    await page.goto("/quality/capa");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
    await page.goto("/quality/supplier-ncr");
    await expect(page.getByRole("link", { name: "SNCR-2026-0004" }).first()).toBeVisible();
  });

  test("Customer sees complaints only and cannot open CAPA or internal RCA", async ({ page }) => {
    await login(page, ACCOUNTS.customer);
    await expect(page).toHaveURL(/\/quality\/customer-complaints/);
    await expect(primaryNav(page).getByRole("link", { name: "Customer Complaints", exact: true })).toBeVisible();
    await expect(primaryNav(page).getByRole("link", { name: "CAPA", exact: true })).toHaveCount(0);
    await expect(primaryNav(page).getByRole("link", { name: "Production NCR", exact: true })).toHaveCount(0);
    await page.goto("/quality/capa");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
    await page.goto("/quality/customer-complaints/cc-0009");
    await expect(page.getByRole("heading", { name: "CC-2026-0009" })).toBeVisible();
    await expect(page.getByText(/Brazing heat input low|INTERNAL/)).toHaveCount(0);
  });
});
