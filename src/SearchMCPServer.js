import SearchManager from './SearchManager.js';
import DeepSearch from './tool/DeepSearch.js';
import PageParser from './tool/PageParser.js';

// Simple MCP Server implementation for search functionality
class SearchMCPServer {
  constructor(options = {}) {
    this.searchManager = new SearchManager(options);
    this.deepSearch = new DeepSearch(options);
    this.pageParser = null; // Will be initialized when needed
    this.currentLanguage = options.locale || 'ja-JP'; // Default to ja-JP
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
            },
            language: {
              type: 'string',
              description: 'Optional language/locale override for this search (e.g., "en-US", "ja-JP")'
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
            },
            language: {
              type: 'string',
              description: 'Optional language/locale override for this search (e.g., "en-US", "ja-JP")'
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
            },
            language: {
              type: 'string',
              description: 'Optional language/locale override for this search (e.g., "en-US", "ja-JP")'
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
      },
      {
        name: 'set_language',
        description: 'Set the language/locale for search results (affects all subsequent searches)',
        inputSchema: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              description: 'Language/locale code (e.g., "en-US", "ja-JP", "zh-CN", "ko-KR")'
            }
          },
          required: ['language']
        }
      },
      {
        name: 'parse_page',
        description: 'Parse a web page URL and extract its content (title, text content, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL of the page to parse'
            },
            maxContentLength: {
              type: 'number',
              description: 'Maximum length of extracted content',
              default: 50000
            },
            parseTimeout: {
              type: 'number',
              description: 'Timeout for parsing in milliseconds',
              default: 60000
            }
          },
          required: ['url']
        }
      }
    ];
  }

  async handleToolCall(toolName, args) {
    try {
      switch (toolName) {
        case 'search':
          if (args.language) {
            await this.setLanguage(args.language);
          }
          return await this.searchManager.search(args.keyword, args.engine || 'google');
        
        case 'search_multiple':
          if (args.language) {
            await this.setLanguage(args.language);
          }
          return await this.searchManager.searchMultipleEngines(
            args.keyword, 
            args.engines || ['google', 'bing', 'duckduckgo', 'yahoojapan']
          );
        
        case 'deep_search':
          if (args.language) {
            await this.setLanguage(args.language);
          }
          return await this.deepSearch.deepSearch(args.keyword, {
            engines: args.engines || ['google'],
            maxResultsPerEngine: args.maxResultsPerEngine || 5,
            parserNum: args.parserNum || 3
          });
        
        case 'get_available_engines':
          return {
            engines: this.searchManager.getAvailableEngines()
          };
        
        case 'set_language':
          return await this.setLanguage(args.language);
        
        case 'parse_page':
          return await this.parsePage(args.url, {
            maxContentLength: args.maxContentLength,
            parseTimeout: args.parseTimeout
          });
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error handling tool call ${toolName}:`, error.message);
      throw error;
    }
  }

  async setLanguage(language) {
    try {
      console.log(`Changing language to: ${language}`);
      this.currentLanguage = language;
      
      // Update the browser manager locale in both searchManager and deepSearch
      if (this.searchManager.searchEngines) {
        for (const engine of Object.values(this.searchManager.searchEngines)) {
          if (engine.browserManager) {
            engine.browserManager.locale = language;
          }
        }
      }
      
      if (this.deepSearch.browserManager) {
        this.deepSearch.browserManager.locale = language;
      }
      
      // Recreate engines in deepSearch to apply new locale
      this.deepSearch.engines = {};
      
      console.log(`Language successfully changed to: ${language}`);
      return {
        success: true,
        language: language,
        message: `Language set to ${language}`
      };
    } catch (error) {
      console.error(`Error setting language:`, error.message);
      throw error;
    }
  }

  async parsePage(url, options = {}) {
    try {
      console.log(`Parsing page: ${url}`);
      
      // Initialize page parser if not already done
      if (!this.pageParser) {
        // Create a temporary browser manager for parsing
        const BrowserManager = (await import('./BrowserManager.js')).default;
        const browserManager = new BrowserManager({
          locale: this.currentLanguage,
          timezoneId: this.getTimezoneForLocale(this.currentLanguage)
        });
        await browserManager.initialize();
        
        this.pageParser = new PageParser(browserManager, 'mcp-parser');
        await this.pageParser.initialize();
      }
      
      // Parse the page
      const result = await this.pageParser.parse(url, options);
      
      console.log(`Successfully parsed page: ${result.title}`);
      return result;
    } catch (error) {
      console.error(`Error parsing page:`, error.message);
      throw error;
    }
  }

  getTimezoneForLocale(locale) {
    // Map common locales to timezones
    const timezoneMap = {
      'ja-JP': 'Asia/Tokyo',
      'en-US': 'America/New_York',
      'en-GB': 'Europe/London',
      'zh-CN': 'Asia/Shanghai',
      'ko-KR': 'Asia/Seoul',
      'de-DE': 'Europe/Berlin',
      'fr-FR': 'Europe/Paris',
      'es-ES': 'Europe/Madrid',
      'it-IT': 'Europe/Rome',
      'pt-BR': 'America/Sao_Paulo',
      'ru-RU': 'Europe/Moscow',
      'ar-SA': 'Asia/Riyadh',
      'hi-IN': 'Asia/Kolkata'
    };
    
    return timezoneMap[locale] || 'UTC';
  }

  getTools() {
    return this.tools;
  }

  async cleanup() {
    await this.searchManager.cleanup();
    await this.deepSearch.cleanup();
    
    // Cleanup page parser if it exists
    if (this.pageParser) {
      await this.pageParser.destroy();
      this.pageParser = null;
    }
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
