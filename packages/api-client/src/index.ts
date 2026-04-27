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
  private eventSource: EventSource | null = null;
  private running = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.connect();
  }

  stop(): void {
    this.running = false;
    this.cancelReconnect();
    this.disconnect();
  }

  setScenario(_id: ScenarioId): void {
    fetch(`${this.baseUrl}/reset`, { method: "POST" }).catch(() => {});
    if (this.running) {
      this.disconnect();
      this.connect();
    }
  }

  private connect(): void {
    const es = new EventSource(`${this.baseUrl}/stream`);
    this.eventSource = es;

    es.addEventListener("snapshot", (event: MessageEvent) => {
      try {
        this.snapshot = JSON.parse(event.data) as DemoSnapshot;
        this.emit();
      } catch {
        // Malformed event — keep last snapshot
      }
    });

    es.onerror = () => {
      es.close();
      this.eventSource = null;
      if (this.running) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          if (this.running) this.connect();
        }, RECONNECT_DELAY_MS);
      }
    };
  }

  private disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

export const createApiDemoProvider = (options: ApiDemoProviderOptions): DemoDataProvider =>
  new ApiDemoProvider(options);
