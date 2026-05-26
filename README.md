# claude-dev-workflow

Claude Code 向け開発ワークフロープラグイン。新規プロジェクトのセットアップを `/dev-setup` 一発で完結させる。

---

## 提供スキル

| スキル | 説明 |
|--------|------|
| `/dev-setup` | プロジェクト初期セットアップ（フォルダ構成・ドキュメント・git・GitHub・PR自動レビュー） |
| `/verify-setup` | Stop フックへの検証コマンド設定（test / lint / typecheck） |

### `/dev-setup` でやること

1. フォルダ構成作成 (`document/` `src/` `tests/` `poc/` `resources/`)
2. ドキュメントテンプレート配置 (要件定義書・仕様書・設計図 など)
3. `.gitignore` 生成
4. `git init` → 初回コミット
5. `README.md` 自動生成
6. GitHub プライベートリポジトリ作成 & push
7. PR 自動レビュー GitHub Actions ワークフロー設定
8. `tasks.md` 更新強制フック設定

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

### Mac / Linux

```bash
git clone git@github.com:kobabiba/claude-dev-workflow.git
cd claude-dev-workflow
bash install.sh
```

### Windows (PowerShell)

```powershell
git clone git@github.com:kobabiba/claude-dev-workflow.git
cd claude-dev-workflow
.\install.ps1
```

### インストール後の設定

`~/.claude/CLAUDE.md` に以下を追加する:

```markdown
@rules/03-development.md
```

---

## 使い方

### 新規プロジェクトで使う

```bash
# 空のディレクトリを作成して Claude Code を起動
mkdir my-project && cd my-project
claude
```

Claude Code 内で:

```
/dev-setup
```

対話形式でプロジェクト設定が進み、GitHub プライベートリポジトリまで自動作成される。

### 既存プロジェクトに検証フックを追加する

```
/verify-setup
```

技術スタックを自動検出し、適切な検証コマンドを `Stop` フックに設定する。

---

## ディレクトリ構成（インストール後）

```
~/.claude/
├── rules/
│   └── 03-development.md   ← 開発ルール（CLAUDE.md から @参照）
└── skills/
    ├── dev-setup.md         ← /dev-setup スキル定義
    ├── verify-setup.md      ← /verify-setup スキル定義
    └── dev-setup/
        └── templates/       ← 各種ドキュメントテンプレート
```

---

## ライセンス

Private — 個人利用のみ
