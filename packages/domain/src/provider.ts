/**
 * @fileoverview Defines provider contracts (DemoDataProvider, DemoDataControls) and type guards for snapshot delivery systems.
 *
 * @module       domain/provider
 * @exports      DemoDataProvider, DemoDataControls, isDemoDataControls
 * @dependsOn    ./types
 * @usedBy       packages/domain/src/index.ts (re-export), packages/api-client/src/index.ts, apps/web/src/app/demo-context.tsx, apps/web/src/app/DemoControlSurface.tsx, apps/web/src/app/App.tsx, packages/mock-sim/src/mockProvider.ts
 * @sideEffects  none — interface definitions and type guard only
 * @stability    stable
 * @tests        no tests
 */

import type { DemoRuntimeState, DemoSnapshot, ScenarioId } from "./types.js";

/**
 * Contract for a provider that delivers demo snapshot data to the dashboard.
 *
 * Implement this interface to connect a real REST API. The mock provider
 * (packages/mock-sim) is the reference implementation.
 *
 * Lifecycle: call start() to begin updates, stop() to halt them. Both are
 * idempotent. Subscribe listeners are notified on each new snapshot; call
 * getSnapshot() inside the listener to retrieve the latest data.
 */
export interface DemoDataProvider {
  /**
   * Returns the most recent snapshot synchronously from the in-memory cache.
   * Call only after subscribing, to avoid stale or missing data.
   */
  getSnapshot(): DemoSnapshot;
  /**
   * Register a callback to be invoked whenever a new snapshot is available.
   * The listener is NOT fired immediately — call getSnapshot() for initial state.
   * @returns Unsubscribe function. Call it to stop receiving notifications.
   */
  subscribe(listener: () => void): () => void;
  /**
   * Begin generating or fetching snapshots on an internal timer/poll loop.
   * Idempotent: safe to call multiple times.
   */
  start(): void;
  /**
   * Halt the update loop. Listeners stop receiving notifications.
   * The last snapshot remains accessible via getSnapshot().
   * Idempotent: safe to call multiple times.
   */
  stop(): void;
  /**
   * Switch to a different scenario, resetting to tick 0.
   * If running, the update loop restarts. If stopped, it stays stopped.
   * @param id - One of "baseline" | "storm-front" | "intrusion" | "recovery".
   */
  setScenario(id: ScenarioId): void;
}

/**
 * Optional extended interface for providers that support playback controls.
 * Check with isDemoDataControls(provider) before use. A real API provider
 * is not required to implement this.
 */
export interface DemoDataControls {
  /**
   * Returns the current playback state: whether running and at what speed.
   */
  getRuntimeState(): DemoRuntimeState;
  /**
   * Reset to tick 0 without changing the current scenario.
   * If running, continues running after reset.
   */
  reset(): void;
  /**
   * Set the playback speed multiplier (0.5–4.0, clamped to that range).
   * Takes effect immediately if running; stored for use when start() is called.
   */
  setSpeed(multiplier: number): void;
}

export const isDemoDataControls = (
  provider: DemoDataProvider
): provider is DemoDataProvider & DemoDataControls =>
  "reset" in provider && "setSpeed" in provider && "getRuntimeState" in provider;
