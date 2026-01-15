import assert from "node:assert/strict";
import { request } from "node:http";
import test from "node:test";
import { createHttpServer } from "../server.js";

function listen(server: ReturnType<typeof createHttpServer>): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        resolve(address.port);
      } else {
        reject(new Error("Failed to bind test server"));
      }
    });
  });
}

function closeServer(server: ReturnType<typeof createHttpServer>): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

test("GET /mcp opens SSE and POST /mcp/messages accepts requests", async (t) => {
  const httpServer = createHttpServer();
  t.after(() => closeServer(httpServer));

  const port = await listen(httpServer);
  const sseSession = await new Promise<{
    sessionId: string;
    close: () => void;
  }>((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path: "/mcp",
        method: "GET",
        headers: {
          Accept: "text/event-stream",
        },
      },
      (res) => {
        assert.equal(res.statusCode, 200);
        const contentType = res.headers["content-type"];
        assert.ok(
          typeof contentType === "string" &&
            contentType.includes("text/event-stream")
        );
        res.setEncoding("utf8");
        res.once("data", (chunk) => {
          const payload = String(chunk);
          const match = payload.match(/sessionId=([^\s]+)/);
          if (!match?.[1]) {
            reject(new Error("Expected sessionId in SSE endpoint event"));
            res.destroy();
            return;
          }
          resolve({
            sessionId: match[1],
            close: () => res.destroy(),
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });

  const { sessionId, close } = sseSession;

  const postStatus = await new Promise<number>((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path: `/mcp/messages?sessionId=${encodeURIComponent(sessionId)}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  assert.equal(postStatus, 202);
  close();
});
