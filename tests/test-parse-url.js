import SearchMCPServer from '../src/SearchMCPServer.js';

async function testParseUrl() {
  const server = new SearchMCPServer();
  
  console.log('=== Testing Parse URL Functionality ===\n');
  console.log('Available tools:', server.getTools().map(t => t.name));
  
  // Test 1: Parse the specified URL
  console.log('\n--- Test 1: Parse zexy.net marriage page ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: 'https://zexy.net/mar/manual/registration/marriage.html'
    });
    
    console.log('Title:', result.title);
    console.log('URL:', result.url);
    console.log('Status Code:', result.statusCode);
    console.log('Content Length:', result.content.length, 'characters');
    console.log('\nFirst 500 characters of content:');
    console.log(result.content.substring(0, 500));
    console.log('\n...');
    console.log('\nLast 500 characters of content:');
    console.log(result.content.substring(Math.max(0, result.content.length - 500)));
  } catch (error) {
    console.error('Parse URL failed:', error.message);
  }
  
  // Test 2: Parse with custom options
  console.log('\n--- Test 2: Parse with custom maxContentLength ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: 'https://zexy.net/mar/manual/registration/marriage.html',
      maxContentLength: 10000,
      parseTimeout: 30000
    });
    
    console.log('Title:', result.title);
    console.log('Content Length (limited):', result.content.length, 'characters');
    console.log('Content preview:', result.content.substring(0, 300) + '...');
  } catch (error) {
    console.error('Parse URL with custom options failed:', error.message);
  }
  
  // Cleanup
  console.log('\n--- Cleaning up ---');
  await server.cleanup();
  console.log('Test completed successfully!');
}

testParseUrl().catch(console.error);
