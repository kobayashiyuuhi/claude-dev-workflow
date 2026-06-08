---
name: dev-log-setup
description: >
  セッションログ基盤をセットアップするスキル。プロジェクトの .claude/Log/ フォルダ作成・.claude/hooks/ へのスクリプト配置・.claude/settings.json へのフック登録を行う。すべてプロジェクト固有。グローバル設定は変更しない。
  /dev-log-setup と呼び出されたとき、または dev-setup から自動実行される。
---

# dev-log-setup スキル

Claude Code のセッション終了時に会話ログを自動保存する基盤を構築する。
**冪等**（既に設定済みなら何もしない）。

## トリガー

- `/dev-log-setup` — 明示呼び出し
- `dev-setup` スキルから自動実行

## 手順

### ステップ1: Log フォルダ確認・作成

プロジェクトの `.claude/Log/` を作成する（現在の作業ディレクトリ基準）。

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Path ".claude\Log" -Force | Out-Null

# Mac/Linux
mkdir -p ".claude/Log"
```

### ステップ2: フックスクリプトのコピー

スキルの `hooks/` ディレクトリからプロジェクトの `.claude/hooks/` へコピー。

```bash
SKILL_DIR="$CLAUDE_PLUGIN_ROOT/skills/dev-log-setup/hooks"
HOOK_DIR=".claude/hooks"

mkdir -p "$HOOK_DIR"

# スクリプトが存在する場合のみコピー
if [ -d "$SKILL_DIR" ]; then
  cp "$SKILL_DIR/stop_save_log.sh"  "$HOOK_DIR/stop_save_log.sh"
  cp "$SKILL_DIR/log_generator.py"  "$HOOK_DIR/log_generator.py"
  chmod +x "$HOOK_DIR/stop_save_log.sh"
  echo "フックスクリプトをコピーしました"
else
  echo "スキルディレクトリが見つかりません: $SKILL_DIR"
fi
```

### ステップ3: settings.json へのフック登録

プロジェクトの `.claude/settings.json` の `hooks.Stop` 配列に以下エントリが**なければ**追加する。
既に `stop_save_log.sh` への参照がある場合はスキップ。

`cwd` は Stop フック実行時の環境変数から取得できないため、スクリプトパスはプロジェクトからの相対パスではなく絶対パスで記述する必要がある。
現在の作業ディレクトリ（`pwd`）を取得してパスを組み立てる。

追加するエントリ（`Stop` 配列の末尾に追記）：

**Windows の場合：** `pwd` で得たパスを使い絶対パスで記述

```json
{
  "hooks": [
    {
      "type": "command",
      "command": "\"C:/Program Files/Git/usr/bin/bash.exe\" \"{CWD}/.claude/hooks/stop_save_log.sh\"",
      "timeout": 20,
      "statusMessage": "ログ保存中..."
    }
  ]
}
```

**Mac/Linux の場合：**

```json
{
  "hooks": [
    {
      "type": "command",
      "command": "bash \"{CWD}/.claude/hooks/stop_save_log.sh\"",
      "timeout": 20,
      "statusMessage": "ログ保存中..."
    }
  ]
}
```

`{CWD}` は実際の作業ディレクトリ絶対パスに置換すること（例: `I:/myworkSpace/MyProject`）。

プロジェクトルートの `.claude/settings.json` を Read して現在の Stop 配列を確認し、Edit で追記する。
ファイルが存在しない場合は新規作成する。グローバルの `~/.claude/settings.json` は変更しない。

### ステップ3b: .gitignore への追記

`.gitignore` に `.claude/Log/` が含まれていなければ追記する。

```bash
grep -q '\.claude/Log' .gitignore 2>/dev/null \
  || echo -e "\n# Session logs (auto-generated)\n.claude/Log/" >> .gitignore
```

### ステップ4: 完了確認

```
セッションログ基盤セットアップ完了:
  ✓ .claude/Log/           作成済み
  ✓ stop_save_log.sh       配置済み
  ✓ log_generator.py       配置済み
  ✓ settings.json Stop フック 登録済み

次回セッション終了時から .claude/Log/ にログが保存されます。
```

## 注意

- 既に設定済みの場合（stop_save_log.sh がフックに含まれる）はスキップして完了メッセージのみ出す
- Python (python3 または python) が PATH に必要。なければログは生成されない（エラーにはならない）
