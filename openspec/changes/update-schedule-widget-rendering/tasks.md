# Tasks: Update Schedule Widget Rendering

## 1. Implementation
- [x] 1.1 Add widget definition and resource/resourceTemplate handlers in `server/src/server.ts`
- [x] 1.2 Serve widget HTML (built from `web/dist/component.js`) for `ui://widget/conference-schedule.html`
- [x] 1.3 Update `search_talks` tool responses to return `structuredContent` and widget `_meta`
- [x] 1.4 Update `web/src/component.tsx` styles to enforce a 400px fixed height and preserve horizontal card scrolling

## 2. Tests
- [x] 2.1 Add/update tests to validate widget metadata and structured content responses
- [x] 2.2 Add/update UI tests for fixed height and horizontal scroll behavior
