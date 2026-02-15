# StreamTime for YouTube 実装仕様

## 概要

StreamTime for YouTube 拡張機能は、YouTube のライブ配信とそのアーカイブ動画において、プレイヤーの時間表示部分（`.ytp-time-wrapper`）を書き換えることで、実際の配信時刻を表示します。

この拡張機能では以下の変更を行います：

- **ライブ配信**: 配信開始時刻を固定表示し、YouTube 側の時間表示と視覚的に連結
- **アーカイブ配信**: 再生位置に対応する実際の配信時刻を動的表示

## YouTube プレーヤーの時間表示 DOM 構造

```
div.ytp-time-display（ライブ時に .ytp-live が付与）
  ├── div.ytp-time-wrapper
  │     ├── div.ytp-time-contents（ライブ時に display:none）
  │     │     ├── span.ytp-time-clip-icon（クリップ時のみ表示）
  │     │     ├── span.ytp-time-current (0:12)
  │     │     ├── span.ytp-time-separator (/)
  │     │     └── span.ytp-time-duration (3:45)
  │     └── button.ytp-live-badge
  ├── span.ytp-clip-watch-full-video-button-separator
  └── span.ytp-clip-watch-full-video-button
```

詳細な HTML は `docs/sample` を参照。

### YouTube 側のスタイル

- **アーカイブ時**: `.ytp-time-contents` は `display: block`
- **ライブ時**: `.ytp-time-contents` は `display: none`

### 拡張機能によるスタイル上書き

ライブ時に `.ytp-time-contents` を表示させ、不要な要素を非表示にします：

- `.ytp-time-wrapper` を `display: flex` にして `.ytp-live-badge` との間隔を調整
- `.ytp-time-contents` を `display: block` で強制表示
- `.ytp-time-separator` と `.ytp-time-duration` を非表示（ライブ中は duration が確定していないため）

## ライブ配信での実装詳細

### 表示形式

```
[拡張機能が追加（固定）] + [YouTube側（自動更新）]
          ↓                       ↓
       12:00:39 +              2:41:47
```

### 具体例

- **変更前**: 時間表示なし（YouTube ライブ配信デフォルト）
- **変更後**: `12:00:39 + 2:41:47`（追加要素 + 部分表示）

**主な変化**:

- 拡張機能で `.ytp-time-contents` を `display: block` に上書きして表示
- 配信開始時刻 `<span>12:00:39 + </span>` を `.ytp-time-current` の直前に追加（ライブ用）
- 末尾に空の `<span></span>` を追加（アーカイブ用要素、動画遷移時の DOM 再利用のため）
- `.ytp-time-separator` と `.ytp-time-duration` は拡張機能で非表示

### 実装の仕組み

拡張機能は以下の方法でライブ配信の時刻表示を実現します：

- **microformat からの配信開始時刻取得**: YouTube の `#microformat` 要素から `publication.startDate` を取得・解析
- **配信開始時刻を追加**: `.ytp-time-current` の**直前**に固定の配信開始時刻を挿入
- **CSS で部分表示**: `.ytp-time-contents` を表示し、区切り文字と総時間は非表示
- **視覚的連結**: 拡張機能の固定要素と YouTube 側の動的要素が連続して表示

## アーカイブ配信での実装詳細

### 表示形式

```
[現在位置] / [総時間] ( [実配信時刻] )
```

### 具体例

- **変更前**: `16:56 / 1:06:10`
- **変更後**: `16:56 / 1:06:10 ( 2025/05/24(土) 17:35:39 )`

**主な変化**:

- `.ytp-time-current` の直前に空の `<span></span>` を追加（ライブ用要素、動画遷移時の DOM 再利用のため）
- 実配信時刻 `<span> ( 2025/05/24(土) 17:35:39 )</span>` を `.ytp-time-contents` の末尾に追加（アーカイブ用）
- 元の時間表示はそのまま保持

### 実装の仕組み

アーカイブ動画では、MutationObserver を使用して再生時間の変更を監視し、実配信時刻を計算・表示します：

- **microformat からの配信開始時刻取得**: YouTube の `#microformat` 要素から `publication.startDate` を取得・解析
- **YouTube が`.ytp-time-current`要素を更新**
- **MutationObserver が変更を検知**
- **拡張機能が配信開始時刻 + 再生時間で実配信時刻を計算**
- **実配信時刻の表示を更新**

## DOM 要素の再利用について

拡張機能では、YouTube の動画遷移時に DOM 要素が再利用されることを考慮して、ライブ用とアーカイブ用の両方の要素を常に配置します：

- **ライブ配信時**: ライブ用要素に内容を設定、アーカイブ用要素は空
- **アーカイブ配信時**: アーカイブ用要素に内容を設定、ライブ用要素は空
- **動画遷移時**: DOM 全体は破棄されず、要素の内容のみが更新される
