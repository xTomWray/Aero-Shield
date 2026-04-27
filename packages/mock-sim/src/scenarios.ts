/**
 * @fileoverview Re-exports generateSnapshot from the private generateSnapshot module.
 *
 * @module       mock-sim/scenarios
 * @exports      generateSnapshot
 * @dependsOn    ./generateSnapshot
 * @usedBy       ../index.ts (re-export), ./mockProvider.ts
 * @sideEffects  none
 * @stability    stable
 * @tests        no tests
 */

export { generateSnapshot } from "./generateSnapshot";
