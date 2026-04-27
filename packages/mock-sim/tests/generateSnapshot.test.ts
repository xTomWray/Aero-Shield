/**
 * @fileoverview Verifies snapshot generation logic: timeline centering, non-overlapping attack schedules, execution state alignment, and scenario cycling.
 *
 * @module       tests/mock-sim/generateSnapshot
 * @exports      none — vitest test file
 * @dependsOn    vitest, ../src/generateSnapshot
 * @usedBy       vitest run
 * @sideEffects  none
 * @stability    stable
 * @tests        self
 */

import { describe, expect, it } from "vitest";

import { generateSnapshot, getScenarioCycleLength, getScheduledAttacks } from "../src/generateSnapshot";

const scenarioIds = ["baseline", "storm-front", "intrusion", "recovery"] as const;

describe("generateSnapshot", () => {
  it("renders a centered Now timeline with visible past and future attacks", () => {
    const snapshot = generateSnapshot("baseline", 4);
    const allEvents = snapshot.timeline.tracks.flatMap((track) => track.events);

    expect(snapshot.timeline.ticks).toEqual(["-15s", "-10s", "-5s", "Now", "+5s", "+10s", "+15s"]);
    expect(allEvents.some((event) => event.startSecond < 0)).toBe(true);
    expect(allEvents.some((event) => event.startSecond > 0)).toBe(true);
  });

  it("runs each scenario as a single non-overlapping replay that lasts at least 15 simulated seconds", () => {
    scenarioIds.forEach((scenarioId) => {
      const schedule = getScheduledAttacks(scenarioId);
      const cycleLength = getScenarioCycleLength(scenarioId);

      expect(cycleLength).toBeGreaterThanOrEqual(15);

      schedule.forEach((attack, index) => {
        const nextAttack = schedule[index + 1];

        if (!nextAttack) {
          return;
        }

        expect(attack.startSecond + attack.durationSeconds).toBeLessThanOrEqual(nextAttack.startSecond);
      });
    });
  });

  it("aligns the simulation card with the active attack at Now", () => {
    const snapshot = generateSnapshot("baseline", 4);

    expect(snapshot.simulation.executionState).toBe("active");
    expect(snapshot.simulation.injectedAttack).toBe("companion-computer-web-ui-login-brute-force");
    expect(snapshot.simulation.detectedAttack).toBe("companion-computer-web-ui-login-brute-force");
    expect(snapshot.simulation.mode).toBe("Injection");
  });

  it("surfaces the next queued attack when no attack is active at Now", () => {
    const snapshot = generateSnapshot("baseline", 6);

    expect(snapshot.simulation.executionState).toBe("queued");
    expect(snapshot.simulation.injectedAttack).toBe("gps-spoofing");
    expect(snapshot.simulation.detectedAttack).toBe("gps-spoofing");
    expect(snapshot.simulation.detectionState).toBe("Queued");
  });

  it("makes the Injection leaders swap deterministically and repeat after reset", () => {
    const first = generateSnapshot("baseline", 0).categories.find((category) => category.id === "injection");
    const later = generateSnapshot("baseline", 10).categories.find((category) => category.id === "injection");
    const replayed = generateSnapshot("baseline", getScenarioCycleLength("baseline")).categories.find(
      (category) => category.id === "injection"
    );

    expect(first?.attacks[0]?.label).toBe("companion-computer-web-ui-login-brute-force");
    expect(later?.attacks[0]?.label).toBe("waypoint-injection");
    expect(replayed?.attacks[0]?.label).toBe(first?.attacks[0]?.label);
    expect(replayed?.attacks[0]?.confidence).toBe(first?.attacks[0]?.confidence);
  });

  it("keeps Injection peak confidence and leader selection aligned to the current crossover leader", () => {
    const early = generateSnapshot("baseline", 0).categories.find((category) => category.id === "injection");
    const late = generateSnapshot("baseline", 10).categories.find((category) => category.id === "injection");

    expect(early?.peakConfidence).toBe(early?.attacks[0]?.confidence);
    expect(early?.attacks[0]?.label).toBe("companion-computer-web-ui-login-brute-force");
    expect(late?.peakConfidence).toBe(late?.attacks[0]?.confidence);
    expect(late?.attacks[0]?.label).toBe("waypoint-injection");
  });
});
