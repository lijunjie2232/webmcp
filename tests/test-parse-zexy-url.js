import SearchMCPServer from '../src/SearchMCPServer.js';

async function testParseZexyUrl() {
  const server = new SearchMCPServer();
  
  console.log('=== Testing Parse URL for zexy.net ===\n');
  
  // Test parsing the specific URL with proper timeout settings
  console.log('--- Parsing: https://zexy.net/mar/manual/registration/marriage.html ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: 'https://zexy.net/mar/manual/registration/marriage.html',
      maxContentLength: 50000,
      parseTimeout: 60000  // Explicitly set timeout to avoid undefined issue
    });
    
    console.log('✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('URL:', result.url);
    console.log('Status Code:', result.statusCode);
    console.log('Content Length:', result.content.length, 'characters');
    console.log('\n--- Content Preview (first 1000 chars) ---');
    console.log(result.content.substring(0, 1000));
    console.log('\n--- Content Preview (last 500 chars) ---');
    console.log(result.content.substring(Math.max(0, result.content.length - 500)));
    
    // Verify the content is relevant to marriage registration
    const hasMarriageKeywords = result.content.includes('婚姻届') || 
                               result.content.includes('marriage') ||
                               result.content.includes('結婚');
    console.log('\n✓ Contains marriage-related content:', hasMarriageKeywords);
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Cleanup
  console.log('\n--- Cleaning up ---');
  await server.cleanup();
  console.log('✓ Test completed!');
}

testParseZexyUrl().catch(console.error);
