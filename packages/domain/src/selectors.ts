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
