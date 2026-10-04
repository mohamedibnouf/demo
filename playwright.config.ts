import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "off",
  },
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000/login",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
