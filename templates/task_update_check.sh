#!/bin/bash
# Stop hook: enforce tasks.md update before stopping

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
[ -z "$REPO_ROOT" ] && exit 0

STAGED=$(git diff --cached --name-only 2>/dev/null)
[ -z "$STAGED" ] && exit 0

# tasks.md already staged — OK
if echo "$STAGED" | grep -q "tasks\.md"; then
  exit 0
fi

# tasks.md recently modified (within last 60s) — OK
TASKS="$REPO_ROOT/tasks.md"
if [ -f "$TASKS" ]; then
  MTIME=$(find "$TASKS" -newer "$REPO_ROOT/.git/COMMIT_EDITMSG" 2>/dev/null)
  [ -n "$MTIME" ] && exit 0
fi

COUNT=$(echo "$STAGED" | wc -l | tr -d ' ')
FILES=$(echo "$STAGED" | head -3 | tr '\n' ',' | sed 's/,$//')
MSG="${COUNT}ファイルがステージ済みですが tasks.md が更新されていません (${FILES})。tasks.md のタスクステータスを更新してください。"
printf '{"continue": true, "stopReason": "%s"}\n' "$MSG"
