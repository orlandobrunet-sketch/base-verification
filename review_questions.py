#!/usr/bin/env python3
"""
review_questions.py
Usa a OpenAI API (GPT-4o) para revisar as questões do NefroQuest em lotes.

USO:
  pip install openai
  export OPENAI_API_KEY="sk-..."
  python review_questions.py --start 0 --end 50 --out reviewed_0_50.json

Depois aplique com:
  python apply_reviews.py reviewed_0_50.json
"""

import os, re, json, time, argparse
from openai import OpenAI

# ── Config ──────────────────────────────────────────────────────────────────
MODEL      = "gpt-4o"
MAX_TOKENS = 1200
SLEEP_SEC  = 1.5   # pausa entre chamadas (evita rate limit)
HTML_FILE  = "index.html"

SYSTEM_PROMPT = """Você é um especialista em nefrologia clínica (nível nefrologista),
com domínio de evidências atuais (KDIGO, grandes RCTs, consensos internacionais).
Sua função é revisar questões de múltipla escolha e devolver SEMPRE em português brasileiro.

REGRAS OBRIGATÓRIAS:
- Basear-se em evidência atual (guidelines + RCTs relevantes)
- Corrigir erros conceituais, desatualizações, ambiguidades
- Garantir exatamente UMA alternativa correta, inequívoca
- Se irrecuperável → reescrever completamente
- Linguagem técnica, direta, sem simplificações

SAÍDA — APENAS JSON VÁLIDO (sem markdown, sem texto fora do JSON):
{
  "q": "<enunciado corrigido>",
  "opts": ["<opção A>", "<opção B>", "<opção C>", "<opção D>"],
  "ans": <0|1|2|3>,
  "exp": "<explicação parágrafo único, fisiopatologia + evidência, por que as outras estão erradas, denso, técnico, sem bullets>",
  "refs": ["<Trial Ano Journal>"]
}

CHECKLIST INTERNO (valide antes de responder):
✓ Atualizado com diretrizes atuais?
✓ Apenas uma resposta correta inequívoca?
✓ Explicação fisiopatologicamente consistente?
✓ Evita conceitos ultrapassados?
✓ Nível de especialista/prova de residência?"""

# ── Extrai questões do index.html ────────────────────────────────────────────
def extract_questions(html_path):
    with open(html_path, encoding="utf-8") as f:
        html = f.read()

    topics_start = html.find("const topics = [")
    topics_end   = html.find("\n];", topics_start) + 3
    topics_js    = html[topics_start:topics_end]
    topics_js    = topics_js[len("const topics = "):]  # remove declaração

    # Converte JS quasi-JSON para JSON válido
    # Remove comentários de linha
    topics_js = re.sub(r'//[^\n]*', '', topics_js)
    # Envolve chaves de propriedades sem aspas com aspas
    # (as chaves já têm aspas neste arquivo)
    try:
        questions = json.loads(topics_js)
    except json.JSONDecodeError as e:
        print(f"Erro ao parsear topics: {e}")
        print("Tentando extração manual...")
        questions = []
        # Extração manual como fallback
        pattern = re.compile(
            r'\{\s*"t"\s*:\s*"(?P<t>[^"]+)".*?"q"\s*:\s*"(?P<q>[^"]+)".*?"ans"\s*:\s*(?P<ans>\d)',
            re.DOTALL
        )
        for m in pattern.finditer(topics_js):
            questions.append({"t": m.group("t"), "q": m.group("q"), "ans": int(m.group("ans"))})

    return questions

# ── Revisa uma questão via API ───────────────────────────────────────────────
def review_question(client, q):
    user_msg = f"""Revisar esta questão de nefrologia:

ENUNCIADO: {q.get('q', '')}

ALTERNATIVAS:
A) {q.get('opts', ['','','',''])[0]}
B) {q.get('opts', ['','','',''])[1]}
C) {q.get('opts', ['','','',''])[2]}
D) {q.get('opts', ['','','',''])[3]}

RESPOSTA ATUAL: {chr(65 + q.get('ans', 0))}

EXPLICAÇÃO ATUAL: {q.get('exp', '(sem explicação)')}

Tópico: {q.get('t', '')}"""

    resp = client.chat.completions.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ]
    )

    raw = resp.choices[0].message.content.strip()
    # Remove possível markdown code block
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'```$', '', raw.strip())

    return json.loads(raw)

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=0,   help="Índice inicial")
    parser.add_argument("--end",   type=int, default=50,  help="Índice final (exclusive)")
    parser.add_argument("--out",   type=str, default="reviewed.json")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Erro: defina OPENAI_API_KEY=sk-...")
        return

    client = OpenAI(api_key=api_key)

    print(f"Extraindo questões de {HTML_FILE}...")
    questions = extract_questions(HTML_FILE)
    print(f"Total de questões: {len(questions)}")

    batch = questions[args.start:args.end]
    results = []
    errors  = []

    for i, q in enumerate(batch, start=args.start):
        topic = q.get("t", f"Q{i}")
        print(f"[{i+1}/{args.end}] {topic[:60]}...", end=" ", flush=True)
        try:
            reviewed = review_question(client, q)
            # Preserva campos que a API não retorna
            reviewed["t"]    = q.get("t", "")
            reviewed["diff"] = q.get("diff", "medium")
            reviewed["cat"]  = q.get("cat", "")
            reviewed["_idx"] = i
            results.append(reviewed)
            print("OK")
        except Exception as e:
            print(f"ERRO: {e}")
            errors.append({"idx": i, "topic": topic, "error": str(e)})
            results.append({**q, "_idx": i, "_error": str(e)})

        time.sleep(SLEEP_SEC)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nSalvo em {args.out}")
    print(f"Revisadas: {len(results) - len(errors)} | Erros: {len(errors)}")
    if errors:
        print("Questões com erro:", [e["idx"] for e in errors])

if __name__ == "__main__":
    main()
