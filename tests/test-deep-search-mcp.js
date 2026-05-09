import SearchMCPServer from '../src/SearchMCPServer.js';

async function testDeepSearch() {
  const server = new SearchMCPServer();
  
  console.log('=== Testing Deep Search MCP Integration ===\n');
  console.log('Available tools:', server.getTools().map(t => t.name));
  
  // Test 1: Get available engines
  console.log('\n--- Test 1: Get Available Engines ---');
  try {
    const engines = await server.handleToolCall('get_available_engines', {});
    console.log('Available engines:', engines.engines);
  } catch (error) {
    console.error('Failed to get engines:', error.message);
  }
  
  // Test 2: Deep search with default settings
  console.log('\n--- Test 2: Deep Search with Default Settings ---');
  try {
    const results = await server.handleToolCall('deep_search', { 
      keyword: 'artificial intelligence'
    });
    console.log(`Found ${results.length} documents`);
    if (results.length > 0) {
      console.log('\nFirst document:');
      console.log('Title:', results[0].title);
      console.log('URL:', results[0].url);
      console.log('Abstract:', results[0].abstract?.substring(0, 150) + '...');
      console.log('Content length:', results[0].content?.length || 0, 'characters');
      console.log('Engine:', results[0].engine);
    }
  } catch (error) {
    console.error('Deep search failed:', error.message);
  }
  
  // Test 3: Deep search with multiple engines
  console.log('\n--- Test 3: Deep Search with Multiple Engines ---');
  try {
    const results = await server.handleToolCall('deep_search', { 
      keyword: 'climate change',
      engines: ['google', 'bing'],
      maxResultsPerEngine: 3,
      parserNum: 2
    });
    console.log(`Found ${results.length} documents from multiple engines`);
    
    // Group by engine
    const byEngine = {};
    results.forEach(doc => {
      if (!byEngine[doc.engine]) {
        byEngine[doc.engine] = [];
      }
      byEngine[doc.engine].push(doc);
    });
    
    Object.keys(byEngine).forEach(engine => {
      console.log(`${engine}: ${byEngine[engine].length} documents`);
    });
  } catch (error) {
    console.error('Multi-engine deep search failed:', error.message);
  }
  
  // Cleanup
  console.log('\n--- Cleaning up ---');
  await server.cleanup();
  console.log('Test completed successfully!');
}

testDeepSearch().catch(console.error);
