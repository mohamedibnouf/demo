import { test, expect } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";
import XLSX from "xlsx";
import { ACCOUNTS, assertHealthy, login, openSidebarItem } from "./helpers";

const FIX = path.join(process.cwd(), "fixtures", "file-intelligence");

function uniqueProductionWorkbook() {
  const stamp = String(1000 + (Date.now() % 8000)).padStart(4, "0");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["production_date", "production_order", "model", "line", "quantity", "serial_number", "shift", "defect_quantity", "process_defect", "defect_type", "inspector", "status"],
      ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "2", `SN-AHU-2026-${stamp}`, "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
      ["2026-10-03", "PO-2026-2408", "AHU-S15", "L-AHU", "1", `SN-AHU-2026-${String((Number(stamp) + 1) % 10000).padStart(4, "0")}`, "A", "1", "Yes", "Leakage", "Khalid Al-Harbi", "Fail"],
      ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "1", `SN-AHU-2026-${String((Number(stamp) + 2) % 10000).padStart(4, "0")}`, "B", "0", "No", "", "Night Inspector", "Pass"],
      ["2026-10-03", "", "AHU-P25", "L-AHU", "1", `SN-AHU-2026-${String((Number(stamp) + 3) % 10000).padStart(4, "0")}`, "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
      ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "twelve", `SN-AHU-2026-${String((Number(stamp) + 4) % 10000).padStart(4, "0")}`, "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
      ["2026-10-03", "PO-2026-2409", "AHU-XX", "L-AHU", "1", "BAD", "A", "0", "No", "", "Khalid Al-Harbi", "Weird"],
      ["2026-10-03", "PO-2026-2409", "AHU-P25", "L-AHU", "1", `SN-AHU-2026-${stamp}`, "A", "0", "No", "", "Khalid Al-Harbi", "Pass"],
    ]),
    "Production Data",
  );
  const file = path.join(os.tmpdir(), `production-demo-${Date.now()}.xlsx`);
  XLSX.writeFile(wb, file);
  return file;
}

test.describe("File intelligence", () => {
  test("Documents page lists seeded records and opens detail", async ({ page }) => {
    await login(page);
    await openSidebarItem(page, "Documents");
    await expect(page.locator("main h1")).toHaveText("Documents");
    await expect(page.getByText(/ALPHA-8D-229|DOC-2026-0001|DOC-doc-1/).first()).toBeVisible();
    await page.getByPlaceholder("Search this table").fill("ALPHA-8D-229");
    await page.getByRole("link", { name: "View", exact: true }).first().click();
    await expect(page).toHaveURL(/\/documents\/doc-1$/);
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await page.getByRole("button", { name: "Analysis" }).click();
    await expect(page.getByText(/AI Mode:/)).toBeVisible();
    await assertHealthy(page);
  });

  test("Upload & Analyze accepts Excel, previews, validates, and confirms import", async ({ page }) => {
    await login(page);
    await openSidebarItem(page, "Upload & Analyze");
    await expect(page.locator("main h1")).toHaveText("Upload & Analyze");
    await expect(page.getByText(/Supported:/)).toBeVisible();
    const workbook = uniqueProductionWorkbook();
    await page.locator('input[type="file"]').setInputFiles(workbook);
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await expect(page).toHaveURL(/\/documents\/doc-/, { timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    const detailUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(detailUrl);
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByText(/Sheet:/)).toBeVisible();
    await page.getByRole("button", { name: "Extracted Data" }).click();
    await expect(page.getByText("Valid 2", { exact: true })).toBeVisible();
    await expect(page.getByText(/invalid numeric value|unknown product|required field missing/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Import" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByText(/Import completed/)).toBeVisible({ timeout: 15_000 });
    fs.unlinkSync(workbook);
    await assertHealthy(page);
  });

  test("Upload redirects to document detail and survives refresh", async ({ page }) => {
    await login(page);
    await page.goto("/documents/analyze");
    const workbook = uniqueProductionWorkbook();
    await page.locator('input[type="file"]').setInputFiles(workbook);
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await expect(page).toHaveURL(/\/documents\/doc-/, { timeout: 30_000 });
    const detailUrl = page.url();
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(detailUrl);
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await page.goto("/documents");
    await page.goto(detailUrl);
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    fs.unlinkSync(workbook);
    await assertHealthy(page);
  });

  test("PDF upload extracts, analyzes, and creates an NCR draft", async ({ page }) => {
    await login(page);
    await page.goto("/documents/analyze");
    await page.locator('input[type="file"]').setInputFiles(path.join(FIX, "quality-report-demo.pdf"));
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await expect(page).toHaveURL(/\/documents\/doc-/, { timeout: 30_000 });
    await page.getByRole("button", { name: "Analysis" }).click();
    await page.getByRole("button", { name: "Analyze with AI" }).click();
    await expect(page.getByText(/AI Mode:/)).toBeVisible();
    await expect(page.getByText("AI-generated recommendation — human review required.").first()).toBeVisible();
    await page.getByRole("button", { name: "Create NCR Draft" }).click();
    await expect(page).toHaveURL(/\/quality\/production-ncr\/ncr-/);
    await expect(page.getByRole("heading", { name: /NCR-2026-/ })).toBeVisible();
  });

  test("Admin Excel Integration exposes profiles and New Import", async ({ page }) => {
    await login(page);
    await openSidebarItem(page, "Excel Integration");
    await expect(page.locator("main h1")).toHaveText("Excel Integration");
    await expect(page.getByRole("link", { name: "New Import" }).first()).toBeVisible();
    await expect(page.locator("main p.font-semibold", { hasText: "Production" })).toBeVisible();
    await expect(page.locator("main p.font-semibold", { hasText: "Receiving" })).toBeVisible();
    await expect(page.locator("main p.font-semibold", { hasText: "COPQ" })).toBeVisible();
    await page.getByRole("link", { name: "New Import" }).first().click();
    await expect(page).toHaveURL(/\/documents\/analyze/);
  });

  test("Quality Inspector is denied document routes", async ({ page }) => {
    await login(page, ACCOUNTS.inspector);
    await page.goto("/documents");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
    await page.goto("/documents/analyze");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload" })).toHaveCount(0);
  });
});
