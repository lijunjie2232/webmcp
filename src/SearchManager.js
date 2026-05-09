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
    const searchEngine = this.searchEngines[engine.toLowerCase()];
    
    if (!searchEngine) {
      throw new Error(`Unsupported search engine: ${engine}. Supported engines: ${Object.keys(this.searchEngines).join(', ')}`);
    }

    try {
      console.log(`Starting search on ${engine} for keyword: "${keyword}"`);
      const results = await searchEngine.search(keyword, options);
      console.log(`Search completed on ${engine}, found ${results.results.length} results`);
      return results;
    } catch (error) {
      console.error(`Search failed on ${engine}:`, error.message);
      throw error;
    }
  }

  async searchMultipleEngines(keyword, engines = ['google', 'bing', 'duckduckgo'], options = {}) {
    const results = {};
    
    for (const engine of engines) {
      try {
        results[engine] = await this.search(keyword, engine, options);
      } catch (error) {
        console.error(`Failed to search on ${engine}:`, error.message);
        results[engine] = { error: error.message, engine, keyword, timestamp: new Date().toISOString() };
      }
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
