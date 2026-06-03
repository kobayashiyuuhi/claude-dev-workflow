---
name: doc-html
description: >
  ドキュメントをHTML出力するスキル。要件定義書・機能仕様書・画面設計書・DB設計書・クラス図・シーケンス図・ER図などのMarkdownファイルをスタイル付きHTMLに変換してブラウザで確認できる形で出力する。
  /doc-html と呼び出されたとき、または「HTMLで出力」「HTML化」「ドキュメントをHTML」と言われたときに使う。
---

# doc-html スキル

MarkdownドキュメントをスタイルつきHTMLファイルに変換して出力するスキル。

## トリガー

- `/doc-html` — 引数なしで `document/` 配下の全ドキュメントを一覧表示し、対象を選択
- `/doc-html <path>` — 指定ファイルまたはディレクトリを変換
- 「HTMLで出力」「HTML化して」「ブラウザで確認できるようにして」

## 手順

### ステップ1: 対象ファイルの確定

引数なしの場合、以下のディレクトリを走査して変換対象を確認する：

```
document/
  requirements.md        → 要件定義書
  spec.md                → 機能仕様書
  overview.md            → システム概要
  tech-stack.md          → 技術スタック
  implementation-notes.md → 実装メモ
  feature/*.md           → 機能仕様
  diagrams/class-diagram.md    → クラス図
  diagrams/er-diagram.md       → ER図
  diagrams/architecture.md     → アーキテクチャ図
  diagrams/sequence-template.md → シーケンス図
```

ユーザーに確認：「以下のファイルをHTMLに変換します。よろしいですか？」

引数に特定ファイルまたはディレクトリが指定された場合はそれのみ対象とする。

### ステップ2: HTMLの生成

各Markdownファイルを読み込み、対応する `.html` ファイルを同じディレクトリに出力する。

**HTMLテンプレート構造：**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{ドキュメントタイトル}</title>
  <!-- SRI hash: jsDelivr で確認 → https://www.jsdelivr.com/package/npm/mermaid?version=10.9.1 -->
  <!-- または: curl -s <URL> | openssl dgst -sha384 -binary | openssl base64 -A で生成 -->
  <script
    src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"
    integrity="sha384-{スキル実行時にjsDelivrのSRI欄から取得してここに記載}"
    crossorigin="anonymous"
  ></script>
  <style>
    /* 埋め込みCSS — 外部依存なし（CDNのmermaid除く） */
    /* 下記スタイルガイドに従う */
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>{タイトル}</h1>
      <div class="meta">{メタ情報: 作成日・バージョンなど}</div>
    </header>
    <nav class="toc"><!-- h2/h3から自動生成 --></nav>
    <main>{本文}</main>
  </div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
    // ToC自動生成スクリプト
  </script>
</body>
</html>
```

**CSSスタイルガイド（埋め込み）：**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: #1a1a2e;
  background: #f8f9fa;
}
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  border-radius: 8px;
}
header {
  border-bottom: 3px solid #4a90d9;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}
h1 { font-size: 2rem; color: #1a1a2e; }
h2 { font-size: 1.4rem; color: #2c3e50; margin: 2rem 0 0.75rem;
     border-left: 4px solid #4a90d9; padding-left: 0.75rem; }
h3 { font-size: 1.1rem; color: #34495e; margin: 1.5rem 0 0.5rem; }
table {
  width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem;
}
th { background: #4a90d9; color: #fff; padding: 0.6rem 0.8rem; text-align: left; }
td { padding: 0.5rem 0.8rem; border: 1px solid #dde1e7; }
tr:nth-child(even) td { background: #f5f7fa; }
code {
  background: #f1f3f5; padding: 0.15em 0.4em; border-radius: 3px;
  font-family: 'Fira Code', Consolas, monospace; font-size: 0.88em;
}
pre {
  background: #1e1e2e; color: #cdd6f4; padding: 1rem; border-radius: 6px;
  overflow-x: auto; margin: 1rem 0;
}
pre code { background: none; color: inherit; padding: 0; font-size: 0.9rem; }
.mermaid {
  background: #fafbfc; border: 1px solid #e1e4e8; border-radius: 6px;
  padding: 1rem; margin: 1rem 0; text-align: center;
}
.toc {
  background: #f8f9fa; border: 1px solid #e1e4e8; border-radius: 6px;
  padding: 1rem 1.5rem; margin-bottom: 2rem;
}
.toc h2 { font-size: 1rem; border: none; padding: 0; margin: 0 0 0.5rem; color: #6c757d; }
.toc ul { list-style: none; }
.toc li { margin: 0.2rem 0; }
.toc a { color: #4a90d9; text-decoration: none; font-size: 0.9rem; }
.toc a:hover { text-decoration: underline; }
ul, ol { padding-left: 1.5rem; margin: 0.5rem 0; }
li { margin: 0.25rem 0; }
strong { color: #2c3e50; }
blockquote {
  border-left: 4px solid #4a90d9; margin: 1rem 0;
  padding: 0.5rem 1rem; background: #f0f5ff; color: #4a5568;
}
hr { border: none; border-top: 1px solid #e1e4e8; margin: 2rem 0; }
.meta { color: #6c757d; font-size: 0.9rem; margin-top: 0.5rem; }
```

