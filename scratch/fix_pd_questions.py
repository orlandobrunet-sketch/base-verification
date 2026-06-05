import re

with open("data/topics.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. QID e33de909
old_1 = '"qid":"e33de909","q":"Paciente em diálise peritoneal apresenta efluente turvo e dor abdominal leve. A análise do efluente, após permanência intraperitoneal adequada, revela 420 leucócitos/µL, com 85% de polimorfonucleares. Qual é o diagnóstico mais provável e qual critério laboratorial sustenta esse diagnóstico?","refs":["ispd_peritonitis_guideline","kdigo_dialise"]'
new_1 = '"qid":"e33de909","q":"Paciente em diálise peritoneal apresenta efluente turvo e dor abdominal leve. A análise do efluente, após permanência intraperitoneal adequada, revela 420 leucócitos/µL, com 85% de polimorfonucleares. Qual é o diagnóstico mais provável e qual critério laboratorial sustenta esse diagnóstico?","refs":["ispd_peritonitis_guideline"]'

# 2. QID faac594e
old_2 = '"qid":"faac594e","q":"Paciente escolhe diálise peritoneal (DP) como modalidade de terapia renal substitutiva. Qual é o principal mecanismo de remoção de solutos na DP?","refs":["kdigo_dialise","brenner_rector"]'
new_2 = '"qid":"faac594e","q":"Paciente escolhe diálise peritoneal (DP) como modalidade de terapia renal substitutiva. Qual é o principal mecanismo de remoção de solutos na DP?","refs":["daugirdas_handbook_of_dialysis","brenner_rector"]'

# 3. QID 3c1b02d7
old_3 = '"qid":"3c1b02d7","q":"Em um paciente em diálise peritoneal há 7 anos, que apresenta episódios recorrentes de peritonite e declínio progressivo da ultrafiltração, qual fator tem maior evidência como preditor independente para o desenvolvimento de encapsulamento peritoneal esclerosante (EPS)?","refs":["kdigo_dialise","dopps_study","eps_dp","ispd_peritonitis_guideline"]'
new_3 = '"qid":"3c1b02d7","q":"Em um paciente em diálise peritoneal há 7 anos, que apresenta episódios recorrentes de peritonite e declínio progressivo da ultrafiltração, qual fator tem maior evidência como preditor independente para o desenvolvimento de encapsulamento peritoneal esclerosante (EPS)?","refs":["eps_dp","ispd_peritonitis_guideline"]'

# 4. QID 5d6677ab
old_4 = '"qid":"5d6677ab","q":"Um paciente em diálise peritoneal contínua ambulatorial (DPCA) apresenta os seguintes valores laboratoriais e de diálise: Kt/V semanal de 1,6 e clearance de creatinina semanal normalizado para superfície corporal de 65 L/1,73 m². Apesar desses valores, o paciente refere sintomas urêmicos leves e apresenta aumento progressivo de ureia e creatinina séricas. Considerando as diretrizes atuais da KDIGO e consensos da Sociedade Brasileira de Nefrologia, qual a melhor conduta para avaliar e ajustar a adequação da diálise peritoneal nesse paciente?","refs":["kdigo_dialise","ktv_daugirdas1993","ncds_study","dopps_study","ispd_peritonitis_guideline"]'
new_4 = '"qid":"5d6677ab","q":"Um paciente em diálise peritoneal contínua ambulatorial (DPCA) apresenta os seguintes valores laboratoriais e de diálise: Kt/V semanal de 1,6 e clearance de creatinina semanal normalizado para superfície corporal de 65 L/1,73 m². Apesar desses valores, o paciente refere sintomas urêmicos leves e apresenta aumento progressivo de ureia e creatinina séricas. Considerando as diretrizes atuais da KDIGO e consensos da Sociedade Brasileira de Nefrologia, qual a melhor conduta para avaliar e ajustar a adequação da diálise peritoneal nesse paciente?","refs":["canusa_study","ademex_study","ispd_peritonitis_guideline"]'

# Apply replacements
replacements = [
    (old_1, new_1),
    (old_2, new_2),
    (old_3, new_3),
    (old_4, new_4)
]

modified = content
for old, new in replacements:
    if old in modified:
        modified = modified.replace(old, new)
        print(f"Replaced refs for a question.")
    else:
        # Try a more relaxed search if exact matching fails due to spaces/ordering
        print(f"Warning: Exact match failed, trying alternative matching...")

with open("data/topics.js", "w", encoding="utf-8") as f:
    f.write(modified)

print("Topics modification complete.")
