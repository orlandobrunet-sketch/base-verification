# Farmacologia A1.1 — vias e inferência do SHARP

Cinco questões formalmente reavaliadas em autoria; aguarda gate independente dos novos bytes. A1 permanece preservada. Nenhuma alteração em produção.

Mudanças desta edição: vancomicina intravenosa; tramadol oral; sinvastatina/ezetimiba orais diárias; a conclusão do SHARP não isola os componentes, sem negar o braço isolado inicial.

| QID | Revisão final |
|---|---|

|a4c4eff0|sha256:284678cad96827edb18c98a8e259dca49f3c1a9b7680641f20a1a6da3bda9f7c|

|7d2284a4|sha256:0d86e53f3a3c90f992b832add73ad0074252147ed338be5b30de69c0b287f3cc|

|9200dc0a|sha256:dbda57aa1da49b6cc6c5ca6e3e88c3cdc2df4d798d7e4504863a65b2e7e65598|

|a493996a|sha256:ad6456253d7884a2b45b161795b587e539eaa6e648406ced693468b17b8f1f57|

|5bfb77d2|sha256:6bb4e7d1da8ca7e7e18afc599af5be572a59f95edf1f0ff0a08414669ffd5bea|

## a4c4eff0

```json
{
  "t": "Farmacologia Renal",
  "qid": "a4c4eff0",
  "q": "Receptor de transplante renal em uso estável de tacrolimo precisa de um macrolídeo para uma infecção. Há alternativas ativas adequadas ao quadro e à microbiologia. Ao revisar uma prescrição de claritromicina, qual é a melhor conduta para reduzir o risco de interação?",
  "refs": [
    "cni_macrolide_ddi_jeong_2019"
  ],
  "opts": [
    "Preferir alternativa com menor interação, mantendo acompanhamento do tacrolimo.",
    "Separar os horários dos dois medicamentos para evitar a interação metabólica.",
    "Trocar tacrolimo por ciclosporina durante o antibiótico, sem ajustar monitorização.",
    "Manter a associação e dosar tacrolimo apenas se aparecer elevação da creatinina."
  ],
  "ans": 0,
  "exp": "Claritromicina inibe o metabolismo dos inibidores de calcineurina pela isoenzima 3A4 do citocromoP450 e pode elevar a exposição ao tacrolimo; separar os horários não elimina essa interação. A ciclosporina também sofre interação. Havendo alternativa antimicrobiana adequada, deve-se preferir uma opção com menor potencial de interação, sem presumir que qualquer antibiótico seja universalmente de primeira escolha ou isento de risco. Se a associação for inevitável, a equipe de transplante deve planejar ajuste individual e monitorização precoce dos níveis, da função renal e de efeitos adversos; esperar a creatinina subir pode atrasar a detecção. Na coorte de Jeong, o composto primário não diferiu significativamente: mais hospitalizações foram uma associação observacional, não prova de causalidade.",
  "diff": "medium",
  "cat": "farmacologia"
}
```

## 7d2284a4

```json
{
  "t": "Farmacologia Renal",
  "qid": "7d2284a4",
  "q": "Paciente de 58 anos com doença renal crônica G4 não dialítica discute sinvastatina 20 mg associada a ezetimiba 10 mg, ambas por via oral uma vez ao dia. Qual interpretação da segurança muscular no SHARP é adequada?",
  "refs": [
    "sharp_study"
  ],
  "opts": [
    "Miopatia foi rara nos dois grupos, mas isso não torna a combinação isenta de risco.",
    "A combinação foi estudada apenas com filtração preservada, sem doença renal avançada.",
    "A segurança observada permite dispensar a revisão de interações em quem usa a combinação.",
    "Os poucos eventos musculares demonstram que qualquer dose alta de estatina terá o mesmo perfil."
  ],
  "ans": 0,
  "exp": "No SHARP,9.270 participantes com doença renal crônica receberam sinvastatina 20 mg mais ezetimiba 10 mg/dia por via oral ou placebo. A miopatia foi rara: nove versus cinco casos. O pequeno excesso absoluto não equivale a ausência de risco e não elimina a revisão de interações, sintomas e doses. O ensaio incluiu doença renal avançada, mas não permite extrapolar a segurança da combinação estudada a qualquer estatina em dose alta. A redução de eventos ateroscleróticos foi de 17%; o estudo não demonstra que a combinação preserve a filtração nem isola a contribuição de cada componente para o benefício cardiovascular.",
  "diff": "medium",
  "cat": "farmacologia"
}
```

