# Conference Schedule ChatGPT App

A ChatGPT app that presents an interactive, horizontally scrolling card-based interface for browsing conference talks from `schedule.json`.

## Features

- **Horizontally scrolling card interface** - Browse talks by topic with Netflix-style rows
- **Category-based organization** - Talks automatically categorized by keywords (AI, SwiftUI, Testing, etc.)
- **Natural language filtering** - Filter via ChatGPT conversation (e.g., "Show SwiftUI talks")
- **Talk detail retrieval** - Click cards to get full abstract via follow-up message
- **Responsive design** - Adapts to ChatGPT display modes (inline/fullscreen)
- **Accessibility support** - Proper ARIA labels, keyboard navigation
- **Widget rendering** - Skybridge widget templates render the schedule UI in ChatGPT

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   ChatGPT   │────▶│ Skybridge   │────▶│  React UI    │
│  (User Q)   │     │ MCP Server  │     │  (iframe)    │
└─────────────┘     └─────────────┘     └──────────────┘
       │                    │
       ▼                    ▼
  Follow-up          schedule.json
       │
       ▼
  Widget template (ui://widgets/apps-sdk/search_talks.html)
  (for details)
```

## Project Structure

```
schedule-chatgptapp/
├── schedule.json              # Source data
├── server/                    # MCP server (Node.js/TypeScript)
│   ├── src/
│   │   ├── server.ts          # MCP server with tools
│   │   ├── categorize.ts      # Category keyword matching
│   │   └── schedule.ts        # Schedule data loading
│   ├── dist/                  # Compiled output
│   └── package.json
├── web/                       # React component
│   ├── src/
│   │   ├── component.tsx      # Main App component
│   │   ├── hooks.ts           # useOpenAiGlobal, useWidgetState
│   │   └── styles.css         # Component styles
│   ├── dist/
│   │   └── component.js       # Bundled output
│   └── package.json
├── preview/                   # Dev-only component preview app
│   ├── src/
│   │   └── index.tsx           # Preview entrypoint
│   ├── index.html              # Preview shell
│   └── package.json
└── package.json               # Root workspace config
```

## Prerequisites

- Node.js 18+
- npm or pnpm

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Build both server and component
npm run build

# Watch mode (rebuilds on changes)
npm run dev

# Start the MCP server
npm start
```

The MCP server runs on `PORT` (default `3000`) and serves MCP over `/mcp`.

## Dev Workflow

1. Build the widget bundle with Vite (`npm run build`) or run `npm run dev` to watch and rebuild it.
2. Build the server (`npm run build:server`) so the Skybridge module is up to date.
3. Start the MCP server (`npm start`) and connect to `http://localhost:3000/mcp`.

Preview UI (development-only):
```bash
npm run preview
```
- Runs a local preview app at `http://127.0.0.1:5173` with component switching.
- Autoreloads when preview source files change.

Notes on caching:
- The UI is served as a Skybridge widget template (`ui://widgets/apps-sdk/search_talks.html`) built from `web/src/widgets/search_talks.tsx`.
- ChatGPT/Inspector may cache connector metadata or tool responses; if changes don’t appear, refresh the connector or restart the MCP server.

## MCP Server Transport

- MCP endpoint: `POST /mcp`
- Alias endpoint: `POST /sse` (routes to MCP)
- Legacy health check: `GET /sse` (returns 200)

## MCP Tools

### `search_talks`

Search and filter conference talks. Returns talks grouped by category with a card-based UI.
The widget renders within a fixed 400px height and uses horizontal scrolling rows for navigation.

**Parameters:**
- `category` (optional): Filter by category (e.g., "AI & Machine Learning", "SwiftUI & Design")
- `day` (optional): Filter by day (e.g., "Oct 6", "Oct 7")
- `speaker` (optional): Filter by speaker name (partial match)
- `keywords` (optional): Array of keywords to search in title/speakers

**Example queries:**
- "Show me all SwiftUI talks"
- "What talks are on October 6th?"
- "Talks by Tamia James"
- "AI and machine learning talks"

### `get_talk_details`

Get detailed information about a specific talk including the full abstract.

**Parameters:**
- `talk_id` (required): The unique ID of the talk

## Usage Example

1. Link the MCP server in ChatGPT developer mode
2. Use `http://localhost:3000/mcp` (or your deployed URL)
3. Ask: "Show me all talks about SwiftUI"
4. ChatGPT calls `search_talks` with category filter
5. React component displays horizontally scrolling cards
6. Click a card to trigger follow-up message for full details

## Categories

Talks are automatically categorized using keyword matching:

- AI & Machine Learning
- SwiftUI & Design
- Concurrency & Performance
- Testing
- Platform & Tools
- Live Activities & Widgets
- Accessibility
- Vision & Spatial
- Cross-Platform
- Voice & Speech
- Error Handling
- Analytics
- General (uncategorized)

## License

MIT
