#!/usr/bin/env python3
"""Part 3a: Update 3 remaining existing questions (Q38 Salbutamol, Q61 Fabry, Q77 FGF23)."""
import re

with open('index.html', encoding='utf-8') as f:
    html = f.read()

def update_q(html, topic, new_exp=None, new_refs=None):
    marker = f'"t": "{topic}"'
    pos = html.find(marker)
    if pos == -1:
        print(f'  X NOT FOUND: {topic[:60]}')
        return html
    blk_start = html.rfind('\n  {', 0, pos)
    blk_end   = html.find('\n  {', pos)
    if blk_end == -1:
        blk_end = html.find('\n]', pos)
    block = html[blk_start:blk_end]
    if new_exp is not None:
        block, n = re.subn(r'"exp":\s*"(?:[^"\\]|\\.)*"', f'"exp": "{new_exp}"', block, count=1)
    if new_refs is not None:
        refs_str = '[\n      ' + ',\n      '.join(f'"{r}"' for r in new_refs) + '\n    ]'
        block, n = re.subn(r'"refs":\s*\[[^\]]*\]', f'"refs": {refs_str}', block, count=1, flags=re.DOTALL)
    print(f'  OK {topic[:70]}')
    return html[:blk_start] + block + html[blk_end:]

# Q38 — Salbutamol na Hipercalemia
html = update_q(html, 'Hipercalemia: Mecanismo do Salbutamol',
    new_exp='Agonistas beta-2 adrenergicos (salbutamol) estimulam a bomba Na/K-ATPase via aumento de AMP ciclico intracelular, promovendo o influxo de potassio para o meio intracelular. O efeito inicia em 15-30 min e dura 2-4h. Dose: 10-20 mg nebulizada.',
    new_refs=['kdigo_aki'])

# Q61 — Fabry
html = update_q(html, 'Doença de Fabry e Triagem Renal',
    new_exp='Na Doença de Fabry, a deficiência da alfa-galactosidase A leva ao acumulo de globotriaosilceramida (Gb3) nos podocitos e celulas endoteliais, causando proteinuria, perda de TFG e biopsias com aspecto de "celulas em favo de mel" (vacuolizacao podocitaria).',
    new_refs=['kdigo_gn','alport_syndrome_review'])

# Q77 — FGF23
html = update_q(html, 'FGF-23 e Metabolismo Mineral na DRC',
    new_exp='Niveis elevados de FGF23 na DRC estao independentemente associados a hipertrofia ventricular esquerda (HVE) e mortalidade cardiovascular, agindo diretamente nos receptores FGFR4 do miocardio, de forma independente do Klotho.',
    new_refs=['kdigo_ckd_mbd_2017','kdigo_ckd'])

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Part 3a complete.')
