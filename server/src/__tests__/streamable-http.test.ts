import assert from "node:assert/strict";
import test from "node:test";
import { createScheduleServer, WIDGET_TEMPLATE_URI } from "../server.js";

test("tools/list includes schedule tools and widget metadata", async () => {
  const server = createScheduleServer();
  const handlers = (
    server as unknown as { server: { _requestHandlers: Map<string, unknown> } }
  ).server._requestHandlers;
  const handler = handlers.get("tools/list") as
    | ((request: unknown, extra?: unknown) => Promise<unknown>)
    | undefined;

  assert.ok(handler, "expected tools/list handler to be registered");

  const response = (await handler({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  })) as {
    tools?: Array<{ name: string; _meta?: Record<string, unknown> }>;
  };

  const tools = response.tools ?? [];
  const searchTool = tools.find((tool) => tool.name === "search_talks");
  const detailTool = tools.find((tool) => tool.name === "get_talk_details");

  assert.ok(searchTool, "expected search_talks to be registered");
  assert.ok(detailTool, "expected get_talk_details to be registered");
  assert.equal(searchTool?._meta?.["openai/outputTemplate"], WIDGET_TEMPLATE_URI);
});
