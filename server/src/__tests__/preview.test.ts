import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");

test("preview app files exist", () => {
  const previewIndex = path.join(repoRoot, "preview", "index.html");
  const previewEntry = path.join(repoRoot, "preview", "src", "index.tsx");

  assert.ok(existsSync(previewIndex), "preview/index.html should exist");
  assert.ok(existsSync(previewEntry), "preview/src/index.tsx should exist");
});
