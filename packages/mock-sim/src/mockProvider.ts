import type {
  DemoDataControls,
  DemoDataProvider,
  DemoRuntimeState,
  DemoSnapshot,
  ScenarioId
} from "@aero-shield/domain";

import { generateSnapshot } from "./scenarios";

export interface MockDemoProviderOptions {
  initialScenario?: ScenarioId;
  tickIntervalMs?: number;
}

export class MockDemoProvider implements DemoDataProvider, DemoDataControls {
  private readonly listeners = new Set<() => void>();

  private readonly tickIntervalMs: number;

  private timer: ReturnType<typeof setInterval> | null = null;

  private scenarioId: ScenarioId;

  private tick = 0;

  private speedMultiplier = 1;

  private snapshot: DemoSnapshot;

  public constructor(options: MockDemoProviderOptions = {}) {
    this.scenarioId = options.initialScenario ?? "baseline";
    this.tickIntervalMs = options.tickIntervalMs ?? 1800;
    this.snapshot = generateSnapshot(this.scenarioId, this.tick);
  }

  public getSnapshot(): DemoSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.advance();
    }, Math.max(120, this.tickIntervalMs / this.speedMultiplier));
  }

  public stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
    this.emit();
  }

  public reset(): void {
    this.tick = 0;
    this.snapshot = generateSnapshot(this.scenarioId, this.tick);
    this.emit();
  }

  public setScenario(id: ScenarioId): void {
    this.scenarioId = id;
    this.tick = 0;
    this.snapshot = generateSnapshot(this.scenarioId, this.tick);
    this.restartIfRunning();
    this.emit();
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.5, Math.min(multiplier, 4));
    this.restartIfRunning();
    this.emit();
  }

  public getRuntimeState(): DemoRuntimeState {
    return {
      isRunning: this.timer !== null,
      speedMultiplier: this.speedMultiplier
    };
  }

  private advance(): void {
    this.tick += 1;
    this.snapshot = generateSnapshot(this.scenarioId, this.tick);
    this.emit();
  }

  private restartIfRunning(): void {
    const wasRunning = this.timer !== null;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (wasRunning) {
      this.start();
    }
  }

  private emit(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}
