/**
 * @fileoverview Express request handlers for snapshot retrieval, SSE stream setup, event ingestion, scenario reset, and demo replay control.
 *
 * @module       api-server/handlers
 * @exports      getSnapshot, getStream, postIngest, postReset, stopReplayHandler
 * @dependsOn    express, @aero-shield/domain, translator, state, broadcast, demoReplay
 * @usedBy       index.ts
 * @sideEffects  reads INGEST_API_KEY env var, writes to response objects, mutates state
 * @stability    stable
 * @tests        no tests
 */

import type { Request, Response } from "express";
import type { ConfidenceUpdate } from "@aero-shield/domain";
import { translateEvent } from "./translator.js";
import { state } from "./state.js";
import { addClient, broadcast } from "./broadcast.js";
import { stopReplay } from "./demoReplay.js";

const INGEST_API_KEY = process.env["INGEST_API_KEY"];

export const getSnapshot = (_req: Request, res: Response): void => {
  res.json(state.getSnapshot());
};

export const getStream = (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  addClient(res);
  res.write(`event: snapshot\ndata: ${JSON.stringify(state.getSnapshot())}\n\n`);
};

export const postIngest = (req: Request, res: Response): void => {
  if (INGEST_API_KEY) {
    const auth = req.headers["authorization"] ?? "";
    if (auth !== `Bearer ${INGEST_API_KEY}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }
  const event = req.body as ConfidenceUpdate;
  if (
    !event ||
    event.type !== "confidence_update" ||
    !event.timestamp ||
    !Array.isArray(event.predictions)
  ) {
    res.status(400).json({ error: "Invalid confidence_update body" });
    return;
  }
  state.ingestEvent(event);
  const snapshot = translateEvent(event, state.getHistory(), state.getScenarioId());
  state.setSnapshot(snapshot);
  broadcast(snapshot);
  res.status(204).end();
};

export const postReset = (_req: Request, res: Response): void => {
  state.setScenario("baseline");
  res.json({ ok: true });
};

export const stopReplayHandler = (_req: Request, res: Response): void => {
  stopReplay();
  res.json({ ok: true });
};
