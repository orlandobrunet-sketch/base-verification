# Classificação independente dos seis originais — 15/11/2026

| Questão | OP abreviado | Evidência | Pendência | Veredito | Score | Eliminatório | Publicação | Legado | Ação |
|---|---|---|---|---|---|---|---|---|---|
| a4c85d32 | Interpretar hiponatremia no contexto de IC | PARCIALMENTE VERIFICADA | NÃO DECISIVA | revisão maior | 14/20 | não | BLOQUEADA | REESCREVER | Explicitar o fenótipo e recalibrar dificuldade |
| 3fa2737c | Escolher a resposta inicial à hiponatremia sintomática pós-irrigação | PARCIALMENTE VERIFICADA | DECISIVA | revisão maior | 13/20 | não confirmado | BLOQUEADA | REESCREVER | Delimitar tonicidade, sintomas e escopo da conduta |
| e94a6488 | Conter sobrecorreção em paciente de alto risco | PARCIALMENTE VERIFICADA | DECISIVA | revisão maior | 12/20 | não confirmado | BLOQUEADA | REESCREVER | Individualizar o limite de segurança e a trajetória |
| d9257155 | Reconhecer a complicação neurológica da correção rápida | PARCIALMENTE VERIFICADA | NÃO DECISIVA | revisão maior | 12/20 | não | BLOQUEADA | REESCREVER | Corrigir explicação e superar o reconhecimento nominal |
| 21a99f07 | Reconhecer o uso condicional seguro da tolvaptana no SIAD | PARCIALMENTE VERIFICADA | DECISIVA | revisão maior | anulado | sim, §17.2 | BLOQUEADA | REESCREVER | Resolver conflito entre a afirmação e as fontes cadastradas |
| e2aae4c7 | Evitar confirmar SIAD apenas pelo padrão urinário | VERIFICADA | NENHUMA | revisão maior | 14/20 | não | BLOQUEADA | REESCREVER | Melhorar distratores mantendo o diagnóstico de exclusão |

## Escopo, independência e identidade dos bytes

Esta avaliação examinou somente os originais de `data/topics.js` no commit `ca1184916b53cddfc7581df17ed75ff3a029c14f`, além das referências e normas necessárias. Nenhum candidato exato, arquivo autoral ou texto de substituição foi aberto antes deste relatório. Durante a conclusão, o autor informou uma direção futura para o item de tolvaptana; essa direção não foi avaliada nem liberada aqui. Não houve edição do banco, criação de questão pronta, decisão automática de reset do FSRS ou publicação.

Aplicados: a skill v2 `C:/Users/orlan/GitHub/base-verification/.agents/skills/revisar-nefroquest/SKILL.md`, seus `references/output-contract.md` e `references/verification-protocol.md`; `docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md`; `docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md`, especialmente capítulos 13–19 e §§18.4–18.5; e `docs/editorial/annex-c-nefrologia.md`. As dificuldades abaixo são editoriais, não estimativas psicométricas observadas. Nenhum `loid` físico foi presumido.

Os SHA-256 de linha cobrem os bytes UTF-8 da linha Git inteira, incluindo indentação e vírgula final, excluindo a quebra de linha. Os SHA-256 canônicos cobrem o objeto autoral completo, serializado como JSON com chaves ordenadas, `ensure_ascii=False` e separadores `(',', ':')`. Não são apresentados como o digest de revisão do runtime.

| qid | Linha no commit | SHA-256 da linha | SHA-256 canônico autoral |
|---|---:|---|---|
| a4c85d32 | 421 | b96a2536c36afcdb9d8c58f40a09e3207ffc23086b28d1587c60a04fe1348ad7 | a1fcefab6c17888a89eb154ae5e492086899c533a0789d8c49f4b0108bdcdd09 |
| 3fa2737c | 522 | c03fdc96f0acf26cff3ceaa021e698e0878f84e4d11a68e43b83dfb703aa461c | 828388e041a0f622bfb600416cfdefa97d4bc3578d287bafb2c836a46348a267 |
| e94a6488 | 241 | d775646f2072d28a2653134bcc3e8289cdcb3f0b17c60eb0426ab6d1b4929fec | 8f75ad7c582415349fee768251d9a6ff3ad82f8add818d40ffbac99e2132a2b7 |
| d9257155 | 257 | d544e7542cb70633b8714157243c74c17a15a3ae745071b57d6eaec1bfdc857e | bdfe4433132c5e6e1c71fc227bb704bb9003728a473b5261b0b44b94d5a68d98 |
| 21a99f07 | 521 | 59803b2f6943beef679d63dea88888e77c6acbe20b50e53fd7a7388b77bf76a3 | c8d0f453da32421f6c00a91aabeaf80884a373c73738ec6fb6d9b7172d8b4701 |
| e2aae4c7 | 520 | 8bf2c28646022003cf3a14f1b8ddb0acd043299b786a3806e695e28b9cdd64ad | 32667b08037e187a0ea8dd813f6b809b79f06687b2f1007e36d2384366c9d75e |

