# Aero Shield

This is the real Aero Shield repo.

It now contains the complete screenshot-aligned dashboard implementation and its deterministic synthetic simulator entirely inside this workspace. You can delete the earlier `getting-started` repo without affecting the Aero Shield app.

## Repo layout

- `apps/web` is the shipping dashboard UI.
- `apps/api/examplesim` owns the deterministic example snapshot source used in local demos today.
- `packages/domain` contains the shared provider contract and dashboard snapshot types.
- `packages/mock-sim` wraps the example snapshot source in a provider that powers the UI today.

## Local run

From the repo root:

```bash
cd "/home/tom/code/Aero Shield"
make dev
```

Useful targets:

- `make dev`
- `make build`
- `make test`
- `make ui`
- `make e2e`

## Backend replacement seam

The web app depends on the provider contract in `packages/domain`. To replace the example simulator later, implement that same contract in `apps/api` or another adapter and swap out the mock provider used by `apps/web`.

As long as the `DemoSnapshot` shape in `packages/domain/src/types.ts` stays stable, the dashboard UI can remain unchanged.
