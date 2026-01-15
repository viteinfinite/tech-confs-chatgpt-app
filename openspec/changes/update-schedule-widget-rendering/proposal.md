# Change: Update Schedule Widget Rendering

## Why
The schedule app currently returns JSON and a JavaScript resource, which does not trigger the ChatGPT widget flow used by the Gutendex example. We need the schedule app to register widget resources/templates and return structured content with widget metadata so ChatGPT renders the UI consistently.

## What Changes
- Register widget resources/templates for the schedule UI and expose a `ui://widget/...` HTML template.
- Return `structuredContent` and widget `_meta` with tool responses, matching the Gutendex behavior.
- Ensure the UI renders at a fixed height of 400px while preserving horizontal card navigation.

## Impact
- Affected specs: `conference-schedule-app`
- Affected code: `server/src/server.ts`, `web/src/component.tsx`, build assets or widget HTML generation
