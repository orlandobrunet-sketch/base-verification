# NQ Editorial Handbook v1

> **Versão:** 1.2 — rascunho para revisão humana
> **Status:** manual editorial operacional (não é código nem especificação de implementação)
> **Data:** 2026-06-30
> **Documento-base:** `docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md` (referido como **“o Model”**).
> **Público-alvo:** autor médico, revisor médico, agente de IA (`criar-nefroquest`, `revisar-nefroquest`).
> **Relação com o Model:** o Model é a **ontologia** (o *quê*); este Handbook é o **procedimento** (o *como*). Onde houver conflito aparente, o Model define o conceito e o Handbook define a ação.
> **Linguagem normativa:** **DEVE** = obrigatório; **DEVERIA** = recomendado, exceção justificável; **PODE** = permitido. Onde houver **“Regra”**, **checklist** ou **árvore**, trata-se de critério executável — o mesmo insumo DEVE produzir o mesmo veredito por humano ou por IA.
> **Escopo universal × nefrologia:** o corpo do documento é **universal** (qualquer especialidade). Exemplos e âncoras de nefrologia estão no **Anexo C**. Marcações *[Módulo: Nefrologia]* apontam onde o módulo entra.
> **Pendências herdadas do Model (não bloqueiam este Handbook):** granularidade fina do OP; escolha EPA vs CanMEDS; vocabulários controlados de competência/conceito/erro (Model §9.4). Onde relevante, o texto marca **[Pendência]**.

---

## Sumário

- **Parte I — Fundamentos:** Cap. 1–3
- **Parte II — Criação:** Cap. 4–7
- **Parte III — Classificação:** Cap. 8–9
- **Parte IV — Avaliação:** Cap. 10–16
- **Parte V — Decisão:** Cap. 17–19
- **Parte VI — Pós-publicação:** Cap. 20
- **Parte VII — Escala:** Cap. 21–22
- **Parte VIII — Operação por IA:** Cap. 23
- **Anexos A–E**

---

# Parte I — Fundamentos

## 1. O que é uma questão excelente no NefroQuest

Uma questão excelente **DEVE** satisfazer, simultaneamente:

1. **Mede um OP relevante** (Model §5–6) — existe intenção pedagógica declarada e ela importa clinicamente.
2. **Tem validade nas quatro dimensões** (Model §8): conteúdo, construto, resposta, consequencial.
3. **Tem uma única melhor resposta**, defensável e inequívoca.
4. **Ensina pelos distratores** — cada alternativa errada materializa um erro clínico plausível.
5. **Explica concluindo** — a explicação começa pela resposta e ensina o raciocínio, não repete o enunciado.
6. **Sustenta-se em evidência vigente** — referência adequada, atual e que realmente apoia o gabarito.
7. **Não tem “cara de IA”** — lê-se como clínica real, não como texto gerado.

> **Regra do padrão-ouro.** Correção científica é **condição necessária, não suficiente**. Uma questão pode estar 100% correta e ainda assim ser reprovada por ser trivial, redundante, desalinhada do OP ou decorativa (Model §11).

**Contraste operacional:**

| “Apenas correta” | “Excelente” |
|---|---|
| Gabarito verdadeiro | Gabarito verdadeiro **e** único **e** alinhado ao OP |
| Distratores plausíveis o bastante | Distratores que são **erros clínicos nomeados** |
| Explicação verdadeira | Explicação que **conclui, discrimina e adverte** |
| Tem referência | Referência que **sustenta o gabarito** e está **vigente** |
| Testa um fato | Testa uma **decisão/interpretação** que muda conduta |

## 2. Como escolher e confirmar o Objetivo Pedagógico

Toda questão **DEVE** nascer de um OP explícito. Antes de escrever qualquer enunciado:

**Fluxo de seleção de OP:**
1. **Partir da decisão clínica**, não do assunto. Pergunte: *que decisão ou interpretação o usuário precisa saber tomar?*
2. **Verificar se já existe OP** para essa decisão. Se existe, **DEVE** reusá-lo (a questão vira irmã — Cap. 15).
3. **Se não existe, redigir o OP** com verbo testável: *“ser capaz de [verbo] [conceito] em [cenário], evitando [erro]”* (Model §3.2).
4. **Aplicar a regra de fronteira** (Model §5): reaparece em subespecialidades → é **Conceito**, não OP; é onde o aluno “abre o capítulo” → é **Tópico**; tem verbo e gabarito → é **OP**.
5. **Confirmar granularidade:** um OP = **uma** decisão testável. Se o OP mistura duas decisões (ex.: “diagnosticar **e** tratar”), ele **DEVE** ser dividido. **[Pendência: granularidade fina]**

> **Regra da competência única.** Se dois revisores não conseguem nomear a **mesma** competência primária a partir do OP, o OP está mal redigido — corrija o OP, não a questão (Model §9.2).

## 3. A questão merece existir? — Portão de existência

Antes de escrever, a questão **DEVE** passar por **todas** as portas abaixo (Model §11). Falha em qualquer uma = não escrever (ou rejeitar).

