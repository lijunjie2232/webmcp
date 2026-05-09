# 開発ガイド

WebMCPを理解、拡張、または貢献したい開発者向けの情報です。

## プロジェクト構造

```
webmcp/
├── src/
│   ├── engine/                 # 検索エンジン実装
│   │   ├── SearchEngineBase.js # 基底クラス
│   │   ├── GoogleSearch.js     # Google実装
│   │   ├── BingSearch.js       # Bing実装
│   │   ├── DuckDuckGoSearch.js # DuckDuckGo実装
│   │   └── YahooJapanSearch.js # Yahoo Japan実装
│   ├── tool/                   # 高度なツール
│   │   ├── DeepSearch.js       # ディープサーチ
│   │   └── PageParser.js       # ページパーサー
│   ├── BrowserManager.js       # ブラウザ管理
│   ├── SearchManager.js        # 検索管理
│   └── SearchMCPServer.js      # MCPサーバー
├── tests/                      # テストファイル
└── docs/                       # ドキュメント
```

## アーキテクチャ概要

### コアコンポーネント

1. **BrowserManager**: `cloakbrowser` でブラウザを管理
2. **検索エンジン**: 各エンジンは `SearchEngineBase` を拡張
3. **SearchManager**: 複数の検索エンジンを調整
4. **DeepSearch**: 自動ページ解析付きの高度な検索
5. **PageParser**: 個々のウェブページを解析
6. **SearchMCPServer**: MCPプロトコルで機能を公開

## 検索エンジンの追加

### ステップ1: エンジンクラスの作成

```javascript
// src/engine/MySearchEngine.js
import SearchEngineBase from './SearchEngineBase.js';

class MySearchEngine extends SearchEngineBase {
  async search(keyword, options = {}) {
    return {
      keyword,
      engine: 'myengine',
      results: [],
      timestamp: new Date().toISOString()
    };
  }
}

export default MySearchEngine;
```

### ステップ2: SearchManagerに登録

```javascript
import MySearchEngine from './engine/MySearchEngine.js';

this.searchEngines = {
  google: new GoogleSearch(options),
  myengine: new MySearchEngine(options)
};
```

## テスト

```bash
node tests/test-deep-search.js
node tests/test-language-change.js
```

## 貢献

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更を行う
4. 新しい機能のテストを追加
5. プルリクエストを送信

## APIリファレンス

### SearchMCPServer

**コンストラクター:**
```javascript
new SearchMCPServer(options)
```

**オプション:**
- `locale`: 文字列 - 言語/ロケールコード
- `timezoneId`: 文字列 - タイムゾーン識別子
- `geolocation`: オブジェクト - 地理座標
- `parserNum`: 数値 - 並列パーサー数

**メソッド:**
- `handleToolCall(toolName, args)`: ツールを実行
- `getTools()`: 利用可能なツールを取得
- `cleanup()`: リソースをクリーンアップ