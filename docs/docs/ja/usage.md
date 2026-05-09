# 使用方法

WebMCPをMCPサーバーとして使用する方法を説明します。

## MCPサーバー設定

```json
{
  "mcpServers": {
    "search": {
      "command": "node",
      "args": ["/path/to/webmcp/src/SearchMCPServer.js"]
    }
  }
}
```

## 利用可能なツール

### 1. search

指定した検索エンジンでキーワードを検索。

**パラメーター:**
- `keyword`（必須）: 検索キーワード
- `engine`（オプション）: エンジン名（デフォルト: 'google'）

**サポートされているエンジン:**
- `google`, `bing`, `duckduckgo`, `yahoojapan`

**例:**
```javascript
await server.handleToolCall('search', { 
  keyword: '人工知能',
  engine: 'google' 
});
```

### 2. search_multiple

複数の検索エンジンで同時に検索。

**例:**
```javascript
await server.handleToolCall('search_multiple', { 
  keyword: '機械学習',
  engines: ['google', 'bing']
});
```

### 3. deep_search

検索結果ページを解析して完全なコンテンツを抽出。

**パラメーター:**
- `keyword`（必須）: 検索キーワード
- `engines`（オプション）: エンジン配列
- `maxResultsPerEngine`（オプション）: エンジンあたりの最大結果数
- `parserNum`（オプション）: 並列パーサー数

**例:**
```javascript
await server.handleToolCall('deep_search', { 
  keyword: '気候変動',
  engines: ['google', 'bing'],
  maxResultsPerEngine: 5,
  parserNum: 3
});
```

### 4. get_available_engines

利用可能な検索エンジンの一覧を取得。

### 5. set_language

検索結果の言語を設定。

**一般的な言語コード:**
- `en-US`, `ja-JP`, `zh-CN`, `ko-KR`

## LangChain統合

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/webmcp/src/SearchMCPServer.js']
});

const client = new Client({ name: 'search-client', version: '1.0.0' });
await client.connect(transport);

const result = await client.callTool({
  name: 'search',
  arguments: { keyword: 'LangChain', engine: 'google' }
});

await client.close();
```

## ベストプラクティス

### リソース管理

```javascript
try {
  // 検索操作
} finally {
  await server.cleanup();
}
```

### 並列処理の最適化

- ローエンド: 1-2パーサー
- ミッドレンジ: 3-4パーサー
- ハイエンド: 5+パーサー