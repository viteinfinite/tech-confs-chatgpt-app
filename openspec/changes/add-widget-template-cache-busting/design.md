## Context
The widget template is referenced via a static `ui://.../search_talks.html` URI. Clients can cache this resource, causing stale UI when the template changes. Template hashes must be determined at build time and recorded so the server can emit a versioned URI without runtime scanning.

## Goals / Non-Goals
- Goals:
  - Append a content hash to the widget template filename/URI
  - Keep a fallback to the unversioned HTML for dev or missing assets
- Non-Goals:
  - Change widget rendering behavior or UI structure
  - Introduce new runtime dependencies

## Decisions
- Decision: Use a content hash of the generated HTML template to build the template filename.
- Decision: Record widget template hashes in a build artifact (mapping file) and read it at runtime.
- Decision: Emit the hashed template URI from `_meta.openai/outputTemplate`, with fallback to the unversioned template when no mapping is present.

## Risks / Trade-offs
- Risk: Missing hashed HTML or mapping file in local dev/builds → fallback to unversioned template.

## Migration Plan
- Build web assets to produce hashed HTML and a template hash mapping file.
- Update server to read the mapping file and resolve hashed template URIs.

## Open Questions
- None.
