# Farmacologia — cinco candidatos e dois holds reais

Revisão formal autoral, não independente. CincoAFTERs: aprovada /VERIFICADA/NENHUMA/LIBERADA autoral. Nenhum arquivo de produção alterado. Os dois holds não têm AFTER liberado.

| QID | Ação | Limite principal |
|---|---|---|

|a4c4eff0|Reparar|Selecionar conduta segura perante interação entre claritromicina e tacrolimo, sem suspensão não planejada da imunossupressão.|

|7d2284a4|Reparar|Interpretar a evidência de segurança muscular da combinação sinvastatina/ezetimiba estudada em doença renal avançada.|

|9200dc0a|Reparar|Planejar reposição e monitorização da vancomicina na hemodiálise intermitente de alto fluxo.|

|a493996a|Reparar|Reconhecer inibição do metabolismo da sinvastatina por claritromicina como causa de exposição aumentada e rabdomiólise.|

|5bfb77d2|Reparar|Reconhecer possível neurotoxicidade por tramadol na disfunção renal e retirar o agente suspeito, sem substituição automática inadequada.|

|2acaa158|HOLD_REAL_SOURCE_ACCESS|Cortazar original confirma padrão histológico e associação observacional de recuperação com esteroides; não substitui o ponto clínico decisivo de manejo do consenso ASON. ASON PMID39455026 apenas abstract aberto; PDF publisher403 e reprint com certificado incompatível. Nenhum AFTER clínico liberado por conhecimento geral.|

|471c0013|DUPLICATION_AND_SAFETY_REPAIR_IN_PROGRESS|Bedford integral aberto confirma11 participantes com exclusão de nefropatia conhecida. O caso já tem creatinina1,8/fibrose/microcistos: não liberar amilorida automática por extrapolação de estudo pequeno. Além disso, outros dois itens já testam mecanismo e amilorida. Precisa adjudicar a consolidação e definir texto mínimo seguro, sem fabricarOP para manter quantidade.|

## a4c4eff0

OP: Selecionar conduta segura perante interação entre claritromicina e tacrolimo, sem suspensão não planejada da imunossupressão.

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

Recurso: O caso agora explicita que existe alternativa ativa adequada e que um macrolídeo é indicado; não faz de azitromicina a primeira escolha universal para amigdalite. A correta mantém acompanhamento e não promete risco zero. A alternativa de ajustar tacrolimo pode ser necessária se a claritromicina for inevitável, condição excluída pelo caso e explicada no comentário.

Vínculo `sha256:496ddad571a3a0a399ea19c5dc2105942e8173146ee6ea8a8d2b29dcadc9ccd5`.

## 7d2284a4

OP: Interpretar a evidência de segurança muscular da combinação sinvastatina/ezetimiba estudada em doença renal avançada.

```json
{
  "t": "Farmacologia Renal",
  "qid": "7d2284a4",
  "q": "Paciente de 58 anos com doença renal crônica G4 não dialítica discute sinvastatina 20 mg associada a ezetimiba 10 mg. Qual interpretação da segurança muscular no SHARP é adequada?",
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
  "exp": "No SHARP,9.270 participantes com doença renal crônica receberam sinvastatina 20 mg mais ezetimiba 10 mg ou placebo. A miopatia foi rara: nove versus cinco casos. O pequeno excesso absoluto não equivale a ausência de risco e não elimina a revisão de interações, sintomas e doses. O ensaio incluiu doença renal avançada, mas não permite extrapolar a segurança da combinação estudada a qualquer estatina em dose alta. A redução de eventos ateroscleróticos foi de 17%; o estudo não demonstra que a combinação preserve a filtração ou que seus componentes tenham sido comparados isoladamente.",
  "diff": "medium",
  "cat": "farmacologia"
}
```

Recurso: A pergunta original já tratava de segurança e utilidade de estatina em G4. A nova redação delimita o componente de segurança, sem criar outro mecanismo ou conduta. A interpretação de finalidade cardiovascular versus nefroproteção permanece em7215c49d; se o revisor considerar o recorte insuficiente para OP independente, consolidar os itens é preferível a inventar justificativa para mantê-los.

Vínculo `sha256:1bc357fe9fd7d7d81e8a557621c44d96482822eae0b9b952540af19f10fde5bc`.

## 9200dc0a

OP: Planejar reposição e monitorização da vancomicina na hemodiálise intermitente de alto fluxo.

