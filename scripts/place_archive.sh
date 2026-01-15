#!/bin/bash

# place_archive.sh - Copy an archive to the storage/files folder
# Usage: scripts/place_archive.sh <archive_path> <filename> <version> [--root <storage_root>]

set -e

# Default storage root
DEFAULT_ROOT="storage/files"
STORAGE_ROOT="${FILE_STORAGE_ROOT:-$DEFAULT_ROOT}"

# Parse arguments
ARCHIVE_PATH="$1"
FILENAME="$2"
VERSION="$3"

# Parse optional --root argument
if [ "$4" = "--root" ] && [ -n "$5" ]; then
    STORAGE_ROOT="$5"
fi

# Validate inputs
if [ -z "$ARCHIVE_PATH" ] || [ -z "$FILENAME" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <archive_path> <filename> <version> [--root <storage_root>]"
    exit 1
fi

# Validate filename (no path separators)
if [[ "$FILENAME" == *"/"* ]] || [[ "$FILENAME" == *"\\"* ]]; then
    echo "Error: filename must not contain path separators"
    exit 1
fi

# Validate version (1-128 chars)
if [ ${#VERSION} -lt 1 ] || [ ${#VERSION} -gt 128 ]; then
    echo "Error: version must be 1-128 characters"
    exit 1
fi

# Check if archive exists
if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "Error: archive not found: $ARCHIVE_PATH"
    exit 1
fi

# Create target directory
TARGET_DIR="${STORAGE_ROOT}/${FILENAME}/${VERSION}"
mkdir -p "$TARGET_DIR"

# Copy archive
cp "$ARCHIVE_PATH" "$TARGET_DIR/"

echo "Archive copied to: $TARGET_DIR/"
