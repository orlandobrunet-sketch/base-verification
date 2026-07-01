# NQ Knowledge Model v1

> **Versão:** 1.1 — rascunho para revisão humana
> **Status:** proposta conceitual (não é especificação de implementação)
> **Data:** 2026-06-30
> **Escopo:** como o conhecimento médico é organizado no NefroQuest *antes* de virar questão.
> **Público-alvo:** autores e revisores médicos; agentes de IA de criação/revisão; arquitetura de produto.
> **O que este documento NÃO é:** não contém código, schema executável, migrations nem plano de implementação.
> **Como ler:** as seções 1–7 definem o modelo; 8–11 definem os critérios de qualidade editorial (validade, confiabilidade, cobertura, existência); 12 é a ficha operacional; 13–14 tratam de multilíngue e multiespecialidade; 15–17 conectam à arquitetura atual; 18 é o glossário; 19–20 são exemplos.
> **Convenção de uso por IA e por humano:** onde houver **“Regra”** ou **checklist**, trata-se de critério executável — deve produzir o mesmo veredito independentemente de quem aplica.

---

## 1. Visão geral

O NQ Knowledge Model é a camada conceitual que define **como o conhecimento é estruturado no NefroQuest antes de existir uma questão**. Ele reorganiza o produto em torno de uma inversão fundamental:

> **Hoje o sistema é questão-cêntrico.** A questão é a unidade; dificuldade, categoria e referência são atributos dela; competência é *inferida depois* por palavra-chave.
>
> **O NQ Knowledge Model é objetivo-cêntrico.** A unidade central é o **Objetivo Pedagógico (OP)**: uma capacidade clínica testável. A questão deixa de ser a origem e vira **uma instância derivada** de um OP.

O modelo é adotado como **camada de sobreposição (overlay)**, sob um princípio único de compatibilidade:

> **Logicamente objetivo-cêntrico, fisicamente questão-ancorado.**
> O OP é o centro *conceitual*; o `qid` (identificador estável da questão) continua o centro *físico* e a chave de junção do sistema. O OP anota questões existentes — não move o conteúdo delas.

Isso permite evoluir **sem migração big-bang**: o overlay cresce questão a questão, e o sistema é válido com qualquer fração das questões já mapeadas a objetivos.

---

## 2. Por que o NefroQuest deve ser centrado em objetivos pedagógicos, não em questões

A arquitetura atual entregou um produto funcional, mas o modelo questão-cêntrico impõe limites estruturais:

1. **A intenção pedagógica não existe como dado** — sabe-se *que* uma questão foi feita, não *para ensinar o quê*.
2. **Não há como medir cobertura** — sem objetivos declarados, não se responde "quais competências o banco cobre e quais faltam".
3. **Duplicatas são invisíveis** — só descobertas por leitura manual.
4. **Dificuldade é um eixo único e sobrecarregado** — mistura "difícil de escrever", "difícil para quem" e "difícil na prática".
5. **Internacionalização vira duplicação** — sem identidade acima do texto, traduzir é clonar.
6. **A revisão não tem alvo estável** — conserta-se uma questão, não o conceito que ela ensina.

O modelo objetivo-cêntrico corrige a raiz: **declara a intenção antes do artefato**. Metadado migra da questão para o objetivo e é herdado; cobertura torna-se mensurável; dificuldade se decompõe; tradução vira re-renderização; e a revisão ganha uma unidade estável para agregar evidência e sinais.

---

## 3. Definição formal de cada entidade do modelo

As entidades organizam-se em seis famílias.

### 3.1 Família taxonômica (o "onde")

- **Especialidade** — Raiz da árvore (ex.: *Nefrologia*). Prepara multiespecialidade.
- **Subespecialidade** — Grande eixo temático (ex.: *Glomerulopatias*). ~nível do `cat` atual.
- **Domínio** — Recorte intermediário coerente (ex.: *Glomerulopatias mediadas por complemento*).
- **Tópico** — Entidade clínica nomeável, "capítulo" (ex.: *Nefrite lúpica*). Último nível de *lugar*.

### 3.2 Família pedagógica (o "quê" e o "porquê")

