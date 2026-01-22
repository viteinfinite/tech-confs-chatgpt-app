import { fileURLToPath } from "node:url";

import express, { type Express } from "express";
import { widgetsDevServer } from "skybridge/server";

import { mcp } from "./middleware.js";
import server from "./server.js";

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(express.json());
  app.get("/sse", (_req, res) => {
    res.status(200).send("ok");
  });
  app.head("/sse", (_req, res) => {
    res.status(200).end();
  });
  app.use(mcp(server));
  app.use("/sse", mcp(server));

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
