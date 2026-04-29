import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "api-smoke.spec.ts",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "COREPACK_HOME=/tmp/corepack CORS_ORIGIN=http://127.0.0.1:4174 corepack pnpm --filter @aero-shield/api-server start",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command:
        "COREPACK_HOME=/tmp/corepack VITE_API_BASE_URL=http://localhost:3000 corepack pnpm --filter @aero-shield/web exec vite --host 127.0.0.1 --port 4174",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