**Checklist de existência (eliminatório):**
- [ ] **Mede um OP relevante?** Sem OP ou OP irrelevante → não existe.
- [ ] **Ensina ou detecta erro?** Não muda diagnóstico, estratificação, conduta, monitorização, prognóstico ou segurança → não existe.
- [ ] **Acrescenta ao OP?** Redundante com irmã do mesmo OP/perfil/língua sem variação útil → fundir, não criar.
- [ ] **Escapa da trivia?** Depende de decorar nome/ano/número/epônimo sem consequência clínica → não existe.
- [ ] **É segura?** Algum distrator, se internalizado, ensina conduta perigosa → reescrever antes de existir.

---

# Parte II — Criação

## 4. Enunciados clínicos realistas

**Estrutura preferencial (DEVERIA seguir):** paciente e cenário → antecedentes relevantes → achados clínicos/laboratoriais → evolução temporal (se necessária) → **pergunta direta**.

**Regras:**
- O enunciado **DEVE** ser respondível **antes** de ler as alternativas.
- Todo dado que **muda a resposta** **DEVE** estar presente (suficiência clínica). Se um dado decisivo falta, **DEVE** reescrever o caso — nunca inferir em silêncio.
- Dado que **não altera** o raciocínio **NÃO DEVE** aparecer (proibição de dado decorativo).
- A pergunta final **DEVERIA** ser do tipo “qual a conduta mais apropriada agora?”, “qual achado explica…?”, “qual o diagnóstico mais provável?”.
- **NÃO DEVE** usar “assinale a correta”, negativa sem destaque, ou enunciado enciclopédico.

**Checklist de enunciado:**
- [ ] Pergunta respondível sem as alternativas.
- [ ] Todos os dados decisivos presentes; nenhum dado decorativo.
- [ ] Cenário clinicamente plausível *[âncoras: Anexo C]*.
- [ ] Horizonte temporal explícito quando muda a conduta.
- [ ] Unidades, valores e gravidade completos.

## 5. Construção de alternativas

- **DEVE** haver exatamente quatro alternativas (A–D) e **uma única melhor resposta**.
- Todas **DEVEM** pertencer à mesma categoria lógica (quatro condutas, quatro diagnósticos, quatro interpretações…), com granularidade e comprimento equilibrados.
- Cada alternativa **DEVE** ser testada isoladamente contra o enunciado: *seria defensável em algum guideline atual? seria correta sob um dado implícito? é parcialmente correta? depende de preferência local?* Se duas passam, a questão é ambígua (Cap. 14).
- A correta **NÃO DEVE** destacar-se por comprimento, especificidade, justificativa embutida ou por repetir palavras do enunciado.
- **Restrição de posição (crítica):** enquanto as explicações citarem a letra (“alternativa B”), a ordem A–D **NÃO DEVE** ser embaralhada (Model §16). A correção referencia **conteúdo**, não letra, sempre que possível.

**Checklist de alternativas:**
- [ ] 4 alternativas, mesma categoria, paralelas.
- [ ] Uma única melhor resposta comprovada pelo teste isolado.
- [ ] Sem pistas de linguagem, absolutismos ou sobre-especificidade seletiva.
- [ ] Sem “todas/nenhuma das anteriores”.

## 6. Distratores a partir de erros clínicos plausíveis

Cada distrator **DEVE** materializar um **erro clínico nomeável** — derivado do *erro clínico clássico* e da *armadilha projetada* do OP (Model §3.2, §6). *[Catálogo de erros: Anexo C]*

**Tipologia de distrator (DEVERIA cobrir mais de um tipo):**
- **Erro clássico** — a conduta/diagnóstico que o OP existe para prevenir.
- **Correto-porém-incompleto** — responde metade da pergunta (ex.: dá o diagnóstico quando se pede diagnóstico **e** conduta).
- **Certo-em-contexto-errado** — conduta correta noutra população/estágio/momento.

**Regras:**
- **NÃO DEVE** existir distrator absurdo (reprovação automática — Cap. 17).
- **NÃO DEVE** existir distrator que, se escolhido como “quase certo”, ensine conduta insegura tratada como aceitável.
- Distratores **DEVERIAM** ter comprimento e especificidade semelhantes à correta.

## 7. Como evitar questões com “cara de IA”

Questões geradas por IA tendem a *tells* reconhecíveis. O autor/revisor **DEVE** eliminá-los. *[Catálogo completo: Anexo B]*

**Tells mais comuns e correção:**
- **Simetria artificial** (4 alternativas com a mesma cadência sintática) → variar naturalmente.
- **Hedging excessivo** (“pode, em alguns casos, eventualmente”) → afirmar o que a evidência sustenta.
- **Distratores genéricos** (opostos triviais, negações do gabarito) → substituir por erros clínicos reais.
- **Precisão falsa** (IC/valores inventados) → só números verificados (Model §8.1).
- **Enunciado enciclopédico** (parágrafo de revisão antes da pergunta) → cortar para o caso.
- **Uniformidade de comprimento/estrutura** → ajustar ao conteúdo, não ao molde.
- **“Cheiro” de tradução literal** → reescrever na terminologia clínica do Brasil.

> **Regra do realismo.** Se um clínico experiente lê a questão e pensa “isto não soa como um caso real”, há *tell* — **DEVE** reescrever.

---

# Parte III — Classificação

## 8. Classificar nível cognitivo (Bloom/Miller)

- A classificação **DEVERIA** ser **herdada do OP** (Model §9.4), não reatribuída por questão.
- Bloom/Miller é **sinal de qualidade**: um OP não **DEVERIA** residir apenas em “Lembrar” (Miller “sabe”) — recall puro é candidato a trivia (Cap. 3).
- **DEVE** usar as rubricas-âncora *[Anexo C]* para reduzir subjetividade.

