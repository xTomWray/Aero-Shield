/**
 * @fileoverview Verifies that AeroShieldApp renders the dashboard and updates state over time through provider subscriptions.
 *
 * @module       tests/web/App
 * @exports      none — vitest test file
 * @dependsOn    vitest, @testing-library/react, @aero-shield/mock-sim, ./App
 * @usedBy       vitest run
 * @sideEffects  none
 * @stability    stable
 * @tests        self
 */
import { MockDemoProvider } from "@aero-shield/mock-sim";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AeroShieldApp } from "./App";

describe("AeroShieldApp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the screenshot-aligned dashboard from the provider contract", () => {
    const provider = new MockDemoProvider({ initialScenario: "intrusion", tickIntervalMs: 1000 });

    render(<AeroShieldApp provider={provider} />);

    expect(screen.getByText("Aero Shield Dashboard")).toBeInTheDocument();
    expect(screen.getByAltText("Aero Shield logo")).toBeInTheDocument();
    expect(screen.getByText("Active attack simulation")).toBeInTheDocument();
    expect(screen.getAllByText("Injection").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tampering").length).toBeGreaterThan(0);
    expect(screen.getByText("Individual Attack Detection")).toBeInTheDocument();
    expect(screen.getByText("Runner-Up #2")).toBeInTheDocument();
  });

  it("updates generatedAt over time through the provider subscription", () => {
    const provider = new MockDemoProvider({ initialScenario: "baseline", tickIntervalMs: 1000 });

    render(<AeroShieldApp provider={provider} />);

    const before = screen.getByTestId("generated-at").textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("generated-at").textContent).not.toEqual(before);
  });
});
