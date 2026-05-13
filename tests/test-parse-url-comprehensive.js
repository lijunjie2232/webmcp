import SearchMCPServer from '../src/SearchMCPServer.js';

async function testParseUrlComprehensive() {
  const server = new SearchMCPServer();
  const TEST_URL = 'https://zexy.net/mar/manual/registration/marriage.html';
//   const TEST_URL = 'https://playwright.dev/docs/api/class-page';
  
  console.log('=== Comprehensive Parse URL Testing ===\n');
  
  // Test 1: Basic parse of zexy.net marriage page
  console.log('--- Test 1: Basic Parse ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL,
    });
    
    console.log('✓ Title:', result.title);
    console.log('✓ Status Code:', result.statusCode);
    console.log('✓ Content Length:', result.content.length, 'characters');
    console.log('✓ First 200 chars:', result.content.substring(0, 200) + '...');
    console.log('');
  } catch (error) {
    console.error('✗ Basic parse failed:', error.message);
  }
  
  // Test 2: Parse with custom timeout and content length
  console.log('--- Test 2: Custom Options ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL,
      maxContentLength: 5000,
      parseTimeout: 45000
    });
    
    console.log('✓ Title:', result.title);
    console.log('✓ Content Length (limited to 5000):', result.content.length, 'characters');
    console.log('✓ Has content truncation notice:', result.content.includes('[Content truncated due to length]'));
    console.log('');
  } catch (error) {
    console.error('✗ Custom options parse failed:', error.message);
  }
  
  // Test 3: Error handling - invalid URL
  console.log('--- Test 3: Invalid URL Handling ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL
    });
    console.log('✗ Should have failed but got result:', result);
  } catch (error) {
    console.log('✓ Correctly handled invalid URL:', error.message);
  }
  console.log('');
  
  // Test 4: Multiple sequential parses
  console.log('--- Test 4: Sequential Parsing ---');
  const urls = [
    TEST_URL
  ];
  
  for (const url of urls) {
    try {
      console.log(`Parsing: ${url}`);
      const result = await server.handleToolCall('parse_url', { url });
      console.log(`✓ Success: ${result.title} (${result.content.length} chars)`);
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }
  }
  console.log('');
  
  // Cleanup
  console.log('--- Cleaning up ---');
  await server.cleanup();
  console.log('✓ All tests completed!');
}

testParseUrlComprehensive().catch(console.error);