**Regra de coerência:** o nível declarado **DEVE** bater com o que a questão exige de fato. Um OP “Avaliar” cujo item se resolve por recall de um número tem **falha de construto** (Cap. 10).

## 9. Classificar dificuldade

O autor atribui **apenas a dificuldade editorial intrínseca** (Model §7, eixo 1), semeada por `diff`. Os demais eixos **NÃO DEVEM** ser preenchidos à mão:
- **Esperada por perfil** — derivada (Model §7, eixo 3); **NÃO DEVE** ser editada manualmente.
- **Percebida** — vem dos votos (Cap. 20).
- **Empírica/IRT** — vem da telemetria (Cap. 20).

**Regra de não-confusão:** dificuldade **DEVE** vir do raciocínio exigido, **nunca** de omissão de dado, frase confusa ou trivia (Model §7). *[Âncoras de dificuldade: Anexo C]*

---

# Parte IV — Avaliação

## 10. Avaliar a validade da questão

Aplicar os quatro tipos e as duas regras do Model §8.

**Checklist de validade:**
- [ ] **Conteúdo** — afirmação-chave verdadeira, fonte vigente, distratores reais, nada fabricado.
- [ ] **Construto** — mede o raciocínio pretendido, não trivia/leitura/prova. Sem facilidade nem dificuldade irrelevantes ao construto.
- [ ] **Resposta** — o caminho de acerto é o raciocínio pretendido (checar contra motivos de erro relatados — Cap. 20).
- [ ] **Consequencial** — nenhum distrator ensina conduta insegura; a dificuldade não classifica erroneamente.

**Regra de alinhamento (DEVE passar toda):** a decisão do enunciado é a do OP; a competência exercida é a primária do OP; o nível cognitivo corresponde; o dado decisivo é o conceito central; a correta é correta **pelo motivo que o OP ensina** (Model §8.5).

**Regra de deriva de objetivo:** se o traço discriminante não é o conceito do OP, ou a questão é respondível sem engajar o conceito, ou exige conceito não pré-requisitado → a questão **mede outro OP** → **redirecionar ou reescrever** (Model §8.6; Cap. 17/19).

## 11. Confiabilidade editorial na prática

- Toda questão nova ou reescrita **DEVERIA** passar por **dupla classificação cega** de OP/competência/Bloom/dificuldade.
- Discordância de OP **DEVE** ser reconciliada pela definição do OP como árbitro (ou terceiro revisor).
- Discordância recorrente de competência **DEVE** disparar revisão do **texto do OP**, não votação.
- Para reduzir subjetividade (Model §9.4), o processo **DEVE**: usar vocabulário controlado **[Pendência]**, rubricas-âncora *[Anexo C]*, classificar-pelo-OP-primeiro, IA propõe / humano adjudica, desempate documentado.

## 12. Revisar explicações

A explicação **DEVE** seguir o modelo:
1. **Conclusão primeiro** (a alternativa correta e a decisão).
2. **Raciocínio** ligado aos dados decisivos do caso.
3. **Distratores** — por que cada erro relevante é errado.
4. **Aplicação prática** — o que fazer/monitorar/evitar.
5. **Evidência** — guideline/estudo, população e ressalva.

**Regras:**
- **NÃO DEVE** introduzir afirmação nova sem fonte.
- **NÃO DEVE** repetir o enunciado nem virar revisão enciclopédica.
- **DEVE** referenciar o conteúdo da alternativa; se citar a letra, respeitar a restrição de posição (Cap. 5).
- A explicação **NÃO DEVE** contradizer o gabarito (reprovação automática — Cap. 17).

## 13. Revisar referências

- Cada questão **DEVE** ter 1–4 referências, todas com `id` existente em `refs.js` — **sem refs órfãs** (Model §15).
- Cada referência **DEVE** sustentar o gabarito; refs fora de tema **DEVEM** ser removidas.
- A hierarquia **DEVERIA** ser: diretriz específica vigente > RCT pivotal > metanálise > coorte > revisão > livro-texto.
- A referência **DEVE** estar vigente; se a diretriz virou, marcar `revisar_até` e checar desatualização (Cap. 17).

**Checklist de referências:**
- [ ] Todas com `id` válido, nenhuma órfã.
- [ ] Cada uma sustenta o gabarito.
- [ ] Nível de evidência adequado à afirmação.
- [ ] Vigência conferida.

## 14. Detectar ambiguidade

A questão **DEVE** ser submetida a esta bateria; qualquer positivo = corrigir antes de aprovar:
- **Duas respostas defensáveis** — mais de uma alternativa correta sob interpretação razoável.
- **Dado decisivo ausente** — falta informação que muda a conduta.
- **Dependência de protocolo local** não informado no enunciado.
- **Meia-resposta** — pergunta pede “dx **e** conduta”, mas a correta só dá o dx.

> Uma questão com **duas respostas defensáveis NÃO DEVE** ser mantida (reprovação automática — Cap. 17).

## 15. Detectar duplicidade

**Teste das quatro dimensões (Model §10.3, §20):** duas questões são **duplicatas** somente se coincidirem em **todas**: mesma **decisão** + mesma **estrutura de dados** do caso + mesmo **perfil-alvo** + mesma **língua**.