- **Objetivo Pedagógico (OP)** — *Unidade central.* Capacidade clínica testável com verbo: *"ser capaz de [verbo] [conceito] em [cenário], evitando [erro]."* *Identidade:* `loid` (espaço separado do `qid`). *Granularidade:* **um OP = uma decisão ou interpretação testável.**
- **Competência clínica** — Classe de habilidade (diagnóstico, conduta, interpretação, estratificação, mecanismo). Ancorada em framework estabelecido (EPA/CanMEDS).
- **Nível cognitivo** — Altitude do raciocínio (Bloom; Miller para o clínico). Tratado como **sinal de qualidade** (não residir só em "Lembrar").
- **Conceito central** — Mecanismo/princípio reutilizável, **transversal à taxonomia** (ex.: *via alternativa do complemento*).
- **Erro clínico clássico** — Equívoco do mundo real que o OP previne; **fonte editorial dos distratores**.
- **Armadilha cognitiva projetada** — Viés que o item *deliberadamente* testa (design). **Distinta** da razão relatada (§3.5).
- **Caso clínico** — Vinheta (cenário, dados, evolução) que dá concretude ao OP.

### 3.3 Família de artefato (o "com quê")

- **Questão** — Instância que exercita e mede um OP (enunciado, 4 alternativas A–D, gabarito único, explicação). *Identidade:* `qid` — **estável e intocável**; ganha vínculo `loid`.
- **Referência** — Card de evidência (reutiliza `id` de `refs.js`).

### 3.4 Família de alvo e medida

- **Perfil do usuário-alvo** — Estudante · R1–R2 · R3+/nefrologia · Especialista.
- As **cinco dificuldades** e a **habilidade (θ)** — §7.

### 3.5 Família de telemetria (o "que se observa")

- **Razão de erro relatada** — Motivo que o *usuário* nomeia ao errar (PED-1). **Distinta** da armadilha projetada.
- **Avaliação do usuário** — Qualidade e aprendizado (`question_ratings`).
- **Voto de dificuldade** — Percepção da multidão (`question_difficulty_votes`).
- **Sinalização (flag)** — Reporte de problema (hoje por e-mail); **gatilho manual** de ciclo de vida.

### 3.6 Família de governança (o "estado editorial")

- **Status / ciclo de vida** — rascunho → em_revisão → publicado → em_reparo → aposentado.
- **Versão** — independente do *spec do OP*, da *renderização da questão* e da *calibração*.
- **Grau de evidência** — diretriz forte · practice-point · RCT pivotal · coorte · revisão.
- **Validade temporal** — `revisar_até`, dispara re-revisão (ex.: virada de diretriz).
- **Autoria e auditoria** — quem criou/revisou e o que mudou.

---

## 4. Relação entre as entidades

| Relação | Cardinalidade | Observação |
|---|---|---|
| Especialidade → … → Tópico | 1 : N (cada nível) | hierarquia estrita |
| Tópico → OP | 1 : N | OP filho de um Tópico |
| OP → Questão | 1 : N | questão mantém `qid`, ganha `loid` |
| OP → OP | N : N (DAG) | **pré-requisitos** |
| OP → Competência / Nível cognitivo | N : 1 | uma primária |
| OP → Conceito central | N : N | ligação horizontal |
| OP → Erro clínico clássico | 1 : N | fonte dos distratores |
| OP → Armadilha projetada | N : N | ≠ razão relatada |
| OP / Questão → Referência | N : N | herança OP → Questão |
| OP → Caso → Questão | 1 : N : N | caso intermedia cenário e pergunta |
| OP / Questão → Localização | 1 : N | identidade × renderização |
| Questão → telemetria | 1 : N | keyada por `qid` |

```
[Governança & Ciclo de Vida] ── transversal a OP e Questão

Especialidade → Subespecialidade → Domínio → Tópico
                                              └── ◆ OBJETIVO PEDAGÓGICO (loid) ◆
   OP ─(pré-requisito)→ OP
   OP → Competência (EPA/CanMEDS)   OP → Nível cognitivo (Bloom/Miller)
   OP → Conceito central (transversal)
   OP → Erro clínico clássico → tipologia de distrator
   OP → Armadilha projetada     ⟂   Razão de erro relatada (PED-1)
   OP → Referência (ids de refs.js)
   OP → Caso clínico → Questão (qid) → sinais (ratings, votos, erros, flags)

Pessoa: θ por subespecialidade    Maestria por OP = agregação das questões-filhas
```

