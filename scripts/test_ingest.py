"""Spells TEST on the Aero Shield threat timeline.

Strategy
--------
All TEST column events are pre-sent with timestamps 15-37 s in the future.
A real-time clock loop then drives the timeline window forward at CLOCK_HZ,
so the letters scroll smoothly from +15 s (right edge) to -15 s (off-screen).
Every event includes all 39 known attacks at 1-39 % so the Individual Attack
Detection panel is always fully populated.

Requires: make api
Usage:    python3 scripts/test_ingest.py
"""

import json
import time
import urllib.request
from datetime import datetime, timezone

URL = "http://localhost:3000"
THRESHOLD = 0.6
CLOCK_HZ = 5  # timeline window updates per second (200 ms ticks)
API_KEY = ""  # set if INGEST_API_KEY is configured

# One representative label per row (alphabetical category = top → bottom)
ROWS = [
    "camera-feed-ros-topic-flooding",  # row 0 → dos
    "camera-feed-eavesdropping",  # row 1 → exfiltration
    "firmware-decompile",  # row 2 → firmware
    "camera-gimbal-takeover",  # row 3 → injection
    "companion-computer-discovery",  # row 4 → recon
    "altitude-spoofing",  # row 5 → tampering
]

# All 39 attacks in sequential order — position determines confidence (1 % → 39 %)
ATTACKS = [
    # DoS (7) ─────────────────────────────────────────────────────────────────
    "camera-feed-ros-topic-flooding",
    "communication-link-flooding",
    "denial-of-takeoff",
    "flight-termination",
    "geofencing-attack",
    "gps-offset-glitching",
    "wireless-deauthentication",
    # Exfiltration (6) ────────────────────────────────────────────────────────
    "camera-feed-eavesdropping",
    "flight-log-extraction",
    "ftp-eavesdropping",
    "mission-extraction",
    "parameter-extraction",
    "wifi-client-data-leak",
    # Firmware (2) ────────────────────────────────────────────────────────────
    "firmware-decompile",
    "firmware-modding",
    # Injection (9) ───────────────────────────────────────────────────────────
    "camera-gimbal-takeover",
    "companion-computer-exploitation",
    "companion-computer-web-ui-login-brute-force",
    "flight-mode-injection",
    "ground-control-station-hijacking",
    "mavlink-command-injection",
    "return-to-home-override",
    "sensor-data-injection",
    "waypoint-injection",
    # Recon (7) ───────────────────────────────────────────────────────────────
    "companion-computer-discovery",
    "drone-discovery",
    "gps-telemetry-analysis",
    "ground-control-station-discovery",
    "packet-sniffing",
    "protocol-fingerprinting",
    "wifi-analysis-cracking",
    # Tampering (8) ───────────────────────────────────────────────────────────
    "altitude-spoofing",
    "battery-spoofing",
    "critical-error-spoofing",
    "emergency-status-spoofing",
    "gps-spoofing",
    "satellite-spoofing",
    "system-status-spoofing",
    "vfr-hud-spoofing",
]

assert len(ATTACKS) == 39, f"Expected 39, got {len(ATTACKS)}"

# Predictions payload: all 39 attacks at 1 %–39 % confidence
ALL_39 = [
    {"label": label, "confidence": round((i + 1) / 100, 2)}
    for i, label in enumerate(ATTACKS)
]

# ── Letter patterns ───────────────────────────────────────────────────────────
# Each entry = one time-column; values = row indices that are active.
# Rows: 0=DoS 1=Exfil 2=Firmware 3=Injection 4=Recon 5=Tampering
#
#  T              E              S              T
#  ═══════════    ═══════════    ·  ═══════════  ═══════════   row 0 DoS
#  ·  ·  █  ·  · █  ·  ·  ·  · █  ·  ·  ·  ·  ·  ·  █  ·  · row 1 Exfil
#  ·  ·  █  ·  · █  ═══  ·  · · ═══════  ·  ·  ·  ·  █  ·  · row 2 Firmware
#  ·  ·  █  ·  · █  ·  ·  ·  · ·  ·  ·  ·  █  ·  ·  █  ·  · row 3 Injection
#  ·  ·  █  ·  · █  ·  ·  ·  · ·  ·  ·  ·  █  ·  ·  █  ·  · row 4 Recon
#  ·  ·  █  ·  · ═══════════  · ═══════  ·  ·  ·  ·  █  ·  · row 5 Tampering

