# Backend Integration Guide

This guide is written for a backend developer building the first real API for this frontend. After reading it you will be able to:

1. Run the frontend locally against the built-in mock data.
2. Understand the data contract your API must satisfy.
3. Wire your API into the frontend with minimal code changes.
4. Verify that everything works end-to-end.

---

## Table of Contents

1. [Repo Overview](#1-repo-overview)
2. [Running the Frontend Locally](#2-running-the-frontend-locally)
3. [How the Data Layer Works](#3-how-the-data-layer-works)
4. [The Data Contract — `DemoSnapshot`](#4-the-data-contract--demosnapshot)
5. [API Endpoints Your Backend Must Expose](#5-api-endpoints-your-backend-must-expose)
6. [Building the API Adapter](#6-building-the-api-adapter)
7. [Switching the Frontend to Your API](#7-switching-the-frontend-to-your-api)
8. [Environment Variables](#8-environment-variables)
9. [Utility Selectors](#9-utility-selectors)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Repo Overview

```
aero-shield/
├── apps/
│   ├── web/                    ← The React dashboard (ships to users)
│   └── api/
│       └── examplesim/         ← Deterministic snapshot generator (reference data)
├── packages/
│   ├── domain/                 ← Shared TypeScript types + provider contract
│   ├── mock-sim/               ← Built-in mock provider (no network needed)
│   ├── api-client/             ← Stub you will implement to connect your API
│   └── ui/                     ← Shared presentational components
└── docs/
    ├── SETUP.md
    ├── ARCHITECTURE.md
    └── INTEGRATION.md          ← You are here
```

**Key rule:** `apps/web` depends only on the `DemoDataProvider` interface (defined in `packages/domain`). It does not care whether data comes from the mock simulator or your real API — as long as it satisfies the interface.

---

## 2. Running the Frontend Locally

**Prerequisites:** Node.js 20+, pnpm 10+

```bash
# Install dependencies
pnpm install

# Start the dev server (opens http://localhost:5173 by default)
pnpm dev
```

The frontend starts in mock mode — no backend required. You will see the live dashboard cycling through simulated drone threat data.

---

## 3. How the Data Layer Works

The frontend uses a **provider pattern**:

```
DemoDataProvider (interface, packages/domain)
       ↑
       │ implements
       │
MockDemoProvider (packages/mock-sim)        ← used today, no network
       OR
createApiDemoProvider() (packages/api-client) ← you implement this
```

`AeroShieldApp` (in `apps/web/src/app/App.tsx`) accepts an optional `provider` prop:

```tsx
// Without prop → uses MockDemoProvider automatically
<AeroShieldApp />

// With prop → uses whatever provider you pass in
<AeroShieldApp provider={createApiDemoProvider({ baseUrl: "http://localhost:3000" })} />
```

The React side subscribes via `useSyncExternalStore`, which calls:
- `provider.subscribe(listener)` — register a callback to receive new data
- `provider.getSnapshot()` — synchronously read the latest snapshot

---

## 4. The Data Contract — `DemoSnapshot`

Every snapshot your API returns must match this TypeScript shape exactly (defined in `packages/domain/src/types.ts`):

```typescript
interface DemoSnapshot {
  scenarioId: ScenarioId;       // "baseline" | "storm-front" | "intrusion" | "recovery"
  tick: number;                 // monotonically increasing, resets to 0 on scenario switch
  generatedAt: string;          // ISO 8601 timestamp, e.g. "2025-04-24T10:00:00.000Z"
  status: DashboardStatus;
  simulation: DashboardSimulation;
  timeline: ThreatTimeline;
  categories: AttackCategory[];
  summary: DashboardSummary;
}
```

### 4.1 `DashboardStatus`

```typescript
interface DashboardStatus {
  label: string;               // e.g. "Operational"
  live: boolean;               // true when streaming live data
  reviewWindow: string;        // e.g. "30s centered on Now"
  monitoredSignatures: number; // total signatures the engine monitors, e.g. 37
  refreshCadence: string;      // e.g. "updates every 5s"
  subtitle: string;            // extended system state message
}
```

### 4.2 `DashboardSimulation`

```typescript
interface DashboardSimulation {
  mode: string;                // e.g. "Live" or "Replay"
  injectedAttack: string;      // the attack name that was injected
  detectedAttack: string;      // the attack name the engine identified
  confidence: number;          // 0–100
  match: boolean;              // true if detectedAttack === injectedAttack
  detectionState: string;      // e.g. "detecting", "uncertain", "missed"
  executionState: "active" | "queued";
}
```

### 4.3 `ThreatTimeline`

```typescript
interface ThreatTimeline {
  windowSeconds: number;       // total window width in seconds, e.g. 30
  windowLabel: string;         // e.g. "Last 30 seconds"
  ticks: string[];             // axis labels, e.g. ["0s", "10s", "20s", "30s"]
  tracks: TimelineTrack[];
}

interface TimelineTrack {
  id: string;                  // matches AttackCategory.id, e.g. "dos"
  label: string;               // display label, e.g. "DoS"
  tone: CategoryTone;          // "dos" | "exfiltration" | "firmware" | "injection" | "recon" | "tampering"
  events: TimelineEvent[];
}

interface TimelineEvent {
  startSecond: number;         // offset from start of window, e.g. 5
  durationSeconds: number;     // e.g. 8
  intensity: "low" | "medium" | "high";
  label: string;               // attack signature name
  state: "past" | "active" | "queued";
}
```

### 4.4 `AttackCategory`

```typescript
interface AttackCategory {
  id: string;                  // e.g. "dos"
  label: string;               // e.g. "DoS"
  tone: CategoryTone;          // same as TimelineTrack.tone
  count: number;               // number of distinct attacks in this category
  attacks: AttackDetection[];
  peakConfidence: number;      // highest confidence among all attacks (0–100)
}

interface AttackDetection {
  label: string;               // attack signature name
  confidence: number;          // 0–100
}
```

### 4.5 `DashboardSummary`

```typescript
interface DashboardSummary {
  averageDetectionRate: number; // 0–100
  averageChange: string;        // e.g. "+3% from last hour"
  topDetection: SummaryHighlight;
  runnersUp: SummaryHighlight[];
}

interface SummaryHighlight {
  title: string;      // e.g. "Top Detection" or "Runner-Up #2"
  category: string;   // category display name, e.g. "DoS"
  label: string;      // attack name
  confidence: number; // 0–100
  icon: "alert" | "bookmark"; // "alert" for top, "bookmark" for runners-up
}
```

### 4.6 Reference example

See `apps/api/examplesim/src/fixtures.ts` for concrete baseline values. That file is the source of truth for the mock data — use it as a guide when building your API's response structure.

---

## 5. API Endpoints Your Backend Must Expose

Your backend needs exactly **two endpoints**:

### `GET /snapshot?scenario=<id>`

Returns a `DemoSnapshot` JSON object for the requested scenario.

- **Query param:** `scenario` — one of `baseline`, `storm-front`, `intrusion`, `recovery`
- **Success:** HTTP 200, `Content-Type: application/json`, body is a valid `DemoSnapshot`
- **Error:** HTTP 400 if scenario is unknown; HTTP 500 for server errors

Example request:
```
GET http://localhost:3000/snapshot?scenario=baseline
```

Example response (abbreviated):
```json
{
  "scenarioId": "baseline",
  "tick": 42,
  "generatedAt": "2025-04-24T10:00:00.000Z",
  "status": {
    "label": "Operational",
    "live": true,
    "reviewWindow": "30s centered on Now",
    "monitoredSignatures": 37,
    "refreshCadence": "updates every 5s",
    "subtitle": "Real-time drone cyberattack detection · 37 attack signatures monitored"
  },
  "simulation": { "...": "..." },
  "timeline": { "...": "..." },
  "categories": [],
  "summary": { "...": "..." }
}
```

### `POST /scenario/<id>`

Tells the backend to switch the active scenario.

- **Path param:** `id` — one of `baseline`, `storm-front`, `intrusion`, `recovery`
- **Success:** HTTP 200 (body can be empty or `{ "ok": true }`)
- **Error:** HTTP 400 if scenario is unknown

Example request:
```
POST http://localhost:3000/scenario/intrusion
```

### CORS

The frontend dev server runs on `http://localhost:5173`. Your backend must allow cross-origin requests from that origin during development:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

In Express (Node.js), install the `cors` package and add:

```javascript
import cors from "cors";
app.use(cors({ origin: "http://localhost:5173" }));
```

---

## 6. Building the API Adapter

Open `packages/api-client/src/index.ts`. That file currently contains a stub that throws an error. Replace it with a real implementation.

The `DemoDataProvider` interface (defined in `packages/domain/src/provider.ts`) requires five methods:

| Method | What it must do |
|--------|----------------|
| `getSnapshot()` | Return the last fetched snapshot synchronously from an in-memory cache |
| `subscribe(listener)` | Register a callback; return an unsubscribe function |
| `start()` | Begin polling `GET /snapshot?scenario=<id>` on a timer; idempotent |
| `stop()` | Stop the poll loop; listeners stop receiving updates; idempotent |
| `setScenario(id)` | Call `POST /scenario/<id>`, reset cache, restart poll if it was running |

Here is a minimal working implementation you can paste into `packages/api-client/src/index.ts`:

```typescript
import type { DemoDataProvider, DemoSnapshot, ScenarioId } from "@aero-shield/domain";

export interface ApiDemoProviderOptions {
  baseUrl: string;           // e.g. "http://localhost:3000" — no trailing slash
  pollIntervalMs?: number;   // how often to fetch a new snapshot (default: 2000)
}

export const createApiDemoProvider = (options: ApiDemoProviderOptions): DemoDataProvider => {
  const { baseUrl, pollIntervalMs = 2000 } = options;

  let scenarioId: ScenarioId = "baseline";
  let snapshot: DemoSnapshot | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((fn) => fn());

  const fetchSnapshot = async () => {
    const res = await fetch(`${baseUrl}/snapshot?scenario=${scenarioId}`);
    if (!res.ok) throw new Error(`Snapshot fetch failed: ${res.status}`);
    snapshot = (await res.json()) as DemoSnapshot;
    emit();
  };

  return {
    getSnapshot() {
      if (!snapshot) throw new Error("No snapshot yet — call start() first.");
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    start() {
      if (timer) return; // idempotent — safe to call multiple times
      fetchSnapshot();   // immediate first fetch, don't wait for interval
      timer = setInterval(() => { fetchSnapshot(); }, pollIntervalMs);
    },

    stop() {
      if (!timer) return; // idempotent
      clearInterval(timer);
      timer = null;
    },

    setScenario(id) {
      scenarioId = id;
      snapshot = null;
      const wasRunning = timer !== null;
      this.stop();
      fetch(`${baseUrl}/scenario/${id}`, { method: "POST" }).then(() => {
        if (wasRunning) this.start();
      });
    },
  };
};
```

> **Note on errors:** The example above silently ignores fetch errors inside the poll loop. For production, you should catch errors and surface them (e.g. update a React error boundary or retry with backoff).

---

## 7. Switching the Frontend to Your API

Edit `apps/web/src/main.tsx` to pass your provider to `AeroShieldApp`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createApiDemoProvider } from "@aero-shield/api-client";
import { AeroShieldApp } from "./app/App";
import "./styles.css";

const provider = createApiDemoProvider({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AeroShieldApp provider={provider} />
  </React.StrictMode>
);
```

No other files need to change. The UI is fully decoupled from the data source — all components read from the provider through the `DemoDataProvider` interface.

---

## 8. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of your backend (no trailing slash) |
| `VITE_FORCE_MOCK` | `false` | Set `true` to always use the built-in mock, even if an API URL is configured |
| `VITE_INITIAL_SCENARIO` | `baseline` | Which scenario to load on first render |
| `VITE_LOG_LEVEL` | `warn` | Frontend log verbosity: `debug`, `info`, `warn`, `error` |

> Variables must be prefixed with `VITE_` to be accessible in the browser. They are inlined at build time by Vite and are **not** available at runtime on the server.

`.env.local` is git-ignored — never commit real credentials.

---

## 9. Utility Selectors

`packages/domain` exports two helper selectors you can use in your backend or in tests:

```typescript
import { getTopCategory, getDetectedAttackCount } from "@aero-shield/domain";

// Returns the AttackCategory with the highest peakConfidence
const top = getTopCategory(snapshot); // AttackCategory | undefined

// Returns total count of all attack detections across all categories
const total = getDetectedAttackCount(snapshot); // number
```

These are pure functions with no side effects — safe to call anywhere.

---

## 10. Troubleshooting

### Dashboard shows mock data even after pointing to my API

Check that `apps/web/src/main.tsx` has been updated to pass the `provider` prop. `<AeroShieldApp />` without a `provider` prop always falls back to `MockDemoProvider`.

### CORS errors in the browser console

Your backend is not sending the right headers. See the CORS section in §5 above.

### TypeScript errors when building the adapter

Run `pnpm typecheck` from the repo root. The error message will point to the exact field mismatch. Cross-reference the type definitions in `packages/domain/src/types.ts`.

### `getSnapshot()` throws "No snapshot yet"

You called `getSnapshot()` before the first `GET /snapshot` response returned. Always call `start()` before reading data, and only call `getSnapshot()` inside a `subscribe` listener or after the listener fires at least once.

### The scenario picker doesn't update the backend

`setScenario(id)` fires `POST /scenario/<id>`. Confirm your backend handles that route and returns HTTP 200. Use your browser's Network tab to inspect the request and response.

### Running the full verification suite

```bash
pnpm verify
# Equivalent to: pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All checks must pass before merging any changes.
