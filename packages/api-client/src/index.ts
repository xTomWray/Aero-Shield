/**
 * @fileoverview Subscribes to the API SSE stream and exposes snapshots as a DemoDataProvider.
 *
 * @module       api-client/index
 * @exports      createApiDemoProvider, ApiDemoProviderOptions
 * @dependsOn    @aero-shield/domain (DemoDataProvider, DemoSnapshot, ScenarioId), browser EventSource API
 * @usedBy       apps/web/src/app/App.tsx
 * @sideEffects  network — opens EventSource to /stream, GET to /snapshot, POST to /reset
 * @stability    stable
 * @tests        ../tests/apiClient.test.ts
 */

import type { DemoDataProvider, DemoSnapshot, ScenarioId } from "@aero-shield/domain";

export interface ApiDemoProviderOptions {
  /** Base URL of the API server (no trailing slash). e.g. "http://localhost:3000" */
  baseUrl: string;
}

/** Placeholder shown while the SSE connection is being established. */
const CONNECTING_SNAPSHOT: DemoSnapshot = {
  scenarioId: "baseline",
  tick: 0,
  generatedAt: new Date(0).toISOString(),
  status: {
    label: "Connecting",
    live: false,
    reviewWindow: "—",
    monitoredSignatures: 0,
    refreshCadence: "connecting",
    subtitle: "Establishing connection to API…",
  },
  simulation: {
    mode: "—",
    injectedAttack: "—",
    detectedAttack: "—",
    confidence: 0,
    match: false,
    detectionState: "connecting",
    executionState: "queued",
  },
  timeline: {
    windowSeconds: 30,
    windowLabel: "—",
    ticks: ["0s", "10s", "20s", "30s"],
    tracks: [],
  },
  categories: [],
  summary: {
    averageDetectionRate: 0,
    averageChange: "—",
    topDetection: { title: "Top Detection", category: "—", label: "—", confidence: 0, icon: "alert" },
    runnersUp: [
      { title: "Runner-Up #2", category: "—", label: "—", confidence: 0, icon: "bookmark" as const },
      { title: "Runner-Up #3", category: "—", label: "—", confidence: 0, icon: "bookmark" as const },
    ],
  },
};

const RECONNECT_DELAY_MS = 2_000;

class ApiDemoProvider implements DemoDataProvider {
  private readonly baseUrl: string;
  private snapshot: DemoSnapshot = CONNECTING_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  private eventSource: globalThis.EventSource | null = null;
  private running = false;
  private reconnectTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private lifecycleId = 0;

  constructor(options: ApiDemoProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  getSnapshot(): DemoSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const lifecycleId = ++this.lifecycleId;
    this.connect(lifecycleId);
    void this.hydrateSnapshot(lifecycleId);
  }

  stop(): void {
    this.running = false;
    this.lifecycleId += 1;
    this.cancelReconnect();
    this.disconnect();
  }

  setScenario(id: ScenarioId): void {
    void id;
    globalThis.fetch(`${this.baseUrl}/reset`, { method: "POST" }).catch(() => {});
    if (this.running) {
      this.disconnect();
      const lifecycleId = ++this.lifecycleId;
      this.connect(lifecycleId);
    }
  }

  private connect(lifecycleId: number): void {
    const es = new globalThis.EventSource(`${this.baseUrl}/stream`);
    this.eventSource = es;

    es.addEventListener("snapshot", (event: globalThis.MessageEvent) => {
      if (!this.isActiveLifecycle(lifecycleId) || this.eventSource !== es) return;
      try {
        this.snapshot = JSON.parse(event.data) as DemoSnapshot;
        this.emit();
      } catch {
        // Malformed event — keep last snapshot
      }
    });

    es.onerror = () => {
      if (this.eventSource !== es) return;
      es.close();
      this.eventSource = null;
      if (this.running) {
        this.reconnectTimer = globalThis.setTimeout(() => {
          this.reconnectTimer = null;
          if (this.isActiveLifecycle(lifecycleId)) {
            this.connect(lifecycleId);
          }
        }, RECONNECT_DELAY_MS);
      }
    };
  }

  private async hydrateSnapshot(lifecycleId: number): Promise<void> {
    try {
      const response = await globalThis.fetch(`${this.baseUrl}/snapshot`);
      if (!response.ok) return;

      const snapshot = (await response.json()) as DemoSnapshot;
      if (!this.isActiveLifecycle(lifecycleId)) return;

      this.snapshot = snapshot;
      this.emit();
    } catch {
      // Best-effort hydration — wait for SSE if the initial snapshot fetch fails.
    }
  }

  private disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      globalThis.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private isActiveLifecycle(lifecycleId: number): boolean {
    return this.running && this.lifecycleId === lifecycleId;
  }
}

export const createApiDemoProvider = (options: ApiDemoProviderOptions): DemoDataProvider =>
  new ApiDemoProvider(options);
