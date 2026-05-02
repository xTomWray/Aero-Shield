/**
 * @fileoverview Verifies dashboard components render timeline ticks, attack simulation states, and detection matrix data correctly.
 *
 * @module       tests/web/dashboard
 * @exports      none — vitest test file
 * @dependsOn    vitest, @testing-library/react, @aero-shield/mock-sim, ./dashboard
 * @usedBy       vitest run
 * @sideEffects  none
 * @stability    stable
 * @tests        self
 */
import { generateSnapshot } from "@aero-shield/mock-sim";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetectionMatrix, SimulationCard, ThreatTimelinePanel } from "./dashboard";

const getInjectionLeader = () => {
  const injectionRow = screen.getAllByText("Injection")[0]?.closest(".category-row");
  const leaderLabel = injectionRow?.querySelector(".attack-tile .attack-copy span")?.textContent;
  const leaderConfidence = injectionRow?.querySelector(".attack-tile .attack-copy strong")?.textContent;

  expect(injectionRow).not.toBeNull();

  return {
    leaderLabel,
    leaderConfidence
  };
};

const expectSimulationRowOrder = (
  container: HTMLElement,
  labels: {
    detectionState: string;
    detectedLabel: string;
    injectedLabel: string;
  }
) => {
  const rowText = container.querySelector(".simulation-row")?.textContent ?? "";
  const confidenceIndex = rowText.indexOf("Confidence");
  const detectionStateIndex = rowText.indexOf(labels.detectionState);
  const detectedIndex = rowText.indexOf(labels.detectedLabel);
  const injectedIndex = rowText.indexOf(labels.injectedLabel);

  expect(confidenceIndex).toBeGreaterThanOrEqual(0);
  expect(detectionStateIndex).toBeGreaterThan(confidenceIndex);
  expect(detectedIndex).toBeGreaterThan(detectionStateIndex);
  expect(injectedIndex).toBeGreaterThan(detectedIndex);
};

describe("dashboard components", () => {
  it("renders the centered timeline labels and shows queued future attacks", () => {
    const snapshot = generateSnapshot("baseline", 0);
    const { container } = render(<ThreatTimelinePanel timeline={snapshot.timeline} />);
    const firstTrack = container.querySelector(".timeline-track");

    expect(screen.getByText("-15s")).toBeInTheDocument();
    expect(screen.getByText("-10s")).toBeInTheDocument();
    expect(screen.getByText("-5s")).toBeInTheDocument();
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("+5s")).toBeInTheDocument();
    expect(screen.getByText("+10s")).toBeInTheDocument();
    expect(screen.getByText("+15s")).toBeInTheDocument();
    expect(container.querySelectorAll(".timeline-tick")).toHaveLength(7);
    expect(firstTrack?.querySelectorAll(".timeline-guide")).toHaveLength(7);
    expect(firstTrack?.querySelectorAll(".timeline-now-marker")).toHaveLength(1);
    expect(firstTrack?.querySelectorAll(".timeline-guide:not(.timeline-now-marker)")).toHaveLength(6);
    expect(container.querySelectorAll(".timeline-bar.state-queued").length).toBeGreaterThan(0);
  });

  it("uses the same tick count for the scale and each track guide set", () => {
    const snapshot = generateSnapshot("baseline", 0);
    const { container } = render(<ThreatTimelinePanel timeline={snapshot.timeline} />);
    const scaleTickCount = container.querySelectorAll(".timeline-tick").length;
    const tracks = Array.from(container.querySelectorAll(".timeline-track"));

    expect(scaleTickCount).toBe(7);

    tracks.forEach((track) => {
      expect(track.querySelectorAll(".timeline-guide")).toHaveLength(scaleTickCount);
    });
  });

  it("surfaces only one active attack at a time in the timeline and simulation card", () => {
    const snapshot = generateSnapshot("baseline", 4);
    const timelineRender = render(<ThreatTimelinePanel timeline={snapshot.timeline} />);
    const activeBars = timelineRender.container.querySelectorAll(".timeline-bar.state-active");

    expect(activeBars).toHaveLength(1);

    timelineRender.unmount();

    const simulationRender = render(<SimulationCard simulation={snapshot.simulation} />);
    expect(screen.getByText("Executing attack")).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();
    expectSimulationRowOrder(simulationRender.container, {
      detectionState: "Match",
      detectedLabel: "System detected",
      injectedLabel: "Executing attack"
    });
  });

  it("shows queued attack state when Now falls between scheduled attacks", () => {
    const snapshot = generateSnapshot("baseline", 6);

    const { container } = render(<SimulationCard simulation={snapshot.simulation} />);

    expect(screen.getByText("Queued attack")).toBeInTheDocument();
    expect(screen.getByText("Next predicted")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
    expectSimulationRowOrder(container, {
      detectionState: "Queued",
      detectedLabel: "Next predicted",
      injectedLabel: "Queued attack"
    });
  });

  it("shows different Injection leaders at different replay moments", () => {
    const early = generateSnapshot("baseline", 0);
    const late = generateSnapshot("baseline", 10);

    const earlyRender = render(
      <DetectionMatrix categories={early.categories} refreshCadence={early.status.refreshCadence} />
    );
    const earlyLeader = getInjectionLeader();

    earlyRender.unmount();

    const lateRender = render(
      <DetectionMatrix categories={late.categories} refreshCadence={late.status.refreshCadence} />
    );
    const lateLeader = getInjectionLeader();

    expect(earlyLeader.leaderLabel).toBe("companion-computer-web-ui-login-brute-force");
    expect(lateLeader.leaderLabel).toBe("waypoint-injection");
    expect(earlyLeader.leaderConfidence).not.toBe(lateLeader.leaderConfidence);

    lateRender.unmount();
  });
});