---

## 5. Modelo hierárquico

**Especialidade → Subespecialidade → Domínio → Tópico → Objetivo Pedagógico → Questões.**

Os quatro primeiros níveis respondem *onde* na medicina; do OP em diante, *o que* se ensina e *com que* se mede.

Exemplo de cadeia: *Nefrologia → Glomerulopatias → Glomerulopatias secundárias → Nefrite lúpica → "Selecionar a terapia de manutenção da nefrite lúpica proliferativa" → questões.*

**Regra de fronteira:** reaparece em subespecialidades diferentes → **Conceito central**; é onde o aluno "abre o capítulo" → **Tópico**; tem verbo e gabarito → **Objetivo**.

---

## 6. Modelo pedagógico

**Objetivo → Competência → Bloom → Erro clínico → Caso → Questão.**

1. **Objetivo** declara a capacidade testável.
2. **Competência** diz a *classe* de habilidade.
3. **Nível cognitivo** diz a *altitude* e sinaliza qualidade (evitar recall puro).
4. **Erro clínico clássico** fornece o *material dos distratores* (cada distrator materializa um erro catalogado).
5. **Caso** dá o cenário concreto.
6. **Questão** é a renderização final, ligada ao OP por `loid` e identificada por `qid`.

A **armadilha projetada** (o que o item testa) e a **razão relatada** (o que o usuário diz ao errar) fecham o ciclo: desenha-se para uma armadilha, e a telemetria revela se os usuários caem por ela.

---

## 7. Modelo de dificuldade

Cinco conceitos **ortogonais**:

1. **Dificuldade editorial intrínseca** — Julgamento *absoluto*, do autor. *Semente:* o `diff` atual. *Prior* da empírica.
2. **Dificuldade cognitiva** — *Decomposição estrutural*: altitude de Bloom/Miller, nº de conceitos integrados, sutileza da distinção. Base de um futuro IRT explanatório.
3. **Dificuldade esperada por perfil** — **Quantidade derivada, não armazenada.** Em IRT, a dificuldade do item (`b`) é *invariante à população*. "Difícil para estudante, fácil para especialista" é o **θ do perfil** que muda; calcula-se como P(acerto|perfil) ≈ f(θ_perfil − `b`).
4. **Dificuldade percebida pelo usuário** — Subjetiva, de `question_difficulty_votes` e `question_ratings`.
5. **Dificuldade empírica / IRT** — Objetiva, no item: `b` (+ `a`, `c` com dados suficientes), sempre com **erro-padrão, nº de exposições e época de calibração** (editar a questão invalida a calibração antiga).

*Conversa entre elas:* `diff` semeia a intrínseca; `_d` (runtime) segue inalterado; percebida vem dos votos; empírica vem da telemetria. **A divergência intrínseca × empírica é o sinal editorial nº 1.** Reclassificação permanece **decisão editorial manual**.

---

## 8. Validade do Objetivo Pedagógico e da Questão

Validade responde a uma pergunta única: **a questão mede realmente o OP declarado?** Ela se decompõe em quatro tipos, mais dois procedimentos de verificação. Todos são critérios executáveis por IA e por humano.

### 8.1 Validade de conteúdo
O conteúdo do item corresponde ao domínio, à competência e ao conceito central do OP, e a ciência está correta e atual.
- **Checklist:** a afirmação-chave é verdadeira e sustentada por referência adequada; a fonte é vigente; os distratores representam erros reais (não absurdos); nenhuma dose/critério/recomendação é fabricado.

### 8.2 Validade de construto
O item mede o *traço latente pretendido* (raciocínio clínico sobre o conceito do OP) — não um traço adjacente (velocidade de leitura, memorização de trivia, habilidade de prova).
- **Sinal de falha:** um OP declarado como "Avaliar/Aplicar" cujo item é respondível por **recall de um número** → construto errado (excesso de facilidade irrelevante ao construto); ou um item que exige um conceito **fora** do OP para ser respondido (dificuldade irrelevante ao construto).

### 8.3 Validade de resposta (processo de resposta)
O caminho pelo qual o usuário chega à resposta corresponde ao raciocínio pretendido.
- **Evidência disponível:** análise das alternativas + telemetria PED-1 (`question_error_reasons`). Se a maioria acerta por **eliminação** ou **chute**, ou erra por um motivo (razão relatada) que não é a armadilha projetada, a validade de resposta é fraca — a questão "funciona" pelo motivo errado.

