# Revisão autoral — IgAN: posições terapêuticas gerais — A2

Este recorte foi congelado antes dos candidatos em `igan-treatment-general-original.json`, SHA256 `64bc0bc1d917e8a841675805be9e06262953aa31ea177eb51939f7d58857657a`. São os cinco itens completos do bloco de óleo de peixe, tonsilectomia, glúten, dois eixos e meta de proteinúria. Nenhum dado de ensaio ou rótulo de 2026 foi presumido válido por pertencer à mesma doença. Os seis itens de diagnóstico anteriores mantêm pacote e revisão próprios; quinze dos 26 residuais originais ainda ficam fora destes dois recortes.

Todos os candidatos e os dois cards reparados continuam **BLOQUEADOS**, sem veredito final de aprovação. Nenhuma escrita no aplicativo, referência em refs.js, histórico, manifest, Git ou versão foi realizada. Pacote: [igan-treatment-general-candidates-A2.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-treatment-general-candidates-A2.json), SHA256 `ed60d10a4cb35a4ff958b387bd248314485e80e16171dc2485dde607a022c3c4`. Mapa: [igan-treatment-general-author-evidence-A2.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-treatment-general-author-evidence-A2.json). Cards/inventário: [igan-treatment-general-card-proposals-A1.json](C:/Users/orlan/.codex/visualizations/2026/11/03/01a19f2d-0745-73d0-8277-eb5569ee888b/medical-answer-bias-analysis/igan-treatment-general-card-proposals-A1.json).

A correta única mais longa passou de **5/5 para 0/5** por caracteres; há um empate numérico no item de meta. Corretas únicas mais curtas: **0/5 para 2/5**. As opções numéricas têm estrutura paralela porque a questão pergunta uma meta; não houve enchimento para ajustar tamanhos. Essas métricas descrevem forma e não constituem critério científico de aprovação. O banco global continua sob revisão.

| qid | OP | Bloom/Miller autorais | Diff herdado → proposto | Veredito autoral | Evidência/Pendência | Score provisório | Publicação | Ação |
|---|---|---|---|---|---|---|---|
| 9961a406 | Orientar sobre óleo de peixe sem substituir terapias com evidência. | Aplicar/Sabe como | medium → easy | revisão maior | Afirmações de fonte verificadas; inferência de553 e valor pedagógico de c108 exigem adjudicação | 19/20 | BLOQUEADA | Contraprova independente |
| ddb4938a | Evitar extrapolar tonsilectomia como tratamento renal a pessoas não japonesas. | Aplicar/Sabe como | hard → easy | revisão maior | Afirmações de fonte verificadas; inferência de553 e valor pedagógico de c108 exigem adjudicação | 19/20 | BLOQUEADA | Contraprova independente |
| 5530b59c | Distinguir indicação de dieta sem glúten por doença celíaca de uso renal rotineiro sem diagnóstico. | Aplicar/Sabe como | medium → easy | revisão maior | Afirmações de fonte verificadas; inferência de553 e valor pedagógico de c108 exigem adjudicação | anulado por pendência decisiva | BLOQUEADA | Contraprova independente |
| b7a93d7a | Planejar eixos simultâneos de nefroproteção e terapia dirigida ao mecanismo da IgAN conforme risco. | Aplicar/Sabe como | hard → medium | revisão maior | Afirmações de fonte verificadas; inferência de553 e valor pedagógico de c108 exigem adjudicação | 19/20 | BLOQUEADA | Contraprova independente |
| c1089f2e | Reconhecer meta de proteinúria abaixo de0,5g/d, idealmente0,3g/d, sem intensificação imune automática. | Lembrar/Sabe | medium → easy | revisão maior | Afirmações de fonte verificadas; inferência de553 e valor pedagógico de c108 exigem adjudicação | 18/20 | BLOQUEADA | Contraprova independente |

## Fontes e precisão

A KDIGO 2025 foi aberta nas seções específicas: PP 1.4.3.4/Figura 4 para óleo de peixe, PP 1.4.3.5 para tonsilectomia, PP 1.4.1.1/1.4.2.2 para risco e eixos simultâneos e PP 1.4.2.1 para alvo de proteinúria. A orientação sobre tonsilectomia foi limitada à população não japonesa descrita no item, sem interferir com indicação otorrinolaringológica própria. Nenhum biomarcador sérico foi inventado para selecionar respondedores.

A fonte KDIGO não contém o termo glúten, e o escopo da revisão de terapias excluiu dietas. Portanto, **não se atribui à KDIGO uma recomendação textual inexistente**. A orientação de não prescrever restrição como terapia renal rotineira é uma inferência clínica cautelosa, identificada no mapa: Moeller é comparação sorológica, Coppo é intervenção sem controle e a análise de randomização mendeliana de 2025 não é ensaio de tratamento da doença estabelecida. Não se afirma impossibilidade de benefício individual, ausência de plausibilidade ou prova universal de ineficácia. A ACG 2023 sustenta a indicação por doença celíaca e a investigação enquanto há exposição ao glúten. Essa síntese precisa de adjudicação independente; nenhuma fonte isolada deve ser apresentada como ensaio negativo de dieta.

