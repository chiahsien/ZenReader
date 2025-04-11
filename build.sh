#!/bin/bash
# ZenReader Chrome Extension Build Script
# This script creates a production-ready zip package for Chrome Web Store submission

# Set variables
EXTENSION_NAME="zenreader"
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
DATE=$(date +%Y%m%d)
OUTPUT_FILE="${EXTENSION_NAME}_v${VERSION}_${DATE}.zip"

# Echo build information
echo "Building ZenReader Chrome Extension..."
echo "Version: $VERSION"
echo "Output: $OUTPUT_FILE"

# Create a temporary build directory
BUILD_DIR="./build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy required files to build directory
echo "Copying files to build directory..."
cp -r manifest.json background.js content.js styles.css _locales icons $BUILD_DIR

# Remove any development or unnecessary files
echo "Removing development files..."
find $BUILD_DIR -name "*.md" -delete
find $BUILD_DIR -name ".DS_Store" -delete
find $BUILD_DIR -name "*.log" -delete

# Create the zip file
echo "Creating zip package..."
cd $BUILD_DIR
zip -r ../$OUTPUT_FILE *
cd ..

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
