## ADDED Requirements
### Requirement: Streamable HTTP transport
The MCP server SHALL expose Streamable HTTP endpoints for tool invocation.

#### Scenario: SSE stream for MCP sessions
- **WHEN** a client sends `GET /mcp`
- **THEN** the server streams responses over Server-Sent Events

#### Scenario: Message post endpoint
- **WHEN** a client sends `POST /mcp/messages` with a valid MCP request
- **THEN** the server processes the request and returns the response payload

### Requirement: HTTP server configuration
The MCP server SHALL listen on port `PORT` (default `2091`) and expose the base path `/mcp`.

#### Scenario: Default port binding
- **WHEN** `PORT` is not set
- **THEN** the server listens on port `2091`

#### Scenario: Configured port binding
- **WHEN** `PORT` is set
- **THEN** the server listens on the configured port

## REMOVED Requirements
### Requirement: Stdio transport
**Reason**: Streamable HTTP replaces stdio for MCP transport.
**Migration**: Use `GET /mcp` for SSE and `POST /mcp/messages` for requests.
