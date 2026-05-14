import GoogleSearch from './engine/GoogleSearch.js';
import BingSearch from './engine/BingSearch.js';
import DuckDuckGoSearch from './engine/DuckDuckGoSearch.js';
import YahooJapanSearch from './engine/YahooJapanSearch.js';

class SearchManager {
  constructor(options = {}) {
    this.searchEngines = {
      google: new GoogleSearch(options),
      bing: new BingSearch(options),
      duckduckgo: new DuckDuckGoSearch(options),
      yahoojapan: new YahooJapanSearch(options)
    };
  }

  async search(keyword, engine = 'google', options = {}) {
    console.log(`[SearchManager] === SEARCH STARTED ===`);
    console.log(`[SearchManager] Keyword: "${keyword}"`);
    console.log(`[SearchManager] Engine: ${engine}`);
    console.log(`[SearchManager] Options:`, JSON.stringify(options, null, 2));
    
    const startTime = Date.now();
    const searchEngine = this.searchEngines[engine.toLowerCase()];
    
    if (!searchEngine) {
      console.error(`[SearchManager] Error: Unsupported search engine: ${engine}`);
      throw new Error(`Unsupported search engine: ${engine}. Supported engines: ${Object.keys(this.searchEngines).join(', ')}`);
    }

    try {
      console.log(`[SearchManager] Starting search on ${engine} for keyword: "${keyword}"`);
      const results = await searchEngine.search(keyword, options);
      const duration = Date.now() - startTime;
      
      console.log(`[SearchManager] === SEARCH COMPLETED ===`);
      console.log(`[SearchManager] Engine: ${engine}`);
      console.log(`[SearchManager] Duration: ${duration}ms`);
      console.log(`[SearchManager] Found ${results.results.length} results`);
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[SearchManager] === SEARCH FAILED ===`);
      console.error(`[SearchManager] Engine: ${engine}`);
      console.error(`[SearchManager] Duration: ${duration}ms`);
      console.error(`[SearchManager] Error:`, error.message);
      console.error(`[SearchManager] Stack trace:`, error.stack);
      throw error;
    }
  }

  async searchMultipleEngines(keyword, engines = ['google', 'bing', 'duckduckgo'], options = {}) {
    console.log(`[SearchManager] === SEARCH MULTIPLE ENGINES STARTED ===`);
    console.log(`[SearchManager] Keyword: "${keyword}"`);
    console.log(`[SearchManager] Engines: ${engines.join(', ')}`);
    console.log(`[SearchManager] Options:`, JSON.stringify(options, null, 2));
    
    const startTime = Date.now();
    const results = {};
    
    for (const engine of engines) {
      try {
        console.log(`[SearchManager] Searching on engine: ${engine}`);
        results[engine] = await this.search(keyword, engine, options);
        console.log(`[SearchManager] Successfully searched on ${engine}, found ${results[engine].results?.length || 0} results`);
      } catch (error) {
        console.error(`[SearchManager] Failed to search on ${engine}:`, error.message);
        results[engine] = { error: error.message, engine, keyword, timestamp: new Date().toISOString() };
      }
    }
    
    const duration = Date.now() - startTime;
    const successfulEngines = Object.keys(results).filter(key => !results[key].error);
    const failedEngines = Object.keys(results).filter(key => results[key].error);
    
    console.log(`[SearchManager] === SEARCH MULTIPLE ENGINES COMPLETED ===`);
    console.log(`[SearchManager] Duration: ${duration}ms`);
    console.log(`[SearchManager] Successful engines: ${successfulEngines.length} (${successfulEngines.join(', ')})`);
    if (failedEngines.length > 0) {
      console.log(`[SearchManager] Failed engines: ${failedEngines.length} (${failedEngines.join(', ')})`);
    }
    
    return results;
  }

  async cleanup() {
    for (const engine of Object.values(this.searchEngines)) {
      await engine.cleanup();
    }
  }

  getAvailableEngines() {
    return Object.keys(this.searchEngines);
  }
}

export default SearchManager;
