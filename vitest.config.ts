import { defineConfig, mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "./packages/config/vitest.shared";

export default mergeConfig(
  sharedVitestConfig,
  defineConfig({
    test: {
      include: [
        "packages/domain/tests/**/*.test.ts",
        "packages/api-client/tests/**/*.test.ts",
        "packages/mock-sim/tests/**/*.test.ts",
        "apps/web/src/**/*.test.tsx"
      ]
    }
  })
);
