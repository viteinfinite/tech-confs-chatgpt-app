# Tasks: Add Conference Schedule ChatGPT App

## Phase 1: Foundation

- [x] **1.1** Initialize `server/` directory with Node.js/TypeScript project
  - Create `package.json` with dependencies (mcp-sdk, typescript)
  - Create `tsconfig.json`
  - Set up build script

- [x] **1.2** Initialize `web/` directory with React project
  - Create `package.json` with dependencies (react, react-dom, esbuild, typescript)
  - Create `tsconfig.json`
  - Add build script for esbuild bundling

- [x] **1.3** Create categorization module in `server/src/categorize.ts`
  - Define category keyword mapping
  - Implement `categorizeTalk(title: string, abstract: string): string`
  - Add unit tests for categorization logic

## Phase 2: MCP Server

- [x] **2.1** Create schedule data loader in `server/src/schedule.ts`
  - Load and parse `schedule.json`
  - Transform raw talks to `Talk` interface
  - Format times and days

- [x] **2.2** Implement `search_talks` tool in `server/src/server.ts`
  - Accept optional filters (category, day, speaker, keywords)
  - Filter and group talks by category
  - Return `ToolOutput` schema with groups
  - Mark as `readOnlyHint: true`

- [x] **2.3** Implement `get_talk_details` tool in `server/src/server.ts`
  - Accept talk ID parameter
  - Return full talk with abstract
  - Mark as `readOnlyHint: true`

- [x] **2.4** Configure MCP server with tool metadata
  - Set up server with proper tool descriptions
  - Configure tool annotations for ChatGPT
  - Add error handling

## Phase 3: React Component

- [x] **3.1** Create hooks in `web/src/hooks.ts`
  - Implement `useOpenAiGlobal` hook
  - Implement `useWidgetState` hook
  - Implement `useToolInput` and `useToolOutput` hooks

- [x] **3.2** Create TalkCard component in `web/src/component.tsx`
  - Display title, speakers, time
  - Handle click with follow-up message
  - Add accessibility attributes

- [x] **3.3** Create TopicRow component in `web/src/component.tsx`
  - Horizontal scroll container
  - Render TalkCard items
  - Category label with count

- [x] **3.4** Create App component in `web/src/component.tsx`
  - Read from `window.openai.toolOutput`
  - Render TopicRow groups
  - Handle empty and loading states

- [x] **3.5** Add minimal styles in `web/src/styles.css`
  - Horizontal scroll snap
  - Card layout and spacing
  - Theme support (light/dark)

## Phase 4: Integration

- [x] **4.1** Embed component in server response
  - Read bundled component from `web/dist/component.js`
  - Return UI template with encoded URL
  - Pass props to component

- [x] **4.2** Set up development workflow
  - Add watch scripts for both server and component
  - Configure hot reload for development

- [x] **4.3** Add error handling and empty states
  - Server-side validation
  - Component error boundaries
  - User-friendly error messages

## Phase 5: Testing & Validation

- [ ] **5.1** Write unit tests for categorization
  - Test known talks map to correct categories
  - Test edge cases (no matches, multiple matches)

- [ ] **5.2** Test component with mock data
  - Mock `window.openai` global
  - Verify rendering with various data sets
  - Test empty states

- [ ] **5.3** Create golden prompt test suite
  - "Show me all SwiftUI talks"
  - "What talks are on October 6th?"
  - "Talks by Tamia James"
  - "AI and machine learning talks"

- [ ] **5.4** Manual testing in ChatGPT developer mode
  - Link MCP server locally
  - Run through golden prompts
  - Verify UI rendering and interactions

- [ ] **5.5** Accessibility audit
  - Keyboard navigation
  - Screen reader testing
  - Color contrast verification

## Phase 6: Documentation & Deployment

- [x] **6.1** Update README with setup instructions
  - Prerequisites (Node.js version)
  - Installation steps
  - Development workflow

- [ ] **6.2** Add tool metadata documentation
  - Document tool parameters
  - Example queries for each filter type

- [x] **6.3** Build for production
  - Create production build scripts
  - Optimize bundle size
  - Test production build locally

## Dependencies

- Task 1.3 must complete before 2.2 (categorization needed for search)
- Task 2.1 must complete before 2.2 (data loader needed for search)
- Task 3.1 must complete before 3.2-3.4 (hooks needed for components)
- Task 2.4 must complete before 4.1 (server needed for embedding)
- Task 3.5 must complete before 4.1 (component bundle needed)

## Parallelizable Work

- Phase 1 tasks can be done in parallel
- Phase 2 and Phase 3 can be developed independently (with agreed interfaces)
- All testing tasks (5.1-5.3) can be done in parallel once implementation is complete
