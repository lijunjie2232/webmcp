#!/usr/bin/env node

import SearchMCPServer from '../src/SearchMCPServer.js';
import { createInterface } from 'readline';

// MCP Protocol implementation over stdio
async function startMCPServer(server) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  // Send capabilities on startup
  const capabilities = {
    tools: server.getTools()
  };

  // MCP uses JSON-RPC 2.0 over stdio
  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);
      
      // Handle MCP initialize request
      if (request.method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'webmcp',
              version: '1.0.0'
            }
          }
        };
        console.log(JSON.stringify(response));
        return;
      }

      // Handle notifications (no response needed)
      if (request.method === 'notifications/initialized') {
        return;
      }

      // Handle tool listing
      if (request.method === 'tools/list') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: server.getTools()
          }
        };
        console.log(JSON.stringify(response));
        return;
      }

      // Handle tool calls
      if (request.method === 'tools/call') {
        const { name, arguments: toolArgs } = request.params;
        
        try {
          const result = await server.handleToolCall(name, toolArgs || {});
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          };
          console.log(JSON.stringify(response));
        } catch (error) {
          const errorResponse = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: error.message
            }
          };
          console.log(JSON.stringify(errorResponse));
        }
        return;
      }

      // Unknown method
      const errorResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
      console.log(JSON.stringify(errorResponse));
    } catch (error) {
      // Invalid JSON or other errors
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      };
      console.log(JSON.stringify(errorResponse));
    }
  });

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    await server.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.cleanup();
    process.exit(0);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const server = new SearchMCPServer();
  
  // Don't show header in serve mode
  if (command !== 'serve') {
    console.log('WebMCP - Search MCP Server');
    console.log('Available tools:', server.getTools().map(t => t.name).join(', '));
    console.log('');
  }
  
  if (!command) {
    console.log('Usage:');
    console.log('  npx webmcp serve                           Start MCP server (stdio mode)');
    console.log('  npx webmcp search <keyword> [engine] [--language <locale>]');
    console.log('  npx webmcp deep-search <keyword> [options]');
    console.log('  npx webmcp engines');
    console.log('');
    console.log('Options:');
    console.log('  --language <locale>  Set language/locale (e.g., en-US, ja-JP, zh-CN)');
    console.log('  --engines <list>     Comma-separated list of engines (deep-search only)');
    console.log('  --max-results <n>    Max results per engine (deep-search only)');
    console.log('  --parsers <n>        Number of parallel parsers (deep-search only)');
    console.log('');
    console.log('Examples:');
    console.log('  npx webmcp serve');
    console.log('  npx webmcp search "artificial intelligence" google');
    console.log('  npx webmcp search "AI" google --language en-US');
    console.log('  npx webmcp deep-search "climate change" --engines google,bing --max-results 3');
    console.log('  npx webmcp deep-search "technology" --language ja-JP --engines google --max-results 2');
    console.log('  npx webmcp engines');
    await server.cleanup();
    return;
  }
  
  try {
    switch (command) {
      case 'serve':
        // Start MCP server in stdio mode
        await startMCPServer(server);
        return; // Don't cleanup here, server handles it
      
      case 'search':
        const keyword = args[1];
        const engine = args[2] || 'google';
        
        if (!keyword) {
          console.error('Error: Keyword is required for search command');
          console.log('Usage: npx webmcp search <keyword> [engine] [--language <locale>]');
          await server.cleanup();
          process.exit(1);
        }
        
        // Parse optional language argument
        const searchLanguage = args.includes('--language')
          ? args[args.indexOf('--language') + 1]
          : null;
        
        console.log(`Searching ${engine} for "${keyword}"...`);
        if (searchLanguage) {
          console.log(`Language: ${searchLanguage}`);
        }
        
        const results = await server.handleToolCall('search', { 
          keyword, 
          engine,
          language: searchLanguage
        });
        console.log('\nResults:');
        console.log(JSON.stringify(results, null, 2));
        break;
      
      case 'deep-search':
        const dsKeyword = args[1];
        
        if (!dsKeyword) {
          console.error('Error: Keyword is required for deep-search command');
          console.log('Usage: npx webmcp deep-search <keyword> [options]');
          await server.cleanup();
          process.exit(1);
        }
        
        // Parse options
        const engines = args.includes('--engines') 
          ? args[args.indexOf('--engines') + 1].split(',')
          : ['google'];
        const maxResults = args.includes('--max-results')
          ? parseInt(args[args.indexOf('--max-results') + 1])
          : 3;
        const parserNum = args.includes('--parsers')
          ? parseInt(args[args.indexOf('--parsers') + 1])
          : 3;
        const dsLanguage = args.includes('--language')
          ? args[args.indexOf('--language') + 1]
          : null;
        
        console.log(`Performing deep search for "${dsKeyword}"...`);
        console.log(`Engines: ${engines.join(', ')}, Max Results: ${maxResults}, Parsers: ${parserNum}`);
        if (dsLanguage) {
          console.log(`Language: ${dsLanguage}`);
        }
        
        const dsResults = await server.handleToolCall('deep_search', {
          keyword: dsKeyword,
          engines,
          maxResultsPerEngine: maxResults,
          parserNum,
          language: dsLanguage
        });
        
        console.log(`\nFound ${dsResults.length} documents:`);
        dsResults.forEach((doc, index) => {
          console.log(`\n${index + 1}. ${doc.title}`);
          console.log(`   URL: ${doc.url}`);
          console.log(`   Engine: ${doc.engine}`);
          console.log(`   Abstract: ${doc.abstract?.substring(0, 150)}...`);
        });
        break;
      
      case 'engines':
        const enginesList = await server.handleToolCall('get_available_engines', {});
        console.log('Available search engines:');
        enginesList.engines.forEach(engine => {
          console.log(`  - ${engine}`);
        });
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: search, deep-search, engines');
        await server.cleanup();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    await server.cleanup();
    process.exit(1);
  }
  
  await server.cleanup();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
