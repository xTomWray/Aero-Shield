.PHONY: dev ui api api-watch \
        build lint typecheck test test-watch e2e e2e-api e2e-headed \
        verify install clean help

# ──────────────────────────────────────────────
# Development
# ──────────────────────────────────────────────

SESSION := aero-shield

## Launch API + web UI in a tmux session (side-by-side panes, Ctrl-b d to detach)
dev:
	@tmux kill-session -t $(SESSION) 2>/dev/null || true
	@tmux new-session -d -s $(SESSION) \
	  "cd '$(CURDIR)' && corepack pnpm --filter @aero-shield/api-server start; echo 'API exited — press enter'; read"
	@tmux split-window -h -t $(SESSION) \
	  "cd '$(CURDIR)' && VITE_API_BASE_URL=http://localhost:3000 corepack pnpm --filter @aero-shield/web dev; echo 'UI exited — press enter'; read"
	@tmux select-pane -t $(SESSION):0.1
	@tmux attach-session -t $(SESSION)

## Start the web UI connected to the local API server
#  Requires: make api running in a separate terminal
#  Reads VITE_API_BASE_URL=http://localhost:3000
ui:
	VITE_API_BASE_URL=http://localhost:3000 corepack pnpm --filter @aero-shield/web dev

## Start the API server (replays fixture files, accepts live POST /ingest)
#  GET  /snapshot        → current DemoSnapshot JSON
#  GET  /stream          → SSE stream of snapshot events (used by the web UI)
#  POST /ingest          → push a live ConfidenceUpdate event
#  POST /reset           → restart demo replay from the beginning
#  POST /replay/stop     → pause background demo replay
#  GET  /docs            → Swagger UI interactive API docs
#  GET  /openapi.json    → raw OpenAPI 3.1 spec (import into Postman/Insomnia)
#  PORT env var overrides the default port 3000
api:
	corepack pnpm --filter @aero-shield/api-server start

## Start the API server with hot-reload (watches src/ for changes)
api-watch:
	corepack pnpm --filter @aero-shield/api-server dev

# ──────────────────────────────────────────────
# Build & Quality
# ──────────────────────────────────────────────

## Build the web app for production (output: apps/web/dist/)
build:
	corepack pnpm build

## Run ESLint across the entire monorepo
lint:
	corepack pnpm lint

## Run TypeScript type-checking across all workspace packages
typecheck:
	corepack pnpm typecheck

## Run all unit and integration tests (vitest, single pass)
test:
	corepack pnpm test

## Run tests in watch mode (re-runs on file save)
test-watch:
	corepack pnpm test:watch

## Run Playwright end-to-end tests against the running dev server
e2e:
	corepack pnpm test:e2e

## Run E2E suite in headed Chrome with list reporter (for debugging)
e2e-headed:
	corepack pnpm exec playwright test --config=tests/e2e/playwright.config.ts --headed --reporter=list

## Run API smoke E2E test (starts API + UI automatically)
e2e-api:
	corepack pnpm exec playwright test --config=tests/e2e/playwright.api.config.ts

## Full CI suite: lint, typecheck, test, build
verify:
	corepack pnpm verify

# ──────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────

## Install all workspace dependencies (run once after cloning)
install:
	corepack pnpm install

## Delete build artefacts and Vite dev cache
clean:
	rm -rf apps/web/dist apps/web/node_modules/.vite

# ──────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────

## Show this help message
help:
	@printf "\n\033[1mAero Shield — make targets\033[0m\n\n"
	@awk 'BEGIN{desc=""} \
	  /^## /{desc=substr($$0,4); next} \
	  /^[a-zA-Z0-9_-]+:/{gsub(/:.*$$/,"",$$1); printf "  \033[36m%-18s\033[0m %s\n", $$1, desc; desc=""} \
	  /^[^#]/{desc=""}' \
	  $(MAKEFILE_LIST)
	@printf "\n"
