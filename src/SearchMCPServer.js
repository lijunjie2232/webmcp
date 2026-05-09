import SearchManager from './SearchManager.js';
import DeepSearch from './tool/DeepSearch.js';

// Simple MCP Server implementation for search functionality
class SearchMCPServer {
  constructor(options = {}) {
    this.searchManager = new SearchManager(options);
    this.deepSearch = new DeepSearch(options);
    this.tools = [
      {
        name: 'search',
        description: 'Search for a keyword on a specified search engine',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'The search keyword'
            },
            engine: {
              type: 'string',
              description: 'The search engine to use (google, bing, duckduckgo)',
              default: 'google'
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'search_multiple',
        description: 'Search for a keyword on multiple search engines',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'The search keyword'
            },
            engines: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of search engines to use (google, bing, duckduckgo, yahoojapan)',
              default: ['google', 'bing', 'duckduckgo', 'yahoojapan']
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'deep_search',
        description: 'Perform deep search by searching multiple engines and parsing result pages to extract full content',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'The search keyword'
            },
            engines: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of search engines to use (google, bing, duckduckgo, yahoojapan)',
              default: ['google']
            },
            maxResultsPerEngine: {
              type: 'number',
              description: 'Maximum number of results to fetch per engine',
              default: 3
            },
            parserNum: {
              type: 'number',
              description: 'Number of parallel page parsers to use',
              default: 3
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'get_available_engines',
        description: 'Get list of available search engines',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async handleToolCall(toolName, args) {
    try {
      switch (toolName) {
        case 'search':
          return await this.searchManager.search(args.keyword, args.engine || 'google');
        
        case 'search_multiple':
          return await this.searchManager.searchMultipleEngines(
            args.keyword, 
            args.engines || ['google', 'bing', 'duckduckgo', 'yahoojapan']
          );
        
        case 'deep_search':
          return await this.deepSearch.deepSearch(args.keyword, {
            engines: args.engines || ['google'],
            maxResultsPerEngine: args.maxResultsPerEngine || 5,
            parserNum: args.parserNum || 3
          });
        
        case 'get_available_engines':
          return {
            engines: this.searchManager.getAvailableEngines()
          };
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error handling tool call ${toolName}:`, error.message);
      throw error;
    }
  }

  getTools() {
    return this.tools;
  }

  async cleanup() {
    await this.searchManager.cleanup();
    await this.deepSearch.cleanup();
  }
}

// Example usage
async function main() {
  const server = new SearchMCPServer();
  
  console.log('Available tools:', server.getTools().map(t => t.name));
  
  // Example: Search for a keyword
  try {
    console.log('\n--- Searching Google for "cloudflare" ---');
    const results = await server.handleToolCall('search', { keyword: 'cloudflare', engine: 'google' });
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Search failed:', error.message);
  }
  
  // Cleanup
  await server.cleanup();
}

// Export for use as MCP server
export default SearchMCPServer;

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
