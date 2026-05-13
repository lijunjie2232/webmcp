import SearchMCPServer from '../src/SearchMCPServer.js';

async function testParseZexyMarriagePage() {
  const server = new SearchMCPServer();
  const TEST_URL = 'https://zexy.net/mar/manual/registration/marriage.html';
  
  console.log('=== Testing Parse URL for Zexy Marriage Page ===\n');
  console.log(`URL: ${TEST_URL}\n`);
  
  // Test 1: Basic parse with default options
  console.log('--- Test 1: Basic Parse ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL
    });
    
    console.log('✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('Status Code:', result.statusCode);
    console.log('Content Length:', result.content.length, 'characters');
    console.log('\nFirst 500 characters:');
    console.log(result.content.substring(0, 500));
    console.log('\n...');
    console.log('\nLast 300 characters:');
    console.log(result.content.substring(Math.max(0, result.content.length - 300)));
    
    // Verify content relevance
    const hasMarriageKeywords = result.content.includes('婚姻届') || 
                               result.content.includes('結婚') ||
                               result.content.includes('marriage');
    console.log('\n✓ Contains marriage-related content:', hasMarriageKeywords);
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: Parse with custom maxContentLength
  console.log('--- Test 2: Limited Content Length (10000 chars) ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL,
      maxContentLength: 10000
    });
    
    console.log('✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length, 'characters');
    console.log('Has truncation notice:', result.content.includes('[Content truncated due to length]'));
    console.log('\nContent preview:');
    console.log(result.content.substring(0, 500) + '...');
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Parse with custom timeout
  console.log('--- Test 3: Custom Timeout (45 seconds) ---');
  try {
    const result = await server.handleToolCall('parse_url', { 
      url: TEST_URL,
      parseTimeout: 45000
    });
    
    console.log('✓ SUCCESS!');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length, 'characters');
    
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }
  
  // Cleanup
  console.log('\n--- Cleaning up ---');
  await server.cleanup();
  console.log('✓ All tests completed successfully!');
}

testParseZexyMarriagePage().catch(console.error);