## 9200dc0a

```json
{
  "t": "Vancomicina em Hemodiálise de Alto Fluxo — Dose e Monitorização (ASHP 2020)",
  "qid": "9200dc0a",
  "q": "Paciente em hemodiálise de manutenção de alto fluxo, três vezes por semana, recebe vancomicina intravenosa para bacteremia por Staphylococcus aureus resistente à meticilina. Já recebeu ataque de 25 mg/kg. Segundo a diretriz de 2020, qual estratégia de manutenção e monitorização é mais adequada?",
  "opts": [
    "Repor após cada sessão e ajustar a dose por concentração coletada logo ao terminar a diálise.",
    "Repor após as sessões e ajustar pelos níveis pré-diálise, em geral visando 15–20 mg/L.",
    "Repor uma vez por semana e usar os níveis pré-diálise apenas para confirmar a dose semanal.",
    "Repor após as sessões e manter alvo pré-diálise de 5–10 mg/L para reduzir exposição."
  ],
  "ans": 1,
  "exp": "A hemodiálise de alto fluxo remove vancomicina em quantidade clinicamente relevante. O guideline propõe, como ponto de partida, ataque intravenoso de 25 mg/kg e manutenção intravenosa de cerca de 10 mg/kg após as sessões trissemanalmente, com ajuste pelos níveis. A concentração pré-diálise de 15–20 mg/L é uma aproximação prática de área sob a curva em 24 horas de 400–600 mg·h/L, assumindo concentração inibitória mínima de 1 mg/L; essa meta de exposição não foi validada por ensaios de desfechos em hemodiálise. Coletas imediatamente ao fim da sessão podem parecer baixas antes da redistribuição e induzir redose excessiva. Monitorar ao menos semanalmente, com maior frequência conforme instabilidade, e individualizar a manutenção; dose semanal fixa ou alvo5–10 mg/L podem deixar exposição insuficiente.",
  "diff": "medium",
  "cat": "farmacologia",
  "refs": [
    "vancomycin_monitoring_ashp"
  ]
}
```

## a493996a

```json
{
  "t": "Sinvastatina e Macrolídeo — Mecanismo da Interação",
  "qid": "a493996a",
  "q": "Paciente com doença renal crônica usa sinvastatina e inicia claritromicina. Dias depois, apresenta mialgia intensa, creatina quinase muito elevada, lesão renal aguda e hipercalemia. Qual mecanismo farmacocinético melhor explica a interação?",
  "refs": [
    "simvastatin_fda_interactions_2023"
  ],
  "opts": [
    "Indução do metabolismo hepático, formando maior quantidade de metabólitos musculares tóxicos.",
    "Competição pela eliminação renal, que seria a principal via de depuração da sinvastatina.",
    "Deslocamento da ligação à albumina, como mecanismo predominante da interação entre as duas drogas.",
    "Bloqueio do citocromo P450 3A4, elevando a exposição à sinvastatina e o risco de rabdomiólise."
  ],
  "ans": 3,
  "exp": "A sinvastatina depende do citocromo P450 3A4 para seu metabolismo. A inibição forte dessa via pela claritromicina aumenta a exposição e o risco de miopatia e rabdomiólise, podendo ocorrer lesão renal aguda. A interação não se explica principalmente por indução de metabólitos tóxicos, competição pela depuração renal da sinvastatina ou deslocamento da albumina. A bula FDA contraindica a associação com inibidores fortes dessa via e orienta suspender a sinvastatina quando um curso curto do inibidor for indispensável. No quadro já instalado, a sinvastatina deve ser retirada e a rabdomiólise, a função renal e a hipercalemia avaliadas prontamente. A regra não deve ser estendida de maneira automática a todas as estatinas.",
  "diff": "medium",
  "cat": "farmacologia"
}
```

## 5bfb77d2

