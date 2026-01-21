## ADDED Requirements
### Requirement: Component Preview Container
The system SHALL provide a development-only preview app under `preview/` that renders existing React components from the project.

#### Scenario: Developer opens preview app
- **WHEN** the preview app starts in development
- **THEN** a selectable view renders one of the project's React components

### Requirement: Component Selection
The preview app SHALL allow switching between available components for manual inspection.

#### Scenario: Developer switches component
- **WHEN** the developer selects a different component in the preview UI
- **THEN** the preview renders the newly selected component

### Requirement: Mocked Inputs
The preview app SHALL provide mocked props/state for components that require inputs.

#### Scenario: Component requires props
- **WHEN** a component needs props or state to render
- **THEN** the preview supplies representative mocked inputs

### Requirement: Preview Dev Autoreload
The preview app SHALL support autoreload during development when run via `npm run preview`.

#### Scenario: Developer edits preview code
- **WHEN** the developer updates preview app source files
- **THEN** the preview app reloads to reflect the changes
