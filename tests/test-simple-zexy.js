import SearchMCPServer from '../src/SearchMCPServer.js';

async function simpleTest() {
  const server = new SearchMCPServer();
  const TEST_URL = 'https://zexy.net/mar/manual/registration/marriage.html';
  
  console.log('Testing:', TEST_URL);
  
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL,
      navigationTimeout: 15000  // Shorter timeout
    });
    
    console.log('\n✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length, 'characters');
    console.log('Status Code:', result.statusCode);
    console.log('\nContent preview (first 300 chars):');
    console.log(result.content.substring(0, 300));
    
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
  }
  
  await server.cleanup();
}

simpleTest().catch(console.error);
