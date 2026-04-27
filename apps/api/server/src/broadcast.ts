/**
 * @fileoverview Manages SSE client connections and broadcasts DemoSnapshot updates to all connected clients.
 *
 * @module       api-server/broadcast
 * @exports      addClient, broadcast, heartbeat
 * @dependsOn    express, @aero-shield/domain
 * @usedBy       handlers.ts, demoReplay.ts, index.ts
 * @sideEffects  mutates global clients Set, writes to response streams
 * @stability    stable
 * @tests        no tests (covered indirectly via handlers.test.ts)
 */

import type { Response } from "express";
import type { DemoSnapshot } from "@aero-shield/domain";

const clients = new Set<Response>();

export function addClient(res: Response): void {
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

export function broadcast(snapshot: DemoSnapshot): void {
  const payload = `event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`;
  for (const res of clients) res.write(payload);
}

export function heartbeat(): void {
  for (const res of clients) res.write(": ping\n\n");
}
