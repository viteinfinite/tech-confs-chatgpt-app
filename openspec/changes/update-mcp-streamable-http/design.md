## Context
The current MCP server runs over stdio only. MCP clients (including ChatGPT connectors and Inspector) expect Streamable HTTP with SSE on GET and a POST endpoint for messages.

## Goals / Non-Goals
- Goals:
  - Replace stdio with Streamable HTTP endpoints.
  - Provide clear defaults for base path and port.
  - Keep behavior and tools unchanged beyond transport.
- Non-Goals:
  - Adding new tools or changing tool schemas.
  - Introducing authentication or additional middleware.

## Decisions
- Decision: Use Streamable HTTP transport with `GET /mcp` (SSE) and `POST /mcp/messages`.
  - Why: This matches MCP Streamable HTTP expectations and improves compatibility with MCP clients.
- Decision: Bind to `PORT` with a default of `2091` and fixed base path `/mcp`.
  - Why: The documentation and examples already reference `2091` and `/mcp`, reducing configuration friction.

## Risks / Trade-offs
- Removing stdio may break existing local usage relying on stdio transport. This is acceptable because HTTP is the preferred deployment model for MCP tools.

## Migration Plan
1. Implement HTTP server transport with SSE and POST endpoints.
2. Update documentation for new connection URL and startup instructions.
3. Validate via tests and a quick smoke run of the HTTP server.

## Open Questions
- None.
