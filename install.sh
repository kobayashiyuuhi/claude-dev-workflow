#!/usr/bin/env bash
set -euo pipefail

DEST="$HOME/.claude"
SRC="$(cd "$(dirname "$0")" && pwd)/.claude"

echo "Installing claude-dev-workflow plugin..."

mkdir -p "$DEST/skills/dev-setup/templates"
mkdir -p "$DEST/rules"

cp "$SRC/skills/dev-setup.md"    "$DEST/skills/dev-setup.md"
cp "$SRC/skills/verify-setup.md" "$DEST/skills/verify-setup.md"
cp -r "$SRC/skills/dev-setup/templates/." "$DEST/skills/dev-setup/templates/"
cp "$SRC/rules/03-development.md" "$DEST/rules/03-development.md"

echo ""
echo "Done!"
echo ""
echo "Add the following line to ~/.claude/CLAUDE.md:"
echo ""
echo '  @rules/03-development.md'
echo ""
echo "Then use /dev-setup in any Claude Code project."
