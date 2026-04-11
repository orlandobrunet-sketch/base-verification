#!/usr/bin/env python3
"""Part 3b: Add first batch of 10 new questions to the topics array."""

with open('index.html', encoding='utf-8') as f:
    html = f.read()

# New questions — batch 1 (10 questions)
new_questions = [
    # Q51 — CONVINCE HDF
    {
        "t": "Hemodiafiltração de Alto Volume (Estudo CONVINCE)",
        "q": "O estudo CONVINCE (NEJM 2023) comparou HDF de alto volume (>= 23L/sessão) com hemodiálise convencional de alto fluxo. Qual foi o principal achado?",
        "opts": ["Sem diferença em mortalidade", "Redução de 23% na mortalidade por todas as causas com HDF-HV", "Aumento de eventos cardiovasculares", "Redução de infecções do acesso vascular"],
        "ans": 1,
        "exp": "A HDF de alto volume (>= 23L por sessão) demonstrou reducao de 23% no risco de morte por todas as causas em comparacao a hemodialise padrao, consolidando-a como terapia superior para pacientes que toleram altas taxas de ultrafiltracao.",
        "diff": "hard",
        "cat": "dialise",
        "refs": ["convince_study", "kdigo_dialise"]
    },
    # Q53 — SGLT2 Initial Dip
    {
        "t": "Queda Inicial da TFG com iSGLT2 — Conduta",
        "q": "Ao iniciar um inibidor de SGLT2, o paciente apresenta queda de 25% na TFG em 2 semanas. Qual a conduta correta?",
        "opts": ["Suspender o iSGLT2 imediatamente", "Reduzir a dose pela metade", "Manter a medicação e monitorizar — a queda é funcional", "Substituir por outro agente nefroprotetor"],
        "ans": 2,
        "exp": "A queda inicial ('dip') de ate 30% na TFG com iSGLT2 e funcional e reflete a reducao da hiperfiltracao via feedback tubuloglomerular, causando vasoconstricao da arteriola aferente. A longo prazo, essa reducao da pressao intraglomerular preserva a funcao renal (curva de protecao).",
        "diff": "medium",
        "cat": "tratamento",
        "refs": ["dapa_ckd", "empa_kidney"]
    },
    # Q55 — NELL-1 Membranosa
    {
        "t": "Nefropatia Membranosa — Antígeno NELL-1",
        "q": "A presença do antígeno NELL-1 na imunohistoquímica da biópsia renal está frequentemente associada a qual condição secundária?",
        "opts": ["Lupus Eritematoso Sistêmico", "Infecção por Hepatite B", "Malignidade (neoplasias)", "Uso de AINEs"],
        "ans": 2,
        "exp": "O NELL-1 (Neural EGF-Like 1) e o segundo antigeno mais comum na nefropatia membranosa primaria, mas sua deteccao deve sempre motivar rastreamento rigoroso para cancer, dada a forte associacao paraneoplasica descrita em series recentes.",
        "diff": "hard",
        "cat": "glomerular",
        "refs": ["kdigo_gn", "anticoag_mn"]
    },
    # Q58 — SLED
    {
        "t": "SLED (Sustained Low-Efficiency Dialysis) em UTI",
        "q": "Qual a principal vantagem da SLED em relação à hemodiálise convencional em pacientes críticos?",
        "opts": ["Menor custo que hemodiálise intermitente", "Remoção mais rápida de toxinas", "Melhor estabilidade hemodinâmica com menor custo que CRRT", "Maior depuração de médias moléculas"],
        "ans": 2,
        "exp": "A SLED utiliza fluxos de sangue e dialisato menores por um periodo maior (6-12h), permitindo remocao de fluidos mais lenta e melhor tolerada por pacientes instaveis, com estabilidade hemodinamica semelhante a CRRT e custo bem menor.",
        "diff": "medium",
        "cat": "dialise",
        "refs": ["kdigo_aki", "kdigo_dialise"]
    },
    # Q59 — Calcifilaxia
    {
        "t": "Calcifilaxia — Tratamento com Tiossulfato de Sódio",
        "q": "Qual o mecanismo de ação do tiossulfato de sódio no tratamento da calcifilaxia (arteriolopatia calcificante urêmica)?",
        "opts": ["Inibição direta da PTH", "Aumento da solubilidade dos depósitos de cálcio + ação antioxidante e vasodilatadora", "Quelação de ferro tecidual", "Bloqueio da osteogênese"],
        "ans": 1,
        "exp": "O tiossulfato de sodio atua aumentando a solubilidade dos depositos de calcio e possui propriedades antioxidantes e vasodilatadoras, sendo a terapia de escolha para calcifilaxia. Dose habitual: 25g IV 3x/semana pos-HD.",
        "diff": "hard",
        "cat": "tratamento",
        "refs": ["kdigo_ckd_mbd_2017"]
    },
    # Q63 — Fórmula de Winter
    {
        "t": "Fórmula de Winter (Compensação Respiratória)",
        "q": "Um paciente tem HCO3- de 12 mEq/L. Qual a PCO2 esperada pela fórmula de Winter?",
        "opts": ["20-24 mmHg", "26-30 mmHg", "32-36 mmHg", "38-42 mmHg"],
        "ans": 1,
        "exp": "Formula de Winter: PCO2 esperada = (1,5 x HCO3) + 8 +/- 2. Para HCO3 = 12: PCO2 = (1,5 x 12) + 8 = 26 +/- 2 mmHg. Desvios sugerem distubio acido-base misto.",
        "diff": "medium",
        "cat": "acido-base",
        "refs": ["acid_base_adroguenejm"]
    },
    # Q64 — Avacopan ADVOCATE
    {
        "t": "Avacopan na Vasculite ANCA (Estudo ADVOCATE)",
        "q": "O Avacopan foi aprovado para vasculite ANCA. Qual o seu mecanismo de ação único?",
        "opts": ["Inibição de C3 do complemento", "Antagonista do receptor de C5a", "Anti-CD20 de 2ª geração", "Inibidor da JAK-STAT"],
        "ans": 1,
        "exp": "No estudo ADVOCATE (NEJM 2021), o avacopan (antagonista do receptor de C5a) foi superior a prednisona na manutencao da remissao em 52 semanas, permitindo regime livre de corticoides e reduzindo toxicidade esteroidal.",
        "diff": "hard",
        "cat": "glomerular",
        "refs": ["advocate_study", "pexivas_trial"]
    },
    # Q74 — Lesão Mínima Rituximabe
    {
        "t": "Lesão Mínima em Adultos — Papel do Rituximabe",
        "q": "Em adultos com doença de lesão mínima e recaídas frequentes/corticodependência, qual terapia vem se consolidando como primeira linha?",
        "opts": ["Ciclosporina", "Ciclofosfamida", "Rituximabe", "Tacrolimus"],
        "ans": 2,
        "exp": "Embora corticoides sejam a primeira escolha na lesao minima, o rituximabe consolidou-se como terapia de primeira linha para pacientes com recaidas frequentes ou corticodependencia, visando reduzir toxicidade dos esteroides. KDIGO 2024 atualizou a recomendacao.",
        "diff": "medium",
        "cat": "glomerular",
        "refs": ["kdigo_gn", "rituximab_mn_mentor"]
    },
    # Q75 — EMPACT-MI
    {
        "t": "Estudo EMPACT-MI (Empagliflozina pós-IAM)",
        "q": "O estudo EMPACT-MI avaliou empagliflozina após infarto agudo do miocárdio. Qual foi o impacto na função renal?",
        "opts": ["Aumento significativo da TFG", "Piora progressiva da função renal", "Redução do risco de declínio agudo da TFG e proteção renal sustentada", "Aumento do risco de LRA"],
        "ans": 2,
        "exp": "O estudo EMPACT-MI (NEJM 2024) demonstrou seguranca e beneficio do inicio precoce do iSGLT2 no contexto de lesao cardiaca aguda para prevenir a sindrome cardiorrenal tipo 1. Nao houve aumento de LRA.",
        "diff": "hard",
        "cat": "tratamento",
        "refs": ["empact_mi_trial", "empa_kidney"]
    },
    # Q76 — EXT1/EXT2 Membranosa
    {
        "t": "Nefropatia Membranosa — Antígeno EXT1/EXT2",
        "q": "Qual antígeno está classicamente associado à nefropatia membranosa com padrão 'lupus-like' (depósitos subendoteliais e mesangiais)?",
        "opts": ["PLA2R", "THSD7A", "NELL-1", "EXT1/EXT2 (Exostosina 1 e 2)"],
        "ans": 3,
        "exp": "A identificacao de EXT1/EXT2 na biopsia sugere uma forma de membranosa frequentemente associada a doencas autoimunes, com caracteristicas histologicas de 'full house' na imunofluorescencia, mas com melhor prognostico renal que a NM PLA2R+.",
        "diff": "hard",
        "cat": "glomerular",
        "refs": ["ext1ext2_sethi", "kdigo_gn"]
    },
]

# Build new question blocks
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

# Insert before closing \n];
end_marker = '\n];\n\n    const items'
pos = html.find(end_marker)
if pos == -1:
    # fallback
    pos = html.find('\n];', html.find('const topics'))
    end_marker = '\n];'

html = html[:pos] + ',\n' + new_blocks + html[pos:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print(f'Part 3b complete. Added {len(new_questions)} new questions.')
