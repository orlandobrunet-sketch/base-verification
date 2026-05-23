import re

with open('data/refs.js', 'r', encoding='utf-8', newline='') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

blocks = re.split(r'\n  (?=\w+:\{)', src)
no_resumo = []
for b in blocks:
    m = re.match(r'(\w+):\{', b.strip())
    if not m or 'resumo:' in b:
        continue
    key = m.group(1)
    lm = re.search(r'label:"([^"]+)"', b)
    label = lm.group(1) if lm else '?'
    no_resumo.append((key, label))

for k, l in no_resumo:
    print(f'  {k:<40} {l[:70]}')
print(f'\nTotal: {len(no_resumo)}')
