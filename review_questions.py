#!/usr/bin/env python3
"""
review_questions.py
Revisa as questões do NefroQuest via OpenAI Responses API (gpt-5.4)
com Structured Outputs, effort=high e verificação obrigatória de estudos clínicos.

USO:
  pip install openai
  export OPENAI_API_KEY="sk-..."
  python review_questions.py --start 0 --end 50 --out reviewed_0_50.json

Opções:
  --model           Modelo base (padrão: gpt-5.4)
  --escalate-model  Modelo para escalonamento (padrão: gpt-5.4)
  --no-escalate     Desativa escalonamento
  --effort          Nível de raciocínio (minimal|low|medium|high, padrão: high)

Escalonamento automático é disparado quando:
  - confianca == "baixa"
  - correta_real == "MULTIPLAS" ou "NENHUMA"
  - veredito == "reescrever" ou "excluir"

Depois aplique com:
  python apply_reviews.py reviewed_0_50.json
"""

import os, re, json, time, argparse
from openai import OpenAI

# ── Config ───────────────────────────────────────────────────────────────────
DEFAULT_MODEL    = "gpt-5.4"
ESCALATE_MODEL   = "gpt-5.4"
DEFAULT_EFFORT   = "high"
MAX_OUTPUT_TOKS  = 8000
SLEEP_SEC        = 1.5
HTML_FILE        = "index.html"

# ── System Prompt ────────────────────────────────────────────────────────────
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

Você deve agir como revisor técnico rigoroso. Não suavize falhas. Não invente referências. Não produza elogios desnecessários. Não escreva comentários fora do JSON final.

CRITÉRIOS DE JULGAMENTO

1. Correção médica
Avalie a resposta correta com base em fisiopatologia, diretrizes reconhecidas, consensos amplamente aceitos e prática clínica contemporânea. Em caso de incerteza, prefira formulações conservadoras e universalmente aceitas.

2. Coerência interna
Verifique se a alternativa marcada, o feedback ao usuário e a explicação final apontam para a mesma resposta. Se houver qualquer contradição, explicite.

3. Qualidade pedagógica
Avalie se o enunciado é claro e suficiente, as alternativas são plausíveis e mutuamente distinguíveis, há apenas uma melhor resposta, a questão testa raciocínio clínico real e não apenas pegadinha injusta, a explicação final ensina algo útil e correto.

4. Atualização
Marque como desatualizada quando a questão contrariar prática contemporânea ou depender de conceito superado.

CLASSIFICAÇÃO OPERACIONAL

Use exatamente um dos seguintes vereditos:
manter — tecnicamente correta, coerente e pedagogicamente aceitável.
corrigir_gabarito — aproveitável, mas gabarito atual errado.
corrigir_explicacao — gabarito correto, mas explicação/feedback incorretos ou fracos.
corrigir_gabarito_e_explicacao — gabarito e explicação errados, estrutura aproveitável.
reescrever — tema válido, mas construção compromete o item; reescreva tudo.
excluir — irrecuperável.

REGRAS DE DECISÃO
Use "corrigir_*" quando a espinha dorsal da questão for boa e bastar ajuste localizado.
Use "reescrever" quando o tema for válido, mas a construção da questão comprometer o item.
Use "excluir" quando nem mesmo uma reescrita razoável preservaria utilidade adequada.

REGRAS PARA A EXPLICAÇÃO FINAL REVISADA
- português brasileiro
- parágrafo único
- tecnicamente precisa, clara, direta e didática
- explica por que a correta está correta e por que as demais não são a melhor resposta
- sem bullets, sem markdown, sem frases vazias, sem repetir o enunciado
- explicita mecanismo fisiopatológico quando relevante
- explicita quando conduta não deve ser baseada em valor isolado
- corrige generalizações indevidas como "sempre", "nunca", "obrigatoriamente"

REGRAS PARA REVISÃO DA QUESTÃO
Ao revisar ou reescrever: mantenha o tema central, garanta apenas uma melhor resposta, evite alternativas absurdas, evite sobreposição semântica importante entre alternativas, evite ambiguidades, mantenha nível adequado ao público médico, preserve estilo de prova ou quiz médico.

CONFIANÇA
alta = alta segurança técnica
media = pequena incerteza, mas resposta provável
baixa = enunciado ou alternativas insuficientes, ambíguas ou fortemente dependentes de contexto ausente

