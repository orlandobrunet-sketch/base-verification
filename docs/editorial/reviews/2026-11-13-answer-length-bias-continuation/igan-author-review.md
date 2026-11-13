A3 explicita somente o domínio primário/idiopático em 795d4589.q e no resumo do card Barbour. Demais campos clínicos e de cards preservados à A2; hashes e bindings atualizados.

A2 corrige somente o ícone do card REVIEW Rodrigues para 🔬 e seus bindings. Todos os objetos clínicos e demais campos dos cards estão preservados da A1, sem aprovação herdada.

# Revisão autoral — IgAN: diagnóstico, patologia e prognóstico — A3

Foram inventariados e classificados **26 originais antes de qualquer candidato**. Este primeiro subgrupo corresponde aos **seis itens completos** de diagnóstico, patologia e prognóstico, reunidos por OP e fontes coerentes. **20 itens continuam na fila**, incluindo intervenções e ensaios recentes; nenhum foi considerado revisado por associação de tema. O item 2a595b23 não integra este lote, pois está em revisão ANCA separada.

Os seis candidatos e os dois novos cards estão **BLOQUEADOS**. Esta é a autoria com encaminhamento para contraprova independente, não liberação final. Nenhum arquivo do aplicativo, histórico, manifest, versão ou Git foi alterado.

Pacote exato: [igan-candidates-A3.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-candidates-A3.json), SHA256 `083486a48c97390425366845c510dfb4b9941dc3531774119386f4a91092a0ad`. Originais: [igan-original.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-original.json), SHA256 `6bdc18e799b0d90384537330d4146597b586210d813486f1a07c1d9d6afef640`. Evidências: [igan-author-evidence.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-author-evidence.json). Novos cards: [igan-reference-proposals-A3.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-reference-proposals-A3.json).

## Forma das alternativas e métricas

A correta única mais longa por caracteres passou de **6/6 para 1/6** nas propostas; por palavras, de **6/6 para 0/6**. Corretas únicas mais curtas por caracteres: **0/6 para 2/6**. Não houve meta de tamanho, enchimento ou regra de simetria. Sequências do modelo patogênico têm estrutura paralela porque testam local, ordem e glicosilação; opções clínicas incluem interpretação e conduta na mesma categoria. Qualificadores necessários foram preservados no enunciado ou explicação. O lote não elimina o viés do banco inteiro.

Método: NFC, espaços normalizados, pontos de código Unicode e palavras separadas por espaço. Não remover texto entre sinais de desigualdade. Hashes: SHA256 de JSON.stringify do objeto, em UTF-8, com ordem original dos campos.

| qid | OP | Bloom / Miller | Diff herdado → final autoral | Veredito autoral | Evidência | Pendência decisiva | Score provisório | Publicação | Ação |
|---|---|---|---|---|---|---|---|---|---|
| ce79d609 | Interpretar MEST-C como parte da estratificação prognóstica sem selecionar terapia automaticamente. | Analisar / Sabe como | hard → medium | revisão maior | VERIFICADA | Nenhuma detectada pelo autor; gate independente pendente | 19/20 | BLOQUEADA | Contraprova do item e cards |
| 795d4589 | Usar IgAN Prediction Tool para prognóstico sem prever resposta a tratamento específico. | Compreender / Sabe | hard → easy | revisão maior | VERIFICADA | Nenhuma detectada pelo autor; gate independente pendente | 19/20 | BLOQUEADA | Contraprova do item e cards |
| 5e5b8558 | Reconhecer apresentação sinfaringítica sugestiva de IgAN sem substituir confirmação histológica e avaliação de risco. | Aplicar / Sabe como | medium → medium | revisão maior | VERIFICADA | Nenhuma detectada pelo autor; gate independente pendente | 19/20 | BLOQUEADA | Contraprova do item e cards |
| 26804856 | Interpretar depósitos mesangiais IgA predominantes com C3 sem concluir etiologia primária automaticamente. | Analisar / Sabe como | medium → medium | revisão maior | VERIFICADA | Nenhuma detectada pelo autor; gate independente pendente | 19/20 | BLOQUEADA | Contraprova do item e cards |
| 12328a3e | Classificar 35% de fibrose/atrofia como T1 e interpretar como dano crônico prognóstico. | Aplicar / Sabe como | medium → easy | revisão maior | VERIFICADA | Nenhuma detectada pelo autor; gate independente pendente | 19/20 | BLOQUEADA | Contraprova do item e cards |
| ea37c153 | Reconhecer a sequência do modelo de quatro hits da IgAN. | Compreender / Sabe | medium → easy | revisão maior | VERIFICADA | Nenhuma detectada pelo autor; gate independente pendente | 19/20 | BLOQUEADA | Contraprova do item e cards |

As notas e a ausência de eliminatório são avaliações autorais provisórias. O revisor independente deve avaliar de novo cada dimensão, decidir a identidade e derivar os três eixos da versão exata. Não há aprovação nem liberação a herdar.

## Atualidade, fontes e limites de acesso

A KDIGO 2025 específica de IgAN/IgAV foi aberta no PDF oficial, nas seções normativas pertinentes: PP 1.2.1 (diagnóstico), 1.3.1 (prognóstico), 1.4.2.3 (limites da seleção terapêutica) e Figuras 1–3. Não se estendeu essa verificação a todas as terapias de 2026. A revisão Rodrigues/Haas/Reich 2017 foi consultada integralmente por seções para os fundamentos; suas recomendações terapêuticas antigas não foram convertidas em prática atual.

A cópia íntegra do Oxford 2017 foi conferida quanto a título, DOI e definições da Tabela 3, p.1018: T1 em 26–50% e T2 acima de 50%. Arquivo de oito páginas, SHA256 `591a3bdf8881c760342b41b3c8cbb074ad13f639eb9955fefcd97b69d4cf7b1d`. O acesso à cópia anterior com certificado vencido não foi forçado. O primário Barbour 2019 foi consultado no resumo e em métodos/resultados para endpoint e componentes do modelo. Suzuki 2009 sustenta o reconhecimento antiglicano e a formação de complexos; foi lido o resumo primário integral, sem alegação de texto completo ou validação clínica de biomarcador. O consenso Mayo/RPS foi aberto para a correlação entre padrão de imunofluorescência, microscopia e clínica.

**Divergência de fonte registrada:** a narrativa KDIGO 2025 S33 diz MEST-C ao descrever o modelo prognóstico, enquanto sua Figura 1 lista M/E/S/T. O primário Barbour 2019 descreve MEST sem C nos modelos originais na biópsia. A proposta mantém essa distinção com base no modelo primário e não esconde a inconsistência. Também evita confundir o horizonte/versões da ferramenta atual com a validação original.

