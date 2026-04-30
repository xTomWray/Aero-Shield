# Architecture

## Monorepo boundaries

- `apps/web` renders the dashboard and depends only on package contracts.
- `packages/domain` defines `DemoDataProvider`, snapshot types, selectors, and formatters.
- `apps/api/examplesim` owns deterministic fixtures and snapshot generation.
- `packages/mock-sim` implements the provider contract as a thin looping adapter over the example simulator.
- `packages/api-client` reserves the same provider surface for the real backend adapter.
- `packages/ui` keeps display components separate from data orchestration.

## Data flow

1. `apps/api/examplesim` generates deterministic `DemoSnapshot` values.
2. `MockDemoProvider` advances ticks and reads snapshots from that source.
3. The React app subscribes through `useSyncExternalStore`.
4. UI components receive snapshot slices as plain props.
5. Hidden demo controls call provider methods for scenario, speed, pause, and reset.

## Backend path

`apps/api/server` is the live ingest + SSE backend path. It accepts `ConfidenceUpdate` events over `POST /ingest`, translates them into `DemoSnapshot`, and broadcasts them over `/stream`. Saved runs in `data/runs/` can be replayed into that API externally via `scripts/stream_run.py`, while `packages/api-client` preserves the same provider surface used by the UI.
