"""Replay a saved demo run file through POST /ingest against the live API.

@module       scripts/stream-run
@exports      none — script
@dependsOn    stdlib argparse, json, os, time, urllib
@usedBy       run manually: python3 scripts/stream_run.py data/runs/demo.json
@sideEffects  network — POSTs to http://localhost:3000/ingest
@stability    stable
@tests        no tests — manual QA tool

Usage
-----
python3 scripts/stream_run.py data/runs/demo.json
python3 scripts/stream_run.py data/runs/demo.json --once --interval-ms 250
"""

import argparse
import json
import os
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def post(base_url: str, body: dict, api_key: str) -> int:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{base_url}/ingest",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")
    with urllib.request.urlopen(req, timeout=5) as resp:
        return resp.status


def load_run(path: Path) -> list[dict]:
    payload = json.loads(path.read_text())
    if not isinstance(payload, list) or not all(isinstance(item, dict) for item in payload):
        raise ValueError("Run file must be a JSON array of event objects")
    return payload


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Replay a saved ConfidenceUpdate run file through POST /ingest.",
    )
    parser.add_argument("run_json", help="Path to a JSON file containing ConfidenceUpdate[]")
    parser.add_argument(
        "--url",
        default="http://localhost:3000",
        help="Base URL for the API server (default: http://localhost:3000)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Send the run one time and exit instead of looping forever",
    )
    parser.add_argument(
        "--interval-ms",
        type=int,
        default=500,
        help="Delay between events in milliseconds (default: 500)",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    api_key = os.environ.get("INGEST_API_KEY", "")
    run_path = Path(args.run_json)
    events = load_run(run_path)

    if args.interval_ms < 0:
        raise SystemExit("--interval-ms must be >= 0")

    print(f"Target : {args.url}")
    print(f"Run    : {run_path}")
    print(f"Events : {len(events)}")
    print(f"Mode   : {'once' if args.once else 'loop'}")
    print(f"Cadence: {args.interval_ms} ms")

    iteration = 0
    while True:
        iteration += 1
        print(f"Streaming iteration {iteration}...")
        for event in events:
            payload = dict(event)
            payload["timestamp"] = utc_now_iso()
            status = post(args.url.rstrip("/"), payload, api_key)
            if status != 204:
                raise SystemExit(f"Unexpected response status {status} from POST /ingest")
            if args.interval_ms:
                time.sleep(args.interval_ms / 1000)
        if args.once:
            break


if __name__ == "__main__":
    main()
