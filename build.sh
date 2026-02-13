#!/bin/bash
# ZenReader Chrome Extension Build Script
# This script creates a production-ready zip package for Chrome Web Store submission

# Set variables
EXTENSION_NAME="ZenReader"
VERSION=$(grep -o '"version": "[^"]*"' src/manifest.json | head -1 | cut -d'"' -f4)
DATE=$(date +%Y%m%d)
OUTPUT_FILE="${EXTENSION_NAME}_v${VERSION}_${DATE}.zip"

# Check if version was found
if [ -z "$VERSION" ]; then
  echo "Error: Could not extract version from src/manifest.json"
  exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed"
  exit 1
fi

# Echo build information
echo "Building ZenReader Chrome Extension..."
echo "Version: $VERSION"
echo "Output: $OUTPUT_FILE"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run type checking and build
echo "Running type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "Error: TypeScript type check failed"
  exit 1
fi

echo "Building with Vite..."
npx vite build
if [ $? -ne 0 ]; then
  echo "Error: Vite build failed"
  exit 1
fi

# Verify dist directory exists
if [ ! -d "dist" ]; then
  echo "Error: dist directory not found after build"
  exit 1
fi

# Remove any development or unnecessary files from dist
echo "Cleaning dist directory..."
find dist -name ".DS_Store" -delete
find dist -name "*.log" -delete
find dist -name "*.map" -delete

# Create the zip file from dist contents
echo "Creating zip package..."
cd dist || exit
zip -r ../"$OUTPUT_FILE" * > /dev/null
cd .. || exit

# Verify zip file was created
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: Failed to create zip file"
  exit 1
fi

# Output summary
echo "------------------------------"
echo "Build complete!"
echo "Package created: $OUTPUT_FILE"
echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "Ready for Chrome Web Store submission."
echo "------------------------------"
