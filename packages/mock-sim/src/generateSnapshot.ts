/**
 * @fileoverview Generates demo snapshots by evolving attack categories and timeline events based on scenario and tick.
 *
 * @module       mock-sim/generateSnapshot
 * @exports      generateSnapshot, getScheduledAttacks, getScenarioCycleLength
 * @dependsOn    @aero-shield/domain (AttackCategory, DemoSnapshot, ScenarioId, TimelineEvent, TimelineIntensity), ./fixtures
 * @usedBy       ./scenarios.ts, ./mockProvider.ts, tests/generateSnapshot.test.ts
 * @sideEffects  none
 * @stability    stable
 * @tests        tests/generateSnapshot.test.ts
 */

import type {
  AttackCategory,
  DemoSnapshot,
  ScenarioId,
  TimelineEvent,
  TimelineIntensity
} from "@aero-shield/domain";

import { baseCategories, baseStatus, confidenceBumpByScenario, summaryByScenario, timelineTrackOrder } from "./fixtures";

type CategoryId = AttackCategory["id"];

interface ScheduledAttack {
  categoryId: CategoryId;
  label: string;
  startSecond: number;
  durationSeconds: number;
}

interface TimelineAttackInstance extends ScheduledAttack {
  absoluteStartSecond: number;
  absoluteEndSecond: number;
}

const TIMELINE_PAST_SECONDS = 15;
const TIMELINE_FUTURE_SECONDS = 15;
const TIMELINE_WINDOW_SECONDS = TIMELINE_PAST_SECONDS + TIMELINE_FUTURE_SECONDS;

const injectionLeaders = {
  first: "companion-computer-web-ui-login-brute-force",
  second: "waypoint-injection"
} as const;

const injectionCenterConfidenceByScenario: Record<ScenarioId, number> = {
  baseline: 22,
  "storm-front": 18,
  intrusion: 25,
  recovery: 16
};

