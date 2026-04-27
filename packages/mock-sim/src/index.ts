/**
 * @fileoverview Barrel export for mock data generation and offline demo provider.
 *
 * @module       mock-sim/index
 * @exports      generateSnapshot, MockDemoProvider
 * @dependsOn    ./scenarios, ./mockProvider
 * @usedBy       apps/web/src/app/App.tsx, apps/web/src/app/App.test.tsx, apps/web/src/app/dashboard.test.tsx
 * @sideEffects  none
 * @stability    stable
 * @tests        no tests
 */

export { generateSnapshot } from "./scenarios";
export { MockDemoProvider } from "./mockProvider";
