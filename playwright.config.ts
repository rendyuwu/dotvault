import { defineConfig, devices } from "@playwright/test";
import { loadE2eEnv } from "./src/lib/e2e/setup";

const e2eEnv = loadE2eEnv();

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: e2eEnv.APP_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "npm run build && mkdir -p .next/standalone/.next && cp -R .next/static .next/standalone/.next/static && cp -R public .next/standalone/public && HOSTNAME=127.0.0.1 PORT=3000 node .next/standalone/server.js",
    url: e2eEnv.APP_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: e2eEnv,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
