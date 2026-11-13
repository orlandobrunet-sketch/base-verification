| Questão | OP | Evidência | Pendência | Veredito | Score | Eliminatório | Autorização | Legado | Ação |
|---|---|---|---|---|---|---|---|---|---|
| d81defbb | Ponderar benefício renal e toxicidade do corticoide sistêmico quando Nefecon não está disponível. | VERIFICADA na autoria | NENHUMA decisiva detectada | revisão maior | 19/20 provisório | Não | BLOQUEADA | REESCREVER | Revisão independente da versão final |
| f7107bc3 | Integrar liberação ileal de Nefecon, curso de nove meses e limitação após suspensão. | VERIFICADA na autoria | NENHUMA decisiva detectada | revisão maior | 19/20 provisório | Não | BLOQUEADA | REESCREVER | Revisão independente da versão final |
| ff676013 | Orientar segurança do Nefecon em prediabetes sem supor ausência de absorção sistêmica. | VERIFICADA na autoria | NENHUMA decisiva detectada | revisão maior | 19/20 provisório | Não | BLOQUEADA | REESCREVER | Revisão independente da versão final |

# Autoria bloqueada — IgAN: glicocorticoides e Nefecon — A2

Três originais foram congelados antes dos candidatos, em `igan-glucocorticoids-original.json`, SHA256 `0adfe986d544267deb33e8e10e2d52aade897e8ac209066765e4594afdf6cc82`. A classificação independente do revisor foi congelada antes da entrega desta autoria e não foi consultada pelo autor. Os seis itens de diagnóstico e cinco de condutas gerais mantêm pacotes próprios; estes três deixam doze dos 26 residuais fora dos três recortes. Todos os candidatos e cards estão BLOQUEADOS, sem aprovação final e sem escrita no aplicativo.

Pacote exato: `igan-glucocorticoids-candidates-A2.json`, SHA256 `3d987fea2a2cf8112710ef140d9c2912520007be3663914a3bac3765815fc02b`. Cards: `igan-glucocorticoids-card-proposals-A1.json`, SHA256 `3a1d5410b480109e2448f5e6df69dd05048e5d93c1b828b71b37883b6abca293`. Mapa por afirmação: `igan-glucocorticoids-author-evidence-A2.json`.

A correta única mais longa por caracteres passou de 3/3 para 2/3, sem empate e sem correta única mais curta; por palavras 3/3 para 1/3. A diferença residual de seis caracteres em d81 não é removida artificialmente: seleção e profilaxia são qualificadores de segurança. Essas métricas não autorizam publicação nem substituem a plausibilidade clínica.

# Fontes e domínio

