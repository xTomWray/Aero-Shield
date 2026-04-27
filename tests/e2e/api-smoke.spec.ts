import { expect, test } from "@playwright/test";

test("SSE stream delivers snapshot updates from the live API", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Aero Shield Dashboard")).toBeVisible();

  const initial = await page.getByTestId("generated-at").textContent();
  await page.waitForTimeout(2_500);
  const later = await page.getByTestId("generated-at").textContent();

  expect(later).not.toEqual(initial);
});

test("header shows the live API as the active source", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Source: API: http://localhost:3000")).toBeVisible();
});
