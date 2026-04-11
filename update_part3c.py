#!/usr/bin/env python3
"""Part 3c: Add second batch of 10 new questions."""

with open('index.html', encoding='utf-8') as f:
    html = f.read()

new_questions = [
    # Q78 — penKid
    {
        "t": "penKid (Proenkephalin A) — Biomarcador de LRA",
        "q": "Qual biomarcador emergente é considerado um substituto mais preciso para a TFG em pacientes críticos, por não ser influenciado por inflamação ou massa muscular?",
        "opts": ["NGAL urinário", "Cistatina C", "Proenkephalin A (penKid)", "KIM-1"],
        "ans": 2,
        "exp": "Ao contrario da creatinina ou cistatina C em certos contextos, o penKid reflete puramente a filtracao glomerular e tem demonstrado alta acuracia na predicao de LRA em choque septico e pacientes de UTI.",
        "diff": "hard",
        "cat": "lra",
        "refs": ["penkid_study", "kdigo_aki"]
    },
    # Q79 — Imlifidase
    {
        "t": "Imlifidase — Dessensibilização em Transplante Hiperimune",
        "q": "A Imlifidase é usada na dessensibilização pré-transplante renal em pacientes hiperimunes. Qual o seu mecanismo?",
        "opts": ["Depleção de células B por anti-CD20", "Clivagem específica de IgG", "Inibição de C5 do complemento", "Bloqueio de BAFF/APRIL"],
        "ans": 1,
        "exp": "A imlifidase e uma endopeptidase derivada de Streptococcus pyogenes que degrada rapidamente as IgG (incluindo anticorpos anti-HLA), permitindo uma 'janela' para realizacao de transplante em pacientes com prova cruzada positiva.",
        "diff": "hard",
        "cat": "transplante",
        "refs": ["imlifidase_study", "kdigo_tx"]
    },
    # Q83 — Vadadustat
    {
        "t": "Vadadustat nos Estudos PRO2TECT (Anemia da DRC)",
        "q": "Nos estudos PRO2TECT, o vadadustat foi comparado à darbepoetina alfa em DRC não-dialítica. Qual a principal preocupação observada?",
        "opts": ["Ineficácia em elevar a hemoglobina", "Não atingiu critério de não-inferioridade em MACE", "Aumento de risco de trombose", "Hepatotoxicidade grave"],
        "ans": 1,
        "exp": "Embora eficaz em elevar a hemoglobina, o vadadustat nao demonstrou o mesmo perfil de seguranca cardiovascular que os ESAs em pacientes nao-dialiticos (MACE), ao contrario do observado na populacao em dialise.",
        "diff": "hard",
        "cat": "tratamento",
        "refs": ["vadadustat_trial"]
    },
    # Q84 — Denervação Renal
    {
        "t": "Denervação Renal na Hipertensão Resistente",
        "q": "Após resultados neutros do SYMPLICITY HTN-3, novos estudos (SPYRAL HTN) demonstraram:",
        "opts": ["Ineficácia definitiva da denervação", "Eficácia com cateteres de radiofrequência de 4 pontas em HAS resistente", "Alto risco de lesão da artéria renal", "Benefício apenas em pacientes jovens"],
        "ans": 1,
        "exp": "Apos os resultados neutros do SYMPLICITY HTN-3 (atribuidos a falhas tecnicas), novos estudos (SPYRAL HTN-ON/OFF) com cateteres de radiofrequencia de 4 pontas demonstraram eficacia na reducao da PA em hipertensao resistente (reducao media de 9 mmHg).",
        "diff": "hard",
        "cat": "tratamento",
        "refs": ["sprint_trial", "pathway2_trial"]
    },
    # Q85 — ADTKD-MUC1
    {
        "t": "ADTKD-MUC1 — Desafios Diagnósticos",
        "q": "Por que a ADTKD causada por mutações em MUC1 é de difícil diagnóstico por sequenciamento convencional (NGS)?",
        "opts": ["O gene é extremamente longo", "Presença de inserção de citosina única em região de repetições VNTR", "Mutações são somáticas", "Penetrância incompleta"],
        "ans": 1,
        "exp": "A mutacao MUC1 cria uma proteina truncada (MUC1-fs) que se acumula no reticulo endoplasmatico das celulas tubulares. O diagnostico requer testes geneticos especificos para a regiao VNTR, pois o NGS convencional nao deteta essas insercoes.",
        "diff": "hard",
        "cat": "genetica",
        "refs": ["alport_syndrome_review", "kdigo_ckd"]
    },
    # Q86 — Anifrolumabe
    {
        "t": "Anifrolumabe na Nefrite Lúpica (Estudo TULIP-LN)",
        "q": "O anifrolumabe (anti-receptor de Interferon tipo I) foi testado na nefrite lúpica. Qual a conclusão do estudo TULIP-LN?",
        "opts": ["Redução significativa de flares renais", "Superioridade a MMF no desfecho primário", "Não atingiu significância estatística no desfecho primário renal", "Interrupção por toxicidade"],
        "ans": 2,
        "exp": "Apesar de altamente eficaz nas manifestacoes cutaneas e hematologicas do lupus, o beneficio renal direto do anifrolumabe nao atingiu significancia estatistica no desfecho primario do TULIP-LN e ainda aguarda mais evidencias para ser protocolo de primeira linha.",
        "diff": "hard",
        "cat": "glomerular",
        "refs": ["aurora_study", "kdigo_gn"]
    },
    # Q88 — MAINRITSAN
    {
        "t": "Estudo MAINRITSAN — Manutenção em Vasculite ANCA",
        "q": "No estudo MAINRITSAN, qual estratégia foi superior para manutenção da remissão em vasculite ANCA?",
        "opts": ["Azatioprina", "Metotrexato", "Rituximabe (infusões periódicas)", "Micofenolato"],
        "ans": 2,
        "exp": "O MAINRITSAN (NEJM 2014) demonstrou que rituximabe em doses baixas (500 mg no dia 0, 14, e depois a cada 6 meses) foi superior a azatioprina na manutencao da remissao em vasculites ANCA, com menor taxa de recaidas.",
        "diff": "medium",
        "cat": "glomerular",
        "refs": ["mainritsan_trial", "rave_study"]
    },
    # Q89 — Sotagliflozina
    {
        "t": "Sotagliflozina — Inibição Dual SGLT1/SGLT2",
        "q": "A sotagliflozina difere da empagliflozina por inibir também o SGLT1. Onde ocorre a principal ação do SGLT1?",
        "opts": ["Túbulo proximal renal", "Intestino — reduz absorção pós-prandial de glicose", "Cérebro — reduz apetite", "Coração — ação direta no miocárdio"],
        "ans": 1,
        "exp": "A inibicao dual melhora o controle glicemico sem aumentar excessivamente a glicosuria, alem de demonstrar potentes beneficios cardiovasculares nos estudos SOLOIST-WHF e SCORED (reducao de eventos de IC descompensada).",
        "diff": "hard",
        "cat": "tratamento",
        "refs": ["sotagliflozin_trial", "empa_kidney"]
    },
    # Q93 — ADVOR
    {
        "t": "Estudo ADVOR — Acetazolamida na Insuficiência Cardíaca",
        "q": "O estudo ADVOR testou a adição de acetazolamida à furosemida em IC descompensada. Qual o impacto?",
        "opts": ["Piora da função renal", "Aumentou eficiência da diurese e sucesso da descongestão sem aumentar nefrotoxicidade", "Sem benefício adicional", "Aumento de hipocalemia grave"],
        "ans": 1,
        "exp": "A acetazolamida bloqueia a reabsorcao de sodio no tubulo proximal, aumentando a oferta de sodio para a alca de Henle (onde a furosemida atua), potencializando o efeito natriuretico. ADVOR mostrou maior sucesso de descongestao sem aumentar LRA.",
        "diff": "hard",
        "cat": "tratamento",
        "refs": ["advor_trial", "dose_trial"]
    },
    # Q95 — KPMP
    {
        "t": "Kidney Precision Medicine Project (KPMP)",
        "q": "O KPMP visa redefinir as doenças renais baseando-se em:",
        "opts": ["Novas classificações clínicas", "Atlas moleculares e transcriptômica de célula única (single-cell RNA-seq)", "Escores de risco populacional", "Biomarcadores séricos"],
        "ans": 1,
        "exp": "O objetivo do KPMP e passar de um diagnostico puramente histologico para um diagnostico molecular que identifique vias especificas de lesao em cada paciente, permitindo terapias personalizadas. Utiliza biopsias com sc-RNA seq e proteomica.",
        "diff": "hard",
        "cat": "diagnostico",
        "refs": ["kpmp_project", "kdigo_ckd"]
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
print(f'Part 3c complete. Added {len(new_questions)} new questions.')
