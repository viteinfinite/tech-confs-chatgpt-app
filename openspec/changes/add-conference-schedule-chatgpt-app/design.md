# Design: Conference Schedule ChatGPT App

## Overview

This document captures the architectural reasoning and design decisions for the conference schedule ChatGPT app.

## Architecture

### System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   ChatGPT   │────▶│  MCP Server │────▶│  React UI    │
│  (User Q)   │     │ (search.js) │     │  (iframe)    │
└─────────────┘     └─────────────┘     └──────────────┘
       │                    │                    │
       │                    ▼                    │
       │            schedule.json                │
       │                                         │
       └───────────────────◀─────────────────────┘
              (follow-up message for details)
```

### Component Separation

**Why separate server and component?**

The ChatGPT Apps SDK enforces a clear separation:
- **Server**: Business logic, data access, filtering
- **Component**: Pure presentation, receives pre-filtered data

This separation:
1. Keeps the component bundle small (no complex logic)
2. Allows ChatGPT to interpret natural language queries
3. Enables server-side optimization (caching, indexing)
4. Follows the Apps SDK's opinionated architecture

### Why No Search Bar in UI?

The design intentionally avoids search input in the component:

1. **HMI Guidelines**: ChatGPT apps should not duplicate chat functionality
2. **User Expectations**: Users are already in a conversational interface
3. **Component Responsibility**: The component is for presentation, not input
4. **Natural Language**: ChatGPT provides superior query understanding

### Category Derivation Strategy

Talks in `schedule.json` lack explicit categories. We derive them via keyword matching:

**Trade-off**: Accuracy vs. Complexity

| Approach | Pros | Cons |
|----------|------|------|
| Keyword matching (chosen) | Simple, predictable, fast | May miss edge cases |
| ML classification | More accurate | Requires training data, slower |
| Manual tagging | Perfect accuracy | Not scalable, maintenance burden |

**Decision**: Start with keyword matching. Categories can be refined iteratively based on user feedback and testing.

## Data Structures

### Input: schedule.json

```typescript
interface RawTalk {
  id: string;
  title: string;
  speakersPlainText: string | null;
  fromTime: string;  // ISO timestamp
  toTime: string;    // ISO timestamp
  kind: "Talk" | "Other";
  abstract: string | null;
}
```

### Output: Tool Response

```typescript
interface ToolOutput {
  talks: Talk[];
  groups: Record<string, Talk[]>;  // Pre-grouped by category
  totalCount: number;
  filterSummary: string;
}

interface Talk {
  id: string;
  title: string;
  speakers: string;
  time: string;      // "14:15–14:50"
  day: string;       // "Oct 6"
  kind: string;
  category: string;
}
```

## UI/UX Design

### Horizontal Scrolling Pattern

**Choice**: Netflix-style horizontal rows with cards

**Why?**
- Familiar pattern for browsing categorized content
- Efficient use of horizontal space in ChatGPT's inline mode
- Natural touch interaction on mobile
- Allows comparison within a category

**Alternative considered**: Vertical list with expandable sections
- Rejected: Requires more vertical space, harder to compare items

### Card Design

**Content hierarchy**:
1. Title (primary)
2. Speakers (secondary)
3. Time/Day (tertiary metadata)

**Why this hierarchy?**
- Title is the main differentiator
- Speakers help users recognize talks
- Time is important but secondary to topic discovery

### Component State Management

**No local filtering** - Component only renders what it receives:

```typescript
// Initial state from window.openai.toolOutput
const [talks, setTalks] = useState(initialTalks);
const [groups, setGroups] = useState(initialGroups);
```

**Why?**
- Filtering logic lives on server where it's testable
- Component stays focused on presentation
- ChatGPT handles filter interpretation

## Technical Decisions

### esbuild for Bundling

**Choice**: esbuild over webpack/vite

**Why?**
- Extremely fast builds
- Minimal configuration
- Small bundle size
- Sufficient for this use case (no complex transforms needed)

### CSS-in-JS vs. External CSS

**Choice**: Minimal external CSS with utility-like classes

**Why?**
- Smaller bundle than CSS-in-JS runtime
- Easier to tweak than giant Tailwind build
- Sufficient for simple card layout

### TypeScript Throughout

**Choice**: TypeScript for both server and component

**Why?**
- Type safety between tool schema and component props
- Better IDE support
- Catches mismatches at build time
- Aligns with modern web development practices

## Error Handling Strategy

### Server-side
- Invalid filters: Return empty result with guidance
- Missing talk: Return null with error message
- Parse errors: Log and return empty result

### Component-side
- Missing data: Show empty state message
- Follow-up failures: Silent fail (no alerts)
- Display mode issues: Default to inline layout

## Accessibility Approach

1. **Semantic HTML**: Proper heading levels for categories
2. **ARIA labels**: Cards describe themselves
3. **Keyboard support**: Cards are focusable and clickable
4. **Scroll respect**: No JS scroll hijacking
5. **Color independence**: Not color-only indicators

## Performance Considerations

- Bundle size target: <50KB gzipped for component
- Server response time: <100ms for filtered queries
- Render time: <16ms (60fps) for typical result sets
- Memory: Component should not leak on re-renders

## Testing Strategy

1. **Unit tests**: Categorization logic
2. **Integration tests**: Tool → component data flow
3. **Golden prompts**: Verify natural language queries work
4. **Manual testing**: ChatGPT developer mode validation
