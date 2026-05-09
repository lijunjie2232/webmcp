import SearchMCPServer from '../src/SearchMCPServer.js';

async function testLanguageChange() {
  console.log('=== Testing Language Change Functionality ===\n');
  
  const server = new SearchMCPServer();
  
  // Test 1: Check initial language (should be ja-JP)
  console.log('Test 1: Initial language state');
  console.log('Current language:', server.currentLanguage);
  console.log('Expected: ja-JP');
  console.log('Pass:', server.currentLanguage === 'ja-JP' ? '✓' : '✗');
  console.log();
  
  // Test 2: Set language to en-US
  console.log('Test 2: Change language to en-US');
  try {
    const result = await server.handleToolCall('set_language', { language: 'en-US' });
    console.log('Result:', result);
    console.log('Current language:', server.currentLanguage);
    console.log('Pass:', server.currentLanguage === 'en-US' && result.success ? '✓' : '✗');
  } catch (error) {
    console.error('Failed:', error.message);
  }
  console.log();
  
  // Test 3: Set language to zh-CN
  console.log('Test 3: Change language to zh-CN');
  try {
    const result = await server.handleToolCall('set_language', { language: 'zh-CN' });
    console.log('Result:', result);
    console.log('Current language:', server.currentLanguage);
    console.log('Pass:', server.currentLanguage === 'zh-CN' && result.success ? '✓' : '✗');
  } catch (error) {
    console.error('Failed:', error.message);
  }
  console.log();
  
  // Test 4: Verify available tools include set_language
  console.log('Test 4: Check available tools');
  const tools = server.getTools();
  const toolNames = tools.map(t => t.name);
  console.log('Available tools:', toolNames);
  console.log('Has set_language tool:', toolNames.includes('set_language') ? '✓' : '✗');
  console.log();
  
  // Test 5: Verify search tools have language parameter
  console.log('Test 5: Check if search tools support language parameter');
  const searchTool = tools.find(t => t.name === 'search');
  const hasLanguageParam = searchTool && searchTool.inputSchema.properties.language;
  console.log('Search tool has language parameter:', hasLanguageParam ? '✓' : '✗');
  console.log();
  
  // Cleanup
  await server.cleanup();
  
  console.log('=== All Tests Completed ===');
}

testLanguageChange().catch(console.error);
