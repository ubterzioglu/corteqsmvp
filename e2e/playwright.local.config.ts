import { defineConfig } from "@playwright/test";

/**
 * Local config for the public-profile E2E suite.
 * The root playwright.config.ts depends on "lovable-agent-playwright-config",
 * which is not installed in local dev environments. Run this suite with:
 *
 *   npx playwright test --config=e2e/playwright.local.config.ts
 */
export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  // Cold vite dev-server transforms can exceed the 5s default on first load.
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
