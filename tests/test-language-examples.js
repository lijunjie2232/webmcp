import SearchMCPServer from '../src/SearchMCPServer.js';

async function demonstrateLanguageFeature() {
  console.log('=== Language Change Feature Demonstration ===\n');
  
  const server = new SearchMCPServer();
  
  console.log('1. Initial state - Default language is ja-JP (Japanese)');
  console.log('   Current language:', server.currentLanguage);
  console.log();
  
  // Example 1: Using set_language tool
  console.log('2. Change language using set_language tool:');
  console.log('   Command: set_language({ language: "en-US" })');
  const setResult = await server.handleToolCall('set_language', { language: 'en-US' });
  console.log('   Result:', setResult);
  console.log('   Current language:', server.currentLanguage);
  console.log();
  
  // Example 2: Using language parameter in search
  console.log('3. Use language parameter directly in search (temporary override):');
  console.log('   This will temporarily change language to zh-CN for this search only');
  console.log('   Note: Actual search not executed in demo mode');
  console.log('   Command: search({ keyword: "AI", engine: "google", language: "zh-CN" })');
  console.log();
  
  // Example 3: Multiple languages demonstration
  console.log('4. Switching between different languages:');
  
  const languages = [
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' }
  ];
  
  for (const lang of languages) {
    await server.handleToolCall('set_language', { language: lang.code });
    console.log(`   ✓ Changed to ${lang.name} (${lang.code})`);
  }
  console.log();
  
  // Example 4: Show available tools
  console.log('5. Available MCP Tools:');
  const tools = server.getTools();
  tools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
    if (tool.inputSchema.properties.language) {
      console.log('     Supports optional "language" parameter');
    }
  });
  console.log();
  
  console.log('6. Usage Examples:');
  console.log('   ');
  console.log('   // Set language globally');
  console.log('   await server.handleToolCall("set_language", { language: "en-US" });');
  console.log('   ');
  console.log('   // Search with current language');
  console.log('   await server.handleToolCall("search", { keyword: "AI", engine: "google" });');
  console.log('   ');
  console.log('   // Override language for specific search');
  console.log('   await server.handleToolCall("search", { ');
  console.log('     keyword: "technology",');
  console.log('     engine: "bing",');
  console.log('     language: "ja-JP"');
  console.log('   });');
  console.log('   ');
  console.log('   // Deep search with custom language');
  console.log('   await server.handleToolCall("deep_search", {');
  console.log('     keyword: "machine learning",');
  console.log('     engines: ["google", "bing"],');
  console.log('     language: "zh-CN"');
  console.log('   });');
  console.log();
  
  // Cleanup
  await server.cleanup();
  
  console.log('=== Demonstration Complete ===');
}

demonstrateLanguageFeature().catch(console.error);
