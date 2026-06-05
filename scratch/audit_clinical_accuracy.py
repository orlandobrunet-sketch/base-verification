import json
import re

with open("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/topics.js", "r", encoding="utf-8") as f:
    content = f.read()

# Simple parser to extract raw topics
start_marker = "const topics = ["
start_idx = content.find(start_marker) + len(start_marker)
bracket_count = 1
end_idx = start_idx
while bracket_count > 0 and end_idx < len(content):
    char = content[end_idx]
    if char == '[':
        bracket_count += 1
    elif char == ']':
        bracket_count -= 1
    end_idx += 1

array_str = content[start_idx:end_idx-1]

# Balance curly braces
objects = []
brace_count = 0
obj_start = 0
in_string = False
escape = False

for i, char in enumerate(array_str):
    if escape:
        escape = False
        continue
    if char == '\\':
        escape = True
        continue
    if char == '"':
        in_string = not in_string
        continue
    if not in_string:
        if char == '{':
            if brace_count == 0:
                obj_start = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                objects.append(array_str[obj_start:i+1])

parsed_topics = []
for idx, obj in enumerate(objects):
    cleaned = re.sub(r'//.*$', '', obj, flags=re.MULTILINE)
    try:
        parsed = json.loads(cleaned)
        parsed_topics.append(parsed)
    except Exception as e:
        # Fallback using regex to extract fields
        qid = re.search(r'"qid":\s*"([^"]+)"', cleaned)
        qid = qid.group(1) if qid else f"unknown_{idx}"
        t = re.search(r'"t":\s*"([^"]+)"', cleaned)
        t = t.group(1) if t else ""
        q = re.search(r'"q":\s*"([^"]+)"', cleaned)
        q = q.group(1) if q == "" else ""
        exp = re.search(r'"exp":\s*"([^"]+)"', cleaned)
        exp = exp.group(1) if exp else ""
        opts_match = re.search(r'"opts":\s*\[(.*?)\]', cleaned, re.DOTALL)
        opts_matches = re.findall(r'"([^"]+)"', opts_match.group(1)) if opts_match else []
        ans = re.search(r'"ans":\s*(\d+)', cleaned)
        ans = int(ans.group(1)) if ans else 0
        diff = re.search(r'"diff":\s*"([^"]+)"', cleaned)
        diff = diff.group(1) if diff else ""
        cat = re.search(r'"cat":\s*"([^"]+)"', cleaned)
        cat = cat.group(1) if cat else ""
        refs_match = re.search(r'"refs":\s*\[(.*?)\]', cleaned, re.DOTALL)
        refs_matches = re.findall(r'"([^"]+)"', refs_match.group(1)) if refs_match else []
        parsed_topics.append({
            "qid": qid, "t": t, "q": q, "exp": exp,
            "opts": opts_matches, "ans": ans, "diff": diff, "cat": cat, "refs": refs_matches
        })

issues = []

# Audit BP Targets and other topics
for q in parsed_topics:
    qid = q.get("qid")
    t_text = q.get("t", "")
    q_text = q.get("q", "")
    exp_text = q.get("exp", "")
    opts = q.get("opts", [])
    ans = q.get("ans", 0)
    
    if qid in ["e56795a6", "1e0e571c"]:
        issues.append({
            "severity": "dangerous",
            "qid": qid,
            "title": t_text,
            "axis": "hipertensao / kdigo",
            "problem": "Meta de PAS na DRC desatualizada/incorreta (< 130 mmHg como resposta correta e alegando que < 120 mmHg não é recomendada, contradizendo o KDIGO 2021/2024 e o estudo BPROAD).",
            "current_ans": opts[ans] if ans < len(opts) else "unknown",
            "suggested_ans": "PAS < 120 mmHg (medida de forma padronizada)",
            "evidence": "KDIGO 2021/2024 recomendam meta de PAS < 120 mmHg em DRC não dialítica. O BPROAD (2024) confirmou esse benefício em DM2 + DRC.",
            "pedagogical_risk": "Ensina conduta incorreta e desatualizada aos alunos, gerando confusão com outras questões do próprio app (ex: e8a59de8) que trazem o alvo correto de < 120 mmHg.",
            "correction": "Corrigir o gabarito e a explicação de e56795a6 para apontar < 120 mmHg como correto, e atualizar 1e0e571c."
        })
        
    if qid == "920621f6":
        issues.append({
            "severity": "ruim",
            "qid": qid,
            "title": t_text,
            "axis": "acido_base / drc",
            "problem": "Alucinação na referência da explicação (cita o estudo CONVINCE para a suplementação de bicarbonato na DRC).",
            "current_ans": opts[ans] if ans < len(opts) else "unknown",
            "suggested_ans": opts[ans] if ans < len(opts) else "unknown",
            "evidence": "O estudo CONVINCE avaliou hemodiafiltração de alta dose vs hemodiálise de alto fluxo, não tendo qualquer relação com bicarbonato oral para acidose metabólica na DRC.",
            "pedagogical_risk": "Cita evidência científica errada e inexistente para apoiar um tratamento clínico, comprometendo o rigor acadêmico do app.",
            "correction": "Substituir a citação do estudo CONVINCE por referências adequadas (como as diretrizes KDIGO CKD ou estudos clássicos de repor bicarbonato, ex: de Brito-Ashurst, 2009)."
        })

    if qid == "9961a406":
        issues.append({
            "severity": "regular",
            "qid": qid,
            "title": t_text,
            "axis": "glomerular / kdigo",
            "problem": "Recomendação de óleo de peixe na nefropatia por IgA desatualizada.",
            "current_ans": opts[ans] if ans < len(opts) else "unknown",
            "suggested_ans": "KDIGO 2021 sugere não utilizar óleo de peixe rotineiramente (Grau 2D), priorizando SRAA, iSGLT2 e imunossupressão conforme risco.",
            "evidence": "Diretriz KDIGO 2021 de Glomerulopatias desaconselha o uso rotineiro de ômega-3, ao contrário da diretriz de 2012 que o considerava.",
            "pedagogical_risk": "Ensina conduta de suporte desatualizada (óleo de peixe), que perdeu espaço para os inibidores de SGLT2 e novos agentes específicos (como sparsentan e Nefecon).",
            "correction": "Atualizar a questão e a explicação para destacar que o óleo de peixe não é mais recomendado de rotina pelo KDIGO 2021/2024."
        })

# Let's count ERC usages
erc_count = 0
for q in parsed_topics:
    combined = (q.get("t", "") + " " + q.get("q", "") + " " + q.get("exp", "")).lower()
    if "erc" in combined:
        erc_count += 1

print(f"Found {erc_count} topics using 'ERC'.")

# Save issues
with open("scratch/clinical_audit_issues.json", "w", encoding="utf-8") as out:
    json.dump(issues, out, ensure_ascii=False, indent=2)

print(f"Audited clinical issues saved. Total specific issues documented: {len(issues)}")