### 8.4 Validade consequencial
As *consequências* de usar o item são desejáveis.
- **Checklist:** um distrator, se internalizado, não induz conduta insegura; a questão não ensina simplificação perigosa; a dificuldade não classifica erroneamente o aprendiz. (Conecta-se ao checklist de segurança da especialidade.)

### 8.5 Como verificar se a questão mede realmente o OP declarado — *Regra de alinhamento*
Aplicar, em ordem; falha em qualquer ponto = questão desalinhada:
1. A **decisão** cobrada no enunciado é a decisão do OP.
2. A **competência** exercida é a competência primária do OP.
3. O **nível cognitivo** exigido corresponde ao Bloom/Miller do OP.
4. O **dado decisivo** do caso é o conceito central do OP — removê-lo muda a resposta.
5. A alternativa correta é correta **pelo motivo que o OP ensina**, não incidentalmente.

### 8.6 Como detectar quando a questão está correta, mas mede outro objetivo — *Regra de deriva de objetivo*
A questão pode ter gabarito certo e ainda assim medir outra coisa. Sinais:
- O **traço discriminante** entre a correta e os distratores **não é** o conceito central do OP (é outro conceito).
- A questão é respondível **sem engajar** o conceito do OP (facilidade irrelevante) → mede recall, não a competência.
- A questão exige um **conceito não pré-requisitado** pelo OP (dificuldade irrelevante) → mede um segundo objetivo embutido.
- O agrupamento de distratores revela uma **confusão diferente** da armadilha projetada.
- **Ação editorial:** reclassificar a questão para o OP que ela de fato mede, **ou** reescrevê-la para realinhar ao OP declarado — nunca as duas coisas em silêncio.

---

## 9. Confiabilidade editorial

Enquanto validade pergunta "mede o que deveria?", confiabilidade pergunta **"a classificação é reprodutível entre revisores?"**. Sem confiabilidade, os metadados do OP são ruído.

### 9.1 Reprodutibilidade da classificação de OP
- **Teste:** dois revisores independentes, cegos entre si, classificam a mesma questão. Concordam no mesmo `loid`?
- **Meta operacional:** alta concordância; discordância → procedimento de reconciliação (arbitragem por um terceiro ou pela definição do OP como árbitro).

### 9.2 Reprodutibilidade da competência primária
- A competência primária deve ser **única e óbvia** dado o OP. Se dois revisores divergem entre "diagnóstico" e "conduta", o **OP está mal redigido** (mistura duas decisões) — corrige-se o OP, não a votação.

### 9.3 Consistência de Bloom e dificuldade
- Bloom/Miller e dificuldade intrínseca devem cair na **mesma faixa** entre revisores. Divergência sistemática sinaliza vocabulário mal ancorado (ver 9.4).

### 9.4 Como reduzir a subjetividade — *alavancas*
1. **Vocabulários controlados** para competência, Bloom, conceito e erro (listas fechadas, não texto livre).
2. **Rubricas com âncoras**: para cada nível de Bloom e de dificuldade, um exemplo-âncora de nefrologia.
3. **Classificar pelo OP primeiro**; competência, Bloom e conceito são *herdados* do OP — não classificados de novo por questão.
4. **Primeira passada por IA + adjudicação humana**: a IA propõe classificação; o revisor confirma ou corrige; a discordância vira caso de calibração.
5. **Sessões de calibração** periódicas sobre um conjunto-semente comum.
6. **Regra de desempate documentada** (quem decide e com base em quê).

---

## 10. Cobertura editorial do banco

### 10.1 Por que número bruto de questões não significa cobertura
994 questões podem estar concentradas em poucos objetivos. **Contagem mede volume, não amplitude.** Cobertura só é mensurável quando cada questão pertence a um OP e cada OP pertence à taxonomia.

### 10.2 Como medir cobertura
Para cada nível e eixo, a métrica é **presença de OP com ≥1 questão publicada**, não a contagem de questões:
- **Por Especialidade / Subespecialidade / Domínio / Tópico:** proporção de nós com pelo menos um OP coberto.
- **Por OP:** OP tem ≥1 questão publicada e válida?
- **Por Competência:** todas as competências relevantes têm OPs cobertos?
- **Por Bloom/Miller:** o banco cobre as altitudes desejadas, ou está concentrado em recall?
A visualização natural é uma **matriz de calor** (nó taxonômico × competência × Bloom) apontando células vazias.

