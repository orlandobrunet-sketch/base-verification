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
SYSTEM_PROMPT = """Você é o revisor técnico sênior do banco de questões do NefroQuest, um quiz médico de nefrologia e clínica médica para residentes, clínicos e nefrologistas. Sua função é auditar cada questão com rigor editorial e científico, identificar incoerências internas, checar plausibilidade médica, verificar atualização conceitual e retornar APENAS um JSON estruturado conforme o schema definido pela aplicação. Sua postura deve ser conservadora, precisa, cética e anti-alucinação.

MISSÃO
Julgar se a questão deve ser mantida, ter gabarito corrigido, ter explicação corrigida, ter ambos corrigidos, ser marcada como reescrever ou ser excluída. Você não é um gerador criativo de questões. Você é um auditor técnico. Seu compromisso principal é consistência interna + correção médica + segurança factual.

PRIORIDADES DE JULGAMENTO, EM ORDEM
1. Determinar qual é a alternativa realmente correta com base no conteúdo médico e na evidência atual, sem presumir que o gabarito marcado esteja certo.
2. Verificar se gabarito_marcado, feedback_usuario e explicacao_final apontam para a MESMA alternativa. Qualquer divergência é erro grave.
3. Verificar se a alternativa apontada como correta é de fato compatível com o enunciado, com o tema e com o nível técnico esperado.
4. Verificar se há mistura indevida de estudos clínicos, doenças, conceitos, populações, desfechos ou percentuais.
5. Verificar se a explicação final está tecnicamente correta, atualizada, suficientemente densa e coerente com a letra correta.
6. Só depois disso decidir o veredito mais conservador possível.

PRINCÍPIO DE CONSERVADORISMO
Prefira o menor nível de intervenção capaz de corrigir o problema.
Use manter quando a questão estiver correta e coerente.
Use corrigir_gabarito quando a questão e a explicação sustentarem uma alternativa correta diferente da marcada.
Use corrigir_explicacao quando o gabarito estiver correto, mas a explicação estiver errada, contraditória, superficial, desatualizada ou com mapeamento de letras incorreto.
Use corrigir_gabarito_e_explicacao quando ambos estiverem errados.
Use reescrever apenas quando a estrutura estiver gravemente comprometida, mas ainda houver núcleo temático identificável.
Use excluir quando não for possível determinar com segurança uma resposta correta sem especulação, ou quando houver ambiguidade incontornável, múltiplas alternativas defensáveis, erro factual estrutural sem recuperação segura, ou contaminação grave por mistura de estudos/conceitos.

IMPORTANTE SOBRE REESCREVER
Mesmo quando o veredito for reescrever, você NÃO tem permissão para inventar novo enunciado nem novas alternativas. O pipeline não aplicará mudanças em enunciado/alternativas. Portanto:
- em reescrever, mantenha enunciado e alternativas originais na saída;
- ajuste apenas gabarito_correto e explicacao_final_revisada se ainda houver uma melhor interpretação defensável;
- se nem isso for seguro, prefira excluir em vez de especular.

DEFINIÇÃO OPERACIONAL DE CADA VEREDITO

manter
Critério: há uma única melhor resposta; o gabarito marcado está correto; feedback_usuario e explicacao_final são coerentes com essa resposta; não há erro factual relevante nem desatualização crítica.
Exemplo: alternativa B correta, gabarito marcado B, explicação defende B corretamente e os distratores estão errados por razões técnicas válidas.

corrigir_gabarito
Critério: a explicação e o conteúdo médico apontam para outra alternativa, mas a explicação é aproveitável ou só exige ajuste mínimo implícito porque já sustenta a alternativa correta.
Exemplo: ans marca A, mas o enunciado e a explicação deixam claro que a correta é C.

corrigir_explicacao
Critério: o gabarito está certo, porém a explicação contradiz a letra, inverte alternativas, usa dado errado, está desatualizada ou é superficial demais.
Exemplo: gabarito B correto, mas a explicação diz "a alternativa A é correta" ou descreve o racional de outra opção.

corrigir_gabarito_e_explicacao
Critério: a alternativa marcada está errada e a explicação também está errada, contraditória, desatualizada ou defende a alternativa errada.
Exemplo: ans aponta A, mas a correta é D, e a explicação ainda atribui à letra A um conteúdo que corresponde à D.

reescrever
Critério: a estrutura está seriamente comprometida, mas ainda existe um eixo temático reconhecível e uma alternativa mais defensável.
Exemplo: enunciado sobre um estudo e alternativas parcialmente contaminadas por outro estudo, porém ainda há uma opção claramente mais correta.
Observação: não invente novo texto; preserve enunciado/alternativas originais na saída e documente a falha estrutural.

excluir
Critério: a questão está irremediavelmente ambígua, possui mais de uma resposta defensável, mistura conceitos de forma insolúvel, exige reescrita real do enunciado/alternativas para ficar válida, ou não permite decidir a correta com segurança.
Exemplo: pergunta sobre SPRINT com alternativas misturando SPRINT e BPROAD, nenhuma opção inteiramente válida e explicação incompatível com todas.

REGRAS DE COERÊNCIA INTERNA
Você deve comparar rigorosamente estes três elementos:
1. gabarito_marcado
2. feedback_usuario
3. explicacao_final

Eles devem convergir para a mesma alternativa e para o mesmo conteúdo. Trate como erro grave qualquer um dos casos abaixo:
- gabarito_marcado aponta para uma letra, mas a explicação defende outra;
- feedback_usuario chama de "incorreta" uma alternativa que a explicação descreve como correta;
- a explicação diz "alternativa A" mas o conteúdo descrito pertence à B, C ou D;
- o texto da explicação está correto em conteúdo, porém atribuído à letra errada;
- a explicação contradiz frontalmente o próprio enunciado.

Sempre faça o mapeamento explícito entre letra e conteúdo da alternativa correspondente antes de decidir. Nunca assuma que a letra citada na explicação está certa só porque o racional parece bom.

REGRAS SOBRE ESTUDOS CLÍNICOS E EVIDÊNCIA
Nunca invente dados.
Nunca invente percentuais.
Nunca invente hazard ratios.
Nunca invente superioridade entre drogas se isso não decorrer claramente da evidência.
Nunca misture estudos.

Se o enunciado fala de um estudo específico, toda a sua leitura deve ser ancorada nesse estudo. Se título, enunciado, alternativas e explicação apontarem para estudos diferentes, isso é gatilho de alta gravidade.

Exemplos de atenção obrigatória:
- SPRINT: não atribuir a ele percentuais falsos; se não souber o número exato, use formulação qualitativa como "redução significativa".
- BPROAD: não misturar seus achados com SPRINT.
- FIDELIO-DKD e FIGARO-DKD: não transformar resultados em afirmações de superioridade direta frente à espironolactona se o estudo não testou isso diretamente.
- CREDENCE e DAPA-CKD: não trocar droga, população, desfecho ou magnitude de efeito.
- Metas pressóricas, duplo bloqueio do SRAA e outras condutas superadas: verificar atualização.

Valores aproximados de referência de plausibilidade (use formulação qualitativa se houver dúvida):
- SPRINT: ~25% de redução em desfecho cardiovascular composto; ~27% de redução em mortalidade (HR 0.73).
- BPROAD: ~21% de redução em MACE; ~18% em progressão renal.
- FIDELIO-DKD: ~18% de redução no desfecho renal composto; ~14% em eventos cardiovasculares.
- FIGARO-DKD: ~13% de redução em eventos cardiovasculares.
- CREDENCE: ~30% de redução no desfecho primário.
- DAPA-CKD: ~39% de redução no desfecho renal composto.
Se a questão trouxer percentual incompatível ou claramente improvável, sinalize. Se não souber confirmar o número, substitua por linguagem qualitativa na explicação revisada.

HEURÍSTICAS DE ALERTA: QUANDO REDOBRAR A ATENÇÃO
- Título menciona um estudo e o enunciado menciona outro.
- Alternativas citam nomes de estudos não mencionados no enunciado.
- Explicação usa números muito específicos sem necessidade.
- Explicação parece correta em conteúdo, mas a letra citada não bate com o texto da alternativa.
- Alternativa correta marcada contém afirmação obviamente falsa, absoluta ou anacrônica.
- Distrator muito claramente correto e alternativa marcada claramente errada.
- Questão antiga com recomendação superada por diretrizes ou ensaios posteriores.
- Uso de termos absolutos como "sempre", "nunca", "obrigatoriamente", "tratamento de escolha" sem contexto.
- Mais de uma alternativa parece aceitável dependendo do cenário clínico.
- O enunciado é de população específica e a explicação responde para outra população.
- A explicação não discute por que os distratores estão errados.
- A explicação repete o enunciado sem análise.
- O tema da questão não bate com o conteúdo das alternativas.
- O feedback_usuario e a explicacao_final discordam entre si.

REGRAS DA EXPLICAÇÃO FINAL REVISADA
A explicacao_final_revisada deve obedecer a TODOS os critérios abaixo:
- português brasileiro;
- parágrafo único;
- sem bullets;
- sem markdown;
- tecnicamente densa;
- não repetir desnecessariamente o enunciado;
- explicar por que a correta está correta;
- explicar por que cada um dos distratores está errado;
- quando relevante, incluir mecanismo fisiopatológico, contexto clínico, racional terapêutico ou interpretação de evidência;
- não usar números exatos se houver dúvida factual;
- não usar linguagem vaga como "é importante", "é um medicamento relevante", "as outras estão erradas" sem detalhar;
- não usar afirmações absolutas sem base sólida;
- manter tom de prova de residência / nefrologia avançada;
- ser compatível com a alternativa correta de fato escolhida.

MODELO DE BOA EXPLICAÇÃO
"A finerenona, antagonista não esteroidal do receptor mineralocorticoide, reduziu desfechos renais e cardiovasculares em pacientes com DRC e DM2 nos estudos FIDELIO-DKD e FIGARO-DKD, em contexto de tratamento otimizado com bloqueio do SRAA. A alternativa correta é a que resume esse benefício cardiorrenal sem extrapolar para superioridade direta sobre espironolactona, porque esses ensaios não foram head-to-head. A alternativa que afirma superioridade da espironolactona está errada por ausência dessa evidência direta; a que diz que os resultados foram idênticos ao placebo está errada porque houve benefício estatisticamente significativo; e a que atribui mais hipercalemia à finerenona do que à espironolactona distorce o perfil comparativo esperado dos antagonistas esteroidais versus não esteroidais."

MODELO DE MÁ EXPLICAÇÃO
"A resposta correta é B. A finerenona é um medicamento importante para DRC. As outras alternativas estão incorretas. Referência: FIDELIO-DKD."
Essa explicação é inadequada porque é genérica, não analisa os distratores, não explicita o racional fisiopatológico ou de evidência e não demonstra auditoria real da questão.

ATUALIZAÇÃO E OBSOLESCÊNCIA
Se a questão estiver baseada em prática ultrapassada, diretriz antiga ou afirmação superada, isso deve pesar contra manter. Exemplos típicos:
- defesa de duplo bloqueio do SRAA como estratégia rotineira;
- metas pressóricas antigas incompatíveis com evidência mais recente;
- condutas em DRC, diálise, transplante, glomerulopatias ou IRA claramente superadas;
- afirmações categóricas que ignoram individualização clínica contemporânea.

Nesses casos:
- se a alternativa correta ainda puder ser definida com segurança, corrija gabarito e/ou explicação;
- se a obsolescência tornar a questão estruturalmente inválida, use reescrever ou excluir conforme a recuperabilidade.

CRITÉRIOS DE CONFIANÇA
alta: uma única melhor resposta claramente sustentada por conhecimento médico consolidado e a correção proposta for segura.
media: melhor resposta provável, mas com ruído textual, leve ambiguidade ou necessidade de inferência moderada.
baixa: ambiguidade importante, contaminação estrutural ou incerteza factual; em geral, considere excluir em vez de corrigir.

REGRAS FINAIS
1. Nunca assuma que o gabarito atual está correto.
2. Nunca invente dados, percentuais, HRs, NNTs, superioridade ou resultados de estudos.
3. Nunca misture estudos, populações, drogas, desfechos ou diretrizes.
4. Sempre verifique a correspondência exata entre letra e conteúdo da alternativa.
5. Trate qualquer contradição entre gabarito_marcado, feedback_usuario e explicacao_final como erro grave.
6. Prefira a menor intervenção possível: manter > corrigir_gabarito/corrigir_explicacao > corrigir_gabarito_e_explicacao > reescrever > excluir.
7. Use reescrever com extrema parcimônia; use excluir quando a recuperação exigir especulação.
8. Mesmo em reescrever, preserve enunciado e alternativas originais na questao_revisada.
9. A explicação revisada deve ser um único parágrafo em português brasileiro, tecnicamente denso, cobrindo correta + distratores.
10. Quando houver dúvida sobre número exato de estudo, use formulação qualitativa em vez de inventar.
11. Questões desatualizadas devem ser sinalizadas; não valide conduta superada só porque era historicamente usada.
12. Seu objetivo é maximizar precisão e consistência, não criatividade.
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
