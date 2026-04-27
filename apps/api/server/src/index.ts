/**
 * @fileoverview Express server entry point with SSE heartbeat and SIGTERM cleanup contracts.
 *
 * @module       api-server/index
 * @exports      app (implicitly via server.listen)
 * @dependsOn    express, cors, fs, path, swagger-ui-express, js-yaml, handlers, demoReplay, broadcast
 * @usedBy       entry point
 * @sideEffects  reads PORT, CORS_ORIGIN, openapi.yaml env vars; starts HTTP server; manages heartbeat interval; registers SIGTERM handler
 * @stability    stable
 * @tests        no tests
 *
 * @invariants   SSE heartbeat interval runs every 15s (15_000 ms) to keep connections alive.
 *               SIGTERM triggers graceful shutdown: stopReplay() then server.close().
 *               Demo replay starts automatically on server boot and after POST /reset.
 */

import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { join } from "path";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import { getSnapshot, getStream, postIngest, postReset, stopReplayHandler } from "./handlers.js";
import { startReplay, stopReplay } from "./demoReplay.js";
import { heartbeat } from "./broadcast.js";

const app = express();
const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3000;

const spec = yaml.load(readFileSync(join(import.meta.dirname, "../openapi.yaml"), "utf8")) as object;

app.use(cors({ origin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/openapi.json", (_req, res) => { res.json(spec); });
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

app.get("/", (_req, res) => {
  res.json({
    name: "Aero Shield API",
    endpoints: [
      "GET /snapshot",
      "GET /stream",
      "POST /ingest",
      "POST /reset",
      "POST /replay/stop",
      "GET /docs",
      "GET /openapi.json",
    ],
  });
});

app.get("/snapshot", getSnapshot);
app.get("/stream", getStream);
app.post("/ingest", postIngest);
app.post("/reset", (req, res) => {
  postReset(req, res);
  startReplay();
});
app.post("/replay/stop", stopReplayHandler);

const server = app.listen(port, () => {
  console.log(`Aero Shield API running on http://localhost:${port}`);
  startReplay();
});

setInterval(heartbeat, 15_000);

process.on("SIGTERM", () => {
  stopReplay();
  server.close();
});
