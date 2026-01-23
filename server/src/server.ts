import { McpServer } from "skybridge/server";
import { z } from "zod";
import {
  loadSchedule,
  transformTalks,
  filterTalks,
  groupTalksByCategory,
  groupTalksByTrack,
  getAllTracks,
  getAllTags,
  getTalkById,
  type Talk,
  type TalkFilters,
} from "./schedule.js";
import {
  getWidgetTemplateHashEntry,
  renderWidgetTemplate,
  resolveServerUrl,
  resolveWidgetAssets,
  resolveWidgetTemplateUri,
} from "./widget-template.js";

/**
 * Tool output schema for search_talks
 */
interface SearchTalksOutput {
  talks: Talk[];
  groups: Record<string, Talk[]>;
  totalCount: number;
  filterSummary: string;
}

type SearchTalksInput = {
  category?: string;
  day?: string;
  speaker?: string;
  keywords?: string[];
  track?: string;
  tags?: string[];
};

type TalkDetailsInput = {
  talk_id: string;
};

type WidgetDef = {
  name: string;
  title: string;
  invoking: string;
  invoked: string;
  responseText: string;
};

export const WIDGET_NAME = "search_talks";
export const WIDGET_TEMPLATE_URI = resolveWidgetTemplateUri(WIDGET_NAME);

function widgetMeta(widget: WidgetDef) {
  return {
    "openai/outputTemplate": WIDGET_TEMPLATE_URI,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const scheduleWidget: WidgetDef = {
  name: WIDGET_NAME,
  title: "Conference Schedule",
  invoking: "Searching conference schedule",
  invoked: "Showing schedule results",
  responseText: "Rendered conference schedule results.",
};

export function getScheduleWidgetMeta() {
  return widgetMeta(scheduleWidget);
}

function buildErrorResponse(error: unknown) {
  return {
    content: textContent(`Error: ${String(error)}`),
    isError: true,
  };
}

function textContent(text: string) {
  return [{ type: "text" as const, text }];
}

/**
 * Create MCP server instance
 */
export function createScheduleServer() {
  const server = new McpServer(
    {
      name: "conference-schedule-server",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const widgetToolConfig = {
    title: "Search talks",
    description:
      "Search and filter conference talks. Returns talks grouped by track with a card-based UI. Use this when users want to browse, filter, or discover conference sessions.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      category: z
        .enum([
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
        ])
        .describe(
          "Filter by category (e.g., 'AI & Machine Learning', 'SwiftUI & Design', 'Testing')"
        )
        .optional(),
      day: z.string().describe("Filter by day (e.g., 'Oct 6', 'Oct 7')").optional(),
      speaker: z.string().describe("Filter by speaker name (partial match)").optional(),
      keywords: z
        .array(z.string())
        .describe("Filter by keywords in title or speakers")
        .optional(),
      track: z
        .enum(["Mobile Development", "ML/AI", "Data Engineering", "General"])
        .describe("Filter by track")
        .optional(),
      tags: z.array(z.string()).describe("Filter by tags (match any)").optional(),
    },
    _meta: widgetMeta(scheduleWidget),
  };

  const hashedTemplate = getWidgetTemplateHashEntry(WIDGET_NAME);
  const templateDescription = hashedTemplate
    ? `${scheduleWidget.title} widget markup (hashed)`
    : `${scheduleWidget.title} widget markup`;
  const resourceMeta = {
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
    "openai/widgetDescription": widgetToolConfig.description,
  };

  server.registerResource(
    `${WIDGET_NAME}-template`,
    WIDGET_TEMPLATE_URI,
    {
      description: templateDescription,
      mimeType: "text/html+skybridge",
      _meta: resourceMeta,
    },
    async (uri, extra) => {
      const { widgetFile, styleFile } = resolveWidgetAssets(WIDGET_NAME);
      const serverUrl = resolveServerUrl(
        extra as { requestInfo?: { headers?: Record<string, string | string[] | undefined> } }
      );
      const html = renderWidgetTemplate({ serverUrl, widgetFile, styleFile });

      return {
        contents: [{ uri: uri.href, mimeType: "text/html+skybridge", text: html }],
      };
    }
  );

  server.registerTool(WIDGET_NAME, widgetToolConfig, async (args: SearchTalksInput) => {
    try {
      const { category, day, speaker, keywords, track, tags } = args;
      const rawTalks = await loadSchedule();
      const allTalks = transformTalks(rawTalks, false);

      const filters: TalkFilters = {
        category,
        day,
        speaker,
        keywords,
        track,
        tags,
      };

      const filteredTalks = filterTalks(allTalks, filters);
      const groups = groupTalksByTrack(filteredTalks);

      const output: SearchTalksOutput = {
        talks: filteredTalks,
        groups,
        totalCount: filteredTalks.length,
        filterSummary: buildFilterSummary(filters, filteredTalks.length),
      };

      return {
        content: textContent(
          `Found ${output.totalCount} talk${output.totalCount === 1 ? "" : "s"}`
        ),
        structuredContent: output,
        _meta: widgetMeta(scheduleWidget),
      };
    } catch (error) {
      return buildErrorResponse(error);
    }
  });

  return server.registerTool(
    "get_talk_details",
    {
      title: "Get talk details",
      description:
        "Get detailed information about a specific talk including the full abstract. Use this when users click on a talk card or request more details about a specific session.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        talk_id: z.string().describe("The unique ID of the talk"),
      },
    },
    async (args: TalkDetailsInput) => {
        try {
          const { talk_id } = args;
          const rawTalks = await loadSchedule();
          const allTalksWithAbstracts = transformTalks(rawTalks, true);
          const talk = getTalkById(allTalksWithAbstracts, talk_id);

          if (!talk) {
            return {
              content: textContent(
                JSON.stringify({ error: "Talk not found", talkId: talk_id }, null, 2)
              ),
              isError: true,
            };
          }

          return {
            content: textContent(JSON.stringify(talk, null, 2)),
          };
        } catch (error) {
          return buildErrorResponse(error);
        }
      }
    );
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
  if (filters.track) {
    parts.push(`track "${filters.track}"`);
  }
  if (filters.tags && filters.tags.length > 0) {
    parts.push(`tags "${filters.tags.join(", ")}"`);
  }

  if (parts.length === 0) {
    return `Showing all ${count} talks`;
  }

  return `Found ${count} talk${count === 1 ? "" : "s"} matching ${parts.join(" and ")}`;
}

const server = createScheduleServer();
export default server;
export type AppType = typeof server;