A busca de atualidade identificou Shi/TESTING (JASN 2026, DOI 10.1681/ASN.0000000796), uma subanálise com sinais de resposta de lesões específicas, e Nong 2026 (DOI 10.3389/fendo.2026.1873181), coorte retrospectiva com pareamento. Esses estudos não são randomização prospectiva de tratamento atribuído pelo MEST-C. Por isso, o item ce79 não afirma que histologia nunca se associa à resposta; afirma que o laudo não escolhe sozinho uma terapia. Nenhum resultado novo foi incorporado como regra automática ou limiar.

## Identidade e duplicação

ce79d609 e 12328a3e compartilham a competência, mas a autoria propõe variação útil nas outras dimensões: o primeiro interpreta o uso prognóstico e o limite inferencial de um laudo completo; o segundo classifica uma medida de 35% no intervalo T1 e distingue compartimentos. O primeiro exclui prognóstico zero/prescrição automática; o segundo exclui troca de faixa ou de componente. A contraprova deve decidir se isso é variação suficiente; se não for, reter o redundante, sem trocar seu OP ou qid para conservar quantidade.

Em 5e5b8558 foi explicitada IgA sérica normal, hipótese que já aparecia como distrator no original, para avaliar seu uso incorreto como teste de exclusão. O caso mantém proteinúria persistente e o padrão sinfaringítico, sem fazer a dosagem confirmar/excluir a doença. A identidade precisa ser confirmada independentemente. O livro Brenner não foi alegado como lido: substituiu-se esse vínculo por revisão aberta específica, junto à diretriz atual.

## Cards e acervo pendente

Os dois IDs propostos foram confirmados ausentes de refsDB e não têm consumidores atuais. A revisão de fundamentos tem cinco consumidores propostos; o card Barbour, um. Cada objeto completo e hash está em arquivo próprio, com todos os consumidores propostos. O badge COHORT do Barbour corresponde a coortes com desfecho longitudinal, não a uma análise transversal.

Há uma pendência material separada no card kdigo_igan_2021: atribuição MEST-C ao modelo e falta de contexto histórico de uma regra antiga de suporte antes de terapia. O único consumidor atual é ddb4938a, ainda na fila. O inventário completo, original e hashes foram registrados em [igan-existing-card-issues.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-existing-card-issues.json), sem propor alteração ou aplicação. Nenhum dos seis candidatos usa esse card; sua pendência não é transferida artificialmente a um item com fontes adequadas. Não reescrever históricos.

---

## ce79d609 — IgAN — Oxford MEST-C sem Prescrição Automática

### Veredito

**Revisão maior**, na etapa de autoria; não é aprovação. **Confiança: alta** para as afirmações mapeadas. **Evidência: VERIFICADA** na autoria. **Pendência: NENHUMA decisiva de verificação detectada pelo autor**, com contraprova editorial, de identidade e referências ainda pendente. **Autorização de publicação: BLOQUEADA**, derivada da ausência de veredito final de aprovação.

Original SHA256 `cb69780349ebbf5c52ba4e14acf194d6d7a72a8a59b30431007d7dbc44ffdfcb`; candidato A3 `9455e6e16e8bde218f6b1cb2c0f49d20880c3d423e2d80c102b5818eeee962a0`.

### OP e classificação

Interpretar MEST-C como parte da estratificação prognóstica sem selecionar terapia automaticamente. Competência: Diagnóstico, patologia e estratificação de risco na nefropatia por IgA. Bloom **Analisar**; Miller **Sabe como**. Diff herdado **hard**; proposta final **medium**. Aplica/integra dados ou interpreta limites de evidência, sem depender de raridade de fármaco para definir dificuldade.

### Justificativa e problemas

A correta original acumulava definição numérica, prognóstico e limitação de prescrição, com extensão muito maior. As demais dependiam de proibições amplas ou erro de prognóstico zero. A revisão separa a leitura das opções da justificativa, preservando o OP de uso da histologia e suas limitações.

### Advogado do Recurso

M1/S1 não são teste de resposta; E0 não exclui toda atividade, C0 não neutraliza T2. Conferir variação útil versus123: aqui o discriminante é uso prognóstico e limite terapêutico de laudo completo, não apenas atribuir códigoT.

### Critérios eliminatórios

Nenhum detectado pelo autor na proposta. A contraprova deve confirmar uma melhor resposta, plausibilidade dos erros, limites das referências e preservação do conceito discriminante. A possível sobreposição de ce79/123 e a adição de IgA sérica normal em 5e5 são pontos de adjudicação explícita, não liberações tácitas.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. Se a contraprova detectar eliminatório, a nota é anulada. Não herdar pontuação ou aprovação.

### Decisão pela árvore editorial

Mudança material na redação, referências e/ou classificação → contraprova independente da versão exata → só eventual aprovação pode derivar liberação. Estado de trabalho: **em_revisão**. Decisão de legado proposta: **REESCREVER** após gate, ou reter se identidade/duplicação não for confirmada.

### Patch editorial sugerido

**Não aplicar agora.** Após eventual liberação, substituir apenas `q`, `refs`, `opts`, `exp`, `diff`. Qid, título, categoria e gabarito-conceito permanecem preservados.

#### Pergunta

Na nefropatia por imunoglobulina A (IgA), a classificação de Oxford registra hipercelularidade mesangial (M), hipercelularidade endocapilar (E), esclerose segmentar (S), atrofia tubular/fibrose intersticial (T) e crescentes (C). Um laudo informa M1 E0 S1 T2 C0. Como esse resultado deve ser usado?

#### Alternativas

**A**
Acrescenta informação prognóstica aos dados clínicos, sem escolher sozinho a terapia

**B**
Seleciona a imunossupressão a partir de M1 e S1, sem depender da evolução clínica

**C**
Estabelece baixo risco a partir de C0, mesmo com atrofia e fibrose cortical extensas

**D**
Demonstra ausência de atividade a partir de E0, mesmo se houver proteinúria persistente

#### Resposta correta

**A — Acrescenta informação prognóstica aos dados clínicos, sem escolher sozinho a terapia**

#### Explicação

O escore de Oxford acrescenta informação prognóstica à avaliação clínica. T2 corresponde a atrofia tubular/fibrose intersticial em mais de 50% do córtex e sinaliza dano crônico extenso. Esse dado deve ser integrado à taxa de filtração glomerular estimada (TFGe), proteinúria, pressão e trajetória clínica. E0 informa ausência de hipercelularidade endocapilar na amostra, sem excluir toda atividade da doença. C0 não anula o risco ligado à cronicidade. M1 e S1 também não selecionam, por si sós, imunossupressão ou um fármaco específico: essa inferência não foi validada por ensaios prospectivos de tratamento baseado no escore.

#### Distratores e erros clínicos

- B: Transformar associações histológicas em teste de resposta terapêutica.
- C: Anular risco de lesão crônica pela ausência de crescentes.
- D: Interpretar ausência de hipercelularidade endocapilar como ausência de toda atividade.