### 10.3 Como detectar excesso de questões redundantes num mesmo OP
- **Sinal:** muitas questões no *mesmo OP*, *mesmo perfil* e *mesma língua*.
- **Distinção crítica** (ver §20): *variação legítima* (caso diferente, perfil diferente, ângulo cognitivo diferente) **≠** *duplicata* (mesma decisão, mesma estrutura de dados, mesmo perfil, mesma língua). O modelo torna o excesso **visível por construção**; o julgamento variação-vs-duplicata é editorial.

### 10.4 Como detectar lacunas importantes sem questão
- **Lacuna de OP:** OP relevante existe no plano, mas sem questão publicada.
- **Lacuna de nó:** Tópico/Domínio sem nenhum OP.
- **Priorização:** cada OP carrega uma noção de **importância clínica/de prova**; lacunas são **ranqueadas** por essa importância — uma lacuna num OP de alta relevância vale mais que dez questões extras num OP saturado.

---

## 11. Critério de existência da questão

> **Uma questão correta não é, por si só, uma questão boa.** Correção é pré-requisito, não justificativa.

Uma questão só deve existir se passar por este **portão de existência** (executável por autor, revisor e IA, antes da admissão):

1. **Mede um OP relevante?** Se não há OP, ou o OP é irrelevante, **rejeitar**.
2. **Ensina algo ou detecta um erro clínico plausível?** Se não muda diagnóstico, estratificação, conduta, monitorização, prognóstico ou segurança, **rejeitar**.
3. **Acrescenta ao OP?** Se é redundante com questões já existentes do mesmo OP/perfil/língua sem variação útil, **rejeitar ou fundir**.
4. **Escapa da trivia?** Se o acerto depende de decorar nome, ano, número ou epônimo sem consequência clínica, **rejeitar**.
5. **É segura?** Se algum distrator, internalizado, induz conduta perigosa como aceitável, **rejeitar ou reescrever**.

Questões **decorativas, redundantes ou triviais** são reprovadas — mesmo estando cientificamente corretas.

---

## 12. Ficha padrão do Objetivo Pedagógico

*Template preenchível. Campos com `‹…›` são a preencher; campos de vocabulário controlado indicam a lista de origem. A ficha é a unidade de trabalho do autor/revisor e da IA.*

| Campo | Valor | Notas |
|---|---|---|
| **loid** | `‹id estável do OP›` | espaço separado do `qid`; nunca reusar |
| **Especialidade** | `‹taxonomia›` | |
| **Subespecialidade** | `‹taxonomia›` | ~`cat` atual |
| **Domínio** | `‹taxonomia›` | |
| **Tópico** | `‹taxonomia›` | |
| **Objetivo pedagógico** | `‹frase com verbo: ser capaz de … evitando …›` | uma decisão testável |
| **Competência primária** | `‹vocab. EPA/CanMEDS›` | única e óbvia |
| **Competências secundárias** | `‹0–2 do vocab.›` | opcional |
| **Nível cognitivo (Bloom/Miller)** | `‹vocab.›` | evitar residir só em "Lembrar" |
| **Conceito central** | `‹1–2 do vocab. de conceitos›` | transversal |
| **Pré-requisitos** | `‹loids›` | arestas do DAG |
| **Erro clínico clássico** | `‹erro(s) que o OP previne›` | fonte dos distratores |
| **Armadilha cognitiva projetada** | `‹vocab. PED-1: anchoring, confusion, …›` | intenção de design |
| **Perfil-alvo** | `‹Estudante / R1–R2 / R3+ / Especialista›` | pode ser mais de um |
| **Dificuldade editorial intrínseca** | `‹escala ordinal›` | semente = `diff` |
| **Dificuldade esperada por perfil** | `‹derivada — não editar à mão›` | f(θ_perfil − b) |
| **Referências** | `‹ids de refs.js›` | evidência canônica do OP |
| **Questões derivadas** | `‹qids›` | filhas do OP |
| **Critérios de validade** | `‹checklist §8 marcado›` | conteúdo/construto/resposta/consequencial |
| **Critérios de reprovação** | `‹o que faria uma questão deste OP ser rejeitada — §11›` | portão de existência |
| **Grau de evidência / revisar_até** | `‹força›` / `‹data›` | governança |
| **Status / versão / autor / revisor** | `‹ciclo de vida›` | governança |
| **Observações multilíngues** | `‹o que muda ao renderizar em EN/ES; alertas de terminologia/gabarito›` | identidade permanece; renderização varia |

