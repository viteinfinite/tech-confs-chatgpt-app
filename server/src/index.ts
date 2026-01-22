import { fileURLToPath } from "node:url";

import express, { type Express } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { widgetsDevServer } from "skybridge/server";

import { mcp } from "./middleware.js";
import server, { createScheduleServer } from "./server.js";

export async function createApp(): Promise<Express> {
  const app = express();
  const sseSessions = new Map<
    string,
    {
      server: ReturnType<typeof createScheduleServer>;
      transport: SSEServerTransport;
    }
  >();

  app.use(express.json());
  app.use(mcp(server));

  app.get("/sse", async (req, res) => {
    const acceptHeader = req.headers.accept ?? "";
    if (!acceptHeader.includes("text/event-stream")) {
      res.status(204).end();
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    const sessionServer = createScheduleServer();
    const transport = new SSEServerTransport("/sse", res);
    const sessionId = transport.sessionId;

    sseSessions.set(sessionId, { server: sessionServer, transport });

    let closed = false;
    transport.onclose = async () => {
      if (closed) {
        return;
      }
      closed = true;
      sseSessions.delete(sessionId);
      await sessionServer.close();
    };

    transport.onerror = (error) => {
      console.error("SSE transport error", error);
    };

    try {
      await sessionServer.connect(transport);
    } catch (error) {
      sseSessions.delete(sessionId);
      console.error("Failed to start SSE session", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Failed to establish SSE connection");
      }
    }
  });

  app.post("/sse", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    const sessionId = req.query.sessionId;

    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).send("Missing sessionId query parameter");
      return;
    }

    const session = sseSessions.get(sessionId);
    if (!session) {
      res.status(404).send("Unknown session");
      return;
    }

    try {
      await session.transport.handlePostMessage(req, res, req.body ?? "");
    } catch (error) {
      console.error("Failed to process message", error);
      if (!res.headersSent) {
        res.status(500).send("Failed to process message");
      }
    }
  });

  if (process.env.NODE_ENV !== "production") {
    app.use(await widgetsDevServer());
  }

  return app;
}

export async function startServer() {
  const app = await createApp();
  const portEnv = Number(process.env.PORT ?? 3000);
  const port = Number.isFinite(portEnv) ? portEnv : 3000;

  app.listen(port, (error?: Error) => {
    if (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }

    console.log(`Server listening on port ${port} - ${process.env.NODE_ENV ?? "development"}`);
    console.log(
      `Connect to MCP at http://localhost:${port}/mcp (ngrok http ${port} for public access)`
    );
  });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  startServer();
}