#### Referências e rastreabilidade

Vínculos finais: `kdigo_igan_igav_2025`, `rodrigues_haas_reich_igan_2017`. Cada hash está em referenceBindings. IDs existentes não alterados conservam seus hashes; os novos cards precisam de gate integral independente.

- **MEST_PROGNOSIS**: A histologia de Oxford acrescenta informação prognóstica aos dados clínicos; não neutraliza função renal, proteinúria, pressão ou evolução. M/E/S/T/C descrevem compartimentos distintos. Local: KDIGO PP 1.3.1; Rodrigues, Clinical-Pathologic Correlation; Oxford, resumo. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf), [RODRIGUES2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/), [OXFORD2017](https://pubmed.ncbi.nlm.nih.gov/28341274/).
- **T_EXTENT**: Atrofia tubular/fibrose intersticial em 26–50% da área cortical é T1; acima de 50%, T2. Os limites foram conferidos diretamente na tabela da classificação original e na revisão aberta. Local: Oxford 2017 Tabela 3, p.1018; Rodrigues, Clinical-Pathologic Correlation. Fontes: [OXFORD2017](https://pubmed.ncbi.nlm.nih.gov/28341274/), [RODRIGUES2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/).
- **MEST_NO_AUTO_THERAPY**: Não há demonstração prospectiva de melhores resultados ao atribuir tratamento apenas pelo MEST-C. Histologia/crescentes devem ser integrados à evolução clínica; nenhum componente isolado seleciona automaticamente terapia. Local: KDIGO PP 1.4.2.3, S37; Shi, Methods/Results/limitations; Nong, Methods2.1 e Discussion. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf), [SHI_TESTING_2026](https://pubmed.ncbi.nlm.nih.gov/40627446/), [NONG_2026](https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2026.1873181/full).
  Limite: Não se nega associação histológica com resposta: a subanálise TESTING sugere benefício diferencial de lesões específicas, e Nong propõe SumMEC. Nenhum é ensaio prospectivo de alocação terapêutica guiada pelo MEST-C; o limite do item é não usar o laudo sozinho como prescrição.

#### Observações de implementação

Não escrever no aplicativo enquanto bloqueado. Preservar avaliações e snapshots históricos; não resetar FSRS automaticamente. Dificuldade deve seguir o raciocínio final e a adjudicação, não o tamanho da opção.

Auditoria de quatro dimensões: otherQid: 12328a3e sameCompetency: true opDistinction: Uso prognóstico e limite de terapia do laudo completo versus classificação do percentual de lesão T. conceptDistinction: Integração e limite inferencial do escore versus faixa T1 e compartimento histológico. reasoningDistinction: Interpretar M/E/S/T/C e excluir prognóstico ou prescrição automáticos versus aplicar 35% à faixa 26–50%. errorDistinction: Prognóstico zero ou terapia automática versus troca de faixa ou componente. authorDisposition: Variação útil proposta, sujeita à adjudicação independente; se equivalentes nas quatro dimensões, reter o redundante sem inventar novo OP.

Comprimentos A–D em caracteres: [160,81,77,90] → [84,81,84,87]. Razão da correta pelo maior distrator: 1.778 → 0.966. As métricas são descritivas, sem limiar artificial de aprovação.

---

## 795d4589 — IgAN Prediction Tool — Prognóstico, não Resposta Terapêutica

### Veredito

**Revisão maior**, na etapa de autoria; não é aprovação. **Confiança: alta** para as afirmações mapeadas. **Evidência: VERIFICADA** na autoria. **Pendência: NENHUMA decisiva de verificação detectada pelo autor**, com contraprova editorial, de identidade e referências ainda pendente. **Autorização de publicação: BLOQUEADA**, derivada da ausência de veredito final de aprovação.

Original SHA256 `5d2b0720f8600289b8d73c479bc3154e4812fd948ecd63d5215237918155d7d5`; candidato A3 `d02917c1509c4564603250eb8d005e86ed8e2dc204597812eeae604afb034e57`.

### OP e classificação

Usar IgAN Prediction Tool para prognóstico sem prever resposta a tratamento específico. Competência: Diagnóstico, patologia e estratificação de risco na nefropatia por IgA. Bloom **Compreender**; Miller **Sabe**. Diff herdado **hard**; proposta final **easy**. Recupera ou explica um conceito, mecanismo ou limite; a redação longa e o nome de uma terapia não justificam hard.

### Justificativa e problemas

A correta original juntava variáveis, endpoint, decisão compartilhada e negação de resposta terapêutica em uma opção longa. O comando pede a finalidade da ferramenta; as opções agora comparam finalidades, e o endpoint, os componentes e as limitações ficam explicados depois.

### Advogado do Recurso

Risco prognóstico pode informar discussão terapêutica, mas não é predição de resposta a imunossupressão. A opção A não promete seleção de fármaco. Conferidos endpoint e MEST no primário; divergência da narrativa KDIGO registrada.

### Critérios eliminatórios

Nenhum detectado pelo autor na proposta. A contraprova deve confirmar uma melhor resposta, plausibilidade dos erros, limites das referências e preservação do conceito discriminante. A possível sobreposição de ce79/123 e a adição de IgA sérica normal em 5e5 são pontos de adjudicação explícita, não liberações tácitas.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. Se a contraprova detectar eliminatório, a nota é anulada. Não herdar pontuação ou aprovação.

### Decisão pela árvore editorial

Mudança material na redação, referências e/ou classificação → contraprova independente da versão exata → só eventual aprovação pode derivar liberação. Estado de trabalho: **em_revisão**. Decisão de legado proposta: **REESCREVER** após gate, ou reter se identidade/duplicação não for confirmada.

### Patch editorial sugerido

**Não aplicar agora.** Após eventual liberação, substituir apenas `q`, `refs`, `opts`, `exp`, `diff`. Qid, título, categoria e gabarito-conceito permanecem preservados.

#### Pergunta

Em adulto com nefropatia por imunoglobulina A (IgA) primária confirmada por biópsia, qual é a principal finalidade do International IgAN Prediction Tool?

#### Alternativas

**A**
Estimar o risco de progressão renal combinando dados clínicos e histológicos

**B**
Estimar a resposta à imunossupressão a partir das lesões inflamatórias na biópsia

**C**
Estabelecer o diagnóstico da doença combinando IgA sérica, hematúria e proteinúria

**D**
Determinar o intervalo definitivo de seguimento a partir do risco calculado na biópsia

#### Resposta correta

**A — Estimar o risco de progressão renal combinando dados clínicos e histológicos**

#### Explicação

A ferramenta estima risco de queda de 50% da taxa de filtração glomerular estimada (TFGe) ou falência renal e auxilia a discussão do prognóstico. Nos modelos originais na biópsia, entram dados clínicos e os componentes de hipercelularidade mesangial, hipercelularidade endocapilar, esclerose segmentar e atrofia tubular/fibrose intersticial (MEST). Crescentes são registrados no laudo atualizado de Oxford, mas não compõem esses modelos originais. A diretriz reúne versões da ferramenta para momentos definidos na biópsia ou após ela. O cálculo não diagnostica a doença, não define um seguimento imutável e não foi validado para prever resposta ou selecionar uma terapia específica.

#### Distratores e erros clínicos

- B: Confundir prognóstico com predição de resposta a uma terapia.
- C: Substituir diagnóstico histológico por dados clínico-séricos.
- D: Tratar risco basal como regra definitiva de acompanhamento.

#### Referências e rastreabilidade

Vínculos finais: `kdigo_igan_igav_2025`, `barbour_igan_prediction_2019`. Cada hash está em referenceBindings. IDs existentes não alterados conservam seus hashes; os novos cards precisam de gate integral independente.

- **PRED_MODEL**: O modelo original na biópsia integra dados clínicos e MEST, sem C, para risco de queda permanente de 50% da TFGe ou falência renal. Foram 3927 participantes: 2781 na derivação e 1146 na validação externa. Local: Barbour, Methods/Definitions e Results/Derivation Analysis, Table 1; KDIGO Figura 1, S33. Fontes: [BARBOUR2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6583088/), [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
  Divergência: A narrativa KDIGO 2025 S33 emprega MEST-C; a Figura 1 e o primário Barbour listam MEST. A afirmação está ancorada no modelo primário, com a divergência explicitamente registrada.
- **PRED_LIMIT**: A ferramenta prognóstica não é diagnóstica nem teste validado de resposta a uma terapia. Não substitui reavaliação dinâmica. Versões na biópsia e pós-biópsia têm momentos definidos de uso. Local: KDIGO PP 1.3.1 e 1.4.2.3; Barbour, Objectives/Methods. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf), [BARBOUR2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6583088/).

#### Observações de implementação

Não escrever no aplicativo enquanto bloqueado. Preservar avaliações e snapshots históricos; não resetar FSRS automaticamente. Dificuldade deve seguir o raciocínio final e a adjudicação, não o tamanho da opção.

- A narrativa KDIGO 2025 S33 cita MEST-C, mas a Figura 1 lista MEST. O primário Barbour 2019 confirma MEST sem C nos modelos originais. A divergência foi registrada no mapa, sem ocultar o texto da diretriz.
- Foi retirado o horizonte genérico de sete anos para não confundir a validação original com versões posteriores reunidas na diretriz; endpoint e OP foram preservados.

Comprimentos A–D em caracteres: [161,64,70,80] → [76,81,82,86]. Razão da correta pelo maior distrator: 2.013 → 0.884. As métricas são descritivas, sem limiar artificial de aprovação.

---

## 5e5b8558 — IgAN — Hematúria Sinfaringítica e Confirmação

### Veredito

**Revisão maior**, na etapa de autoria; não é aprovação. **Confiança: alta** para as afirmações mapeadas. **Evidência: VERIFICADA** na autoria. **Pendência: NENHUMA decisiva de verificação detectada pelo autor**, com contraprova editorial, de identidade e referências ainda pendente. **Autorização de publicação: BLOQUEADA**, derivada da ausência de veredito final de aprovação.

Original SHA256 `2c9ac7475d900cf788faa10dc9e11ff74fe09fe56a801844644871accfbfcdec`; candidato A3 `07789df21e4f1c63d614daf7cee1767ccb4755ae4f3d6d2d907b31b543366c50`.

### OP e classificação

Reconhecer apresentação sinfaringítica sugestiva de IgAN sem substituir confirmação histológica e avaliação de risco. Competência: Diagnóstico, patologia e estratificação de risco na nefropatia por IgA. Bloom **Aplicar**; Miller **Sabe como**. Diff herdado **medium**; proposta final **medium**. Aplica/integra dados ou interpreta limites de evidência, sem depender de raridade de fármaco para definir dificuldade.

### Justificativa e problemas

A correta original continha quase todo o plano diagnóstico e a explicação; distratores curtos tratavam sinais como prova. A versão final compara hipótese e próximo passo em todas as alternativas, mantendo confirmação histológica e atenção à proteinúria.

### Advogado do Recurso

O fenótipo sinfaringítico não confirma a doença; proteinúria persistente torna a investigação relevante. Dosagem sérica normal não exclui a hipótese. Considerar biópsia respeita contraindicações, sem impor procedimento automático.

### Critérios eliminatórios

Nenhum detectado pelo autor na proposta. A contraprova deve confirmar uma melhor resposta, plausibilidade dos erros, limites das referências e preservação do conceito discriminante. A possível sobreposição de ce79/123 e a adição de IgA sérica normal em 5e5 são pontos de adjudicação explícita, não liberações tácitas.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. Se a contraprova detectar eliminatório, a nota é anulada. Não herdar pontuação ou aprovação.

### Decisão pela árvore editorial

Mudança material na redação, referências e/ou classificação → contraprova independente da versão exata → só eventual aprovação pode derivar liberação. Estado de trabalho: **em_revisão**. Decisão de legado proposta: **REESCREVER** após gate, ou reter se identidade/duplicação não for confirmada.

### Patch editorial sugerido

**Não aplicar agora.** Após eventual liberação, substituir apenas `q`, `opts`, `exp`, `refs`. Qid, título, categoria e gabarito-conceito permanecem preservados.

#### Pergunta

Adulto jovem apresenta hematúria macroscópica recorrente durante ou até dois dias após infecções de vias aéreas, com proteinúria persistente de 0,7 g/d entre os episódios. A imunoglobulina A (IgA) sérica é normal. Qual interpretação e próximo passo são mais apropriados?

#### Alternativas

**A**
Suspeitar de nefropatia por IgA e considerar biópsia renal na investigação da proteinúria

**B**
Suspeitar de glomerulonefrite pós-infecciosa e usar a curta latência para dispensar biópsia

**C**
Suspeitar de doença da membrana basal fina e atribuir a proteinúria à hematúria recorrente

**D**
Suspeitar de nefropatia por IgA e usar a dosagem sérica normal para encerrar a investigação

#### Resposta correta

**A — Suspeitar de nefropatia por IgA e considerar biópsia renal na investigação da proteinúria**

#### Explicação

Hematúria visível junto ou logo após uma infecção de mucosa é uma apresentação sugestiva de nefropatia por IgA, chamada sinfaringítica. O padrão não basta para confirmar a doença, e IgA sérica normal não a exclui: não existe biomarcador sérico ou urinário validado para substituir o diagnóstico por biópsia. A KDIGO orienta considerar biópsia em adulto com possibilidade dessa doença e proteinúria de pelo menos 0,5 g/d, se não houver contraindicação, além de investigar causas secundárias. Recorrência e curta latência também não comprovam doença da membrana basal fina ou glomerulonefrite pós-infecciosa nem justificam ignorar proteinúria persistente.

#### Distratores e erros clínicos

- B: Usar a latência curta como prova de diagnóstico pós-infeccioso e dispensar avaliação histológica.
- C: Presumir etiologia pela recorrência e desconsiderar proteinúria persistente.
- D: Usar marcador sérico não validado para excluir a doença.

#### Referências e rastreabilidade

Vínculos finais: `kdigo_igan_igav_2025`, `rodrigues_haas_reich_igan_2017`. Cada hash está em referenceBindings. IDs existentes não alterados conservam seus hashes; os novos cards precisam de gate integral independente.

- **SYNPHARYNGITIC**: Hematúria visível durante ou ao redor de infecção de mucosa é apresentação clássica sugestiva de IgAN; não confirma diagnóstico nem autoriza ignorar proteinúria persistente. Local: Rodrigues, Clinical Manifestations/Less Frequent Manifestations; KDIGO PP 1.2.1. Fontes: [RODRIGUES2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/), [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
- **DIAG_BIOPSY**: O diagnóstico exige biópsia. Considerar biópsia em adulto com possibilidade de IgAN e proteinúria ≥0,5 g/d, se não contraindicada; o fenótipo isolado não confirma. Local: KDIGO PP 1.2.1, S15 e S33; Figura 2, S34. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
- **IGA_SEROLOGY**: Não há biomarcador sérico ou urinário validado para substituir o diagnóstico histológico. IgA sérica normal não exclui IgAN; estudos mecanísticos não mudam essa regra. Local: KDIGO PP 1.2.1, S15/S33. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
- **IGA_SECONDARY**: Após reconhecer o padrão, avaliar causas secundárias e diagnósticos próximos: vasculite por IgA, infecções virais, doença inflamatória intestinal, autoimunidade, cirrose e glomerulonefrite relacionada à infecção com IgA dominante. Local: KDIGO PP 1.2.1 e Figura 2, S34. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).

#### Observações de implementação

Não escrever no aplicativo enquanto bloqueado. Preservar avaliações e snapshots históricos; não resetar FSRS automaticamente. Dificuldade deve seguir o raciocínio final e a adjudicação, não o tamanho da opção.

- IgA sérica normal foi acrescentada ao caso para explicitar o uso incorreto do marcador que já constava como distrator original. O OP continua reconhecer o padrão sinfaringítico sem substituir confirmação histológica; a identidade precisa de contraprova.
- Não foi alegada leitura do Brenner. A referência foi substituída por revisão aberta específica de apresentação e fisiopatologia, junto da diretriz atual.

Comprimentos A–D em caracteres: [148,77,63,60] → [89,91,90,91]. Razão da correta pelo maior distrator: 1.922 → 0.978. As métricas são descritivas, sem limiar artificial de aprovação.

---

## 26804856 — IgAN — Interpretação da Imunofluorescência

### Veredito

**Revisão maior**, na etapa de autoria; não é aprovação. **Confiança: alta** para as afirmações mapeadas. **Evidência: VERIFICADA** na autoria. **Pendência: NENHUMA decisiva de verificação detectada pelo autor**, com contraprova editorial, de identidade e referências ainda pendente. **Autorização de publicação: BLOQUEADA**, derivada da ausência de veredito final de aprovação.

Original SHA256 `1ccce85c48a91c66b1f7595bcca91c045e59e08b8b593b21ab7fd15bc6793b04`; candidato A3 `add6b7d47d807adb7fc11b65f4027838a169a5e5e6216b9788caf83cb397797d`.

### OP e classificação

Interpretar depósitos mesangiais IgA predominantes com C3 sem concluir etiologia primária automaticamente. Competência: Diagnóstico, patologia e estratificação de risco na nefropatia por IgA. Bloom **Analisar**; Miller **Sabe como**. Diff herdado **medium**; proposta final **medium**. Aplica/integra dados ou interpreta limites de evidência, sem depender de raridade de fármaco para definir dificuldade.

### Justificativa e problemas

A correta original concentrava integração de todas as microscopias, clínica e causas secundárias. A versão final compara interpretações diagnósticas com a mesma granularidade. Não torna o predomínio de IgA uma prova automática de etiologia primária.

### Advogado do Recurso

IgA predominante com C3 pode ser doença primária ou secundária; não foi fornecido dado que dispense a correlação clínica. Presença de C3 não equivale a predomínio de C3. Não impor microscopia eletrônica como único método diagnóstico.

### Critérios eliminatórios

Nenhum detectado pelo autor na proposta. A contraprova deve confirmar uma melhor resposta, plausibilidade dos erros, limites das referências e preservação do conceito discriminante. A possível sobreposição de ce79/123 e a adição de IgA sérica normal em 5e5 são pontos de adjudicação explícita, não liberações tácitas.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. Se a contraprova detectar eliminatório, a nota é anulada. Não herdar pontuação ou aprovação.

### Decisão pela árvore editorial

Mudança material na redação, referências e/ou classificação → contraprova independente da versão exata → só eventual aprovação pode derivar liberação. Estado de trabalho: **em_revisão**. Decisão de legado proposta: **REESCREVER** após gate, ou reter se identidade/duplicação não for confirmada.

### Patch editorial sugerido

**Não aplicar agora.** Após eventual liberação, substituir apenas `q`, `refs`, `opts`, `exp`. Qid, título, categoria e gabarito-conceito permanecem preservados.

#### Pergunta

Adulto com hematúria glomerular e proteinúria é submetido a biópsia renal. A imunofluorescência mostra depósitos mesangiais predominantes de imunoglobulina A (IgA), acompanhados do componente C3 do complemento, e a microscopia óptica demonstra proliferação mesangial. Qual é a interpretação mais adequada?

#### Alternativas

**A**
Nefropatia por IgA primária, definida pelo predomínio mesangial sem depender de investigação clínica

**B**
Padrão compatível com nefropatia por IgA, com etiologia a definir pela correlação clinicopatológica

**C**
Glomerulopatia C3, definida pela presença de C3 mesmo quando a IgA é o depósito predominante

**D**
Nefropatia membranosa, definida por depósitos granulares que devem ocupar o espaço subepitelial

#### Resposta correta

**B — Padrão compatível com nefropatia por IgA, com etiologia a definir pela correlação clinicopatológica**

#### Explicação

Depósitos glomerulares de IgA predominantes ou codominantes, em geral mesangiais, são o padrão característico da nefropatia por IgA. C3 pode acompanhar esses depósitos e não transforma o caso, isoladamente, em glomerulopatia C3. A interpretação reúne microscopia óptica, imunofluorescência, microscopia eletrônica e dados clínicos. Ainda é necessário avaliar causas secundárias e diagnósticos próximos, como vasculite por IgA, cirrose, infecções virais, doença inflamatória intestinal e glomerulonefrite relacionada à infecção com IgA dominante. Depósito granular não é sinônimo de localização subepitelial nem define nefropatia membranosa.

#### Distratores e erros clínicos

- A: Presumir etiologia primária pelo padrão de depósito, sem pesquisar causas secundárias.
- C: Confundir presença de C3 com predomínio diagnóstico de C3.
- D: Confundir textura granular com localização subepitelial e etiologia membranosa.

#### Referências e rastreabilidade

Vínculos finais: `kdigo_igan_igav_2025`, `rodrigues_haas_reich_igan_2017`. Cada hash está em referenceBindings. IDs existentes não alterados conservam seus hashes; os novos cards precisam de gate integral independente.

- **IGA_IF**: IgA mesangial dominante/codominante é padrão característico. C3 pode acompanhar. Presença de C3 não é igual a padrão de C3 dominante; integrar microscopia óptica, imunofluorescência, microscopia eletrônica e clínica. Textura granular não determina localização subepitelial. Local: KDIGO, introdução S32 e Figura 2; Mayo, Key Disease-Specific Comments de IF/EM; Rodrigues, complemento. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf), [MAYO_RPS2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4849835/), [RODRIGUES2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/).
- **IGA_SECONDARY**: Após reconhecer o padrão, avaliar causas secundárias e diagnósticos próximos: vasculite por IgA, infecções virais, doença inflamatória intestinal, autoimunidade, cirrose e glomerulonefrite relacionada à infecção com IgA dominante. Local: KDIGO PP 1.2.1 e Figura 2, S34. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).

