#!/usr/bin/env python3
"""Part 1: Add new refsDB entries + update exp/refs on ~25 existing questions."""
import re, sys

with open('index.html', encoding='utf-8') as f:
    html = f.read()

# ──────────────────────────────────────────────────────────────────
# HELPER: update exp and/or refs for a question identified by topic
# ──────────────────────────────────────────────────────────────────
def update_q(html, topic, new_exp=None, new_refs=None):
    marker = f'"t": "{topic}"'
    pos = html.find(marker)
    if pos == -1:
        print(f'  ⚠ NOT FOUND: {topic[:60]}')
        return html

    # boundaries: find enclosing object  (  { ... },  )
    blk_start = html.rfind('\n  {', 0, pos)
    blk_end   = html.find('\n  {', pos)          # start of NEXT question
    if blk_end == -1:
        blk_end = html.find('\n]', pos)
    block = html[blk_start:blk_end]

    if new_exp is not None:
        # replace "exp": "..."  (value may contain \' \" etc.)
        def _repl_exp(m):
            return f'"exp": "{new_exp}"'
        block, n = re.subn(r'"exp":\s*"(?:[^"\\]|\\.)*"', _repl_exp, block, count=1)
        if n == 0:
            print(f'  ⚠ exp NOT replaced in: {topic[:60]}')

    if new_refs is not None:
        refs_str = '[\n      ' + ',\n      '.join(f'"{r}"' for r in new_refs) + '\n    ]'
        def _repl_refs(m):
            return f'"refs": {refs_str}'
        block, n = re.subn(r'"refs":\s*\[[^\]]*\]', _repl_refs, block, count=1, flags=re.DOTALL)
        if n == 0:
            print(f'  ⚠ refs NOT replaced in: {topic[:60]}')

    print(f'  ✓ updated: {topic[:70]}')
    return html[:blk_start] + block + html[blk_end:]

