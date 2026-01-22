## MODIFIED Requirements
### Requirement: MCP server implementation
The MCP server SHALL be implemented using `McpServer` from `skybridge/server` and SHALL register tools and widgets via `registerTool` and `registerWidget`.

#### Scenario: Server registers schedule widget and tools
- **WHEN** the server starts
- **THEN** it exposes the schedule widget and the `search_talks` and `get_talk_details` tools through the Skybridge API

### Requirement: Schedule domain behavior
The MCP server SHALL preserve existing schedule domain logic and outputs for search and detail tools.

#### Scenario: Search tool returns filtered talks
- **WHEN** the client invokes `search_talks` with filters
- **THEN** the response includes structured content with filtered talks and widget metadata

#### Scenario: Details tool returns a single talk
- **WHEN** the client invokes `get_talk_details` with a talk ID
- **THEN** the response includes the full talk details or an error when missing
