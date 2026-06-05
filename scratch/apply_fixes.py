import re
import json

def get_question_block(content, qid):
    # Find position of qid
    qid_idx = content.find(f'"qid": "{qid}"')
    if qid_idx == -1:
        # try single quotes or spaces
        qid_idx = content.find(f'"qid":"{qid}"')
    if qid_idx == -1:
        return None, -1, -1
        
    # Walk backward to find the opening '{' of this object
    # We should track curly braces balance to be robust, but since it's formatted,
    # we can walk backwards to find the nearest '{' at the start of a line.
    start_idx = qid_idx
    while start_idx > 0:
        if content[start_idx] == '{' and (start_idx == 0 or content[start_idx-1] == '\n' or content[start_idx-2:start_idx] == '\r\n' or content[start_idx-4:start_idx] == '    ' or content[start_idx-2:start_idx] == '  '):
            break
        start_idx -= 1
        
    # Walk forward to find the matching closing '}'
    brace_count = 1
    end_idx = start_idx + 1
    in_string = False
    escape = False
    
    while brace_count > 0 and end_idx < len(content):
        char = content[end_idx]
        if escape:
            escape = False
            end_idx += 1
            continue
        if char == '\\':
            escape = True
            end_idx += 1
            continue
        if char == '"':
            in_string = not in_string
            end_idx += 1
            continue
        if not in_string:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
        end_idx += 1
        
    # Include the trailing comma if present
    if end_idx < len(content) and content[end_idx] == ',':
        end_idx += 1
        
    return content[start_idx:end_idx], start_idx, end_idx

