# 使用方法

WebMCPをコマンドラインツールおよびMCPサーバーとして使用する方法を説明します。

## CLIクイックスタート

WebMCPは、コードを書かずにすばやく検索できる便利なコマンドラインインターフェースを提供します。

### インストール

```bash
npm install -g webmcp
```

またはnpxで直接使用:

```bash
npx webmcp <command>
```

### CLIコマンド

#### 1. serve - MCPサーバー起動

MCPクライアントと統合するためのstdioモードでMCPサーバーを起動:

```bash
npx webmcp serve
```

これはMCPクライアント設定ファイルでWebMCPを設定する際に使用します。

#### 2. search - クイック検索

指定した検索エンジンでキーワードを検索:

```bash
# 基本検索（デフォルトはGoogle）
npx webmcp search "人工知能"

# 検索エンジンを指定
npx webmcp search "機械学習" google

# 言語オプション付き
npx webmcp search "AI研究" google --language ja-JP
```

**オプション:**
- `keyword`（必須）: 検索語
- `engine`（オプション）: 検索エンジン（google, bing, duckduckgo, yahoojapan）。デフォルト: google
- `--language <locale>`（オプション）: 言語/ロケールオーバーライド（例: en-US, ja-JP, zh-CN）

#### 3. deep-search - ディープコンテンツ検索

検索結果のページを解析して完全なコンテンツを抽出するディープ検索を実行:

```bash
# 基本ディープ検索
npx webmcp deep-search "気候変動"

# 複数のエンジンとオプション付き
npx webmcp deep-search "再生可能エネルギー" \
  --engines google,bing \
  --max-results 5 \
  --parsers 3

# 言語設定付き
npx webmcp deep-search "技術トレンド" \
  --language ja-JP \
  --engines google \
  --max-results 3
```

**オプション:**
- `keyword`（必須）: 検索語
- `--engines <list>`（オプション）: カンマ区切りのエンジンリスト。デフォルト: google
- `--max-results <n>`（オプション）: エンジンあたりの最大結果数。デフォルト: 3
- `--parsers <n>`（オプション）: 並列パーサー数。デフォルト: 3
- `--language <locale>`（オプション）: 言語/ロケールオーバーライド

#### 4. engines - 利用可能なエンジン一覧

サポートされているすべての検索エンジンを表示:

```bash
npx webmcp engines
```

**出力:**
```
Available search engines:
  - google
  - bing
  - duckduckgo
  - yahoojapan
```

### CLI例

```bash
# ヘルプ表示
npx webmcp

# 英語で検索
npx webmcp search "web development" google --language en-US

# 複数のエンジンでディープ検索
npx webmcp deep-search "ブロックチェーン技術" \
  --engines google,bing,duckduckgo \
  --max-results 4 \
  --parsers 2

# 日本語検索
npx webmcp search "人工知能" google --language ja-JP
```

---

## MCPサーバー設定

### npxを使用（推奨）

WebMCPをMCPサーバーとして使用する最も簡単な方法はnpxを使うことです。MCP設定ファイルに追加:

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["-y", "webmcp", "serve"]
    }
  }
}
```

**注意:** `-y`フラグはプロンプトを自動的に承認し、`serve`はstdioモードでサーバーを起動します。

### ローカルインストールを使用

WebMCPをローカルにインストールしている場合、直接参照できます:

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "node",
      "args": ["/absolute/path/to/webmcp/bin/webmcp.js", "serve"]
    }
  }
}
```

### フルパス設定

本番環境では、npxへのフルパスを使用することをお勧めします:

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "/usr/local/bin/npx",
      "args": ["-y", "webmcp", "serve"]
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

### 6. parse_url

ウェブページのURLを解析し、LLM処理に最適化されたクリーンなテキストコンテンツを抽出します。このツールはページを取得し、不要な要素（スクリプト、スタイル、ナビゲーションなど）を削除して、メインコンテンツを抽出します。

**パラメーター:**
- `url`（必須）: 解析するページのURL
- `maxContentLength`（オプション）: 抽出されるコンテンツの最大長（デフォルト: 50000）
- `parseTimeout`（オプション）: 解析のタイムアウト（ミリ秒単位、デフォルト: 60000）

**戻り値:**
- `title`: ページタイトル
- `content`: クリーンなテキストコンテンツ
- `url`: 解析されたURL
- `statusCode`: HTTPステータスコード

**機能:**
- 画像、メディア、フォントなどの不要なリソースを自動的にブロックして高速読み込み
- インテリジェントセレクターを使用してメインコンテンツエリアを抽出
- 連続する重複行を削除し、空行をフィルタリング
- 失敗したリクエストに対するリトライロジックをサポート
- コンテンツがmaxContentLengthを超えた場合は切り捨て

**例:**
```javascript
await server.handleToolCall('parse_url', { 
  url: 'https://example.com/article',
  maxContentLength: 30000,
  parseTimeout: 45000
});
```

**ユースケース:**
- 要約用の記事コンテンツを抽出
- RAGアプリケーション用にウェブページからクリーンなテキストを取得
- ドキュメントやブログ投稿を解析
- コンテンツ分析と処理

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