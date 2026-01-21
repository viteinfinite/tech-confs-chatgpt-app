#!/usr/bin/env node

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { fileURLToPath, URL } from "node:url";
import { dirname, join } from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "fs/promises";
import {
  loadSchedule,
  transformTalks,
  filterTalks,
  groupTalksByCategory,
  getTalkById,
  type Talk,
  type TalkFilters,
} from "./schedule.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MAX_POST_MESSAGE_BYTES = 4 * 1024 * 1024;
const MAX_LOG_BODY_CHARS = 4000;

function safeParseJson(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function formatBodyPreview(text: string) {
  if (text.length <= MAX_LOG_BODY_CHARS) {
    return { preview: text, truncated: false };
  }
  return {
    preview: `${text.slice(0, MAX_LOG_BODY_CHARS)}...[truncated]`,
    truncated: true,
  };
}

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    req.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > MAX_POST_MESSAGE_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });

    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (error) => reject(error));
  });
}

/**
 * Tool output schema for search_talks
 */
interface SearchTalksOutput {
  talks: Talk[];
  groups: Record<string, Talk[]>;
  totalCount: number;
  filterSummary: string;
}

type WidgetDef = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  responseText: string;
};

export const WIDGET_TEMPLATE_URI = "ui://widget/conference-schedule.html";

function widgetMeta(widget: WidgetDef) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const scheduleWidget: WidgetDef = {
  id: "conference-schedule",
  title: "Conference Schedule",
  templateUri: WIDGET_TEMPLATE_URI,
  invoking: "Searching conference schedule",
  invoked: "Showing schedule results",
  responseText: "Rendered conference schedule results.",
};

export function getScheduleWidgetMeta() {
  return widgetMeta(scheduleWidget);
}

const tools: Tool[] = [
  {
    name: "search_talks",
    title: "Search talks",
    description:
      "Search and filter conference talks. Returns talks grouped by category with a card-based UI. Use this when users want to browse, filter, or discover conference sessions.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Filter by category (e.g., 'AI & Machine Learning', 'SwiftUI & Design', 'Testing')",
          enum: [
            "AI & Machine Learning",
            "SwiftUI & Design",
            "Concurrency & Performance",
            "Testing",
            "Platform & Tools",
            "Live Activities & Widgets",
            "Accessibility",
            "Vision & Spatial",
            "Cross-Platform",
            "Voice & Speech",
            "Error Handling",
            "Analytics",
            "General",
          ],
        },
        day: {
          type: "string",
          description: "Filter by day (e.g., 'Oct 6', 'Oct 7')",
        },
        speaker: {
          type: "string",
          description: "Filter by speaker name (partial match)",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Filter by keywords in title or speakers",
        },
      },
    },
    _meta: widgetMeta(scheduleWidget),
  },
  {
    name: "get_talk_details",
    title: "Get talk details",
    description:
      "Get detailed information about a specific talk including the full abstract. Use this when users click on a talk card or request more details about a specific session.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        talk_id: {
          type: "string",
          description: "The unique ID of the talk",
        },
      },
      required: ["talk_id"],
    },
  },
];

const resources: Resource[] = [
  {
    uri: WIDGET_TEMPLATE_URI,
    name: scheduleWidget.title,
    description: `${scheduleWidget.title} widget markup`,
    mimeType: "text/html+skybridge",
    _meta: widgetMeta(scheduleWidget),
  },
];

const resourceTemplates: ResourceTemplate[] = [
  {
    uriTemplate: WIDGET_TEMPLATE_URI,
    name: scheduleWidget.title,
    description: `${scheduleWidget.title} widget markup`,
    mimeType: "text/html+skybridge",
    _meta: widgetMeta(scheduleWidget),
  },
];

/**
 * Load and embed the React component bundle
 */
async function getComponentBundle(): Promise<string> {
  const componentPath = join(__dirname, "..", "..", "web", "dist", "component.js");
  try {
    return await readFile(componentPath, "utf-8");
  } catch (error) {
    console.error("Failed to load component bundle:", error);
    return "";
  }
}

