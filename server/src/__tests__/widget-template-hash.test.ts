import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { resolveWidgetTemplateUri } from "../widget-template.js";

const assetsDir = path.join(process.cwd(), "dist", "assets");
const mappingPath = path.join(assetsDir, "widget-template-hashes.json");

function removeMappingFile() {
  try {
    rmSync(mappingPath);
  } catch {}
}

test("resolveWidgetTemplateUri uses hashed mapping when present", () => {
  mkdirSync(assetsDir, { recursive: true });
  writeFileSync(
    mappingPath,
    JSON.stringify(
      {
        version: 1,
        templates: {
          test_widget: {
            hash: "deadbeef",
            file: "test_widget-deadbeef.html",
          },
        },
      },
      null,
      2
    )
  );

  const hashedUri = resolveWidgetTemplateUri("test_widget");
  assert.equal(hashedUri, "ui://widgets/apps-sdk/test_widget-deadbeef.html");

  const fallbackUri = resolveWidgetTemplateUri("missing_widget");
  assert.equal(fallbackUri, "ui://widgets/apps-sdk/missing_widget.html");

  removeMappingFile();
});
