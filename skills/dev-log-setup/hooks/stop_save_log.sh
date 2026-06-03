#!/bin/bash
# Stop hook: Save session log to {project}/.claude/Log/

INPUT=$(cat)
[ -z "$INPUT" ] && exit 0

PY_CMD=""
for _py in python3 python; do
    if command -v "$_py" &>/dev/null && "$_py" -c "import sys" &>/dev/null 2>&1; then
        PY_CMD="$_py"
        break
    fi
done
[ -z "$PY_CMD" ] && exit 0

SESSION_ID=$(echo "$INPUT" | $PY_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('session_id',''))" 2>/dev/null)
CWD_RAW=$(echo "$INPUT" | $PY_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('cwd',''))" 2>/dev/null)
TRANSCRIPT=$(echo "$INPUT" | $PY_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('transcript_path',''))" 2>/dev/null)

[ -z "$SESSION_ID" ] && exit 0
[ -z "$CWD_RAW" ] && exit 0

# Convert Windows path separators for bash
CWD_BASH=$(echo "$CWD_RAW" | sed 's|\\|/|g; s|^\([A-Za-z]\):|/\L\1|')

LOG_DIR="${CWD_BASH}/.claude/Log"
mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

PROJECT=$(basename "$CWD_RAW" 2>/dev/null || echo "unknown")
DATE=$(date '+%Y-%m-%d-%H%M')
LOG_FILE="$LOG_DIR/${DATE}-${PROJECT}.md"

SCRIPT_DIR="$(dirname "$0")"
$PY_CMD "$SCRIPT_DIR/log_generator.py" "$TRANSCRIPT" "$CWD_RAW" "$SESSION_ID" "$PROJECT" > "$LOG_FILE" 2>/dev/null

exit 0
