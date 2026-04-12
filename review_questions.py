#!/usr/bin/env python3
"""
review_questions.py
Revisa as questões do NefroQuest via OpenAI API com prompt de auditoria técnica.

USO:
  pip install openai
  export OPENAI_API_KEY="sk-..."
  python review_questions.py --start 0 --end 50 --out reviewed_0_50.json
  python review_questions.py --start 0 --end 50 --out reviewed_0_50.json --model o4-mini

Modelos recomendados:
  gpt-4o      — rápido, barato (~$0,01/questão)
  o4-mini     — raciocínio, mais preciso (~$0,02/questão)  ← recomendado
  o3          — máxima precisão, mais lento e caro

Depois aplique com:
  python apply_reviews.py reviewed_0_50.json
"""

import os, re, json, time, argparse
from openai import OpenAI

# ── Config ───────────────────────────────────────────────────────────────────
DEFAULT_MODEL = "o4-mini"
SLEEP_SEC     = 1.5
HTML_FILE     = "index.html"

# Modelos de raciocínio não aceitam temperature nem max_tokens
REASONING_MODELS = {"o1", "o1-mini", "o3", "o3-mini", "o4-mini", "o1-preview"}

SYSTEM_PROMPT = """Você é um revisor sênior de questões médicas de múltipla escolha, com foco principal em nefrologia e clínica médica. Sua tarefa é auditar tecnicamente cada questão de um banco de perguntas e devolver uma revisão padronizada, objetiva e pronta para processamento automatizado.

Sua prioridade máxima é:
1. correção médica
2. coerência interna da questão
3. clareza pedagógica
4. atualização científica
5. utilidade prática para banco de questões

Você nunca deve assumir que o gabarito atual está correto. Julgue a questão pelo conteúdo médico real.

Você deve sempre confrontar: enunciado, alternativas, gabarito_marcado, feedback_usuario, explicacao_final e referencias quando existirem.

Você deve identificar explicitamente: gabarito incorreto, feedback contraditório, explicação incompatível com a resposta correta, mais de uma alternativa defensável, nenhuma alternativa correta, enunciado impreciso, alternativas mal calibradas, conteúdo desatualizado, afirmações absolutas indevidas, mistura inadequada de conceitos, dependência indevida de valor laboratorial isolado sem contexto clínico.

CLASSIFICAÇÃO OPERACIONAL — use exatamente um dos seguintes vereditos:
manter — questão tecnicamente correta, coerente e pedagogicamente aceitável.
corrigir_gabarito — questão aproveitável, mas gabarito atual errado.
corrigir_explicacao — gabarito correto, mas explicação/feedback incorretos ou fracos.
corrigir_gabarito_e_explicacao — gabarito e explicação errados, estrutura aproveitável.
reescrever — tema válido, mas construção compromete o item; reescreva tudo.
excluir — questão irrecuperável.

REGRAS PARA A EXPLICAÇÃO FINAL REVISADA:
- português brasileiro
- parágrafo único
- tecnicamente precisa, clara e didática
- explica por que a correta está correta e por que as demais não são a melhor resposta
- sem bullets, sem markdown, sem frases vazias
- explicita mecanismo fisiopatológico quando relevante
- corrige generalizações indevidas ("sempre", "nunca", "obrigatoriamente")

REGRAS DE SEGURANÇA DO OUTPUT:
- Responda APENAS em JSON válido
- Não use markdown, crases, texto fora do JSON, comentários ou campos extras
- Se campo não se aplicar, use null
- "problemas_identificados" deve sempre existir, mesmo vazia
- "questao_revisada" deve ser null apenas quando veredito for "excluir"
- "correta_real" usa: "A", "B", "C", "D", "MULTIPLAS" ou "NENHUMA"

FORMATO DE SAÍDA OBRIGATÓRIO:
{
  "id": "string",
  "veredito": "manter|corrigir_gabarito|corrigir_explicacao|corrigir_gabarito_e_explicacao|reescrever|excluir",
  "tema": "string",
  "dificuldade": "string",
  "analise": {
    "correta_real": "A|B|C|D|MULTIPLAS|NENHUMA",
    "gabarito_marcado_confere": true,
    "feedback_confere": true,
    "explicacao_confere": true,
    "problemas_identificados": ["string"],
    "justificativa_tecnica": "string"
  },
  "questao_revisada": {
    "enunciado": "string",
    "alternativas": {"A": "string", "B": "string", "C": "string", "D": "string"},
    "gabarito_correto": "A|B|C|D|null",
    "explicacao_final_revisada": "string"
  },
  "confianca": "alta|media|baixa"
}"""

