## Context
The existing server relies on the MCP SDK with manual HTTP/SSE transport handling. The desired alignment is with the Skybridge `McpServer` API, which standardizes tool/widget registration and tool response formats.

## Goals / Non-Goals
- Goals:
  - Use `McpServer` from `skybridge/server` as the primary server implementation.
  - Keep all conference schedule domain logic (search, details, widget rendering) intact.
  - Preserve widget outputs and structured data for the UI component.
- Non-Goals:
  - Redesigning the schedule data model.
  - Changing tool schemas or names beyond aligning to the Skybridge API.

## Decisions
- Decision: Replace `@modelcontextprotocol/sdk` server usage with `McpServer` + `registerWidget`/`registerTool`.
  - Why: Matches the requested server shape and reduces custom transport code.
- Decision: Maintain widget HTML resource handling via the existing component bundle and template URI.
  - Why: Keeps the current UI integration unchanged.

## Risks / Trade-offs
- Removing the custom HTTP/SSE layer may change how the server is hosted or started. This is acceptable to align to Skybridge.

## Migration Plan
1. Implement the `McpServer` version of the schedule server with equivalent tools and widget outputs.
2. Ensure exports/types and startup behavior match Skybridge expectations.
3. Update tests and build scripts as needed.
