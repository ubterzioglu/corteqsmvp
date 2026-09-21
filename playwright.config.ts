import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 8099);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // Cold vite dev-server transforms can exceed the 5s default on first load.
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    headless: true,
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
  projects: [
    {
      name: "chromium",
      testIgnore: /.*mobile.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /.*mobile.*\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
  ],
});
