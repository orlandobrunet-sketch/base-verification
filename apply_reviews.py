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

LETTER_TO_IDX = {"A": 0, "B": 1, "C": 2, "D": 3}

def _safe(s):
    """Escapa string para inserção em JS entre aspas duplas."""
    return (s.replace('\\', '\\\\')
             .replace('"', '\\"')
             .replace('\n', '\\n')
             .replace('\r', '\\r')
             .replace('\t', '\\t'))

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
        safe  = _safe(new_q)
        block = re.sub(r'"q":\s*"(?:[^"\\]|\\.)*"', f'"q": "{safe}"', block, count=1)

    if new_opts is not None:
        opts_str = '[\n      ' + ',\n      '.join(
            f'"{_safe(o)}"' for o in new_opts
        ) + '\n    ]'
        # Regex que respeita strings com ] dentro (não para no primeiro ] encontrado)
        block = re.sub(
            r'"opts":\s*\[(?:"(?:[^"\\]|\\.)*"(?:\s*,\s*)?)*\s*\]',
            f'"opts": {opts_str}', block, count=1, flags=re.DOTALL
        )

    if new_ans is not None:
        block = re.sub(r'"ans":\s*\d', f'"ans": {new_ans}', block, count=1)

    if new_exp is not None:
        safe  = _safe(new_exp)
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
    excluidas = []

    for r in reviews:
        # Erros de API
        if r.get("_error"):
            print(f"  SKIP (erro API): {r.get('_t', r.get('t',''))[:60]}")
            skipped += 1
            continue

        topic = r.get("_t") or r.get("t", "")
        if not topic:
            skipped += 1
            continue

        veredito = r.get("veredito", "")
        qr       = r.get("questao_revisada")

        # ── manter: sem alterações ──────────────────────────────────────────
        if veredito == "manter":
            print(f"  -- MANTER: {topic[:70]}")
            skipped += 1
            continue

        # ── excluir: registra mas não remove (decisão manual) ───────────────
        if veredito == "excluir":
            print(f"  !! EXCLUIR: {topic[:70]}")
            excluidas.append(topic)
            skipped += 1
            continue

        if not qr:
            print(f"  SKIP (sem questao_revisada): {topic[:60]}")
            skipped += 1
            continue

        # ── decide quais campos atualizar conforme veredito ─────────────────
        new_q    = None
        new_opts = None
        new_ans  = None
        new_exp  = None

        if veredito in ("corrigir_gabarito", "corrigir_gabarito_e_explicacao"):
            letter = qr.get("gabarito_correto")
            if letter and letter in LETTER_TO_IDX:
                new_ans = LETTER_TO_IDX[letter]

        if veredito in ("corrigir_explicacao", "corrigir_gabarito_e_explicacao"):
            new_exp = qr.get("explicacao_final_revisada")

        if veredito == "reescrever":
            new_q    = qr.get("enunciado")
            alts     = qr.get("alternativas", {})
            new_opts = [alts.get("A",""), alts.get("B",""), alts.get("C",""), alts.get("D","")]
            letter   = qr.get("gabarito_correto")
            if letter and letter in LETTER_TO_IDX:
                new_ans = LETTER_TO_IDX[letter]
            new_exp  = qr.get("explicacao_final_revisada")

        html = update_q(html, topic=topic,
                        new_q=new_q, new_opts=new_opts,
                        new_ans=new_ans, new_exp=new_exp)
        applied += 1

    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nAplicadas: {applied} | Puladas: {skipped}")
    if excluidas:
        print(f"Marcadas para exclusão ({len(excluidas)}):")
        for t in excluidas:
            print(f"  - {t}")
    print(f"Salvo: {HTML_FILE}")

if __name__ == "__main__":
    main()