```json
{
  "t": "Vancomicina em Hemodiálise de Alto Fluxo — Dose e Monitorização (ASHP 2020)",
  "qid": "9200dc0a",
  "q": "Paciente em hemodiálise de manutenção de alto fluxo, três vezes por semana, recebe vancomicina para bacteremia por Staphylococcus aureus resistente à meticilina. Já recebeu ataque de 25 mg/kg. Segundo a diretriz de 2020, qual estratégia de manutenção e monitorização é mais adequada?",
  "opts": [
    "Repor após cada sessão e ajustar a dose por concentração coletada logo ao terminar a diálise.",
    "Repor após as sessões e ajustar pelos níveis pré-diálise, em geral visando 15–20 mg/L.",
    "Repor uma vez por semana e usar os níveis pré-diálise apenas para confirmar a dose semanal.",
    "Repor após as sessões e manter alvo pré-diálise de 5–10 mg/L para reduzir exposição."
  ],
  "ans": 1,
  "exp": "A hemodiálise de alto fluxo remove vancomicina em quantidade clinicamente relevante. O guideline propõe, como ponto de partida, ataque de 25 mg/kg e manutenção de cerca de 10 mg/kg após as sessões trissemanalmente, com ajuste pelos níveis. A concentração pré-diálise de 15–20 mg/L é uma aproximação prática de área sob a curva em 24 horas de 400–600 mg·h/L, assumindo concentração inibitória mínima de 1 mg/L; essa meta de exposição não foi validada por ensaios de desfechos em hemodiálise. Coletas imediatamente ao fim da sessão podem parecer baixas antes da redistribuição e induzir redose excessiva. Monitorar ao menos semanalmente, com maior frequência conforme instabilidade, e individualizar a manutenção; dose semanal fixa ou alvo5–10 mg/L podem deixar exposição insuficiente.",
  "diff": "medium",
  "cat": "farmacologia",
  "refs": [
    "vancomycin_monitoring_ashp"
  ]
}
```

Recurso: A dose de ataque já foi administrada. A correta não obriga repor dose fixa se o nível estiver alto: exige ajuste pelos níveis. O enunciado especifica manutenção trissemanal de alto fluxo, separando esta estratégia das terapias contínuas ou híbridas.

Vínculo `sha256:523a6af784bdfc69af717a6b7276591c3de8cb857466306b4c0d7c99f6810105`.

## a493996a

OP: Reconhecer inibição do metabolismo da sinvastatina por claritromicina como causa de exposição aumentada e rabdomiólise.

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

Recurso: Os antigos distratores sobre ferro, quelante e vitaminaC foram substituídos por três erros farmacocinéticos reconhecíveis. O título deixa de entregar a via metabólica antes da resposta. A fonte regulatória necessária é explicitamente BULA; o antigo URL era relato de caso de autores/periódico diferentes e não foi falsamente classificado como revisão.

Vínculo `sha256:422547530da2e7b35e55d61c63c9ea1992d69b39c3d52a2b068fef21831bad3d`.

## 5bfb77d2

OP: Reconhecer possível neurotoxicidade por tramadol na disfunção renal e retirar o agente suspeito, sem substituição automática inadequada.

