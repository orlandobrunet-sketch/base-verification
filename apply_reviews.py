#!/usr/bin/env python3
"""
apply_reviews.py
Aplica as revisões geradas pelo review_questions.py de volta no index.html.

USO:
  python apply_reviews.py reviewed_0_50.json
  python apply_reviews.py reviewed_50_100.json   # acumula
"""

import re, json, sys

HTML_FILE = "index.html"

def update_q(html, topic, new_q=None, new_opts=None, new_ans=None, new_exp=None):
    marker = f'"t": "{topic}"'
    pos = html.find(marker)
    if pos == -1:
        print(f"  X NOT FOUND: {topic[:60]}")
        return html

    blk_start = html.rfind('\n  {', 0, pos)
    blk_end   = html.find('\n  {', pos)
    if blk_end == -1:
        blk_end = html.find('\n];', pos)
    block = html[blk_start:blk_end]

    if new_q is not None:
        safe = new_q.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        block = re.sub(r'"q":\s*"(?:[^"\\]|\\.)*"', f'"q": "{safe}"', block, count=1)

    if new_opts is not None:
        opts_str = '[\n      ' + ',\n      '.join(
            f'"{o.replace(chr(92), chr(92)*2).replace(chr(34), chr(92)+chr(34)).replace(chr(10), r"\\n").replace(chr(13), r"\\r").replace(chr(9), r"\\t")}"'
            for o in new_opts
        ) + '\n    ]'
        # Regex que respeita strings entre aspas (não para no ] dentro de uma string)
        block = re.sub(r'"opts":\s*\[(?:"(?:[^"\\]|\\.)*"(?:\s*,\s*)?)*\s*\]', f'"opts": {opts_str}', block, count=1, flags=re.DOTALL)

    if new_ans is not None:
        block = re.sub(r'"ans":\s*\d', f'"ans": {new_ans}', block, count=1)

    if new_exp is not None:
        safe = new_exp.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        block = re.sub(r'"exp":\s*"(?:[^"\\]|\\.)*"', f'"exp": "{safe}"', block, count=1)

    print(f"  OK {topic[:70]}")
    return html[:blk_start] + block + html[blk_end:]


def main():
    if len(sys.argv) < 2:
        print("Uso: python apply_reviews.py <reviewed.json>")
        return

    review_file = sys.argv[1]
    with open(review_file, encoding="utf-8") as f:
        reviews = json.load(f)

    with open(HTML_FILE, encoding="utf-8") as f:
        html = f.read()

    applied = 0
    skipped = 0
    for r in reviews:
        if r.get("_error"):
            print(f"  SKIP (erro na revisão): {r.get('t','')[:60]}")
            skipped += 1
            continue

        topic = r.get("t", "")
        if not topic:
            skipped += 1
            continue

        html = update_q(
            html,
            topic=topic,
            new_q=r.get("q"),
            new_opts=r.get("opts"),
            new_ans=r.get("ans"),
            new_exp=r.get("exp"),
        )
        applied += 1

    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nAplicadas: {applied} | Puladas: {skipped}")
    print(f"Salvo: {HTML_FILE}")

if __name__ == "__main__":
    main()
