import BrowserManager from '../BrowserManager.js';

class PageParser {
  constructor(browserManager, tag = 'page', options = {}) {
    this.browserManager = browserManager;
    this.tag = tag;
    this.page = null;
    this.context = null;

    // Configuration options
    this.options = {
      blockStylesheets: options.blockStylesheets || false, // Don't block stylesheets by default
      maxContentLength: options.maxContentLength || 50000,
      parseTimeout: options.parseTimeout || 60000,
      maxRetries: options.maxRetries || 1,
      headless: options.headless !== undefined ? options.headless : true, // Default to headless mode
      ...options
    };
  }

  /**
   * Initialize a new page/tab for parsing
   */
  async initialize() {
    console.log(`[${this.tag}] === PAGE PARSER INITIALIZE STARTED ===`);
    
    if (!this.browserManager) {
      console.error(`[${this.tag}] Error: BrowserManager is required`);
      throw new Error('BrowserManager is required');
    }

    // Create a new context and page
    console.log(`[${this.tag}] Creating new browser context`);
    this.context = await this.browserManager.browser.newContext({
      locale: this.browserManager.locale || 'ja-JP',
      timezoneId: this.browserManager.timezoneId || 'Asia/Tokyo',
      ...(this.browserManager.geolocation && { geolocation: this.browserManager.geolocation }),
      permissions: this.browserManager.geolocation ? ['geolocation'] : []
    });

    console.log(`[${this.tag}] Creating new page`);
    this.page = await this.context.newPage();

    // Block unnecessary resources to accelerate page load
    // Block: images (including gif), icons, fonts (woff2), CSS stylesheets, media, etc.
    console.log(`[${this.tag}] Setting up resource blocking`);
    await this.page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();

      // Resource types to block for faster parsing
      const blockList = [
        'image',      // All images (jpg, png, gif, svg, webp, ico, etc.)
        'media',      // Video and audio files
        'font',       // Font files (woff, woff2, ttf, etc.)
        'imageset',   // Image sets
        'stylesheet', // CSS stylesheets
        'other'       // Other non-essential resources
      ];

      // Additional check for specific file extensions (fallback)
      const blockedExtensions = [
        '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp', '.bmp', '.ico',
        '.woff', '.woff2', '.ttf', '.eot', '.otf',
        '.css', '.scss', '.less',
        '.mp4', '.webm', '.avi', '.mov', '.mp3', '.wav'
      ];

      const shouldBlockByExtension = blockedExtensions.some(ext =>
        url.toLowerCase().includes(ext)
      );

      if (blockList.includes(resourceType) || shouldBlockByExtension) {
        route.abort();
      } else {
        route.continue();
      }
    });

    console.log(`[${this.tag}] === PAGE PARSER INITIALIZE COMPLETED ===`);
    return this.page;
  }

  /**
   * Load URL and extract cleaned text content for LLM
   * @param {string} url - The URL to parse
   * @param {Object} options - Parse options (overrides constructor options)
   * @returns {Object} - Object containing title, text content, and URL
   */
  async parse(url, options = {}) {
    console.log(`[${this.tag}] === PARSE STARTED ===`);
    console.log(`[${this.tag}] URL: ${url}`);
    console.log(`[${this.tag}] Options:`, JSON.stringify(options, null, 2));
    
    const parseOptions = { ...this.options, ...options };
    const startTime = Date.now();

    // Implement retry logic
    let lastError;
    for (let attempt = 1; attempt <= parseOptions.maxRetries + 1; attempt++) {
      try {
        console.log(`[${this.tag}] Attempt ${attempt} of ${parseOptions.maxRetries + 1}`);
        const result = await this._doParse(url, parseOptions);
        const duration = Date.now() - startTime;
        console.log(`[${this.tag}] === PARSE COMPLETED ===`);
        console.log(`[${this.tag}] Duration: ${duration}ms`);
        console.log(`[${this.tag}] Title: ${result.title}`);
        console.log(`[${this.tag}] Content length: ${result.content?.length || 0} characters`);
        return result;
      } catch (error) {
        lastError = error;
        if (attempt <= parseOptions.maxRetries) {
          console.log(`[${this.tag}] Attempt ${attempt} failed, retrying in ${attempt}s... (${error.message})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    const duration = Date.now() - startTime;
    console.error(`[${this.tag}] === PARSE FAILED ===`);
    console.error(`[${this.tag}] Duration: ${duration}ms`);
    console.error(`[${this.tag}] Error:`, lastError.message);
    console.error(`[${this.tag}] Stack trace:`, lastError.stack);
    throw lastError;
  }

  /**
   * Internal parse implementation
   */
  async _doParse(url, options = {}) {
    if (!this.page) {
      await this.initialize();
    }

    try {
      console.log(`[${this.tag}] Parsing URL: ${url}`);

      // Add event listeners for debugging
      const startTime = Date.now();
      if (options.debug) {
        this.page.on('request', request => {
          console.log(`[${this.tag}] Request: ${request.url()} (${request.resourceType()})`);
        });

        this.page.on('response', response => {
          console.log(`[${this.tag}] Response: ${response.url()} - ${response.status()}`);
        });

        this.page.on('requestfailed', request => {
          console.log(`[${this.tag}] Request failed: ${request.url()} - ${request.failure().errorText}`);
        });
      }

      // Navigate to the URL with timeout
      // Use 'domcontentloaded' as default - waits for DOM to be parsed
      // For very slow pages, can override with 'commit' (faster) or 'load' (slower)
      console.log(`[${this.tag}] Options:`, JSON.stringify(options, null, 2));
      const navigationTimeout = options.navigationTimeout || 5000; // Default to 5 seconds
      const waitStrategy = options.waitUntil || 'domcontentloaded';

      console.log(`[${this.tag}] Navigating with strategy: ${waitStrategy}, timeout: ${navigationTimeout}ms`);

      let response;
      let navigationError = null;
      
      try {
        response = await this.page.goto(url, {
          waitUntil: waitStrategy,
          timeout: navigationTimeout
        });
      } catch (navError) {
        navigationError = navError;
        console.warn(`[${this.tag}] Navigation error occurred: ${navError.message}`);
        console.warn(`[${this.tag}] Attempting to extract available content from partially loaded page...`);
      }

      const loadTime = Date.now() - startTime;
      console.log(`[${this.tag}] Navigation phase completed in ${loadTime}ms`);

      // Check if we have a response (may be null if navigation completely failed)
      let statusCode = 0;
      if (response) {
        statusCode = response.status();
        // Check HTTP status
        if (!response.ok()) {
          throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
        }
      } else if (navigationError) {
        // If navigation failed completely, try to get current URL and status
        console.warn(`[${this.tag}] No response object available, extracting from current page state`);
        try {
          const pageInfo = await this.page.evaluate(() => {
            return {
              url: window.location.href,
              title: document.title,
              hasContent: document.body && document.body.innerHTML.length > 0
            };
          });
          console.log(`[${this.tag}] Current page state:`, pageInfo);
        } catch (e) {
          console.warn(`[${this.tag}] Could not extract page state: ${e.message}`);
        }
      }

      // Extract title (may fail if page didn't load at all)
      let title = '';
      try {
        title = await this.page.title();
      } catch (e) {
        console.warn(`[${this.tag}] Could not extract title: ${e.message}`);
      }

      // Extract cleaned text content optimized for LLM with overall timeout
      const parseTimeout = options.parseTimeout || 7000; // Default to 7 seconds
      let textContent = '';
      
      try {
        textContent = await Promise.race([
          this.page.evaluate(() => {
            // Remove script, style, nav, header, footer elements
            const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, noscript, g, path, svg, img');
            elementsToRemove.forEach(el => el.remove());

            // Get main content area if available - expanded selector list
            const selectors = [
              'main', 'article', '.content', '#content', '.post', '.article',
              '.main-content', '#main-content', '.entry-content', '#entry-content',
              '[role="main"]', '.post-content', '#post-content',
              'section.content', 'div.content-area'
            ];

            let mainContent = null;
            for (const selector of selectors) {
              mainContent = document.querySelector(selector);
              if (mainContent) break;
            }

            // If no main content area found, use body
            if (!mainContent) {
              mainContent = document.body;
            }

            // Extract text with better formatting
            const text = mainContent.innerText;

            // Clean up the text
            return text
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0 && line.length < 200) // Filter empty and very long lines
              .filter((line, index, arr) => index === 0 || line !== arr[index - 1]) // Remove consecutive duplicates
              .join('\n');
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Content extraction timeout after ${parseTimeout}ms`)), parseTimeout)
          )
        ]);
      } catch (extractError) {
        console.warn(`[${this.tag}] Content extraction failed: ${extractError.message}`);
        // If content extraction fails, try to get raw body text
        try {
          textContent = await this.page.evaluate(() => {
            return document.body ? document.body.innerText : '';
          });
        } catch (e) {
          console.warn(`[${this.tag}] Fallback content extraction also failed: ${e.message}`);
        }
      }

      // Apply content length limit
      const maxLength = options.maxContentLength;
      const limitedContent = textContent.length > maxLength
        ? textContent.substring(0, maxLength) + '...\n[Content truncated due to length]'
        : textContent;

      console.log(`[${this.tag}] Successfully extracted content: ${title || 'No title'} (${limitedContent.length} chars)`);

      // If there was a navigation error but we got some content, return it with a warning
      if (navigationError && limitedContent.length > 0) {
        console.warn(`[${this.tag}] Returning partial content due to navigation timeout/error`);
      }

      // If we have no content at all and navigation failed, throw the original error
      if (!limitedContent && navigationError) {
        console.error(`[${this.tag}] No content could be extracted, throwing navigation error`);
        throw navigationError;
      }

      return {
        title: title,
        content: limitedContent,
        url: url,
        tag: this.tag,
        statusCode: statusCode,
        navigationError: navigationError ? navigationError.message : null
      };
    } catch (error) {
      console.error(`[${this.tag}] Error parsing URL ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse multiple URLs sequentially using the same page
   * @param {Array<string>} urls - Array of URLs to parse
   * @returns {Array<Object>} - Array of parse results
   */
  async parseMultiple(urls, options = {}) {
    if (!this.page) {
      await this.initialize();
    }

    const results = [];
    for (const url of urls) {
      try {
        const result = await this.parse(url, options);
        results.push(result);
      } catch (error) {
        results.push({
          url,
          error: error.message,
          tag: this.tag
        });
      }
    }
    return results;
  }

  /**
   * Destroy the page and clean up resources
   */
  async destroy() {
    console.log(`[${this.tag}] === PAGE PARSER DESTROY STARTED ===`);
    
    if (this.page) {
      console.log(`[${this.tag}] Closing page`);
      await this.page.close();
      this.page = null;
      console.log(`[${this.tag}] Page closed successfully`);
    } else {
      console.log(`[${this.tag}] No page to close`);
    }

    if (this.context) {
      console.log(`[${this.tag}] Closing context`);
      await this.context.close();
      this.context = null;
      console.log(`[${this.tag}] Context closed successfully`);
    } else {
      console.log(`[${this.tag}] No context to close`);
    }
    
    console.log(`[${this.tag}] === PAGE PARSER DESTROY COMPLETED ===`);
  }
}

export default PageParser;
