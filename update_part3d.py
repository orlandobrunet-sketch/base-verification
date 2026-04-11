#!/usr/bin/env python3
"""Part 3d: Add final batch of 12 new questions."""

with open('index.html', encoding='utf-8') as f:
    html = f.read()

new_questions = [
    # Q90 — HOPE HIV
    {
        "t": "Transplante Renal HIV-para-HIV (HOPE Act)",
        "q": "O HOPE Act permitiu transplantes de doadores HIV+ para receptores HIV+. Qual o principal achado do estudo HOPE?",
        "opts": ["Alta taxa de rejeição aguda", "Resultados similares ao transplante HIV-negativo em 1 ano", "Transmissão de cepa viral resistente", "Necessidade de suspender TARV"],
        "ans": 1,
        "exp": "O estudo HOPE (NEJM 2019) demonstrou que transplantes de rins de doadores HIV+ para receptores HIV+ apresentam resultados de funcao do enxerto e sobrevida similares ao transplante convencional em 1 ano, com gerenciamento adequado da TARV.",
        "diff": "hard",
        "cat": "transplante",
        "refs": ["hiv_kidney_cohen", "kdigo_tx"]
    },
    # Q91 — Cistinose
    {
        "t": "Cistinose — Tratamento com Cisteamina",
        "q": "Qual o mecanismo de ação da cisteamina no tratamento da cistinose?",
        "opts": ["Inibição da produção de cistina", "Converte cistina em cisteína + cisteína-mista, facilitando saída do lisossomo", "Bloqueio do transportador CTNS", "Redução da reabsorção tubular proximal"],
        "ans": 1,
        "exp": "A cisteamina reage com a cistina intracelular para formar cisteina e um dissulfeto misto (cisteina-cisteamina), que podem sair do lisossomo via transportador de lisina, reduzindo o acumulo intracelular de cistina.",
        "diff": "hard",
        "cat": "genetica",
        "refs": ["alport_syndrome_review", "kdigo_ckd"]
    },
    # Q92 — Checkpoint LRA
    {
        "t": "Nefrite por Inibidores de Checkpoint Imunológico",
        "q": "Qual o padrão histológico mais comum de lesão renal causada por inibidores de checkpoint (anti-PD1/PDL1)?",
        "opts": ["Glomerulonefrite membranosa", "Nefrite Tubulointersticial Aguda (NIA)", "GN por IgA", "Nefrose lipídica"],
        "ans": 1,
        "exp": "A NIA por anti-PD1/PDL1 pode ocorrer meses apos o inicio do tratamento. O diagnostico diferencial com outras causas de LRA e vital, pois o tratamento requer suspensao da droga e pulsoterapia com corticoides (prednisona 1 mg/kg).",
        "diff": "medium",
        "cat": "lra",
        "refs": ["kdigo_aki", "kdigo_gn"]
    },
    # Q94 — Dieta hipoproteica
    {
        "t": "Dieta Hipoproteica com Cetoanálogos na DRC",
        "q": "Qual a principal vantagem da dieta muito hipoproteica (0,3-0,4 g/kg/dia) suplementada com cetoanálogos na DRC avançada?",
        "opts": ["Aumento da massa muscular", "Retardo do início da diálise com redução de toxinas urêmicas e fósforo", "Melhora da anemia", "Redução da hipercalemia aguda"],
        "ans": 1,
        "exp": "Dietas muito hipoproteicas suplementadas com cetoanologos podem retardar o inicio da dialise em pacientes motivados, reduzindo a geracao de toxinas uremicas e a sobrecarga de fosforo. Requerem monitoracao nutricional rigorosa.",
        "diff": "medium",
        "cat": "tratamento",
        "refs": ["kdigo_ckd", "kdigo_ckd_guideline"]
    },
    # Q97 — Mielinólise pontina
    {
        "t": "Mielinólise Pontina Central — Prevenção",
        "q": "Para prevenir a mielinólise pontina central (síndrome de desmielinização osmótica) na correção da hiponatremia severa, qual a taxa máxima de correção recomendada?",
        "opts": ["Até 20 mEq/L nas primeiras 24h", "Até 10 mEq/L nas primeiras 24h", "Até 5 mEq/L nas primeiras 24h", "Até 25 mEq/L nas primeiras 48h"],
        "ans": 1,
        "exp": "A correcao da hiponatremia deve ser limitada a 8-10 mEq/L nas primeiras 24h e 18 mEq/L em 48h. Hipercorrecao causa desmielinizacao osmótica irreversivel. Em hiponatremia cronica grave, preferir correcao ainda mais lenta (6-8 mEq/L/24h).",
        "diff": "medium",
        "cat": "acido-base",
        "refs": ["hyponatremia_verbalis2022", "hyponatremia_adrogue2000"]
    },
    # Q98 — EVALUATE
    {
        "t": "Estudo EVALUATE — Diálise vs Tratamento Conservador em Idosos",
        "q": "O estudo EVALUATE (NEJM 2023) comparou diálise a tratamento conservador em pacientes com DRC terminal com mais de 75 anos. Qual o principal achado?",
        "opts": ["Diálise aumentou significativamente a sobrevida", "Sem diferença significativa em sobrevida; diálise associada a mais hospitalizações", "Tratamento conservador foi superior em qualidade de vida e sobrevida", "Diálise melhorou qualidade de vida"],
        "ans": 1,
        "exp": "O EVALUATE mostrou que em idosos frágeis (> 75 anos), a dialise nao conferiu beneficio significativo de sobrevida comparado ao tratamento conservador, mas esteve associada a maior carga de hospitalizacoes. Decisao deve ser individualizada e centrada no paciente.",
        "diff": "hard",
        "cat": "dialise",
        "refs": ["evaluate_trial", "kdigo_ckd"]
    },
    # Q99 — Hiato aniônico urinário
    {
        "t": "Hiato Aniônico Urinário (HAU) nas Acidoses",
        "q": "O Hiato Aniônico Urinário (HAU = Na+u + K+u − Cl−u) é negativo (< 0) em qual situação?",
        "opts": ["Acidose Tubular Renal tipo 1 (distal)", "Acidose Tubular Renal tipo 4", "Acidose por diarreia (perda de HCO3 intestinal)", "Cetoacidose diabética"],
        "ans": 2,
        "exp": "HAU negativo indica aumento de NH4+ urinario (acidificacao renal preservada) — tipico de acidose extrarenal (diarreia). HAU positivo indica incapacidade renal de excretar NH4+ — tipico de ATR distal e tipo 4.",
        "diff": "hard",
        "cat": "acido-base",
        "refs": ["acid_base_adroguenejm", "atr_rodriguez_soriano"]
    },
    # Q100 — Rim bioartificial
    {
        "t": "Rim Bioartificial e Diálise Vestível (WAK)",
        "q": "O Kidney Project e a WAK (Wearable Artificial Kidney) representam tecnologias de terapia renal de próxima geração. Qual a principal vantagem da WAK sobre a hemodiálise convencional?",
        "opts": ["Maior depuração de toxinas urêmicas", "Diálise contínua e portátil — eliminando sessões intermitentes e restrições de dieta", "Menor custo total", "Dispensar acesso vascular"],
        "ans": 1,
        "exp": "A WAK permite dialise continua 24h/dia com dispositivo vestivel, mimetizando a funcao renal continua, eliminando o perfil de toxinas intermitentas e as restricoes hidrossalinas entre sessoes. O Kidney Project ainda integra celulas tubulares vivas para funcoes nao-filtrativas.",
        "diff": "hard",
        "cat": "dialise",
        "refs": ["kdigo_dialise"]
    },
    # Q32 — iSGLT2 não-diabéticos KDIGO 2024
    {
        "t": "iSGLT2 em Pacientes Não-Diabéticos — KDIGO 2024",
        "q": "Segundo o KDIGO 2024, qual é o critério para indicar iSGLT2 em pacientes com DRC SEM diabetes?",
        "opts": ["TFG < 60 mL/min independente de proteinúria", "Proteinúria > 200 mg/g (ou > 300 mg/g de albumina/creatinina)", "Apenas se em uso de IECA/BRA", "Exclusivo para IgAN"],
        "ans": 1,
        "exp": "As diretrizes KDIGO 2024 recomendam iSGLT2 para todos os pacientes com DRC e proteinuria > 200 mg/g, independentemente de diabetes, baseando-se nos estudos DAPA-CKD e EMPA-KIDNEY que demonstraram beneficio consistente em subgrupos nao-diabeticos.",
        "diff": "medium",
        "cat": "tratamento",
        "refs": ["kdigo_ckd", "dapa_ckd", "empa_kidney"]
    },
    # Q67 — Biópsia no diabético
    {
        "t": "Indicação de Biópsia Renal no Paciente Diabético",
        "q": "Qual achado clínico deve motivar uma biópsia renal em paciente diabético (suspeita de doença glomerular não-diabética)?",
        "opts": ["Proteinúria leve em DM tipo 2 com retinopatia", "Queda rápida da TFG ou síndrome nefrótica súbita sem retinopatia", "Microalbuminúria persistente", "HbA1c acima de 9%"],
        "ans": 1,
        "exp": "A ausencia de retinopatia em paciente com DM1 e proteinuria, ou a presenca de sedimento urinario ativo (hematuria dimorfica) ou queda rapida e inexplicada da TFG sugerem fortemente glomerulopatia sobreposta. Biopsia e necessaria para guiar tratamento especifico.",
        "diff": "medium",
        "cat": "diagnostico",
        "refs": ["kdigo_diabetes_in_ckd_guideline", "kdigo_gn"]
    },
    # Q69 — Furosemide Stress Test
    {
        "t": "Furosemide Stress Test (FST) na LRA",
        "q": "O Furosemide Stress Test (FST) usa a resposta diurética à furosemida para predizer qual desfecho na LRA?",
        "opts": ["Necessidade imediata de diálise", "Progressão para LRA estágio 3 ou necessidade de TRS nas próximas 12-24h", "Causa da LRA (pré-renal vs intrínseca)", "Recuperação da função renal em 7 dias"],
        "ans": 1,
        "exp": "Dose: furosemida 1 mg/kg IV (2 mg/kg se uso previo). Debito urinario < 200 mL na primeira hora e altamente preditivo de progressao para LRA estagio 3 e necessidade de TRS, indicando perda da capacidade tubular de resposta.",
        "diff": "hard",
        "cat": "lra",
        "refs": ["furosemide_stress_test", "kdigo_aki"]
    },
    # Q71 — iMTOR efeitos adversos
    {
        "t": "Inibidores de mTOR (Everolimus) — Efeitos Adversos no Transplante",
        "q": "Qual o principal efeito adverso dos inibidores de mTOR (everolimus/sirolimus) que limita seu uso precoce pós-transplante renal?",
        "opts": ["Nefrotoxicidade direta", "Comprometimento da cicatrização e linfocele", "Hepatotoxicidade", "Mielossupressão severa"],
        "ans": 1,
        "exp": "Os inibidores de mTOR comprometem a cicatrizacao de feridas e aumentam o risco de linfocele e deiscencia, especialmente nas primeiras semanas pos-transplante. Por isso, geralmente sao introduzidos de forma tardia (apos 1-3 meses) ou em associacao com dose reduzida de ICN.",
        "diff": "medium",
        "cat": "transplante",
        "refs": ["kdigo_tx", "kdigo_transplant"]
    },
]

