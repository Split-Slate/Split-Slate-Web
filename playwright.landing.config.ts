import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./landing/tests/browser",
  testMatch: "*.e2e.ts",
  workers: 1,
  reporter: "list",
  outputDir: "/tmp/opencode/audit-landing-artifacts",
  use: { baseURL: "http://127.0.0.1:4180", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "python3 -m http.server 4180 --bind 127.0.0.1 --directory landing",
    url: "http://127.0.0.1:4180",
    reuseExistingServer: false,
  },
});
