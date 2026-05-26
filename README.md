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

### 方法1: インストールスクリプト（推奨）

**Mac / Linux:**

```bash
git clone git@github.com:kobayashiyuuhi/claude-dev-workflow.git
cd claude-dev-workflow
bash install.sh
```

**Windows (PowerShell):**

```powershell
git clone git@github.com:kobayashiyuuhi/claude-dev-workflow.git
cd claude-dev-workflow
.\install.ps1
```

スクリプトは `~/.claude/settings.json` にプラグイン設定を自動追加する。

### 方法2: 手動設定

`~/.claude/settings.json` に以下を追加する：

```json
{
  "extraKnownMarketplaces": {
    "dev-workflow": {
      "source": {
        "source": "github",
        "repo": "kobayashiyuuhi/claude-dev-workflow"
      }
    }
  },
  "enabledPlugins": {
    "dev-workflow@dev-workflow": true
  }
}
```

### インストール後

Claude Code を再起動するとプラグインが有効になる。

`~/.claude/CLAUDE.md` に以下を追加すると開発ルールも有効になる：

```markdown
@rules/03-development.md
```

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
├── skills/
│   ├── dev-setup/
│   │   └── SKILL.md       ← /dev-setup スキル
│   └── verify-setup/
│       └── SKILL.md       ← /verify-setup スキル
├── templates/             ← ドキュメントテンプレート群
├── hooks/
│   └── sync-templates.js  ← SessionStart 時にテンプレートを同期
└── rules/
    └── 03-development.md  ← 開発ルール
```

---

## ライセンス

Private — 個人利用のみ
