# Spec: ChatGPT App - Conference Schedule Browser

**Capability**: `chatgpt-app`
**Status**: Proposed
**Version**: 1.0.0

## Overview

A ChatGPT app that provides a visual interface for browsing conference talks from `schedule.json`. Users interact via natural language to filter talks, and results are displayed as horizontally scrolling cards organized by topic category.

---

## ADDED Requirements

### Requirement: Talk Search

The app MUST support searching talks from the conference schedule with optional filters.

#### Scenario: User searches for talks by category

**Given** the user asks "Show me all SwiftUI talks"
**When** ChatGPT calls the `search_talks` tool with `category: "SwiftUI & Design"`
**Then** the server returns all talks matching that category
**And** the React component displays them in a horizontal scrolling row

#### Scenario: User searches for talks by day

**Given** the user asks "What talks are on October 6th?"
**When** ChatGPT calls the `search_talks` tool with `day: "Oct 6"`
**Then** the server returns all talks scheduled for that day
**And** the component displays them grouped by category

#### Scenario: User searches for talks by speaker

**Given** the user asks "Show talks by Tamia James"
**When** ChatGPT calls the `search_talks` tool with `speaker: "Tamia James"`
**Then** the server returns all talks by that speaker
**And** the component displays them with speaker highlighted

#### Scenario: User searches with keywords

**Given** the user asks "Show talks about testing"
**When** ChatGPT calls the `search_talks` tool with `keywords: ["testing"]`
**Then** the server returns talks matching in title or abstract
**And** the component displays relevant results

---

### Requirement: Talk Details Retrieval

The app MUST support retrieving full details for a specific talk.

#### Scenario: User clicks a card for more information

**Given** the component displays a talk card
**When** the user clicks the card
**Then** the component sends a follow-up message with talk ID
**And** ChatGPT calls `get_talk_details` with the ID
**And** the server returns the full abstract and metadata
**And** ChatGPT presents the information conversationally

#### Scenario: Invalid talk ID

**Given** ChatGPT calls `get_talk_details` with an invalid ID
**When** the server processes the request
**Then** the server returns a null result with error message
**And** ChatGPT informs the user the talk was not found

---

### Requirement: Categorization

The app MUST automatically categorize talks based on title and abstract content.

#### Scenario: Talk is categorized by keywords

**Given** a talk with title "Hello Foundation Models"
**When** the server processes the talk
**Then** it is categorized as "AI & Machine Learning"
**And** displayed in the corresponding row

#### Scenario: Uncategorized talks go to General

**Given** a talk with no matching category keywords
**When** the server processes the talk
**Then** it is categorized as "General"
**And** displayed in the General row

#### Scenario: Category keyword priority

**Given** a talk matching multiple category keywords
**When** the server processes the talk
**Then** it is assigned to the first matching category
**And** not duplicated across categories

---

### Requirement: Visual Presentation

The React component MUST display talks as horizontally scrolling cards grouped by category.

#### Scenario: Category row displays with label

**Given** talks are grouped by category
**When** the component renders
**Then** each category row shows a label with category name and count
**And** cards are displayed horizontally with scroll snapping

#### Scenario: Talk card displays key information

**Given** a talk in the results
**When** the component renders its card
**Then** the card displays:
  - Talk title (truncated to 2 lines max)
  - Speaker name(s)
  - Time range (e.g., "14:15–14:50")
  - Day indicator if spanning multiple days
  - Emoji for "Other" type (breaks, meals)

#### Scenario: Horizontal scrolling interaction

**Given** a category row with multiple cards
**When** the user scrolls horizontally
**Then** scroll snaps to card boundaries
**And** scroll is smooth with native momentum
**And** all cards remain accessible via keyboard

---

### Requirement: ChatGPT Integration

The app MUST integrate with ChatGPT's conversational interface per Apps SDK patterns.

#### Scenario: No search bar in component

**Given** the component is rendered
**When** the user views the interface
**Then** there is NO search input field
**And** filtering happens only via ChatGPT conversation

#### Scenario: Follow-up message on card click

**Given** a talk card is displayed
**When** the user clicks the card
**Then** the component calls `window.openai.sendFollowupMessage`
**And** the prompt includes talk title and speaker
**And** ChatGPT responds with detailed information

#### Scenario: Display mode adaptation

**Given** the component is rendered
**When** `window.openai.displayMode` changes
**Then** the component adapts layout for inline or fullscreen
**And** respects `window.openai.maxHeight` for vertical space

#### Scenario: Theme adaptation

**Given** the component is rendered
**When** `window.openai.theme` is "dark"
**Then** the component uses dark-appropriate colors
**And** when "light", uses light-appropriate colors

---

### Requirement: Accessibility

The component MUST be accessible via keyboard and screen readers.

#### Scenario: Keyboard navigation

**Given** the component is rendered
**When** the user tabs through the interface
**Then** each card receives focus in order
**And** Enter/Space triggers the card action
**And** focus is visible with clear indicator

#### Scenario: Screen reader support

**Given** the component is rendered
**When** a screen reader navigates to a card
**Then** the card announces: "{title} by {speakers}, {time}"
**And** the card has `role="button"` attribute

#### Scenario: Semantic structure

**Given** the component is rendered
**When** inspected for semantic structure
**Then** category labels use heading elements
**And** card list uses list element
**And** ARIA labels are provided for interactive elements

---

### Requirement: Error Handling

The app MUST handle errors gracefully with clear user feedback.

#### Scenario: No results found

**Given** a search returns no talks
**When** the component renders
**Then** it displays "No talks match your query. Try a different category or day."
**And** offers no follow-up action

#### Scenario: Server error

**Given** the server encounters an error
**When** the error occurs
**Then** the component displays "Unable to load talks. Please try again."
**And** the user can retry via a new message to ChatGPT

#### Scenario: Invalid tool input

**Given** ChatGPT calls a tool with invalid parameters
**When** the server processes the request
**Then** the server returns an error response
**And** ChatGPT informs the user of the issue

---

## Related Capabilities

None - this is a new standalone capability.

## Migration Notes

Not applicable - new capability.
