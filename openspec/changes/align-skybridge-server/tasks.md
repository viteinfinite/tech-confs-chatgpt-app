## 1. Implementation
- [x] 1.1 Replace the MCP SDK server setup with `McpServer` from `skybridge/server`.
- [x] 1.2 Recreate the schedule widget via `registerWidget`, preserving the widget HTML resource and metadata.
- [x] 1.3 Recreate tools (`search_talks`, `get_talk_details`) via `registerTool` with existing inputs/outputs.
- [x] 1.4 Update server exports/types to align with the Skybridge server pattern.
- [x] 1.5 Align the web build with Skybridge Vite widget entries and manifest output.
- [x] 1.6 Add the `search_talks` widget entry to mount the schedule UI.
- [x] 1.7 Add an Express wrapper that serves `/mcp` using Streamable HTTP transport.
- [x] 1.8 Add a `/sse` alias that routes to the MCP handler.

## 2. Validation
- [x] 2.1 Add/update tests to cover the Skybridge server tools.
- [x] 2.2 Add/update tests to cover the Express MCP wrapper.
- [x] 2.3 Run `npm test`.
- [x] 2.4 Run `npm run build`.
