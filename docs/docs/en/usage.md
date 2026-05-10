# Usage Guide

This guide explains how to use WebMCP both as a command-line tool and as an MCP server in your applications.

## Quick Start with CLI

WebMCP provides a convenient command-line interface for quick searches without writing code.

### Installation

```bash
npm install -g webmcp
```

Or use directly with npx:

```bash
npx webmcp <command>
```

### CLI Commands

#### 1. serve - Start MCP Server

Start the MCP server in stdio mode for integration with MCP clients:

```bash
npx webmcp serve
```

This is used when configuring WebMCP in your MCP client configuration file.

#### 2. search - Quick Search

Search for a keyword on a specified search engine:

```bash
# Basic search (defaults to Google)
npx webmcp search "artificial intelligence"

# Specify search engine
npx webmcp search "machine learning" google

# With language option
npx webmcp search "AI research" google --language en-US
```

**Options:**
- `keyword` (required): The search term
- `engine` (optional): Search engine (google, bing, duckduckgo, yahoojapan). Default: google
- `--language <locale>` (optional): Language/locale override (e.g., en-US, ja-JP, zh-CN)

#### 3. deep-search - Deep Content Search

Perform deep search by searching and parsing result pages to extract full content:

```bash
# Basic deep search
npx webmcp deep-search "climate change"

# With multiple engines and options
npx webmcp deep-search "renewable energy" \
  --engines google,bing \
  --max-results 5 \
  --parsers 3

# With language setting
npx webmcp deep-search "technology trends" \
  --language ja-JP \
  --engines google \
  --max-results 3
```

**Options:**
- `keyword` (required): The search term
- `--engines <list>` (optional): Comma-separated list of engines. Default: google
- `--max-results <n>` (optional): Max results per engine. Default: 3
- `--parsers <n>` (optional): Number of parallel parsers. Default: 3
- `--language <locale>` (optional): Language/locale override

#### 4. engines - List Available Engines

Show all supported search engines:

```bash
npx webmcp engines
```

**Output:**
```
Available search engines:
  - google
  - bing
  - duckduckgo
  - yahoojapan
```

### CLI Examples

```bash
# Show help
npx webmcp

# Search in English
npx webmcp search "web development" google --language en-US

# Deep search across multiple engines
npx webmcp deep-search "blockchain technology" \
  --engines google,bing,duckduckgo \
  --max-results 4 \
  --parsers 2

# Japanese language search
npx webmcp search "人工知能" google --language ja-JP
```

---

## MCP Server Configuration

### Using with npx (Recommended)

The easiest way to use WebMCP as an MCP server is with npx. Add it to your MCP configuration file:

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["-y", "webmcp", "serve"]
    }
  }
}
```

**Note:** The `-y` flag automatically accepts prompts, and `serve` starts the server in stdio mode.

### Using with Local Installation

If you have WebMCP installed locally, you can reference it directly:

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "node",
      "args": ["/absolute/path/to/webmcp/bin/webmcp.js", "serve"]
    }
  }
}
```

### Full Path Configuration

For production environments, you may want to use the full path to npx:

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "/usr/local/bin/npx",
      "args": ["-y", "webmcp", "serve"]
    }
  }
}
```

## Available Tools

WebMCP provides 6 main tools for search operations:

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

### 6. parse_page

Parse a web page URL and extract its cleaned text content, optimized for LLM processing. This tool fetches the page, removes unnecessary elements (scripts, styles, navigation, etc.), and extracts the main content.

**Parameters:**
- `url` (required): The URL of the page to parse
- `maxContentLength` (optional): Maximum length of extracted content (default: 50000)
- `parseTimeout` (optional): Timeout for parsing in milliseconds (default: 60000)

**Returns:**
- `title`: Page title
- `content`: Cleaned text content
- `url`: The parsed URL
- `statusCode`: HTTP status code

**Features:**
- Automatically blocks images, media, fonts, and other non-essential resources for faster loading
- Extracts main content area using intelligent selectors
- Removes consecutive duplicate lines and filters empty lines
- Supports retry logic for failed requests
- Content is truncated if it exceeds maxContentLength

**Example:**
```javascript
await server.handleToolCall('parse_page', { 
  url: 'https://example.com/article',
  maxContentLength: 30000,
  parseTimeout: 45000
});
```

**Use Cases:**
- Extract article content for summarization
- Get clean text from web pages for RAG applications
- Parse documentation or blog posts
- Content analysis and processing

## LangChain Integration

### Using with LangChain MCP Client

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'webmcp', 'serve']
});

const client = new Client({ name: 'search-client', version: '1.0.0' });
await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools.tools.map(t => t.name));

// Perform a search
const result = await client.callTool({
  name: 'search',
  arguments: { 
    keyword: 'LangChain', 
    engine: 'google',
    language: 'en-US'
  }
});

console.log('Search results:', result.content[0].text);

// Perform deep search
const deepResult = await client.callTool({
  name: 'deep_search',
  arguments: { 
    keyword: 'AI frameworks',
    engines: ['google', 'bing'],
    maxResultsPerEngine: 3,
    parserNum: 2
  }
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