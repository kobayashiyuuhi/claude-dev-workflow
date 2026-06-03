#!/usr/bin/env python3
"""Generate session log markdown from Claude Code JSONL transcript."""
import json
import sys
import os
from datetime import datetime


def main():
    transcript_path = sys.argv[1] if len(sys.argv) > 1 else ''
    cwd = sys.argv[2] if len(sys.argv) > 2 else ''
    session_id = sys.argv[3] if len(sys.argv) > 3 else ''
    project = sys.argv[4] if len(sys.argv) > 4 else 'unknown'

    now = datetime.now().strftime('%Y-%m-%d %H:%M')

    print(f"# セッションログ: {project}")
    print()
    print(f"**日時**: {now}")
    print(f"**プロジェクト**: {cwd}")
    print(f"**セッションID**: {session_id}")
    print()
    print("---")
    print()

    if not transcript_path or not os.path.exists(transcript_path):
        print("(transcriptなし)")
        return

    with open(transcript_path, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    tools_used = []
    files_touched = set()
    msg_count = 0

    print("## 会話ログ")
    print()

    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
            t = d.get('type', '')

            if t in ('user', 'assistant'):
                msg = d.get('message', {})
                role = msg.get('role', t)
                content = msg.get('content', [])

                if isinstance(content, list):
                    for c in content:
                        if not isinstance(c, dict):
                            continue

                        if c.get('type') == 'text':
                            text = c['text'].strip()
                            if not text:
                                continue
                            if role == 'user':
                                print("### ユーザー")
                                print(text[:1000])
                                print()
                            elif role == 'assistant':
                                print("### Claude")
                                print(text[:600])
                                print()
                            msg_count += 1

                        elif c.get('type') == 'tool_use':
                            tool_name = c.get('name', '')
                            if tool_name and tool_name not in tools_used:
                                tools_used.append(tool_name)
                            if tool_name in ('Write', 'Edit', 'Read'):
                                inp = c.get('input', {})
                                fp = inp.get('file_path', '')
                                if fp:
                                    files_touched.add(fp)

        except Exception:
            pass

    if msg_count == 0:
        print("(会話内容を抽出できませんでした)")

    if files_touched:
        print()
        print("---")
        print()
        print("## 変更・参照ファイル")
        print()
        for f in sorted(files_touched):
            print(f"- `{f}`")

    if tools_used:
        print()
        print("## 使用ツール")
        print()
        for t in tools_used:
            print(f"- `{t}`")


if __name__ == '__main__':
    main()
