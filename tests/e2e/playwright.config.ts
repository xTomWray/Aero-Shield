import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testIgnore: ["**/api-smoke.spec.ts"],
  timeout: 45_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "COREPACK_HOME=/tmp/corepack corepack pnpm --filter @aero-shield/web exec vite --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 60_000
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"]
      }
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"]
      }
    }
  ]
});
