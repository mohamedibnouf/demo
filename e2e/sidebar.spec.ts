import { test, expect } from "@playwright/test";
import { assertHealthy, login, openSidebarItem, SIDEBAR_ITEMS } from "./helpers";

const HEADING: Record<string, string | RegExp> = {
  "/": /Welcome,/,
  "/quality/production-inspection": "Production Inspection",
  "/quality/production-ncr": "Production NCR",
  "/quality/supplier-ncr": "Supplier NCR",
  "/quality/customer-complaints": "Customer Complaints",
  "/quality/internal-ncr": "Internal NCR",
  "/quality/capa": "CAPA",
  "/quality/deviation": "Deviation",
  "/quality/sample-evaluation": "Sample Evaluation",
  "/quality/ecn": "Engineering Change Notice",
  "/quality/incoming-inspection": "Incoming Inspection",
  "/quality/in-process-inspection": "In-Process Inspection",
  "/quality/final-inspection": "Final Inspection",
  "/quality/rework": "Rework",
  "/quality/rrr": "RRR — Rejection & Replacement",
  "/quality/calibration": "Calibration / Monitoring",
  "/logbooks/cpu-coil": "CPU Coil Daily Logbook",
  "/logbooks/ahu-coil": "AHU Coil Daily Logbook",
  "/logbooks/paint-shop": "Paint Shop Daily Logbook",
  "/logbooks/oven-tracker": "Oven Tracker",
  "/logbooks/destructive-tests": "Destructive Tests",
  "/ims/objectives": "IMS Objectives",
  "/ims/risk-opportunity": "Risk & Opportunity Register",
  "/ims/annual-audit-plan": "Annual Audit Plan",
  "/ims/internal-audit": "Internal Audit",
  "/ims/external-audit": "External Audit",
  "/ims/customer-audit": "Customer Audit",
  "/ims/supplier-audit": "Supplier Audit",
  "/ims/audit-findings": "Audit Findings",
  "/ims/management-review": "Management Review",
  "/performance/quality-dashboard": "Quality Dashboard",
  "/performance/management-dashboard": "Management Dashboard",
  "/performance/kpi-reports": "KPI & Reports",
  "/performance/copq": "COPQ",
  "/performance/supplier-sppm": "Supplier SPPM",
  "/performance/customer-ffr": "Customer FFR / PPM",
  "/performance/production-constraints": "Production Constraints (PC)",
  "/ai-assistant": "AI Quality Assistant",
  "/admin/users": "Users",
  "/admin/roles": "Roles & Permissions",
  "/admin/master-data": "Master Data",
  "/admin/workflows": "Workflow Configuration",
  "/admin/numbering": "Numbering Configuration",
  "/admin/excel": "Excel Integration",
  "/admin/notifications": "Notification Configuration",
  "/admin/audit-trail": "Audit Trail",
  "/reports": "Reports Center",
  "/tasks": "Upcoming Tasks",
  "/risks": "Smart Risk / Early Warning Engine",
};

const LIST_WITH_VIEW = new Set([
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
  "/ims/objectives",
  "/ims/risk-opportunity",
  "/ims/annual-audit-plan",
  "/ims/internal-audit",
  "/ims/external-audit",
  "/ims/customer-audit",
  "/ims/supplier-audit",
  "/ims/audit-findings",
  "/ims/management-review",
  "/performance/production-constraints",
  "/tasks",
]);

test.describe("Quality Manager sidebar tree", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const item of SIDEBAR_ITEMS) {
    test(`${item.label} → ${item.href}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await openSidebarItem(page, item.label);
      await expect(page).toHaveURL(new RegExp(`${item.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));
      const heading = HEADING[item.href];
      if (!heading) throw new Error(`missing heading map for ${item.href}`);
      await expect(page.locator("main h1")).toHaveText(heading);
      await assertHealthy(page);
      if (LIST_WITH_VIEW.has(item.href)) {
        await expect(page.getByText(/\d+ records/)).toBeVisible();
        const view = page.getByRole("link", { name: "View", exact: true }).first();
        await expect(view).toBeVisible();
        await view.click();
        await expect(page).not.toHaveURL(new RegExp(`${item.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));
        await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
        await assertHealthy(page);
      }
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});
