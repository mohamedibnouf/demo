import { expect, type Page } from "@playwright/test";
import { NAV } from "../src/lib/navigation";

export const PASSWORD = "SamcoDemo@2026";

export const ACCOUNTS = {
  qm: "quality.manager@samco.demo",
  admin: "admin@samco.demo",
  management: "management@samco.demo",
  supplier: "supplier@samco.demo",
  customer: "customer@samco.demo",
  inspector: "inspector@samco.demo",
} as const;

export const SIDEBAR_ITEMS = NAV.flatMap((section) => section.items);

export async function login(page: Page, email: string = ACCOUNTS.qm) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

export function primaryNav(page: Page) {
  return page.locator("aside").getByRole("navigation");
}

export async function openSidebarItem(page: Page, label: string) {
  await primaryNav(page).getByRole("link", { name: label, exact: true }).click();
}

export async function assertHealthy(page: Page) {
  const main = page.locator("main");
  await expect(main).toBeVisible();
  const text = await main.innerText();
  expect(text.length, "main content should not be blank").toBeGreaterThan(20);
  expect(text).not.toMatch(/Application error/i);
  expect(text).not.toMatch(/Internal Server Error/i);
  expect(text).not.toMatch(/Unhandled Runtime Error/i);
  expect(text).not.toMatch(/Coming Soon/i);
  expect(text).not.toMatch(/Not Implemented/i);
}

export async function searchTable(page: Page, query: string) {
  const search = page.getByPlaceholder("Search this table");
  await expect(search).toBeVisible();
  await search.fill(query);
}

export async function openRecord(page: Page, name: string) {
  await searchTable(page, name);
  await page.getByRole("link", { name, exact: true }).first().click();
}
