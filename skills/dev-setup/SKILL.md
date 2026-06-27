---
name: dev-setup
description: >
  開発環境セットアップスキル。新規プロジェクトのフォルダ構成・ドキュメントテンプレート・git・GitHubリポジトリ・タスク更新フックを一括セットアップする。
  /dev-setup と呼び出されたとき、または「開発準備」「プロジェクト初期化」「セットアップ」と言われたときに使う。
---

現在のプロジェクトディレクトリに開発環境を整備するスキルです。
テンプレートファイルはプラグインディレクトリ内の `skills/dev-setup/templates/` から cp で配置する（`$CLAUDE_PLUGIN_ROOT` でパス解決）。

## 手順

### ステップ1: フォルダ・ファイル構成の作成

以下のディレクトリ構成を作成し、各ディレクトリに `.gitkeep` を置く：

```
.claude/
document/
  feature/
  diagrams/
resources/
poc/
tests/
src/
```

以下のコマンドでテンプレートを配置する：

```bash
TMPL="$CLAUDE_PLUGIN_ROOT/skills/dev-setup/templates"
RULES="$CLAUDE_PLUGIN_ROOT/rules"

# 開発ルール
mkdir -p .claude/rules
cp "$RULES/development.md" .claude/rules/development.md

# ドキュメント（ウォーターフォール: 案件書→要件定義→基本設計→詳細設計）
cp "$TMPL/proposal.md"           ./document/proposal.md
cp "$TMPL/requirements.md"        ./document/requirements.md
cp "$TMPL/overview.md"            ./document/overview.md
cp "$TMPL/basic-design.md"       ./document/basic-design.md
cp "$TMPL/detailed-design.md"    ./document/detailed-design.md
cp "$TMPL/tech-stack.md"          ./document/tech-stack.md
cp "$TMPL/implementation-notes.md" ./document/implementation-notes.md
cp "$TMPL/feature-template.md"    ./document/feature/README.md

# 図表
cp "$TMPL/class-diagram.md"       ./document/diagrams/class-diagram.md
cp "$TMPL/er-diagram.md"          ./document/diagrams/er-diagram.md
cp "$TMPL/architecture.md"        ./document/diagrams/architecture.md
cp "$TMPL/sequence-template.md"   ./document/diagrams/sequence-template.md

# PoC・Resources
cp "$TMPL/poc-readme.md"          ./poc/README.md
cp "$TMPL/resources-readme.md"    ./resources/README.md

# ルートファイル
cp "$TMPL/CLAUDE-md.md"           ./CLAUDE.md
cp "$TMPL/tasks-md.md"            ./tasks.md

# CLAUDE.md に開発ルール参照を追記
echo "" >> ./CLAUDE.md
echo "@.claude/rules/development.md" >> ./CLAUDE.md
```

### ステップ2: .gitignore の作成

プロジェクトの技術スタックに合った `.gitignore` を作成する。
最低限含めること：

```
# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp

# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/

# Build
dist/
build/
*.pyc
__pycache__/
```

技術スタック確定後に追記する。

### ステップ3: Git 初期化

```bash
git init
git add .
git commit -m "chore: initial project setup"
```

### ステップ4: README.md の生成

`document/overview.md` `document/tech-stack.md` `document/requirements.md` の内容を参照して README.md を生成する。

```markdown
# {プロジェクト名}

{概要1〜2文}

---

## 概要
## 主要機能
## 技術スタック
## 動作環境
## セットアップ
## 開発状況
## ライセンス・利用範囲
```

生成後：
```bash
git add README.md && git commit -m "docs: README 追加"
```

### ステップ5: GitHub プライベートリポジトリの作成確認

ユーザーに確認：「GitHubにプライベートリポジトリを作成してプッシュしますか？リポジトリ名を教えてください（デフォルト: 現在のディレクトリ名）」

承認された場合：
```bash
gh repo create <リポジトリ名> --private --source=. --push
git checkout -b develop
git push origin develop
gh repo edit --delete-branch-on-merge
gh api -X PUT "repos/{owner}/{repo}/branches/main/protection" \
  -F enforce_admins=true \
  -F required_pull_request_reviews[required_approving_review_count]=1 \
  -F required_status_checks=null \
  -F restrictions=null
```

### ステップ6: タスク更新強制フックのセットアップ

プロジェクトの `.claude/` にタスク更新を強制する Stop フックを配置する：

```bash
TMPL="$CLAUDE_PLUGIN_ROOT/skills/dev-setup/templates"

mkdir -p .claude/hooks
cp "$TMPL/task_update_check.sh" .claude/hooks/task_update_check.sh
chmod +x .claude/hooks/task_update_check.sh
cp "$TMPL/project-settings.json" .claude/settings.json
```

これにより、ステージ済みファイルがあるのに `tasks.md` が未更新の状態で Claude が停止しようとすると、自動的に再起動してタスク更新を促す。

#### 動作原理

- Stop フックが `{"continue": true, "stopReason": "..."}` を返す → Claude が再起動してタスク更新を実行
- `tasks.md` がステージ済み、またはステージファイルなし → フック通過（正常停止）

#### Windows での Stop フック注意点

- `shell: "powershell"` + `& 'C:/Program Files/Git/usr/bin/bash.exe' 'script.sh'` 形式を使う
- `shell` 指定なし、または bash.exe を直接コマンド文字列にダブルクォートで埋め込む形式は `cannot execute binary file` エラーになる
- JSON 出力: `{"systemMessage": "メッセージ"}` または `{"continue": true, "stopReason": "理由"}`

### ステップ6b: 検証機構（Stopフック）のセットアップ

技術スタック確定済みなら `/verify-setup` を実行。未定なら仕様確定後・実装開始前に実行。

### ステップ6c: セッションログ基盤のセットアップ

`dev-log-setup` スキルを実行して、セッションログの自動保存基盤を整備する。

- `stop_save_log.sh` / `log_generator.py` をプロジェクトの `.claude/hooks/` に配置
- プロジェクトの `.claude/settings.json` の `Stop` フックに登録（未登録の場合）

### ステップ7: 完了メッセージ

---

開発準備が整いました！

次のステップ：
1. **PlanMode に切り替える**（または `/plan`）
2. **モデルを Opus に変更する**（上流工程は最上位モデル推奨）
3. ウォーターフォールの順序で進める：
   1. **案件書ヒアリング** — `document/proposal.md` を確定（下記参照）
   2. **要件定義** — `document/requirements.md` を確定
   3. **基本設計** — `document/basic-design.md` + `document/diagrams/`（architecture・ER図）
   4. **詳細設計** — `document/detailed-design.md` + `document/diagrams/`（クラス図・シーケンス図）
   5. **開発** — `src/`
   6. **テスト** — `tests/`

各フェーズ完了時にユーザー（お客様）の承認を得てから次フェーズへ進む。
実装フェーズに入ったらモデルを Sonnet に戻してよい。

#### 案件書ヒアリング（dev-setup 直後に実施）

`document/proposal.md` は空テンプレのまま放置せず、Claude がユーザー（お客様）へ
以下を順に質問して埋める：

1. **何を作るのか**
2. **目的・背景**
3. **ターゲット層**
4. **予算**
5. **目標売上**
6. **制約条件**（技術・法規制・予算上）
7. **成功指標（KPI）**

回答を `document/proposal.md` に転記し、内容をユーザーに確認してもらってから要件定義へ進む。

---