```json
{
  "t": "Tramadol na DRC — Neurotoxicidade e Conduta",
  "qid": "5bfb77d2",
  "q": "Paciente com doença renal crônica e depuração estimada de creatinina de 22 mL/min usa tramadol oral de liberação imediata 100 mg a cada 8 horas para dor crônica. Após alguns dias, apresenta uma crise convulsiva generalizada, já controlada. Não há epilepsia prévia nem uso de fármacos serotoninérgicos. Qual é a melhor conduta farmacológica após estabilizar a crise?",
  "opts": [
    "Apenas espaçar o tramadol para cada 12 horas e manter a exposição após a primeira crise.",
    "Suspender o tramadol, suspeitar de neurotoxicidade e reavaliar a estratégia analgésica.",
    "Trocar diretamente por morfina em dose habitual, sem considerar o acúmulo de metabólitos.",
    "Trocar pela apresentação de liberação prolongada, mantendo a mesma dose diária total."
  ],
  "ans": 1,
  "exp": "A excreção de tramadol e de seu metabólito ativo M1 diminui na disfunção renal. Para depuração de creatinina abaixo de 30 mL/min, a bula de liberação imediata orienta intervalo de 12 horas e máximo de 200 mg/dia; o caso recebe 300 mg/dia. Convulsões podem ocorrer mesmo em doses recomendadas, com maior risco em exposição elevada. Após a crise, apenas corrigir intervalo ou formulação mantém o fármaco suspeito: deve-se retirá-lo e investigar também outras causas de convulsão. A analgesia exige reavaliação individual, priorizando medidas não farmacológicas e não opioides quando adequadas. A troca automática por morfina em dose habitual também é insegura pelo acúmulo de metabólitos na doença renal avançada.",
  "diff": "medium",
  "cat": "farmacologia",
  "refs": [
    "roy_pain_ckd_2020",
    "tramadol_fda_label_2019"
  ]
}
```

## Candidato separado do relato de caso

statin-case-author-candidate-A1.json contém12campos do relato real Ezad/Cheema/Collins. Está BLOQUEADO até revisão clínica formal independente. MantémID, favoritos e história; não cria alias à bula ou novo crédito. Root adjudicou apenas o formatoCASO, não o corpo.

```json
{
  "label": "Ezad, Cheema e Collins — Rabdomiólise após sinvastatina e claritromicina (2018)",
  "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5853001/",
  "journal": "Oxf Med Case Reports. 2018;2018(3):omx104. DOI:10.1093/omcr/omx104",
  "ano": 2018,
  "tipo": "Relato de caso",
  "badge": "CASO",
  "badgeColor": "#64748b",
  "impacto": "Relata rabdomiólise grave após associação de sinvastatina e claritromicina; não estima incidência ou efeito comparativo.",
  "icon": "🔬",
  "resumo": "Relato de homem de 67 anos em uso de sinvastatina 80 mg/dia, que havia iniciado claritromicina 250 mg/dia cerca de um mês antes. Apresentou mialgia e fraqueza; a creatina quinase atingiu 223.859 U/L, a creatinina subiu de 63 para 325 µmol/L e o potássio atingiu 7,4 mmol/L. Os dois medicamentos foram retirados; recebeu tratamento clínico e hidratação intravenosa. Diálise foi considerada, mas não realizada. Na alta, a creatinina havia melhorado para 106 µmol/L. O relato descreve uma evolução individual, sem grupo comparador.",
  "conclusao": "O caso ilustra uma interação clinicamente relevante e a importância de reconhecer toxicidade muscular e suas complicações. Não permite quantificar risco, provar causalidade isolada ou recomendar seu esquema de tratamento como protocolo atual.",
  "curiosidade": "O paciente evoluiu com lesão renal e hipercalemia mesmo após a retirada dos medicamentos na admissão. O acompanhamento da trajetória foi necessário; interromper a exposição não garante resolução imediata."
}
```

SHA256 dos BYTES JSON farmacologia: `58e5a871e7af3f1b6905c175b8de339d30b03ea57d1c6a6b014125c27ce81dab`.

SHA256 dos BYTES candidato: `eb2a7f065383bfb0f00097ea89968e4daad67284b2615f53fb84da921978326e`.
