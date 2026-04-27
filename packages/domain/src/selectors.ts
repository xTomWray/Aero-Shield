/**
 * @fileoverview Selectors that derive UI-ready state from a DemoSnapshot for threat summary views.
 *
 * @module       domain/selectors
 * @exports      getTopCategory, getDetectedAttackCount
 * @dependsOn    ./types
 * @usedBy       packages/domain/src/index.ts (re-export), packages/mock-sim/src/generateSnapshot.ts, apps/web/src/app/dashboard.tsx
 * @sideEffects  none — pure functions
 * @stability    stable
 * @tests        packages/domain/tests/selectors.test.ts
 */

import type { AttackCategory, DemoSnapshot } from "./types.js";

/**
 * Returns the attack category with the highest peak confidence.
 * Useful for surfacing the most critical active threat in summary views.
 *
 * @param snapshot - Current DemoSnapshot
 * @returns The AttackCategory with the maximum peakConfidence, or undefined if empty.
 */
export const getTopCategory = (snapshot: DemoSnapshot): AttackCategory | undefined =>
  [...snapshot.categories].sort((left, right) => right.peakConfidence - left.peakConfidence)[0];

/**
 * Counts the total number of distinct attacks detected across all categories.
 * Sums category.attacks.length for each category; does not deduplicate.
 *
 * @param snapshot - Current DemoSnapshot
 * @returns Total attack count.
 */
export const getDetectedAttackCount = (snapshot: DemoSnapshot): number =>
  snapshot.categories.reduce((total: number, category: AttackCategory) => total + category.attacks.length, 0);