# Let's define the corrected versions of our target questions in topics.js
corrections_topics = {
    "e56795a6": """  {
    "t": "Controle de PA na DRC e Diabetes Tipo 2",
    "qid": "e56795a6",
    "q": "Segundo as diretrizes KDIGO 2021, qual é a meta de pressão arterial sistólica (PAS) recomendada para reduzir o risco de eventos cardiovasculares e progressão da doença renal crônica (DRC) em pacientes com diabetes tipo 2 (DM2) e alto risco cardiovascular?",
    "refs": [
      "bproad",
      "kdigo_ckd"
    ],
    "opts": [
      "PAS < 130 mmHg",
      "PAS < 120 mmHg (medida de forma padronizada em consultório)",
      "PAS < 140 mmHg",
      "PAD < 80 mmHg como alvo primário isolado"
    ],
    "ans": 1,
    "exp": "As diretrizes KDIGO 2021 de Pressão Arterial recomendam uma meta de pressão arterial sistólica inferior a 120 mmHg para pacientes adultos com doença renal crônica (DRC) não dialítica quando a pressão é medida de forma padronizada em consultório (Grau 2B), meta que se aplica também aos pacientes com diabetes tipo 2 (DM2). Evidências do estudo SPRINT e, mais recentemente, do estudo BPROAD (2024) confirmam que o controle intensivo de PAS com alvo < 120 mmHg reduz significativamente eventos cardiovasculares maiores nessa população. A meta de < 130 mmHg, embora adotada em diretrizes de diabetes como a ADA, é menos estrita do que o recomendado pelo KDIGO para a proteção cardiovascular no contínuo renal.",
    "diff": "medium",
    "cat": "hipertensao"
  }""",
    
    "1e0e571c": """  {
    "t": "Hipertensão e Rins",
    "qid": "1e0e571c",
    "q": "Sobre o tratamento de HAS em DRC com proteinúria, qual a meta de PA e o agente de primeira linha segundo o KDIGO 2021?",
    "opts": [
      "PAS < 140 mmHg; bloqueador dos canais de cálcio em monoterapia",
      "PAS < 120 mmHg (medida padronizada em consultório); IECA ou BRA como primeira linha",
      "PAS < 130 mmHg; betabloqueador em associação a diurético de alça",
      "PAS < 150 mmHg; qualquer anti-hipertensivo tolerado pelo paciente"
    ],
    "ans": 1,
    "exp": "De acordo com a diretriz KDIGO 2021, o alvo terapêutico recomendado para adultos com hipertensão e DRC não dialítica (incluindo aqueles com proteinúria) é a pressão arterial sistólica (PAS) < 120 mmHg, desde que medida de forma padronizada em consultório. Em pacientes com proteinúria significativa (ACR ≥ 300 mg/g ou equivalente), os inibidores do SRAA (IECA ou BRA) são agentes de primeira linha obrigatórios devido ao seu efeito antiproteinúrico específico e à redução do ritmo de progressão da DRC. A combinação de IECA e BRA é contraindicada (como demonstrado no ONTARGET).",
    "diff": "medium",
    "cat": "hipertensao"
  }""",

    "920621f6": """  {
    "t": "Acidose metabólica na DRC",
    "qid": "920621f6",
    "q": "Paciente com DRC avançada e bicarbonato sérico 17 mEq/L. Qual conduta é mais apropriada?",
    "opts": [
      "Ignorar acidose leve/moderada por não impactar progressão",
      "Induzir alcalose metabólica para reduzir proteinúria em amostra isolada",
      "Corrigir acidose metabólica de forma gradual para meta clínica, monitorando sódio e volume",
      "Usar reposição intravenosa crônica em ambulatório estável"
    ],
    "ans": 2,
    "exp": "A acidose metabólica crônica na DRC (bicarbonato sérico < 22 mEq/L) deve ser corrigida gradualmente, geralmente com bicarbonato de sódio oral, visando uma meta de bicarbonato sérico entre 22-24 mEq/L. Essa intervenção demonstrou reduzir a progressão da DRC, melhorar o metabolismo ósseo e proteico, e diminuir a inflamação, conforme demonstrado em ensaios clínicos clássicos como o de de Brito-Ashurst (2009) e o estudo UBi. A correção deve ser monitorizada para evitar sobrecarga de sódio e volume, especialmente em pacientes com doença cardíaca ou hipertensão.",
    "diff": "medium",
    "cat": "acido_base"
  }""",

    "9961a406": """  {
    "t": "Nefropatia por IgA e Óleo de Peixe (KDIGO)",
    "qid": "9961a406",
    "q": "Paciente com nefropatia por IgA, proteinúria de 1,5 g/dia após 3 meses de tratamento com inibidor da enzima conversora de angiotensina (IECA) em dose máxima, e função renal estável. O nefrologista considera a adição de óleo de peixe (ômega-3) ao tratamento. Qual é a recomendação atual do KDIGO sobre o uso de óleo de peixe na nefropatia por IgA?",
    "opts": [
      "É formalmente contraindicada devido ao risco aumentado de sangramento associado a mecanismos de anticoagulação",
      "É recomendada como primeira linha de tratamento para todos os pacientes com nefropatia por IgA, independentemente da proteinúria",
      "Não é recomendado de rotina pelo KDIGO 2021 (Sugere-se não utilizar - Grau 2D), dada a inconsistência das evidências históricas",
      "Pode substituir completamente o uso de inibidores da ECA ou bloqueadores dos receptores da angiotensina, sem necessidade de ajuste renal"
    ],
    "ans": 2,
    "exp": "A diretriz KDIGO 2021 de Glomerulopatias recomenda não utilizar óleo de peixe (ômega-3) de forma rotineira para o tratamento da nefropatia por IgA (Grau 2D), alterando o posicionamento mais permissivo de 2012. Isso se deve à fraqueza e inconsistência das evidências de benefício renal sustentado e ao advento de terapias de suporte mais eficazes, como os inibidores de SGLT2. O bloqueio do SRAA com IECA/BRA em dose máxima tolerada permanece como a base do tratamento de suporte inicial obrigatório.",
    "diff": "medium",
    "cat": "glomerular"
  }"""
}

# Apply Corrections in topics.js
with open("data/topics.js", "r", encoding="utf-8") as f:
    topics_text = f.read()

