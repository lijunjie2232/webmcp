import SearchEngineBase from './SearchEngineBase.js';

class BingSearch extends SearchEngineBase {
  constructor(options = {}) {
    super('Bing', 'https://www.bing.com/search?q=', options);
  }

  async search(keyword, options = {}) {
    console.log(`Searching Bing for: ${keyword}`);
    return await this.performSearch(keyword, options);
  }

  async extractResults() {
    // Bing-specific result extraction - standardized format
    const rawResults = await this.browserManager.evaluate(() => {
      const extractedResults = [];
      const seenUrls = new Set();
      
      // Look for h2 elements which typically contain result titles in Bing
      const titleElements = document.querySelectorAll('h2');
      
      titleElements.forEach(h2 => {
        const linkElement = h2.querySelector('a[href]');
        
        if (linkElement) {
          const href = linkElement.href;
          const title = linkElement.textContent.trim();
          
          // Filter out Bing navigation links (but allow search result redirects)
          // Bing uses /ck/a?! and /aclick for search result redirects
          const isSearchResult = href.includes('/ck/a?!') || href.includes('/aclick?');
          const isBingNav = href.includes('bing.com') && !isSearchResult;
          
          // Skip if it's a Bing navigation link or doesn't meet criteria
          if (!href || isBingNav || title.length <= 5 || seenUrls.has(href)) {
            return;
          }
          
          seenUrls.add(href);
          
          // Find snippet - look for text in parent or sibling elements
          let snippet = '';
          let parent = h2.parentElement;
          
          // Search up to 4 levels up for snippet text
          for (let i = 0; i < 4 && parent; i++) {
            const parentText = parent.textContent.trim();
            // Look for text that's longer than just the title
            if (parentText.length > title.length + 30 && parentText.length < 600) {
              // Extract text that's not part of the title
              const lines = parentText.split('\n').filter(line => line.trim().length > 10);
              if (lines.length > 1) {
                // Get lines after the title line
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
          
          // If still no snippet, try looking for adjacent paragraph or div
          if (!snippet) {
            const nextSibling = h2.nextElementSibling;
            if (nextSibling && (nextSibling.tagName === 'P' || nextSibling.tagName === 'DIV')) {
              const siblingText = nextSibling.textContent.trim();
              if (siblingText.length > 20 && siblingText.length < 400) {
                snippet = siblingText.substring(0, 300);
              }
            }
          }
          
          extractedResults.push({
            title: title.substring(0, 200),
            url: href,  // Return raw URL, will be decoded in Node.js context
            snippet: snippet
          });
        }
      });
      
      return extractedResults.slice(0, 10); // Return first 10 results
    });
    
    // Decode Bing tracking URLs in Node.js context and filter results
    const decodedResults = rawResults
      .map(result => {
        let finalUrl = result.url;
        
        // Bing uses /ck/a?! format with base64-encoded URL in 'u' parameter
        if (result.url.includes('/ck/a?!') || result.url.includes('/ck/a?')) {
          try {
            const urlObj = new URL(result.url);
            const encodedUrl = urlObj.searchParams.get('u');
            
            if (encodedUrl) {
              // Remove the 'a1' prefix that Bing adds before base64 encoding
              const cleanEncoded = encodedUrl.replace(/^a1/, '');
              // Decode base64 to get actual URL
              const decodedUrl = Buffer.from(cleanEncoded, 'base64').toString('utf-8');
              
              if (decodedUrl && decodedUrl.startsWith('http')) {
                finalUrl = decodedUrl;
              } else if (decodedUrl && decodedUrl.startsWith('/')) {
                // Convert relative URLs to absolute (Bing internal links)
                finalUrl = new URL(decodedUrl, 'https://www.bing.com').toString();
              }
            }
          } catch (error) {
            console.warn(`Failed to decode Bing URL: ${error.message}`);
          }
        }
        // Also handle /aclick? ad tracking URLs
        else if (result.url.includes('/aclick?')) {
          try {
            const urlObj = new URL(result.url);
            const encodedUrl = urlObj.searchParams.get('u');
            
            if (encodedUrl) {
              // Decode URL-encoded string
              const decodedUrl = decodeURIComponent(encodedUrl);
              
              if (decodedUrl && decodedUrl.startsWith('http')) {
                finalUrl = decodedUrl;
              }
            }
          } catch (error) {
            console.warn(`Failed to decode Bing ad URL: ${error.message}`);
          }
        }
        
        return {
          ...result,
          url: finalUrl
        };
      })
      // Filter out Bing internal pages (shopping, videos, etc.) - keep only external content
      .filter(result => {
        const url = result.url;
        // Exclude Bing internal pages for shopping, videos, images, news
        // These are special Bing features, not regular search results
        const isBingInternal = url.includes('bing.com') && 
                               (url.includes('/shop') || 
                                url.includes('/videos/search') || 
                                url.includes('/images/search') || 
                                url.includes('/news/search'));
        return !isBingInternal;
      });
    
    return decodedResults;
  }

  async waitForResults(timeout = 15000) {
    // Wait for Bing search results to load - needs more time for JS rendering
    try {
      // Wait for h2 elements which contain result titles
      await this.browserManager.waitForSelector('h2', { timeout });
      
      // Additional wait to ensure JavaScript has rendered content
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn('Could not find Bing result selectors, proceeding anyway');
    }
  }
}

export default BingSearch;
