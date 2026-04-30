/**
 * @fileoverview Generates ConfidenceUpdate fixture files for API replay.
 *
 * @module       scripts/gen-fixtures
 * @exports      none — script
 * @dependsOn    node:fs, node:path, node:url
 * @usedBy       run manually: node scripts/gen-fixtures.mjs
 * @sideEffects  writes data/runs/{baseline,storm-front,intrusion,recovery}.json
 * @stability    stable
 * @tests        no tests
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dir, "../data/runs");

mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Attack labels that map correctly via labelToCategory prefix matching:
 *   recon-*       → recon        (starts with "recon")
 *   injection-*   → injection    (starts with "injection")
 *   gps_spoofing  → tampering    (exact match)
 *   replay_attack → tampering    (exact match)
 *   flooding-*    → dos          (starts with "flooding")
 *   jamming-*     → dos          (starts with "jamming")
 *   exfil-*       → exfiltration (starts with "exfil")
 *   firmware-*    → firmware     (starts with "firmware")
 *   normal        → excluded from category display
 */
const ATTACK_LABELS = [
  "recon-discovery",
  "recon-scan",
  "injection-waypoint",
  "injection-brute-force",
  "gps_spoofing",
  "replay_attack",
  "flooding-camera",
  "jamming-link",
  "exfil-log",
  "exfil-camera",
  "firmware-mod",
];

const PROFILES = {
  baseline: {
    "recon-discovery": { active: 0.14, bg: 0.06 },
    "recon-scan": { active: 0.12, bg: 0.05 },
    "injection-waypoint": { active: 0.21, bg: 0.07 },
    "injection-brute-force": { active: 0.15, bg: 0.06 },
    gps_spoofing: { active: 0.18, bg: 0.06 },
    replay_attack: { active: 0.12, bg: 0.05 },
    "flooding-camera": { active: 0.88, bg: 0.11 },
    "jamming-link": { active: 0.09, bg: 0.04 },
    "exfil-log": { active: 0.17, bg: 0.06 },
    "exfil-camera": { active: 0.14, bg: 0.05 },
    "firmware-mod": { active: 0.13, bg: 0.05 },
  },
  "storm-front": {
    "recon-discovery": { active: 0.11, bg: 0.05 },
    "recon-scan": { active: 0.09, bg: 0.04 },
    "injection-waypoint": { active: 0.12, bg: 0.05 },
    "injection-brute-force": { active: 0.10, bg: 0.04 },
    gps_spoofing: { active: 0.22, bg: 0.08 },
    replay_attack: { active: 0.15, bg: 0.06 },
    "flooding-camera": { active: 0.82, bg: 0.10 },
    "jamming-link": { active: 0.11, bg: 0.04 },
    "exfil-log": { active: 0.15, bg: 0.06 },
    "exfil-camera": { active: 0.12, bg: 0.05 },
    "firmware-mod": { active: 0.10, bg: 0.04 },
  },
  intrusion: {
    "recon-discovery": { active: 0.18, bg: 0.07 },
    "recon-scan": { active: 0.15, bg: 0.06 },
    "injection-waypoint": { active: 0.22, bg: 0.09 },
    "injection-brute-force": { active: 0.19, bg: 0.08 },
    gps_spoofing: { active: 0.16, bg: 0.06 },
    replay_attack: { active: 0.10, bg: 0.04 },
    "flooding-camera": { active: 0.91, bg: 0.12 },
    "jamming-link": { active: 0.08, bg: 0.03 },
    "exfil-log": { active: 0.14, bg: 0.05 },
    "exfil-camera": { active: 0.11, bg: 0.04 },
    "firmware-mod": { active: 0.11, bg: 0.04 },
  },
  recovery: {
    "recon-discovery": { active: 0.09, bg: 0.04 },
    "recon-scan": { active: 0.07, bg: 0.03 },
    "injection-waypoint": { active: 0.10, bg: 0.04 },
    "injection-brute-force": { active: 0.08, bg: 0.03 },
    gps_spoofing: { active: 0.13, bg: 0.05 },
    replay_attack: { active: 0.09, bg: 0.04 },
    "flooding-camera": { active: 0.73, bg: 0.09 },
    "jamming-link": { active: 0.06, bg: 0.03 },
    "exfil-log": { active: 0.12, bg: 0.05 },
    "exfil-camera": { active: 0.10, bg: 0.04 },
    "firmware-mod": { active: 0.08, bg: 0.03 },
  },
};

const PHASE_CYCLE = [
  "recon-discovery",
  "injection-waypoint",
  "flooding-camera",
  "exfil-log",
];

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function buildPredictions(profile, phaseLabel, tick) {
  const preds = ATTACK_LABELS.map((label, idx) => {
    const levels = profile[label];
    const base = label === phaseLabel ? levels.active : levels.bg;
    const variation = base * 0.06 * Math.sin((tick * 0.9 + idx) * 1.1);
    return { label, confidence: round3(Math.max(0.01, Math.min(0.99, base + variation))) };
  });

  const topConf = Math.max(...preds.map((p) => p.confidence));
  preds.push({ label: "normal", confidence: round3(Math.max(0.02, 0.65 - topConf)) });

  return preds;
}

function generateScenarioFixtures(scenarioId) {
  const profile = PROFILES[scenarioId];
  const events = [];

  for (let i = 0; i < 20; i++) {
    const phaseLabel = PHASE_CYCLE[Math.floor(i / 5) % PHASE_CYCLE.length];
    const predictions = buildPredictions(profile, phaseLabel, i);

    const top = predictions
      .filter((p) => p.label !== "normal")
      .reduce((best, p) => (p.confidence > best.confidence ? p : best));

    const topConf = top.confidence;
    const status = topConf >= 0.6 ? "alert" : topConf >= 0.4 ? "warning" : "normal";

    events.push({
      type: "confidence_update",
      timestamp: new Date(Date.UTC(2026, 3, 22, 12, i % 60, 0)).toISOString(),
      sequence: i,
      source_id: "uav_01",
      window_id: `w_${i}`,
      model_id: "mavlink_ids_rf_v1",
      model_version: "1.0.0",
      predictions,
      top_label: top.label,
      top_confidence: topConf,
      threshold: 0.6,
      status,
    });
  }

  return events;
}

for (const scenarioId of Object.keys(PROFILES)) {
  const fixtures = generateScenarioFixtures(scenarioId);
  const outPath = join(OUTPUT_DIR, `${scenarioId}.json`);
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2));
  const alerts = fixtures.filter((e) => e.status === "alert").length;
  const normals = fixtures.filter((e) => e.status === "normal").length;
  globalThis.console.log(
    `Generated ${scenarioId}.json — ${fixtures.length} events (${alerts} alert, ${normals} normal)`,
  );
}