- Se variam em **qualquer** dimensão útil (caso, perfil, ângulo cognitivo, língua) → **variação legítima**, mantêm-se.
- Se coincidem nas quatro → **duplicata** → **fundir** (manter a melhor) **ou redirecionar** uma para OP distinto (Cap. 19).

## 16. Advogado do Recurso *(etapa obrigatória)*

Antes de qualquer aprovação, a questão **DEVE** passar pela etapa **Advogado do Recurso**: um papel adversarial (humano ou IA) cuja função é **tentar anular a questão**. Ele assume a má-fé produtiva de um candidato que quer derrubar o item numa banca.

**O Advogado DEVE procurar ativamente:**
- **Ambiguidade** — leitura alternativa legítima do enunciado.
- **Duas respostas possíveis** — segunda alternativa defensável.
- **Comando mal escrito** — pergunta que não delimita o que se pede.
- **Dado ausente** — informação decisiva que falta.
- **Excesso de interpretação** — a correta exige assumir algo não dito.
- **Referência fraca** — a fonte não sustenta o gabarito, ou é inferior à disponível.
- **Alternativa parcialmente correta** — distrator defensável sob certa ótica.
- **Inconsistência** entre enunciado, gabarito e explicação.
- **Pegadinha injusta** — diferença de correção baseada em palavra capciosa sem valor clínico.

**Regra do recurso (DEVE):** se o Advogado do Recurso constrói **um argumento plausível de anulação**, a questão **NÃO PODE ser aprovada sem correção** — independentemente do NQ Editorial Score. O achado **DEVE** ser registrado e endereçado (correção → nova avaliação) antes de qualquer aprovação.

**Saída da etapa:** *nenhum argumento plausível* (segue para decisão) **ou** *argumento(s) plausível(is)* (lista objetiva → correção obrigatória).

---

# Parte V — Decisão

## 17. Critérios de reprovação automática *(eliminatórios)*

As situações abaixo **DEVEM** reprovar a questão **automaticamente, independentemente da nota** do NQ Editorial Score. Cada uma é um **critério eliminatório**:

1. **Mais de uma resposta defensável.**
2. **A referência não sustenta o gabarito.**
3. **A questão mede outro OP** (deriva de objetivo).
4. **Conduta insegura** premiada ou ensinada como aceitável.
5. **Distrator absurdo.**
6. **Trivia sem consequência clínica.**
7. **A explicação contradiz o gabarito.**
8. **Dado decisivo ausente.**
9. **Dependência de protocolo local não informado.**
10. **Desatualização científica relevante** (diretriz/recomendação superada).

> **Regra eliminatória.** Qualquer item acima disparado **anula o score**: a questão **NÃO DEVE** receber “aprovada” nem “aprovada com pequenos ajustes”. Ela é roteada na árvore (Cap. 19) para **reescrever, reprovar, redirecionar ou aposentar**, conforme a causa.

## 18. NQ Editorial Score

O NQ Editorial Score é a rubrica de pontuação da questão. Ele tem **duas camadas**: um **gate eliminatório** e uma **pontuação**. É utilizável por humano e por IA.

### 18.1 Camada 1 — Gate eliminatório
Antes de pontuar, verificar os **10 critérios de reprovação automática** (Cap. 17) **e** o resultado do **Advogado do Recurso** (Cap. 16).
- Se **algum eliminatório** dispara → **score anulado** → ir à árvore (Cap. 19) pela porta correspondente.
- Se o **Advogado** encontrou argumento plausível → **não aprovar sem correção** (teto de veredito = “revisão maior”, ou “pequenos ajustes” se a correção for trivial).

### 18.2 Camada 2 — Critérios pontuáveis
Dez dimensões, cada uma de **0 a 2** (0 = falha; 1 = parcial; 2 = pleno). Total **0–20**.

| # | Dimensão | 0 | 1 | 2 |
|---|---|---|---|---|
| 1 | **Alinhamento ao OP** | mede outro objetivo | alinhamento parcial | mede exatamente o OP |
| 2 | **Validade de conteúdo** | erro/desatualização | correto mas frágil | correto e vigente |
| 3 | **Validade de construto** | trivia/atalho | altitude imprecisa | altitude correta |
| 4 | **Qualidade do enunciado** | incompleto/decorativo | aceitável | realista e suficiente |
| 5 | **Alternativas** | ambíguas/desbalanceadas | aceitáveis | paralelas, resposta única |
| 6 | **Distratores** | absurdos/genéricos | plausíveis | erros clínicos nomeados |
| 7 | **Explicação** | contradiz/ausente | correta mas rasa | conclui, discrimina, adverte |
| 8 | **Referências** | órfã/não sustenta | sustenta parcialmente | sustenta e vigente |
| 9 | **Ausência de “cara de IA”** | vários *tells* | um *tell* | natural, clínica real |
| 10 | **Valor pedagógico** | nenhum | marginal | ensina decisão relevante |

### 18.3 Faixas → banda de veredito (na ausência de eliminatório)

| Score | Banda | Veredito-base |
|---|---|---|
| **18–20** | Excelente | **Aprovada** |
| **15–17** | Boa com reparos | **Aprovada com pequenos ajustes** |
| **10–14** | Recuperável | **Revisão maior** |
| **≤ 9** | Insuficiente | **Reprovada** (reconstrução) |

