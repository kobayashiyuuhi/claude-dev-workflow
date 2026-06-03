# claude-dev-workflow

Claude Code 向け開発ワークフロープラグイン。新規プロジェクトのセットアップを `/dev-setup` 一発で完結させる。

# CLAUDE.md
@rules/development.md

---

## 提供スキル

| スキル | 説明 |
|--------|------|
| `/dev-setup` | プロジェクト初期セットアップ（フォルダ構成・ドキュメント・git・GitHub・PR自動レビュー） |
| `/verify-setup` | Stop フックへの検証コマンド設定（test / lint / typecheck） |
| `/setup-log-collection` | エラーログ収集フック設定（プロジェクトまたはグローバルを選択） |

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

Claude Code 内で以下を実行する：

```
/plugin marketplace add kobayashiyuuhi/claude-dev-workflow
```

```
/plugin install dev-workflow@dev-workflow
```

### インストール後

再起動不要。初回セッション起動時にテンプレート・ルールの同期と `~/.claude/CLAUDE.md` への参照追加が自動で行われる。

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
│       ├── validate-plugin.js
│       ├── check-skills.js
│       └── bump-version.js
├── skills/
│   ├── dev-setup/
│   │   └── SKILL.md       ← /dev-setup スキル
│   └── verify-setup/
│       └── SKILL.md       ← /verify-setup スキル
├── templates/             ← ドキュメントテンプレート群
├── hooks/
│   ├── sync-templates.js  ← SessionStart 時にテンプレート・フックを同期
│   └── log-collector.js   ← Stop 時にエラーログを暗号化して Issue 投稿
└── rules/
    └── 03-development.md  ← 開発ルール
```

---

## ブランチ戦略

```
main ──────────────────────────────────────────────────────►  タグ付きリリースのみ
  ▲
  │  develop → PR
  │
develop ────────────────────────────────────────────────────►  統合ブランチ
  ▲         ▲         ▲
feature/*  fix/*    auto-update/YYYY-MM-DD  (Claude ルーチン自動PR)
```

| ブランチ | 役割 | マージ先 |
|---------|------|---------|
| `main` | 安定リリース | — |
| `develop` | 統合・次リリース候補 | `main` via PR |
| `feature/*` | 新機能 | `develop` via PR |
| `fix/*` | バグ修正 | `develop` via PR |
| `hotfix/*` | 本番緊急修正 | `main` → `develop` back-merge |
| `auto-update/*` | Claude ルーチン自動PR | `develop` via PR（自動マージなし） |

---

## リリースフロー

`plugin-release` Claude ルーチンを手動で起動する：

```
/schedule run plugin-release
```

処理内容：
1. `main` の新コミット確認 → なければ終了
2. `validate-plugin.js` でプラグイン構造検証
3. `check-skills.js` でスキル一覧検証
4. `bump-version.js` でパッチバージョン自動インクリメント
5. git tag + push → GitHub Release 作成

---

## ログ収集・自動更新フロー

### セットアップ

```
/setup-log-collection
```

実行すると「プロジェクト」または「グローバル（全セッション対象）」を選択できる。

```
[Stop フック（設定した範囲）・非同期]
  → log-collector.js がエラーパターンを検出
  → AES-256-GCM で暗号化して GitHub Issue に投稿（session-log ラベル）

[毎日 09:00] Claude ルーチン: plugin-auto-update
  → session-log Issues を読み取り・復号
  → SKILL.md / plugin.json を分析
  → auto-update/YYYY-MM-DD ブランチに修正提案をコミット
  → develop への PR 作成（自動マージなし）
```

### セキュリティ

- ログは **AES-256-GCM** で暗号化してから Issue に投稿する
- 暗号化キーは `~/.claude/.log-collector.key`（権限 600、ローカル専用・Git 非管理）
- **キーを紛失すると過去の Issue の復号ができなくなる**
- Issue 本体には平文のログ内容は一切含まない

### 注意事項

- `CLAUDE_CODE_SESSION_ID` で**現在のセッションのみ**を対象にする。他プロジェクトの会話は収集しない
- 収集内容: エラーパターン・スキル起動後の修正パターン・繰り返しリクエスト・Windows摩擦（スキル改善ヒント抽出目的のみ）
- `gh` CLI が認証済みの場合のみ動作する（未認証時はサイレントにスキップ）
- フック更新時は `/setup-log-collection` を再実行すると最新版に上書きされる

---

## ライセンス

Private — 個人利用のみ