# ──────────────────────────────────────────────────────────────────
# PART A: ADD NEW refsDB ENTRIES
# ──────────────────────────────────────────────────────────────────
NEW_REFS = '''
      bliss_ln:{
        label:"BLISS-LN Trial (Belimumabe)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2029238",
        journal:"N Engl J Med 2020;383(12):1117-1128",
        ano:2020,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Belimumabe + terapia padrão ↑ remissão renal primária e ↓ flares em Nefrite Lúpica",icon:"💊"
      },
      visionary_trial:{
        label:"VISIONARY Trial (Sibeprenlimabe)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2305361",
        journal:"N Engl J Med 2023;389(1):22-32",
        ano:2023,tipo:"Ensaio Clínico Fase II",badge:"RCT",badgeColor:"#10b981",
        impacto:"Sibeprenlimabe (anti-APRIL) ↓ proteinúria 47% em Nefropatia por IgA",icon:"💊"
      },
      pisces_study:{
        label:"PISCES Trial (Ômega-3 em HD)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2407495",
        journal:"N Engl J Med 2025",
        ano:2025,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Ômega-3 purificado ↓ arritmias ventriculares e morte súbita em hemodiálise",icon:"💊"
      },
      roxadustat_trial:{
        label:"Roxadustat ANDES/PYRENEES Trials",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1901713",
        journal:"N Engl J Med 2019;381(11):1011-1022",
        ano:2019,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Roxadustat eficaz para anemia da DRC, oral, sem monitorização de nível sérico",icon:"💊"
      },
      empact_mi_trial:{
        label:"EMPACT-MI Trial (Empagliflozina pós-IAM)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2401316",
        journal:"N Engl J Med 2024;390(16):1455-1466",
        ano:2024,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Empagliflozina após IAM ↓ mortalidade/IC e protegeu função renal",icon:"💊"
      },
      advor_trial:{
        label:"ADVOR Trial (Acetazolamida + Furosemida na IC)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2203094",
        journal:"N Engl J Med 2022;387(13):1185-1195",
        ano:2022,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Acetazolamida + furosemida ↑ descongestão sem aumento de nefrotoxicidade em IC",icon:"💊"
      },
      lumasiran_trial:{
        label:"ILLUMINATE-A Trial (Lumasiran)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2022978",
        journal:"N Engl J Med 2021;385(19):1737-1746",
        ano:2021,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Lumasiran (RNAi) ↓ 65% oxalato urinário em Hiperoxalúria Primária Tipo 1",icon:"💊"
      },
      mainritsan_trial:{
        label:"MAINRITSAN Trial (Rituximabe vs Azatioprina em ANCA)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1404231",
        journal:"N Engl J Med 2014;371(19):1771-1780",
        ano:2014,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Rituximabe superior à azatioprina na manutenção de remissão em vasculite ANCA",icon:"💊"
      },
      sotagliflozin_trial:{
        label:"SOLOIST-WHF Trial (Sotagliflozina na IC)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2030422",
        journal:"N Engl J Med 2021;384(2):117-128",
        ano:2021,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Sotagliflozina (dual SGLT1/2) ↓ mortalidade CV e hospitalizações em IC",icon:"💊"
      },
      vadadustat_trial:{
        label:"PRO2TECT Trial (Vadadustat em DRC não-dialítica)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2101791",
        journal:"N Engl J Med 2021;384(17):1589-1600",
        ano:2021,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
        impacto:"Vadadustat não inferior à darbepoetina em Hb, mas não atingiu critério CV em não-dialíticos",icon:"🔬"
      },
      imlifidase_study:{
        label:"Imlifidase em Transplante Hiperimune (Jordan et al.)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2114694",
        journal:"N Engl J Med 2022;386(26):2544-2555",
        ano:2022,tipo:"Estudo Clínico",badge:"STUDY",badgeColor:"#0ea5e9",
        impacto:"Imlifidase cliva IgG e permite transplante renal em pacientes hiperimunes com prova cruzada positiva",icon:"🔬"
      },
      ext1ext2_sethi:{
        label:"Sethi S et al. — EXT1/EXT2 Membranous Nephropathy (JASN 2019)",
        url:"https://jasn.asnjournals.org/content/30/6/1123",
        journal:"JASN 2019;30(6):1123-1136",
        ano:2019,tipo:"Estudo Observacional",badge:"STUDY",badgeColor:"#0ea5e9",
        impacto:"EXT1/EXT2 identificados como antígenos da NM lupus-like; associação com autoimunidade e melhor prognóstico renal",icon:"🔬"
      },
      penkid_study:{
        label:"Hollinger A et al. — penKid em LRA (Critical Care 2018)",
        url:"https://ccforum.biomedcentral.com/articles/10.1186/s13054-018-2007-9",
        journal:"Critical Care 2018;22(1):189",
        ano:2018,tipo:"Estudo Observacional",badge:"STUDY",badgeColor:"#0ea5e9",
        impacto:"Proenkephalin A (penKid) como biomarcador precoce de LRA em choque séptico — independente de massa muscular",icon:"🔬"
      },
      evaluate_trial:{
        label:"EVALUATE Trial (Diálise vs Conservador em Idosos)",
        url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2308687",
        journal:"N Engl J Med 2024",
        ano:2024,tipo:"Ensaio Clínico",badge:"RCT",badgeColor:"#10b981",
        impacto:"Diálise não superior ao manejo conservador em qualidade de vida em pacientes > 75 anos com DRC estágio 5",icon:"🔬"
      },
      kpmp_project:{
        label:"KPMP — Kidney Precision Medicine Project",
        url:"https://www.kpmp.org/",
        journal:"CJASN 2021;16(9):1418-1428",
        ano:2021,tipo:"Consórcio de Pesquisa",badge:"REVIEW",badgeColor:"#0ea5e9",
        impacto:"Atlas molecular renal com single-cell RNA-seq — redefinindo doenças renais para terapias de precisão",icon:"🔬"
      }'''

# Insert new refs before the closing `};` of refsDB
insert_target = '      cyclophosphamide_anca_rave:{' # last known entry start
pos = html.find(insert_target)
if pos == -1:
    print('ERROR: could not find insertion point for refsDB')
    sys.exit(1)

# Find the closing `}` of cyclophosphamide_anca_rave entry, then `\n    };`
close_pos = html.find('\n    };', pos)
# Insert new refs before `\n    };`
html = html[:close_pos] + ',\n' + NEW_REFS + html[close_pos:]
print('✓ Added 15 new refsDB entries')

# ──────────────────────────────────────────────────────────────────
# PART B: UPDATE EXISTING QUESTIONS (batch 1 of 2)
# ──────────────────────────────────────────────────────────────────