**Overrides obrigatórios sobre a banda:**
- **Advogado do Recurso** com argumento plausível → rebaixar para, no mínimo, “pequenos ajustes” (se trivial) ou “revisão maior”.
- **Duplicata** (Cap. 15) → verdicto **Fundir** ou **Redirecionar**, mesmo com score alto.
- **Deriva de objetivo** (Cap. 10) → **Redirecionar** (ou Reescrever).
- **Desatualização** (Cap. 17 §10) → **Aposentar** ou **Revisão maior**.

## 18.4 Status de evidência, pendência e autorização de publicação

Esta seção define **três eixos separados**, cada um obrigatório e cada um com valor único por versão exata do item. Nenhum eixo substitui os outros; nenhum campo mistura valores de eixos diferentes.

**Eixo 1 — Status da evidência** (Model §3.6, *status de verificação da evidência*): **VERIFICADA** · **PARCIALMENTE VERIFICADA** · **NÃO VERIFICADA**. Definições no Model §3.6 e no protocolo operacional de verificação de cada skill.

**Eixo 2 — Natureza da pendência**: **NENHUMA** · **NÃO DECISIVA** · **DECISIVA**.
- **Nenhuma** — não há pendência aberta. Único valor válido quando o Eixo 1 for **VERIFICADA**.
- **Decisiva** — se resolvida no sentido oposto ao assumido, pode mudar qual alternativa é a correta, comprometer a segurança da conduta ensinada, ou invalidar o item. Só é valor válido quando o Eixo 1 for **PARCIALMENTE VERIFICADA**.
- **Não decisiva** — afeta apenas detalhe secundário (rótulo, precisão terminológica, vínculo exato de versão de uma fonte) sem capacidade de mudar o gabarito ou a segurança. Só é valor válido quando o Eixo 1 for **PARCIALMENTE VERIFICADA**.

**Compatibilidade obrigatória entre Eixo 1 e Eixo 2 (DEVE):**

| Eixo 1 (status de evidência) | Valor(es) válido(s) do Eixo 2 |
|---|---|
| **VERIFICADA** | **NENHUMA** (único valor válido) |
| **PARCIALMENTE VERIFICADA** | **NÃO DECISIVA** ou **DECISIVA** — **NUNCA** NENHUMA |
| **NÃO VERIFICADA** | Não aplicável — a natureza da pendência é irrelevante para o resultado, pois a publicação **DEVE** ficar BLOQUEADA de qualquer forma (Regra 7) |

Qualquer outra combinação (ex.: PARCIALMENTE VERIFICADA + NENHUMA) é **inválida** — ver Regra de consistência (item 6).

**Eixo 3 — Autorização de publicação**: **LIBERADA** · **BLOQUEADA**. Campo **derivado** (Regra 10 abaixo) — **NÃO PODE** ser atribuído livremente em prosa nem ser confundido com o veredito editorial ou com o status de evidência.

**Regras obrigatórias:**

1. **Um único status de evidência por versão exata do item (DEVE).** Não podem coexistir dois valores do Eixo 1 para a mesma versão de um item.
2. **Reavaliação obrigatória por mudança material (DEVE).** Qualquer mudança material em enunciado, alternativas, gabarito, explicação ou referências **DEVE** disparar reavaliação do status de evidência — o status da versão anterior **NÃO DEVE** ser herdado silenciosamente pela versão nova.
3. **Pendência decisiva (definição, ver Eixo 2).**
4. **Pendência não decisiva (definição, ver Eixo 2).**
5. **Teto do veredito por evidência (DEVE — override adicional sobre §18.3):**
   - Status **NÃO VERIFICADA** → o veredito **NÃO PODE** ser "aprovada" nem "aprovada com pequenos ajustes", independentemente do NQ Editorial Score **e independentemente de qualquer valor atribuído ao Eixo 2** (a natureza da pendência não se aplica quando a evidência não foi verificada — ver tabela de compatibilidade acima).
   - Status **PARCIALMENTE VERIFICADA** com pendência **DECISIVA** → mesma restrição do item acima.
   - Em ambos os casos, o teto do veredito é **revisão maior** (ou banda inferior, se eliminatório ou Advogado do Recurso também se aplicarem).
6. **Regra de consistência entre eixos (DEVE).** Uma combinação entre Eixo 1 e Eixo 2 que viole a tabela de compatibilidade acima (ex.: PARCIALMENTE VERIFICADA + NENHUMA) é **inválida por construção** — não corresponde a nenhum estado real de verificação. Um item registrado com combinação inválida **DEVE** permanecer com autorização de publicação **BLOQUEADA** até que os campos de Eixo 1 e Eixo 2 sejam corrigidos para uma combinação válida da tabela; **NÃO DEVE** ser tratado como caso omisso nem receber LIBERADA por padrão.
7. **Autorização de publicação (DEVE — derivada, nunca livre):**
   - **BLOQUEADA** quando: (a) evidência NÃO VERIFICADA (independentemente da natureza da pendência); **ou** (b) evidência PARCIALMENTE VERIFICADA com pendência DECISIVA; **ou** (c) o veredito editorial não é de aprovação (aprovada ou aprovada com pequenos ajustes); **ou** (d) a combinação de Eixo 1 e Eixo 2 é inválida pela Regra 6.
   - **LIBERADA** somente quando: (a) evidência VERIFICADA (com pendência NENHUMA) **e** veredito de aprovação; **ou** (b) evidência PARCIALMENTE VERIFICADA com pendência NÃO DECISIVA **e** veredito de aprovação.
   - Toda combinação **válida** dos três eixos **DEVE** produzir exatamente um dos dois resultados acima — nunca ambos, nunca nenhum.
