import type { ScenarioDescriptor } from "./types.js";

/**
 * Catalog of available demo scenarios.
 *
 * Each scenario represents a different drone threat environment:
 * - baseline:    Reference state with steady detection rates. Use for training and demos.
 * - storm-front: Elevated signal clutter with reduced classifier confidence.
 *                Demonstrates uncertainty in noisy environments.
 * - intrusion:   Dense, realistic attack replay for red-team walkthroughs.
 * - recovery:    Post-incident replay with softened scores and lingering alerts.
 *
 * A real API backend can support all four scenarios or a subset. The frontend
 * will display whichever scenarios are listed here.
 */
export const scenarioCatalog: ScenarioDescriptor[] = [
  {
    id: "baseline",
    name: "Baseline",
    summary: "Reference screenshot-aligned Aero Shield operator dashboard.",
    tempo: "steady"
  },
  {
    id: "storm-front",
    name: "Storm Front",
    summary: "Elevated signal clutter with slightly reduced classifier confidence.",
    tempo: "elevated"
  },
  {
    id: "intrusion",
    name: "Intrusion",
    summary: "Denser detection replay for red-team style walkthroughs.",
    tempo: "surge"
  },
  {
    id: "recovery",
    name: "Recovery",
    summary: "Post-event replay with softened scores and lingering anomalies.",
    tempo: "steady"
  }
];
