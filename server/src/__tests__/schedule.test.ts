import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { loadSchedule } from "../schedule.js";

test("loadSchedule reads schedule.json from repo root", async () => {
  const cwd = process.cwd();
  process.chdir(path.resolve(cwd, ".."));
  try {
    const talks = await loadSchedule();
    assert.ok(Array.isArray(talks));
    assert.ok(talks.length > 0);
  } finally {
    process.chdir(cwd);
  }
});
