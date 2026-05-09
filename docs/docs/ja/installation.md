# インストールガイド

このガイドでは、WebMCPをシステムにセットアップする方法を説明します。

## 前提条件

- **Node.js**（バージョン18以上）
- **npm** または **yarn** パッケージマネージャー

## インストール手順

### 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd webmcp
```

### 2. 依存関係のインストール

```bash
npm install
```

必要な依存関係:
- `cloakbrowser` ^0.3.27 - アンチ検出機能を備えたブラウザ自動化
- `playwright-core` ^1.59.1 - ブラウザ制御のためのコアPlaywrightライブラリ

### 3. インストールの確認

```bash
node tests/test-deep-search.js
```

## システム要件

- **OS**: Linux（推奨）、macOS、Windows
- **メモリ**: 最小2GB RAM、推奨4GB RAM以上
- **ストレージ**: 約500MB

## 設定オプション

```javascript
import SearchMCPServer from './src/SearchMCPServer.js';

const server = new SearchMCPServer({
  locale: 'ja-JP',
  timezoneId: 'Asia/Tokyo',
  geolocation: { latitude: 35.6895, longitude: 139.6917 }
});
```

| オプション | 型 | デフォルト | 説明 |
|--------|------|---------|-------------|
| `locale` | 文字列 | `'ja-JP'` | 言語/ロケールコード |
| `timezoneId` | 文字列 | `'Asia/Tokyo'` | タイムゾーン識別子 |
| `geolocation` | オブジェクト | 東京座標 | 地理座標 |
| `parserNum` | 数値 | `3` | 並列パーサー数 |

## トラブルシューティング

### ブラウザ起動失敗
- 権限を確認
- `npm clean-install` で再インストール

### ネットワーク問題
- インターネット接続を確認
- ファイアウォール設定を確認

### メモリエラー
- `parserNum` を減らす（1-2）
- `maxResultsPerEngine` を減らす

## 次のステップ

- [使用方法](usage.md) - MCPサーバーの使用方法
- [開発ガイド](development.md) - アーキテクチャと貢献