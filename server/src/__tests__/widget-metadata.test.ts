import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  createScheduleServer,
  getScheduleWidgetMeta,
  WIDGET_TEMPLATE_URI,
} from "../server.js";

test("schedule widget metadata links to the widget template", () => {
  const meta = getScheduleWidgetMeta();

  assert.equal(meta["openai/outputTemplate"], WIDGET_TEMPLATE_URI);
  assert.equal(meta["openai/widgetAccessible"], true);
  assert.equal(meta["openai/resultCanProduceWidget"], true);
});

test("schedule widget styles enforce fixed height and horizontal scrolling", async () => {
  const componentPath = path.resolve(
    process.cwd(),
    "..",
    "web",
    "src",
    "app.tsx"
  );
  const componentSource = await readFile(componentPath, "utf-8");

  assert.ok(componentSource.includes("height: 400px;"));
  assert.ok(componentSource.includes("overflow-x: auto;"));
});

test("search_talks returns structured content with widget metadata", async () => {
  const server = createScheduleServer();
  const handlers = (server as unknown as { _requestHandlers: Map<string, unknown> })
    ._requestHandlers;
  const handler = handlers.get("tools/call") as
    | ((request: unknown, extra?: unknown) => Promise<unknown>)
    | undefined;

  assert.ok(handler, "expected tools/call handler to be registered");

  const cwd = process.cwd();
  process.chdir(path.resolve(cwd, ".."));
  try {
    const response = (await handler({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "search_talks", arguments: {} },
    })) as {
      structuredContent?: Record<string, unknown>;
      _meta?: Record<string, unknown>;
    };

    assert.ok(response.structuredContent, "expected structuredContent on response");
    assert.equal(response._meta?.["openai/outputTemplate"], WIDGET_TEMPLATE_URI);
  } finally {
    process.chdir(cwd);
  }
});
