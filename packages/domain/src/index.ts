/**
 * @fileoverview Barrel export for @aero-shield/domain package — core types and interfaces for drone threat detection.
 *
 * @module       domain/index
 * @exports      DemoSnapshot, AttackCategory, DemoDataProvider, DemoDataControls, scenarioCatalog, getTopCategory, getDetectedAttackCount, labelToCategory, LABEL_CATEGORY_MAP
 * @dependsOn    ./types, ./provider, ./scenarios, ./selectors, ./labelMap
 * @usedBy       entry point — all consumers of @aero-shield/domain (apps/api/server, apps/web, packages/api-client, packages/mock-sim)
 * @sideEffects  none — re-exports only
 * @stability    stable
 * @tests        no tests
 */

export * from "./types.js";
export * from "./provider.js";
export * from "./scenarios.js";
export * from "./selectors.js";
export * from "./labelMap.js";
