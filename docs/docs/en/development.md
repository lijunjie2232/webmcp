# Development Guide

This guide provides information for developers who want to understand, extend, or contribute to WebMCP.

## Project Structure

```
webmcp/
├── src/
│   ├── engine/                 # Search engine implementations
│   │   ├── SearchEngineBase.js # Base class
│   │   ├── GoogleSearch.js     # Google implementation
│   │   ├── BingSearch.js       # Bing implementation
│   │   ├── DuckDuckGoSearch.js # DuckDuckGo implementation
│   │   └── YahooJapanSearch.js # Yahoo Japan implementation
│   ├── tool/                   # Advanced tools
│   │   ├── DeepSearch.js       # Deep search with parsing
│   │   └── PageParser.js       # Page parser
│   ├── BrowserManager.js       # Browser management
│   ├── SearchManager.js        # Search coordination
│   └── SearchMCPServer.js      # MCP server interface
├── tests/                      # Test files
├── docs/                       # Documentation
└── package.json                # Dependencies
```

## Architecture Overview

### Core Components

1. **BrowserManager**: Manages browser instances using `cloakbrowser`
2. **Search Engines**: Each engine extends `SearchEngineBase`
3. **SearchManager**: Coordinates multiple search engines
4. **DeepSearch**: Advanced search with automatic page parsing
5. **PageParser**: Parses individual web pages
6. **SearchMCPServer**: Exposes functionality through MCP protocol

## Adding Search Engines

To add a new search engine:

### Step 1: Create Engine Class

```javascript
// src/engine/MySearchEngine.js
import SearchEngineBase from './SearchEngineBase.js';

class MySearchEngine extends SearchEngineBase {
  async search(keyword, options = {}) {
    // Implement search logic
    return {
      keyword,
      engine: 'myengine',
      results: [],
      timestamp: new Date().toISOString()
    };
  }
}

export default MySearchEngine;
```

### Step 2: Register in SearchManager

```javascript
import MySearchEngine from './engine/MySearchEngine.js';

this.searchEngines = {
  google: new GoogleSearch(options),
  myengine: new MySearchEngine(options)
};
```

## Testing

Run tests:

```bash
node tests/test-deep-search.js
node tests/test-language-change.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit pull request

## API Reference

### SearchMCPServer

**Constructor:**
```javascript
new SearchMCPServer(options)
```

**Options:**
- `locale`: string - Language/locale code
- `timezoneId`: string - Timezone identifier
- `geolocation`: object - Geographic coordinates
- `parserNum`: number - Number of parallel parsers

**Methods:**
- `handleToolCall(toolName, args)`: Execute a tool
- `getTools()`: Get available tools
- `cleanup()`: Clean up resources