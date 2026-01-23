# Change: Cache-busted widget template URIs

## Why
Widget template URIs are currently static, which can lead to stale HTML being cached by clients. Adding a content hash to the template URI ensures updates are fetched reliably.

## What Changes
- Generate a hashed HTML template name based on the widget template content at build time
- Record widget template hashes in a mapping file
- Emit widget template URIs that include the content hash
- Fall back to the unversioned template when a hashed template is unavailable

## Impact
- Affected specs: widget-templates
- Affected code: web build output, server widget metadata/template resolution