---

## 13. Modelo multilíngue

**Idiomas previstos:** PT-BR (canônico), EN, ES — e outros no futuro.

### Por que não traduzir literalmente as questões
Traduzir questão médica é **re-editorialização, não localização de string**:
- **Terminologia técnica diverge** (KDIGO/DOQI, fármacos, unidades).
- **A conduta pode diferir por região** — a tradução pode exigir **ajuste do gabarito**, não só do texto.
- **A prosa das referências é localizável** (resumo/conclusão dos cards).
- **O acoplamento posição↔letra** (explicações que citam "alternativa A/B/C/D") não sobrevive a mudanças de ordem.

Cada tradução é um **artefato editorial com status e revisor próprios**, idealmente um especialista fluente na língua-alvo.

### Como preservar o objetivo pedagógico entre idiomas
- O **OP e o `loid` são language-neutral.** Taxonomia, competência, nível cognitivo, conceitos e relações **não** se traduzem — são a identidade.
- **Language-bound** é só a *renderização*: enunciado, alternativas, explicação e prosa dos cards.
- Traduzir = criar **nova renderização do mesmo OP**. "O que a questão ensina" é idêntico em PT/EN/ES, ainda que o texto — e ocasionalmente o gabarito — se ajuste ao contexto.

---

## 14. Modelo multiespecialidade

### Núcleo editorial universal (qualquer especialidade)
- A estrutura de entidades e relações deste documento.
- Governança e ciclo de vida.
- O modelo de dificuldade (cinco eixos) e o psicométrico.
- Os critérios de **validade, confiabilidade, cobertura e existência** (§8–§11).
- Bloom/Miller como sinal de qualidade; competências em EPA/CanMEDS.
- As regras científicas invioláveis (não fabricar; uma melhor resposta; fonte antes da afirmação).

### Módulos específicos por especialidade
- A **subárvore taxonômica** própria.
- O **vocabulário de conceitos** e o **catálogo de erros clássicos** da área.
- O **checklist de segurança** específico.
- As **referências e diretrizes** de base.

**Nefrologia é o primeiro módulo** e o único no v1. Nova especialidade pendura uma subárvore na raiz; `qid` e `loid` são espaços globais, sem colisão.

---

## 15. Relação com a arquitetura atual do NefroQuest

| Elemento atual | Papel no modelo |
|---|---|
| `qid` | **Chave de junção**; intocável. `loid` é espaço paralelo novo. |
| `data/topics.js` | **Fonte do conteúdo** da questão. OP referencia `qid`s; não guarda enunciado. |
| `data/refs.js` | **Fonte das referências** (por `id`). OP aponta para os mesmos `id`s. |
| `diff` | **Dificuldade editorial fonte**; semeia a intrínseca. |
| `_d` (runtime) | **Inalterado**; segue alimentando `shuffleQueue`/`drawQuestion`. |
| `question_ratings` / `question_difficulty_votes` / `question_error_reasons` | **Matéria-prima da telemetria/empírica**, agregada por `qid` em leitura. |
| flags por e-mail (`send-flag`) | **Gatilho manual** de ciclo de vida; o modelo não depende de estrutura. |
| Motor adaptativo (IRT leve, θ por `cat`) | **Preservado.** θ por subespecialidade = o `cat` de hoje. |
| Competências por keyword (`competencies.js`) | **Bootstrap + fallback** para atribuir OP/competência às não curadas. |
| Zero-build / SPA / GitHub Pages | Grafo do OP como **content-as-code** estático; N:N como **listas de `id`** (padrão de `refs[]`). Nenhum banco novo exigido. |

**Adoção parcial é de primeira classe:** o sistema funciona com 0%, 10% ou 100% das questões mapeadas. Questão sem `loid` opera como legado.

---

