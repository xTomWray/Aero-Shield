import type { DemoSnapshot } from "@aero-shield/domain";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApiDemoProvider } from "../src/index";

const HYDRATED_SNAPSHOT: DemoSnapshot = {
  scenarioId: "intrusion",
  tick: 7,
  generatedAt: "2026-04-29T12:00:00.000Z",
  status: {
    label: "Operational",
    live: true,
    reviewWindow: "Last 30s",
    monitoredSignatures: 12,
    refreshCadence: "updates every 5s",
    subtitle: "Streaming from API",
  },
  simulation: {
    mode: "Live",
    injectedAttack: "GPS spoofing",
    detectedAttack: "GPS spoofing",
    confidence: 82,
    match: true,
    detectionState: "detecting",
    executionState: "active",
  },
  timeline: {
    windowSeconds: 30,
    windowLabel: "Last 30 seconds",
    ticks: ["0s", "10s", "20s", "30s"],
    tracks: [],
  },
  categories: [],
  summary: {
    averageDetectionRate: 82,
    averageChange: "+4%",
    topDetection: {
      title: "Top Detection",
      category: "Navigation",
      label: "GPS spoofing",
      confidence: 82,
      icon: "alert",
    },
    runnersUp: [
      {
        title: "Runner-Up #2",
        category: "Telemetry",
        label: "Signal drift",
        confidence: 34,
        icon: "bookmark",
      },
      {
        title: "Runner-Up #3",
        category: "Link",
        label: "Packet jitter",
        confidence: 21,
        icon: "bookmark",
      },
    ],
  },
};

class EventSourceStub {
  static instances: EventSourceStub[] = [];
  readonly url: string;
  onerror: (() => void) | null = null;
  private readonly listeners = new Map<string, Set<(event: globalThis.MessageEvent) => void>>();
  closed = false;

  constructor(url: string) {
    this.url = url;
    EventSourceStub.instances.push(this);
  }

  addEventListener(type: string, listener: (event: globalThis.MessageEvent) => void): void {
    const listeners =
      this.listeners.get(type) ?? new Set<(event: globalThis.MessageEvent) => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  close(): void {
    this.closed = true;
  }
}

describe("createApiDemoProvider", () => {
  let originalFetch: typeof globalThis.fetch | undefined;
  let originalEventSource: typeof globalThis.EventSource | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalEventSource = globalThis.EventSource;
    EventSourceStub.instances = [];
    globalThis.EventSource = EventSourceStub as unknown as typeof globalThis.EventSource;
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: typeof globalThis.fetch }).fetch;
    }

    if (originalEventSource) {
      globalThis.EventSource = originalEventSource;
    } else {
      delete (globalThis as { EventSource?: typeof globalThis.EventSource }).EventSource;
    }
  });

  it("hydrates from /snapshot on start and notifies subscribers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => HYDRATED_SNAPSHOT,
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const provider = createApiDemoProvider({ baseUrl: "http://localhost:3000" });
    const listener = vi.fn();
    provider.subscribe(listener);

    provider.start();
    await vi.waitFor(() => expect(provider.getSnapshot()).toEqual(HYDRATED_SNAPSHOT));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/snapshot");
    expect(EventSourceStub.instances).toHaveLength(1);
    expect(EventSourceStub.instances[0]?.url).toBe("http://localhost:3000/stream");
  });

  it("ignores a late /snapshot response after stop", async () => {
    let resolveFetch: ((value: { ok: boolean; json: () => Promise<DemoSnapshot> }) => void) | null = null;
    const fetchPromise = new Promise<{ ok: boolean; json: () => Promise<DemoSnapshot> }>((resolve) => {
      resolveFetch = resolve;
    });
    globalThis.fetch = vi.fn().mockReturnValue(fetchPromise) as unknown as typeof globalThis.fetch;

    const provider = createApiDemoProvider({ baseUrl: "http://localhost:3000" });
    const listener = vi.fn();
    provider.subscribe(listener);

    provider.start();
    provider.stop();
    resolveFetch?.({
      ok: true,
      json: async () => HYDRATED_SNAPSHOT,
    });
    await fetchPromise;
    await Promise.resolve();

    expect(provider.getSnapshot().generatedAt).toBe("1970-01-01T00:00:00.000Z");
    expect(listener).not.toHaveBeenCalled();
  });
});
