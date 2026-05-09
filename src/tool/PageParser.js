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
      ...options
    };
  }

  /**
   * Initialize a new page/tab for parsing
   */
  async initialize() {
    if (!this.browserManager) {
      throw new Error('BrowserManager is required');
    }

    // Create a new context and page
    this.context = await this.browserManager.browser.newContext({
      locale: this.browserManager.locale || 'ja-JP',
      timezoneId: this.browserManager.timezoneId || 'Asia/Tokyo',
      ...(this.browserManager.geolocation && { geolocation: this.browserManager.geolocation }),
      permissions: this.browserManager.geolocation ? ['geolocation'] : []
    });

    this.page = await this.context.newPage();

    // Block unnecessary resources to accelerate page load
    await this.page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const blockList = ['image', 'media', 'font', 'imageset', 'other'];
      
      // Optionally block stylesheets (not recommended as it can break layouts)
      if (this.options.blockStylesheets) {
        blockList.push('stylesheet');
      }
      
      if (blockList.includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    console.log(`[${this.tag}] Page initialized`);
    return this.page;
  }

  /**
   * Load URL and extract cleaned text content for LLM
   * @param {string} url - The URL to parse
   * @param {Object} options - Parse options (overrides constructor options)
   * @returns {Object} - Object containing title, text content, and URL
   */
  async parse(url, options = {}) {
    const parseOptions = { ...this.options, ...options };
    
    // Implement retry logic
    let lastError;
    for (let attempt = 1; attempt <= parseOptions.maxRetries + 1; attempt++) {
      try {
        return await this._doParse(url, parseOptions);
      } catch (error) {
        lastError = error;
        if (attempt <= parseOptions.maxRetries) {
          console.log(`[${this.tag}] Attempt ${attempt} failed, retrying in ${attempt}s... (${error.message})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
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
      
      // Navigate to the URL with timeout
      const response = await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Check HTTP status
      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Extract title
      const title = await this.page.title();

      // Extract cleaned text content optimized for LLM with overall timeout
      const textContent = await Promise.race([
        this.page.evaluate(() => {
          // Remove script, style, nav, header, footer elements
          const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, noscript');
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
          setTimeout(() => reject(new Error(`Content extraction timeout after ${options.parseTimeout}ms`)), options.parseTimeout)
        )
      ]);

      // Apply content length limit
      const maxLength = options.maxContentLength;
      const limitedContent = textContent.length > maxLength 
        ? textContent.substring(0, maxLength) + '...\n[Content truncated due to length]' 
        : textContent;

      console.log(`[${this.tag}] Successfully parsed: ${title} (${limitedContent.length} chars)`);

      return {
        title: title,
        content: limitedContent,
        url: url,
        tag: this.tag,
        statusCode: response.status()
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
    if (this.page) {
      await this.page.close();
      this.page = null;
      console.log(`[${this.tag}] Page destroyed`);
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
      console.log(`[${this.tag}] Context closed`);
    }
  }
}

export default PageParser;