export async function buildWidgetHtml(): Promise<string> {
  const componentJs = await getComponentBundle();
  if (!componentJs) {
    throw new Error(
      "Widget component bundle is missing. Run the web build to generate web/dist/component.js."
    );
  }

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Conference Schedule</title>
  </head>
  <body>
    <div id="conference-schedule-root"></div>
    <script type="module">${componentJs}</script>
  </body>
</html>`;
}

/**
 * Create MCP server instance
 */
export function createScheduleServer(): Server {
  const server = new Server(
    {
      name: "conference-schedule-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  /**
   * List available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools,
    };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return { resourceTemplates };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri !== WIDGET_TEMPLATE_URI) {
      throw new Error(`Unknown resource: ${uri}`);
    }
    const html = await buildWidgetHtml();
    return {
      contents: [
        {
          uri,
          mimeType: "text/html+skybridge",
          text: html,
        },
      ],
    };
  });

  /**
   * Handle tool calls
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Load schedule data
      const rawTalks = await loadSchedule();
      const allTalks = transformTalks(rawTalks, false); // Don't include abstracts in list view
      const allTalksWithAbstracts = transformTalks(rawTalks, true); // Include abstracts for detail view

      if (name === "search_talks") {
        const filters: TalkFilters = {
          category: args?.category as string | undefined,
          day: args?.day as string | undefined,
          speaker: args?.speaker as string | undefined,
          keywords: args?.keywords as string[] | undefined,
        };

        const filteredTalks = filterTalks(allTalks, filters);
        const groups = groupTalksByCategory(filteredTalks);

        const output: SearchTalksOutput = {
          talks: filteredTalks,
          groups,
          totalCount: filteredTalks.length,
          filterSummary: buildFilterSummary(filters, filteredTalks.length),
        };

        return {
          content: [
            {
              type: "text",
              text: `Found ${output.totalCount} talk${
                output.totalCount === 1 ? "" : "s"
              }`,
            },
          ],
          structuredContent: output,
          _meta: widgetMeta(scheduleWidget),
        };
      }

      if (name === "get_talk_details") {
        const talkId = args?.talk_id as string;
        const talk = getTalkById(allTalksWithAbstracts, talkId);

        if (!talk) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "Talk not found", talkId }, null, 2),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(talk, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Unknown tool" }, null, 2),
          },
        ],
        isError: true,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: String(error) }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Build a human-readable filter summary
 */
function buildFilterSummary(filters: TalkFilters, count: number): string {
  const parts: string[] = [];

  if (filters.category) {
    parts.push(`category "${filters.category}"`);
  }
  if (filters.day) {
    parts.push(`day "${filters.day}"`);
  }
  if (filters.speaker) {
    parts.push(`speaker "${filters.speaker}"`);
  }
  if (filters.keywords && filters.keywords.length > 0) {
    parts.push(`keywords "${filters.keywords.join(", ")}"`);
  }

  if (parts.length === 0) {
    return `Showing all ${count} talks`;
  }

  return `Found ${count} talk${count === 1 ? "" : "s"} matching ${parts.join(" and ")}`;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const ssePath = "/mcp";
const postPath = "/mcp/messages";

export function createHttpServer() {
  const sessions = new Map<string, SessionRecord>();

  async function handleSseRequest(res: ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const server = createScheduleServer();
    const transport = new SSEServerTransport(postPath, res);
    const sessionId = transport.sessionId;
    console.log("SSE connect", { sessionId });

    sessions.set(sessionId, { server, transport });

    let closed = false;
    transport.onclose = async () => {
      if (closed) {
        return;
      }
      closed = true;
      sessions.delete(sessionId);
      await server.close();
      console.log("SSE close", { sessionId });
    };

    transport.onerror = (error) => {
      console.error("SSE transport error", error);
    };

    try {
      await server.connect(transport);
    } catch (error) {
      sessions.delete(sessionId);
      console.error("Failed to start SSE session", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Failed to establish SSE connection");
      }
    }
  }

  async function handlePostMessage(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
  ) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    const sessionId = url.searchParams.get("sessionId");
    console.log("POST message request", { path: url.pathname, sessionId });

    if (!sessionId) {
      res.writeHead(400).end("Missing sessionId query parameter");
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.writeHead(404).end("Unknown session");
      return;
    }

    let bodyBuffer: Buffer;
    try {
      bodyBuffer = await readRequestBody(req);
    } catch (error) {
      console.error("Failed to read POST body", error);
      if (!res.headersSent) {
        res.writeHead(400).end("Failed to read request body");
      }
      return;
    }

    const rawBody = bodyBuffer.toString("utf8");
    const parsedBody = safeParseJson(rawBody);
    const { preview, truncated } = formatBodyPreview(rawBody);
    console.log("POST message body", {
      path: url.pathname,
      sessionId,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
      size: bodyBuffer.length,
      truncated,
      body: parsedBody ?? preview,
    });

    try {
      await session.transport.handlePostMessage(req, res, parsedBody ?? rawBody);
    } catch (error) {
      console.error("Failed to process message", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Failed to process message");
      }
    }
  }

  const httpServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const started = Date.now();
      const done = (status: number) => {
        const dt = Date.now() - started;
        console.log(`Returned ${status} in ${dt} ms`);
      };

      if (!req.url) {
        res.writeHead(400).end("Missing URL");
        done(400);
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
      console.log("HTTP request", { method: req.method, path: url.pathname });

      if (
        req.method === "OPTIONS" &&
        (url.pathname === ssePath || url.pathname === postPath)
      ) {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type",
        });
        res.end();
        return;
      }

      if (req.method === "GET" && url.pathname === ssePath) {
        await handleSseRequest(res);
        done(200);
        return;
      }

      if (
        req.method === "POST" &&
        (url.pathname === postPath || url.pathname === ssePath)
      ) {
        await handlePostMessage(req, res, url);
        return;
      }

      res.writeHead(404).end("Not Found");
      done(404);
    }
  );

  httpServer.on("clientError", (err: Error, socket) => {
    console.error("HTTP client error", err);
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  return httpServer;
}

/**
 * Start the server
 */
async function main() {
  const portEnv = Number(process.env.PORT ?? 2091);
  const port = Number.isFinite(portEnv) ? portEnv : 2091;
  const httpServer = createHttpServer();

  httpServer.listen(port, () => {
    console.log(`Conference Schedule MCP server listening on http://localhost:${port}`);
    console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
    console.log(
      `  Message post endpoints: POST http://localhost:${port}${postPath}?sessionId=... or http://localhost:${port}${ssePath}?sessionId=...`
    );
  });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
