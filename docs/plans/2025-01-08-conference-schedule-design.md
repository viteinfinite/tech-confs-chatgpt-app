# Conference Schedule ChatGPT App Design

**Date**: 2025-01-08
**Status**: Brainstorming Phase
**Purpose**: Design for a ChatGPT app that presents an interactive card-based interface for browsing conference talks with horizontal scrolling, presentation, filtering, and information retrieval.

---

## Overview

A ChatGPT app that displays conference talks from `schedule.json` using a horizontally scrolling card interface organized by topic categories. Users interact via natural language with ChatGPT to filter and retrieve talk information, while the React component focuses purely on visual presentation.

**Key Requirements**:
- Interactive card-based interface with horizontal scrolling
- Present, search, filter, and retrieve talk information
- Works for both live conference browsing and post-event reference
- Filtering via ChatGPT conversational interaction (no search bar in UI)
- Talks organized by topic/category

---

## Architecture

### App Architecture

The app follows the ChatGPT Apps SDK pattern where ChatGPT handles query interpretation and the component purely visualizes results.

**Flow**:
1. User asks ChatGPT: *"Show me all SwiftUI talks"* or *"What talks about AI are on day 1?"*
2. ChatGPT calls the MCP server tool with filter parameters (category, day, speaker, etc.)
3. The server reads `schedule.json`, filters the talks, and returns structured data with the React component URL
4. The React component receives filtered talks via `window.openai.toolOutput` and renders horizontally scrolling cards organized by topic
5. User interactions (clicking a card for details, favoriting) trigger `window.openai.sendFollowupMessage` to continue the conversation

**Key Design Principle**: The component doesn't implement search - it receives pre-filtered results from the server based on ChatGPT's interpretation of the user's natural language request. This keeps the UI focused on presentation and interaction rather than input.

### MCP Server Tools (Node.js/TypeScript)

- **`search_talks`**: Main tool with optional filters (category, day, speaker, keywords)
- **`get_talk_details`**: Fetch full abstract and metadata for a specific talk

The component bundles to a single ESM module via esbuild, embedded in the server response as a UI template.

---

## Component Structure & Layout

### React Component Hierarchy

```
<App>
  <TopicRow category="AI & Machine Learning">
    <TalkCard />
    <TalkCard />
    <TalkCard />
  </TopicRow>
  <TopicRow category="SwiftUI & Liquid Glass">
    <TalkCard />
    <TalkCard />
  </TopicRow>
  <TopicRow category="Testing & Quality">
    <TalkCard />
    <TalkCard />
  </TopicRow>
</App>
```

### TopicRow Component

Each category renders as a horizontal scrolling section with:
- Category label (e.g., "AI & Machine Learning • 3 talks")
- Horizontal scroll container with snap scrolling
- Cards displayed as `inline-flex` with `overflow-x: auto`

### TalkCard Component

Compact card with:
- Talk title (truncated, max 2 lines)
- Speaker name(s) below title
- Time badge (e.g., "14:15–14:50" or "Oct 6")
- Optional emoji indicator for "Other" type (breaks, meals)
- Clicking triggers follow-up message with talk details

### Layout Constraints

Following ChatGPT's iframe patterns:
- Respects `window.openai.maxHeight` for vertical space
- Uses `window.openai.safeArea` insets for padding
- Adapts to `displayMode` (inline vs fullscreen)
- Light/dark theme from `window.openai.theme`

### CSS Approach

Tailwind-like utility classes (inline styles or minimal CSS-in-JS) to keep bundle small. Horizontal scroll uses native scroll snapping with `scroll-snap-type: x mandatory`.

---

## Data Flow & Categorization

### Server-Side Categorization

Since talks don't have explicit categories in `schedule.json`, we derive them from titles and abstracts using a keyword mapping:

```typescript
const CATEGORY_KEYWORDS = {
  "AI & Machine Learning": ["foundation models", "ai", "machine learning", "liquid glass"],
  "SwiftUI & Design": ["swiftui", "liquid glass", "design", "ux", "ui"],
  "Concurrency & Performance": ["concurrency", "swift 6", "performance", "parallel"],
  "Testing": ["testing", "test", "xctest", "swift testing"],
  "Platform & Tools": ["xcode", "build", "compilation", "private apis", "linux"],
  "Live Activities & Widgets": ["live activities", "widget", "dynamic island"],
  "Accessibility": ["accessibility", "a11y"],
  "Vision & Spatial": ["visionos", "spatial", "vision pro"],
  "Cross-Platform": ["scale", "platforms", "apple watch", "apple tv"]
};
```