## 16. O que deve ser preservado

1. **`qid` como identidade estável** — âncora do feedback e do `localStorage`.
2. **Conteúdo-como-código + deploy estático** (SPA vanilla, GitHub Pages, zero build).
3. **Trindade de versão** (`version.json` + `sw.js` + `index.html`).
4. **Separação `refs.js` × `topics.js`** por `id`.
5. **Formato "uma questão por linha"**.
6. **Contrato A–D / resposta única** e as **explicações que citam a letra** (sem embaralhamento até reescrita).
7. **RLS insert-público / select-admin** do feedback.
8. **FSRS por questão** como motor de agendamento.
9. **Regras científicas invioláveis** das skills.

---

## 17. O que pode evoluir futuramente

- **Substrato do overlay** (de listas-de-id para store dedicado), preservando `qid`/`loid`.
- **Transporte das flags** (de e-mail para fila estruturada).
- **Psicometria** (de `b`/1PL para 2PL/3PL; IRT multidimensional).
- **Dificuldade explanatória (LLTM)** — explicar `b` pelos atributos do OP.
- **Competência** (de keyword para tag curada).
- **Trilhas de aprendizagem** (grafo de pré-requisitos + maestria por OP).
- **Recálculo de `_d`** a partir da empírica calibrada.
- **Papéis de múltiplos revisores.**
- **Internacionalização e novas especialidades** como módulos aditivos.

---

## 18. Glossário

- **OP (Objetivo Pedagógico)** — Capacidade clínica testável; unidade central.
- **`loid`** — Identificador estável do OP.
- **`qid`** — Identificador estável da questão; chave de junção.
- **`diff`** — Dificuldade na fonte (`easy`/`medium`/`hard`).
- **`_d`** — Dificuldade em runtime, derivada de `diff`.
- **θ (theta)** — Habilidade estimada do usuário (IRT).
- **`b` / `a` / `c`** — Dificuldade / discriminação / acerto ao acaso do item (IRT).
- **Época de calibração** — Marca que liga estatísticas a uma versão do item; edição a invalida.
- **LLTM (IRT explanatório)** — Explica `b` a partir de covariáveis do OP.
- **Bloom / Miller** — Taxonomias de nível cognitivo (geral / clínico).
- **EPA / CanMEDS** — Frameworks de competência clínica.
- **Testlet** — Itens que compartilham estímulo/objetivo; cuidado com independência local.
- **Validade (conteúdo / construto / resposta / consequencial)** — Graus em que a questão mede o OP declarado e produz consequências desejáveis.
- **Confiabilidade editorial** — Reprodutibilidade da classificação entre revisores.
- **Cobertura** — Presença de OPs cobertos por nó taxonômico/competência/Bloom (≠ contagem).
- **Portão de existência** — Critério que uma questão precisa passar para ser admitida.
- **Overlay / strangler fig** — Evolução por sobreposição incremental, sem big-bang.
- **Conceito central** — Mecanismo/princípio reutilizável e transversal.
- **Armadilha projetada × Razão relatada** — Viés que o item testa (design) × motivo que o usuário nomeia ao errar (PED-1).
- **Content-as-code** — Conteúdo como arquivos estáticos versionados, sem banco nem build.

---

## 19. Exemplos aplicados à nefrologia

*(Ilustrativos; `qid`s são identificadores reais do banco.)*

- **A — Conduta na nefropatia por IgA.** Taxonomia: Nefrologia → Glomerulopatias → Primárias → Nefropatia por IgA. **OP:** *"Indicar corticoterapia na NIgA com base em proteinúria persistente após suporte otimizado."* Competência: conduta; Bloom: Aplicar/Avaliar; conceito: proteinúria residual como gatilho; erro clássico: tratar todos ao diagnóstico. Questão: `20861302`.
- **B — Mecanismo do edema nefrótico.** OP: *"Explicar a retenção de sódio no edema nefrótico com hipoalbuminemia discreta e volemia preservada."* Competência: mecanismo; conceito: retenção primária de sódio (*overfill*/ENaC); armadilha projetada: confusão de protótipos (aplicar *underfill* ao cenário errado). Questão: `ede008ca`.

---

## 20. Exemplo completo de OP em nefrologia

### 20.1 Ficha preenchida

