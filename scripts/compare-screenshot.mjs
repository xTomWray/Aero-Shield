/* global console, process */

import fs from "node:fs";
import path from "node:path";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const referencePath = path.resolve(process.argv[2] || "AeroShielddashboard.png");
const actualPath = path.resolve(process.argv[3] || "visual-artifacts/dashboard-capture.png");
const diffPath = path.resolve(process.argv[4] || "visual-artifacts/dashboard-diff.png");

const reference = PNG.sync.read(fs.readFileSync(referencePath));
const actual = PNG.sync.read(fs.readFileSync(actualPath));

const width = Math.min(reference.width, actual.width);
const height = Math.min(reference.height, actual.height);
const diff = new PNG({ width, height });
const croppedReference = new PNG({ width, height });
const croppedActual = new PNG({ width, height });

PNG.bitblt(reference, croppedReference, 0, 0, width, height, 0, 0);
PNG.bitblt(actual, croppedActual, 0, 0, width, height, 0, 0);

const mismatchPixels = pixelmatch(
  croppedReference.data,
  croppedActual.data,
  diff.data,
  width,
  height,
  { threshold: 0.12 }
);

fs.mkdirSync(path.dirname(diffPath), { recursive: true });
fs.writeFileSync(diffPath, PNG.sync.write(diff));

const totalPixels = width * height;
const mismatchPercent = ((mismatchPixels / totalPixels) * 100).toFixed(2);

console.log(
  JSON.stringify(
    {
      referencePath,
      actualPath,
      diffPath,
      width,
      height,
      mismatchPixels,
      mismatchPercent
    },
    null,
    2
  )
);
