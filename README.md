# Aero Shield

Aero Shield is a monorepo for a drone-threat dashboard and its live API path. It provides a UI for rendering intrusion-detection confidence percentages and threat simulation timeline views, plus an endpoint surface for ingesting confidence updates and streaming dashboard state.

## What’s Here

- `apps/web` is the shipping dashboard UI.
- `apps/api/server` exposes the live API for snapshot reads, SSE updates, and ingest.
- `packages/domain` defines the shared snapshot types and provider contract.
- `packages/mock-sim` powers the built-in local demo mode.
- `packages/api-client` adapts the web app to the live API path.

## Run Locally

From the repo root:

```bash
make dev
```

Useful commands:

- `make api` starts the API server.
- `make ui` starts the web UI against the local API.
- `make stream` replays the saved demo run through `POST /ingest`.
- `make verify` runs lint, typecheck, tests, and build.

## API Surface

- `GET /snapshot` returns the current dashboard snapshot.
- `GET /stream` streams snapshot updates over SSE.
- `POST /ingest` accepts live confidence updates.

## Docs

- `docs/ARCHITECTURE.md`
- `docs/INTEGRATION.md`
