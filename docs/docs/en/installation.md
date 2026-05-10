# Installation Guide

This guide will help you set up WebMCP on your system.

## Quick Start (CLI Mode)

For quick usage without cloning the repository, you can use WebMCP directly via npx:

```bash
# Use directly with npx (no installation needed)
npx webmcp search "keyword"

# Or install globally
npm install -g webmcp
webmcp search "keyword"
```

See the [Usage Guide](usage.md) for more CLI commands.

## Prerequisites

Before installing WebMCP from source, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager

## Installation Steps

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd webmcp
```

Or download and extract the project archive.

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

This will install the required dependencies:
- `cloakbrowser` ^0.3.27 - Browser automation with anti-detection features
- `playwright-core` ^1.59.1 - Core Playwright library for browser control

### 3. Verify Installation

Run a simple test to verify everything is working:

```bash
node tests/test-deep-search.js
```

If the test runs without errors, the installation was successful.

## System Requirements

### Operating Systems
- Linux (recommended)
- macOS
- Windows

### Memory
- Minimum: 2GB RAM
- Recommended: 4GB RAM or more (for parallel parsing)

### Storage
- Approximately 500MB for dependencies and browser binaries

## Configuration Options

You can customize the behavior by passing options when creating the SearchMCPServer:

```javascript
import SearchMCPServer from './src/SearchMCPServer.js';

const server = new SearchMCPServer({
  locale: 'ja-JP',           // Language/locale setting
  timezoneId: 'Asia/Tokyo',  // Timezone setting
  geolocation: {             // Geolocation coordinates
    latitude: 35.6895,
    longitude: 139.6917
  }
});
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `locale` | string | `'ja-JP'` | Language/locale code (e.g., 'en-US', 'ja-JP', 'zh-CN') |
| `timezoneId` | string | `'Asia/Tokyo'` | Timezone identifier |
| `geolocation` | object | Tokyo coords | Geographic coordinates for location-based searches |
| `parserNum` | number | `3` | Number of parallel page parsers |

## Troubleshooting

### Common Issues

#### 1. Browser Launch Fails

**Problem**: Error when launching the browser

**Solution**: 
- Ensure you have sufficient permissions
- Check if your system meets the requirements
- Try reinstalling dependencies: `npm clean-install`

#### 2. Network Issues

**Problem**: Cannot connect to search engines

**Solution**:
- Check your internet connection
- Verify firewall settings
- Ensure no proxy is blocking connections

#### 3. Memory Errors

**Problem**: Out of memory errors during deep search

**Solution**:
- Reduce `parserNum` option (e.g., set to 1 or 2)
- Reduce `maxResultsPerEngine` in deep search calls
- Increase system available memory

## Next Steps

After successful installation, proceed to:
- [Usage Guide](usage.md) - Learn how to use the MCP server
- [Development Guide](development.md) - Understand the architecture and contribute