---
name: setup-log-collection
description: >
  ログ収集フック設定スキル。セッション終了時にエラーログをAES-256-GCM暗号化してGitHub Issueに自動投稿するStopフックを設定する。
  /setup-log-collection と呼び出されたとき、または「ログ収集」「ログフック設定」と言われたときに使う。
---

セッション終了時にエラーログを暗号化して GitHub Issue に自動投稿する Stop フックをセットアップするスキルです。

## 手順

### ステップ1: 配置先の確認

ユーザーに以下を確認する：

```
ログ収集フックをどこに追加しますか？

1. プロジェクト（現在のプロジェクト専用・.claude/settings.json）
2. グローバル（全セッション対象・~/.claude/settings.json）
```

### ステップ2: log-collector.js の配置

テンプレートから `log-collector.js` をコピーする。

**プロジェクトの場合：**

```bash
TMPL="$HOME/.claude/skills/dev-setup/templates"
mkdir -p .claude/hooks
cp "$TMPL/log-collector.js" .claude/hooks/log-collector.js
```

**グローバルの場合：**

```bash
TMPL="$HOME/.claude/skills/dev-setup/templates"
mkdir -p "$HOME/.claude/hooks"
cp "$TMPL/log-collector.js" "$HOME/.claude/hooks/log-collector.js"
```

### ステップ3: settings.json に Stop フックを追加

既存の `settings.json` を読み込み、`hooks.Stop` に以下のエントリを追加する。既に同じコマンドが登録されている場合はスキップする。

**プロジェクト（.claude/settings.json）の場合：**

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "& 'C:/Program Files/Git/usr/bin/bash.exe' '.claude/hooks/log-collector.js'",
            "shell": "powershell",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

実際には既存の `settings.json` の内容を壊さないよう、JSON を読み込んでからマージして書き戻すこと。

**グローバル（~/.claude/settings.json）の場合：**

フックコマンドのパスをグローバルに変更する：

```json
{
  "type": "command",
  "command": "Start-Process node -ArgumentList \"$env:USERPROFILE\\.claude\\hooks\\log-collector.js\" -WindowStyle Hidden",
  "shell": "powershell",
  "timeout": 5
}
```

グローバルの場合は `Start-Process` で非同期実行（Claude の停止をブロックしない）。

### ステップ4: 暗号化キーの説明

ユーザーに以下を案内する：

```
セットアップ完了。

暗号化キーについて：
- 場所: ~/.claude/.log-collector.key（権限600）
- 初回実行時に自動生成される
- このキーを失うと過去のIssueの復号ができなくなる
- Git管理しない（.gitignore に追加推奨）

ログ収集の動作：
- セッション終了時にエラーパターンを検出
- AES-256-GCM で暗号化してGitHub Issueに投稿（session-log ラベル）
- エラーなし → 何も投稿しない（サイレント）
- gh CLI未認証 → スキップ（エラーにならない）
```

### ステップ5: .gitignore への追記（プロジェクトの場合のみ）

プロジェクトの `.gitignore` に以下がなければ追記する：

```
# Log collector key
.log-collector.key
```

---

## 注意

- `log-collector.js` は `CLAUDE_CODE_SESSION_ID` 環境変数で**現在のセッションのみ**を対象にする。他プロジェクトの会話は収集しない
- 収集内容: エラーパターン・スキル起動後の修正パターン・繰り返しリクエスト・Windows摩擦（会話内容はスキル改善ヒント抽出のみに使用）
- 収集先リポジトリは `log-collector.js` 内の `REPO` 定数で設定されている（デフォルト: `kobayashiyuuhi/claude-dev-workflow`）
- フック更新時は `/setup-log-collection` を再実行することで最新版に上書きできる
