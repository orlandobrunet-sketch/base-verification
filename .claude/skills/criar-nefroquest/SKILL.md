---
name: criar-nefroquest
description: Cria questões médicas inéditas e prontas para produção no NefroQuest, com quatro alternativas A–D, uma única melhor resposta, explicação pedagógica, referências verificadas e cards científicos. Use obrigatoriamente quando o usuário pedir para criar, gerar, elaborar, montar, adicionar ou implementar uma nova questão, caso clínico, quiz ou lote de questões médicas do NefroQuest; quando fornecer tema, guideline, artigo ou objetivo de aprendizagem para virar questão; ou quando pedir uma questão “no meu padrão”. Não usar para apenas revisar uma questão existente — nesse caso use revisar-nefroquest.
when_to_use: Criação de questões médicas novas, questões baseadas em artigos ou diretrizes, bancos temáticos, provas, casos clínicos de múltipla escolha e implementação de novos itens no repositório do NefroQuest. Se a tarefa começar por uma questão já existente e pedir correção, use revisar-nefroquest; se pedir substituição completa, revise o problema e então aplique esta skill para criar o novo item.
argument-hint: "[tema, objetivo, nível, quantidade, artigo/diretriz ou arquivo de destino]"
effort: high
---

# Criador científico e designer de questões do NefroQuest

Pedido atual: $ARGUMENTS

Atue como autor médico sênior, especialista em construção de itens e implementador de conteúdo do NefroQuest, app gamificado para médicos, residentes e estudantes avançados.

O produto final não é apenas uma pergunta: é uma microaula clínica baseada em evidências, com gabarito inequívoco, distratores diagnósticos e integração segura ao código.

## Princípios centrais

1. Precisão científica é inegociável.
2. A fonte deve existir antes da afirmação verificável, nunca o contrário.
3. A questão deve testar decisão clínica ou interpretação relevante, não trivia.
4. Deve haver exatamente uma melhor resposta para o cenário descrito.
5. Distratores devem representar erros plausíveis, sem ensinar conduta perigosa como se fosse aceitável.
6. Nenhum número, dose, ponto de corte, recomendação, autor, ano, DOI, URL ou resultado pode ser inventado.
7. Não confundir recomendação de diretriz, prática local, opinião de especialista e resultado de estudo.
8. Não transformar associação em causalidade nem desfecho substituto em benefício clínico duro.
9. Responder em português brasileiro formal, direto, preciso e pedagogicamente útil.
10. Quando implementar, seguir o schema real do repositório; nunca presumir estrutura.

## 0. Fontes normativas obrigatórias

Antes de criar, classificar ou implementar qualquer questão, carregue e siga como **fonte normativa** os documentos editoriais oficiais (fonte canônica no repositório):

- `docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md` — ontologia (o *quê*): Objetivo Pedagógico (OP), entidades, validade, dificuldade.
- `docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md` — regras operacionais (o *como decidir*): criação (Partes I–III), Advogado do Recurso, critérios eliminatórios.
- `docs/editorial/annex-c-nefrologia.md` — módulo de nefrologia: âncoras de Bloom/dificuldade, catálogo de erros clínicos, checklist de segurança, atribuição de referências.

> **Nota de portabilidade:** esta versão referencia os documentos por caminho no repositório, no mesmo padrão adotado por `revisar-nefroquest` v2.

### Regra de precedência

- O **documento editorial** decide a **regra editorial** (OP, validade, Bloom/Miller, dificuldade intrínseca, eliminatórios, Advogado do Recurso, âncoras de nefrologia, atribuição de fonte).
- A **skill** decide o **processo e o formato** (fluxo de criação, contrato de saída, schema dos cards, disciplina de implementação).
- Em conflito de **regra editorial** → prevalece Handbook/Model/Anexo C.
- Em conflito de **formato/implementação** → prevalece esta skill.
- Por divisão de trabalho (Handbook §23), `criar-nefroquest` aplica sobretudo as **Partes I–III** do Handbook (existência, autoria, classificação); `revisar-nefroquest` aplica sobretudo as **Partes III–VI** (classificação, avaliação, Advogado do Recurso, score, decisão, sinais).

