import SearchMCPServer from '../src/SearchMCPServer.js';

async function testResourceBlocking() {
  const server = new SearchMCPServer();
  const TEST_URL = 'https://zexy.net/mar/manual/registration/marriage.html'; // Faster loading page
  
  console.log('=== Testing Resource Blocking ===\n');
  console.log(`URL: ${TEST_URL}\n`);
  
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL,
      navigationTimeout: 15000,
      headless: false  // Set to false to see the browser window
    });
    
    console.log('✓ Parse completed successfully!');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length, 'characters');
    console.log('Status Code:', result.statusCode);
    
    // Verify content was extracted
    if (result.content.length > 0) {
      console.log('\n✓ Content extraction successful');
      console.log('\nFirst 500 characters:');
      console.log(result.content.substring(0, 500));
    } else {
      console.log('\n✗ WARNING: No content extracted');
    }
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }
  
  await server.cleanup();
  console.log('\n✓ Test completed!');
}

testResourceBlocking().catch(console.error);
