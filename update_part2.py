#!/usr/bin/env python3
"""Part 2: Update more existing questions (batch 2)."""
import re

with open('index.html', encoding='utf-8') as f:
    html = f.read()

def update_q(html, topic, new_exp=None, new_refs=None):
    marker = f'"t": "{topic}"'
    pos = html.find(marker)
    if pos == -1:
        print(f'  ⚠ NOT FOUND: {topic[:60]}')
        return html
    blk_start = html.rfind('\n  {', 0, pos)
    blk_end   = html.find('\n  {', pos)
    if blk_end == -1:
        blk_end = html.find('\n]', pos)
    block = html[blk_start:blk_end]
    if new_exp is not None:
        block, n = re.subn(r'"exp":\s*"(?:[^"\\]|\\.)*"', f'"exp": "{new_exp}"', block, count=1)
        if n == 0:
            print(f'  ⚠ exp NOT replaced in: {topic[:60]}')
    if new_refs is not None:
        refs_str = '[\n      ' + ',\n      '.join(f'"{r}"' for r in new_refs) + '\n    ]'
        block, n = re.subn(r'"refs":\s*\[[^\]]*\]', f'"refs": {refs_str}', block, count=1, flags=re.DOTALL)
        if n == 0:
            print(f'  ⚠ refs NOT replaced in: {topic[:60]}')
    print(f'  ✓ {topic[:70]}')
    return html[:blk_start] + block + html[blk_end:]

# Q26 — NOBILITY
html = update_q(html, 'Nefrite Lúpica: Terapia de Combinação (Estudo NOBILITY)',
    new_exp='O obinutuzumabe é um anticorpo anti-CD20 de tipo II (glicoengenheirado), com maior capacidade de depleção de células B em tecidos comparado ao rituximabe. No NOBILITY, sua adição ao MMF + corticoide aumentou as taxas de remissão completa na nefrite lúpica proliferativa.',
    new_refs=['nobility_study','kdigo_gn'])

# Q27 — GN Fibrilar
html = update_q(html, 'Diferenciação ME: GN Imunotactoide vs Fibrilar',
    new_exp='A GN Fibrilar possui fibrilas sólidas de 16-24 nm (negativas para Vermelho Congo) aleatoriamente distribuídas, enquanto a Imunotactoide possui microtúbulos ocos e paralelos geralmente > 30 nm, associados a paraproteínas e doenças linfoproliferativas.',
    new_refs=['kdigo_gn'])

# Q28 — APOL1
html = update_q(html, 'Risco Genético APOL1 na Doença Renal',
    new_exp='O risco renal pelo APOL1 segue herança recessiva: dois alelos de risco (G1/G1, G2/G2 ou G1/G2) conferem risco substancial de GESF, HIVAN e DRC progressiva. Um único alelo de risco geralmente não confere risco significativo de doença renal.',
    new_refs=['kdigo_ckd'])

# Q29 — Sparsentan
html = update_q(html, 'Sparsentan na Nefropatia por IgA',
    new_exp='O sparsentan é um antagonista dual do Receptor de Endotelina tipo A (ERA) e do Receptor de Angiotensina II (BRA). No estudo PROTECT, demonstrou redução superior da proteinúria vs irbesartana, atuando simultaneamente na hemodinâmica e inflamação glomerular.',
    new_refs=['protect_trial','kdigo_gn'])

# Q30 — SDD (refs)
html = update_q(html, 'Hemodiálise: Síndrome de Desequilíbrio',
    new_refs=['kdigo_dialise','kdigo_lra'])

# Q31 — Finerenona
html = update_q(html, 'Estudo FIDELIO-DKD: Finerenona',
    new_exp='Por ser não-esteroidal, a finerenona tem distribuição tecidual equilibrada entre coração e rins, com menor incidência de ginecomastia e efeitos hormonais vs espironolactona. No FIDELIO-DKD, reduziu desfecho renal composto em 18% e eventos CV em 14% no DM2.',
    new_refs=['fidelio','kdigo_diabetes_in_ckd_guideline'])

# Q35 — Bartter tipo 2
html = update_q(html, 'Síndrome de Bartter Tipo 2',
    new_exp='O Bartter tipo 2 é causado por mutações no canal de potássio ROMK (KCNJ1) do ramo ascendente espesso. Clinicamente pode apresentar hipercalemia transitória neonatal antes de evoluir para a hipocalemia clássica — fenômeno exclusivo deste subtipo.',
    new_refs=['kdigo_ckd'])

