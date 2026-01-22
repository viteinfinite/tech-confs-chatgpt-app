# Change: Align MCP server with Skybridge McpServer API

## Why
The current server uses the MCP SDK with custom HTTP/SSE plumbing. Aligning to the Skybridge `McpServer` API standardizes tool/widget registration and output shaping while keeping the schedule domain logic intact.

## What Changes
- Replace the MCP SDK `Server` + manual HTTP/SSE setup with `McpServer` from `skybridge/server`.
- Register the schedule widget and tools via `registerWidget`/`registerTool` with the same domain behavior and outputs.
- Preserve existing schedule data loading/filtering logic and widget HTML resource handling.
- Update server exports/types to match the Skybridge server pattern.

## Impact
- Affected specs: mcp-server
- Affected code: `server/src/server.ts`, related server entry exports/types
- **BREAKING**: Server transport/init changes; existing HTTP/SSE endpoints are replaced by the Skybridge server surface.
