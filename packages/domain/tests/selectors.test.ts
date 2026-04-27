/**
 * @fileoverview Verifies selector behavior: getTopCategory and getDetectedAttackCount derive correct values from snapshots.
 *
 * @module       tests/domain/selectors
 * @exports      none — vitest test file
 * @dependsOn    vitest, ../src/selectors, ../src/types
 * @usedBy       vitest run
 * @sideEffects  none
 * @stability    stable
 * @tests        self
 */

import { describe, expect, it } from "vitest";

import { getDetectedAttackCount, getTopCategory } from "../src/selectors";
import type { DemoSnapshot } from "../src/types";

const snapshot: DemoSnapshot = {
  scenarioId: "baseline",
  tick: 0,
  generatedAt: "2026-04-22T12:00:00.000Z",
  status: {
    label: "Operational",
    live: true,
    reviewWindow: "30s rolling window",
    monitoredSignatures: 37,
    refreshCadence: "updates every 5s",
    subtitle: "Real-time drone cyberattack detection · 37 attack signatures monitored"
  },
  simulation: {
    mode: "DoS",
    injectedAttack: "camera-feed-ros-topic-flooding",
    detectedAttack: "camera-feed-ros-topic-flooding",
    confidence: 88,
    match: true,
    detectionState: "Match",
    executionState: "active"
  },
  timeline: {
    windowSeconds: 30,
    windowLabel: "30s centered on Now",
    ticks: ["-15s", "-10s", "-5s", "Now", "+5s", "+10s", "+15s"],
    tracks: [
      {
        id: "dos",
        label: "DoS",
        tone: "dos",
        events: [
          {
            startSecond: -2,
            durationSeconds: 4,
            intensity: "high",
            label: "camera-feed-ros-topic-flooding",
            state: "active"
          }
        ]
      }
    ]
  },
  categories: [
    {
      id: "dos",
      label: "DoS",
      tone: "dos",
      count: 2,
      peakConfidence: 88,
      attacks: [
        { label: "camera-feed-ros-topic-flooding", confidence: 88 },
        { label: "denial-of-takeoff", confidence: 17 }
      ]
    },
    {
      id: "tampering",
      label: "Tampering",
      tone: "tampering",
      count: 1,
      peakConfidence: 18,
      attacks: [{ label: "gps-spoofing", confidence: 18 }]
    }
  ],
  summary: {
    averageDetectionRate: 94.2,
    averageChange: "+3% from last hour",
    topDetection: {
      title: "Top Detection",
      category: "DoS",
      label: "camera-feed-ros-topic-flooding",
      confidence: 88,
      icon: "alert"
    },
    runnersUp: [
      {
        title: "Runner-Up #2",
        category: "Tampering",
        label: "gps-spoofing",
        confidence: 18,
        icon: "bookmark"
      },
      {
        title: "Runner-Up #3",
        category: "DoS",
        label: "denial-of-takeoff",
        confidence: 17,
        icon: "bookmark"
      }
    ]
  }
};

describe("selectors", () => {
  it("returns the highest confidence category", () => {
    expect(getTopCategory(snapshot)?.label).toBe("DoS");
  });

  it("counts all individual detections", () => {
    expect(getDetectedAttackCount(snapshot)).toBe(3);
  });
});