O PDF integral oficial KDIGO 2021 (281 páginas) foi obtido e seu PP 2.3.1.1/2.3.1.2 na síntese S43 foi conferido, junto ao capítulo 2 do resumo executivo. O enquadramento histórico descrevia proteinúria >0,75–1 g/d apesar de ≥90 dias de suporte e alvo <1 g/d. Essas condições não foram reaplicadas como protocolo atual. O card antigo é contextualizado historicamente e remete às atualizações específicas de 2025.

## Cards e consumidores

O card `kdigo_igan_2021` tinha apresentação sem contexto histórico e uma afirmação incorreta de MEST-C no modelo prognóstico. A proposta integral remove a atribuição errada, enquadra a regra antiga no cenário correto e identifica a atualização de 2025. Seu único consumidor atual é ddb4938a; o candidato deixa de vinculá-lo porque 2025 sustenta diretamente a decisão. Isso não dispensa o gate próprio do card e de sua compatibilidade com o consumidor original.

O card `moeller_plosone_2014` tinha badge COHORT, apesar de ser caso-controle. A proposta usa o tipo **CASE_CONTROL**, cor #0ea5e9 e ícone 🔬 previstos no contrato. O texto inteiro foi revisto contra o artigo, com 99 casos, 96 controles e 30 controles celíacos adicionais, sem converter ausência de diferença sorológica em prova de eficácia/ineficácia dietética. Consumidor atual: 5530b59c; há um objeto legado no índice 256 de `assets/artigos_nefro.json`. Os leitores compartilhados e ocorrências em histórico foram inventariados. Não reescrever snapshots.

## Adjudicações explícitas

O item c1089f2e preserva seu OP de meta clínica, com um comando direto de recuperação do limiar atual. É básico e não simula raciocínio individual avançado. A autoria atribui valor pedagógico menor e deixa ao revisor decidir se a meta acionável é suficiente ou se o item deve ser retido como trivia. Não foi criado outro OP sob o mesmo qid para aumentar Bloom.

A revisão de 5530b59c deve confirmar que a conclusão clínica é uma síntese sustentada dos limites da evidência e da indicação gastrointestinal, sem confundir ausência de recomendação na KDIGO com demonstração definitiva de ausência de efeito. O objeto permanece bloqueado enquanto esse ponto não tiver decisão formal.

---

## 9961a406 — IgAN — Papel do Óleo de Peixe

### Veredito e três eixos

**Revisão maior**, em autoria, sem aprovação final. **Confiança:** alta para as afirmações mapeadas. **Evidência:** VERIFICADA na autoria. **Pendência:** NENHUMA decisiva detectada pelo autor, com revisão independente editorial e de referências ainda pendente. **Publicação: BLOQUEADA**, pois não há veredito final de aprovação.

Original SHA256 `9adb7ebffd5edb7efefe772732be48c37004918c175fc2a28f8f7ffab1112091`; candidato A1 `1eb55243d25845e7f31f28a90cd43ed078d2ea761949ad4c24b7cfb28f3c5740`.

### OP e classificação

Orientar sobre óleo de peixe sem substituir terapias com evidência. Competência: Planejamento de tratamento e distinção entre indicação clínica e extrapolação na nefropatia por IgA. Bloom **Aplicar**, Miller **Sabe como**. Diff original **medium**, final proposto **easy**. Aplica/integra dados ou interpreta limites de evidência, sem depender de raridade de fármaco para definir dificuldade.

### Problemas e justificativa

Correta original concentra justificativas e qualificadores que não estão nos distratores; alternativas precisam representar erros clínicos úteis, sem enchimento. Justificativas seletivas e listas extensas saem da alternativa correta para a explicação; as demais representam erros de indicação, extrapolação ou meta. O gabarito-conceito e o tipo de decisão são preservados.

### Advogado do Recurso

Confirmar uma melhor resposta e a preservação do OP; não confundir ausência de indicação rotineira com contraindicação absoluta, nem omissão de dieta na diretriz com prova de ineficácia universal.

### Critérios eliminatórios

Nenhum detectado pelo autor. Confirmar unicidade, plausibilidade, identidade, atualidade e aderência das referências na versão final.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. O revisor independente deve pontuar novamente; eliminatório anula a nota.

### Decisão pela árvore editorial

Reparo material → contraprova independente de item, referências e classificação → somente eventual aprovação permite derivar liberação. Estado: **em_revisão**; legado proposto **REESCREVER**, sujeito à decisão final.

### Patch editorial sugerido

**Não aplicar agora.** Se liberado posteriormente, substituir apenas `q`, `opts`, `exp`, `diff`. Preservar qid, título, categoria, gabarito-conceito e histórico.

#### Pergunta

Pessoa com nefropatia por imunoglobulina A (IgA) pergunta se deve acrescentar óleo de peixe para prevenir perda de função renal. Qual orientação é mais alinhada à KDIGO 2025?

#### Alternativas

**A**
Não indicar de rotina; manter terapias com benefício demonstrado para o perfil clínico

**B**
Indicar de rotina; o efeito nefroprotetor é consistente nos ensaios clínicos

**C**
Usar como alternativa ao bloqueio do sistema renina-angiotensina quando houver proteinúria

**D**
Reservar como terapia renal eficaz para quem apresenta hematúria sinfaringítica recorrente

#### Resposta correta

**A — Não indicar de rotina; manter terapias com benefício demonstrado para o perfil clínico**

#### Explicação

