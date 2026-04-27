/**
 * @fileoverview Maps IDS model label strings to Aero Shield attack category IDs, supporting exact and prefix matching.
 *
 * @module       domain/labelMap
 * @exports      LABEL_CATEGORY_MAP, labelToCategory
 * @dependsOn    none
 * @usedBy       packages/domain/src/index.ts (re-export), apps/api/server/src/translator.ts
 * @sideEffects  none — pure data and function
 * @stability    stable
 * @tests        no tests
 *
 * Maps IDS model label strings to Aero Shield attack category IDs.
 *
 * Matching is exact-first, then prefix-based.
 * Any label not matched defaults to "dos".
 */
export const LABEL_CATEGORY_MAP: Record<string, string> = {
  // ── short prefix keys (kept for backwards compat with demo fixtures) ──────
  gps_spoofing:  "tampering",
  replay_attack: "tampering",
  jamming:       "dos",
  flooding:      "dos",
  exfil:         "exfiltration",
  firmware:      "firmware",
  recon:         "recon",
  injection:     "injection",

  // ── DoS (7) ──────────────────────────────────────────────────────────────
  "camera-feed-ros-topic-flooding":             "dos",
  "communication-link-flooding":                "dos",
  "denial-of-takeoff":                          "dos",
  "flight-termination":                         "dos",
  "geofencing-attack":                          "dos",
  "gps-offset-glitching":                       "dos",
  "wireless-deauthentication":                  "dos",

  // ── Exfiltration (6) ─────────────────────────────────────────────────────
  "camera-feed-eavesdropping":                  "exfiltration",
  "flight-log-extraction":                      "exfiltration",
  "ftp-eavesdropping":                          "exfiltration",
  "mission-extraction":                         "exfiltration",
  "parameter-extraction":                       "exfiltration",
  "wifi-client-data-leak":                      "exfiltration",

  // ── Firmware (2) ─────────────────────────────────────────────────────────
  "firmware-decompile":                         "firmware",
  "firmware-modding":                           "firmware",

  // ── Injection (9) ────────────────────────────────────────────────────────
  "camera-gimbal-takeover":                     "injection",
  "companion-computer-exploitation":            "injection",
  "companion-computer-web-ui-login-brute-force":"injection",
  "flight-mode-injection":                      "injection",
  "ground-control-station-hijacking":           "injection",
  "mavlink-command-injection":                  "injection",
  "return-to-home-override":                    "injection",
  "sensor-data-injection":                      "injection",
  "waypoint-injection":                         "injection",

  // ── Recon (7) ────────────────────────────────────────────────────────────
  "companion-computer-discovery":               "recon",
  "drone-discovery":                            "recon",
  "gps-telemetry-analysis":                     "recon",
  "ground-control-station-discovery":           "recon",
  "packet-sniffing":                            "recon",
  "protocol-fingerprinting":                    "recon",
  "wifi-analysis-cracking":                     "recon",

  // ── Tampering (8) ────────────────────────────────────────────────────────
  "altitude-spoofing":                          "tampering",
  "battery-spoofing":                           "tampering",
  "critical-error-spoofing":                    "tampering",
  "emergency-status-spoofing":                  "tampering",
  "gps-spoofing":                               "tampering",
  "satellite-spoofing":                         "tampering",
  "system-status-spoofing":                     "tampering",
  "vfr-hud-spoofing":                           "tampering",
};

/** Map a raw model label to an AttackCategory id. */
export function labelToCategory(label: string): string {
  if (LABEL_CATEGORY_MAP[label]) return LABEL_CATEGORY_MAP[label];
  const prefix = Object.keys(LABEL_CATEGORY_MAP).find((k) => label.startsWith(k));
  return prefix ? LABEL_CATEGORY_MAP[prefix] : "dos";
}