#### Observações de implementação

Não escrever no aplicativo enquanto bloqueado. Preservar avaliações e snapshots históricos; não resetar FSRS automaticamente. Dificuldade deve seguir o raciocínio final e a adjudicação, não o tamanho da opção.

Comprimentos A–D em caracteres: [112,141,87,103] → [100,99,92,95]. Razão da correta pelo maior distrator: 1.259 → 0.990. As métricas são descritivas, sem limiar artificial de aprovação.

---

## 12328a3e — IgAN — Lesão T na Classificação MEST-C

### Veredito

**Revisão maior**, na etapa de autoria; não é aprovação. **Confiança: alta** para as afirmações mapeadas. **Evidência: VERIFICADA** na autoria. **Pendência: NENHUMA decisiva de verificação detectada pelo autor**, com contraprova editorial, de identidade e referências ainda pendente. **Autorização de publicação: BLOQUEADA**, derivada da ausência de veredito final de aprovação.

Original SHA256 `88bc8cc717729dd6951d4558e9242d9e6bdd231851a60ec31e4815fc91444111`; candidato A3 `b400e064283ba1079bbe1c0759076165c90158b83aba656dfa09a43df4941031`.

### OP e classificação

Classificar 35% de fibrose/atrofia como T1 e interpretar como dano crônico prognóstico. Competência: Diagnóstico, patologia e estratificação de risco na nefropatia por IgA. Bloom **Aplicar**; Miller **Sabe como**. Diff herdado **medium**; proposta final **easy**. Classifica uma medida única no intervalo histológico correspondente e distingue compartimentos. O número é um limiar de classificação aplicado, sem integração clínica concorrente; proposta easy, sujeita à adjudicação independente.