Each talk is matched to its first relevant category; uncategorized talks go to "General".

### Tool Output Schema

```typescript
interface ToolOutput {
  talks: Talk[];
  groups: {
    [category: string]: Talk[];  // Pre-grouped by category
  };
  totalCount: number;
  filterSummary: string;  // e.g., "Showing 12 talks for Oct 6"
}

interface Talk {
  id: string;
  title: string;
  speakers: string;
  time: string;        // Formatted "14:15–14:50"
  day: string;         // "Oct 6" or "Oct 7"
  kind: "Talk" | "Other";
  category: string;
}
```

### Component State Management

- Initial state from `window.openai.toolOutput` (pre-filtered talks)
- No local filtering - component only handles display and interaction
- Optional `widgetState` for favorited talks (persisted across sessions via `setWidgetState`)

---

## Interaction Patterns

### Clicking a Talk Card

Triggers `sendFollowupMessage` with contextual details:

```typescript
onCardClick: (talk) => {
  window.openai.sendFollowupMessage({
    prompt: `Tell me more about "${talk.title}" by ${talk.speakers}.`
  });
}
```

ChatGPT responds with the full abstract, speaker bio (if available), and related talk suggestions. This keeps the component focused on browsing while ChatGPT handles deep information retrieval.

### Secondary Actions (Optional, Phase 2)

- **Favorite**: Small heart icon that toggles `widgetState.favorites` array
- **Share**: Button to copy talk info or open external link
- **Related**: "See similar talks" triggers follow-up with category context

### Empty States

- No results: "No talks match your query. Try a different category or day."
- Loading: Skeleton cards or simple spinner (server should be fast though)

### Error Handling

- Invalid talk ID: Show "Talk not found" with option to search again
- Network errors: Display brief message, offer retry via follow-up message

### Accessibility

- Cards have proper `role="button"` and keyboard support
- Horizontal scrolling respects user's scroll/zoom settings
- `aria-label` on cards: "{title} by {speakers}, {time}"
- Category headers use semantic heading levels

### Mobile Considerations

- Cards remain full-width with comfortable touch targets (44px min)
- Swipe gesture works naturally with horizontal scroll
- Focused card stays visible during follow-up conversation

---

## Technical Implementation

### Project Structure

```
schedule-chatgptapp/
├── schedule.json              # Source data
├── server/                    # MCP server (Node.js/TypeScript)
│   ├── src/
│   │   ├── server.ts          # MCP server with tools
│   │   ├── categorize.ts      # Category keyword matching
│   │   └── schedule.ts        # Schedule data loading
│   ├── package.json
│   └── tsconfig.json
├── web/                       # React component
│   ├── src/
│   │   ├── component.tsx      # Main App component
│   │   ├── hooks.ts           # useOpenAiGlobal, useWidgetState
│   │   └── styles.css         # Minimal styles
│   ├── dist/
│   │   └── component.js       # Bundled output
│   ├── package.json
│   └── tsconfig.json
└── docs/plans/
    └── 2025-01-08-conference-schedule-design.md
```

### Build Commands

```bash
# Server
cd server && npm run build && npm run dev

# Component
cd web && npm run build  # esbuild -> dist/component.js
```

### Component Embedding

```typescript
const componentJs = await fs.readFile('web/dist/component.js', 'utf-8');
return {
  content: filteredTalks,
  ui_template: {
    url: "data:text/javascript,..." + encodeURIComponent(componentJs),
    props: { talks, groups, totalCount, filterSummary }
  }
};
```

### Tool Definitions for MCP

- `search_talks`: Read-only, filters by category/day/speaker/keywords
- `get_talk_details`: Read-only, returns full abstract for single talk
- Both marked with `readOnlyHint: true` to skip confirmations

### Testing Approach

1. Unit tests for categorization logic
2. Component renders with mock `window.openai` global
3. Golden prompts: "Show SwiftUI talks", "What's on Oct 6?", "Talks by Tamia James"
4. Manual testing in ChatGPT developer mode

---

## Next Steps

1. **Validation**: Confirm design with stakeholder
2. **Implementation Planning**: Create detailed tasks using `superpowers:writing-plans`
3. **Development**: Set up git worktree and implement following the workflow

---

**End of Design Document**