```json
{
  "t": "Tramadol na DRC — Neurotoxicidade e Conduta",
  "qid": "5bfb77d2",
  "q": "Paciente com doença renal crônica e depuração estimada de creatinina de 22 mL/min usa tramadol de liberação imediata 100 mg a cada 8 horas para dor crônica. Após alguns dias, apresenta uma crise convulsiva generalizada, já controlada. Não há epilepsia prévia nem uso de fármacos serotoninérgicos. Qual é a melhor conduta farmacológica após estabilizar a crise?",
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

Recurso: Depuração de creatinina passa a ser o dado fornecido, evitando tratar taxa de filtração estimada indexada como número intercambiável com depuração na regra da bula. A crise já está controlada e a pergunta se limita ao agente analgésico; não omite tratamento emergencial nem presume que tramadol seja causa comprovada exclusiva.

Vínculo `sha256:3fccd00628d236f74fbc7856e9a2b9223c1c7a2d67cffe1b5d053412da9ab722`.

## Cards reparados e novo documento regulatório

### cni_macrolide_ddi_jeong_2019

```json
{
  "label": "Macrolídeos e inibidores de calcineurina no transplante renal (Jeong et al.)",
  "url": "https://journals.sagepub.com/doi/10.1177/2054358119830706",
  "journal": "Can J Kidney Health Dis 2019;6:2054358119830706",
  "ano": 2019,
  "tipo": "Coorte",
  "badge": "COHORT",
  "badgeColor": "#f59e0b",
  "impacto": "Claritromicina/eritromicina associaram-se a mais hospitalizações; o composto primário não diferiu significativamente.",
  "icon": "🔬",
  "resumo": "Coorte retrospectiva de 293 receptores de transplante renal em uso de inibidor de calcineurina, em Alberta,2008–2015:112 receberam claritromicina/eritromicina e181 azitromicina. O composto primário de hospitalização, lesão renal aguda ou morte em 30 dias ocorreu em 17% versus 11% (P=0,11). Hospitalização isolada ocorreu em 10% versus 3% (P=0,02); a queda média da taxa de filtração glomerular estimada foi−5,4 versus −1,9 mL/min/1,73 m² (P<0,05). Os autores não dispunham de níveis dos imunossupressores nem das indicações dos antibióticos.",
  "conclusao": "A interação metabólica conhecida exige cautela na escolha do macrolídeo para receptores em tacrolimo ou ciclosporina. A associação com mais hospitalizações não prova causalidade, não demonstra diferença significativa no composto primário e não significa risco zero com azitromicina.",
  "curiosidade": "A coorte não mediu as concentrações dos inibidores de calcineurina. Portanto, não pode ser apresentada como demonstração direta de elevação desses níveis nos participantes."
}
```

### vancomycin_monitoring_ashp

```json
{
  "label": "Rybak et al. — Monitorização da vancomicina: guideline integral (2020)",
  "url": "https://www.ashp.org/-/media/assets/policy-guidelines/docs/therapeutic-guidelines/therapeutic-guidelines-monitoring-vancomycin-ASHP-IDSA-PIDS.ashx",
  "journal": "Am J Health-Syst Pharm. 2020;77(11):835–864. DOI:10.1093/ajhp/zxaa036",
  "ano": 2020,
  "tipo": "Diretriz",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Exposição de vancomicina guiada pela área sob a curva, com estratégia específica para hemodiálise.",
  "icon": "📋",
  "resumo": "Diretriz de consenso para infecções invasivas graves por Staphylococcus aureus resistente à meticilina (MRSA). Recomenda área sob a curva em 24 horas (AUC24) de 400–600 mg·h/L, assumindo concentração inibitória mínima (MIC) de 1 mg/L por microdiluição, com estimativa farmacocinética ou bayesiana. O vale de 15–20 mg/L não é substituto universal da AUC. Na hemodiálise intermitente, a concentração pré-diálise de 15–20 mg/L é a estratégia prática para estimar a exposição; monitorar pelo menos semanalmente e ajustar as doses pelos níveis.",
  "conclusao": "Ajustar dose e monitorização à população e à modalidade dialítica. Em hemodiálise, a faixa pré-diálise é uma aproximação prática; a meta de exposição não foi validada por ensaios de desfechos nessa população.",
  "curiosidade": "O documento integral contém recomendações para hemodiálise e terapias contínuas. Seu resumo executivo em Clinical Infectious Diseases é uma publicação relacionada, com DOI e paginação próprios."
}
```

### simvastatin_fda_interactions_2023

```json
{
  "label": "ZOCOR — Interações e rabdomiólise (FDA,2023)",
  "url": "https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/019766Orig1s103lbl.pdf",
  "journal": "FDA — Prescribing Information, ZOCOR (Organon)",
  "ano": 2023,
  "tipo": "Bula profissional aprovada pela FDA",
  "badge": "BULA",
  "badgeColor": "#64748b",
  "impacto": "Sinvastatina com inibidor forte do citocromo P4503A4 é uma combinação contraindicada.",
  "icon": "📋",
  "resumo": "Bula profissional de ZOCOR (sinvastatina), revisada em março de 2023. A sinvastatina é metabolizada pelo citocromo P4503A4; inibidores fortes dessa via aumentam sua exposição e o risco de miopatia e rabdomiólise. A associação é contraindicada, incluindo os macrolídeos fortes especificados no documento. Se o inibidor forte for necessário por curto período, a bula orienta suspensão temporária da sinvastatina durante o tratamento. Miopatia suspeita ou creatina quinase muito elevada exige retirada da sinvastatina.",
  "conclusao": "A interação deve ser prevenida pela revisão dos medicamentos e pela interrupção da associação contraindicada. A informação é específica da sinvastatina; não se estende automaticamente a todas as estatinas.",
  "curiosidade": "A bula distingue associação contraindicada com inibidores fortes e limites de dose com outros medicamentos. Uma única regra de ajuste não serve para todas as interações."
}
```

## Card de relato falsamente classificado

statin_cyp3a4_rhabdo_review tem identidade e tipo falsos; único consumidor está sendo reatribuído à bula. Não há liberação do card antigo. Revisor deve adjudicar aposentadoria ou tipo correto, preservando história.

## Limites

ASON só abstract; nenhum manejo decisivo aprovado sem corpo original. Bedford foi aberto integralmente pela web, mas não autoriza extrapolar amilorida sem segurança no caso com doença renal. Todos os13LRA continuam em trabalho; estes holds não encerram a frente.

SHA256 dos BYTES JSON: `629fc0c7ecff97f218fc40561995a3b3e0d12127a0bded60d3762870fec1666e`.
