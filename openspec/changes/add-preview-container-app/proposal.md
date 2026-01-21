# Change: Add preview container app for React components

## Why
Developers need a lightweight way to render and manually exercise existing React components without wiring the full app.

## What Changes
- Add a development-only preview app under `preview/` that renders the project's React components.
- Provide a simple component selector and mock data hooks for manual interaction.
- Add a `npm run preview` dev workflow with autoreload comparable to `npm run dev`.

## Impact
- Affected specs: preview-app (new)
- Affected code: new `preview/` app, wiring to existing React components in `web/src`
