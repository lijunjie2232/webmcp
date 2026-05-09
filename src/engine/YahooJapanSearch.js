import SearchEngineBase from './SearchEngineBase.js';

class YahooJapanSearch extends SearchEngineBase {
  constructor(options = {}) {
    super('YahooJapan', 'https://search.yahoo.co.jp/search?p=', options);
  }

  async search(keyword, options = {}) {
    console.log(`Searching Yahoo Japan for: ${keyword}`);
    return await this.performSearch(keyword, options);
  }

  async extractResults() {
    // Yahoo Japan-specific result extraction - standardized format
    const results = await this.browserManager.evaluate(() => {
      const extractedResults = [];
      const seenUrls = new Set();
      
      // Strategy 1: Look for links in the main result area
      const webResults = document.querySelector('#web');
      if (webResults) {
        const links = Array.from(webResults.querySelectorAll('a[href]'));
        
        links.forEach(link => {
          const href = link.href;
          // Get clean title text - try to get just the text node, not nested elements
          let title = '';
          if (link.childNodes.length > 0 && link.childNodes[0].nodeType === Node.TEXT_NODE) {
            title = link.childNodes[0].textContent.trim();
          } else {
            title = link.textContent.trim();
          }
          
          // Filter out Yahoo internal links, navigation, and invalid entries
          const isYahooLink = href.includes('yahoo.co.jp') || 
                             href.includes('javascript:') ||
                             href.includes('search.yahoo');
          
          if (href && !isYahooLink && title.length > 8 && title.length < 250 && !seenUrls.has(href)) {
            seenUrls.add(href);
            
            // Try to find snippet - look in parent container
            let snippet = '';
            const resultContainer = link.closest('.sw-CardBase, .searchResult, li, div[data-yjcontainer]');
            
            if (resultContainer) {
              // Look for snippet in common locations
              const snippetCandidates = [
                resultContainer.querySelector('.fs-small'),
                resultContainer.querySelector('.fc-falcon'),
                resultContainer.querySelector('.snippet'),
                resultContainer.querySelector('p'),
                resultContainer.querySelector('.description')
              ];
              
              for (const candidate of snippetCandidates) {
                if (candidate) {
                  const text = candidate.textContent.trim();
                  if (text.length > 20 && text.length < 500 && !text.includes(title)) {
                    snippet = text.substring(0, 300);
                    break;
                  }
                }
              }
              
              // If still no snippet, try getting text from container excluding the link
              if (!snippet) {
                const containerText = resultContainer.textContent.trim();
                if (containerText.length > title.length + 40 && containerText.length < 600) {
                  // Remove the title from the text to get the snippet
                  snippet = containerText.replace(title, '').trim().substring(0, 300);
                }
              }
            }
            
            extractedResults.push({
              title: title.substring(0, 200),
              url: href,
              snippet: snippet
            });
          }
        });
      }
      
      // Strategy 2: Fallback - search entire page if #web not found or no results
      if (extractedResults.length === 0) {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        
        allLinks.forEach(link => {
          const href = link.href;
          let title = '';
          if (link.childNodes.length > 0 && link.childNodes[0].nodeType === Node.TEXT_NODE) {
            title = link.childNodes[0].textContent.trim();
          } else {
            title = link.textContent.trim();
          }
          
          // Filter for likely search results
          const isInternalLink = href.includes('yahoo.co.jp') || 
                                href.includes('javascript:') ||
                                href.includes('search.yahoo');
          
          if (href && 
              !isInternalLink && 
              title.length > 10 && 
              title.length < 200 &&
              !seenUrls.has(href)) {
            
            seenUrls.add(href);
            
            // Try to find snippet near the link
            let snippet = '';
            let parent = link.parentElement;
            
            for (let i = 0; i < 5 && parent; i++) {
              const parentText = parent.textContent.trim();
              if (parentText.length > title.length + 40 && parentText.length < 700) {
                // Extract text that's not part of the title
                const lines = parentText.split('\n').filter(line => line.trim().length > 15);
                if (lines.length > 1) {
                  const titleIndex = lines.findIndex(line => line.includes(title));
                  if (titleIndex >= 0 && titleIndex < lines.length - 1) {
                    snippet = lines.slice(titleIndex + 1).join(' ').substring(0, 300);
                  } else {
                    snippet = lines.slice(1).join(' ').substring(0, 300);
                  }
                  break;
                }
              }
              parent = parent.parentElement;
            }
            
            extractedResults.push({
              title: title.substring(0, 200),
              url: href,
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
    // Wait for Yahoo Japan search results to load
    try {
      await this.browserManager.waitForSelector('.sw-CardBase, .searchResult, #web', { timeout });
    } catch (error) {
      console.warn('Could not find specific Yahoo Japan result selectors, proceeding anyway');
    }
  }
}

export default YahooJapanSearch;
