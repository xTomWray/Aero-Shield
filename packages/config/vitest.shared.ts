/**
 * @fileoverview Shared Vitest configuration for monorepo test suites.
 *
 * @module       config/vitest-shared
 * @exports      sharedVitestConfig — Vitest config preset
 * @dependsOn    vitest
 * @usedBy       vitest.config.ts (root config), extended by individual test suites
 * @sideEffects  none — declarative config export
 * @stability    stable
 * @tests        no tests
 */

import { defineConfig } from "vitest/config";

export const sharedVitestConfig = defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  }
});
