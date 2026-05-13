import { launch } from 'cloakbrowser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is 3 levels up from this file (third/webmcp/src/)
const PROJECT_ROOT = path.resolve(__dirname, '../');
const BROWSER_DIR = path.join(PROJECT_ROOT, 'browser');
const CLOAKBROWSER_PATH = path.join(BROWSER_DIR, 'cloakbrowser', 'chrome');

class BrowserManager {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    // Default locale and timezone settings
    this.locale = options.locale || 'ja-JP';
    this.timezoneId = options.timezoneId || 'Asia/Tokyo';
    this.geolocation = options.geolocation || { latitude: 35.6895, longitude: 139.6917 };
    this.headless = options.headless !== undefined ? options.headless : true; // Default to headless mode
  }

  async initialize() {
    if (!this.browser) {
      console.log('Launching browser with cloakbrowser...');
      
      // Check if custom CloakBrowser binary exists
      if (fs.existsSync(CLOAKBROWSER_PATH)) {
        console.log(`Using custom CloakBrowser binary: ${CLOAKBROWSER_PATH}`);
        this.browser = await launch({
          executablePath: CLOAKBROWSER_PATH,
          headless: this.headless
        });
      } else {
        console.log('Custom binary not found, using default cloakbrowser...');
        this.browser = await launch({
          headless: this.headless
        });
      }
      
      console.log('Browser launched successfully');
    }
    return this.browser;
  }

  async createPage() {
    if (!this.browser) {
      await this.initialize();
    }
    
    // Create a new browser context with locale and timezone settings
    const context = await this.browser.newContext({
      locale: this.locale,
      timezoneId: this.timezoneId,
      ...(this.geolocation && { geolocation: this.geolocation }),
      permissions: this.geolocation ? ['geolocation'] : []
    });
    
    this.page = await context.newPage();
    console.log(`New page created with locale: ${this.locale}, timezone: ${this.timezoneId}`);
    
    // Block unnecessary resources to accelerate page load
    await this.page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      // Block images, media, fonts, stylesheets, and other non-essential resources
      const blockList = ['image', 'media', 'font', 'stylesheet', 'imageset', 'other'];
      
      if (blockList.includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    return this.page;
  }

  async navigateTo(url, options = {}) {
    if (!this.page) {
      await this.createPage();
    }
    
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, options);
    console.log('Navigation completed');
    
    return this.page;
  }

  async getContent() {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    const content = await this.page.content();
    return content;
  }

  async getTextContent() {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    const textContent = await this.page.evaluate(() => document.body.innerText);
    return textContent;
  }

  async getTitle() {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    const title = await this.page.title();
    return title;
  }

  async takeScreenshot(path = 'screenshot.png') {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    await this.page.screenshot({ path });
    console.log(`Screenshot saved as ${path}`);
    return path;
  }

  async evaluate(script) {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    return await this.page.evaluate(script);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed successfully');
      this.browser = null;
      this.page = null;
    }
  }

  // Method to wait for specific elements or conditions
  async waitForSelector(selector, options = {}) {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    return await this.page.waitForSelector(selector, options);
  }

  // Method to click on elements
  async click(selector) {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    await this.page.click(selector);
  }

  // Method to fill input fields
  async fill(selector, value) {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    await this.page.fill(selector, value);
  }

  // Method to get all links on the page
  async getAllLinks() {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    return await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        title: link.title
      })).filter(link => link.href && link.text);
    });
  }

  // Method to extract search results (generic implementation)
  async extractSearchResults(resultSelector = '.g', titleSelector = 'h3', linkSelector = 'a', snippetSelector = '.VwiC3b') {
    if (!this.page) {
      throw new Error('No page available');
    }
    
    return await this.page.evaluate(({ resultSel, titleSel, linkSel, snippetSel }) => {
      const results = [];
      const resultElements = document.querySelectorAll(resultSel);
      
      resultElements.forEach(element => {
        const titleElement = element.querySelector(titleSel);
        const linkElement = element.querySelector(linkSel);
        const snippetElement = element.querySelector(snippetSel);
        
        if (titleElement && linkElement) {
          results.push({
            title: titleElement.textContent.trim(),
            url: linkElement.href,
            snippet: snippetElement ? snippetElement.textContent.trim() : ''
          });
        }
      });
      
      return results;
    }, { resultSel: resultSelector, titleSel: titleSelector, linkSel: linkSelector, snippetSel: snippetSelector });
  }
}

export default BrowserManager;
