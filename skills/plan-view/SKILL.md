---
name: plan-view
description: >
  PlanModeのプラン内容をHTML化して document/PLAN.html に出力しブラウザで表示するスキル。ExitPlanModeを呼び出す直前に自動実行される。
  /plan-view と呼び出されたとき、またはPlanModeでプランを確定するときに使う。
---

# plan-view スキル

PlanModeで作成したプランをHTMLファイルに変換し、ブラウザで即確認できるようにするスキル。

## トリガー

- **ExitPlanMode呼び出し直前（自動）** — `development.md` ルールに従い、ExitPlanMode前に必ず実行する
- `/plan-view` — 明示的に呼び出す場合
- 「プランをHTMLで」「プランをブラウザで見たい」

## 手順

### ステップ1: 出力先ディレクトリの準備

`document/` ディレクトリが存在しない場合は作成する。

```bash
mkdir -p document   # Mac/Linux
# Windows: New-Item -ItemType Directory -Path document -Force
```

### ステップ2: ファイル名の決定

```
document/PLAN.html
```

常に同じパスに上書き保存する（最新プランが常に `document/PLAN.html` で参照できる）。

### ステップ3: HTMLの生成

プラン内容をdoc-htmlと同一のスタイルでHTMLに変換する。

**HTMLテンプレート：**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>実装プラン — {プロジェクト名}</title>
  <style>
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
    .plan-badge {
      display: inline-block;
      background: #4a90d9;
      color: white;
      padding: 0.2rem 0.7rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
      letter-spacing: 0.05em;
      margin-right: 0.6rem;
      vertical-align: middle;
    }
    h1 { font-size: 1.8rem; color: #1a1a2e; display: inline; vertical-align: middle; }
    h2 {
      font-size: 1.4rem; color: #2c3e50; margin: 2rem 0 0.75rem;
      border-left: 4px solid #4a90d9; padding-left: 0.75rem;
    }
    h3 { font-size: 1.1rem; color: #34495e; margin: 1.5rem 0 0.5rem; }
    h4 { font-size: 1rem; color: #4a5568; margin: 1rem 0 0.4rem; }
    .meta { color: #6c757d; font-size: 0.9rem; margin-top: 0.75rem; }
    .toc {
      background: #f8f9fa; border: 1px solid #e1e4e8; border-radius: 6px;
      padding: 1rem 1.5rem; margin-bottom: 2rem;
    }
    .toc-title { font-size: 1rem; font-weight: bold; color: #6c757d; margin-bottom: 0.5rem; }
    .toc ul { list-style: none; }
    .toc li { margin: 0.2rem 0; }
    .toc a { color: #4a90d9; text-decoration: none; font-size: 0.9rem; }
    .toc a:hover { text-decoration: underline; }
    .toc .toc-h3 { padding-left: 1.2rem; font-size: 0.85rem; }
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
    ul, ol { padding-left: 1.5rem; margin: 0.5rem 0; }
    li { margin: 0.25rem 0; }
    strong { color: #2c3e50; }
    blockquote {
      border-left: 4px solid #4a90d9; margin: 1rem 0;
      padding: 0.5rem 1rem; background: #f0f5ff; color: #4a5568;
    }
    hr { border: none; border-top: 1px solid #e1e4e8; margin: 2rem 0; }
    .step-item {
      border: 1px solid #e1e4e8; border-radius: 6px;
      padding: 1rem 1.2rem; margin: 0.6rem 0;
      border-left: 4px solid #4a90d9;
    }
    .step-item:hover { background: #f8f9fa; }
    .checkbox { color: #4a90d9; margin-right: 0.4rem; }
    .checked { color: #28a745; }
    .warning {
      background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px;
      padding: 0.8rem 1rem; margin: 1rem 0; color: #856404;
    }
    .info {
      background: #e8f4f8; border: 1px solid #4a90d9; border-radius: 6px;
      padding: 0.8rem 1rem; margin: 1rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div><span class="plan-badge">PLAN</span><h1>{プランタイトルまたは "実装プラン"}</h1></div>
      <div class="meta">
        プロジェクト: {カレントディレクトリ名} &nbsp;|&nbsp;
        作成: {YYYY-MM-DD HH:mm}
      </div>
    </header>
    <nav class="toc">
      <div class="toc-title">目次</div>
      <ul><!-- h2/h3からToC自動生成 --></ul>
    </nav>
    <main>
      {プラン本文をMarkdown→HTML変換}
    </main>
  </div>
</body>
</html>
```

**Markdown → HTML変換ルール（doc-htmlと共通）：**

| Markdown要素 | HTML変換 |
|---|---|
| `# タイトル` | `<h1>` + `<title>` タグ |
| `## セクション` | `<h2 id="s-N">` + ToC追加 |
| `### サブセクション` | `<h3 id="s-N-M">` + ToC追加（インデント） |
| `#### 小見出し` | `<h4>` |
| ` ```言語 ... ``` ` | `<pre><code>` |
| `\| ... \|` テーブル | `<table>` |
| `**太字**` | `<strong>` |
| `` `インライン` `` | `<code>` |
| `- [ ] タスク` | `<div class="step-item"><span class="checkbox">☐</span>` |
| `- [x] タスク` | `<div class="step-item"><span class="checkbox checked">✓</span>` |
| `- リスト` | `<ul><li>` |
| `1. リスト` | `<ol><li>` |
| `---` | `<hr>` |
| `> 引用` | `<blockquote>` |
| `> ⚠️` / `> **警告**` | `<div class="warning">` |
| `> ℹ️` / `> **注**` | `<div class="info">` |

**ToC自動生成：**
- h2/h3に `id` 付与（`s-1`, `s-1-1` 形式）
- h2が1つ以下の場合はToC省略

**Markdownのパース方法：**
Markdownパーサーライブラリ不使用。Claude自身が行ごとに解析してHTML文字列に変換し、Writeツールでファイル書き出し。

### ステップ4: ファイル出力 & ブラウザ表示

```bash
# ファイル出力後にブラウザで開く

# Windows
start document/PLAN.html

# Mac
open document/PLAN.html

# Linux
xdg-open document/PLAN.html
```

### ステップ5: ExitPlanModeへ続行

HTML出力・ブラウザ表示が完了したら、ExitPlanModeを呼び出してプランモードを終了する。

### ステップ6: 完了報告

```
プラン HTML 出力完了:
  document/PLAN.html

ブラウザで開きました。
```

## 使用例

```
/plan-view                  # 直前のプラン内容をHTML化（手動呼び出し）
# PlanMode内では自動実行される
```

## 注意

- `document/PLAN.html` は常に上書き（最新プランが参照できる）
- `document/` はgit管理対象のため `.gitignore` に追加しないこと
