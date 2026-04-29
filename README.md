# Aero Shield

This is the Aero Shield repo. It contains the shipping dashboard UI, the live API surface, and local demo tooling for replaying saved runs through the API.

## Repo layout

- `apps/web` is the shipping dashboard UI.
- `apps/api/server` exposes the ingest + SSE API used by the live dashboard path.
- `apps/api/examplesim` owns the deterministic example snapshot source used by the built-in mock provider.
- `packages/domain` contains the shared provider contract and dashboard snapshot types.
- `packages/mock-sim` wraps the example snapshot source in a provider that powers the built-in demo mode.

## Local run

From the repo root:

```bash
cd "/home/tom/code/Aero Shield"
make api
make ui
make stream
```

Useful targets:

- `make dev`
- `make api`
- `make ui`
- `make stream`
- `make build`
- `make test`
- `make e2e`

## Backend replacement seam

The web app depends on the provider contract in `packages/domain`. Local API demos now work by replaying saved `ConfidenceUpdate` files from `data/runs/` through `POST /ingest`, while the built-in mock provider remains available for offline UI work.

As long as the `DemoSnapshot` shape in `packages/domain/src/types.ts` stays stable, the dashboard UI can remain unchanged.
