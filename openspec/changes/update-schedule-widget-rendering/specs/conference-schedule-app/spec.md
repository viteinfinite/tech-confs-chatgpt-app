## ADDED Requirements
### Requirement: Widget Rendering Integration
The MCP server SHALL expose the schedule UI as a widget resource and return widget metadata that links tool output to the widget template.

#### Scenario: Widget resources are listed
- **WHEN** a client requests available resources or resource templates
- **THEN** the server returns the schedule widget HTML template with a `ui://widget/...` URI

#### Scenario: Tool output triggers widget rendering
- **WHEN** `search_talks` returns results
- **THEN** the response includes `structuredContent` and widget `_meta` linking to the schedule widget template

### Requirement: Fixed Height UI
The schedule widget UI SHALL render within a fixed height of 400px while preserving horizontal scrolling for talk cards.

#### Scenario: Fixed height enforced
- **WHEN** the widget renders in ChatGPT
- **THEN** the UI container height is 400px and content scrolls within that height if needed

#### Scenario: Horizontal card navigation remains available
- **WHEN** the user browses category rows
- **THEN** talk cards scroll horizontally within their row container
