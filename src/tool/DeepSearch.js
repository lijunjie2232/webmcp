import BrowserManager from '../BrowserManager.js';
import PageParser from './PageParser.js';
import GoogleSearch from '../engine/GoogleSearch.js';
import BingSearch from '../engine/BingSearch.js';
import DuckDuckGoSearch from '../engine/DuckDuckGoSearch.js';
import YahooJapanSearch from '../engine/YahooJapanSearch.js';

class DeepSearch {
  constructor(options = {}) {
    this.browserManager = new BrowserManager(options);
    this.engines = {};
    this.parserNum = options.parserNum || 3; // Default to 3 parallel parsers
    this.initialized = false;
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    if (!this.initialized) {
      await this.browserManager.initialize();
      this.initialized = true;
      console.log('DeepSearch initialized with browser');
    }
  }

  /**
   * Get or create a search engine instance on-demand
   * @param {string} engineName - Name of the search engine ('google', 'bing', 'duckduckgo', 'yahoojapan')
   * @returns {Object} - Search engine instance
   */
  getEngine(engineName) {
    if (!this.engines[engineName]) {
      switch (engineName.toLowerCase()) {
        case 'google':
          this.engines[engineName] = new GoogleSearch({
            locale: this.browserManager.locale,
            timezoneId: this.browserManager.timezoneId,
            geolocation: this.browserManager.geolocation
          });
          break;
        case 'bing':
          this.engines[engineName] = new BingSearch({
            locale: this.browserManager.locale,
            timezoneId: this.browserManager.timezoneId,
            geolocation: this.browserManager.geolocation
          });
          break;
        case 'duckduckgo':
          this.engines[engineName] = new DuckDuckGoSearch({
            locale: this.browserManager.locale,
            timezoneId: this.browserManager.timezoneId,
            geolocation: this.browserManager.geolocation
          });
          break;
        case 'yahoojapan':
          this.engines[engineName] = new YahooJapanSearch({
            locale: this.browserManager.locale,
            timezoneId: this.browserManager.timezoneId,
            geolocation: this.browserManager.geolocation
          });
          break;
        default:
          throw new Error(`Unsupported search engine: ${engineName}`);
      }
      
      // Share the browser manager with the engine
      this.engines[engineName].browserManager = this.browserManager;
      console.log(`Engine '${engineName}' created on-demand`);
    }
    
    return this.engines[engineName];
  }

  /**
   * Perform search using specified engines and parse result pages
   * @param {string} keyword - Search keyword
   * @param {Object} options - Search options
   * @param {Array<string>} options.engines - Array of engine names to use (default: ['google'])
   * @param {number} options.maxResultsPerEngine - Max results per engine (default: 5)
   * @param {number} options.parserNum - Number of parallel parsers (overrides constructor value)
   * @returns {Array<Object>} - Array of documents with title, abstract, url, and content
   */
  async deepSearch(keyword, options = {}) {
    console.log(`[DeepSearch] === DEEP SEARCH STARTED ===`);
    
    const {
      engines = ['google'],
      maxResultsPerEngine = 5,
      parserNum = this.parserNum
    } = options;

    console.log(`[DeepSearch] Keyword: "${keyword}"`);
    console.log(`[DeepSearch] Engines: ${engines.join(', ')}`);
    console.log(`[DeepSearch] Max results per engine: ${maxResultsPerEngine}`);
    console.log(`[DeepSearch] Parallel parsers: ${parserNum}`);
    console.log(`[DeepSearch] Options:`, JSON.stringify(options, null, 2));

    const startTime = Date.now();

    // Ensure browser is initialized
    await this.initialize();

    // Step 1: Collect search results from all specified engines
    const allResults = [];
    
    for (const engineName of engines) {
      try {
        console.log(`[DeepSearch] Processing engine: ${engineName}`);
        const engine = this.getEngine(engineName);
        
        // Create a temporary page for search
        const context = await this.browserManager.browser.newContext({
          locale: this.browserManager.locale,
          timezoneId: this.browserManager.timezoneId,
          ...(this.browserManager.geolocation && { geolocation: this.browserManager.geolocation }),
          permissions: this.browserManager.geolocation ? ['geolocation'] : []
        });
        
        const page = await context.newPage();
        
        // Block unnecessary resources
        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          const blockList = ['image', 'media', 'font', 'stylesheet', 'imageset', 'other'];
          
          if (blockList.includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });

        // Temporarily assign page to engine's browser manager
        const originalPage = engine.browserManager.page;
        engine.browserManager.page = page;

        // Perform search
        console.log(`[DeepSearch] Executing search on ${engineName} for "${keyword}"`);
        const searchResult = await engine.search(keyword);
        
        // Restore original page
        engine.browserManager.page = originalPage;

        // Close the temporary page and context
        await page.close();
        await context.close();

        // Add engine info and limit results
        const limitedResults = searchResult.results.slice(0, maxResultsPerEngine).map(result => ({
          ...result,
          engine: engineName
        }));

        allResults.push(...limitedResults);
        console.log(`[DeepSearch] Engine '${engineName}' returned ${limitedResults.length} results`);
      } catch (error) {
        console.error(`[DeepSearch] Error with engine '${engineName}':`, error.message);
        console.error(`[DeepSearch] Stack trace:`, error.stack);
      }
    }