### Justificativa e problemas

A correta original explicava intervalo, cronicidade e prognóstico em mais detalhe que os distratores. Agora cada opção combina componente e interpretação, mantendo o cálculo de T1. A justificativa prognóstica permanece na explicação.

### Advogado do Recurso

35% está longe dos limites de corte e corresponde a T1. O discriminante é classificar extensão e compartimento, sem transformar a classificação em terapia. Adjudicar variação útil versus ce79d609.

### Critérios eliminatórios

Nenhum detectado pelo autor na proposta. A contraprova deve confirmar uma melhor resposta, plausibilidade dos erros, limites das referências e preservação do conceito discriminante. A possível sobreposição de ce79/123 e a adição de IgA sérica normal em 5e5 são pontos de adjudicação explícita, não liberações tácitas.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. Se a contraprova detectar eliminatório, a nota é anulada. Não herdar pontuação ou aprovação.

### Decisão pela árvore editorial

Mudança material na redação, referências e/ou classificação → contraprova independente da versão exata → só eventual aprovação pode derivar liberação. Estado de trabalho: **em_revisão**. Decisão de legado proposta: **REESCREVER** após gate, ou reter se identidade/duplicação não for confirmada.

### Patch editorial sugerido

**Não aplicar agora.** Após eventual liberação, substituir apenas `q`, `refs`, `opts`, `exp`, `diff`. Qid, título, categoria e gabarito-conceito permanecem preservados.

