# Conference Schedule ChatGPT App

A ChatGPT app that presents an interactive, horizontally scrolling card-based interface for browsing conference talks from `schedule.json`.

## Features

- **Horizontally scrolling card interface** - Browse talks by topic with Netflix-style rows
- **Category-based organization** - Talks automatically categorized by keywords (AI, SwiftUI, Testing, etc.)
- **Natural language filtering** - Filter via ChatGPT conversation (e.g., "Show SwiftUI talks")
- **Talk detail retrieval** - Click cards to get full abstract via follow-up message
- **Responsive design** - Adapts to ChatGPT display modes (inline/fullscreen)
- **Accessibility support** - Proper ARIA labels, keyboard navigation
- **Widget rendering** - MCP resources expose a widget template for ChatGPT UI rendering

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   ChatGPT   │────▶│  MCP Server │────▶│  React UI    │
│  (User Q)   │     │ (search.js) │     │  (iframe)    │
└─────────────┘     └─────────────┘     └──────────────┘
       │                    │
       ▼                    ▼
  Follow-up          schedule.json
       │
       ▼
  Widget template (ui://widget/conference-schedule.html)
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

The MCP server listens on `PORT` (default `2091`) and exposes Streamable HTTP endpoints under `/mcp`.

## Dev Workflow

1. Build the frontend bundle so `web/dist/component.js` is available (`npm run build`), or run `npm run dev` to watch and rebuild it.
2. Start the MCP server (`npm start`) to serve `GET /mcp` (SSE) and `POST /mcp/messages`.
3. For auto-restarts on server changes, run `npm run dev:mcp` in a separate terminal while `npm run dev` handles rebuilds.

Preview UI (development-only):
```bash
npm run preview
```
- Runs a local preview app at `http://127.0.0.1:5173` with component switching.
- Autoreloads when preview source files change.

Notes on caching:
- The UI is served as a widget resource template (`ui://widget/conference-schedule.html`) backed by the bundled component.
- ChatGPT/Inspector may cache connector metadata or tool responses; if changes don’t appear, refresh the connector or restart the MCP server.

## MCP Server Endpoints

- SSE stream: `GET /mcp`
- Message post endpoint: `POST /mcp/messages?sessionId=...`

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
2. Use the connector URL `http://localhost:2091/mcp` (or your deployed HTTPS URL)
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