# Q1 — BPROAD
html = update_q(html, 'Estudo BPROAD (2024): Metas de PA',
    new_exp='O estudo BPROAD (NEJM 2024) confirmou que a meta intensiva de PAS < 120 mmHg em diabéticos tipo 2 com alto risco cardiovascular reduz eventos cardiovasculares maiores (MACE) em 21%, estendendo os benefícios do SPRINT para a população com DM2.',
    new_refs=['bproad','kdigo_ckd'])

# Q2 — Voclosporina
html = update_q(html, 'Nefrite Lúpica: Estudo AURORA (Voclosporina)',
    new_exp='A voclosporina é um ICN de segunda geração com relação dose-resposta mais previsível e maior potência, sem necessidade de monitorização de nível sérico (TDM), e com menor impacto no perfil glicêmico comparada ao tacrolimus. O estudo AURORA demonstrou remissão renal completa superior ao placebo em 52 semanas.',
    new_refs=['aurora_study','kdigo_gn'])

# Q3 — Quelantes de Fósforo
html = update_q(html, 'Quelantes de Fósforo na DRC — Comparação',
    new_exp='As diretrizes KDIGO 2017/2024 recomendam restringir o uso de quelantes à base de cálcio em pacientes com DRC G3a-G5D que apresentam fósforo elevado, priorizando quelantes não-calcêmicos (Sevelamer, Carbonato de Lantânio) para evitar calcificação vascular e sobrecargas de cálcio.',
    new_refs=['kdigo_ckd_mbd_2017','phosphate_binders_ckd'])

# Q4 — Alcalose Metabólica / Cloro Urinário
html = update_q(html, 'Alcalose Metabólica e Cloro Urinário',
    new_exp='Cloro urinário (Clu) < 20 mEq/L indica alcalose "cloro-responsiva" (vômitos, diuréticos prévios). O Clu é mais fidedigno que o Na urinário, pois o bicarbonato urinário na fase aguda "arrasta" o sódio, podendo falsear a avaliação da volemia.',
    new_refs=['kdigo_ckd'])

# Q5 — C4d / RMA
html = update_q(html, 'Biópsia de Transplante — C4d Positivo',
    new_exp='C4d+ em capilares peritubulares indica lesão endotelial mediada por anticorpos (RMA). Segundo os critérios de Banff 2019, a RMA C4d-negativa pode ocorrer quando há evidência molecular ou microvascular de inflamação, mesmo na ausência de C4d.',
    new_refs=['kdigo_tx','kdigo_transplant'])

# Q6 — PEXIVAS
html = update_q(html, 'Vasculite ANCA e Troca Plasmática (Estudo PEXIVAS)',
    new_exp='O estudo PEXIVAS (NEJM 2020) demonstrou que a plasmaférese não reduz o desfecho composto de morte ou doença renal terminal em vasculite ANCA, mesmo em pacientes com creatinina elevada. Ainda pode ser considerada em casos de hemorragia alveolar difusa grave.',
    new_refs=['pexivas_trial','kdigo_gn'])

# Q7 — Tacrolimus / ICN
html = update_q(html, 'Toxicidade por Inibidores da Calcineurina (Tacrolimus)',
    new_exp='O tacrolimus inibe a calcineurina, reduzindo a transcrição do canal ROMK e da bomba Na/K-ATPase no túbulo coletor, mimetizando um pseudohipoaldosteronismo tipo II — responsável pela hipercalemia. Também causa vasoconstrição aferente, contribuindo para nefrotoxicidade crônica.',
    new_refs=['kdigo_tx','kdigo_transplant'])

# Q8 — Nefrite Lúpica Classe V
html = update_q(html, 'Nefrite Lúpica Classe V (Membranosa)',
    new_exp='A classe V isolada requer imunossupressão se houver síndrome nefrótica. O KDIGO 2024 recomenda uso adjuvante de iSGLT2 e bloqueio do SRAA em todos os pacientes com proteinúria persistente, independente da classe histológica.',
    new_refs=['kdigo_gn','aurora_study'])

# Q9 — SHU atípica
html = update_q(html, 'SHU atípica',
    new_refs=['shu_nejm_karpman','kdigo_aki'])

# Q10 — Alport
html = update_q(html, 'Síndrome de Alport: Genética e Clínica',
    new_exp='A Síndrome de Alport ligada ao X é causada por mutações no COL4A5, que codifica a cadeia alfa-5 do colágeno IV. A ausência do trímero alfa-3/4/5 na MBG resulta no aspecto de "cesta tecida" na microscopia eletrônica e progressão para DRET.',
    new_refs=['alport_syndrome_review','kdigo_gn'])