HEURÍSTICAS DE ALERTA
Revise com atenção extra quando: alternativa marcada contradiz a explicação; feedback diz "incorreta" mas a alternativa foi marcada como correta; explicação defende alternativa diferente da marcada; uso de creatinina/ureia/bicarbonato isolado como critério absoluto; termos absolutos em contexto clínico; enunciado pergunta sobre critério "isoladamente" mas descreve múltiplas indicações simultâneas; duas alternativas verdadeiras dependendo do contexto; dependência de diretriz antiga ou conceito superado.

VERIFICAÇÃO OBRIGATÓRIA DE ESTUDOS CLÍNICOS
Quando a questão mencionar um estudo clínico (SPRINT, BPROAD, FIDELIO-DKD, FIGARO-DKD, CREDENCE, DAPA-CKD, EMPA-KIDNEY, FLOW, CONVINCE, KDIGO, etc.):
1. Verifique se o nome do estudo no enunciado é consistente com os achados descritos nas alternativas e na explicação.
2. Verifique se os percentuais e resultados citados são compatíveis com os dados reais do estudo (ex: SPRINT mostrou redução de ~25% em MACE e ~27% em mortalidade, NÃO 40%).
3. Se uma alternativa menciona um estudo diferente do que o enunciado pergunta, isso é um erro grave — identifique e marque como problema.
4. Nunca misture achados de um estudo com o nome de outro.
5. Nunca invente percentuais. Se não souber o dado exato, prefira uma formulação qualitativa correta.