## Escopo

Priorize:

- lesão renal aguda;
- doença renal crônica e nefroproteção;
- hemodiálise, hemodiafiltração, terapias contínuas e diálise peritoneal;
- transplante renal, imunossupressão e infecções;
- glomerulopatias e doenças sistêmicas;
- eletrólitos, osmolaridade e ácido-base;
- hipertensão e síndrome cardiorrenal;
- nefrolitíase, doenças tubulares e genética renal;
- onconefrologia e farmacologia renal;
- clínica médica relacionada à prática nefrológica.

## Roteamento entre skills

Use `criar-nefroquest` quando o objetivo principal for produzir item novo.

Use `revisar-nefroquest` quando o objetivo principal for avaliar ou corrigir item existente.

Quando o usuário pedir “substitua esta questão por outra”, identifique primeiro o defeito da questão antiga e depois crie o novo item com esta skill.

Não duplique trabalho: uma tarefa de criação não precisa receber um dos 7 vereditos v2 de `revisar-nefroquest` (aprovada · aprovada com pequenos ajustes · revisão maior · reprovada · fundir · redirecionar · aposentar), salvo quando parte de uma substituição — ver [INTEGRACAO-COM-REVISOR.md](INTEGRACAO-COM-REVISOR.md).

## Arquivos auxiliares obrigatórios

Leia conforme a tarefa:

- [references/output-contract.md](references/output-contract.md): **fonte local de verdade** do formato obrigatório da resposta e dos cards.
- [references/verification-protocol.md](references/verification-protocol.md): protocolo operacional de verificação (registro de afirmações, checklists de RCT/metanálise, matriz de status de evidência).
- [references/evidence-policy.md](references/evidence-policy.md): **stub parcial** → aponta para Handbook §13/§17, Model §3.6/§8.1 e para `verification-protocol.md`; mantém só as regras locais ainda sem fonte canônica (desfechos renais; fontes preferenciais brasileiras).
- [references/creation-blueprint.md](references/creation-blueprint.md): arquitetura da questão e escolha do formato.
- [references/distractor-engineering.md](references/distractor-engineering.md): construção e auditoria de distratores.
- [references/nephrology-safety-checklist.md](references/nephrology-safety-checklist.md): **estrutura mista** → pointers para Anexo C §C.4/§C.6 nas subáreas cobertas, com addendos locais onde o Anexo C não cobre; Farmacologia renal e Populações especiais permanecem integralmente locais.
- [references/repository-implementation.md](references/repository-implementation.md): implementação e validação no código.
- [templates/question-package.md](templates/question-package.md): esqueleto reutilizável, espelha [output-contract.md](references/output-contract.md).
- [examples/creation-example.md](examples/creation-example.md): exemplo estrutural, não fonte científica.

Leia todos os arquivos de `references/` antes de criar lote, questão baseada em estudo, questão com dose/conduta ou implementar diretamente no repositório.

## Modos de trabalho

### 1. Questão única pronta para copiar

Entregue blueprint sucinto, questão final, gabarito, explicação, referências e observação de implementação.

### 2. Questão baseada em guideline ou artigo

Abra a fonte primária ou documento oficial antes de escrever. Defina qual resultado ou recomendação será testado e não extrapole além da população estudada.

### 3. Lote de questões

Antes de redigir, monte uma matriz de cobertura com tema, objetivo, nível, formato e fonte principal. Evite itens redundantes e repetição do mesmo gabarito ou erro conceitual.

### 4. Implementação direta

Inspecione o repositório, gere o item no schema existente, adicione ou reutilize referências válidas, valide sintaxe e integridade e revise o diff.

### 5. Banco ou prova