# Q11 — FLOW
html = update_q(html, 'Estudo FLOW (2023): Semaglutida',
    new_exp='O estudo FLOW (NEJM 2024) consolidou os análogos de GLP-1 como terceira linha de nefroproteção no DM2, após SRAA e iSGLT2. A semaglutida 1,0 mg reduziu 24% o desfecho primário composto (morte renal/CV, perda de TFG ≥50% ou início de diálise).',
    new_refs=['flow_trial','flow_study'])

# Q14 — iSGLT2 cetoacidose euglicêmica
html = update_q(html, 'Uso de iSGLT2 e Cetoacidose Euglicémica',
    new_exp='Ocorre por aumento da razão Glucagon/Insulina e aumento da reabsorção tubular de corpos cetônicos. A glicemia permanece normal ou levemente elevada (< 250 mg/dL) pela glicosúria mantida. Evitar iSGLT2 no perioperatório e em jejum prolongado.',
    new_refs=['empa_kidney','dapa_ckd'])

# Q15 — Mieloma Rim
html = update_q(html, 'Mieloma Múltiplo e Rim — Manifestações',
    new_exp='A lesão ocorre pela precipitação de cadeias leves monoclonais com a glicoproteína de Tamm-Horsfall (Uromodulina) no túbulo distal, formando cilindros intratubulares densos e fraturados (Cast Nephropathy). A desidratação e os AINEs agravam a lesão.',
    new_refs=['kdigo_aki'])

# Q16 — DAPA-CKD (refs)
html = update_q(html, 'Estudo DAPA-CKD: Critério de Inclusão',
    new_refs=['dapa_ckd','dapa'])

# Q17 — EMPA-KIDNEY TFG baixa
html = update_q(html, 'Estudo EMPA-KIDNEY e TFG Baixa',
    new_exp='O EMPA-KIDNEY incluiu pacientes com TFG até 20 mL/min/1,73m², demonstrando segurança e eficácia. As bulas atuais permitem manter a empagliflozina até o início da diálise em pacientes que já a usavam previamente, consolidando iSGLT2 em DRC avançada.',
    new_refs=['empa_kidney','empa'])

# Q18 — MEST-C
html = update_q(html, 'Nefropatia por IgA (NIgA): Classificação de Oxford (MEST-C)',
    new_exp='O "C" foi adicionado ao escore de Oxford em 2017. C0 = sem crescentes, C1 = crescentes em < 25% dos glomérulos, C2 = crescentes em ≥ 25%. A presença de C2 geralmente indica necessidade de imunossupressão agressiva além do tratamento de suporte.',
    new_refs=['kdigo_gn','testing_study'])

# Q20 — PET (refs)
html = update_q(html, 'Diálise Peritoneal (DP): Teste de Equilíbrio Peritoneal (PET)',
    new_refs=['kdigo_dialise','ispd_peritonitis_guideline'])

# Q21 — Anti-PLA2R
html = update_q(html, 'Nefropatia Membranosa — Autoanticorpo PLA2R',
    new_exp='O desaparecimento do anti-PLA2R (remissão imunológica) precede a redução da proteinúria (remissão clínica) em 3-6 meses. O monitoramento dos títulos guia decisões terapêuticas — títulos persistentes indicam risco de recaída.',
    new_refs=['kdigo_gn','anticoag_mn'])

# Q22 — iSGLT2 infecção
html = update_q(html, 'Inibidores de SGLT2 e Risco de Infecção Urinária (ITU)',
    new_exp='O risco aumentado é principalmente de infecções fúngicas genitais (candidíase) por glicosúria. Metanálises dos estudos EMPA-KIDNEY e DAPA-CKD não confirmaram aumento significativo de ITUs bacterianas graves ou urosepse versus placebo.',
    new_refs=['empa_kidney','dapa_ckd'])

# Q25 — Doppler estenose renal
html = update_q(html, 'Avaliação de Estenose de Artéria Renal',
    new_exp='Além da velocidade de pico sistólico (VPS) > 200 cm/s e RAR > 3,5, um Índice de Resistência (IR) > 0,8 no parênquima renal sugere doença microvascular grave e está associado a menor probabilidade de recuperação da função renal após revascularização.',
    new_refs=['kdigo_ckd','sprint_trial'])

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('\nPart 1 complete. Saved index.html.')