8. **Campo de autorização contém somente LIBERADA ou BLOQUEADA (DEVE).** Não misturar, no mesmo campo, valores do Eixo 1 (status de evidência) ou do Eixo 2 (natureza da pendência).
9. **Proibição de sinônimos informais (NÃO DEVE).** Expressões como "estruturalmente pronta", "pronta para copiar" ou equivalentes **NÃO SÃO** sinônimos de veredito de aprovação nem de autorização de publicação liberada — descrevem completude de forma, não completude de evidência nem decisão editorial.
10. **Autorização de publicação é sempre derivada (DEVE).** Nunca é atribuída livremente; é sempre calculada a partir dos Eixos 1 e 2 e do veredito editorial, pela Regra 7.
11. **Transição de ciclo de vida (DEVE).** A transição do `status` de ciclo de vida (Model §3.6) para `publicado` **NÃO DEVE** ocorrer enquanto a autorização de publicação estiver BLOQUEADA.

## 18.5 Identidade do `qid` e estado de repetição espaçada (FSRS)

O `qid` identifica a **identidade pedagógica estável** do item — objetivo pedagógico, competência e conceito correto correspondente ao gabarito — e **não** os bytes da redação. Mudança material de texto **não exige, por si só**, um novo `qid`.

**Preservar o `qid`** quando permanecerem: objetivo pedagógico; competência; conceito correto; e identidade reconhecível do item. Podem mudar **sem** novo `qid`: redação do enunciado; distratores; referências; explicação; atualização científica; e a posição da alternativa correta.

**Criar novo `qid`** quando mudar: o objetivo pedagógico; a competência avaliada; o raciocínio central exigido; o conceito correto; ou a identidade do item (deixa de ser reconhecível como a mesma questão).

**Preservar o `qid` NÃO isenta o item da reavaliação obrigatória do §18.4 (DEVE).** Qualquer mudança material — inclusive em referências, explicação ou conteúdo científico — **DEVE** disparar nova avaliação dos eixos de evidência e pendência (§18.4, Regra 2) e **NÃO PODE** herdar silenciosamente a autorização de publicação da versão anterior. A preservação do `qid` diz respeito somente à identidade pedagógica e ao estado FSRS; a autorização de publicação (LIBERADA/BLOQUEADA) é sempre **derivada** da nova avaliação (§18.4, Regra 7).

**Reset de FSRS (repetição espaçada)** é **excepcional e deliberado**, nunca automático para toda reconstrução editorial. Reservado a casos em que: a versão anterior ensinava conceito clinicamente incorreto; preservar a maestria anterior causaria aprendizagem inválida; ou há decisão editorial explícita de tratar o conteúdo como novo.

**Nota técnica.** O agendamento de repetição espaçada (FSRS-4.5) e o progresso salvo são indexados por `qid` (`data[qid]` em `js/utils.js`). Reusar o `qid` após corrigir/atualizar o mesmo item preserva, por construção, o agendamento e a maestria — comportamento **intencional** quando a identidade pedagógica é mantida. Ferramentas de revisão automática podem sinalizar o reuso de `qid`; a resposta canônica é esta seção, e a decisão é editorial/de produto, não um defeito.

## 19. Árvore de decisão editorial

Aplicar **em ordem**; a primeira condição verdadeira determina o veredito e o `status` do ciclo de vida (Model §3.6).

```
0. Status de evidência permite avaliar normalmente? (§18.4)
   ├── NÃO VERIFICADA, ou PARCIALMENTE VERIFICADA com
   │   pendência DECISIVA .......................... → teto: no máximo
   │                                                    REVISÃO MAIOR;
   │                                                    autorização de
   │                                                    publicação = BLOQUEADA
   │                                                    (§18.4 Regra 7);
   │                                                    segue avaliando os
   │                                                    achados normalmente,
   │                                                    mas o veredito final
   │                                                    não pode ultrapassar
   │                                                    esse teto
   ├── Combinação Eixo 1 × Eixo 2 inválida
   │   (§18.4 Regra 6, ex.: PARCIALMENTE VERIFICADA
   │   + NENHUMA) .................................. → autorização de
   │                                                    publicação = BLOQUEADA
   │                                                    até correção dos
   │                                                    campos; não avança
   │                                                    na árvore até a
   │                                                    combinação ser válida
   └── (VERIFICADA com pendência NENHUMA, ou
        PARCIALMENTE VERIFICADA com pendência
        NÃO DECISIVA) .................................. continua ↓

1. Existe eliminatório (Cap.17)?
   ├── Mede outro OP ............................. → REDIRECIONAR (→ em_revisão no OP correto)
   ├── Desatualização relevante ................. → APOSENTAR (se insubstituível) ou REVISÃO MAIOR
   ├── Duplicata (4 dimensões, Cap.15) .......... → FUNDIR (manter a melhor) ou REDIRECIONAR
   ├── Conduta insegura / >1 resposta / ref não
   │   sustenta / distrator absurdo / explicação
   │   contradiz / dado decisivo ausente / trivia
   │   / dependência de protocolo ............... → REESCREVER (recuperável) ou REPROVAR (irrecuperável)
   └── (nenhum eliminatório) ....................... continua ↓

2. Advogado do Recurso achou argumento plausível (Cap.16)?
   ├── Sim, trivial ............................. → APROVADA COM PEQUENOS AJUSTES
   └── Sim, substantivo ......................... → REVISÃO MAIOR
       (não, continua ↓)

3. NQ Editorial Score (Cap.18):
   ├── 18–20 ..................................... → APROVADA
   ├── 15–17 ..................................... → APROVADA COM PEQUENOS AJUSTES
   ├── 10–14 ..................................... → REVISÃO MAIOR
   └── ≤ 9 ....................................... → REPROVADA
```