- [KDIGO 2025 Clinical Practice Guideline for IgAN and IgAV](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf) — Diretriz clínica. PDF integral oficial aberto; seções S41–S44, recomendações1.4.3.1/1.4.3.2, PP1.4.3.1–1.4.3.3 e considerações de implementação lidos diretamente. Limite: Afirmações de ausência de dados são datadas2025. O lote não extrapola que não existam estudos de manutenção em 2026, nem universaliza disponibilidade/aprovação regulatória.
- [Lv et al. Effect of Oral Methylprednisolone on Decline in Kidney Function or Kidney Failure in Patients With IgA Nephropathy](https://jamanetwork.com/journals/jama/fullarticle/2792252) — Ensaio clínico randomizado, duplo-cego, multicêntrico. Texto primário completo aberto: Methods, Treatment Protocol, Results, Table2, Adverse Events e Limitations; resumo completo corroborado por EuropePMC. Limite: Coortes de doses foram recrutadas em períodos diferentes; cada dose foi comparada ao placebo contemporâneo. Ausência de heterogeneidade não prova equivalência entre doses nem elimina risco de infecção.
- [Lafayette et al. Efficacy and safety of a targeted-release formulation of budesonide in patients with primary IgA nephropathy:2-year results](https://pubmed.ncbi.nlm.nih.gov/37591292/) — Ensaio clínico randomizado fase3, duplo-cego, placebo-controlado. Resumo primário integral lido em PubMed e EuropePMC; dados necessários de desenho, população, dose, curso, endpoint, efeito e eventos verificados no resumo. KDIGO integral fornece contraprova e considerações de segurança/curso após suspensão. Limite: Resumo primário não foi chamado de texto integral da publicação. Não se afirma superioridade de exposição frente a outro corticoide em ensaio direto, benefício exclusivamente intestinal ou resposta permanente em cada indivíduo.

A conferência de 2026 encontrou relatos observacionais e protocolo novo de manutenção. O texto final não declara ausência de estudos atuais; delimita o curso randomizado NefIgArd. Não se converte protocolo em resultado, nem resumo observacional em recomendação universal. A identificação pública de aprovação FDA/EMA foi retirada do card de RCT para evitar usar ensaio como rótulo regulatório por jurisdição.

# Cards materiais e consumidores

**testing_study**: original `9d029d20900715ac9e677581d494acf058ff69f8546bbf1d027e79ab25995657`; candidato `ece9f584e9a94eaeb21271a34f1b56dea300b20b847ed8405c408354f96d558d`. Ícone RCT padronizado para🔬 e siglas expandidas. Esclarecido domínio primário e limite inferior diferente na coorte reduzida. Manteve benefício não foi apresentado como ensaio de equivalência entre doses; períodos e placebos contemporâneos diferenciados. Consumidores atuais: d81defbb. Objetos legados de assets/artigos_nefro.json: índices 12. Ocorrências literais, hashes/objetos originais e leitores dinâmicos estão no inventário do card. Gate integral independente obrigatório; nenhuma liberação parcial herdada.

**nefigard_trial**: original `1278ec121cee8c1537b0a4c935094581a03c70f1d4c6c3c3a64cd959af1ed419`; candidato `19cf1bd6b620b4615c3424862c387cbd850d46704f4b7ce7a119da357b68f361`. DOI/link herdado02765-2não era o artigo citado; corrigido para01554-4. Estimativa de+3,8não identifica o endpoint de dois anos; corrigida para média ponderada5,05com intervalo. Explicitados limite superiorTFGe90e critério alternativo proteína/creatinina≥0,8g/g. Aprovações regulatórias foram retiradas deste resumo de ensaio: não são resultados primários doRCT nem indicação universal por jurisdição. O foco do card é evidência clínica do estudo. Consumidores atuais: f7107bc3, ff676013. Objetos legados de assets/artigos_nefro.json: índices 12, 59, 101, 121, 142, 152, 168, 191, 205, 216, 231, 245, 271, 285, 296, 307, 328, 350, 373, 374, 375. Ocorrências literais, hashes/objetos originais e leitores dinâmicos estão no inventário do card. Gate integral independente obrigatório; nenhuma liberação parcial herdada.

---

## d81defbb — IgAN — TESTING e Corticoide Sistêmico

### Veredito

**revisão maior**. Equivalente legado: **REESCREVER**. Confiança: **alta** para as afirmações mapeadas. Evidência: **VERIFICADA** na autoria. Pendência: **NENHUMA** decisiva detectada pelo autor. Autorização de publicação: **BLOQUEADA**, derivada do veredito sem aprovação. A contraprova independente do item e cards ainda deve ocorrer.

### OP declarado e classificação

Ponderar benefício renal e toxicidade do corticoide sistêmico quando Nefecon não está disponível. Competência primária: Escolha e segurança de glicocorticoides na nefropatia por IgA. Bloom **Aplicar**, Miller **Sabe como**. Dificuldade herdada **hard**, proposta final **medium**. Integra benefício renal, toxicidade e necessidade de profilaxia em contexto de alternativa terapêutica; Aplicar/medium por decisão com condições, não pelo nome do estudo.

### Justificativa

A decisão central é preservada. A reescrita desloca justificativas extensas da correta para a explicação e troca erros caricaturais por erros de indicação, segurança ou extrapolação de formulação. Não remove qualificadores necessários nem inventa nova indicação para igualar comprimentos.

### Problemas encontrados

1. **MAIOR — Pista formal no original:** a correta concentrava condições/justificativas e era única mais longa em caracteres e palavras.
2. **MAIOR — Referência compartilhada:** o card material vinculado exige reparo integral e gate próprio, sem considerar a questão suficiente para aprová-lo.
3. **MENOR — Classificação herdada:** o nível foi reavaliado pelo comando e número de decisões, sem usar nome de terapia ou extensão como sinal de dificuldade.

### Advogado do Recurso

Conferir população primária, segurança e limites dos ensaios; não confundir liberação direcionada com efeito exclusivamente tópico ou redução de dose com equivalência randomizada entre protocolos. A autoria verificou os limites por afirmação no mapa.  Nenhum argumento plausível de anulação remanescente foi identificado pelo autor; a revisão independente não foi presumida concluída.

### Eliminatórios

Nenhum eliminatório disparado na versão candidata segundo a autoria. Não confundir esse parecer provisório com aprovação do card ou publicação.

### NQ Editorial Score

| Dimensão | Pontos provisórios |
|---|---|
| Alinhamento ao OP | 2 |
| Validade de conteúdo | 2 |
| Validade de construto | 2 |
| Qualidade do enunciado | 2 |
| Alternativas | 2 |
| Distratores | 2 |
| Explicação | 2 |
| Referências | 2 |
| Ausência de cara de IA | 1 |
| Valor pedagógico | 2 |

Total provisório **19/20**, banda Excelente, sem gerar autorização. Se o revisor detectar eliminatório ou pendência decisiva, o score é anulado.

### Decisão (árvore §19)

Original exige correção de alternativas e enquadramento → revisão maior → ciclo de vida **em_reparo**. Candidato mantém identidade em OP/competência/conceito discriminante/raciocínio; gate independente da versão final ainda pendente. Não aplicar antes do veredito de aprovação e publicação LIBERADA.

### Patch editorial sugerido

**SUBSTITUIR A QUESTÃO POR:** somente se a revisão independente liberar a versão exata.

#### Pergunta

Pessoa com nefropatia por imunoglobulina A (IgA) primária em risco de progressão, com nefroproteção otimizada, não tem acesso a Nefecon. Ao discutir metilprednisolona sistêmica segundo a KDIGO 2025, qual síntese é mais adequada?

#### Alternativas

**A**  
Benefício renal com risco de toxicidade; considerar esquema reduzido, profilaxia e seleção individual

**B**  
Benefício renal maior com dose plena; preferi-la porque superou o esquema reduzido no TESTING

**C**  
Ausência de benefício em função renal; evitar corticoide mesmo após seleção criteriosa de risco

**D**  
Benefício renal com risco infeccioso; usar dose reduzida em substituição à profilaxia

#### Resposta correta

**A — Benefício renal com risco de toxicidade; considerar esquema reduzido, profilaxia e seleção individual**

#### Explicação

O TESTING demonstrou benefício no composto de perda de função renal, falência renal ou morte por doença renal, com maior incidência de eventos adversos graves, sobretudo no protocolo de dose plena. As coortes de dose plena e reduzida não foram comparadas diretamente por randomização para estabelecer superioridade entre as doses. Quando Nefecon não está disponível, a KDIGO 2025 sugere esquema sistêmico reduzido com profilaxia e avaliação individual de benefício e toxicidade. A fase de protocolo reduzido usou dose inicial de metilprednisolona de 0,4 mg/kg/dia, máximo 32 mg/dia, seguida de desmame. A profilaxia contra Pneumocystis jirovecii não é substituída pela dose menor. Função renal muito reduzida, diabetes ou prediabetes, obesidade e infecções, entre outros fatores, aumentam o risco; não há indicação automática para toda pessoa que ultrapasse um limiar de proteinúria.

#### Referências sugeridas

Os cards completos estão no apêndice, sem alteração adicional no corpo de cada item: `testing_study` SHA256 `ece9f584e9a94eaeb21271a34f1b56dea300b20b847ed8405c408354f96d558d`; `kdigo_igan_igav_2025` SHA256 `0afab502295e77079ed7adb5d4607626931ee287528bbcfd056278dcc9bc0ae0`. Afirmações: `TESTING_BENEFIT_HARM`, `REDUCED_REGIMEN`, `SYSTEMIC_RISK`.

#### Observação de implementação

Original SHA256 `c375779e5b4d883252586388304b0541bdb406a90bafc9741fd21b8d68ae2c88`; candidato `6cf4876f99e62446840103405c21be571e2818b84c7e6549564fb228f851b3ac`. Preservar qid, título, categoria e índice de resposta correta. Substituir somente os campos: q, opts, exp, diff. O responsável pela integração deve validar os hashes dos cards materiais e sua compatibilidade com todos consumidores, gerar revisão/histórico apropriados e só aplicar após gate próprio. Nenhuma escrita em topics.js/refs.js foi feita.

### Pendências de verificação

Não há afirmação decisiva pendente identificada na autoria; permanecem a contraprova editorial independente e gate integral das duas referências materiais.

---

## f7107bc3 — Nefecon — Eixo Intestino-Rim e Curso Limitado

### Veredito

**revisão maior**. Equivalente legado: **REESCREVER**. Confiança: **alta** para as afirmações mapeadas. Evidência: **VERIFICADA** na autoria. Pendência: **NENHUMA** decisiva detectada pelo autor. Autorização de publicação: **BLOQUEADA**, derivada do veredito sem aprovação. A contraprova independente do item e cards ainda deve ocorrer.

### OP declarado e classificação

Integrar liberação ileal de Nefecon, curso de nove meses e limitação após suspensão. Competência primária: Escolha e segurança de glicocorticoides na nefropatia por IgA. Bloom **Compreender**, Miller **Sabe**. Dificuldade herdada **hard**, proposta final **medium**. Integra finalidade da formulação, curso estudado e limite temporal da resposta; Compreender/medium pela combinação de conceitos, sem seleção individual avançada.

### Justificativa

A decisão central é preservada. A reescrita desloca justificativas extensas da correta para a explicação e troca erros caricaturais por erros de indicação, segurança ou extrapolação de formulação. Não remove qualificadores necessários nem inventa nova indicação para igualar comprimentos.

### Problemas encontrados

1. **MAIOR — Pista formal no original:** a correta concentrava condições/justificativas e era única mais longa em caracteres e palavras.
2. **MAIOR — Referência compartilhada:** o card material vinculado exige reparo integral e gate próprio, sem considerar a questão suficiente para aprová-lo.
3. **MENOR — Classificação herdada:** o nível foi reavaliado pelo comando e número de decisões, sem usar nome de terapia ou extensão como sinal de dificuldade.

### Advogado do Recurso

Conferir população primária, segurança e limites dos ensaios; não confundir liberação direcionada com efeito exclusivamente tópico ou redução de dose com equivalência randomizada entre protocolos. A autoria verificou os limites por afirmação no mapa. Não se afirma ausência total de estudos novos de manutenção ou repetição em 2026. O comando e a explicação delimitam o curso randomizado NefIgArd, sem garantir resposta permanente. Estudos abertos/observacionais e protocolos novos não foram convertidos em manutenção universal. Mecanismo é finalidade da formulação, não prova de que todo benefício renal decorra exclusivamente da mucosa intestinal. Nenhum argumento plausível de anulação remanescente foi identificado pelo autor; a revisão independente não foi presumida concluída.

### Eliminatórios

Nenhum eliminatório disparado na versão candidata segundo a autoria. Não confundir esse parecer provisório com aprovação do card ou publicação.

### NQ Editorial Score

| Dimensão | Pontos provisórios |
|---|---|
| Alinhamento ao OP | 2 |
| Validade de conteúdo | 2 |
| Validade de construto | 2 |
| Qualidade do enunciado | 2 |
| Alternativas | 2 |
| Distratores | 2 |
| Explicação | 2 |
| Referências | 2 |
| Ausência de cara de IA | 1 |
| Valor pedagógico | 2 |

Total provisório **19/20**, banda Excelente, sem gerar autorização. Se o revisor detectar eliminatório ou pendência decisiva, o score é anulado.

### Decisão (árvore §19)

Original exige correção de alternativas e enquadramento → revisão maior → ciclo de vida **em_reparo**. Candidato mantém identidade em OP/competência/conceito discriminante/raciocínio; gate independente da versão final ainda pendente. Não aplicar antes do veredito de aprovação e publicação LIBERADA.

### Patch editorial sugerido

**SUBSTITUIR A QUESTÃO POR:** somente se a revisão independente liberar a versão exata.

#### Pergunta

Em adultos com nefropatia por imunoglobulina A (IgA) primária em risco de progressão, qual afirmação integra corretamente a finalidade da liberação direcionada e o curso de Nefecon estudado no NefIgArd?

#### Alternativas

**A**  
Liberação ileal para modular a imunidade de mucosa; curso de nove meses, sem garantia de resposta permanente

**B**  
Liberação ileal para induzir remissão; o protocolo prevê manutenção em dose menor após os nove meses

**C**  
Liberação no cólon para modular a imunidade de mucosa; curso de nove meses com reavaliação posterior

**D**  
Budesonida de outras formulações intestinais pode reproduzir o regime, com a mesma dose e duração

#### Resposta correta

**A — Liberação ileal para modular a imunidade de mucosa; curso de nove meses, sem garantia de resposta permanente**

#### Explicação

Nefecon é uma formulação específica de budesonida com liberação no íleo terminal, desenhada para atuar no tecido linfoide intestinal e modular a produção de formas patogênicas de IgA e imunocomplexos. O local-alvo é o íleo terminal, e não o cólon. O NefIgArd avaliou 16 mg/dia por nove meses, com suporte otimizado mantido e quinze meses adicionais sem o medicamento do estudo, não manutenção em dose menor no protocolo randomizado. Houve benefício médio frente a placebo, mas isso não significa cura ou manutenção de resposta em cada pessoa: após a suspensão, a proteinúria pode aumentar e a função renal pode voltar a cair. A continuidade do cuidado e a reavaliação são necessárias; o ensaio não valida intercâmbio automático com qualquer formulação de budesonida nem uso indefinido sem revisão.

#### Referências sugeridas

Os cards completos estão no apêndice, sem alteração adicional no corpo de cada item: `nefigard_trial` SHA256 `19cf1bd6b620b4615c3424862c387cbd850d46704f4b7ce7a119da357b68f361`; `kdigo_igan_igav_2025` SHA256 `0afab502295e77079ed7adb5d4607626931ee287528bbcfd056278dcc9bc0ae0`. Afirmações: `TARGETED_RELEASE`, `NEFIGARD_COURSE`, `POST_STOP_RESPONSE`, `FORMULATION`.

#### Observação de implementação

Original SHA256 `eceb69dc1bd50fb8264a1222d869de0958fdb1c5c17b5268cf35dc3c4d72ac28`; candidato `105d139d8ac719fe074fd8c4f8d29faa8439315e7b6f2d9eef758b4b23bcd977`. Preservar qid, título, categoria e índice de resposta correta. Substituir somente os campos: q, opts, exp, diff. O responsável pela integração deve validar os hashes dos cards materiais e sua compatibilidade com todos consumidores, gerar revisão/histórico apropriados e só aplicar após gate próprio. Nenhuma escrita em topics.js/refs.js foi feita.

### Pendências de verificação

Não há afirmação decisiva pendente identificada na autoria; permanecem a contraprova editorial independente e gate integral das duas referências materiais.

---

## ff676013 — Nefecon — Exposição Sistêmica Residual

### Veredito

**revisão maior**. Equivalente legado: **REESCREVER**. Confiança: **alta** para as afirmações mapeadas. Evidência: **VERIFICADA** na autoria. Pendência: **NENHUMA** decisiva detectada pelo autor. Autorização de publicação: **BLOQUEADA**, derivada do veredito sem aprovação. A contraprova independente do item e cards ainda deve ocorrer.

### OP declarado e classificação

Orientar segurança do Nefecon em prediabetes sem supor ausência de absorção sistêmica. Competência primária: Escolha e segurança de glicocorticoides na nefropatia por IgA. Bloom **Aplicar**, Miller **Sabe como**. Dificuldade herdada **medium**, proposta final **easy**. Aplica uma orientação direta de segurança a prediabetes com uma pista explícita e sem dados concorrentes; Aplicar/easy pela rubrica de comando simples, não pelo tamanho.

### Justificativa

A decisão central é preservada. A reescrita desloca justificativas extensas da correta para a explicação e troca erros caricaturais por erros de indicação, segurança ou extrapolação de formulação. Não remove qualificadores necessários nem inventa nova indicação para igualar comprimentos.

### Problemas encontrados

1. **MAIOR — Pista formal no original:** a correta concentrava condições/justificativas e era única mais longa em caracteres e palavras.
2. **MAIOR — Referência compartilhada:** o card material vinculado exige reparo integral e gate próprio, sem considerar a questão suficiente para aprová-lo.
3. **MENOR — Classificação herdada:** o nível foi reavaliado pelo comando e número de decisões, sem usar nome de terapia ou extensão como sinal de dificuldade.

### Advogado do Recurso

Conferir população primária, segurança e limites dos ensaios; não confundir liberação direcionada com efeito exclusivamente tópico ou redução de dose com equivalência randomizada entre protocolos. A autoria verificou os limites por afirmação no mapa. Retirada comparação de exposição com glicocorticoide convencional como se houvesse ensaio farmacocinético comparativo noNefIgArd; a afirmação necessária é a persistência de absorção sistêmica e necessidade de vigilância. Nenhum argumento plausível de anulação remanescente foi identificado pelo autor; a revisão independente não foi presumida concluída.

### Eliminatórios

Nenhum eliminatório disparado na versão candidata segundo a autoria. Não confundir esse parecer provisório com aprovação do card ou publicação.

### NQ Editorial Score

| Dimensão | Pontos provisórios |
|---|---|
| Alinhamento ao OP | 2 |
| Validade de conteúdo | 2 |
| Validade de construto | 2 |
| Qualidade do enunciado | 2 |
| Alternativas | 2 |
| Distratores | 2 |
| Explicação | 2 |
| Referências | 2 |
| Ausência de cara de IA | 1 |
| Valor pedagógico | 2 |

Total provisório **19/20**, banda Excelente, sem gerar autorização. Se o revisor detectar eliminatório ou pendência decisiva, o score é anulado.

### Decisão (árvore §19)

Original exige correção de alternativas e enquadramento → revisão maior → ciclo de vida **em_reparo**. Candidato mantém identidade em OP/competência/conceito discriminante/raciocínio; gate independente da versão final ainda pendente. Não aplicar antes do veredito de aprovação e publicação LIBERADA.

### Patch editorial sugerido

**SUBSTITUIR A QUESTÃO POR:** somente se a revisão independente liberar a versão exata.

#### Pergunta

Pessoa com nefropatia por imunoglobulina A (IgA) primária e prediabetes iniciará Nefecon. Qual orientação de segurança é mais apropriada?

#### Alternativas

**A**  
Manter vigilância glicêmica e avaliar riscos de infecção, pois há exposição sistêmica residual

**B**  
Dispensar vigilância glicêmica e infecciosa, pois a liberação ileal limita o efeito ao intestino

**C**  
Negar o tratamento por prediabetes, considerada contraindicação absoluta à formulação

**D**  
Substituir a vigilância clínica pela queda da proteinúria, que confirma ausência de toxicidade

#### Resposta correta

**A — Manter vigilância glicêmica e avaliar riscos de infecção, pois há exposição sistêmica residual**

#### Explicação

A liberação no íleo não elimina a absorção sistêmica da budesonida nem seus possíveis efeitos de glicocorticoide. A KDIGO 2025 considera justificável vigilância glicêmica mais intensa na prediabetes e orienta avaliar infecções latentes, como hepatites virais e tuberculose, antes do tratamento. No NefIgArd, quatro participantes com prediabetes no início evoluíram para diabetes durante os nove meses de Nefecon. Isso exige avaliação individual e acompanhamento, sem tornar a prediabetes uma contraindicação absoluta para todas as pessoas. Queda de proteinúria indica resposta renal, mas não exclui toxicidade metabólica ou infecciosa.

#### Referências sugeridas

Os cards completos estão no apêndice, sem alteração adicional no corpo de cada item: `nefigard_trial` SHA256 `19cf1bd6b620b4615c3424862c387cbd850d46704f4b7ce7a119da357b68f361`; `kdigo_igan_igav_2025` SHA256 `0afab502295e77079ed7adb5d4607626931ee287528bbcfd056278dcc9bc0ae0`. Afirmações: `RESIDUAL_EXPOSURE`, `PREDIABETES`.

#### Observação de implementação

Original SHA256 `f5ab989fb0ad775d0d7f43932b0df5ab880af2143077dfe22dc15234d78ed56c`; candidato `d372fa666964f3662973f3966c393c7e4b94b1233b3af10dcb930d948be2c3d6`. Preservar qid, título, categoria e índice de resposta correta. Substituir somente os campos: q, opts, exp, diff. O responsável pela integração deve validar os hashes dos cards materiais e sua compatibilidade com todos consumidores, gerar revisão/histórico apropriados e só aplicar após gate próprio. Nenhuma escrita em topics.js/refs.js foi feita.

### Pendências de verificação

Não há afirmação decisiva pendente identificada na autoria; permanecem a contraprova editorial independente e gate integral das duas referências materiais.

# Apêndice — cards completos vinculados

As duas propostas materiais são BLOQUEADAS. A diretriz existente é transcrita para conferência do binding, sem proposta de mudança neste lote.

## testing_study — proposta A1

```javascript
testing_study: {
  "label": "Lv et al. — TESTING: metilprednisolona na nefropatia por IgA (2022)",
  "url": "https://jamanetwork.com/journals/jama/fullarticle/2792252",
  "journal": "JAMA. 2022;327(19):1888–1898",
  "ano": 2022,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "Metilprednisolona reduziu o composto renal primário, com maior incidência de eventos adversos graves",
  "icon": "🔬",
  "resumo": "Ensaio multicêntrico, duplo-cego, com 503 participantes com nefropatia por imunoglobulina A (IgA) primária, proteinúria ≥1 g/d e suporte otimizado. A taxa de filtração glomerular estimada (TFGe) elegível era 20–120 mL/min/1,73 m² no protocolo inicial e 30–120 no reduzido. Metilprednisolona versus placebo reduziu o composto de queda sustentada de 40% da TFGe, falência renal ou morte por doença renal: razão de riscos (HR) 0,53, intervalo de confiança de 95% 0,39–0,72; P<0,001, em seguimento médio de 4,2 anos. Eventos adversos graves ocorreram em 10,9% versus 2,8%, sobretudo com dose plena. Após excesso de infecções, houve redução de dose e acréscimo de profilaxia; houve benefício do esquema reduzido contra seu placebo contemporâneo, sem demonstrar equivalência randomizada direta entre as duas doses.",
  "conclusao": "O benefício renal exige ponderação da toxicidade e seleção individual. Dose menor e profilaxia mitigaram o risco, sem eliminá-lo; não autorizam corticoide automático para toda pessoa com proteinúria.",
  "curiosidade": "A fase reduzida usou 0,4 mg/kg/dia, máximo 32 mg/dia, e profilaxia contra Pneumocystis jirovecii. As coortes de dose plena e reduzida foram recrutadas em períodos diferentes."
}
```

## nefigard_trial — proposta A1

```javascript
nefigard_trial: {
  "label": "Lafayette et al. — NefIgArd: resultados de 2 anos (2023)",
  "url": "https://pubmed.ncbi.nlm.nih.gov/37591292/",
  "journal": "Lancet. 2023;402(10405):859–870",
  "ano": 2023,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "Budesonida de liberação direcionada reduziu proteinúria e perda de função renal na população estudada",
  "icon": "🔬",
  "resumo": "Ensaio fase 3, randomizado e duplo-cego com 364 adultos com nefropatia por imunoglobulina A (IgA) primária, taxa de filtração glomerular estimada (TFGe) de 35–90 mL/min/1,73 m² e proteinúria persistente apesar de bloqueio otimizado do sistema renina-angiotensina. A inclusão exigia relação proteína/creatinina urinária ≥0,8 g/g ou proteinúria ≥1 g/24 h. Comparou Nefecon 16 mg/dia com placebo por 9 meses, seguidos de 15 meses sem o medicamento do estudo. O desfecho primário foi a média ponderada da TFGe ao longo de 2 anos: diferença de 5,05 mL/min/1,73 m², intervalo de confiança de 95% 3,24–7,38; P<0,0001, favorável ao Nefecon. Edema periférico, hipertensão e acne foram mais frequentes com Nefecon; a liberação direcionada não exclui efeitos sistêmicos de glicocorticoide.",
  "conclusao": "Um curso de 9 meses melhorou os resultados médios frente a placebo durante o acompanhamento. Isso não equivale a cura, resposta garantida em cada pessoa ou indicação de substituir a nefroproteção de base.",
  "curiosidade": "Benefício médio entre grupos pode persistir enquanto a proteinúria aumenta ou a função renal cai após a suspensão. O curso estudado e a reavaliação posterior não devem ser confundidos com garantia de efeito permanente."
}
```

## kdigo_igan_igav_2025 — existente, sem alteração

```javascript
kdigo_igan_igav_2025: {
  "label": "KDIGO 2025 IgAN/IgAV Guideline",
  "url": "https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf",
  "journal": "Kidney International",
  "ano": 2025,
  "tipo": "Diretriz clínica",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Referência central atual para manejo da NIgA.",
  "icon": "📋",
  "resumo": "Diretriz KDIGO 2025 específica para nefropatia por IgA e vasculite por IgA. Atualiza o capítulo de NIgA da diretriz KDIGO 2021 e organiza recomendações sobre avaliação de risco, terapia de suporte e terapias adicionais. Não estabelece dieta isenta de glúten como tratamento rotineiro da NIgA primária.",
  "conclusao": "Na NIgA, a base do manejo é nefroproteção e tratamento guiado por risco; dieta sem glúten não é recomendação universal.",
  "curiosidade": "A atualização de 2025 reflete a transição da NIgA de uma abordagem centrada apenas em suporte para um modelo com terapias direcionadas em pacientes selecionados."
}
```

# Validação da autoria

Todos os objetos finais têm quatro opções e um índice de gabarito válido. Identidade, campos preservados, originais atuais, hashes de candidatos e bindings de referências foram conferidos. A checagem é estrutural e não declara aprovação científica independente nem testes do aplicativo. Não houve bump, Git, publicação ou escrita no app.

# A2 — contraprova de plausibilidade

Em d81B, o erro agora é atribuir superioridade à dose plena com base em comparação que não foi randomizada diretamente entre doses; a explicação explicita o desenho. Em f710, os distratores representam confusão entre curso e manutenção, íleo e cólon, e intercâmbio não validado de formulações. Retirada a invenção de liberação glomerular/inibição de C3 e os sufixos gratuitos de imprudência. A correta permaneceu exata, assim como todo ff676013. Os dois cards A1 e seus bindings são idênticos; nenhum gate foi herdado.

A redução do viés de comprimento não é a meta isolada: em A2 as corretas d81 e f710 são naturalmente únicas mais longas por poucos caracteres. Preservam-se seleção, profilaxia e limite de resposta sem inflar distratores para produzir um resultado métrico. Métricas exatas estão no JSON. Todos BLOQUEADOS.
