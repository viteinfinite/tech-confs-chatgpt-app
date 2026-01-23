## ADDED Requirements
### Requirement: Cache-busted widget template URI
The system SHALL publish widget template URIs that include a content hash of the HTML template.

#### Scenario: Updated widget template
- **WHEN** the widget HTML template changes
- **THEN** the widget template URI includes a new content hash

### Requirement: Fallback to unversioned widget template
The system SHALL fall back to the unversioned widget template URI if no hashed template is available.

#### Scenario: Missing hashed template
- **WHEN** a hashed widget template is not present
- **THEN** the system uses the unversioned widget template URI