T = [
    [0],  # crossbar left   (DoS)
    [0],
    [0, 1, 2, 3, 4, 5],  # centre: full 6-row stem + crossbar
    [0],
    [0],  # crossbar right  (DoS)
]

E = [
    [0, 1, 2, 3, 4, 5],  # left vertical stroke (all 6 rows)
    [0, 2, 5],  # top + mid + bottom bars
    [0, 2, 5],
    [0, 5],  # top + bottom bars only
    [0, 5],  # right end of top/bottom bars
]

S = [
    [1, 5],  # upper-left + lower-left edge
    [0, 2, 5],  # top-right bar + middle bar + lower-left bar
    [0, 2, 5],
    [0, 2, 5],
    [0, 3, 4],  # top-right corner + lower-right side
]

SPACE = [[]]  # one blank second

TEST_COLS = T + SPACE + E + SPACE + S + SPACE + T  # 23 columns


# ── HTTP helpers ──────────────────────────────────────────────────────────────


def ms_to_iso(ms: int) -> str:
    dt = datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{ms % 1000:03d}Z"


def post(path: str, body: dict) -> int:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{URL}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    if API_KEY:
        req.add_header("Authorization", f"Bearer {API_KEY}")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def make_event(
    seq: int,
    top_label: str,
    top_confidence: float,
    timestamp_ms: int,
) -> dict:
    return {
        "type": "confidence_update",
        "timestamp": ms_to_iso(timestamp_ms),
        "sequence": seq,
        "source_id": "uav_test",
        "window_id": f"w{seq:04d}",
        "model_id": "test-pattern",
        "model_version": "1.0.0",
        "predictions": ALL_39,  # all 39 attacks at 1 %–39 %
        "top_label": top_label,
        "top_confidence": top_confidence,
        "threshold": THRESHOLD,
        "status": "alert" if top_confidence >= THRESHOLD else "normal",
    }


# ── Main ──────────────────────────────────────────────────────────────────────


def main() -> None:
    print(f"Target  : {URL}")
    print(f"Pattern : TEST  ({len(TEST_COLS)} cols, ~52 s total scroll)")
    print(f"Clock   : {CLOCK_HZ} Hz ({1000 // CLOCK_HZ} ms ticks)")
    print()

    post("/replay/stop", {})
    time.sleep(0.2)

    script_start_ms = int(time.time() * 1000)
    seq = 0

    # Phase 1 — pre-send all TEST column events with FUTURE timestamps
    # Col 0 → +15 s, col 1 → +16 s, …, col 22 → +37 s
    print("Pre-loading TEST events (appear at +15 s)…")
    for col_idx, active_rows in enumerate(TEST_COLS):
        col_ms = script_start_ms + (15 + col_idx) * 1000
        for row_idx in active_rows:
            post("/ingest", make_event(seq, ROWS[row_idx], 0.75, col_ms))
            seq += 1
    print(f"  {seq} events pre-loaded.  Scrolling now…\n")

    # Phase 2 — real-time clock drives the window forward at CLOCK_HZ
    # Runs for 52 s: TEST enters at +15 s and exits at -15 s (full scroll-through)
    tick_ms = 1000 // CLOCK_HZ
    total_ticks = 52 * CLOCK_HZ
    for tick in range(total_ticks):
        clock_ms = script_start_ms + tick * tick_ms
        post("/ingest", make_event(seq, "normal", 0.001, clock_ms))
        seq += 1
        time.sleep(tick_ms / 1000)

    print("TEST complete — restarting replay.")
    post("/reset", {})


if __name__ == "__main__":
    main()
    print("Done.")
