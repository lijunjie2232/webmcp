import SearchEngineBase from './SearchEngineBase.js';

class DuckDuckGoSearch extends SearchEngineBase {
  constructor(options = {}) {
    super('DuckDuckGo', 'https://duckduckgo.com/html/?q=', options);
  }

  async search(keyword, options = {}) {
    console.log(`Searching DuckDuckGo for: ${keyword}`);
    return await this.performSearch(keyword, options);
  }

  async extractResults() {
    // DuckDuckGo HTML version result extraction - standardized format
    const results = await this.browserManager.evaluate(() => {
      const extractedResults = [];
      const seenUrls = new Set();
      
      // DuckDuckGo HTML version uses .result__a for result titles/links
      const resultLinks = document.querySelectorAll('.result__a');
      
      if (resultLinks.length > 0) {
        resultLinks.forEach(link => {
          const href = link.href;
          const title = link.textContent.trim();
          
          // DuckDuckGo uses /l/?uddg= for redirects - these are valid search results
          const isRedirectLink = href.includes('/l/?uddg=') || href.includes('//duckduckgo.com/l/');
          
          // Filter out navigation links but allow redirect result links
          const isNavLink = href.includes('duckduckgo.com') && !isRedirectLink;
          
          if (href && !isNavLink && title.length > 5 && !seenUrls.has(href)) {
            seenUrls.add(href);
            
            // Find snippet - look for it in parent result body
            let snippet = '';
            const parent = link.closest('.result__body');
            if (parent) {
              const snippetElement = parent.querySelector('.result__snippet');
              if (snippetElement) {
                snippet = snippetElement.textContent.trim().substring(0, 300);
              }
            }
            
            // Decode redirect URL to get actual destination
            let finalUrl = href;
            if (isRedirectLink) {
              try {
                const urlObj = new URL(href);
                const uddgParam = urlObj.searchParams.get('uddg');
                if (uddgParam) {
                  finalUrl = decodeURIComponent(uddgParam);
                }
              } catch (e) {
                // Keep original URL if decoding fails
              }
            }
            
            extractedResults.push({
              title: title.substring(0, 200),
              url: finalUrl,
              snippet: snippet
            });
          }
        });
      }
      
      return extractedResults.slice(0, 10); // Return first 10 results
    });
    
    return results;
  }

  async waitForResults(timeout = 10000) {
    // Wait for DuckDuckGo HTML search results to load
    try {
      await this.browserManager.waitForSelector('.result__a, .results', { timeout });
    } catch (error) {
      console.warn('Could not find DuckDuckGo result selectors, proceeding anyway');
    }
  }
}

export default DuckDuckGoSearch;
