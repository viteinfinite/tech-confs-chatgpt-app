#!/bin/bash

# Script to zip this project excluding node_modules and copy it to the files folder

set -e

# Configuration
PROJECT_NAME=$(basename "$(pwd)")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="${PROJECT_NAME}-${TIMESTAMP}.zip"
VERSION="v${TIMESTAMP}"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Creating archive for ${PROJECT_NAME}..."

# Create a temporary zip file excluding node_modules and other common exclusions
zip -r "${ARCHIVE_NAME}" \
    . \
    -x "*/node_modules/*" \
    -x ".git/*" \
    -x ".DS_Store" \
    -x "*.log" \
    -x "*/dist/*" \
    -x "*/build/*" \
    -x ".next/*" \
    -x "*/coverage/*" \
    -x "*.zip" \
    -x ".env.local" \
    -x ".env.*.local"

echo -e "${GREEN}Archive created: ${ARCHIVE_NAME}${NC}"

# Use place_archive.sh to copy to storage/files
if [ -f "scripts/place_archive.sh" ]; then
    echo "Copying archive to files folder..."
    bash scripts/place_archive.sh "${ARCHIVE_NAME}" "${PROJECT_NAME}" "${VERSION}"
    echo -e "${GREEN}Archive copied to storage/files/${PROJECT_NAME}/${VERSION}/${NC}"
else
    echo "Warning: place_archive.sh not found, archive not copied to files folder"
fi

echo -e "${GREEN}Done!${NC}"