    console.log(`[DeepSearch] Total search results collected: ${allResults.length}`);

    if (allResults.length === 0) {
      console.warn('[DeepSearch] No search results found');
      return [];
    }

    // Step 2: Parse result pages in parallel batches
    const documents = [];
    const batchSize = parserNum;

    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize);
      console.log(`[DeepSearch] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} pages)`);

      // Create parsers for this batch
      const parsers = batch.map((result, index) => {
        const tag = `page-${i + index + 1}`;
        return new PageParser(this.browserManager, tag);
      });

      try {
        // Parse all pages in parallel
        const parsePromises = batch.map(async (result, index) => {
          const parser = parsers[index];
          try {
            console.log(`[DeepSearch] Parsing URL: ${result.url}`);
            const parsed = await parser.parse(result.url);
            console.log(`[DeepSearch] Successfully parsed: ${parsed.title || result.title}`);
            return {
              title: parsed.title || result.title,
              abstract: result.snippet || '',
              url: result.url,
              content: parsed.content,
              engine: result.engine
            };
          } catch (error) {
            console.error(`[DeepSearch] Failed to parse ${result.url}:`, error.message);
            // Return partial result even if parsing fails
            return {
              title: result.title,
              abstract: result.snippet || '',
              url: result.url,
              content: '',
              engine: result.engine,
              error: error.message
            };
          } finally {
            // Destroy parser after use
            await parser.destroy();
          }
        });

        const batchDocuments = await Promise.all(parsePromises);
        documents.push(...batchDocuments);
        console.log(`[DeepSearch] Batch completed, total documents so far: ${documents.length}`);
      } catch (error) {
        console.error('[DeepSearch] Error processing batch:', error.message);
        console.error('[DeepSearch] Stack trace:', error.stack);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[DeepSearch] === DEEP SEARCH COMPLETED ===`);
    console.log(`[DeepSearch] Duration: ${duration}ms`);
    console.log(`[DeepSearch] Total documents: ${documents.length}`);
    return documents;
  }

  /**
   * Cleanup all resources
   */
  async cleanup() {
    // Cleanup all engines
    for (const engineName in this.engines) {
      if (this.engines[engineName].cleanup) {
        await this.engines[engineName].cleanup();
      }
    }
    this.engines = {};

    // Cleanup browser manager
    await this.browserManager.close();
    this.initialized = false;
    console.log('DeepSearch cleaned up');
  }
}

export default DeepSearch;
