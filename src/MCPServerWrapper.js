import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import SearchMCPServer from './SearchMCPServer.js';

// Create the search server instance
const searchServer = new SearchMCPServer({
  locale: process.env.SEARCH_LOCALE || 'ja-JP'
});

// Create MCP server
const server = new Server(
  {
    name: "webmcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Setup tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('[WebMCP] === LIST TOOLS REQUEST RECEIVED ===');
  const tools = searchServer.getTools();
  console.error('[WebMCP] Returning tools:', {
    count: tools.length,
    toolNames: tools.map(t => t.name)
  });
  return {
    tools: tools
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error('[WebMCP] === TOOL CALL REQUEST RECEIVED ===', {
    toolName: name,
    arguments: args,
    timestamp: new Date().toISOString()
  });
  
  const startTime = Date.now();
  
  try {
    const result = await searchServer.handleToolCall(name, args);
    const duration = Date.now() - startTime;
    
    console.error('[WebMCP] === TOOL CALL COMPLETED ===', {
      toolName: name,
      duration: `${duration}ms`,
      resultType: typeof result,
      hasContent: !!result,
      timestamp: new Date().toISOString()
    });
    
    console.error('[WebMCP] Result preview:', {
      toolName: name,
      preview: JSON.stringify(result).substring(0, 300) + (JSON.stringify(result).length > 300 ? '...' : '')
    });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[WebMCP] === TOOL CALL FAILED ===', {
      toolName: name,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Error handling
server.onerror = (error) => {
  console.error('[MCP Error]', error);
};

process.on('SIGINT', async () => {
  await searchServer.cleanup();
  await server.close();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WebMCP server started and listening on stdio');
}

main().catch((error) => {
  console.error('Failed to start WebMCP server:', error);
  process.exit(1);
});