A KDIGO não recomenda óleo de peixe como terapia rotineira para nefropatia por IgA: os estudos não mostraram benefício consistente para sustentar seu uso rotineiro. Ele não deve substituir nefroproteção ou tratamento dirigido à doença quando indicado. Se a pessoa ainda desejar usá-lo, a diretriz orienta discutir dose e formulação dos ensaios que relataram eficácia, sem transformar essa conversa em recomendação universal. Hematúria sinfaringítica ou proteinúria não identificam um grupo em que a eficácia renal do suplemento esteja automaticamente comprovada.

#### Distratores e erros clínicos

- B: Transformar benefício inconsistente em indicação rotineira de nefroproteção.
- C: Substituir tratamento com evidência por suplemento sem demonstração consistente de equivalência.
- D: Usar o fenótipo sinfaringítico como teste validado de resposta ao suplemento.

#### Referências e rastreabilidade

Vínculos: `kdigo_igan_igav_2025`. Bindings e hashes próprios estão no JSON. Card alterado não herda revisão pelo fato de o candidato deixar de vinculá-lo.

- **FISH_OIL**: Óleo de peixe não é recomendado como terapia rotineira. Pacientes que desejam usá-lo devem conhecer dose/formulação de estudos que relataram eficácia; isso não o torna substituto de terapia com evidência. Local: PP1.4.3.4 eFigura4, S24/S45. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).

#### Observações de implementação

Nenhuma escrita médica enquanto bloqueado. Preservar snapshots e avaliações; não resetar FSRS automaticamente nem trocar qid para conservar quantidade.



Comprimentos A–D: [190,80,78,87] → [86,76,90,90]. Razão da correta pelo maior distrator: 2.184 → 0.956.

---

## ddb4938a — IgAN — Limite Populacional da Tonsilectomia

### Veredito e três eixos

**Revisão maior**, em autoria, sem aprovação final. **Confiança:** alta para as afirmações mapeadas. **Evidência:** VERIFICADA na autoria. **Pendência:** NENHUMA decisiva detectada pelo autor, com revisão independente editorial e de referências ainda pendente. **Publicação: BLOQUEADA**, pois não há veredito final de aprovação.

Original SHA256 `56883ce1dfe5bd7693a33db724129ec72a282503f87d9d47d4abc28fae82fb88`; candidato A1 `b80b754892c12767aa3b8077bf0ac92cf9cc13279996cb8f8e0e5967353211fa`.

### OP e classificação

Evitar extrapolar tonsilectomia como tratamento renal a pessoas não japonesas. Competência: Planejamento de tratamento e distinção entre indicação clínica e extrapolação na nefropatia por IgA. Bloom **Aplicar**, Miller **Sabe como**. Diff original **hard**, final proposto **easy**. Aplica/integra dados ou interpreta limites de evidência, sem depender de raridade de fármaco para definir dificuldade.

### Problemas e justificativa

Correta original concentra justificativas e qualificadores que não estão nos distratores; alternativas precisam representar erros clínicos úteis, sem enchimento. Justificativas seletivas e listas extensas saem da alternativa correta para a explicação; as demais representam erros de indicação, extrapolação ou meta. O gabarito-conceito e o tipo de decisão são preservados.

### Advogado do Recurso

Confirmar uma melhor resposta e a preservação do OP; não confundir ausência de indicação rotineira com contraindicação absoluta, nem omissão de dieta na diretriz com prova de ineficácia universal.

### Critérios eliminatórios

Nenhum detectado pelo autor. Confirmar unicidade, plausibilidade, identidade, atualidade e aderência das referências na versão final.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. O revisor independente deve pontuar novamente; eliminatório anula a nota.

### Decisão pela árvore editorial

Reparo material → contraprova independente de item, referências e classificação → somente eventual aprovação permite derivar liberação. Estado: **em_revisão**; legado proposto **REESCREVER**, sujeito à decisão final.

### Patch editorial sugerido

**Não aplicar agora.** Se liberado posteriormente, substituir apenas `q`, `refs`, `opts`, `exp`, `diff`. Preservar qid, título, categoria, gabarito-conceito e histórico.

#### Pergunta

Adulto não japonês com nefropatia por imunoglobulina A (IgA) pergunta sobre tonsilectomia para melhorar o prognóstico renal, sem outra indicação otorrinolaringológica. Qual orientação é mais adequada?

#### Alternativas

**A**
Não indicar a cirurgia para a doença renal nessa população, mantendo a nefroproteção

**B**
Indicar a cirurgia se houver hematúria sinfaringítica, aplicando os resultados japoneses

**C**
Indicar a cirurgia com pulsos de corticoide como etapa anterior à nefroproteção otimizada

**D**
Adiar a cirurgia até a IgA sérica aumentar, usando o marcador para selecionar respondedores

#### Resposta correta

**A — Não indicar a cirurgia para a doença renal nessa população, mantendo a nefroproteção**

#### Explicação

A KDIGO 2025 orienta não realizar tonsilectomia como tratamento da nefropatia por IgA em pessoas não japonesas. Os sinais de benefício renal provêm sobretudo de estudos japoneses, em grande parte retrospectivos; a estratégia faz parte das recomendações do Japão, mas isso não permite extrapolação universal. IgA sérica elevada não é um teste validado para selecionar respondedores à cirurgia. Essa orientação renal não impede tonsilectomia por indicação otorrinolaringológica independente. A decisão também não deve deslocar a nefroproteção apropriada.

