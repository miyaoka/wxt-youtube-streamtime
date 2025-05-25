# YouTube StreamTime 実装仕様

## 概要

YouTube StreamTime 拡張機能は、YouTube のライブ配信とそのアーカイブ動画において、プレイヤーの時間表示部分（`.ytp-time-wrapper`）を書き換えることで、実際の配信時刻を表示します。

この拡張機能では以下の変更を行います：

- **ライブ配信**: 配信開始時刻を固定表示し、YouTube 側の時間表示と視覚的に連結
- **アーカイブ配信**: 再生位置に対応する実際の配信時刻を動的表示

## ライブ配信での実装詳細

### DOM 構造の変化

```html
<!-- Before（ライブ配信デフォルト） -->
<span class="ytp-time-wrapper">
  <div class="ytp-time-contents">
    <span class="ytp-time-clip-icon">...</span>
    <!-- 非表示 -->
    <span class="ytp-time-current">2:16:29</span>
    <!-- 非表示 -->
    <span class="ytp-time-separator"> / </span>
    <!-- 非表示 -->
    <span class="ytp-time-duration">3:16:28</span>
  </div>
</span>

<!-- After（拡張機能による変更） -->
<span class="ytp-time-wrapper">
  <!-- ライブ用：配信開始時刻 -->
  <span>12:00:39 + </span>
  <div class="ytp-time-contents">
    <span class="ytp-time-clip-icon">...</span>
    <!-- 拡張機能により表示 -->
    <span class="ytp-time-current">2:41:47</span>
    <!-- 非表示のまま -->
    <span class="ytp-time-separator"> / </span>
    <!-- 非表示のまま -->
    <span class="ytp-time-duration">3:41:34</span>
  </div>
  <!-- アーカイブ用：空要素 -->
  <span></span>
</span>
```

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

- 配信開始時刻 `<span>12:00:39 + </span>` を `.ytp-time-contents` の直前に追加（ライブ用）
- 末尾に空の `<span></span>` を追加（アーカイブ用要素、動画遷移時の DOM 再利用のため）
- CSS 上書きにより `.ytp-time-current` のみを表示

### 実装の仕組み

拡張機能は以下の方法でライブ配信の時刻表示を実現します：

1. **microformat からの配信開始時刻取得**: YouTube の `#microformat` 要素から `publication.startDate` を取得・解析
2. **配信開始時刻を追加**: `.ytp-time-contents`の**直前**に固定の配信開始時刻を挿入
3. **CSS で部分表示**: `.ytp-time-current`のみを表示し、区切り文字と総時間は非表示のまま
4. **視覚的連結**: 拡張機能の固定要素と YouTube 側の動的要素が連続して表示

## アーカイブ配信での実装詳細

### DOM 構造の変化

```html
<!-- Before（アーカイブ配信デフォルト） -->
<span class="ytp-time-wrapper">
  <div class="ytp-time-contents">
    <span class="ytp-time-clip-icon">...</span>
    <span class="ytp-time-current">16:56</span>
    <span class="ytp-time-separator"> / </span>
    <span class="ytp-time-duration">1:06:10</span>
  </div>
</span>

<!-- After（拡張機能による変更） -->
<span class="ytp-time-wrapper">
  <!-- ライブ用：空要素 -->
  <span></span>
  <div class="ytp-time-contents">
    <span class="ytp-time-clip-icon">...</span>
    <span class="ytp-time-current">16:56</span>
    <span class="ytp-time-separator"> / </span>
    <span class="ytp-time-duration">1:06:10</span>
  </div>
  <!-- アーカイブ用：実配信時刻 -->
  <span> ( 2025/05/24(土) 17:35:39 )</span>
</span>
```

### 表示形式

```
[現在位置] / [総時間] ( [実配信時刻] )
```

### 具体例

- **変更前**: `16:56 / 1:06:10`
- **変更後**: `16:56 / 1:06:10 ( 2025/05/24(土) 17:35:39 )`

**主な変化**:

- 先頭に空の `<span></span>` を追加（ライブ用要素、動画遷移時の DOM 再利用のため）
- 実配信時刻 `<span> ( 2025/05/24(土) 17:35:39 )</span>` を `.ytp-time-wrapper` の末尾に追加（アーカイブ用）
- 元の時間表示はそのまま保持

### 実装の仕組み

アーカイブ動画では、MutationObserver を使用して再生時間の変更を監視し、実配信時刻を計算・表示します：

1. **microformat からの配信開始時刻取得**: YouTube の `#microformat` 要素から `publication.startDate` を取得・解析
2. **YouTube が`.ytp-time-current`要素を更新**
3. **MutationObserver が変更を検知**
4. **拡張機能が配信開始時刻 + 再生時間で実配信時刻を計算**
5. **実配信時刻の表示を更新**

## DOM 要素の再利用について

拡張機能では、YouTube の動画遷移時に DOM 要素が再利用されることを考慮して、ライブ用とアーカイブ用の両方の要素を常に配置します：

- **ライブ配信時**: ライブ用要素に内容を設定、アーカイブ用要素は空
- **アーカイブ配信時**: アーカイブ用要素に内容を設定、ライブ用要素は空
- **動画遷移時**: DOM 全体は破棄されず、要素の内容のみが更新される
