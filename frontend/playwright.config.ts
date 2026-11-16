import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:8080" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