#### Distratores e erros clínicos

- B: Extrapolar experiência populacional japonesa para indicação renal em outra população.
- C: Antepor intervenção sem indicação renal nessa população à nefroproteção apropriada.
- D: Tratar IgA sérica como biomarcador validado de seleção cirúrgica.

#### Referências e rastreabilidade

Vínculos: `kdigo_igan_igav_2025`. Bindings e hashes próprios estão no JSON. Card alterado não herda revisão pelo fato de o candidato deixar de vinculá-lo.

- **TONSILLECTOMY**: Não realizar tonsilectomia como tratamento daIgANem pessoas não japonesas. Benefícios sugeridos em estudos predominantemente japoneses, muitos retrospectivos, não autorizam extrapolação universal. Indicação otorrinolaringológica independente é questão distinta. Local: PP1.4.3.5, S25/S46. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
- **IGA_RESPONSE_MARKER**: Não há biomarcador sérico validado além de função renal/proteinúria para prognóstico, e a diretriz não utilizaIgAsérica para selecionar resposta à tonsilectomia; o aumento não é indicação cirúrgica. Local: PP1.3.1ePP1.4.3.5. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).

#### Observações de implementação

Nenhuma escrita médica enquanto bloqueado. Preservar snapshots e avaliações; não resetar FSRS automaticamente nem trocar qid para conservar quantidade.

- A referência histórica2021foi retirada do item porque o limite populacional está sustentado diretamente peloPP1.4.3.5de2025. O reparo integral do card antigo tem inventário/gate próprios; não se herda liberação pela retirada do vínculo.

Comprimentos A–D: [150,105,94,106] → [84,88,89,91]. Razão da correta pelo maior distrator: 1.415 → 0.923.

---

## 5530b59c — IgAN e Dieta sem Glúten — Indicação Correta

### Veredito e três eixos

**Revisão maior**, em autoria, sem aprovação final. **Confiança:** moderada para a síntese clínica, alta para os limites de desenho/fontes. **Evidência:** PARCIALMENTE VERIFICADA, pois a recomendação de não uso rotineiro é uma síntese clínica explicitada e deve ser confirmada pelo revisor. **Pendência:** DECISIVA até adjudicação da suficiência da síntese e suporte dos vínculos para a conclusão clínica. **Publicação: BLOQUEADA**, pois não há veredito final de aprovação e a pendência deve ser resolvida antes de derivar liberação.

Original SHA256 `e80317068d6f3eb684e4c03f7d3aafe2b293915e3c23c5aa077399c7947de18c`; candidato A1 `812cc4fd3d344cd94780de974953e6b3f3c1289ad7ce032b68745d2c16191aa0`.

### OP e classificação

Distinguir indicação de dieta sem glúten por doença celíaca de uso renal rotineiro sem diagnóstico. Competência: Planejamento de tratamento e distinção entre indicação clínica e extrapolação na nefropatia por IgA. Bloom **Aplicar**, Miller **Sabe como**. Diff original **medium**, final proposto **easy**. Aplica/integra dados ou interpreta limites de evidência, sem depender de raridade de fármaco para definir dificuldade.

### Problemas e justificativa

Correta original concentra justificativas e qualificadores que não estão nos distratores; alternativas precisam representar erros clínicos úteis, sem enchimento. Justificativas seletivas e listas extensas saem da alternativa correta para a explicação; as demais representam erros de indicação, extrapolação ou meta. O gabarito-conceito e o tipo de decisão são preservados.

### Advogado do Recurso

Confirmar uma melhor resposta e a preservação do OP; não confundir ausência de indicação rotineira com contraindicação absoluta, nem omissão de dieta na diretriz com prova de ineficácia universal.

### Critérios eliminatórios

A suficiência de fonte para a inferência clínica é pendência decisiva até a contraprova. Não aplicar o item por concordância intuitiva.

### NQ Editorial Score

**Anulado nesta etapa pela pendência decisiva de suficiência da verificação.** A pontuação contida no pacote é apenas rascunho autoral e não autoriza aprovação.

### Decisão pela árvore editorial

Verificação/síntese insuficientemente adjudicada → completar contraprova antes de decidir o item. Não há aplicação autorizada por esta autoria. Estado: **em_revisão**; legado proposto **REESCREVER**, sujeito à decisão final.

### Patch editorial sugerido

**Não aplicar agora.** Se liberado posteriormente, substituir apenas `q`, `opts`, `exp`, `diff`. Preservar qid, título, categoria, gabarito-conceito e histórico.

#### Pergunta

Pessoa com nefropatia por imunoglobulina A (IgA) primária, sem sintomas ou diagnóstico de doença celíaca, pergunta se deve excluir glúten para proteger os rins. Qual resposta é mais adequada?

#### Alternativas

**A**
Não retirar glúten de rotina como terapia renal na ausência de uma indicação clínica específica

**B**
Retirar glúten por seis meses para testar resposta renal, mesmo sem suspeita de doença celíaca

**C**
Retirar glúten quando a proteinúria ultrapassar 0,5 g/d, substituindo a nefroproteção medicamentosa

