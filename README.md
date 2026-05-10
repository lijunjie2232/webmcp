# WebMCP - 検索MCPサーバー

[English Documentation](README_en.md)

WebMCPは、複数の検索エンジンを利用して高度な検索機能を提供するMCP（Model Context Protocol）サーバーです。Google、Bing、DuckDuckGo、Yahoo Japanなどの検索エンジンに対応しており、ディープサーチ機能も備えています。

## 特徴

- **複数検索エンジン対応**: Google、Bing、DuckDuckGo、Yahoo Japan
- **ディープサーチ機能**: 検索結果のページを解析して完全なコンテンツを抽出
- **ページ解析ツール**: URLからクリーンなテキストを抽出
- **言語設定サポート**: 任意の言語/ロケールに設定可能
- **並列処理**: 複数のページを並列で解析
- **リソース最適化**: 不要なリソースをブロックして高速化

## クイックスタート

### CLIで使用（推奨）

```bash
# npxで直接使用
npx webmcp search "キーワード"

# またはグローバルにインストール
npm install -g webmcp
webmcp deep-search "人工知能" --engines google,bing
```

### ソースから使用

```bash
git clone <repository-url>
cd webmcp
npm install
```

## ドキュメント

詳細なドキュメントは [docs](docs/) ディレクトリをご覧ください。mkdocs-materialで構築された多言語ドキュメントサイトがあります。

オンラインドキュメント: https://lijunjie2232.github.io/webmcp/

## 謝辞

本プロジェクトは、人間確認を通過するためのChromiumブラウザモッドを提供してくださった [CloakBrowser](https://github.com/CloakHQ/CloakBrowser) に感謝いたします。

## ライセンス

GNU GENERAL PUBLIC LICENSE v3.0 - 詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 作者

lijunjie2232