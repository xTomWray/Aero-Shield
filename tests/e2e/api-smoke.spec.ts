/**
 * @fileoverview Verifies SSE stream delivers real-time snapshot updates from the live API.
 *
 * @module       tests/e2e/api-smoke
 * @exports      none — playwright spec
 * @dependsOn    @playwright/test, running web app (http://localhost:5173), running API server (http://localhost:3000)
 * @usedBy       playwright test
 * @sideEffects  network — drives a browser against http://localhost:5173 and http://localhost:3000
 * @stability    stable
 * @tests        self
 */

import { expect, test } from "@playwright/test";

test("SSE stream delivers snapshot updates from the live API", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByText("Aero Shield Dashboard")).toBeVisible();

  await expect
    .poll(async () => await page.getByTestId("generated-at").textContent(), {
      timeout: 10_000,
    })
    .not.toEqual("1970-01-01T00:00:00.000Z");

  const initial = await page.getByTestId("generated-at").textContent();

  const response = await request.post("http://localhost:3000/ingest", {
    data: {
      type: "confidence_update",
      timestamp: new Date().toISOString(),
      sequence: 1001,
      source_id: "playwright",
      window_id: "pw-1001",
      model_id: "playwright-fixture",
      model_version: "1.0.0",
      predictions: [
        { label: "gps-spoofing", confidence: 0.82 },
        { label: "altitude-spoofing", confidence: 0.31 },
        { label: "normal", confidence: 0.04 },
      ],
      top_label: "gps-spoofing",
      top_confidence: 0.82,
      threshold: 0.6,
      status: "alert",
    },
  });

  expect(response.status()).toBe(204);

  await expect
    .poll(async () => await page.getByTestId("generated-at").textContent(), {
      timeout: 10_000,
    })
    .not.toEqual(initial);
});

test("header shows the live API as the active source", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Source: API: http://localhost:3000")).toBeVisible();
});
