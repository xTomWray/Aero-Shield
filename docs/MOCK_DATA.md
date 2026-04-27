# Mock Data

## Scenario ownership

- `baseline`: steady-state patrol cadence
- `storm-front`: degraded weather conditions and timing compression
- `intrusion`: hostile coordinated probe surge
- `recovery`: post-event stabilization

## Engine behavior

- `apps/api/examplesim` owns the seed fixtures for metrics, threats, and summary highlights.
- `generateSnapshot()` derives deterministic values from `scenarioId` and `tick`.
- Each scenario replays a single ordered attack schedule that centers the dashboard on `Now` with a `-15s` to `+15s` viewport.
- At most one scheduled attack is active at any simulated second; if `Now` lands in a gap, the simulation card shows the next queued attack.
- The `Injection` category intentionally swaps its leading confidence between `companion-computer-web-ui-login-brute-force` and `waypoint-injection` during each replay cycle.
- `packages/mock-sim` advances ticks on an interval and notifies subscribers.

## Demo controls

- Scenario switch resets the timeline to tick `0`.
- Speed changes alter the interval without changing snapshot math.
- Reset replays the current scenario from its initial deterministic state.
- Pause stops the loop while preserving the current snapshot.
