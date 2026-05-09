import SearchMCPServer from '../src/SearchMCPServer.js';

async function comprehensiveLanguageTest() {
  console.log('=== Comprehensive Language Feature Test ===\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  const server = new SearchMCPServer();
  
  // Test 1: Default language is ja-JP
  console.log('Test 1: Verify default language is ja-JP');
  if (server.currentLanguage === 'ja-JP') {
    console.log('✓ PASS: Default language is ja-JP\n');
    testsPassed++;
  } else {
    console.log(`✗ FAIL: Expected ja-JP, got ${server.currentLanguage}\n`);
    testsFailed++;
  }
  
  // Test 2: set_language tool exists
  console.log('Test 2: Verify set_language tool exists');
  const tools = server.getTools();
  const setLanguageTool = tools.find(t => t.name === 'set_language');
  if (setLanguageTool) {
    console.log('✓ PASS: set_language tool exists');
    console.log('  Description:', setLanguageTool.description);
    console.log('  Required params:', setLanguageTool.inputSchema.required);
    console.log();
    testsPassed++;
  } else {
    console.log('✗ FAIL: set_language tool not found\n');
    testsFailed++;
  }
  
  // Test 3: All search tools have language parameter
  console.log('Test 3: Verify all search tools support language parameter');
  const searchTools = ['search', 'search_multiple', 'deep_search'];
  let allHaveLanguage = true;
  
  for (const toolName of searchTools) {
    const tool = tools.find(t => t.name === toolName);
    const hasLanguage = tool && tool.inputSchema.properties.language;
    if (hasLanguage) {
      console.log(`  ✓ ${toolName} has language parameter`);
    } else {
      console.log(`  ✗ ${toolName} missing language parameter`);
      allHaveLanguage = false;
    }
  }
  
  if (allHaveLanguage) {
    console.log('✓ PASS: All search tools support language parameter\n');
    testsPassed++;
  } else {
    console.log('✗ FAIL: Some search tools missing language parameter\n');
    testsFailed++;
  }
  
  // Test 4: Change language to en-US
  console.log('Test 4: Change language to en-US');
  try {
    const result = await server.handleToolCall('set_language', { language: 'en-US' });
    if (result.success && server.currentLanguage === 'en-US') {
      console.log('✓ PASS: Language changed to en-US');
      console.log('  Result:', result);
      console.log();
      testsPassed++;
    } else {
      console.log('✗ FAIL: Language change failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('✗ FAIL: Error changing language:', error.message, '\n');
    testsFailed++;
  }
  
  // Test 5: Change language to multiple locales
  console.log('Test 5: Test multiple language changes');
  const testLanguages = ['zh-CN', 'ko-KR', 'fr-FR', 'de-DE', 'ja-JP'];
  let allChangesSuccessful = true;
  
  for (const lang of testLanguages) {
    try {
      await server.handleToolCall('set_language', { language: lang });
      if (server.currentLanguage === lang) {
        console.log(`  ✓ Successfully changed to ${lang}`);
      } else {
        console.log(`  ✗ Failed to change to ${lang} (current: ${server.currentLanguage})`);
        allChangesSuccessful = false;
      }
    } catch (error) {
      console.log(`  ✗ Error changing to ${lang}:`, error.message);
      allChangesSuccessful = false;
    }
  }
  
  if (allChangesSuccessful) {
    console.log('✓ PASS: All language changes successful\n');
    testsPassed++;
  } else {
    console.log('✗ FAIL: Some language changes failed\n');
    testsFailed++;
  }
  
  // Test 6: Verify browser manager locale is updated
  console.log('Test 6: Verify browser manager locale updates');
  await server.handleToolCall('set_language', { language: 'en-US' });
  
  let browserManagersUpdated = true;
  
  // Check searchManager engines
  for (const [engineName, engine] of Object.entries(server.searchManager.searchEngines)) {
    if (engine.browserManager && engine.browserManager.locale !== 'en-US') {
      console.log(`  ✗ ${engineName} browser manager locale: ${engine.browserManager.locale}`);
      browserManagersUpdated = false;
    }
  }
  
  // Check deepSearch browser manager
  if (server.deepSearch.browserManager && server.deepSearch.browserManager.locale !== 'en-US') {
    console.log(`  ✗ deepSearch browser manager locale: ${server.deepSearch.browserManager.locale}`);
    browserManagersUpdated = false;
  }
  
  if (browserManagersUpdated) {
    console.log('✓ PASS: All browser managers updated to en-US\n');
    testsPassed++;
  } else {
    console.log('✗ FAIL: Some browser managers not updated\n');
    testsFailed++;
  }
  
  // Test 7: Verify deepSearch engines are cleared on language change
  console.log('Test 7: Verify deepSearch engines cache is cleared on language change');
  // First, trigger engine creation by accessing an engine
  server.deepSearch.getEngine('google');
  const hasCachedEngine = Object.keys(server.deepSearch.engines).length > 0;
  console.log(`  Engines before language change: ${Object.keys(server.deepSearch.engines).length}`);
  
  // Change language
  await server.handleToolCall('set_language', { language: 'ja-JP' });
  const hasClearedCache = Object.keys(server.deepSearch.engines).length === 0;
  console.log(`  Engines after language change: ${Object.keys(server.deepSearch.engines).length}`);
  
  if (hasCachedEngine && hasClearedCache) {
    console.log('✓ PASS: Engine cache properly cleared on language change\n');
    testsPassed++;
  } else {
    console.log('✗ FAIL: Engine cache not properly managed\n');
    testsFailed++;
  }
  
  // Test 8: Verify language parameter in tool schemas
  console.log('Test 8: Verify language parameter schema details');
  const searchTool = tools.find(t => t.name === 'search');
  const langSchema = searchTool.inputSchema.properties.language;
  
  if (langSchema && langSchema.type === 'string' && langSchema.description) {
    console.log('✓ PASS: Language parameter has proper schema');
    console.log('  Type:', langSchema.type);
    console.log('  Description:', langSchema.description);
    console.log('  Required:', searchTool.inputSchema.required.includes('language') ? 'Yes' : 'No (optional)');
    console.log();
    testsPassed++;
  } else {
    console.log('✗ FAIL: Language parameter schema incomplete\n');
    testsFailed++;
  }
  
  // Summary
  console.log('=== Test Summary ===');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log();
  
  // Cleanup
  await server.cleanup();
  
  if (testsFailed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }
  
  return testsFailed === 0;
}

comprehensiveLanguageTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
