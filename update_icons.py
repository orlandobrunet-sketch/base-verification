import re

# Ler o arquivo index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Novo mapeamento de ícones
new_mapping = """const itemIcons = {
            'Estetoscópio Básico': 'assets/images/estetoscopio_basico.png',
            'Luvas de Látex': 'assets/images/luvas_latex.png',
            'Termômetro Digital': 'assets/images/termometro_digital.png',
            'Prancheta Clínica': 'assets/images/prancheta_clinica.png',
            'Avental Protetor': 'assets/images/avental_protetor.png',
            'Bisturi do Plantão': 'assets/images/bisturi_plantao.png',
            'Estilete Tubular': 'assets/images/estilete_tubular.png',
            'Elmo do Filtrador': 'assets/images/elmo_filtrador.png',
            'Cetro do Néfron': 'assets/images/cetro_nefron.png',
            'Amuleto do Rim': 'assets/images/amuleto_rim.png'
        };"""

# Encontrar e substituir o mapeamento antigo
pattern = r'const itemIcons = \{[^}]+\};'
content = re.sub(pattern, new_mapping, content, flags=re.DOTALL)

# Salvar o arquivo atualizado
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Mapeamento de ícones atualizado com sucesso!")
