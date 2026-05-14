import SearchMCPServer from '../src/SearchMCPServer.js';

async function testCommitWaitStrategy() {
  const server = new SearchMCPServer();
  
  const testUrls = [
    'https://zexy.net/mar/manual/registration/marriage.html',
    'https://www.google.com/search?q=playwright',
    'https://www.bing.com/search?q=playwright',
    'https://www.bing.com/ck/a?!&&p=faa29f70d72c0783649016d81b1d3e43a20891a9e47be696f60f0c231c3ce0c6JmltdHM9MTc3ODU0NDAwMA&ptn=3&ver=2&hsh=4&fclid=141b7de3-a66f-65d5-0aa4-6aaca743649a&u=a1aHR0cHM6Ly93d3cudmFtcC5qcC9hcmNoaXZlcy8yNTU5'
  ];

  console.log('=== Testing waitUntil "commit" Strategy ===\n');
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`--- Test ${i + 1}: ${url.substring(0, 60)}... ---`);
    
    const startTime = Date.now();
    try {
      // Use parse_url with waitUntil set to 'commit'
      const result = await server.handleToolCall('parse_url', { 
        url: url,
        waitUntil: 'domcontentloaded',
        navigationTimeout: 5000,
        headless: true,
        maxRetries: 0  // Disable retries to see immediate results
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('✓ SUCCESS!');
      console.log('Time spent:', duration, 'ms');
      console.log('Final URL:', result.url || 'N/A');
      console.log('Title:', result.title);
      console.log('Status Code:', result.statusCode);
      console.log('Content Length:', result.content.length, 'characters');
      console.log('First 200 characters of content:');
      console.log(result.content.substring(0, 200));
      console.log('---');
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error('✗ FAILED:', error.message);
      console.log('Time spent before failure:', duration, 'ms');
      // For debugging, let's also try with domcontentloaded strategy
      console.log('\nTrying again with domcontentloaded strategy...');
      const retryStartTime = Date.now();
      try {
        const result = await server.handleToolCall('parse_url', { 
          url: url,
          waitUntil: 'domcontentloaded',
          navigationTimeout: 5000,
          maxRetries: 0
        });
        
        const retryEndTime = Date.now();
        const retryDuration = retryEndTime - retryStartTime;
        
        console.log('✓ SUCCESS with domcontentloaded!');
        console.log('Retry time spent:', retryDuration, 'ms');
        console.log('Final URL:', result.url || 'N/A');
        console.log('Title:', result.title);
        console.log('Status Code:', result.statusCode);
        console.log('Content Length:', result.content.length, 'characters');
        console.log('First 200 characters of content:');
        console.log(result.content.substring(0, 200));
      } catch (fallbackError) {
        const retryEndTime = Date.now();
        const retryDuration = retryEndTime - retryStartTime;
        
        console.error('✗ ALSO FAILED with domcontentloaded:', fallbackError.message);
        console.log('Retry time spent before failure:', retryDuration, 'ms');
      }
      console.log('---');
    }
    
    console.log('\n');
  }
  
  // Cleanup
  console.log('--- Cleaning up ---');
  await server.cleanup();
  console.log('✓ Test completed!');
}

testCommitWaitStrategy().catch(console.error);
