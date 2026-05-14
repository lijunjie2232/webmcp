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
            query: {
              type: 'string',
              description: 'The search query/keyword'
            },
            keyword: {
              type: 'string',
              description: 'The search keyword (alternative to query)'
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
          required: []
        }
      },
      {
        name: 'search_multiple',
        description: 'Search for a keyword on multiple search engines',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query/keyword'
            },
            keyword: {
              type: 'string',
              description: 'The search keyword (alternative to query)'
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
          required: []
        }
      },
      {
        name: 'deep_search',
        description: 'Perform deep search by searching multiple engines and parsing result pages to extract full content',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query/keyword'
            },
            keyword: {
              type: 'string',
              description: 'The search keyword (alternative to query)'
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
          required: []
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
        name: 'parse_url',
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
            },
            navigationTimeout: {
              type: 'number',
              description: 'Timeout for page navigation in milliseconds',
              default: 30000
            },
            waitUntil: {
              type: 'string',
              description: 'Navigation wait strategy (commit, domcontentloaded, load, networkidle)',
              default: 'domcontentloaded'
            },
            headless: {
              type: 'boolean',
              description: 'Run browser in headless mode (true) or with visible window (false)',
              default: true
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts if parsing fails',
              default: 1
            }
          },
          required: ['url']
        }
      }
    ];
  }

  async handleToolCall(toolName, args) {
    console.log(`[MCP] === TOOL CALL STARTED ===`);
    console.log(`[MCP] Tool: ${toolName}`);
    console.log(`[MCP] Arguments:`, JSON.stringify(args, null, 2));
    console.log(`[MCP] Timestamp: ${new Date().toISOString()}`);
    
    const startTime = Date.now();
    
    try {
      // Normalize input: support both 'query' and 'keyword' parameters
      const normalizedArgs = { ...args };
      if (args.query && !args.keyword) {
        normalizedArgs.keyword = args.query;
      }
      
      // For parse_url tool, also normalize 'query' to 'url' if 'url' is not provided
      if (toolName === 'parse_url' && args.query && !args.url) {
        normalizedArgs.url = args.query;
      }
      
      // Validate that we have a keyword for search operations
      const requiresKeyword = ['search', 'search_multiple', 'deep_search'].includes(toolName);
      if (requiresKeyword && !normalizedArgs.keyword) {
        throw new Error(`Missing required parameter: 'keyword' or 'query' must be provided for ${toolName}`);
      }
      
      let result;
      switch (toolName) {
        case 'search':
          console.log(`[MCP] Executing search tool`);
          console.log(`[MCP] Keyword: ${normalizedArgs.keyword}`);
          console.log(`[MCP] Engine: ${normalizedArgs.engine || 'yahoojapan'}`);
          if (normalizedArgs.language) {
            console.log(`[MCP] Language override: ${normalizedArgs.language}`);
            await this.setLanguage(normalizedArgs.language);
          }
          result = await this.searchManager.search(normalizedArgs.keyword, normalizedArgs.engine || 'yahoojapan');
          console.log(`[MCP] Search completed, found ${result.results?.length || 0} results`);
          break;
        
        case 'search_multiple':
          console.log(`[MCP] Executing search_multiple tool`);
          console.log(`[MCP] Keyword: ${normalizedArgs.keyword}`);
          console.log(`[MCP] Engines: ${(normalizedArgs.engines || ['google', 'bing', 'duckduckgo', 'yahoojapan']).join(', ')}`);
          if (normalizedArgs.language) {
            console.log(`[MCP] Language override: ${normalizedArgs.language}`);
            await this.setLanguage(normalizedArgs.language);
          }
          result = await this.searchManager.searchMultipleEngines(
            normalizedArgs.keyword, 
            normalizedArgs.engines || ['google', 'bing', 'duckduckgo', 'yahoojapan']
          );
          console.log(`[MCP] Multiple search completed across ${Object.keys(result).length} engines`);
          break;
        
        case 'deep_search':
          console.log(`[MCP] Executing deep_search tool`);
          console.log(`[MCP] Keyword: ${normalizedArgs.keyword}`);
          console.log(`[MCP] Engines: ${(normalizedArgs.engines || ['google']).join(', ')}`);
          console.log(`[MCP] Max results per engine: ${normalizedArgs.maxResultsPerEngine || 5}`);
          console.log(`[MCP] Parser count: ${normalizedArgs.parserNum || 3}`);
          if (normalizedArgs.language) {
            console.log(`[MCP] Language override: ${normalizedArgs.language}`);
            await this.setLanguage(normalizedArgs.language);
          }
          result = await this.deepSearch.deepSearch(normalizedArgs.keyword, {
            engines: normalizedArgs.engines || ['google'],
            maxResultsPerEngine: normalizedArgs.maxResultsPerEngine || 5,
            parserNum: normalizedArgs.parserNum || 3
          });
          console.log(`[MCP] Deep search completed, found ${result.length} documents`);
          break;
        
        case 'get_available_engines':
          console.log(`[MCP] Executing get_available_engines tool`);
          result = {
            engines: this.searchManager.getAvailableEngines()
          };
          console.log(`[MCP] Available engines: ${result.engines.join(', ')}`);
          break;
        
        case 'set_language':
          console.log(`[MCP] Executing set_language tool`);
          console.log(`[MCP] Setting language to: ${args.language}`);
          result = await this.setLanguage(args.language);
          console.log(`[MCP] Language set successfully`);
          break;
        
        case 'parse_url':
          console.log(`[MCP] Executing parse_url tool`);
          console.log(`[MCP] URL: ${normalizedArgs.url}`);
          console.log(`[MCP] Options:`, JSON.stringify({
            maxContentLength: normalizedArgs.maxContentLength,
            parseTimeout: normalizedArgs.parseTimeout,
            navigationTimeout: normalizedArgs.navigationTimeout,
            waitUntil: normalizedArgs.waitUntil,
            headless: normalizedArgs.headless
          }, null, 2));
          result = await this.parsePage(normalizedArgs.url, {
            maxContentLength: normalizedArgs.maxContentLength,
            parseTimeout: normalizedArgs.parseTimeout,
            navigationTimeout: normalizedArgs.navigationTimeout,
            waitUntil: normalizedArgs.waitUntil,
            headless: normalizedArgs.headless,
            maxRetries: normalizedArgs.maxRetries
          });
          console.log(`[MCP] Page parsed successfully: ${result.title}`);
          break;
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
      
      const duration = Date.now() - startTime;
      console.log(`[MCP] === TOOL CALL COMPLETED ===`);
      console.log(`[MCP] Tool: ${toolName}`);
      console.log(`[MCP] Duration: ${duration}ms`);
      console.log(`[MCP] Result type: ${typeof result}`);
      console.log(`[MCP] Result preview:`, JSON.stringify(result).substring(0, 300) + (JSON.stringify(result).length > 300 ? '...' : ''));
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[MCP] === TOOL CALL FAILED ===`);
      console.error(`[MCP] Tool: ${toolName}`);
      console.error(`[MCP] Error: ${error.message}`);
      console.error(`[MCP] Duration: ${duration}ms`);
      console.error(`[MCP] Stack trace:`, error.stack);
      throw error;
    }
  }

  async setLanguage(language) {
    console.log(`[MCP] === SET LANGUAGE STARTED ===`);
    console.log(`[MCP] Current language: ${this.currentLanguage}`);
    console.log(`[MCP] New language: ${language}`);
    
    try {
      this.currentLanguage = language;
      
      // Update the browser manager locale in both searchManager and deepSearch
      let enginesUpdated = 0;
      if (this.searchManager.searchEngines) {
        for (const engine of Object.values(this.searchManager.searchEngines)) {
          if (engine.browserManager) {
            engine.browserManager.locale = language;
            enginesUpdated++;
          }
        }
      }
      console.log(`[MCP] Updated ${enginesUpdated} engines in searchManager`);
      
      if (this.deepSearch.browserManager) {
        this.deepSearch.browserManager.locale = language;
        console.log(`[MCP] Updated deepSearch browser manager locale`);
      }
      
      // Recreate engines in deepSearch to apply new locale
      const oldEngineCount = Object.keys(this.deepSearch.engines).length;
      this.deepSearch.engines = {};
      console.log(`[MCP] Cleared ${oldEngineCount} engines from deepSearch`);
      
      console.log(`[MCP] === SET LANGUAGE COMPLETED ===`);
      console.log(`[MCP] Language successfully changed to: ${language}`);
      return {
        success: true,
        language: language,
        message: `Language set to ${language}`
      };
    } catch (error) {
      console.error(`[MCP] === SET LANGUAGE FAILED ===`);
      console.error(`[MCP] Error setting language:`, error.message);
      console.error(`[MCP] Stack trace:`, error.stack);
      throw error;
    }
  }

  async parsePage(url, options = {}) {
    console.log(`[MCP] === PARSE PAGE STARTED ===`);
    console.log(`[MCP] URL: ${url}`);
    console.log(`[MCP] Options:`, JSON.stringify(options, null, 2));
    
    try {
      // Initialize page parser if not already done
      if (!this.pageParser) {
        console.log(`[MCP] Initializing page parser for the first time`);
        // Create a temporary browser manager for parsing
        const BrowserManager = (await import('./BrowserManager.js')).default;
        const browserManager = new BrowserManager({
          locale: this.currentLanguage,
          timezoneId: this.getTimezoneForLocale(this.currentLanguage),
          headless: options.headless !== undefined ? options.headless : true
        });
        console.log(`[MCP] Creating browser manager with locale: ${this.currentLanguage}`);
        await browserManager.initialize();
        console.log(`[MCP] Browser manager initialized`);
        
        this.pageParser = new PageParser(browserManager, 'mcp-parser');
        await this.pageParser.initialize();
        console.log(`[MCP] Page parser initialized`);
      }
      
      // Parse the page
      console.log(`[MCP] Starting page parsing`);
      const result = await this.pageParser.parse(url, options);
      
      console.log(`[MCP] === PARSE PAGE COMPLETED ===`);
      console.log(`[MCP] Successfully parsed page: ${result.title}`);
      console.log(`[MCP] Content length: ${result.content?.length || 0} characters`);
      console.log(`[MCP] Status code: ${result.statusCode}`);
      return result;
    } catch (error) {
      console.error(`[MCP] === PARSE PAGE FAILED ===`);
      console.error(`[MCP] Error parsing page:`, error.message);
      console.error(`[MCP] Stack trace:`, error.stack);
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
