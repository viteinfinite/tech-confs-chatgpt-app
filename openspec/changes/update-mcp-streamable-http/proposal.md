# Change: Update MCP server to Streamable HTTP transport

## Why
The MCP server currently uses stdio transport, which does not support the Streamable HTTP endpoints expected by MCP clients and tooling. Replacing stdio with Streamable HTTP enables SSE streaming and standard HTTP message posting.

## What Changes
- Replace stdio transport with Streamable HTTP (GET /mcp for SSE, POST /mcp/messages for requests).
- Add HTTP server configuration (base path `/mcp`, port via `PORT` with a default).
- Update startup logging and documentation to reflect the HTTP transport.

## Impact
- Affected specs: mcp-transport
- Affected code: `server/src/server.ts`, `README.md`
- **BREAKING**: stdio transport is removed in favor of HTTP endpoints.
