# Usage Guide

This guide explains how to use WebMCP as an MCP server in your applications.

## MCP Server Configuration

### Basic Configuration

To use WebMCP as an MCP server, add it to your MCP configuration file:

```json
{
  "mcpServers": {
    "search": {
      "command": "node",
      "args": ["/absolute/path/to/webmcp/src/SearchMCPServer.js"]
    }
  }
}
```

## Available Tools

WebMCP provides 5 main tools for search operations:

### 1. search

Search for a keyword on a specified search engine.

**Parameters:**
- `keyword` (required): The search keyword
- `engine` (optional): Search engine name (default: 'google')
- `language` (optional): Language override for this search

**Supported Engines:**
- `google`
- `bing`
- `duckduckgo`
- `yahoojapan`

**Example:**
```javascript
await server.handleToolCall('search', { 
  keyword: 'artificial intelligence',
  engine: 'google'
});
```

### 2. search_multiple

Search for a keyword on multiple search engines simultaneously.

**Example:**
```javascript
await server.handleToolCall('search_multiple', { 
  keyword: 'machine learning',
  engines: ['google', 'bing', 'duckduckgo']
});
```

### 3. deep_search

Perform deep search by searching multiple engines and parsing result pages to extract full content.

**Parameters:**
- `keyword` (required): The search keyword
- `engines` (optional): Array of engine names (default: ['google'])
- `maxResultsPerEngine` (optional): Max results per engine (default: 3)
- `parserNum` (optional): Number of parallel parsers (default: 3)

**Example:**
```javascript
await server.handleToolCall('deep_search', { 
  keyword: 'climate change',
  engines: ['google', 'bing'],
  maxResultsPerEngine: 5,
  parserNum: 3
});
```

### 4. get_available_engines

Get list of available search engines.

### 5. set_language

Set the language/locale for search results.

**Common Language Codes:**
- `en-US`, `ja-JP`, `zh-CN`, `ko-KR`

**Example:**
```javascript
await server.handleToolCall('set_language', { language: 'ja-JP' });
```

## LangChain Integration

### Using with LangChain MCP Client

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/webmcp/src/SearchMCPServer.js']
});

const client = new Client({ name: 'search-client', version: '1.0.0' });
await client.connect(transport);

const result = await client.callTool({
  name: 'search',
  arguments: { keyword: 'LangChain', engine: 'google' }
});

await client.close();
```

## Best Practices

### Resource Management

Always clean up resources after use:

```javascript
try {
  // Your search operations
} finally {
  await server.cleanup();
}
```

### Parallel Processing Optimization

Adjust `parserNum` based on your system:
- Low-end: 1-2 parsers
- Mid-range: 3-4 parsers
- High-end: 5+ parsers

### Rate Limiting

Add delays between searches:

```javascript
await server.handleToolCall('search', { keyword: 'query1' });
await new Promise(resolve => setTimeout(resolve, 2000));
await server.handleToolCall('search', { keyword: 'query2' });
```