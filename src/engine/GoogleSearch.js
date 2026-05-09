import SearchEngineBase from './SearchEngineBase.js';

class GoogleSearch extends SearchEngineBase {
  constructor(options = {}) {
    super('Google', 'https://www.google.com/search?q=', options);
  }

  async search(keyword, options = {}) {
    console.log(`Searching Google for: ${keyword}`);
    return await this.performSearch(keyword, options);
  }

  async extractResults() {
    // Google-specific result extraction - standardized format
    const results = await this.browserManager.evaluate(() => {
      const extractedResults = [];
      const seenUrls = new Set();
      
      // Try multiple strategies to find search results
      // Strategy 1: Look for links in #search container
      const searchContainer = document.querySelector('#search');
      if (searchContainer) {
        const links = Array.from(searchContainer.querySelectorAll('a[href]'));
        
        links.forEach(link => {
          const href = link.href;
          const text = link.textContent.trim();
          
          // Filter out Google internal links, empty links, and duplicates
          if (href && !href.includes('google.com') && text.length > 10 && !seenUrls.has(href)) {
            seenUrls.add(href);
            
            // Find parent container for snippet
            let parent = link.parentElement;
            let snippet = '';
            
            // Try to find snippet text near the link
            for (let i = 0; i < 3 && parent; i++) {
              const parentText = parent.textContent.trim();
              if (parentText.length > text.length && parentText.length < 500) {
                snippet = parentText.replace(text, '').trim().substring(0, 300);
                break;
              }
              parent = parent.parentElement;
            }
            
            extractedResults.push({
              title: text.split('\n')[0].substring(0, 200),
              url: href,
              snippet: snippet
            });
          }
        });
      }
      
      return extractedResults.slice(0, 10); // Return first 10 unique results
    });
    
    return results;
  }

  async waitForResults(timeout = 10000) {
    // Wait for Google search results to load
    try {
      await this.browserManager.waitForSelector('div.g', { timeout });
    } catch (error) {
      // If div.g selector not found, try alternative selectors
      try {
        await this.browserManager.waitForSelector('#search', { timeout });
      } catch (e) {
        console.warn('Could not find specific Google result selectors, proceeding anyway');
      }
    }
  }
}

export default GoogleSearch;
