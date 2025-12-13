# YouTube StreamTime Extension

YouTube ライブ配信の実際の放送時刻を表示するブラウザ拡張機能

## 技術スタック

- **フレームワーク**: WXT（Web Extension Tools）
- **言語**: TypeScript
- **ランタイム管理**: mise（bun を管理）
- **パッケージマネージャー**: bun
- **Linter/Formatter**: Biome
- **テスト**: bun test（happy-dom でブラウザ環境をエミュレート）

## ディレクトリ構成

```
src/
├── entrypoints/
│   └── content/         # コンテンツスクリプト（YouTube ページに注入）
│       ├── index.ts     # エントリーポイント
│       ├── main.ts      # メインロジック
│       ├── parser.ts    # メタデータパーサー
│       ├── display.ts   # 表示ロジック
│       ├── formatters.ts # 時刻フォーマット
│       ├── observers.ts # DOM 監視
│       └── dom.ts       # DOM 操作
└── utils/               # 共通ユーティリティ
```

## 開発コマンド

```bash
mise install            # bun ランタイムをインストール
bun install             # 依存関係をインストール
bun run dev             # Chrome 向け開発（ホットリロード）
bun run dev:firefox     # Firefox 向け開発
bun run build           # Chrome 向けビルド
bun run build:firefox
bun run check           # Biome チェック
bun run check:fix       # Biome 自動修正
bun run test            # テスト実行
```

## コーディング規約

### WXT 固有

- auto-imports は無効化されているため、全てのインポートを明示的に記述する
- content script は `defineContentScript` で定義する
- manifest 設定は `wxt.config.ts` で管理

### 命名規則

- ファイル名: kebab-case
- 関数: camelCase
- 型/インターフェース: PascalCase
- 定数: UPPER_SNAKE_CASE（設定値やマジックナンバーの置き換え時）

### テスト

- テストファイルは対象ファイルと同じディレクトリに配置
- 命名: `*.test.ts`
- happy-dom が preload されているため、DOM API が使用可能

## 対象ブラウザ

- Chrome（Manifest V3）
- Firefox（Manifest V2）

## ドキュメント

- [実装仕様・YouTube DOM 構造](docs/index.md)