**Markdown → HTML変換ルール：**

| Markdown要素 | HTML変換 |
|---|---|
| `# タイトル` | `<h1>` + `<title>` タグ |
| `## セクション` | `<h2 id="section-N">` + ToC追加 |
| `### サブセクション` | `<h3 id="sub-N">` |
| `\`\`\`mermaid ... \`\`\`` | `<div class="mermaid">...</div>` |
| `\`\`\`言語 ... \`\`\`` | `<pre><code class="language-言語">` |
| `\| ... \|` テーブル | `<table>` + `<thead>/<tbody>` |
| `**太字**` | `<strong>` |
| `` `インラインコード` `` | `<code>` |
| `- リスト` | `<ul><li>` |
| `1. リスト` | `<ol><li>` |
| `---` | `<hr>` |
| `> 引用` | `<blockquote>` |

**ToC（目次）自動生成：**
- h2/h3要素に `id` 付与（例: `id="s1"`, `id="s1-1"`）
- `<nav class="toc">` に階層リストとして出力
- h2が1つ以下の場合はToCを省略

**mermaid処理：**
- ` ```mermaid ` ブロックを `<div class="mermaid">` に変換
- Mermaid.js CDN（`https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js`）でレンダリング
- スクリプトタグには必ず `integrity` + `crossorigin="anonymous"` を付与する（SRI）
  - SRI hash取得: `https://www.jsdelivr.com/package/npm/mermaid?version=10.9.1` の「SRI」列を参照
  - または `curl -s <URL> | openssl dgst -sha384 -binary | openssl base64 -A` で生成
- クラス図・ER図・シーケンス図・フローチャートすべて対応

**Markdownのパース方法（Claude自身で実装）：**
Markdownパーサーライブラリには依存せず、Claude自身がMarkdownテキストを解析してHTML文字列に変換する。
ファイルを読み込み → 行ごとに解析 → HTML文字列を組み立て → Write toolで .html ファイルに書き出す。

### ステップ3: ファイル出力

- 出力先: 元ファイルと同じディレクトリ（`requirements.md` → `requirements.html`）
- 既存の `.html` ファイルが存在する場合、上書き確認をしてから実行

### ステップ4: 完了報告

```
変換完了:
  document/requirements.html
  document/spec.html
  document/diagrams/class-diagram.html
  ...

ブラウザで開く: start document/requirements.html  (Windows)
               open document/requirements.html   (Mac)
```

## 使用例

```
/doc-html                          # document/ 配下を全変換
/doc-html document/requirements.md # 要件定義書のみ変換
/doc-html document/diagrams/       # 図表ディレクトリのみ変換
```

## 注意

- CDN接続（mermaid.js）が必要。オフライン環境ではMermaid図が描画されない
- **CDNスクリプトには必ずSRI（`integrity` + `crossorigin`）を付与する** — CDN改ざん攻撃への対策。バージョンを上げる際はhashを再取得する
- 日本語文字コードはUTF-8で出力する
- `.html` ファイルはgitignoreに追加しない（設計書として管理対象）