**D**
Retirar glúten se houver hematúria microscópica, pois ela identifica sensibilidade ao glúten

#### Resposta correta

**A — Não retirar glúten de rotina como terapia renal na ausência de uma indicação clínica específica**

#### Explicação

Não há evidência clínica suficiente para prescrever retirada rotineira de glúten como nefroproteção na nefropatia por IgA primária sem doença celíaca. A dieta é tratamento da doença celíaca confirmada e pode ter outra indicação gastrointestinal específica; isso é distinto de atribuir benefício renal universal à restrição. Estudos sorológicos, modelos mecanísticos e hipóteses genéticas não demonstram, por si sós, eficácia de uma intervenção dietética sobre a progressão renal. Hematúria ou um limiar de proteinúria não diagnosticam sensibilidade ao glúten. Se houver suspeita de doença celíaca, a investigação deve ser planejada antes de iniciar a restrição, pois os testes dependem da exposição ao glúten.

#### Distratores e erros clínicos

- B: Prescrever teste dietético empírico como terapia renal sem indicação clínica específica.
- C: Substituir nefroproteção por dieta usando limiar de risco renal como indicação gastrointestinal.
- D: Usar hematúria como marcador de sensibilidade alimentar.

#### Referências e rastreabilidade

Vínculos: `kdigo_igan_igav_2025`, `acg_celiac_2023`, `moeller_plosone_2014`. Bindings e hashes próprios estão no JSON. Card alterado não herda revisão pelo fato de o candidato deixar de vinculá-lo.