#### Pergunta

Na biópsia de um adulto com nefropatia por imunoglobulina A (IgA), atrofia tubular e fibrose intersticial ocupam aproximadamente 35% da área cortical. Como esse achado deve ser registrado e interpretado na classificação de Oxford?

#### Alternativas

**A**
T1: comprometimento de 26–50% do córtex, indicando dano tubulointersticial crônico

**B**
T2: comprometimento acima de 25% do córtex, indicando a maior faixa de extensão

**C**
M1: lesão mesangial quantificada pelo percentual de atrofia e fibrose cortical

**D**
C1: crescente fibrocelular quantificada pela extensão da fibrose intersticial

#### Resposta correta

**A — T1: comprometimento de 26–50% do córtex, indicando dano tubulointersticial crônico**

#### Explicação

A lesão de atrofia tubular/fibrose intersticial é registrada pelo componente T da classificação de Oxford. Envolvimento de 26–50% do córtex corresponde a T1; acima de 50%, a T2. Assim, 35% é T1 e expressa dano crônico com valor prognóstico. M refere-se a hipercelularidade mesangial, e C a crescentes celulares ou fibrocelulares; nenhum deles é medido pela extensão de fibrose intersticial. A histologia deve ser integrada à função renal, proteinúria, pressão e evolução clínica, sem converter uma lesão isolada em prescrição automática.

#### Distratores e erros clínicos

- B: Deslocar o limite de T2 para 25%, classificando 35% como a maior faixa.
- C: Confundir componente mesangial com extensão tubulointersticial.
- D: Equiparar fibrose intersticial a crescente fibrocelular.

#### Referências e rastreabilidade

Vínculos finais: `kdigo_igan_igav_2025`, `rodrigues_haas_reich_igan_2017`. Cada hash está em referenceBindings. IDs existentes não alterados conservam seus hashes; os novos cards precisam de gate integral independente.

