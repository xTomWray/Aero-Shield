# Setup

## Requirements

- Node.js 20+
- `pnpm` 10+

## Install

```bash
pnpm install
```

## Common commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm verify
```

## App layout

- `apps/web` ships the v1 React dashboard.
- `apps/api/examplesim` owns deterministic example snapshot generation.
- `packages/domain` owns cross-package contracts and selectors.
- `packages/mock-sim` supplies the provider wrapper over that example data.
- `packages/api-client` is the backend adapter seam.
- `packages/ui` holds reusable presentational components.