USER_PROMPT_TEMPLATE = """Revise a questão abaixo de acordo com o protocolo do system prompt.

Entrada:
{question_json}

Lembretes obrigatórios:
- julgue a questão pelo conteúdo médico real, não pelo gabarito atual
- identifique contradições entre gabarito, feedback e explicação
- responda apenas em JSON válido
- não escreva nada fora do JSON"""

# ── Extrai questões do index.html ────────────────────────────────────────────
def extract_questions(html_path):
    with open(html_path, encoding="utf-8") as f:
        html = f.read()
    topics_start = html.find("const topics = [")
    topics_end   = html.find("\n];", topics_start) + 3
    topics_js    = html[topics_start:topics_end][len("const topics = "):]
    topics_js    = re.sub(r'//[^\n]*', '', topics_js)
    try:
        return json.loads(topics_js)
    except json.JSONDecodeError as e:
        # Tenta com strip do ponto-e-vírgula final
        try:
            return json.loads(topics_js.rstrip().rstrip(';').rstrip())
        except Exception:
            raise e

# ── Monta input no novo schema ───────────────────────────────────────────────
def build_input(q, idx):
    opts = q.get("opts", ["", "", "", ""])
    ans_idx = q.get("ans", 0)
    return {
        "id": f"NQ-{idx+1:04d}",
        "tema": q.get("cat", ""),
        "dificuldade": q.get("diff", "medium"),
        "enunciado": q.get("q", ""),
        "alternativas": {
            "A": opts[0] if len(opts) > 0 else "",
            "B": opts[1] if len(opts) > 1 else "",
            "C": opts[2] if len(opts) > 2 else "",
            "D": opts[3] if len(opts) > 3 else "",
        },
        "gabarito_marcado": chr(65 + ans_idx),
        "feedback_usuario": q.get("exp", ""),
        "explicacao_final": q.get("exp", ""),
        "referencias": q.get("refs", []),
    }

# ── Revisa uma questão via API ───────────────────────────────────────────────
def review_question(client, q, idx, model):
    question_input = build_input(q, idx)
    user_msg = USER_PROMPT_TEMPLATE.format(
        question_json=json.dumps(question_input, ensure_ascii=False, indent=2)
    )

    is_reasoning = model in REASONING_MODELS
    kwargs = dict(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
    )
    if is_reasoning:
        kwargs["max_completion_tokens"] = 3000
    else:
        kwargs["max_tokens"] = 2000
        kwargs["temperature"] = 0.1

    resp = client.chat.completions.create(**kwargs)
    raw  = resp.choices[0].message.content.strip()
    raw  = re.sub(r'^```json\s*', '', raw)
    raw  = re.sub(r'```$', '', raw.strip())
    return json.loads(raw)

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--end",   type=int, default=50)
    parser.add_argument("--out",   type=str, default="reviewed.json")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL,
                        help="Modelo OpenAI (padrão: o4-mini)")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Erro: defina OPENAI_API_KEY=sk-...")
        return

    client = OpenAI(api_key=api_key)
    print(f"Modelo: {args.model}")

    print(f"Extraindo questões de {HTML_FILE}...")
    questions = extract_questions(HTML_FILE)
    print(f"Total de questões: {len(questions)}")

    batch   = questions[args.start:args.end]
    results = []
    errors  = []

    verdicts = {"manter": 0, "corrigir_gabarito": 0, "corrigir_explicacao": 0,
                "corrigir_gabarito_e_explicacao": 0, "reescrever": 0, "excluir": 0}

    for i, q in enumerate(batch, start=args.start):
        topic = q.get("t", f"Q{i}")
        print(f"[{i+1}/{args.end}] {topic[:55]}...", end=" ", flush=True)
        try:
            result = review_question(client, q, i, args.model)
            # Preserva metadados originais
            result["_t"]    = q.get("t", "")
            result["_idx"]  = i
            result["_diff"] = q.get("diff", "medium")
            result["_cat"]  = q.get("cat", "")
            result["_refs"] = q.get("refs", [])
            results.append(result)
            v = result.get("veredito", "?")
            verdicts[v] = verdicts.get(v, 0) + 1
            conf = result.get("confianca", "?")
            print(f"{v} [{conf}]")
        except Exception as e:
            print(f"ERRO: {e}")
            errors.append({"idx": i, "topic": topic, "error": str(e)})
            results.append({**q, "_idx": i, "_t": q.get("t",""), "_error": str(e)})

        time.sleep(SLEEP_SEC)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nSalvo em {args.out}")
    print(f"Revisadas: {len(results) - len(errors)} | Erros: {len(errors)}")
    print("Vereditos:", {k: v for k, v in verdicts.items() if v > 0})
    if errors:
        print("Questões com erro:", [e["idx"] for e in errors])

if __name__ == "__main__":
    main()
