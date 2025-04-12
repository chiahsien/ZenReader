#!/bin/bash
# ZenReader Chrome Extension Build Script
# This script creates a production-ready zip package for Chrome Web Store submission

# Set variables
EXTENSION_NAME="ZenReader"
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
DATE=$(date +%Y%m%d)
OUTPUT_FILE="${EXTENSION_NAME}_v${VERSION}_${DATE}.zip"

# Check if version was found
if [ -z "$VERSION" ]; then
  echo "Error: Could not extract version from manifest.json"
  exit 1
fi

# Echo build information
echo "Building ZenReader Chrome Extension..."
echo "Version: $VERSION"
echo "Output: $OUTPUT_FILE"

# Create a temporary build directory
BUILD_DIR="./build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Required files check
REQUIRED_FILES=(
  "manifest.json"
  "background.js"
  "styles.css"
  "_locales"
  "icons"
  "content"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -e "$file" ]; then
    echo "Error: Required file/directory '$file' not found"
    exit 1
  fi
done

# Copy required files to build directory
echo "Copying files to build directory..."
cp -r manifest.json background.js styles.css _locales icons content $BUILD_DIR

# Remove any development or unnecessary files
echo "Removing development files..."
find $BUILD_DIR -name "*.md" -delete
find $BUILD_DIR -name ".DS_Store" -delete
find $BUILD_DIR -name "*.log" -delete
find $BUILD_DIR -name ".git*" -delete
find $BUILD_DIR -name "*.sh" -delete
find $BUILD_DIR -name ".vscode" -type d -exec rm -r {} +

# Create the zip file
echo "Creating zip package..."
cd $BUILD_DIR || exit
zip -r ../$OUTPUT_FILE * > /dev/null
cd .. || exit

# Verify zip file was created
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: Failed to create zip file"
  rm -rf $BUILD_DIR
  exit 1
fi

# Clean up
echo "Cleaning up..."
rm -rf $BUILD_DIR

# Output summary
echo "------------------------------"
echo "Build complete!"
echo "Package created: $OUTPUT_FILE"
echo "Size: $(du -h $OUTPUT_FILE | cut -f1)"
echo "Ready for Chrome Web Store submission."
echo "------------------------------"
