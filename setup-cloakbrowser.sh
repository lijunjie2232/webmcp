#!/bin/bash

# ============================================
# CloakBrowser Setup Script
# Downloads and installs CloakBrowser for webmcp
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOAKBROWSER_URL="https://github.com/CloakHQ/CloakBrowser/releases/latest/download/cloakbrowser-linux-x64.tar.gz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BROWSER_DIR="$PROJECT_ROOT/browser"
DOWNLOAD_DIR="$BROWSER_DIR/cloakbrowser"
TEMP_FILE="$DOWNLOAD_DIR/cloakbrowser-linux-x64.tar.gz.tmp"
FINAL_FILE="$DOWNLOAD_DIR/cloakbrowser-linux-x64.tar.gz"
BINARY_PATH="$DOWNLOAD_DIR/chrome"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CloakBrowser Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create browser directory if it doesn't exist
if [ ! -d "$BROWSER_DIR" ]; then
    echo -e "${YELLOW}Creating browser directory...${NC}"
    mkdir -p "$BROWSER_DIR"
fi

if [ ! -d "$DOWNLOAD_DIR" ]; then
    echo -e "${YELLOW}Creating cloakbrowser directory...${NC}"
    mkdir -p "$DOWNLOAD_DIR"
fi

# Check if binary already exists
if [ -f "$BINARY_PATH" ]; then
    echo -e "${GREEN}✓ CloakBrowser already installed at:${NC}"
    echo -e "   $BINARY_PATH"
    echo ""
    echo -e "${YELLOW}To reinstall, delete the existing installation first:${NC}"
    echo -e "   rm -rf $DOWNLOAD_DIR"
    exit 0
fi

echo -e "${YELLOW}CloakBrowser not found. Starting download...${NC}"
echo -e "URL: $CLOAKBROWSER_URL"
echo ""

# Download to temporary file first
echo -e "${BLUE}Downloading CloakBrowser...${NC}"
if command -v curl &> /dev/null; then
    curl -L -o "$TEMP_FILE" "$CLOAKBROWSER_URL" \
        --progress-bar \
        --fail \
        --retry 3 \
        --retry-delay 5
elif command -v wget &> /dev/null; then
    wget -O "$TEMP_FILE" "$CLOAKBROWSER_URL" \
        --progress=bar:force:noscroll \
        --tries=3 \
        --waitretry=5
else
    echo -e "${RED}✗ Error: Neither curl nor wget found. Please install one of them.${NC}"
    exit 1
fi

# Check if download was successful
if [ $? -ne 0 ] || [ ! -f "$TEMP_FILE" ]; then
    echo -e "${RED}✗ Download failed!${NC}"
    rm -f "$TEMP_FILE"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Download completed successfully${NC}"

# Move temp file to final location
echo -e "${BLUE}Moving to final location...${NC}"
mv "$TEMP_FILE" "$FINAL_FILE"

# Extract the archive
echo -e "${BLUE}Extracting CloakBrowser...${NC}"
cd "$DOWNLOAD_DIR"
tar -xzf "$FINAL_FILE"

# Verify binary exists (extracts directly to DOWNLOAD_DIR)
if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${RED}✗ Binary not found at expected location: $BINARY_PATH${NC}"
    echo -e "${YELLOW}Contents of $DOWNLOAD_DIR:${NC}"
    ls -la "$DOWNLOAD_DIR"
    exit 1
fi

# Make binary executable
chmod +x "$BINARY_PATH"

# Clean up the tarball to save space
# rm -f "$FINAL_FILE"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ CloakBrowser installed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Installation details:${NC}"
echo -e "  Binary path: $BINARY_PATH"
echo -e "  Directory:   $DOWNLOAD_DIR"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. The BrowserManager will automatically use this binary"
echo -e "  2. Restart your application to use CloakBrowser"
echo ""
echo -e "${YELLOW}To verify installation:${NC}"
echo -e "  ls -lh $BINARY_PATH"
echo ""
