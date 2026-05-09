import DeepSearch from '../src/tool/DeepSearch.js';

async function testDeepSearch() {
    console.log('=== Testing Deep Search Functionality ===\n');

    // Create DeepSearch instance with default settings
    const deepSearch = new DeepSearch({
        locale: 'en-US',
        timezoneId: 'America/New_York'
    });

    try {
        // Test 1: Basic search with Google (default)
        console.log('\n--- Test 1: Basic Google Search ---');
        const results1 = await deepSearch.deepSearch('窃盗罪　定義', {
            engines: ['bing'],
            maxResultsPerEngine: 5,
            parserNum: 5
        });

        console.log(`Found ${results1.length} documents`);
        if (results1.length > 0) {
            for (let i = 0; i < results1.length; i++) {
                console.log('result:', {
                    title: results1[i].title?.substring(0, 50) + '...',
                    url: results1[i].url,
                    contentLength: results1[i].content?.length || 0,
                    engine: results1[i].engine
                });
                console.log('Result content:', results1[i].content?.substring(0, 200) + '...');
            }
        }

        // Test 2: Multi-engine search
        console.log('\n--- Test 2: Multi-Engine Search (Google + Bing) ---');
        const results2 = await deepSearch.deepSearch('Node.js tutorial', {
            engines: ['google', 'bing'],
            maxResultsPerEngine: 2,
            parserNum: 2
        });

        console.log(`Found ${results2.length} documents`);
        results2.forEach((doc, idx) => {
            console.log(`Result ${idx + 1}:`, {
                title: doc.title?.substring(0, 40) + '...',
                engine: doc.engine,
                hasContent: !!doc.content && doc.content.length > 0
            });
        });

        // Test 3: Search with DuckDuckGo
        console.log('\n--- Test 3: DuckDuckGo Search ---');
        const results3 = await deepSearch.deepSearch('web development basics', {
            engines: ['duckduckgo'],
            maxResultsPerEngine: 2,
            parserNum: 1
        });

        console.log(`Found ${results3.length} documents`);
        if (results3.length > 0) {
            console.log('Sample result:', {
                title: results3[0].title?.substring(0, 50) + '...',
                url: results3[0].url,
                engine: results3[0].engine
            });
        }

        // Test 4: Search with Yahoo Japan
        console.log('\n--- Test 4: Yahoo Japan Search ---');
        const results4 = await deepSearch.deepSearch('プログラミング', {
            engines: ['yahoojapan'],
            maxResultsPerEngine: 2,
            parserNum: 1
        });

        console.log(`Found ${results4.length} documents`);
        if (results4.length > 0) {
            console.log('Sample result:', {
                title: results4[0].title?.substring(0, 50) + '...',
                url: results4[0].url,
                engine: results4[0].engine
            });
        }

        // Test 5: All engines combined
        console.log('\n--- Test 5: All Engines Combined ---');
        const results5 = await deepSearch.deepSearch('artificial intelligence', {
            engines: ['google', 'bing', 'duckduckgo', 'yahoojapan'],
            maxResultsPerEngine: 1,
            parserNum: 3
        });

        console.log(`Found ${results5.length} documents from all engines`);
        const engineCount = {};
        results5.forEach(doc => {
            engineCount[doc.engine] = (engineCount[doc.engine] || 0) + 1;
        });
        console.log('Results by engine:', engineCount);

        console.log('\n=== All Tests Completed Successfully ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    } finally {
        // Cleanup resources
        console.log('\nCleaning up...');
        await deepSearch.cleanup();
        console.log('Cleanup completed');
    }
}

// Run the test
testDeepSearch().catch(console.error);
