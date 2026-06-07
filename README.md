# claude-dev-workflow

Claude Code 向け開発ワークフロープラグイン。新規プロジェクトのセットアップを `/dev-setup` 一発で完結させる。

---

## 提供スキル

| スキル | 説明 |
|--------|------|
| `/dev-setup` | プロジェクト初期セットアップ（フォルダ構成・ドキュメント・git・GitHub・PR自動レビュー） |
| `/verify-setup` | Stop フックへの検証コマンド設定（test / lint / typecheck） |
| `/plan-view` | PlanMode のプランを HTML 出力してブラウザ確認 |
| `/dev-log-setup` | セッションログ自動保存のセットアップ |
| `/dev-log` | 前回セッションログの読み込み |

### `/dev-setup` でやること

1. フォルダ構成作成 (`document/` `src/` `tests/` `poc/` `resources/`)
2. 開発ルール (`rules/development.md`) を `.claude/rules/` に配置、`CLAUDE.md` に参照追記
3. ドキュメントテンプレート配置 (要件定義書・仕様書・設計図など)
4. `.gitignore` 生成
5. `git init` → 初回コミット
6. `README.md` 自動生成
7. GitHub プライベートリポジトリ作成 & push
8. PR 自動レビュー GitHub Actions ワークフロー設定
9. `tasks.md` 更新強制フック設定

### `/verify-setup` でやること

- 技術スタック自動検出 (Node.js / Python / Rust / Go / Unity など)
- `Stop` フックへ検証コマンド設定
- Claude が停止しようとするたびに自動でテスト・lint・ビルドを実行

---

## 必要なもの

- [Claude Code](https://claude.ai/code)
- [GitHub CLI (`gh`)](https://cli.github.com/)
- Git

---

## インストール

Claude Code 内で以下を実行する：

```
/plugin marketplace add kobayashiyuuhi/claude-dev-workflow
```

```
/plugin install dev-workflow@dev-workflow
```

### インストール後

セッション開始時にプロジェクトの `.claude/.plugin-root` にプラグインパスが記録される。`/dev-setup` 実行時にこのパスを参照してテンプレートや開発ルールを配置する。グローバル設定への変更はない。

---

## 使い方

### 新規プロジェクトで使う

```bash
mkdir my-project && cd my-project
claude
```

Claude Code 内で:

```
/dev-setup
```

### 既存プロジェクトに検証フックを追加する

```
/verify-setup
```

---

## ディレクトリ構成

```
claude-dev-workflow/
├── .claude-plugin/
│   ├── plugin.json        ← プラグイン定義・フック設定
│   └── marketplace.json   ← マーケットプレイス定義
├── .github/
│   └── scripts/           ← バリデーション・リリーススクリプト
├── skills/
│   ├── dev-setup/
│   │   ├── SKILL.md       ← /dev-setup スキル
│   │   └── templates/     ← ドキュメントテンプレート群
│   ├── dev-log/
│   ├── dev-log-setup/
│   ├── plan-view/
│   └── verify-setup/
└── rules/
    └── development.md     ← 開発ルール（dev-setup 時にプロジェクトへ配置）
```

---

## ブランチ戦略

```
main      ← タグ付きリリースのみ
develop   ← 統合ブランチ
  ├── feature/*  ← 新機能
  └── fix/*      ← バグ修正
```

---

## リリースフロー

1. `develop` で作業 → PR → マージ
2. `develop` → `main` PR 作成
3. `plugin.json` バージョン更新
4. main マージ後にタグ & GitHub Release 作成

```bash
git tag vX.Y.Z && git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --notes "..." --latest
```

---

## ライセンス

Private — 個人利用のみ
