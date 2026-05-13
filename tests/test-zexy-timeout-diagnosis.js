import SearchMCPServer from '../src/SearchMCPServer.js';

async function testZexyTimeout() {
  const server = new SearchMCPServer();
  const TEST_URL = 'https://zexy.net/mar/manual/registration/marriage.html';
  
  console.log('=== Testing Zexy.net Timeout Issue ===\n');
  console.log(`URL: ${TEST_URL}`);
  console.log('Note: curl loads this in <1 second, but Playwright may timeout\n');
  
  // Test with default settings (should use 'commit' strategy now)
  console.log('--- Test 1: Default Settings (commit strategy) ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL
    });
    
    console.log('✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length, 'characters');
    console.log('Status Code:', result.statusCode);
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test with domcontentloaded strategy
  console.log('--- Test 2: domcontentloaded Strategy ---');
  try {
    // Need to directly use PageParser for custom waitUntil
    const BrowserManager = (await import('../src/BrowserManager.js')).default;
    const PageParser = (await import('../src/tool/PageParser.js')).default;
    
    const browserManager = new BrowserManager({
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo'
    });
    await browserManager.initialize();
    
    const parser = new PageParser(browserManager, 'test-parser');
    await parser.initialize();
    
    const result = await parser.parse(TEST_URL, {
      waitUntil: 'domcontentloaded',
      navigationTimeout: 30000
    });
    
    console.log('✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length, 'characters');
    
    await parser.destroy();
    await browserManager.close();
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test with load strategy (waits for all resources)
  console.log('--- Test 3: load Strategy (slowest) ---');
  try {
    const BrowserManager = (await import('../src/BrowserManager.js')).default;
    const PageParser = (await import('../src/tool/PageParser.js')).default;
    
    const browserManager = new BrowserManager({
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo'
    });
    await browserManager.initialize();
    
    const parser = new PageParser(browserManager, 'test-parser-2');
    await parser.initialize();
    
    const result = await parser.parse(TEST_URL, {
      waitUntil: 'load',
      navigationTimeout: 30000
    });
    
    console.log('✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length, 'characters');
    
    await parser.destroy();
    await browserManager.close();
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }
  
  // Cleanup
  console.log('\n--- Cleaning up ---');
  await server.cleanup();
  console.log('✓ Test completed!');
}

testZexyTimeout().catch(console.error);
