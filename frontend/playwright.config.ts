import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:13000" },
  webServer: {
    command: "python3 -m http.server 13000 --bind 127.0.0.1 --directory out",
    url: "http://127.0.0.1:13000",
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "ignore",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
