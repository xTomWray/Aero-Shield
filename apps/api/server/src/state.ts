/**
 * @fileoverview In-memory simulation state: manages scenario ID, event history with 30s sliding window, and latest snapshot.
 *
 * @module       api-server/state
 * @exports      SimState, state
 * @dependsOn    @aero-shield/domain
 * @usedBy       handlers.ts
 * @sideEffects  mutates in-memory history and snapshot; no persistence
 * @stability    stable
 * @tests        no tests
 */

import type { ScenarioId, ConfidenceUpdate, DemoSnapshot } from "@aero-shield/domain";

const WINDOW_MS = 30_000;

const STARTING_SNAPSHOT: DemoSnapshot = {
  scenarioId: "baseline",
  tick: 0,
  generatedAt: new Date().toISOString(),
  status: {
    label: "Operational",
    live: true,
    reviewWindow: "30s centered on Now",
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
    tracks: []
  },
  categories: [],
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

export class SimState {
  private scenarioId: ScenarioId = "baseline";
  private history: ConfidenceUpdate[] = [];
  private latestSnapshot: DemoSnapshot | null = null;

  getScenarioId(): ScenarioId {
    return this.scenarioId;
  }

  setScenario(id: ScenarioId): void {
    this.scenarioId = id;
    this.history = [];
    this.latestSnapshot = null;
  }

  ingestEvent(event: ConfidenceUpdate): void {
    const cutoff = new Date(event.timestamp).getTime() - WINDOW_MS;
    this.history = this.history.filter(
      (e) => new Date(e.timestamp).getTime() >= cutoff,
    );
    this.history.push(event);
  }

  getHistory(): ConfidenceUpdate[] {
    return this.history;
  }

  setSnapshot(snapshot: DemoSnapshot): void {
    this.latestSnapshot = snapshot;
  }

  getSnapshot(): DemoSnapshot {
    if (this.latestSnapshot) return this.latestSnapshot;
    return STARTING_SNAPSHOT;
  }
}

export const state = new SimState();
