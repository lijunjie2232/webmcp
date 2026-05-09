import BrowserManager from '../BrowserManager.js';

class SearchEngineBase {
  constructor(name, baseUrl, options = {}) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.browserManager = new BrowserManager(options);
  }

  // Abstract method to be implemented by child classes
  async search(keyword, options = {}) {
    throw new Error('Method "search" must be implemented by child classes');
  }

  // Abstract method to extract results specific to each search engine
  async extractResults() {
    throw new Error('Method "extractResults" must be implemented by child classes');
  }

  // Common method to build search URL
  buildSearchUrl(keyword, options = {}) {
    const encodedKeyword = encodeURIComponent(keyword);
    return `${this.baseUrl}${encodedKeyword}`;
  }

  // Common method to perform search using browser
  async performSearch(keyword, options = {}) {
    try {
      const searchUrl = this.buildSearchUrl(keyword, options);
      await this.browserManager.navigateTo(searchUrl);
      
      // Wait for results to load (adjust selector based on search engine)
      await this.waitForResults("networkidle");
      
      // Extract results using the specific implementation
      const results = await this.extractResults();
      
      return {
        engine: this.name,
        keyword: keyword,
        results: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error during search on ${this.name}:`, error.message);
      throw error;
    }
  }

  // Common method to wait for search results to load
  async waitForResults(timeout = 10000) {
    // This should be overridden by child classes with specific selectors
    await this.browserManager.waitForSelector('body', { timeout });
  }

  // Cleanup method
  async cleanup() {
    await this.browserManager.close();
  }

  // Method to get browser manager instance (for advanced usage)
  getBrowserManager() {
    return this.browserManager;
  }
}

export default SearchEngineBase;
