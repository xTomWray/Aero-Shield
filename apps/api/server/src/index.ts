/**
 * @fileoverview Express server entry point with SSE heartbeat and graceful shutdown.
 *
 * @module       api-server/index
 * @exports      app (implicitly via server.listen)
 * @dependsOn    express, cors, fs, path, swagger-ui-express, js-yaml, handlers, broadcast
 * @usedBy       entry point
 * @sideEffects  reads PORT, CORS_ORIGIN, openapi.yaml env vars; starts HTTP server; manages heartbeat interval; registers SIGTERM handler
 * @stability    stable
 * @tests        no tests
 *
 * @invariants   SSE heartbeat interval runs every 15s (15_000 ms) to keep connections alive.
 *               SIGTERM triggers graceful shutdown via server.close().
 */

import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { join } from "path";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import { getSnapshot, getStream, postIngest, postReset } from "./handlers.js";
import { heartbeat } from "./broadcast.js";

const app = express();
const port = globalThis.process.env["PORT"] ? Number(globalThis.process.env["PORT"]) : 3000;

const spec = yaml.load(readFileSync(join(import.meta.dirname, "../openapi.yaml"), "utf8")) as object;

app.use(cors({ origin: globalThis.process.env["CORS_ORIGIN"] ?? "http://localhost:5173" }));
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
      "GET /docs",
      "GET /openapi.json",
    ],
  });
});

app.get("/snapshot", getSnapshot);
app.get("/stream", getStream);
app.post("/ingest", postIngest);
app.post("/reset", postReset);

const server = app.listen(port, () => {
  console.log(`Aero Shield API running on http://localhost:${port}`);
});

setInterval(heartbeat, 15_000);

globalThis.process.on("SIGTERM", () => {
  server.close();
});