# Q36 — Gitelman (refs)
html = update_q(html, 'Síndrome de Gitelman e Magnésio',
    new_refs=['kdigo_ckd'])

# Q42 — GNPE (refs)
html = update_q(html, 'Glomerulonefrite Pós-Estreptocócica (GNPE)',
    new_refs=['kdigo_gn','kdigo_aki'])

# Q43 — THSD7A
html = update_q(html, 'Glomerulonefrite Membranosa: Anticorpo Anti-THSD7A',
    new_exp='Cerca de 3-5% dos casos de NM são THSD7A-positivos. Esses pacientes têm associação maior com tumores sólidos (paraneoplásico). A biópsia mostra padrão membranoso clássico; a pesquisa de neoplasia oculta é mandatória na sua detecção.',
    new_refs=['kdigo_gn'])

# Q44 — Sibeprenlimabe
html = update_q(html, 'Sibeprenlimabe — Mecanismo de Ação',
    new_exp='O sibeprenlimabe bloqueia o APRIL (A Proliferation-Inducing Ligand), citocina que estimula a produção de IgA1 galacto-deficiente pelas células B das mucosas. No estudo VISIONARY, reduziu a proteinúria em 47% e a progressão da NIgA.',
    new_refs=['visionary_trial','kdigo_gn'])

# Q47 — Mieloma cadeias leves (refs)
html = update_q(html, 'Proteinúria de Cadeias Leves no Mieloma',
    new_refs=['kdigo_aki'])

# Q48 — Contraste
html = update_q(html, 'Nefropatia por Contraste Iodado',
    new_exp='O estudo PRESERVE demonstrou que o bicarbonato de sódio e a N-acetilcisteína não são superiores à solução salina isotônica (NaCl 0,9%) na prevenção de lesão renal pós-contraste. Hidratação adequada com salina permanece o pilar da prevenção.',
    new_refs=['preserve_study','kdigo_aki'])

# Q49 — Tolvaptan DRPAD (refs)
html = update_q(html, 'DRPAD — Tratamento com Tolvaptan',
    new_refs=['tempo_34_trial','reprise_trial'])

# Q50 — Roxadustat / HIF-PH
html = update_q(html, 'Manejo de Anemia na DRC: Inibidores de HIF-PH',
    new_exp='Os inibidores de HIF-prolil hidroxilase (como roxadustat) estabilizam o HIF, mimetizando hipóxia: aumentam a eritropoetina endógena e reduzem a hepcidina, melhorando a biodisponibilidade do ferro mesmo em estados inflamatórios onde os ESA clássicos são menos eficazes.',
    new_refs=['roxadustat_trial','kdigo_ckd'])

# Q52 — Belimumabe BLISS-LN
html = update_q(html, 'Nefrite Lúpica e Estudo BLISS-LN',
    new_exp='O belimumabe (anti-BLyS/BAFF) foi a primeira terapia biológica aprovada para nefrite lúpica. No BLISS-LN, sua adição ao tratamento padrão (MMF ou ciclofosfamida) aumentou a eficácia renal primária (remissão completa) e reduziu o risco de flares renais.',
    new_refs=['bliss_ln','kdigo_gn'])

# Q54 — Mayo DRPAD
html = update_q(html, 'Classificação de Mayo para DRPAD',
    new_exp='A Classificação de Mayo utiliza o Volume Renal Total Ajustado pela Altura (HtTKV) para estratificar pacientes em classes 1A a 1E. Pacientes nas classes 1C, 1D e 1E são "progressores rápidos" com indicação formal de tolvaptan para retardar o crescimento dos cistos.',
    new_refs=['tempo_34_trial','reprise_trial'])

# Q56 — EMPA-KIDNEY IgA
html = update_q(html, 'EMPA-KIDNEY — Subgrupo IgAN',
    new_exp='O EMPA-KIDNEY demonstrou que a empagliflozina reduziu a progressão da DRC em pacientes com Nefropatia por IgA, mesmo com proteinúrias mais baixas e TFG até 20 mL/min, consolidando iSGLT2 como parte do tratamento de suporte na NIgA.',
    new_refs=['empa_kidney','empa'])

# Q57 — Vaptanos SIADH (refs)
html = update_q(html, 'Vaptanos no Tratamento da SIADH',
    new_refs=['hyponatremia_verbalis2022','hypona'])

# Q62 — ZS-9 hipercalemia
html = update_q(html, 'Hipercalemia e Quelantes de Potássio (Patiromer/ZS-9)',
    new_exp='O ciclosilicato de sódio e zircônio (ZS-9) tem início de ação em 1-2 horas, alta seletividade para K+ e não está associado à necrose colônica ao contrário do poliestirenossulfonato. O patiromer tem início mais tardio (4-7 h) e atua em troca de cálcio.',
    new_refs=['kdigo_ckd'])

