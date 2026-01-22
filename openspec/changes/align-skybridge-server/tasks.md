## 1. Implementation
- [x] 1.1 Replace the MCP SDK server setup with `McpServer` from `skybridge/server`.
- [x] 1.2 Recreate the schedule widget via `registerWidget`, preserving the widget HTML resource and metadata.
- [x] 1.3 Recreate tools (`search_talks`, `get_talk_details`) via `registerTool` with existing inputs/outputs.
- [x] 1.4 Update server exports/types to align with the Skybridge server pattern.

## 2. Validation
- [x] 2.1 Add/update tests to cover the Skybridge server tools.
- [x] 2.2 Run `npm test`.
- [x] 2.3 Run `npm run build`.