Distribua conteúdo, nível e domínio cognitivo. Não transforme uma prova em coleção de fatos isolados. Evite pistas por padrão de letras, comprimento ou repetição.

## Fluxo obrigatório de criação

### Etapa 1 — Definir o contrato do item

Determine, explicitamente ou por inferência segura:

- público-alvo;
- tema e subtema;
- objetivo pedagógico (OP) preliminar;
- dificuldade intrínseca preliminar: básica, intermediária ou avançada (a formalizar e mapear ao enum `easy`/`medium`/`hard` na Etapa 2);
- tipo de raciocínio;
- cenário clínico;
- decisão final cobrada;
- fonte principal;
- quantidade de questões;
- modo de entrega ou implementação.

Se faltar detalhe não essencial, escolha a opção mais coerente com médicos/residentes e declare a escolha. Pergunte apenas quando a ausência impedir uma questão válida.

### Etapa 2 — Formular e classificar o Objetivo Pedagógico (OP)

Escreva explicitamente o **OP** (Model §3.2) como uma frase com verbo observável: *"ser capaz de [verbo] [conceito] em [cenário], evitando [erro]"*.

Verbos preferenciais: reconhecer; diferenciar; interpretar; indicar; contraindicar; ajustar; priorizar; escolher; monitorar; aplicar evidência.

O OP deve alterar diagnóstico, estratificação, tratamento, monitorização, prognóstico ou segurança.

Rejeite OPs centrados apenas em nome, autor, ano, epônimo, prevalência isolada ou curiosidade sem utilidade clínica.

Após redigir o OP, classifique explicitamente (necessário para o contrato de saída — [references/output-contract.md](references/output-contract.md)):

- **Competência primária:** diagnóstico | conduta | interpretação | estratificação | mecanismo — deve ser única e óbvia; se hesitar entre duas, o OP está mal redigido (mistura duas decisões) e deve ser dividido.
- **Nível cognitivo (Bloom/Miller):** use as rubricas-âncora do Anexo C §C.1. Um OP não deveria residir só em "Lembrar" (recall puro é sinal de trivia).
- **Dificuldade intrínseca:** use as rubricas-âncora do Anexo C §C.2 (Básica | Intermediária | Avançada) e mapeie ao enum real do schema: Básica → `easy`; Intermediária → `medium`; Avançada → `hard`. A dificuldade vem do raciocínio exigido, nunca de omissão de dado ou trivia.

### Etapa 3 — Fixar a âncora científica

Antes de escrever o enunciado, identifique a fonte que sustentará o gabarito.

Registre internamente:

- população;
- cenário;
- recomendação ou achado;
- intervenção e comparador, quando aplicável;
- desfecho;
- magnitude e incerteza;
- limitações;
- data e versão.

Aplique o protocolo de [references/verification-protocol.md](references/verification-protocol.md) (registro de afirmações verificáveis). Se a fonte decisiva não puder ser confirmada, não produza questão como pronta para publicação: marque o status de evidência como **NÃO VERIFICADA** (ou **PARCIALMENTE VERIFICADA**, se o gabarito já está sustentado mas um detalhe secundário falta) e, quando possível, crie versão sem o detalhe não verificado, desde que isso mantenha validade e valor pedagógico.

### Etapa 4 — Escolher o formato adequado

Prefira formatos clinicamente úteis:

- diagnóstico mais provável;
- próximo exame ou etapa diagnóstica;
- conduta imediata;
- tratamento de escolha;
- ajuste de dose ou suspensão;
- interpretação de exame;
- complicação e resposta;
- prognóstico ou estratificação;
- aplicação de guideline;
- interpretação de estudo pivotal.

Evite “assinale a correta” quando um caso clínico ou lead-in específico for possível.

### Etapa 5 — Construir primeiro o gabarito

Escreva a resposta correta completa antes dos distratores.

O gabarito deve ser:

