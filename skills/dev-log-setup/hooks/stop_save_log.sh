#!/bin/bash
# Stop hook: Save session log to ~/.claude/Log/

LOG_DIR="$HOME/.claude/Log"
mkdir -p "$LOG_DIR"

INPUT=$(cat)
[ -z "$INPUT" ] && exit 0

PY_CMD=""
command -v python3 &>/dev/null && PY_CMD="python3"
[ -z "$PY_CMD" ] && command -v python &>/dev/null && PY_CMD="python"
[ -z "$PY_CMD" ] && exit 0

SESSION_ID=$(echo "$INPUT" | $PY_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('session_id',''))" 2>/dev/null)
CWD_RAW=$(echo "$INPUT" | $PY_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('cwd',''))" 2>/dev/null)
TRANSCRIPT=$(echo "$INPUT" | $PY_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('transcript_path',''))" 2>/dev/null)

[ -z "$SESSION_ID" ] && exit 0

PROJECT=$(basename "$CWD_RAW" 2>/dev/null || echo "unknown")
DATE=$(date '+%Y-%m-%d-%H%M')
LOG_FILE="$LOG_DIR/${DATE}-${PROJECT}.md"

SCRIPT_DIR="$(dirname "$0")"
$PY_CMD "$SCRIPT_DIR/log_generator.py" "$TRANSCRIPT" "$CWD_RAW" "$SESSION_ID" "$PROJECT" > "$LOG_FILE" 2>/dev/null

exit 0
