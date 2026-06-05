with open("data/refs.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find the last closing brace and semicolon
last_idx = content.rfind("};")
if last_idx == -1:
    print("Could not find }; at the end of data/refs.js")
    exit(1)

new_refs = """  canusa_study:{
    label:"CANUSA Study Group — Adequacy of Dialysis in PD (JASN 1996)",
    url:"https://jasn.asnjournals.org/content/7/2/198",
    journal:"J Am Soc Nephrol 1996;7(2):198-207",
    ano:1995,tipo:"Estudo de Coorte",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Relação entre adequação da diálise, nutrição e sobrevida em diálise peritoneal",icon:"📊",
    resumo:"Estudo prospectivo multicêntrico central avaliando a relação entre a dose de diálise medida pelo Kt/V semanal e o clearance de creatinina residual com o desfecho de sobrevida em diálise peritoneal.",
    conclusao:"A sobrevida do paciente em diálise peritoneal depende fundamentalmente da preservação da função renal residual, e não apenas do clearance peritoneal artificial obtido.",
    curiosidade:"O estudo foi o grande defensor do conceito de que a função renal nativa remanescente (clearance de solutos endógeno) vale mais do que o clearance da diálise peritoneal!"
  },
  ademex_study:{
    label:"Paniagua R et al. — ADEMEX Study Group (JASN 2002)",
    url:"https://jasn.asnjournals.org/content/13/5/1307",
    journal:"J Am Soc Nephrol 2002;13(5):1307-1320",
    ano:2002,tipo:"Ensaio Clínico",badge:"RCT",badgeColor:"#10b981",
    impacto:"Impacto do aumento da depuração de pequenos solutos na sobrevida em diálise peritoneal",icon:"📊",
    resumo:"Estudo ADEMEX (Adequacy of Peritoneal Dialysis in Mexico): ensaio clínico randomizado avaliando se o aumento do clearance peritoneal de solutos pequenos melhora a sobrevida em diálise peritoneal.",
    conclusao:"Aumentar o Kt/V peritoneal de pequenos solutos acima da meta mínima de 1,70 não oferece benefício adicional de sobrevida a longo prazo em pacientes em DP.",
    curiosidade:"ADEMEX confirmou a nível de RCT o que o estudo observacional CANUSA havia sugerido: o Kt/V puramente peritoneal tem limite de impacto clínico se a função residual zerar."
  },
"""

updated_content = content[:last_idx] + new_refs + content[last_idx:]

with open("data/refs.js", "w", encoding="utf-8") as f:
    f.write(updated_content)

print("References successfully appended to data/refs.js")
