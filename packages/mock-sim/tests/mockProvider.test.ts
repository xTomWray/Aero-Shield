/**
 * @fileoverview Verifies MockDemoProvider behavior: timer-based snapshot emission, scenario switching, and speed/reset controls.
 *
 * @module       tests/mock-sim/mockProvider
 * @exports      none — vitest test file
 * @dependsOn    vitest, ../src/mockProvider
 * @usedBy       vitest run
 * @sideEffects  none
 * @stability    stable
 * @tests        self
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MockDemoProvider } from "../src/mockProvider";

describe("MockDemoProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits updated snapshots on the timer", () => {
    const provider = new MockDemoProvider({ tickIntervalMs: 1000 });
    const listener = vi.fn();

    provider.subscribe(listener);
    provider.start();
    vi.advanceTimersByTime(1000);

    expect(listener).toHaveBeenCalled();
    expect(provider.getSnapshot().tick).toBe(1);
  });

  it("resets tick state when scenarios change", () => {
    const provider = new MockDemoProvider({ initialScenario: "baseline" });

    provider.start();
    vi.advanceTimersByTime(1800);
    provider.setScenario("intrusion");

    expect(provider.getSnapshot().scenarioId).toBe("intrusion");
    expect(provider.getSnapshot().tick).toBe(0);
  });

  it("supports reset and speed controls", () => {
    const provider = new MockDemoProvider({ tickIntervalMs: 1000 });

    provider.setSpeed(2);
    provider.start();
    vi.advanceTimersByTime(500);
    expect(provider.getSnapshot().tick).toBe(1);

    provider.reset();
    expect(provider.getSnapshot().tick).toBe(0);
    expect(provider.getRuntimeState()).toEqual({
      isRunning: true,
      speedMultiplier: 2
    });
  });
});