## Evidência aberta e limites de acesso

**E1 — Europa 2014.** Spasovski et al., *Clinical practice guideline on diagnosis and treatment of hyponatraemia*, EJE 170:G1–G47, DOI 10.1530/EJE-13-1020. [Publicação primária integral, cópia acessível](https://icuscenarios.com/wp-content/uploads/2023/02/European-hyponatremia-guidelines.pdf); identidade e autoria corroboradas pelo [diretório oficial da ESE](https://www.ese-hormones.org/publications/directory/ese-clinical-guideline-for-the-management-of-hyponatraemia/). O PDF é uma reprodução do artigo, hospedada fora da sociedade. Os endpoints originais OUP consultados não entregaram o texto nesta sessão.

Trechos conferidos: tabela 6 e §6.3 (SIAD exige exclusões; índices urinários dependem do contexto); §7.2.1.4 (um bolus de salina 3% é sugerido para sintomas moderadamente graves); §§7.4.3.4–5 (recomendações contrárias aos antagonistas de vasopressina no SIAD moderado/profundo); §7.5 (ação após ultrapassar limites, interromper tratamento ativo e discutir água livre/desmopressina). As recomendações terapêuticas citadas têm certeza baixa/muito baixa, não demonstram risco zero.

**E2 — Painel americano 2013.** Verbalis et al., *Diagnosis, Evaluation, and Treatment of Hyponatremia: Expert Panel Recommendations*, Am J Med 126:S1–S42, DOI 10.1016/j.amjmed.2013.07.006. [Publicação primária integral, cópia acessível](https://cdn1.redemc.net/campus/wp-content/uploads/2019/08/guia-tto-hipona-rev-amjmed2013.pdf). A cópia contém a publicação original e declaração de apoio da Otsuka; trata-se de consenso, não ensaio. Conferidos S11, S14, S18–S21 e os trechos pertinentes ao tratamento: baixo sódio urinário pode acompanhar IC com expansão extracelular; alto risco de SDO exige distinguir meta de 4–6 mmol/L/dia do teto de 8 mmol/L em qualquer 24 horas; há lesões pontinas e extrapontinas. O painel diferencia infusão para sintomas menos graves de bolus para manifestações graves. Não se transcreveram doses de desmopressina do OCR, que perde o símbolo de micrograma.

**E3 — Bula regulatória SAMSCA.** [DailyMed/FDA, revisão 04/2021](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=5526617c-c7b9-4556-886d-729bbabbc566). Conferidas indicação, advertência destacada, limitações, início e contraindicações: início/reinício hospitalar com sódio monitorado; pacientes eu/hipervolêmicos selecionados; não é tratamento de resgate neurológico urgente; hipovolemia e incapacidade de responder à sede contraindicam uso. A orientação hídrica inicial não equivale a manter restrição hídrica simultânea. É fonte regulatória americana, não uma diretriz universal nem uma nova referência já cadastrada.

**E4 — Corroboração, não substituição da fonte primária.** Sterns et al., [*Treatment Guidelines for Hyponatremia: Stay the Course*, CJASN 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10843202/), DOI 10.2215/CJN.0000000000000244. Revisão de especialistas aberta: descreve recuperação em parte dos casos de déficits pós-tratamento. Portanto, a afirmação de irreversibilidade invariável do original não é defensável.

**E5 — Limites bibliográficos.** O texto integral de Adrogué/Madias 2000 no NEJM não ficou acessível; o livro Brenner não foi lido integralmente; o artigo primário SALSA teve identificação bibliográfica conferida (PMID 33104189; DOI 10.1001/jamainternmed.2020.5519), mas seu texto integral não foi obtido por esses endpoints. Não se usam essas referências como confirmação integral dos originais nem como prova de ausência de SDO ou aplicabilidade específica à RTU. A falha de acesso não demonstra que a URL cadastrada esteja errada.

**Vigência:** o documento ESE 2026 encontrado está explicitamente identificado como [rascunho para revisão](https://www.ese-hormones.org/media/nfca3mga/hyponatraemia-joint-guideline-draft-for-review.pdf). Não foi usado como recomendação final publicada, nem como motivo para declarar 2014 substituída.

## Auditoria dos vínculos de referências originais

`hypona` e `hyponatremia_verbalis2022` existem em `data/refs.js`, mas apontam à mesma diretriz europeia de 2014. O segundo identificador não representa um painel Verbalis de 2022. Duas entradas não são duas confirmações independentes. Não há ID órfão entre os seis itens. As sínteses dos cards também não substituem a leitura da publicação e não neutralizam divergência entre sociedades. Esta etapa não cria nem libera cards novos.

## a4c85d32

**Veredito:** revisão maior. **Confiança:** moderada. **Evidência:** PARCIALMENTE VERIFICADA. **Pendência:** NÃO DECISIVA. **Publicação:** BLOQUEADA, derivada do veredito não aprovativo.

**OP declarado e classificação:** interpretar o padrão urinário de um paciente com IC como compatível com baixo volume arterial efetivo e hiponatremia hipervolêmica. Competência primária: interpretação etiológica. Bloom: Analisar; Miller: sabe como. Dificuldade intrínseca: intermediária (`medium`), não avançada (`hard`): integra dois índices e o contexto, sem escolher entre condutas próximas.

**Justificativa e suficiência:** C continua sendo a melhor hipótese entre as quatro oferecidas. A palavra “congestiva” já favorece esse contexto; não foi demonstrada uma segunda resposta igualmente boa. Entretanto, o item não documenta hipotonicidade, congestão atual, função renal ou diuréticos. Um diagnóstico prévio de IC não comprova sozinho o estado volêmico presente. E2 sustenta a interpretação fisiológica, mas não autoriza transformar os índices isolados em confirmação volumétrica.

**Problemas:** 1. MAIOR — fenótipo atual pouco explícito para uma pergunta de classificação etiológica/volêmica. 2. MAIOR — dificuldade cadastrada acima do raciocínio exigido. 3. MENOR — três referências amplas, com dois textos não conferidos integralmente (E5); o título também revela o contexto etiológico.

**Advogado do Recurso:** “Onde estão os achados atuais que permitem assumir hipervolemia?” É objeção substantiva à suficiência, embora não prove outro gabarito. **Eliminatórios:** nenhum confirmado; não se rotula toda informação ausente como dado decisivo.

**Score:** 14/20, banda recuperável; dimensões na tabela comum abaixo. **Decisão §19:** evidência parcial não decisiva → sem eliminatório confirmado → objeção substantiva/score recuperável → `em_revisão`.

**Patch editorial sugerido — SUBSTITUIR A QUESTÃO POR:** direção de reparo, sem texto pronto: tornar o estado clínico atual suficiente, manter a interpretação central e usar distratores próximos. **Implementação:** `qid` pode ser preservado somente se esse OP, competência, conceito e identidade forem mantidos (§18.5); nenhuma decisão de FSRS agora. **Pendência:** vínculo integral às fontes adicionais é secundário à hipótese já sustentada por E2; a nova redação terá nova revisão.

## 3fa2737c

**Veredito:** revisão maior. **Confiança:** moderada. **Evidência:** PARCIALMENTE VERIFICADA. **Pendência:** DECISIVA. **Publicação:** BLOQUEADA por pendência e veredito.

**OP declarado e classificação:** escolher o tratamento inicial dirigido ao sódio no quadro sintomático agudo após absorção de irrigação. Competência primária: conduta. Bloom: Aplicar; Miller: sabe como. Dificuldade: intermediária (`medium`). Diagnóstico e conduta compõem aqui a mesma decisão contextual; não se declara deriva só pela conjunção “e”.

**Justificativa e suficiência:** D é a melhor opção apresentada. A cronologia e o sódio sustentam urgência; confusão/náuseas, isoladamente, não documentam a categoria neurológica mais grave. E1 sustenta bolus também na categoria moderadamente grave; E2 usa outra estratégia nesse estrato. Assim, não se conclui que o bolus original esteja automaticamente errado, mas a explicação deveria delimitar sua base e evitar inferir gravidade sintomática apenas do número.

**Problemas:** 1. MAIOR — tipo/tonicidade da irrigação e contexto hemodinâmico não estão definidos; precisam ser resolvidos antes de uma prescrição mais específica. 2. MAIOR — a hipotensão exige atendimento paralelo, enquanto “conduta imediata” sugere uma resposta completa. 3. MAIOR — distratores se autoexcluem por “apenas”, “única” e “sem tratar”, reduzindo discriminação. 4. MENOR — SALSA não foi verificado integralmente nem demonstrado como evidência específica desse cenário (E5).

**Advogado do Recurso:** pedir a classificação dos sintomas e o enquadramento da solução absorvida; contestar que uma única medida descrita resolva também a instabilidade circulatória. Não foi identificada outra alternativa correta, mas são objeções substantivas. **Eliminatórios:** nenhum confirmado nesta etapa; a necessidade de um dado passa a ser eliminatória se o autor pretender uma decisão que dependa dele.

**Score:** 13/20, recuperável. **Decisão §19:** teto por pendência decisiva → construção recuperável → `em_revisão`.

**Patch editorial sugerido — SUBSTITUIR A QUESTÃO POR:** explicitar o contexto que sustenta a intervenção, recortar a pergunta para uma decisão e balancear as alternativas; não se entrega candidato pronto. **Implementação:** preservar `qid` só se continuar reconhecível como a mesma decisão pós-irrigação; trocar doença, competência ou raciocínio central exige reavaliar identidade. **Pendência:** enquadramento clínico/protocolo do novo caso; SALSA não deve suprir uma lacuna não verificada.

## e94a6488

**Veredito:** revisão maior. **Confiança:** alta para os problemas de construção, moderada para a suficiência clínica. **Evidência:** PARCIALMENTE VERIFICADA. **Pendência:** DECISIVA. **Publicação:** BLOQUEADA.

**OP declarado e classificação:** reconhecer a necessidade de conter uma trajetória de sobrecorreção em paciente com fatores de alto risco. Competência: conduta de segurança. Bloom: Aplicar; Miller: sabe como. Dificuldade efetiva: básica (`easy`) no original, cuja alternativa segura se destaca sem cálculo ou comparação próxima; não se confunde a complexidade potencial do tema com a do item.

**Justificativa e suficiência:** D é a única orientação prudente entre as opções. O enunciado não fornece valores seriados, intervalo ou diurese para demonstrar que determinado limiar foi ultrapassado. Isso não invalida por si só uma pergunta preventiva e condicional, mas impede ensinar uma decisão quantitativa já tomada. O caso é explicitamente de alto risco e a explicação usa somente o limite geral europeu; a estratificação de E2 é decisiva para não transformar um teto genérico em licença para esse paciente.

**Problemas:** 1. MAIOR — individualização de segurança insuficiente na explicação (E2). 2. MAIOR — trajetória de correção apenas adjetivada. 3. MAIOR — três alternativas repetem o mesmo erro de acelerar/normalizar; a correta agrega todas as salvaguardas e fica maior. São erros clínicos reais, mas não três testes independentes de raciocínio.

**Advogado do Recurso:** “Qual correção ocorreu e qual limite vale para este perfil?” O recurso é substantivo para a decisão quantitativa implícita; não demonstra A/B/C corretas. **Eliminatórios:** nenhum confirmado, pois o comando é preventivo e D permanece condicional. A insuficiência deve ser reparada, não convertida em dificuldade avançada.

**Score:** 12/20, recuperável. **Decisão §19:** pendência decisiva/segurança → revisão maior, `em_revisão`.

**Patch editorial sugerido — SUBSTITUIR A QUESTÃO POR:** explicitar trajetória e meta versus teto, com decisões alternativas plausíveis e próximas; não há versão pronta neste relatório. **Implementação:** preservar `qid` se continuar prevenção/contenção da sobrecorreção, sem trocar o OP por simples cálculo ou por tratamento de SDO já instalada; FSRS sem reset automático. **Pendência:** segurança do limite adotado no caso exato e da ação proposta; revisão material obrigatória.

## d9257155

**Veredito:** revisão maior. **Confiança:** alta. **Evidência:** PARCIALMENTE VERIFICADA. **Pendência:** NÃO DECISIVA. **Publicação:** BLOQUEADA pelo veredito.

**OP declarado e classificação:** reconhecer SDO como complicação da correção rápida de hiponatremia crônica. Competência: diagnóstico/reconhecimento de complicação. Bloom: Lembrar; Miller: sabe. Dificuldade intrínseca: básica (`easy`), não a `medium` cadastrada. Nomear a complicação tem relevância clínica; não se declara automaticamente “trivia sem consequência”.

**Justificativa:** A nomeia a entidade correta. O item exige essencialmente recuperar um nome. A explicação excede esse acerto e inclui duas generalizações inadequadas: sinonímia irrestrita com a forma pontina e irreversibilidade invariável. E2 e E4 delimitam esses problemas; nenhuma inferência de prognóstico individual foi feita.

**Problemas:** 1. MAIOR — explicação terminológica/prognóstica imprecisa. 2. MAIOR — baixa altitude cognitiva frente à dificuldade declarada. 3. MENOR — limites gerais apresentados sem estratificação; são contexto da explicação, não demonstração de um limiar universal. 4. MENOR — referência SALSA sem verificação integral e sem justificativa específica para esse OP.

**Advogado do Recurso:** é plausível contestar a explicação, não a identidade da melhor alternativa. Ausência de lesão exclusivamente pontina ou possibilidade de recuperação não invalida o diagnóstico de SDO. **Eliminatórios:** nenhum confirmado; o problema da explicação não contradiz o conceito central do gabarito nem demonstra segunda resposta.

**Score:** 12/20, recuperável. **Decisão §19:** sem eliminatório confirmado → revisão substantiva de explicação/construção → `em_revisão`.

**Patch editorial sugerido — SUBSTITUIR A QUESTÃO POR:** tornar o reconhecimento clinicamente significativo sem mudar o OP; corrigir generalizações e justificar referências. **Implementação:** manter `qid` só se continuar reconhecimento da mesma complicação; mudar para tratamento de hipercorreção mudaria o objetivo. Não há reset de FSRS decidido. **Pendência:** conferência integral das referências secundárias remanescentes (E5), sem capacidade de trocar A após E2/E4.

## 21a99f07

**Veredito:** revisão maior. **Confiança:** alta. **Evidência:** PARCIALMENTE VERIFICADA. **Pendência:** DECISIVA. **Publicação:** BLOQUEADA por pendência, eliminatório e veredito.

**OP declarado e classificação:** reconhecer as condições e salvaguardas do uso de tolvaptana em SIAD selecionado. Competência: conduta de segurança. Bloom: Compreender; Miller: sabe. Dificuldade: básica (`easy`) no original, que pede uma afirmação geral, não aplicação a um paciente selecionado.

**Justificativa:** C é coerente com um enquadramento americano/regulatório selecionado, como E3, mas o item cita exclusivamente E1 por dois IDs. O próprio documento citado contém recomendação contrária nos estratos pertinentes. Não é suficiente renomear um card nem mencionar “refratária” para apagar essa divergência; também não se conclui que toda utilização selecionada seja cientificamente proibida.

**Problemas:** 1. CRÍTICO — referência cadastrada não sustenta o enquadramento afirmativo apresentado (§17.2). 2. MAIOR — ausência de população/indicação e de jurisdição ou contexto decisório torna a frase ampla. 3. MAIOR — três negações grosseiras tornam C previsível sem raciocínio de seleção/segurança. 4. MENOR — duplicação da mesma fonte sob identificador cronologicamente enganoso.

**Advogado do Recurso:** “A diretriz que a própria questão fornece não recomenda esse uso; qual orientação permite a alternativa C e a qual paciente ela se aplica?” Recurso substantivo confirmado. **Eliminatórios:** §17.2, referência não sustenta o gabarito no enquadramento adotado. Não se acumulam eliminatórios especulativos sobre segurança sem um caso definido.

**NQ Editorial Score:** anulado por eliminatório. **Decisão §19:** pendência decisiva → eliminatório recuperável por nova redação/base de evidência → revisão maior, `em_revisão`.

**Patch editorial sugerido — SUBSTITUIR A QUESTÃO POR:** recortar seleção e segurança, explicitar a base escolhida e reconhecer o limite/divergência; nenhum novo texto ou card é liberado aqui. **Implementação:** o `qid` pode ser preservado se OP, competência e conceito de uso condicional seguro permanecerem. Reescrever para mecanismos ou para uma proibição universal mudaria o raciocínio central. **Pendência:** validar a população e todas as salvaguardas da futura versão exata; revisão integral dos cards novos, sem herança de autorização.

## e2aae4c7

**Veredito:** revisão maior. **Confiança:** alta. **Evidência:** VERIFICADA para as afirmações decisivas deste item. **Pendência:** NENHUMA. **Publicação:** BLOQUEADA pelo veredito editorial, apesar da verificação científica.

**OP declarado e classificação:** interpretar um padrão compatível com SIAD sem encerrar o diagnóstico antes das exclusões necessárias. Competência: diagnóstico. Bloom: Analisar; Miller: sabe como. Dificuldade: intermediária (`medium`) para o raciocínio pretendido, reduzida na execução por alternativas fracas.

**Justificativa e suficiência:** A é a melhor interpretação, sustentada por E1, tabela 6. Não há dado decisivo faltante por não se fornecer cortisol: a pergunta solicita precisamente o que precisa ser excluído antes da conclusão. O pacote de exclusões pertence a uma única decisão diagnóstica, não constitui automaticamente múltiplos OPs.

**Problemas:** 1. MAIOR — A é a única alternativa cautelosa e mais completa; B/C invertem diretamente os achados, e D acrescenta certeza e conduta universal. A oposição é ampla demais para testar a exclusão importante. 2. MAIOR — a explicação repete a lista sem discriminar bem o raciocínio que deve ser aprendido. 3. MENOR — dois IDs para a mesma publicação não acrescentam força de evidência; “osmolaridade” versus “osmolalidade” merece uniformidade técnica.

**Advogado do Recurso:** nenhum argumento plausível de anulação do gabarito identificado. As exclusões ainda não testadas não autorizam confirmar SIAD, o que é justamente a ressalva de A. **Eliminatórios:** nenhum confirmado; as alternativas fracas refletem erros clínicos reconhecíveis, não se chama toda resposta incorreta de absurda.

**Score:** 14/20, recuperável. **Decisão §19:** evidência verificada → sem eliminatório/recurso de anulação → score recuperável → revisão maior, `em_revisão`.

**Patch editorial sugerido — SUBSTITUIR A QUESTÃO POR:** manter a decisão provisória e construir concorrentes diagnósticos críveis; não se entrega substituição pronta. **Implementação:** preservação de `qid` plausível se permanecer a mesma exclusão antes de SIAD; converter para reconhecimento de outro distúrbio mudaria identidade. FSRS sem decisão automática. **Pendências de verificação:** nenhuma das afirmações decisivas do original; qualquer mudança material exige revisão nova.

## NQ Editorial Score — dez dimensões

Valores são julgamentos editoriais da versão original. Os problemas de redação não são apresentados como medidas observadas de discriminação ou de acerto dos usuários.

| Dimensão (0–2) | a4c85d32 | 3fa2737c | e94a6488 | d9257155 | 21a99f07 | e2aae4c7 |
|---|---:|---:|---:|---:|---|---:|
| Alinhamento ao OP | 2 | 2 | 2 | 2 | anulado | 2 |
| Validade de conteúdo | 2 | 1 | 1 | 1 | anulado | 2 |
| Validade de construto | 1 | 1 | 1 | 0 | anulado | 1 |
| Enunciado | 1 | 1 | 1 | 2 | anulado | 2 |
| Alternativas | 2 | 1 | 1 | 2 | anulado | 1 |
| Distratores | 1 | 1 | 0 | 1 | anulado | 0 |
| Explicação | 1 | 1 | 1 | 0 | anulado | 1 |
| Referências | 1 | 1 | 1 | 1 | anulado | 1 |
| Naturalidade / ausência de pistas de IA | 1 | 2 | 2 | 1 | anulado | 2 |
| Valor pedagógico | 2 | 2 | 2 | 2 | anulado | 2 |
| Total | 14 | 13 | 12 | 12 | anulado | 14 |

## Controle dos dez eliminatórios (§17)

Foram considerados para cada item: mais de uma resposta defensável; referência incompatível; deriva de OP; conduta insegura premiada; distrator absurdo; trivia sem consequência; explicação contraditória com o gabarito; dado decisivo ausente; protocolo local não declarado; desatualização relevante. Confirmou-se apenas o conflito de referência em `21a99f07`. As lacunas clínicas dos demais foram mantidas como problemas e pendências especificados, sem inventar um segundo gabarito. O documento 2026 em revisão não foi usado para disparar desatualização.

Não foi feita busca integral de duplicatas do banco; sem ela, nenhum veredito de fusão é emitido. Os seis OPs são distintos entre si, mesmo compartilhando hiponatremia. `cfeef8e1` e `4c7d3db3` não foram revisados nesta etapa.

## Consequência editorial

Este é um parecer dos originais identificados pelos hashes acima, sem autorização para escrever qualquer reescrita no banco. Todos permanecem BLOQUEADOS nesta avaliação. A futura versão exata precisará de revisão própria, inclusive dos cards, dos três eixos e da identidade/FSRS. A evidência verificada de uma afirmação não elimina os defeitos de construção nem libera automaticamente uma versão materialmente diferente.