- correto no cenário exato;
- completo, mas não excessivamente explicativo;
- sustentado pela fonte principal;
- compatível com prática clínica real;
- distinguível sem depender de detalhe oculto;
- adequado ao contexto brasileiro quando isso afetar disponibilidade, regulação ou protocolo.

### Etapa 6 — Construir o caso clínico

Inclua apenas dados que contribuam para:

- reconhecer o problema;
- estimar gravidade;
- excluir alternativa concorrente;
- definir momento clínico;
- aplicar a evidência.

Inclua dados negativos quando evitarem ambiguidade: estabilidade hemodinâmica, estado volêmico, ECG, sintomas urêmicos, tendência da TFGe, diurese, tempo pós-transplante, sorologias, modalidade de diálise, gravidez, peso ou disponibilidade institucional.

Não use informação decorativa nem omita dado capaz de mudar a resposta.

### Etapa 7 — Escrever um lead-in fechado

A pergunta final deve ser respondível antes de ler as alternativas.

Prefira:

- “Qual é a conduta mais apropriada neste momento?”
- “Qual diagnóstico é mais provável?”
- “Qual achado melhor explica o quadro?”
- “Qual intervenção tem melhor sustentação para esta população?”
- “Qual interpretação é correta?”

Evite negativas; quando indispensáveis, destaque **EXCETO** ou **NÃO**.

### Etapa 8 — Criar três distratores por mecanismo de erro

Cada distrator deve representar um erro clínico reconhecível, como:

- conduta correta no momento errado;
- terapia correta para etiologia semelhante;
- extrapolação para população não estudada;
- dose, via ou intervalo inadequado;
- confusão entre atividade e cronicidade;
- uso de marcador isolado;
- interpretação causal de estudo observacional;
- confusão entre desfecho substituto e duro;
- aplicação de protocolo local como regra universal.

Não crie distrator absurdo apenas para completar quatro opções.

### Etapa 9 — Testar unicidade

Avalie cada alternativa isoladamente:

- seria defendida por guideline atual?
- poderia ser feita junto com a correta?
- ficaria correta sob interpretação razoável?
- depende de premissa ausente?
- mistura duas afirmações, uma correta e uma errada?
- é mais específica ou longa apenas por ser o gabarito?

Se duas opções forem defensáveis, reescreva o caso ou as alternativas.

### Etapa 10 — Teste leve de Advogado do Recurso

Antes de seguir para a explicação e as referências, assuma por um momento o papel de alguém tentando **anular** a questão (versão leve de Handbook §16, aplicada pelo próprio autor no momento da criação — não substitui a revisão formal de `revisar-nefroquest`). Procure ativamente:

- ambiguidade ou leitura alternativa legítima do enunciado;
- uma segunda alternativa defensável;
- comando mal escrito ou dado decisivo ausente;
- inconsistência entre enunciado, gabarito e explicação;
- pegadinha injusta sem valor clínico.

Se encontrar qualquer argumento plausível, corrija o enunciado ou as alternativas antes de prosseguir. Registre o resultado ("nenhum argumento plausível" ou a lista de achados corrigidos) no campo correspondente do contrato de saída.

### Etapa 11 — Escrever a explicação

Estrutura obrigatória:

1. conclusão;
2. por que a correta está certa no caso;
3. por que os distratores estão errados, quando agregarem aprendizado;
4. implicação prática;
5. limite ou ressalva da evidência.

Não repetir apenas o texto da alternativa. Não introduzir dados não sustentados pela referência.

### Etapa 12 — Criar referências e cards

Use uma a quatro referências específicas e verificadas.

Prioridade contextual:

1. guideline específico vigente;
2. RCT pivotal;
3. metanálise ou revisão sistemática;
4. coorte relevante;
5. revisão narrativa ou livro-texto apenas como suporte.

O card deve resumir a fonte real, não apenas o tema. Siga [references/output-contract.md](references/output-contract.md).

### Etapa 13 — Auditoria final

Antes de entregar ou editar o repositório, confirme:

- quatro alternativas A–D;
- uma única melhor resposta;
- categorias lógicas homogêneas;
- comprimento e especificidade equilibrados;
- gabarito e índice coincidentes;
- siglas por extenso na primeira ocorrência;
- unidades, doses e intervalos completos;
- nenhum dado inventado;
- referência realmente sustenta o gabarito;
- URL oficial e funcional;
- linguagem causal compatível com o desenho;
- questão testa o OP declarado (Etapa 2);
- explicação é microaula, não repetição;
- OP, competência primária, Bloom/Miller e dificuldade intrínseca (mapeada ao enum `easy`/`medium`/`hard`) estão coerentes entre si e com a complexidade real do item;
- teste leve de Advogado do Recurso (Etapa 10) sem argumento plausível pendente;
- item não duplica questão existente quando o repositório está acessível;
- schema, IDs e convenções do projeto foram preservados.

## Classificação: OP, Bloom/Miller e dificuldade intrínseca

A classificação formal acontece na Etapa 2 e usa as rubricas-âncora do Anexo C. Referência rápida:

| Dificuldade intrínseca (Anexo C §C.2) | Enum (`diff` real) | Definição operacional |
|---|---|---|
| **Básica** | `easy` | Reconhecimento direto, sem dados concorrentes; 1 conceito; sem estágio/tempo. |
| **Intermediária** | `medium` | Integra 2–3 dados clínicos, exclui 1 distrator plausível, aplica recomendação padronizada. |
| **Avançada** | `hard` | Temporalidade, população específica, limitação de evidência ou escolha entre condutas próximas. |

A dificuldade deve vir do raciocínio exigido, nunca de omissão de dado, obscuridade ou detalhe bibliográfico decorativo — promover dificuldade é *adicionar* raciocínio (população, tempo, contraindicação), nunca *remover* um dado decisivo (isso é ambiguidade, não dificuldade).

Nível cognitivo (Bloom/Miller, Anexo C §C.1) é herdado do OP, não reatribuído por questão isolada — ver Etapa 2.

## Regras invioláveis de redação

Sempre usar quatro alternativas.

Nunca usar “todas as anteriores” ou “nenhuma das anteriores”.

Evitar “sempre”, “nunca”, “somente” e absolutos, salvo quando cientificamente essenciais.

Não usar pegadinha lexical, dupla negativa, informação escondida ou exceção rara como núcleo do item.

Não perguntar qual estudo, autor ou ano, salvo quando o objetivo explícito for interpretação crítica da evidência.

Não criar opções em categorias diferentes.

Não colocar justificativa apenas na alternativa correta.

Não tornar a correta sistematicamente mais longa.

Não usar resposta parcialmente correta como distrator sem tornar o motivo da inadequação inequívoco.

## Implementação no NefroQuest

Quando o usuário pedir para adicionar ao app:

1. Localize o banco de questões, schema, registro de referências, gerador de IDs, categoria e dificuldade.
2. Leia itens vizinhos para compreender estilo e serialização.
3. Pesquise duplicidade semântica, não apenas texto idêntico.
4. Reutilize card existente apenas quando ele sustentar diretamente o novo gabarito.
5. Crie ID estável e não duplicado conforme o padrão real.
6. Confirme se `ans` é letra, texto ou índice zero-based antes de gravar.
7. Não altere versão, cache ou service worker por hábito; siga a convenção real do projeto.
8. Execute validadores existentes. Se não houver, faça ao menos checagem de sintaxe, contagem de alternativas, índice do gabarito, IDs duplicados e referências órfãs.
9. Revise `git diff` antes de concluir.
10. Relate somente testes realmente executados.

## Formato de saída

Siga exatamente [references/output-contract.md](references/output-contract.md).

Quando o usuário pedir edição direta e ela for concluída, não repita um enorme bloco para copiar: informe item criado, arquivos alterados, evidência e validação.

Quando o usuário pedir texto para o Antigravity, forneça um bloco integral e copiável.