| Campo | Valor |
|---|---|
| **loid** | `glomerular/nefrite-lupica/inducao-proliferativa` *(exemplo de slug legível)* |
| **Especialidade** | Nefrologia |
| **Subespecialidade** | Glomerulopatias |
| **Domínio** | Glomerulopatias secundárias / sistêmicas |
| **Tópico** | Nefrite lúpica |
| **Objetivo pedagógico** | *"Selecionar o esquema de indução da nefrite lúpica proliferativa (classe III/IV), distinguindo o regime de baixa dose (Euro-Lupus) do de alta dose (NIH) conforme perfil de risco e toxicidade."* |
| **Competência primária** | Conduta terapêutica (indução) |
| **Competências secundárias** | Estratificação de risco |
| **Nível cognitivo** | Avaliar (Bloom) / "sabe como" (Miller) |
| **Conceito central** | Indução imunossupressora dose-ajustada ao risco |
| **Pré-requisitos** | `…/classe-histologica-isn-rps` (distinguir proliferativa de membranosa) |
| **Erro clínico clássico** | Usar sempre alta dose; confundir indução com manutenção; ignorar toxicidade gonadal |
| **Armadilha projetada** | Discriminação fina (Euro-Lupus × NIH) |
| **Perfil-alvo** | R3+/nefrologia; Especialista |
| **Dificuldade editorial intrínseca** | Alta |
| **Referências** | `kdigo_lupus_nephritis_guideline_2024`, `kdigo_gn` |
| **Questões derivadas** | `865d9e5d` (+ irmãs, ver 20.2) |
| **Grau de evidência / revisar_até** | Diretriz forte / próxima atualização KDIGO de lúpus |
| **Status** | publicado |
| **Observações multilíngues** | Em EN/ES, "Euro-Lupus"/"NIH" mantêm-se; conferir nomes de fármacos e formulação; gabarito não muda entre regiões. |

### 20.2 Várias questões do mesmo OP — quando é variação legítima

Todas medem o **mesmo OP**, sem serem duplicatas, porque variam em **dimensão útil**:

- **Q1 — posologia/reconhecimento do regime** (Miller "sabe"): *"Qual a posologia do esquema Euro-Lupus?"* → `865d9e5d`.
- **Q2 — escolha por perfil de risco** (Miller "sabe como"): caso de mulher jovem com desejo de fertilidade → escolher **baixa dose** ponderando toxicidade gonadal. (Mesmo OP, **caso e ângulo cognitivo diferentes.**)
- **Q3 — perfil-alvo diferente:** versão para R1–R2 focando "indução vs manutenção" antes da nuance de dose. (Mesmo OP, **perfil e altitude diferentes.**)
- **Q4 — renderização EN/ES:** mesma decisão, outra língua. (Mesmo OP, **localização.**)

### 20.3 Quando seriam duplicatas

Duas questões deste OP são **duplicatas** quando coincidem em **quatro dimensões simultaneamente**: mesma **decisão** testada, mesma **estrutura de dados** do caso, mesmo **perfil-alvo** e mesma **língua** — variando apenas em texto cosmético.

- **Caso real:** o par Euro-Lupus (`865d9e5d` e a antiga `0f0075a0`) testava a **mesma posologia**, mesmo perfil, mesma língua → **duplicata**. A resolução editorial foi **redirecionar** uma delas para um OP distinto (*manutenção da nefrite lúpica*), transformando a duplicata em variação legítima de **outro** objetivo.
- **Regra:** duplicata ⇒ **fundir** (manter a melhor) **ou redirecionar** para um OP genuinamente diferente. Nunca manter duas questões no mesmo OP/perfil/língua que exijam o mesmo raciocínio sobre os mesmos dados.

---

*Fim do rascunho v1.1 — para revisão humana. Mudanças desde a v1.0: novas seções de Validade (§8), Confiabilidade editorial (§9), Cobertura editorial (§10), Critério de existência (§11), Ficha padrão do OP (§12) e Exemplo completo (§20); tom ajustado para uso conjunto por IA e revisor médico e para reaproveitamento multilíngue/multiespecialidade. Próximos passos sugeridos após aprovação: (a) fixar a granularidade do OP; (b) ancorar competência em EPA ou CanMEDS; (c) definir os vocabulários controlados (§9.4) de competência, conceito e erro para nefrologia.*