REGRAS FINAIS
1. Se o veredito for "manter", ainda assim retorne o JSON completo com questao_revisada preenchida (idêntica à original).
2. Se o veredito for "excluir", use questao_revisada: null.
3. Se correta_real for "MULTIPLAS" ou "NENHUMA", normalmente use "reescrever" ou "excluir".
4. justificativa_tecnica deve ser curta, densa e objetiva.
5. Não cite guideline nominalmente a menos que necessário para justificar erro de atualização.
6. Não invente dados ausentes do enunciado.
7. Nunca deixe de decidir; quando houver ambiguidade, registre nos problemas_identificados e reduza a confiança.
"""

# ── JSON Schema para Structured Outputs ──────────────────────────────────────
REVIEW_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "id":          {"type": "string"},
        "veredito": {
            "type": "string",
            "enum": ["manter", "corrigir_gabarito", "corrigir_explicacao",
                     "corrigir_gabarito_e_explicacao", "reescrever", "excluir"],
        },
        "tema":        {"type": "string"},
        "dificuldade": {"type": "string"},
        "analise": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "correta_real": {
                    "type": "string",
                    "enum": ["A", "B", "C", "D", "MULTIPLAS", "NENHUMA"],
                },
                "gabarito_marcado_confere": {"type": "boolean"},
                "feedback_confere":         {"type": "boolean"},
                "explicacao_confere":       {"type": "boolean"},
                "problemas_identificados":  {"type": "array", "items": {"type": "string"}},
                "justificativa_tecnica":    {"type": "string"},
            },
            "required": [
                "correta_real", "gabarito_marcado_confere", "feedback_confere",
                "explicacao_confere", "problemas_identificados", "justificativa_tecnica",
            ],
        },
        "questao_revisada": {
            "anyOf": [
                {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "enunciado": {"type": "string"},
                        "alternativas": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "A": {"type": "string"},
                                "B": {"type": "string"},
                                "C": {"type": "string"},
                                "D": {"type": "string"},
                            },
                            "required": ["A", "B", "C", "D"],
                        },
                        "gabarito_correto": {
                            "anyOf": [
                                {"type": "string", "enum": ["A", "B", "C", "D"]},
                                {"type": "null"},
                            ],
                        },
                        "explicacao_final_revisada": {"type": "string"},
                    },
                    "required": [
                        "enunciado", "alternativas",
                        "gabarito_correto", "explicacao_final_revisada",
                    ],
                },
                {"type": "null"},
            ],
        },
        "confianca": {"type": "string", "enum": ["alta", "media", "baixa"]},
    },
    "required": [
        "id", "veredito", "tema", "dificuldade",
        "analise", "questao_revisada", "confianca",
    ],
}

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
    except json.JSONDecodeError:
        return json.loads(topics_js.rstrip().rstrip(';').rstrip())

def build_input(q, idx):
    opts = q.get("opts", ["", "", "", ""])
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
        "gabarito_marcado": chr(65 + q.get("ans", 0)),
        "feedback_usuario": q.get("exp", ""),
        "explicacao_final": q.get("exp", ""),
        "referencias": q.get("refs", []),
    }

def build_user_prompt(question_input):
    return (
        "Revise a questão abaixo de acordo com o protocolo do system prompt.\n\n"
        "Entrada:\n"
        f"{json.dumps(question_input, ensure_ascii=False, indent=2)}\n\n"
        "Lembretes obrigatórios:\n"
        "- julgue a questão pelo conteúdo médico real, não pelo gabarito atual\n"
        "- identifique contradições entre gabarito, feedback e explicação\n"
        "- responda apenas em JSON válido\n"
        "- não escreva nada fora do JSON"
    )

# ── Chamada à Responses API ─────────────────────────────────────────────────
def review_question(client, q, idx, model, effort):
    question_input = build_input(q, idx)
    user_msg       = build_user_prompt(question_input)

    resp = client.responses.create(
        model=model,
        reasoning={"effort": effort},
        max_output_tokens=MAX_OUTPUT_TOKS,
        input=[
            {"role": "developer", "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
        ],
        text={
            "format": {
                "type":   "json_schema",
                "name":   "question_review",
                "strict": True,
                "schema": REVIEW_SCHEMA,
            }
        },
    )

    if resp.status == "incomplete":
        reason = getattr(resp.incomplete_details, "reason", "unknown") if resp.incomplete_details else "unknown"
        raise RuntimeError(f"Resposta incompleta (reason={reason})")

    if not resp.output_text:
        raise RuntimeError("Modelo não retornou output_text")

    return json.loads(resp.output_text)

def should_escalate(parsed):
    if parsed.get("confianca") == "baixa":
        return True
    correta = parsed.get("analise", {}).get("correta_real")
    if correta in ("MULTIPLAS", "NENHUMA"):
        return True
    if parsed.get("veredito") in ("reescrever", "excluir"):
        return True
    return False

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--end",   type=int, default=50)
    parser.add_argument("--out",   type=str, default="reviewed.json")
    parser.add_argument("--model",          type=str, default=DEFAULT_MODEL)
    parser.add_argument("--escalate-model", type=str, default=ESCALATE_MODEL)
    parser.add_argument("--no-escalate",    action="store_true")
    parser.add_argument("--effort",         type=str, default=DEFAULT_EFFORT,
                        choices=["minimal", "low", "medium", "high"])
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Erro: defina OPENAI_API_KEY=sk-...")
        return

    client = OpenAI(api_key=api_key)
    print(f"Modelo base: {args.model}  |  effort: {args.effort}")
    if not args.no_escalate:
        print(f"Escalonamento: {args.escalate_model}")
    else:
        print("Escalonamento: desativado")

    questions = extract_questions(HTML_FILE)
    print(f"Total de questões: {len(questions)}")

    batch   = questions[args.start:args.end]
    results = []
    errors  = []
    stats   = {"manter": 0, "corrigir_gabarito": 0, "corrigir_explicacao": 0,
               "corrigir_gabarito_e_explicacao": 0, "reescrever": 0, "excluir": 0,
               "escalated": 0}

    for i, q in enumerate(batch, start=args.start):
        topic = q.get("t", f"Q{i}")
        print(f"[{i+1}/{args.end}] {topic[:55]}...", end=" ", flush=True)
        try:
            parsed = review_question(client, q, i, args.model, args.effort)
            model_used = args.model

            # Escalonamento
            if not args.no_escalate and should_escalate(parsed):
                print(f"{parsed.get('veredito','?')}→escalando", end=" ", flush=True)
                try:
                    parsed = review_question(client, q, i, args.escalate_model, args.effort)
                    model_used = args.escalate_model
                    stats["escalated"] += 1
                except Exception as e2:
                    print(f"(escala falhou: {e2})", end=" ", flush=True)

            parsed["_t"]     = q.get("t", "")
            parsed["_idx"]   = i
            parsed["_diff"]  = q.get("diff", "medium")
            parsed["_cat"]   = q.get("cat", "")
            parsed["_refs"]  = q.get("refs", [])
            parsed["_model"] = model_used
            results.append(parsed)

            v = parsed.get("veredito", "?")
            stats[v] = stats.get(v, 0) + 1
            print(f"{v} [{parsed.get('confianca','?')}]")
        except Exception as e:
            print(f"ERRO: {e}")
            errors.append({"idx": i, "topic": topic, "error": str(e)})
            results.append({**q, "_idx": i, "_t": q.get("t",""), "_error": str(e)})

        time.sleep(SLEEP_SEC)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nSalvo em {args.out}")
    print(f"Revisadas: {len(results) - len(errors)} | Erros: {len(errors)}")
    print("Vereditos:", {k: v for k, v in stats.items() if v > 0})
    if errors:
        print("Questões com erro:", [e["idx"] for e in errors])

if __name__ == "__main__":
    main()