# Q65 — Lumasiran
html = update_q(html, 'Hiperoxalúria Primária Tipo 1: Defeito Enzimático',
    new_exp='O lumasiran (RNAi) silencia a glicolato oxidase (GO) hepática, reduzindo o substrato para produção de oxalato. No ILLUMINATE-A, reduziu 65% o oxalato urinário. Previne nefrolitíase recorrente e progressão para oxalose sistêmica.',
    new_refs=['lumasiran_trial','kdigo_ckd'])

# Q66 — Cistina (refs)
html = update_q(html, 'Cistinúria — Diagnóstico e Tratamento',
    new_refs=['kdigo_ckd'])

# Q68 — Ganciclovir
html = update_q(html, 'Ajuste de Dose do Valganciclovir no Transplante',
    new_exp='O valganciclovir/ganciclovir tem eliminação exclusivamente renal. Ajuste rigoroso pela TFG é essencial: sem ajuste, ocorre mielossupressão grave (neutropenia) e neurotoxicidade. Em TFG < 10, considerar alternativas ou doses muito reduzidas.',
    new_refs=['cmv_kdigo_tx','kdigo_transplant'])

# Q70 — Bicarbonato DRC
html = update_q(html, 'Bicarbonato e Acidose na DRC',
    new_exp='O KDIGO 2024 recomenda suplementação de bicarbonato quando o nível sérico cair abaixo de 22 mEq/L. Manter entre 22-26 mEq/L retarda progressão da DRC, preserva massa óssea e muscular e reduz o catabolismo proteico.',
    new_refs=['kdigo_ckd','kdigo_ckd_guideline'])

# Q72 — Peritonite fúngica
html = update_q(html, 'Peritonite Fúngica em DP — Conduta',
    new_exp='A conduta obrigatória na peritonite fúngica em DP é a remoção imediata do cateter de Tenckhoff associada a antifúngicos sistêmicos. A permanência do cateter está associada a altíssima mortalidade por formação de biofilme fúngico e risco de esclerose peritoneal.',
    new_refs=['ispd_peritonitis_guideline'])

# Q73 — Pegcetacoplan C3G
html = update_q(html, 'Pegcetacoplano — Mecanismo e Indicação',
    new_exp='O pegcetacoplan bloqueia C3 (via proximal), diferente do eculizumabe que bloqueia C5. Isso o torna mais eficaz nas glomerulopatias por C3 e MPGN tipo 1, onde a desregulação da via alternativa ocorre na fase de C3. Aprovado pela FDA para HPN.',
    new_refs=['c3g_consensus','c3g_servais'])

# Q81 — GESF primária
html = update_q(html, 'GESF Secundária: Diagnóstico Diferencial com GESF Primária',
    new_exp='A GESF primária é uma podocitopatia difusa causada por fator circulante; o apagamento dos pedicelos é extenso (> 80%) e global. Nas formas secundárias/maladaptativas, o apagamento é focal e restrito às áreas de esclerose. Esse dado de microscopia eletrônica é o principal diferenciador.',
    new_refs=['kdigo_gn','rituximab_gesf_review'])

# Q82 — Metformina DRC
html = update_q(html, 'Metformina e DRC — Ajuste de Dose',
    new_exp='A metformina é segura em DRC estável com TFG 30-45 mL/min com monitorização. Deve ser suspensa se TFG < 30 ou em situações de risco de hipoperfusão (cirurgias, contraste, sepse) pelo risco de acidose lática por acúmulo da droga.',
    new_refs=['kdigo_diabetes_in_ckd_guideline','kdigo_ckd'])

# Q87 — Iptacopan
html = update_q(html, 'Iptacopan na Nefropatia por IgA',
    new_exp='O iptacopan inibe o Fator B da via alternativa do complemento, bloqueando a alça de amplificação que deposita C3 nos glomérulos. É oral e demonstrou redução significativa da proteinúria na NIgA com depósito de C3 e na Glomerulopatia por C3.',
    new_refs=['kdigo_gn','c3g_consensus'])

# Q96 — SHR (refs)
html = update_q(html, 'Síndrome Hepatorrenal: Terlipressina + Albumina (Estudo CONFIRM)',
    new_refs=['confirm_trial','terlipressin_sanyal'])

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('\nPart 2 complete. Saved index.html.')
