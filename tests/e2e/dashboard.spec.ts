/**
 * @fileoverview Verifies Aero Shield dashboard renders and updates in real-time across device sizes.
 *
 * @module       tests/e2e/dashboard
 * @exports      none — playwright spec
 * @dependsOn    @playwright/test, running web app (http://localhost:5173)
 * @usedBy       playwright test
 * @sideEffects  network — drives a browser against http://localhost:5173
 * @stability    stable
 * @tests        self
 */

import { expect, test } from "@playwright/test";

test("renders the Aero Shield dashboard on desktop and updates over time", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Aero Shield Dashboard")).toBeVisible();
  await expect(page.getByText("Threat Activity Timeline")).toBeVisible();

  const initial = await page.getByTestId("generated-at").textContent();
  await page.waitForTimeout(2200);
  const later = await page.getByTestId("generated-at").textContent();

  expect(later).not.toEqual(initial);
});

test("demo controls surface opens and exposes playback speed selector", async ({ page }) => {
  await page.goto("/");
  await page.locator("body").click();
  await page.keyboard.press("Shift+D");
  await expect(page.getByRole("button", { name: "Demo Ops" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Speed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
});

test("renders cleanly on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Aero Shield Dashboard")).toBeVisible();
  await expect(page.getByText("Individual Attack Detection")).toBeVisible();
});