**Definições dos verdictos:**
- **Aprovada** → `status: publicado`.
- **Aprovada com pequenos ajustes** → correção pontual e nova checagem rápida → `publicado`.
- **Revisão maior** → volta ao autor/revisor → `em_revisão`.
- **Reprovada** → não entra (nova) ou sai (existente) → `aposentado` ou reconstrução do zero.
- **Fundir** → consolidar em uma questão do mesmo OP; a outra → `aposentado`.
- **Redirecionar** → vincular a questão ao OP que ela de fato mede → `em_revisão`.
- **Aposentar** → retirar por desatualização/irrelevância → `aposentado`.

**Autorização de publicação:** derivada do status de evidência e da natureza da pendência (§18.4, Regra 7) — **LIBERADA** ou **BLOQUEADA**, nunca atribuída livremente; combinação inválida entre os dois eixos também resulta em BLOQUEADA até correção (§18.4 Regra 6). A transição para `status: publicado` acima **NÃO DEVE** ocorrer enquanto a autorização estiver BLOQUEADA (§18.4 Regra 11).

---

# Parte VI — Pós-publicação

## 20. Como usar sinais pós-publicação

Sinais de produção (Model §3.5) **DEVEM** ser lidos como **gatilhos editoriais**, nunca como veredito automático. Reclassificação e correção permanecem **decisão editorial manual** (Model §7).

| Sinal | Fonte | Interpretação | Ação editorial |
|---|---|---|---|
| **Rating de qualidade** baixo | `question_ratings` | usuários percebem defeito | reavaliar (Cap. 10–16) |
| **Aprendizado percebido** baixo | `question_ratings` | mede, mas não ensina | revisar explicação/valor (Cap. 12) |
| **Votos de dificuldade** divergentes (≥5) | `question_difficulty_votes` | percebida ≠ intrínseca | reclassificar dificuldade (Cap. 9) |
| **Motivos de erro** relatados ≠ armadilha projetada | `question_error_reasons` | falha de validade de resposta | reavaliar construto/resposta (Cap. 10) |
| **Flag** | `send-flag` (e-mail) | possível defeito | **gatilho manual** → `em_reparo` → reavaliar |

> **Ressalva das flags.** As flags chegam hoje por **e-mail** e **não** são um dado consultável (Model §3.5, §15). O Handbook **DEVE** tratá-las como gatilho manual de entrada em `em_reparo`; **NÃO DEVE** construir métrica automática sobre elas até que virem canal estruturado.

**Regra do sinal editorial nº 1:** divergência entre dificuldade **intrínseca** e **empírica** (Model §7) **DEVERIA** disparar reavaliação do item ou do dimensionamento do OP.

---

# Parte VII — Escala

## 21. Questões em português, inglês e espanhol

- A tradução **DEVE** ser tratada como **re-editorialização**, não localização de string (Model §13).
- O **OP e o `loid` são language-neutral**; taxonomia, competência, Bloom, conceito e relações **NÃO se traduzem** — são a identidade.
- **Language-bound** é só a renderização: enunciado, alternativas, explicação e a prosa dos cards de referência.
- A tradução **PODE** exigir **ajuste de gabarito** por divergência regional de conduta/terminologia; nesse caso **DEVE** passar novamente por toda a Parte IV.
- Cada tradução **DEVE** ter `status`/revisor próprios e **DEVERIA** ser revista por especialista fluente na língua-alvo.

## 22. Regras universais × regras específicas da nefrologia

- **Núcleo universal** (Model §14): entidades e relações; governança; modelo de dificuldade; validade/confiabilidade/cobertura/existência; Bloom/Miller; regras científicas invioláveis; **e todo este Handbook (Cap. 1–23)**.
- **Módulo de nefrologia** *[Anexo C]*: subárvore taxonômica; vocabulário de conceitos; catálogo de erros clássicos; checklist de segurança; base de diretrizes.
- **Regra de reuso:** ao adicionar uma nova especialidade, o corpo universal **NÃO DEVE** ser reescrito; cria-se um novo módulo análogo ao Anexo C.

---

# Parte VIII — Operação por IA

## 23. Uso pelas skills `criar-nefroquest` e `revisar-nefroquest` *(princípios)*

*(Este capítulo descreve princípios; a especificação detalhada e qualquer alteração das skills ficam para etapa futura — nada aqui altera as skills.)*

