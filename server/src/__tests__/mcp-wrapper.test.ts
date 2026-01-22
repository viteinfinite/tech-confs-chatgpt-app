import assert from "node:assert/strict";
import { request } from "node:http";
import test, { type TestContext } from "node:test";

import { createApp } from "../index.js";

function listen(
  app: Awaited<ReturnType<typeof createApp>>,
  t: TestContext
): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("error", reject);
    server.once("listening", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        resolve(address.port);
      } else {
        server.close();
        reject(new Error("Failed to bind test server"));
      }
    });
    t.after(() => new Promise<void>((done) => server.close(() => done())));
  });
}

test("POST /mcp handles tools/list", async (t) => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const app = await createApp();
  const port = await listen(app, t);

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  });

  const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path: "/mcp",
        method: "POST",
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  if (originalEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalEnv;
  }

  assert.equal(response.status, 200);

  const trimmed = response.body.trim();
  let parsed: { result?: { tools?: Array<{ name: string }> } };

  if (trimmed.startsWith("{")) {
    parsed = JSON.parse(trimmed) as { result?: { tools?: Array<{ name: string }> } };
  } else {
    const dataLine = trimmed
      .split("\n")
      .find((line) => line.startsWith("data: "));
    assert.ok(dataLine, "expected SSE data line");
    const jsonPayload = dataLine.slice("data: ".length);
    parsed = JSON.parse(jsonPayload) as { result?: { tools?: Array<{ name: string }> } };
  }

  const toolNames = parsed.result?.tools?.map((tool) => tool.name) ?? [];
  assert.ok(toolNames.includes("search_talks"));
});

test("POST /sse aliases to MCP", async (t) => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const app = await createApp();
  const port = await listen(app, t);

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path: "/sse",
        method: "POST",
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  assert.equal(response.status, 200);
  const trimmed = response.body.trim();
  const dataLine = trimmed
    .split("\n")
    .find((line) => line.startsWith("data: "));
  assert.ok(dataLine, "expected SSE data line");
  const jsonPayload = dataLine.slice("data: ".length);
  const parsed = JSON.parse(jsonPayload) as { result?: { tools?: Array<{ name: string }> } };
  const toolNames = parsed.result?.tools?.map((tool) => tool.name) ?? [];
  assert.ok(toolNames.includes("search_talks"));

  if (originalEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalEnv;
  }
});

test("GET /sse responds with 200", async (t) => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const app = await createApp();
  const port = await listen(app, t);

  const status = await new Promise<number>((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path: "/sse",
        method: "GET",
      },
      (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      }
    );
    req.on("error", reject);
    req.end();
  });

  assert.equal(status, 200);

  if (originalEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalEnv;
  }
});
