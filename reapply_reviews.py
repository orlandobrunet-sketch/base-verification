#!/usr/bin/env python3
"""
reapply_reviews.py
Re-aplica todos os JSONs de revisão ao index_original.html
usando o apply_reviews.py corrigido (com escape de \\n e regex de opts fixo).

USO:
  python reapply_reviews.py

Requer:
  - index_original.html  (HTML antes da revisão GPT-4o)
  - apply_reviews.py     (versão corrigida)
  - reviewed_0_100.json, reviewed_100_200.json, ...  (JSONs do Colab)

Gera:
  - index.html  (revisado e correto)
"""

import os, json, subprocess, shutil

ORIGINAL = "index_original.html"
OUTPUT   = "index.html"

TOTAL, BATCH_SZ = 1034, 100
batches = []
s = 0
while s < TOTAL:
    batches.append((s, min(s + BATCH_SZ, TOTAL)))
    s += BATCH_SZ

# Verifica arquivos necessários
if not os.path.exists(ORIGINAL):
    print(f"ERRO: {ORIGINAL} não encontrado.")
    print("Baixe o index_original.html do GitHub (commit antes da revisão).")
    exit(1)

missing_json = [f"reviewed_{s}_{e}.json" for s, e in batches if not os.path.exists(f"reviewed_{s}_{e}.json")]
if missing_json:
    print(f"JSONs faltando: {missing_json}")
    print("Certifique-se de que todos os arquivos reviewed_*.json estão na pasta.")
    exit(1)

# Copia original para index.html
shutil.copy(ORIGINAL, OUTPUT)
print(f"Base: {ORIGINAL} copiado para {OUTPUT}")

total_applied = 0
total_skipped = 0

for s, e in batches:
    fname = f"reviewed_{s}_{e}.json"
    with open(fname) as f:
        data = json.load(f)
    ok = sum(1 for r in data if not r.get("_error"))
    print(f"Aplicando {fname}  ({ok}/{e-s} válidas)...")
    result = subprocess.run(["python", "apply_reviews.py", fname], capture_output=True, text=True)
    print(result.stdout.strip())
    total_applied += ok
    total_skipped += (e - s) - ok

print(f"\nConcluído: {total_applied} aplicadas | {total_skipped} puladas")
print(f"index.html: {os.path.getsize(OUTPUT):,} bytes")

# Valida JSON
import re
with open(OUTPUT, encoding="utf-8") as f:
    html = f.read()
start = html.find("const topics = [")
end   = html.find("\n];", start) + 3
topics_js = re.sub(r"//[^\n]*", "", html[start:end][len("const topics = "):])
try:
    questions = json.loads(topics_js)
    print(f"JSON válido: {len(questions)} questões OK")
except json.JSONDecodeError as err:
    print(f"ERRO no JSON: {err}")
    print("Algum campo ainda tem caractere inválido. Verifique o lote correspondente.")