- Este Handbook **DEVERIA** ser a **fonte única** de regra editorial que ambas as skills passam a referenciar, evitando duplicar regra entre skills.
- **Divisão de trabalho:** `criar-nefroquest` aplica sobretudo **Partes I–III** (existência, autoria, classificação); `revisar-nefroquest` aplica sobretudo **Partes III–VI** (classificação, avaliação, advogado do recurso, score, decisão, sinais).
- **Advogado do Recurso e NQ Editorial Score** **DEVERIAM** ser etapas explícitas do fluxo de revisão da IA, com saída estruturada (achados + banda + veredito).
- **O que permanece na skill:** roteamento, contrato de saída, formato dos cards. **O que passa a viver no Handbook:** a regra editorial em si.
- **Sincronia:** quando uma regra mudar, ela **DEVE** mudar no Handbook (fonte), e as skills **DEVERIAM** apenas apontar para ele — não copiar.

---

# Anexos

## Anexo A — Checklists consolidados (uma página)

- **Criar:** existência (Cap. 3) → enunciado (Cap. 4) → alternativas (Cap. 5) → distratores (Cap. 6) → anti-IA (Cap. 7) → classificar OP/Bloom/dificuldade (Cap. 2, 8, 9).
- **Revisar:** validade (Cap. 10) → confiabilidade (Cap. 11) → explicação (Cap. 12) → referências (Cap. 13) → ambiguidade (Cap. 14) → duplicidade (Cap. 15) → **Advogado do Recurso (Cap. 16)**.
- **Decidir:** eliminatórios (Cap. 17) → NQ Editorial Score (Cap. 18) → árvore de decisão (Cap. 19).

## Anexo B — Catálogo “cara de IA”

Lista viva de *tells* e correções (Cap. 7): simetria artificial; hedging; distratores genéricos; precisão falsa; enunciado enciclopédico; uniformidade de comprimento; tradução literal; explicação que reafirma o enunciado; distrator “oposto do gabarito”; números redondos suspeitos. **[A expandir com exemplos reais na próxima iteração.]**

## Anexo C — Rubricas-âncora e módulo de nefrologia *[Módulo: Nefrologia]*

Concentra o conteúdo específico de nefrologia (mantendo o corpo universal limpo):
- **Rubricas-âncora de Bloom/Miller** com exemplos de nefrologia.
- **Rubricas-âncora de dificuldade intrínseca** (o que faz uma questão de nefrologia ser básica/intermediária/avançada).
- **Catálogo de erros clínicos clássicos** de nefrologia (fonte de distratores) — ex.: diálise indicada por creatinina isolada; tratar HIVAN sem TARV; confundir indução e manutenção; aplicar mecanismo *underfill* fora do cenário.
- **Checklist de segurança** por subárea (LRA, DRC, diálise, transplante, glomerulopatias, eletrólitos, ácido-base…).
- **Base de diretrizes** de referência (`id`s de `refs.js`).
> *Fonte natural:* consolidar aqui o material já existente nas skills `criar-nefroquest`/`revisar-nefroquest` (sem alterá-las nesta etapa).

## Anexo D — Vocabulários controlados *(pendência)*

**[Pendência herdada do Model §9.4]** — listas fechadas de **competência** (após decidir EPA vs CanMEDS), **conceito central** e **erro clínico clássico** de nefrologia. Não preenchido no v1; referenciado pelos Cap. 6, 8, 11.

## Anexo E — Exemplos trabalhados

- **E.1 — Criação do zero:** um OP de nefrologia percorrido do portão de existência (Cap. 3) até a questão pronta (Cap. 4–9). *[A preencher com exemplo real — reaproveitar §19–20 do Model.]*
- **E.2 — Veredito de revisão completo:** uma questão passando por validade → ambiguidade → duplicidade → Advogado do Recurso → eliminatórios → NQ Editorial Score → árvore de decisão, terminando num veredito. *[A preencher.]*

---

*Fim do rascunho v1.2 — para revisão humana. Mudanças desde a v1.1: §18.4 ganhou a tabela de compatibilidade obrigatória entre Eixo 1 (status de evidência) e Eixo 2 (natureza da pendência) e a nova Regra 6 (consistência entre eixos), eliminando a combinação antes indefinida PARCIALMENTE VERIFICADA + NENHUMA — toda combinação inválida agora resulta em autorização de publicação BLOQUEADA até correção dos campos, e toda combinação válida produz exatamente LIBERADA ou BLOQUEADA; Cap. 19 (passo 0) e a linha de autorização nas definições de veredito foram ajustados para refletir a nova regra e a renumeração das regras subsequentes de §18.4. Mudanças desde a v1.0: novo §18.4 (Status de evidência, pendência e autorização de publicação) formaliza os três eixos — status de evidência (Model §3.6), natureza da pendência e autorização de publicação (derivada) — como regra canônica única, substituindo julgamento caso a caso; Cap. 19 ganhou o passo 0 (teto por evidência/pendência) e a linha de autorização de publicação nas definições de veredito. O Handbook traduz o NQ Knowledge Model v1 em regras operacionais e adiciona quatro mecanismos de portão: o **Advogado do Recurso** (Cap. 16), os **Critérios de reprovação automática** (Cap. 17), o **NQ Editorial Score** (Cap. 18) e o **status de evidência/autorização de publicação** (§18.4), integrados pela **árvore de decisão** (Cap. 19). Pendências abertas: vocabulários controlados (Anexo D), preenchimento dos Anexos B/C/E, e as decisões herdadas do Model (EPA vs CanMEDS; granularidade fina do OP).*
