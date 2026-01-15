## Context
The schedule app currently embeds a JavaScript bundle in tool responses, but does not expose widget resources or metadata required by ChatGPT to render widgets. The Gutendex example uses widget HTML resources and `_meta` to link tool output to a widget template.

## Goals / Non-Goals
- Goals:
  - Match Gutendex widget flow (resources/templates + `_meta` + `structuredContent`).
  - Keep the UI fixed at 400px height with horizontally scrollable cards.
- Non-Goals:
  - Redesign the UI or change data filtering behavior.
  - Introduce new server-side features beyond widget integration.

## Decisions
- Decision: Generate widget HTML using the existing web bundle and serve it via MCP resources.
  - Rationale: Minimizes build changes while aligning with ChatGPT widget expectations.
- Decision: Use a stable `ui://widget/conference-schedule.html` template URI initially.
  - Rationale: Simple and consistent; can be extended to hashed assets later if needed.

## Risks / Trade-offs
- Risk: Widget HTML and JS could get out of sync if build output changes.
  - Mitigation: Read the latest bundle from `web/dist/component.js` at runtime.

## Migration Plan
1. Add widget definitions and resource handlers on the MCP server.
2. Update tool responses to return `structuredContent` and widget `_meta`.
3. Update UI styles to enforce a 400px height and keep horizontal scrolling.

## Open Questions
- Should we add hashed widget HTML naming for cache-busting like Gutendex?
