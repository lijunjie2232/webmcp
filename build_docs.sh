#!/bin/bash

# WebMCP Documentation Build Script
# This script activates the virtual environment and runs mkdocs

echo "📚 Building WebMCP Documentation with mkdocs-material..."
echo ""

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    echo "✅ Activating virtual environment..."
    source .venv/bin/activate
else
    echo "❌ Virtual environment not found at .venv/bin/activate"
    exit 1
fi

# Check if mkdocs is available
if ! command -v mkdocs &> /dev/null; then
    echo "❌ mkdocs is not installed in the virtual environment"
    echo "Please install it with: pip install mkdocs mkdocs-material mkdocs-static-i18n"
    exit 1
fi

echo "✅ Virtual environment activated"
echo "✅ mkdocs found: $(which mkdocs)"
echo ""

# Change to docs directory
cd docs

# Run mkdocs command
if [ "$1" == "serve" ]; then
    echo "🚀 Starting documentation server..."
    mkdocs serve
elif [ "$1" == "build" ]; then
    echo "🔨 Building documentation..."
    mkdocs build
else
    echo "Usage: ./build_docs.sh [serve|build]"
    echo "  serve - Start local development server"
    echo "  build - Build static site"
    exit 1
fi