- **GLUTEN_DIET**: Não prescrever retirada rotineira de glúten como terapia renal daIgANprimária sem indicação clínica específica. A evidência exploratória e associações não estabelecem benefício clínico universal sobre progressão. Local: Tratamentos/escopoKDIGO2025; MoellerMethods/Discussion; CoppoAbstract; MR2025Abstract; ACGdiagnóstico/tratamento. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf), [MOELLER2014](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0094677), [COPPO1990](https://pubmed.ncbi.nlm.nih.gov/2311308/), [GLUTEN_MR2025](https://pubmed.ncbi.nlm.nih.gov/40527780/), [ACG2023](https://www.giboardreview.com/wp-content/uploads/2023/01/Guideline-ACG-Celiac-disease-Jan-2023.pdf).
  Limites: A KDIGO2025não traz recomendação textual sobre glúten, e sua revisão excluiu dietas do escopo. Moeller não testou dieta; Coppo é sem controle; a análiseMR2025não é ensaio de tratamento em doença estabelecida. Não declarar ausência de plausibilidade, impossibilidade de benefício individual ou prova definitiva de ineficácia.
- **CELIAC_DIET**: Dieta sem glúten é tratamento da doença celíaca confirmada. Essa indicação não pode ser convertida em terapia renal universal para qualquerIgAN. Local: Abstract/Introduction e manejo dietético. Fontes: [ACG2023](https://www.giboardreview.com/wp-content/uploads/2023/01/Guideline-ACG-Celiac-disease-Jan-2023.pdf).
- **GLUTEN_TESTING**: Testes sorológicos para doença celíaca devem ser realizados em dieta contendo glúten; restrição iniciada antes da investigação pode prejudicar a interpretação. Local: SerologicTesting, p.63 (PDFp.5). Fontes: [ACG2023](https://www.giboardreview.com/wp-content/uploads/2023/01/Guideline-ACG-Celiac-disease-Jan-2023.pdf).

#### Observações de implementação

Nenhuma escrita médica enquanto bloqueado. Preservar snapshots e avaliações; não resetar FSRS automaticamente nem trocar qid para conservar quantidade.

- Não atribuir àKDIGOuma recomendação textual sobre glúten: a busca integral não encontrou esse termo. A inferência clínica distingue a ausência de terapia renal padrão, evidência exploratória e a indicação gastrointestinal confirmada.
- Moeller é caso-controle, não teste de dieta; novo hash do card requer gate integral. Coppo1990série sem controle e a análise genética2025foram conferidos como contraprovas, sem promover seus achados a recomendação universal.

Comprimentos A–D: [144,93,70,85] → [95,94,99,92]. Razão da correta pelo maior distrator: 1.548 → 0.960.

---

## b7a93d7a — IgAN em Risco — Tratamento em Camadas

### Veredito e três eixos

**Revisão maior**, em autoria, sem aprovação final. **Confiança:** alta para as afirmações mapeadas. **Evidência:** VERIFICADA na autoria. **Pendência:** NENHUMA decisiva detectada pelo autor, com revisão independente editorial e de referências ainda pendente. **Publicação: BLOQUEADA**, pois não há veredito final de aprovação.

Original SHA256 `b66e7f2d734abd24fa3f78b1f7091c73fdb3657a666fde400f11f240aef907e3`; candidato A1 `5da47e4f6b5a12c443f404e0f7caf5e0e39aaf8359493b4127e1bcd57d60caf9`.

### OP e classificação

Planejar eixos simultâneos de nefroproteção e terapia dirigida ao mecanismo da IgAN conforme risco. Competência: Planejamento de tratamento e distinção entre indicação clínica e extrapolação na nefropatia por IgA. Bloom **Aplicar**, Miller **Sabe como**. Diff original **hard**, final proposto **medium**. Aplica/integra dados ou interpreta limites de evidência, sem depender de raridade de fármaco para definir dificuldade.

### Problemas e justificativa

Correta original concentra justificativas e qualificadores que não estão nos distratores; alternativas precisam representar erros clínicos úteis, sem enchimento. Justificativas seletivas e listas extensas saem da alternativa correta para a explicação; as demais representam erros de indicação, extrapolação ou meta. O gabarito-conceito e o tipo de decisão são preservados.

### Advogado do Recurso

Confirmar uma melhor resposta e a preservação do OP; não confundir ausência de indicação rotineira com contraindicação absoluta, nem omissão de dieta na diretriz com prova de ineficácia universal.

### Critérios eliminatórios

Nenhum detectado pelo autor. Confirmar unicidade, plausibilidade, identidade, atualidade e aderência das referências na versão final.

### NQ Editorial Score

Nota autoral provisória **19/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 2/2. O revisor independente deve pontuar novamente; eliminatório anula a nota.

### Decisão pela árvore editorial

Reparo material → contraprova independente de item, referências e classificação → somente eventual aprovação permite derivar liberação. Estado: **em_revisão**; legado proposto **REESCREVER**, sujeito à decisão final.

### Patch editorial sugerido

**Não aplicar agora.** Se liberado posteriormente, substituir apenas `q`, `opts`, `exp`, `diff`. Preservar qid, título, categoria, gabarito-conceito e histórico.

#### Pergunta

Adulto com nefropatia por imunoglobulina A (IgA) primária confirmada por biópsia mantém proteinúria de 0,8 g/d e queda lenta da taxa de filtração glomerular estimada (TFGe). Qual plano melhor representa a KDIGO 2025?

#### Alternativas

**A**
Combinar nefroproteção e avaliação de terapia dirigida à doença, conforme risco e segurança

**B**
Priorizar nefroproteção isolada e adiar a avaliação de terapia dirigida até proteinúria nefrótica

**C**
Usar o limiar de 0,5 g/d de proteinúria como critério suficiente para iniciar glicocorticoide sistêmico

**D**
Escolher terapia dirigida como estratégia suficiente para controlar também as respostas à perda de néfrons

#### Resposta correta

**A — Combinar nefroproteção e avaliação de terapia dirigida à doença, conforme risco e segurança**

#### Explicação

Proteinúria persistente a partir de 0,5 g/d identifica risco de progressão na nefropatia por IgA. A KDIGO propõe abordar simultaneamente os mecanismos específicos da doença e as respostas à perda de néfrons. O plano inclui medidas de estilo de vida, controle pressórico e hemodinâmico e avaliação de terapias dirigidas à formação de imunocomplexos ou à lesão glomerular, conforme risco, segurança, acesso e decisão compartilhada. Não se deve aguardar proteinúria nefrótica para avaliar tratamento adicional, nem transformar 0,5 g/d em prescrição universal de imunossupressão. Terapia dirigida também não substitui o cuidado das consequências da perda de néfrons.

#### Distratores e erros clínicos

- B: Adiar a abordagem dirigida a risco até proteinúria nefrótica apesar da evolução da função renal.
- C: Converter limiar de risco em indicação universal de imunossupressão.
- D: Tratar os dois mecanismos de perda renal como terapias mutuamente excludentes.

#### Referências e rastreabilidade

Vínculos: `kdigo_igan_igav_2025`. Bindings e hashes próprios estão no JSON. Card alterado não herda revisão pelo fato de o candidato deixar de vinculá-lo.

- **DUAL_AXES**: NaIgANprimária em risco, tratar mecanismos específicos da doença e respostas à perda de néfrons em eixos simultâneos, conforme benefício provável, segurança e escolha compartilhada; não imunossuprimir todos pelo limiar isolado. Local: PP1.4.2.2/Figura3 ePP1.4.2.3, S18/S36–S37. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
- **RISK_THRESHOLD**: Proteinúria persistente≥0,5g/d identifica risco que justifica considerar tratamento ou tratamento adicional, sem estabelecer droga obrigatória para todos. Local: PP1.4.1.1, S17/S35. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).

#### Observações de implementação

Nenhuma escrita médica enquanto bloqueado. Preservar snapshots e avaliações; não resetar FSRS automaticamente nem trocar qid para conservar quantidade.



Comprimentos A–D: [225,68,82,84] → [91,94,98,96]. Razão da correta pelo maior distrator: 2.679 → 0.929.

---

## c1089f2e — IgAN — Meta de Proteinúria KDIGO 2025

### Veredito e três eixos

**Revisão maior**, em autoria, sem aprovação final. **Confiança:** alta para as afirmações mapeadas. **Evidência:** VERIFICADA na autoria. **Pendência:** NENHUMA decisiva detectada pelo autor, com revisão independente editorial e de referências ainda pendente. **Publicação: BLOQUEADA**, pois não há veredito final de aprovação.

Original SHA256 `5ae127af7d2254563f943fd9ea40d0a0b36a9d9116e19a78b5033ad6285eeaed`; candidato A1 `fd101c9431d18979917fbfb07e2d8441390effbfc60a5c0c36f6263be617a046`.

### OP e classificação

Reconhecer meta de proteinúria abaixo de0,5g/d, idealmente0,3g/d, sem intensificação imune automática. Competência: Planejamento de tratamento e distinção entre indicação clínica e extrapolação na nefropatia por IgA. Bloom **Lembrar**, Miller **Sabe**. Diff original **medium**, final proposto **easy**. O comando recupera uma meta clínica acionável da diretriz, sem simular aplicação individual ou cálculo. Proposta básica; não criar novoOPpara aparentar complexidade.

### Problemas e justificativa

Correta original concentra justificativas e qualificadores que não estão nos distratores; alternativas precisam representar erros clínicos úteis, sem enchimento. Justificativas seletivas e listas extensas saem da alternativa correta para a explicação; as demais representam erros de indicação, extrapolação ou meta. O gabarito-conceito e o tipo de decisão são preservados.

### Advogado do Recurso

Confirmar uma melhor resposta e a preservação do OP; não confundir ausência de indicação rotineira com contraindicação absoluta, nem omissão de dieta na diretriz com prova de ineficácia universal.

### Critérios eliminatórios

Nenhum detectado pelo autor. Confirmar unicidade, plausibilidade, identidade, atualidade e aderência das referências na versão final.

### NQ Editorial Score

Nota autoral provisória **18/20**: Alinhamento ao OP 2/2; Validade de conteúdo 2/2; Validade de construto 2/2; Qualidade do enunciado 2/2; Alternativas 2/2; Distratores 2/2; Explicação 2/2; Referências 2/2; Ausência de cara de IA 1/2; Valor pedagógico 1/2. O revisor independente deve pontuar novamente; eliminatório anula a nota.

### Decisão pela árvore editorial

Reparo material → contraprova independente de item, referências e classificação → somente eventual aprovação permite derivar liberação. Estado: **em_revisão**; legado proposto **REESCREVER**, sujeito à decisão final.

### Patch editorial sugerido

**Não aplicar agora.** Se liberado posteriormente, substituir apenas `q`, `opts`, `exp`, `diff`. Preservar qid, título, categoria, gabarito-conceito e histórico.

#### Pergunta

Qual meta de proteinúria deve orientar o tratamento da nefropatia por imunoglobulina A (IgA) em risco de progressão segundo a KDIGO 2025?

#### Alternativas

**A**
Abaixo de 0,5 g/d e, idealmente, abaixo de 0,3 g/d

**B**
Abaixo de 1,0 g/d e, idealmente, abaixo de 0,8 g/d

**C**
Abaixo de 2,0 g/d e, idealmente, abaixo de 1,5 g/d

**D**
Abaixo de 0,3 g/d e, idealmente, abaixo de 0,1 g/d

#### Resposta correta

**A — Abaixo de 0,5 g/d e, idealmente, abaixo de 0,3 g/d**

#### Explicação

A KDIGO orienta manter a excreção de proteína abaixo de 0,5 g/d e, idealmente, abaixo de 0,3 g/d. O objetivo é reduzir o risco e aproximar a perda de função renal da faixa fisiológica. A meta não é uma ordem de intensificar imunossupressão até alcançar qualquer valor e não garante risco zero: cicatriz extensa pode limitar a redução possível. Proteinúria baixa não dispensa acompanhar a trajetória da função renal. O alvo de menos de 1 g/d corresponde ao enquadramento da diretriz de 2021, atualizado em 2025.

#### Distratores e erros clínicos

- B: Manter o alvo antigo de menos de1g/d como se fosse a orientação atual.
- C: Aceitar alvo excessivamente permissivo diante do risco de progressão.
- D: Confundir a meta ideal atual com uma faixa ainda mais baixa não estabelecida pela diretriz.

#### Referências e rastreabilidade

Vínculos: `kdigo_igan_igav_2025`. Bindings e hashes próprios estão no JSON. Card alterado não herda revisão pelo fato de o candidato deixar de vinculá-lo.

- **PROTEINURIA_TARGET**: Manter proteinúria<0,5g/d e idealmente<0,3g/d. Cicatriz extensa pode impedir alcançar a meta; o alvo não garante risco zero nem impõe escalada ilimitada de imunossupressão. Local: PP1.4.2.1, S17/S35. Fontes: [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).
- **HISTORIC_2021_TARGET**: O enquadramento2021utilizava alvo<1g/d; a orientação específica foi atualizada em2025. Não reaplicar automaticamente metas ou sequência antigas como protocolo atual. Local: 2021PP2.3.1.2 versus2025PP1.4.2.1. Fontes: [KDIGO2021](https://kdigo.org/wp-content/uploads/2017/02/KDIGO-Glomerular-Diseases-Guideline-2021-English.pdf), [KDIGO2025](https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf).

#### Observações de implementação

Nenhuma escrita médica enquanto bloqueado. Preservar snapshots e avaliações; não resetar FSRS automaticamente nem trocar qid para conservar quantidade.

- Alerta de item direto sobre limiar clínico. Sua utilidade é distinguir alvo atual de risco do alvo antigo, não avaliar integração clínica. A contraprova pode retê-lo se considerar trivia; não trocar seu OP sob o mesmoqidpara elevar Bloom.
- Opções numéricas são paralelas pelo tipo de decisão, sem palavras adicionais para igualar comprimento. Qualificadores de segurança permanecem na explicação.

Comprimentos A–D: [109,71,60,70] → [50,50,50,50]. Razão da correta pelo maior distrator: 1.535 → 1.000.

---

## Cards integrais propostos — BLOQUEADOS

### kdigo_igan_2021

Original SHA256 `8774ec46f2a76bd5353f5c123628f03e99fae40b1eefb36105a7349034454ae9`; candidato `c4d745f686658b7a547c7508083b7561e4e1be66007dfd0476aeb5ca78d6b7ce`. Atual: ddb4938a. Legados: nenhum encontrado. Gate integral e compatibilidade pendentes.

```javascript
{
  "label": "KDIGO IgAN 2021 — contexto histórico",
  "url": "https://kdigo.org/wp-content/uploads/2017/02/KDIGO-Glomerular-Diseases-Guideline-2021-English.pdf",
  "journal": "Kidney Int. 2021;100(4S):S1–S276, capítulo 2",
  "ano": 2021,
  "tipo": "Diretriz Internacional",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Contexto histórico da nefropatia por imunoglobulina A; recomendações específicas atualizadas em 2025",
  "icon": "📋",
  "resumo": "A diretriz de 2021 priorizou suporte otimizado na nefropatia por imunoglobulina A (IgA), incluindo controle pressórico, bloqueio do sistema renina-angiotensina quando tolerado e medidas de estilo de vida. No cenário habitual de doença proteinúrica, definiu alto risco à época por proteinúria acima de 0,75–1 g/d apesar de pelo menos 90 dias de suporte otimizado; a consideração de glicocorticoides exigia discussão da toxicidade. Esse enquadramento não era uma regra indiferenciada para qualquer forma clínica. O capítulo específico de IgA foi atualizado pela KDIGO 2025, com novos limiares e eixos de tratamento; os critérios antigos não devem ser reaplicados como protocolo atual.",
  "conclusao": "Referência histórica do desenvolvimento do manejo. Para decisões atuais sobre nefropatia ou vasculite por IgA, consultar a diretriz específica KDIGO 2025 e a evidência posterior pertinente.",
  "curiosidade": "Uma classificação histológica ou ferramenta prognóstica não é, por si só, um teste validado de resposta a uma terapia. A diretriz de 2021 já distinguia essas finalidades."
}
```

### moeller_plosone_2014

Original SHA256 `7fac8579d18e73957dd803436fd2705c79a73c2a430cfd75044b6feec79e9d58`; candidato `5355da0a46d1be6bac540bdfd6207184ef862ab775baa1f2929e5bc8304dc34f`. Atual: 5530b59c. Legados: assets/artigos_nefro.json índice 256. Gate integral e compatibilidade pendentes.

```javascript
{
  "label": "Moeller et al. — Sorologia celíaca e glúten na nefropatia por IgA (2014)",
  "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0094677",
  "journal": "PLOS ONE. 2014;9(4):e94677",
  "ano": 2014,
  "tipo": "Estudo caso-controle",
  "badge": "CASE_CONTROL",
  "badgeColor": "#0ea5e9",
  "impacto": "Sorologia em caso-controle não justifica prescrição universal de dieta sem glúten",
  "icon": "🔬",
  "resumo": "Estudo caso-controle com 99 pessoas com nefropatia por imunoglobulina A (IgA), 96 controles sem doença e 30 participantes com doença celíaca confirmada por biópsia como controles adicionais. Comparou marcadores sorológicos de reatividade ao glúten e doença celíaca. Não encontrou aumento significativo dos marcadores celíacos específicos ou da reatividade à gliadina no grupo com nefropatia por IgA em relação aos controles sem doença. Foi realizado em centro único, com limitações de população e dieta não controlada; não avaliou intervenção dietética nem desfechos renais longitudinais.",
  "conclusao": "Os resultados não sustentam transformar uma hipótese imunológica em recomendação universal de dieta sem glúten. Também não excluem que doença celíaca e nefropatia por IgA coexistam em uma pessoa.",
  "curiosidade": "O desenho compara casos e controles por seus marcadores; não é uma coorte longitudinal nem um ensaio de tratamento dietético."
}
```

## Validação e limites

Pacotes parseados; originais e hashes verificados, quatro opções e índice de gabarito conferidos, identidade técnica qid/título/categoria/gabarito preservada e referências vinculadas por hash. Cinco IDs únicos; nenhum candidato anterior foi reescrito. Sem testes de runtime por não haver alteração no aplicativo. Gates, integração, catálogo, histórico e publicação pertencem ao fluxo do revisor pai.

# A2 — delta e aposentadoria corrente de2021

Somente b7a93d7a mudou clinicamente: B passou a expressar adiamento de terapia dirigida, C confunde limiar de risco com seleção de glicocorticoide e D presume que terapia dirigida cobre também respostas à perda de néfrons. Não usam sufixo de imprudência para denunciar o erro. A explicação foi alinhada à novaB, sem mudarOP ou correta. Os outros quatro objetos são idênticos àA1;553 permanece PARCIALMENTE VERIFICADA/DECISIVA, retido e sem score.

O card2021 corrigido do pacoteA1 fica apenas documental. A proposta separada `igan-kdigo2021-retirement-proposal-A1.json` solicita aposentadoria do acervo corrente depois da migração aprovada de ddb4938a, preservando fontes e avaliações históricas. Não reanexar referência redundante ao candidato. O cardMoeller continua exigindo gate integral próprio. Nenhum dado do aplicativo foi alterado.
