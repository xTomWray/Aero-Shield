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
