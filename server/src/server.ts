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
  ListToolsRequestSchema,
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

/**
 * Tool output schema for search_talks
 */
interface SearchTalksOutput {
  talks: Talk[];
  groups: Record<string, Talk[]>;
  totalCount: number;
  filterSummary: string;
}

/**
 * Create MCP server instance
 */
function createScheduleServer(): Server {
  const server = new Server(
    {
      name: "conference-schedule-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * List available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_talks",
          description:
            "Search and filter conference talks. Returns talks grouped by category with a card-based UI. Use this when users want to browse, filter, or discover conference sessions.",
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
        },
        {
          name: "get_talk_details",
          description:
            "Get detailed information about a specific talk including the full abstract. Use this when users click on a talk card or request more details about a specific session.",
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
      ],
    };
  });

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

        // Get component bundle for UI
        const componentJs = await getComponentBundle();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
            },
            ...(componentJs
              ? [
                  {
                    type: "resource",
                    uri:
                      "data:text/javascript;base64," +
                      Buffer.from(componentJs).toString("base64"),
                  } as const,
                ]
              : []),
          ],
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
    console.log("POST /mcp/messages", { sessionId });

    if (!sessionId) {
      res.writeHead(400).end("Missing sessionId query parameter");
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.writeHead(404).end("Unknown session");
      return;
    }

    try {
      await session.transport.handlePostMessage(req, res);
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

      if (req.method === "POST" && url.pathname === postPath) {
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
      `  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`
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
