/* global console, process */

import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

const url = process.argv[2] || "http://127.0.0.1:4173";
const outputPath = path.resolve(process.argv[3] || "visual-artifacts/dashboard-capture.png");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 2473, height: 1344 },
  deviceScaleFactor: 1
});

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: outputPath });
  console.log(`Saved dashboard screenshot to ${outputPath}`);
} finally {
  await browser.close();
}
