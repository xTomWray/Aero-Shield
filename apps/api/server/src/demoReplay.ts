/**
 * @fileoverview Loads fixture events from demo.json and replays them at configurable intervals, ingesting to state and broadcasting snapshots.
 *
 * @module       api-server/demoReplay
 * @exports      startReplay, stopReplay
 * @dependsOn    node:fs, node:path, node:url, @aero-shield/domain, translator, state, broadcast
 * @usedBy       handlers.ts, index.ts
 * @sideEffects  reads fixtures/demo.json, manages setInterval timer, mutates state, writes to broadcast
 * @stability    stable
 * @tests        no tests
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ConfidenceUpdate } from "@aero-shield/domain";
import { translateEvent } from "./translator.js";
import { state } from "./state.js";
import { broadcast } from "./broadcast.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dir, "../fixtures");
const INTERVAL_MS = Number(process.env["DEMO_REPLAY_INTERVAL_MS"] ?? 500);

let timer: ReturnType<typeof setInterval> | null = null;
let playlist: ConfidenceUpdate[] = [];
let cursor = 0;

function loadFixtures(): ConfidenceUpdate[] {
  const file = join(FIXTURES_DIR, "demo.json");
  try {
    return JSON.parse(readFileSync(file, "utf8")) as ConfidenceUpdate[];
  } catch {
    return [];
  }
}

export function startReplay(): void {
  stopReplay();
  playlist = loadFixtures();
  cursor = 0;
  timer = setInterval(() => {
    if (!playlist.length) return;
    const event: ConfidenceUpdate = {
      ...playlist[cursor % playlist.length]!,
      timestamp: new Date().toISOString(),
    };
    cursor += 1;
    state.ingestEvent(event);
    const snapshot = translateEvent(event, state.getHistory(), state.getScenarioId());
    state.setSnapshot(snapshot);
    broadcast(snapshot);
  }, INTERVAL_MS);
}

export function stopReplay(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