def q_to_json(q):
    lines = ['  {']
    lines.append(f'    "t": {repr(q["t"]).replace(chr(39), chr(34))},')
    lines.append(f'    "q": {repr(q["q"]).replace(chr(39), chr(34))},')
    opts_str = ',\n      '.join(repr(o).replace(chr(39), chr(34)) for o in q["opts"])
    lines.append(f'    "opts": [\n      {opts_str}\n    ],')
    lines.append(f'    "ans": {q["ans"]},')
    lines.append(f'    "exp": {repr(q["exp"]).replace(chr(39), chr(34))},')
    lines.append(f'    "diff": "{q["diff"]}",')
    lines.append(f'    "cat": "{q["cat"]}",')
    refs_str = ',\n      '.join(f'"{r}"' for r in q["refs"])
    lines.append(f'    "refs": [\n      {refs_str}\n    ]')
    lines.append('  }')
    return '\n'.join(lines)

new_blocks = ',\n'.join(q_to_json(q) for q in new_questions)

end_marker = '\n];\n\n    const items'
pos = html.find(end_marker)
if pos == -1:
    pos = html.find('\n];', html.find('const topics'))

html = html[:pos] + ',\n' + new_blocks + html[pos:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print(f'Part 3d complete. Added {len(new_questions)} new questions.')
