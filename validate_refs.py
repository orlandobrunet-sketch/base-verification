import re, sys

with open('data/refs.js', 'r', encoding='utf-8', newline='') as f:
    src = f.read()
src_lf = src.replace('\r\n', '\n')

# Check 1: count entries
entries = re.findall(r'^\s{2}(\w+):\{', src_lf, re.MULTILINE)
print(f'Total entradas: {len(entries)}')

# Check 2: every entry with resumo must have conclusao + curiosidade
blocks = re.split(r'\n  (?=\w+:\{)', src_lf)
missing_fields = []
for b in blocks:
    m = re.match(r'(\w+):\{', b.strip())
    if not m:
        continue
    key = m.group(1)
    has_r = 'resumo:' in b
    has_c = 'conclusao:' in b
    has_q = 'curiosidade:' in b
    if has_r and not (has_c and has_q):
        missing_fields.append(f'  {key}: conclusao={has_c} curiosidade={has_q}')

# Check 3: odd number of double-quotes in content lines (unbalanced strings)
problems = []
for i, line in enumerate(src_lf.split('\n'), 1):
    stripped = line.strip()
    if stripped.startswith(('resumo:', 'conclusao:', 'curiosidade:', 'impacto:', 'label:', 'icon:')):
        dq = stripped.count('"')
        if dq % 2 != 0:
            problems.append(f'  linha {i} ({stripped[:60]}...)')

# Check 4: trailing commas OK — just count entries without resumo
no_resumo = []
for b in blocks:
    m = re.match(r'(\w+):\{', b.strip())
    if m and 'resumo:' not in b:
        no_resumo.append(m.group(1))

if missing_fields:
    print('ERRO — CAMPOS FALTANDO:')
    for x in missing_fields:
        print(x)
else:
    print('Campos OK: todos com resumo tem conclusao e curiosidade.')

if problems:
    print('AVISO — ASPAS POSSIVELMENTE DESEQUILIBRADAS:')
    for x in problems:
        print(x)
else:
    print('Aspas OK.')

print(f'Entradas sem resumo: {len(no_resumo)} de {len(entries)}')
print(f'Entradas com resumo: {len(entries) - len(no_resumo)}')