- **T_EXTENT**: Atrofia tubular/fibrose intersticial em 26–50% da área cortical é T1; acima de 50%, T2. Os limites foram conferidos diretamente na tabela da classificação original e na revisão aberta. Local: Oxford 2017 Tabela 3, p.1018; Rodrigues, Clinical-Pathologic Correlation. Fontes: [OXFORD2017](https://pubmed.ncbi.nlm.nih.gov/28341274/), [RODRIGUES2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/).
- **MEST_PROGNOSIS**: A histologia de Oxford acrescenta informação prognóstica aos dados clínicos; não neutraliza função renal, proteinúria, pressão ou evolução. M/E/S/T/C descrevem compartimentos distintos. Local: KDIGO PP 1.3.1; Rodrigues, Clinical-Pathologic Correlation; Oxford, resumo. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf), [RODRIGUES2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/), [OXFORD2017](https://pubmed.ncbi.nlm.nih.gov/28341274/).
- **MEST_NO_AUTO_THERAPY**: Não há demonstração prospectiva de melhores resultados ao atribuir tratamento apenas pelo MEST-C. Histologia/crescentes devem ser integrados à evolução clínica; nenhum componente isolado seleciona automaticamente terapia. Local: KDIGO PP 1.4.2.3, S37; Shi, Methods/Results/limitations; Nong, Methods2.1 e Discussion. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf), [SHI_TESTING_2026](https://pubmed.ncbi.nlm.nih.gov/40627446/), [NONG_2026](https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2026.1873181/full).
  Limite: Não se nega associação histológica com resposta: a subanálise TESTING sugere benefício diferencial de lesões específicas, e Nong propõe SumMEC. Nenhum é ensaio prospectivo de alocação terapêutica guiada pelo MEST-C; o limite do item é não usar o laudo sozinho como prescrição.

#### Observações de implementação

Não escrever no aplicativo enquanto bloqueado. Preservar avaliações e snapshots históricos; não resetar FSRS automaticamente. Dificuldade deve seguir o raciocínio final e a adjudicação, não o tamanho da opção.

Auditoria de quatro dimensões: otherQid: ce79d609 sameCompetency: true opDistinction: Uso prognóstico e limite de terapia do laudo completo versus classificação do percentual de lesão T. conceptDistinction: Integração e limite inferencial do escore versus faixa T1 e compartimento histológico. reasoningDistinction: Interpretar M/E/S/T/C e excluir prognóstico ou prescrição automáticos versus aplicar 35% à faixa 26–50%. errorDistinction: Prognóstico zero ou terapia automática versus troca de faixa ou componente. authorDisposition: Variação útil proposta, sujeita à adjudicação independente; se equivalentes nas quatro dimensões, reter o redundante sem inventar novo OP.

Comprimentos A–D em caracteres: [125,92,78,93] → [82,79,78,77]. Razão da correta pelo maior distrator: 1.344 → 1.038. As métricas são descritivas, sem limiar artificial de aprovação.

---

## ea37c153 — IgAN — Hipótese Patogênica dos Quatro Hits

### Veredito

**Revisão maior**, na etapa de autoria; não é aprovação. **Confiança: alta** para as afirmações mapeadas. **Evidência: VERIFICADA** na autoria. **Pendência: NENHUMA decisiva de verificação detectada pelo autor**, com contraprova editorial, de identidade e referências ainda pendente. **Autorização de publicação: BLOQUEADA**, derivada da ausência de veredito final de aprovação.

Original SHA256 `a5e252630c39635c2156830f410289e690b44acee6f659a2817a73095b253f61`; candidato A3 `37cc8c5109d8d3b325dc64c2dab07debd7d5f3cc515b69aa7fbc9513ba562c02`.

### OP e classificação

Reconhecer a sequência do modelo de quatro hits da IgAN. Competência: Diagnóstico, patologia e estratificação de risco na nefropatia por IgA. Bloom **Compreender**; Miller **Sabe**. Diff herdado **medium**; proposta final **easy**. Recupera ou explica um conceito, mecanismo ou limite; a redação longa e o nome de uma terapia não justificam hard.

### Justificativa e problemas

A correta original era a única sequência completa do modelo; os distratores evocavam doenças distantes e a explicação discutia IgA3, ausente das opções. As versões finais testam erros reconhecíveis de glicosilação, ordem e localização, com o mesmo nível de sequência causal.

### Advogado do Recurso

Pergunta o modelo de quatro eventos, sem apresentar uma sequência universal demonstrada em cada paciente. IgA1 alterada isolada não explica a doença; o ensaio mecanístico não valida teste clínico diagnóstico.

### Critérios eliminatórios

Nenhum detectado pelo autor na proposta. A contraprova deve confirmar uma melhor resposta, plausibilidade dos erros, limites das referências e preservação do conceito discriminante. A possível sobreposição de ce79/123 e a adição de IgA sérica normal em 5e5 são pontos de adjudicação explícita, não liberações tácitas.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. Se a contraprova detectar eliminatório, a nota é anulada. Não herdar pontuação ou aprovação.

### Decisão pela árvore editorial

Mudança material na redação, referências e/ou classificação → contraprova independente da versão exata → só eventual aprovação pode derivar liberação. Estado de trabalho: **em_revisão**. Decisão de legado proposta: **REESCREVER** após gate, ou reter se identidade/duplicação não for confirmada.

### Patch editorial sugerido

**Não aplicar agora.** Após eventual liberação, substituir apenas `q`, `refs`, `opts`, `exp`, `diff`. Qid, título, categoria e gabarito-conceito permanecem preservados.

#### Pergunta

Qual sequência descreve o modelo dos quatro eventos (“hits”) na nefropatia por imunoglobulina A (IgA), envolvendo sua subclasse 1 (IgA1)?

#### Alternativas

**A**
Produção de IgA1 deficiente em galactose → autoanticorpos → imunocomplexos → depósito e lesão mesangial

**B**
Produção de IgA1 deficiente em galactose → autoanticorpos → imunocomplexos → depósito e lesão subepitelial

**C**
Produção de IgA1 deficiente em galactose → depósito mesangial direto → lesão renal → autoanticorpos

**D**
Produção de IgA1 com excesso de galactose → autoanticorpos → imunocomplexos → depósito e lesão mesangial

#### Resposta correta

**A — Produção de IgA1 deficiente em galactose → autoanticorpos → imunocomplexos → depósito e lesão mesangial**

#### Explicação

O modelo propõe IgA da subclasse 1 (IgA1) com glicanos deficientes em galactose, seguida por autoanticorpos que reconhecem essa alteração, formação de imunocomplexos circulantes e acúmulo mesangial com ativação celular e lesão glomerular. A alteração da IgA1 isoladamente não explica toda a doença clínica. O modelo não começa por excesso de galactose nem atribui a lesão apenas ao depósito direto de IgA1 antes dos autoanticorpos. A localização característica dos complexos é mesangial, e não subepitelial. Trata-se de um modelo patogênico, sem tornar a dosagem dessas moléculas um substituto validado da biópsia.

#### Distratores e erros clínicos

- B: Trocar localização mesangial por subepitelial.
- C: Reduzir o modelo a lesão por depósito direto e inverter a posição dos autoanticorpos.
- D: Inverter a alteração de glicosilação: excesso em vez de deficiência de galactose.

#### Referências e rastreabilidade

Vínculos finais: `kdigo_igan_igav_2025`, `rodrigues_haas_reich_igan_2017`. Cada hash está em referenceBindings. IDs existentes não alterados conservam seus hashes; os novos cards precisam de gate integral independente.

- **FOUR_HITS**: O modelo associa IgA1 deficiente em galactose, autoanticorpos antiglicano, imunocomplexos circulantes e depósito mesangial com lesão. IgA1 alterada isolada não explica a doença; excesso de galactose, localização subepitelial e lesão direta antes dos autoanticorpos não descrevem essa sequência. Local: Rodrigues, Disease Pathogenesis e Figura 1; Suzuki, resumo primário; KDIGO, introdução/Figura 3. Fontes: [RODRIGUES2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/), [SUZUKI2009](https://pubmed.ncbi.nlm.nih.gov/19478457/), [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
- **IGA_SEROLOGY**: Não há biomarcador sérico ou urinário validado para substituir o diagnóstico histológico. IgA sérica normal não exclui IgAN; estudos mecanísticos não mudam essa regra. Local: KDIGO PP 1.2.1, S15/S33. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).

#### Observações de implementação

Não escrever no aplicativo enquanto bloqueado. Preservar avaliações e snapshots históricos; não resetar FSRS automaticamente. Dificuldade deve seguir o raciocínio final e a adjudicação, não o tamanho da opção.

- Foram removidos distratores etiologicamente distantes e a discussão de IgA3 que não correspondia às opções. Os erros finais testam localização, necessidade dos autoanticorpos e direção da alteração de glicosilação.
- O quarto evento inclui depósito e lesão, explicitado em A/B/D. Em C, o erro é colocar depósito direto e lesão antes de autoanticorpos.

Comprimentos A–D em caracteres: [154,112,105,113] → [103,106,99,104]. Razão da correta pelo maior distrator: 1.363 → 0.972. As métricas são descritivas, sem limiar artificial de aprovação.

---

## Cards integrais propostos — todos BLOQUEADOS

### rodrigues_haas_reich_igan_2017

Hash SHA256 `00163f00b6450e568835e35b346eb60191c6dca4a14157026ec61835f0256376`. Consumidores atuais: nenhum. Consumidores propostos: `ce79d609`, `5e5b8558`, `26804856`, `12328a3e`, `ea37c153`. Texto integral consultado por seções na página PMC, da epidemiologia à discussão final, incluindo manifestações, patologia e imunopatogênese. Recomendações terapêuticas de2017 não foram reutilizadas como atuais.

```javascript
{
  "label": "Rodrigues, Haas e Reich — Fundamentos da nefropatia por IgA (2017)",
  "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5383386/",
  "journal": "Clin J Am Soc Nephrol. 2017;12(4):677–686",
  "ano": 2017,
  "tipo": "Revisão clínica e fisiopatológica",
  "badge": "REVIEW",
  "badgeColor": "#8b5cf6",
  "impacto": "Relaciona apresentação clínica, imunocomplexos e lesões histológicas na nefropatia por IgA",
  "icon": "🔬",
  "resumo": "Revisão da nefropatia por imunoglobulina A (IgA). Descreve o modelo em que a IgA da subclasse 1 (IgA1) deficiente em galactose e autoanticorpos formam imunocomplexos associados à lesão mesangial; a alteração da IgA1 isolada não explica toda a doença. A hematúria visível junto a infecção de mucosa é uma apresentação sugestiva. A classificação de Oxford acrescenta informação prognóstica: atrofia tubular e fibrose intersticial em 26–50% do córtex correspondem a T1, e acima de 50%, a T2. A histologia deve ser integrada à função renal, proteinúria e evolução clínica.",
  "conclusao": "Usada neste acervo para fundamentos de apresentação, patologia e mecanismo. Diagnóstico, estratificação e tratamento atuais devem seguir a diretriz KDIGO 2025 e evidência posterior pertinente.",
  "curiosidade": "A presença de C3 do complemento nos depósitos é compatível com a participação do complemento na doença e não equivale, sozinha, a glomerulopatia C3."
}
```

### barbour_igan_prediction_2019

Hash SHA256 `ccd87a4d44940d2715bc8158d92d560d0fee9e97b47691f1ce2380d048fb30a7`. Consumidores atuais: nenhum. Consumidores propostos: `795d4589`. Resumo primário integral e texto completo PMC nas seções de objetivo, população, definições, análise estatística e resultados/modelos. Não alegar leitura de suplementos não abertos.

```javascript
{
  "label": "Barbour et al. — International IgAN Prediction Tool (2019)",
  "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6583088/",
  "journal": "JAMA Intern Med. 2019;179(7):942–952",
  "ano": 2019,
  "tipo": "Derivação e validação em coortes longitudinais",
  "badge": "COHORT",
  "badgeColor": "#f59e0b",
  "impacto": "Combinação de dados clínicos e histológicos estima progressão; não prevê resposta a uma terapia",
  "icon": "🔬",
  "resumo": "Estudo com 3927 adultos com nefropatia por imunoglobulina A (IgA) primária (idiopática) confirmada por biópsia: 2781 na derivação e 1146 na validação externa. Estimou o risco de queda permanente de 50% da taxa de filtração glomerular estimada (TFGe) ou falência renal. Os modelos completos combinaram função renal, pressão, proteinúria, idade, medicações e os componentes histológicos de hipercelularidade mesangial, hipercelularidade endocapilar, esclerose segmentar e atrofia/fibrose (MEST), com versões com ou sem raça/etnia. O componente de crescentes não integrou esses modelos originais.",
  "conclusao": "A ferramenta auxilia a conversa sobre prognóstico após diagnóstico histológico. Não é exame diagnóstico nem teste de resposta à imunossupressão e não substitui reavaliação ao longo do tempo.",
  "curiosidade": "O modelo original na biópsia usou MEST. O laudo patológico atual inclui também crescentes (MEST-C); registrar uma lesão no laudo não significa que ela integre automaticamente uma equação de risco."
}
```

## Validação e limitações

Os pacotes foram parseados e conferidos quanto a seis IDs únicos, quatro opções, índice de gabarito, preservação de qid/título/categoria/gabarito, hashes dos originais e candidatos e bindings exatos dos cards. A lista de vinte residuais permanece integral. Não houve testes de runtime porque esta autoria não escreve no aplicativo. Integração, catálogo, históricos, testes e eventual publicação pertencem ao fluxo do revisor pai, depois dos gates.
