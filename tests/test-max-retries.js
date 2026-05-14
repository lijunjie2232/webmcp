import SearchMCPServer from '../src/SearchMCPServer.js';

async function testMaxRetries() {
  console.log('=== Testing maxRetries Parameter ===\n');
  
  const server = new SearchMCPServer();
  
  // Test 1: maxRetries = 0 (should only try once, no retry)
  console.log('--- Test 1: maxRetries = 0 (expect 1 attempt, no retry) ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: 'https://zexy.net/mar/manual/registration/marriage.html',
      waitUntil: 'domcontentloaded',
      navigationTimeout: 5000,  // Very short timeout to force failure
      headless: true,
      maxRetries: 0
    });
    console.log('✓ Success (unexpected)');
  } catch (error) {
    console.log('✗ Failed as expected:', error.message);
  }
  console.log('');
  
  // Cleanup first parser
  if (server.pageParser) {
    await server.pageParser.destroy();
    server.pageParser = null;
  }
  
  // Test 2: maxRetries = 1 (should try twice: 1 original + 1 retry)
  console.log('--- Test 2: maxRetries = 1 (expect 2 attempts: 1 original + 1 retry) ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: 'https://zexy.net/mar/manual/registration/marriage.html',
      waitUntil: 'domcontentloaded',
      navigationTimeout: 5000,  // Very short timeout to force failure
      headless: true,
      maxRetries: 1
    });
    console.log('✓ Success (unexpected)');
  } catch (error) {
    console.log('✗ Failed as expected:', error.message);
  }
  console.log('');
  
  await server.cleanup();
  console.log('✓ Test completed!');
}

testMaxRetries().catch(console.error);
