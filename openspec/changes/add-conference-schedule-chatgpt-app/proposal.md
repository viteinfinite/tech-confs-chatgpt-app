# Add Conference Schedule ChatGPT App

**Status**: Proposed
**Author**: Claude
**Date**: 2025-01-08
**Change ID**: `add-conference-schedule-chatgpt-app`

## Summary

Create a ChatGPT app that presents an interactive, horizontally scrolling card-based interface for browsing conference talks from `schedule.json`. Users interact via natural language with ChatGPT to filter and retrieve talk information, while the React component focuses purely on visual presentation organized by topic categories.

## Motivation

Conference attendees need an intuitive way to explore talks during and after the event. A card-based interface with natural language filtering provides:
- Visual discovery of talks organized by topic
- Conversational search that feels natural
- Quick access to talk details without overwhelming information density
- Works both live during the conference and as a reference afterward

## Proposed Solution

Build a ChatGPT app following the Apps SDK pattern:
- **MCP Server** (Node.js/TypeScript): Exposes tools for searching talks and fetching details
- **React Component**: Renders horizontally scrolling cards grouped by topic categories
- **Categorization**: Server-side keyword matching derives categories from talk titles/abstracts
- **Interaction**: Clicking cards triggers ChatGPT follow-up for detailed information

## Key Features

1. **Horizontally scrolling card interface** - Topic rows with snap-scrollable cards
2. **Category-based organization** - AI, SwiftUI, Testing, etc. derived from keywords
3. **Natural language filtering** - Via ChatGPT conversation (no search bar in UI)
4. **Talk detail retrieval** - Click card to get full abstract via follow-up message
5. **Responsive design** - Adapts to ChatGPT display modes (inline/fullscreen)
6. **Accessibility support** - Proper ARIA labels, keyboard navigation

## Scope

### In Scope
- MCP server with `search_talks` and `get_talk_details` tools
- React component with TopicRow and TalkCard components
- Keyword-based categorization logic
- Horizontal scrolling with native scroll snapping
- Basic interaction (click for details via follow-up)

### Out of Scope (Phase 2+)
- Favorite/bookmark functionality
- Advanced filtering (time ranges, multiple speakers)
- Social features (share, notes)
- Real-time updates during live conference

## Related Changes

None - this is a new capability.

## Success Criteria

- Users can browse talks by category via horizontal scrolling cards
- Natural language queries ("Show SwiftUI talks") correctly filter results
- Clicking a card provides detailed talk information
- Component renders correctly in both inline and fullscreen modes
- All interactions are accessible via keyboard

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Category accuracy depends on keywords | Start with broad categories, iterate based on testing |
| Horizontal scroll may be unfamiliar | Use native scroll snapping for smooth experience |
| Large number of talks may overwhelm | Paginate or limit results, allow refined queries |

## Open Questions

1. Should we support pagination for large result sets, or rely on refined queries?
2. Do we need time-based filtering for "live conference" use case?