print("Applying specific QID corrections in topics.js:")
for qid, corrected_block in corrections_topics.items():
    block, start, end = get_question_block(topics_text, qid)
    if start != -1:
        # Check if the block has a trailing comma in the original file
        original_has_comma = block.strip().endswith(",")
        corrected_block_formatted = corrected_block
        if original_has_comma and not corrected_block_formatted.strip().endswith(","):
            corrected_block_formatted = corrected_block_formatted.rstrip() + ","
        elif not original_has_comma and corrected_block_formatted.strip().endswith(","):
            corrected_block_formatted = corrected_block_formatted.rstrip().rstrip(",")
            
        topics_text = topics_text[:start] + corrected_block_formatted + topics_text[end:]
        print(f"  - QID {qid} corrected.")
    else:
        print(f"  - Error: QID {qid} block not found!")

# Bulk replacements in topics.js
print("\nApplying spelling corrections and term standardizations in topics.js:")

# 1. Spelling corrections
topics_text, count1 = re.subn(r'estruvite', 'estruvita', topics_text, flags=re.IGNORECASE)
topics_text, count2 = re.subn(r'amónio', 'amônio', topics_text, flags=re.IGNORECASE)
print(f"  - 'estruvite' -> 'estruvita' replaced {count1} times.")
print(f"  - 'amónio' -> 'amônio' replaced {count2} times.")

# 2. General term consistency: SGLT2i -> iSGLT2 (checking word boundaries)
# We don't want to replace lowercase sglt2i inside URLs or category filters, let's replace as standalone word:
topics_text, count3 = re.subn(r'\bSGLT2i\b', 'iSGLT2', topics_text)
topics_text, count4 = re.subn(r'\bsglt2i\b', 'isglt2', topics_text)
print(f"  - 'SGLT2i' -> 'iSGLT2' replaced {count3} times.")
print(f"  - 'sglt2i' -> 'isglt2' replaced {count4} times.")

# 3. Standardize 'Insuficiência Renal Aguda' -> 'Lesão Renal Aguda' in questions and explanations
topics_text, count5 = re.subn(r'Insuficiência\s+Renal\s+Aguda', 'Lesão Renal Aguda', topics_text)
topics_text, count6 = re.subn(r'insuficiência\s+renal\s+aguda', 'lesão renal aguda', topics_text)
print(f"  - 'Insuficiência Renal Aguda' -> 'Lesão Renal Aguda' replaced {count5} times.")
print(f"  - 'insuficiência renal aguda' -> 'lesão renal aguda' replaced {count6} times.")

# Write back topics.js
with open("data/topics.js", "w", encoding="utf-8") as f:
    f.write(topics_text)
print("topics.js updated successfully.")


# Bulk replacements in rapid-quiz.js
print("\nApplying spelling and term standardizations in rapid-quiz.js:")
with open("data/rapid-quiz.js", "r", encoding="utf-8") as f:
    rapid_text = f.read()

rapid_text, count_rq1 = re.subn(r'estruvite', 'estruvita', rapid_text, flags=re.IGNORECASE)
rapid_text, count_rq2 = re.subn(r'amónio', 'amônio', rapid_text, flags=re.IGNORECASE)
rapid_text, count_rq3 = re.subn(r'\bSGLT2i\b', 'iSGLT2', rapid_text)
rapid_text, count_rq4 = re.subn(r'\bsglt2i\b', 'isglt2', rapid_text)
rapid_text, count_rq5 = re.subn(r'Insuficiência\s+Renal\s+Aguda', 'Lesão Renal Aguda', rapid_text)
rapid_text, count_rq6 = re.subn(r'insuficiência\s+renal\s+aguda', 'lesão renal aguda', rapid_text)

print(f"  - 'estruvite' -> 'estruvita': {count_rq1}")
print(f"  - 'amónio' -> 'amônio': {count_rq2}")
print(f"  - 'SGLT2i' -> 'iSGLT2': {count_rq3}")
print(f"  - 'sglt2i' -> 'isglt2': {count_rq4}")
print(f"  - 'Insuficiência Renal Aguda' -> 'Lesão Renal Aguda': {count_rq5}")
print(f"  - 'insuficiência renal aguda' -> 'lesão renal aguda': {count_rq6}")

with open("data/rapid-quiz.js", "w", encoding="utf-8") as f:
    f.write(rapid_text)
print("rapid-quiz.js updated successfully.")