const scenarioSchedules: Record<ScenarioId, ScheduledAttack[]> = {
  baseline: [
    { categoryId: "recon", label: "ground-control-station-discovery", startSecond: 0, durationSeconds: 2 },
    { categoryId: "injection", label: injectionLeaders.first, startSecond: 3, durationSeconds: 3 },
    { categoryId: "tampering", label: "gps-spoofing", startSecond: 7, durationSeconds: 3 },
    { categoryId: "dos", label: "camera-feed-ros-topic-flooding", startSecond: 11, durationSeconds: 3 },
    { categoryId: "exfiltration", label: "flight-log-extraction", startSecond: 15, durationSeconds: 2 },
    { categoryId: "injection", label: injectionLeaders.second, startSecond: 18, durationSeconds: 2 }
  ],
  "storm-front": [
    { categoryId: "recon", label: "packet-sniffing", startSecond: 0, durationSeconds: 2 },
    { categoryId: "tampering", label: "battery-spoofing", startSecond: 2, durationSeconds: 3 },
    { categoryId: "injection", label: injectionLeaders.first, startSecond: 6, durationSeconds: 2 },
    { categoryId: "dos", label: "communication-link-flooding", startSecond: 9, durationSeconds: 3 },
    { categoryId: "exfiltration", label: "wifi-client-data-leak", startSecond: 13, durationSeconds: 2 },
    { categoryId: "injection", label: injectionLeaders.second, startSecond: 16, durationSeconds: 2 }
  ],
  intrusion: [
    { categoryId: "recon", label: "protocol-fingerprinting", startSecond: 0, durationSeconds: 2 },
    { categoryId: "injection", label: injectionLeaders.first, startSecond: 2, durationSeconds: 3 },
    { categoryId: "tampering", label: "gps-spoofing", startSecond: 6, durationSeconds: 3 },
    { categoryId: "dos", label: "camera-feed-ros-topic-flooding", startSecond: 9, durationSeconds: 4 },
    { categoryId: "exfiltration", label: "flight-log-extraction", startSecond: 14, durationSeconds: 2 },
    { categoryId: "injection", label: injectionLeaders.second, startSecond: 17, durationSeconds: 2 }
  ],
  recovery: [
    { categoryId: "tampering", label: "emergency-status-spoofing", startSecond: 0, durationSeconds: 2 },
    { categoryId: "recon", label: "drone-discovery", startSecond: 3, durationSeconds: 2 },
    { categoryId: "injection", label: injectionLeaders.first, startSecond: 6, durationSeconds: 2 },
    { categoryId: "dos", label: "denial-of-takeoff", startSecond: 10, durationSeconds: 3 },
    { categoryId: "exfiltration", label: "camera-feed-eavesdropping", startSecond: 14, durationSeconds: 2 },
    { categoryId: "injection", label: injectionLeaders.second, startSecond: 18, durationSeconds: 3 }
  ]
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const intensityForConfidence = (confidence: number): TimelineIntensity => {
  if (confidence >= 70) {
    return "high";
  }

  if (confidence >= 30) {
    return "medium";
  }

  return "low";
};

const getScenarioReplayLength = (scenarioId: ScenarioId): number =>
  Math.max(...scenarioSchedules[scenarioId].map((attack) => attack.startSecond + attack.durationSeconds));

const getCyclePosition = (tick: number, cycleLength: number): number => {
  const remainder = tick % cycleLength;
  return remainder >= 0 ? remainder : remainder + cycleLength;
};

const getAttackConfidence = (
  scenarioId: ScenarioId,
  cyclePosition: number,
  cycleLength: number,
  categoryIndex: number,
  attackIndex: number,
  attackLabel: string,
  baseConfidence: number
): number => {
  if (attackLabel === injectionLeaders.first || attackLabel === injectionLeaders.second) {
    const center = injectionCenterConfidenceByScenario[scenarioId];
    const swing = Math.round(4 * Math.cos((2 * Math.PI * cyclePosition) / cycleLength));
    return clamp(
      attackLabel === injectionLeaders.first ? center + swing : center - swing - 1,
      8,
      32
    );
  }

  const scenarioBump = confidenceBumpByScenario[scenarioId];
  const swing = Math.round(
    2 * Math.sin((2 * Math.PI * (cyclePosition + categoryIndex + attackIndex)) / cycleLength)
  );

  return clamp(baseConfidence + scenarioBump + swing, 4, 99);
};

const evolveCategories = (scenarioId: ScenarioId, tick: number): AttackCategory[] => {
  const cycleLength = getScenarioReplayLength(scenarioId);
  const cyclePosition = getCyclePosition(tick, cycleLength);

  return baseCategories.map((category, categoryIndex) => {
    const attacks = category.attacks
      .map((attack, attackIndex) => ({
        ...attack,
        confidence: getAttackConfidence(
          scenarioId,
          cyclePosition,
          cycleLength,
          categoryIndex,
          attackIndex,
          attack.label,
          attack.confidence
        ),
        originalIndex: attackIndex
      }))
      .sort((left, right) => {
        if (right.confidence !== left.confidence) {
          return right.confidence - left.confidence;
        }

        return left.originalIndex - right.originalIndex;
      })
      .map(({ originalIndex: _originalIndex, ...attack }) => attack);

    return {
      ...category,
      attacks,
      peakConfidence: attacks[0]?.confidence ?? 0
    };
  });
};

const expandScheduleAroundTick = (scenarioId: ScenarioId, tick: number): TimelineAttackInstance[] => {
  const schedule = scenarioSchedules[scenarioId];
  const cycleLength = getScenarioReplayLength(scenarioId);
  const minAbsoluteSecond = tick - TIMELINE_PAST_SECONDS;
  const maxAbsoluteSecond = tick + TIMELINE_FUTURE_SECONDS;
  const firstCycle = Math.floor(minAbsoluteSecond / cycleLength) - 1;
  const lastCycle = Math.ceil(maxAbsoluteSecond / cycleLength) + 1;
  const instances: TimelineAttackInstance[] = [];

  for (let cycleIndex = firstCycle; cycleIndex <= lastCycle; cycleIndex += 1) {
    const cycleOffset = cycleIndex * cycleLength;

    schedule.forEach((attack) => {
      const absoluteStartSecond = cycleOffset + attack.startSecond;
      const absoluteEndSecond = absoluteStartSecond + attack.durationSeconds;

      if (absoluteEndSecond < minAbsoluteSecond || absoluteStartSecond > maxAbsoluteSecond) {
        return;
      }

      instances.push({
        ...attack,
        absoluteStartSecond,
        absoluteEndSecond
      });
    });
  }

  return instances.sort((left, right) => left.absoluteStartSecond - right.absoluteStartSecond);
};

const findFocusedAttack = (scenarioId: ScenarioId, tick: number): TimelineAttackInstance => {
  const schedule = expandScheduleAroundTick(scenarioId, tick);
  const activeAttack = schedule.find(
    (attack) => attack.absoluteStartSecond <= tick && attack.absoluteEndSecond > tick
  );

  if (activeAttack) {
    return activeAttack;
  }

  const nextAttack = schedule.find((attack) => attack.absoluteStartSecond > tick);

  if (!nextAttack) {
    const cycleLength = getScenarioReplayLength(scenarioId);
    const nextCycleStart = Math.floor(tick / cycleLength) * cycleLength + cycleLength;
    const replayHead = scenarioSchedules[scenarioId][0];

    return {
      ...replayHead,
      absoluteStartSecond: nextCycleStart + replayHead.startSecond,
      absoluteEndSecond: nextCycleStart + replayHead.startSecond + replayHead.durationSeconds
    };
  }

  return nextAttack;
};

const resolveTimelineEventState = (relativeStartSecond: number, relativeEndSecond: number): TimelineEvent["state"] => {
  if (relativeStartSecond <= 0 && relativeEndSecond > 0) {
    return "active";
  }

  if (relativeStartSecond > 0) {
    return "queued";
  }

  return "past";
};

const buildTimelineTracks = (categories: AttackCategory[], scenarioId: ScenarioId, tick: number) =>
  timelineTrackOrder.flatMap((categoryId) => {
    const category = categories.find((entry) => entry.id === categoryId);

    if (!category) {
      return [];
    }

    const events = expandScheduleAroundTick(scenarioId, tick)
      .filter((attack) => attack.categoryId === category.id)
      .map((attack) => {
        const relativeStartSecond = attack.absoluteStartSecond - tick;
        const relativeEndSecond = attack.absoluteEndSecond - tick;
        const clippedStartSecond = clamp(relativeStartSecond, -TIMELINE_PAST_SECONDS, TIMELINE_FUTURE_SECONDS);
        const clippedEndSecond = clamp(relativeEndSecond, -TIMELINE_PAST_SECONDS, TIMELINE_FUTURE_SECONDS);
        const confidence =
          category.attacks.find((candidate) => candidate.label === attack.label)?.confidence ?? category.peakConfidence;

        if (clippedEndSecond <= clippedStartSecond) {
          return null;
        }

        return {
          startSecond: clippedStartSecond,
          durationSeconds: clippedEndSecond - clippedStartSecond,
          intensity: intensityForConfidence(confidence),
          label: attack.label,
          state: resolveTimelineEventState(relativeStartSecond, relativeEndSecond)
        };
      })
      .filter((event): event is TimelineEvent => event !== null);

    return [
      {
        id: category.id,
        label: category.label,
        tone: category.tone,
        events
      }
    ];
  });

const buildSummary = (scenarioId: ScenarioId, categories: AttackCategory[]) => {
  const summaryFixture = summaryByScenario[scenarioId];
  const rankedCategories = [...categories].sort((left, right) => right.peakConfidence - left.peakConfidence);
  const topCategory = rankedCategories[0];
  const runnersUp = rankedCategories.slice(1, 3);

  return {
    averageDetectionRate: summaryFixture.averageDetectionRate,
    averageChange: summaryFixture.averageChange,
    topDetection: {
      ...summaryFixture.topDetection,
      category: topCategory?.label ?? summaryFixture.topDetection.category,
      label: topCategory?.attacks[0]?.label ?? summaryFixture.topDetection.label,
      confidence: topCategory?.attacks[0]?.confidence ?? summaryFixture.topDetection.confidence
    },
    runnersUp: summaryFixture.runnersUp.map((entry, index) => ({
      ...entry,
      category: runnersUp[index]?.label ?? entry.category,
      label: runnersUp[index]?.attacks[0]?.label ?? entry.label,
      confidence: runnersUp[index]?.attacks[0]?.confidence ?? entry.confidence
    }))
  };
};

export const getScheduledAttacks = (scenarioId: ScenarioId): ScheduledAttack[] =>
  scenarioSchedules[scenarioId].map((attack) => ({ ...attack }));

export const getScenarioCycleLength = (scenarioId: ScenarioId): number => getScenarioReplayLength(scenarioId);

export const generateSnapshot = (scenarioId: ScenarioId, tick: number): DemoSnapshot => {
  const categories = evolveCategories(scenarioId, tick);
  const focusedAttack = findFocusedAttack(scenarioId, tick);
  const focusedCategory = categories.find((category) => category.id === focusedAttack.categoryId) ?? categories[0];
  const focusedDetection =
    focusedCategory?.attacks.find((attack) => attack.label === focusedAttack.label) ?? focusedCategory?.attacks[0];
  const executionState = focusedAttack.absoluteStartSecond <= tick ? "active" : "queued";

  return {
    scenarioId,
    tick,
    generatedAt: new Date(Date.UTC(2026, 3, 22, 12, tick % 60, 0)).toISOString(),
    status: {
      ...baseStatus,
      reviewWindow: "30s centered on Now"
    },
    simulation: {
      mode: focusedCategory?.label ?? "Unknown",
      injectedAttack: focusedAttack.label,
      detectedAttack: focusedDetection?.label ?? focusedAttack.label,
      confidence: focusedDetection?.confidence ?? focusedCategory?.peakConfidence ?? 0,
      match: true,
      detectionState: executionState === "active" ? "Match" : "Queued",
      executionState
    },
    timeline: {
      windowSeconds: TIMELINE_WINDOW_SECONDS,
      windowLabel: "30s centered on Now",
      ticks: ["-15s", "-10s", "-5s", "Now", "+5s", "+10s", "+15s"],
      tracks: buildTimelineTracks(categories, scenarioId, tick)
    },
    categories,
    summary: buildSummary(scenarioId, categories)
  };
};
