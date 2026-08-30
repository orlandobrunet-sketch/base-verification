# NefroQuest — Roadmap ativo

**Última reconciliação:** 21/08/2026
**Versão de referência:** consultar sempre [`version.json`](../version.json)
**Arquivo anterior:** [`archive/ROADMAP_LEGACY_2026-08.md`](archive/ROADMAP_LEGACY_2026-08.md)

Este documento controla direção, prioridade e critérios de conclusão. Ele não autoriza execução automática: cada frente precisa ser solicitada explicitamente pelo proprietário do produto.

## Como usar

Vocabulário único de status:

- `ATIVO` — em execução; exige evidência recente;
- `PRONTO PARA INICIAR` — problema, escopo e dependências definidos;
- `EM DESCOBERTA` — ainda requer decisão ou baseline;
- `BLOQUEADO` — depende de acesso, decisão ou ação externa;
- `PUBLICADO` — entregue, validado e retirado do backlog ativo.

Limites operacionais:

- no máximo **três resultados em andamento**;
- uma grande superfície visual por entrega;
- itens concluídos saem da fila ativa e entram no marco de produto;
- catálogo de ferramentas, especificações extensas e textos de loja não pertencem ao roadmap ativo.

## Checkpoint operacional para continuidade

- **Última etapa publicada:** sandbox da demonstração do chefe, versão `14.84`, PR [#774](https://github.com/orlandobrunet-sketch/base-verification/pull/774)
- **Em produção:** `14.84`, verificada em 30/08/2026 por `version.json` e pelo cache `nefroquest-v14.84`
- **Em validação:** nenhuma entrega pendente de publicação.
- **Próxima ação única:** implementar e provar a transição atômica do Service Worker de vN para vN+1, online e offline.

Entregue em 22/08/2026, tudo com verificação vermelho/verde e suíte completa limpa:

| Entrega | PR | Versão |
|---|---|---|
| Stored XSS do painel administrativo (NQ-00A) | [#762](https://github.com/orlandobrunet-sketch/base-verification/pull/762) | 14.76 |
| Reconciliação de documentação | [#763](https://github.com/orlandobrunet-sketch/base-verification/pull/763) | — |
| Gate médico-editorial (NQ-00B) | [#764](https://github.com/orlandobrunet-sketch/base-verification/pull/764) | — |
| Cabeçalho: regras órfãs do #761 | [#765](https://github.com/orlandobrunet-sketch/base-verification/pull/765) | 14.77 |
| Isolamento de conta (NQ-01, 1º eixo) | [#766](https://github.com/orlandobrunet-sketch/base-verification/pull/766) | 14.78 |

Pendências que dependem do proprietário:

- conferir o painel admin de produção com sessão autenticada — o banco não tem payload legado, então é conferência de ausência;
- confirmar o recorte de ações do gate editorial (ver NQ-00B);
- **não existe CSP em `nefroquest.com`** — medido: 161 handlers inline e 12 blocos de script inline. Sem `unsafe-inline` o app quebra; com `unsafe-inline` a CSP não protege. Fica atrás de um refactor do modelo de eventos, e não é urgente porque o vetor real está fechado no render e no banco;
- `public.question_error_reasons` recebe insert público de `question_id` sem allowlist. Não é vetor hoje: nenhum caminho do app lê a tabela.

Nenhum conteúdo médico foi alterado ou reclassificado em nenhuma das cinco entregas.

## Norte do produto

O NefroQuest deve ser a sala de controle do aprendizado em nefrologia: mostrar o que o usuário realmente sabe, transformar lacunas em uma próxima ação clara e fazer a evolução clínica e RPG parecer desejável sem inventar progresso.

### Resultados que importam

1. **Aprender:** o usuário entende por que errou e sabe o que revisar depois.
2. **Reter:** revisões vencidas e memória consolidada retornam à prática no momento certo.
3. **Evoluir:** competência clínica, personagem, selos e conquistas avançam com dados reais.
4. **Confiar:** conteúdo, evidência, pagamento, privacidade e métricas têm fonte verificável.
5. **Voltar:** a próxima sessão é pequena, explicável e iniciável em um clique.

Não há meta numérica nova sem baseline. A primeira medição deve anteceder qualquer promessa de crescimento.

## Estado atual do produto

| Área | Estado | Evidência atual | Lacuna que permanece |
|---|---|---|---|
| Jornada Lúmen principal | `PUBLICADO` | Portal, Átrio, escolha de classe, dificuldade, pergunta, feedback e Central já usam a linguagem Lúmen | Fechar inventário de estados e consistência ponta a ponta; várias superfícies internas ainda são popups legados |
| Central de Comando | `PUBLICADO` | Dados reais, FSRS visível, radar honesto, comparação semanal, badges reais, Mapa, Grimório e Ranking | Validar densidade e hierarquia com uso real; não iniciar outro redesenho amplo sem problema medido |
| Motores de aprendizagem | `PUBLICADO` | IRT leve, FSRS-4.5, Ritual, eixos clínicos e competências | O classificador continua heurístico; o fallback genérico permanece em até 41% das atribuições e deve ser tratado com transparência |
| Segurança administrativa | `ATIVO` | v14.76 em produção com os dois vetores fechados no render; migration 018 aplicada e provada contra o banco real; regressão no smoke bloqueante | Confirmar o painel admin com sessão autenticada e decidir sobre CSP — auditoria de 22/08/2026 mostrou que não existe nenhuma |
| Qualidade de engenharia | `ATIVO` | Bump/cache automatizados, sintaxe no CI, harness local, fixtures e ampla suíte Playwright; execução completa mais recente: 486 passed, 14 skipped, 2 flaky | Revalidar sem retries o `specs/26-memoria-fsrs.spec.ts` após trocar `load` por `domcontentloaded`, depois repetir a suíte completa |
| Acessibilidade e movimento | `PUBLICADO` | Teclado, toque, foco, movimento reduzido e gabarito sem dependência exclusiva de cor cobertos nas superfícies recentes | Completar smoke com leitor de tela/zoom e manter a cobertura nas próximas páginas |
| Identidade e sincronização | `PRONTO PARA INICIAR` | Save e sincronização de parte do progresso existem | Logout não limpa todas as chaves da Central; nuvem não carrega/mescla todo o perfil; atualização PWA pode misturar releases |
| Operação de produção | `BLOQUEADO` | Release e cache têm gates locais/CI | Smoke externo deve ocorrer depois dos bloqueadores locais; serviços e telemetria exigem acesso aos consoles |
| Receita | `BLOQUEADO` | Integração Mercado Pago, webhook e premium existem | Falta validar mensal e vitalício ponta a ponta e derivar a conversão de confirmação do backend |
| Operação editorial | `PRONTO PARA INICIAR` | Knowledge Model, Handbook, Anexo C, skills e manifests de lote existem | O validador de CI ainda não exige veredito, três eixos nem `Autorização de publicação: LIBERADA` |

O ciclo recente feito com Claude Code foi auditado em [`audits/CLAUDE_CODE_REVIEW_2026-08-21.md`](audits/CLAUDE_CODE_REVIEW_2026-08-21.md).

## Agora

### NQ-00 — Bloqueadores de publicação

**Status:** `ATIVO`
**Resultado:** impedir que dados públicos executem código no painel administrativo, que uma mudança clínica chegue à main sem autorização editorial derivada e que ferramentas de demonstração alterem progresso real.

#### NQ-00C — Prévia administrativa contaminava o progresso real

**Estado:** prevenção publicada na `14.84`, PR [#774](https://github.com/orlandobrunet-sketch/base-verification/pull/774), e confirmada em produção em 30/08/2026.

A causa não era apenas um `saveGame()` explícito. O atalho “Fase Final” alterava
o mesmo `Proxy` da jornada, cujo autosave persistia os 90 acertos fictícios.
Responder na prévia também alimentava estatísticas detalhadas, competências,
questões dominadas, Grimório, conquistas, reflexão de erro, analytics e nuvem.

- [x] unificar o link `?boss=1` e o atalho administrativo no mesmo caminho;
- [x] salvar qualquer mutação legítima pendente **antes** de entrar no sandbox;
- [x] suspender save, perfil pedagógico, selos, conquistas, reflexão, avaliação, analytics e cloud sync durante a demonstração;
- [x] manter a batalha interativa e identificá-la visualmente como demonstração;
- [x] sair por reload limpo, removendo os parâmetros de preview e restaurando o save real;
- [x] carregar banco e Grimório antes de renderizar, fechando a corrida de `refsDB`;
- [x] provar entrada, acerto, erro, conclusão e saída em 5 testes E2E; regressão anterior do chefe também permanece verde (9/9 no Chromium, sem retries);
- [x] publicar a `14.84` e confirmar `version.json` + cache em produção;
- [ ] reparar o save histórico já contaminado do proprietário — **não automatizar**: versões anteriores não gravaram marcador de origem, então o número legítimo de acertos não pode ser inferido com segurança.

#### NQ-00A — Stored XSS do painel administrativo

**Estado:** publicado na v14.76 e aplicado no banco em 22/08/2026. Resta uma confirmação visual com sessão autenticada.

- [x] reproduzir os dois vetores com payload persistido em teste de navegador;
- [x] renderizar `question_id` de avaliações e `current_diff` de votos com escape robusto;
- [x] adicionar allowlists de `qid` e dificuldade para novos registros na migration 018;
- [x] tornar a regressão parte do smoke E2E bloqueante;
- [x] alinhar `version.json`, Service Worker e cache-buster de `js/admin.js` em 14.76;
- [x] revalidar `specs/26-memoria-fsrs.spec.ts` sem retries e repetir a suíte completa após a estabilização de navegação;
- [x] revisar, abrir e integrar um único PR com frontend, teste, migration e bump 14.76 — [#762](https://github.com/orlandobrunet-sketch/base-verification/pull/762), squash `23269e3`;
- [x] aplicar `018_public_feedback_input_constraints.sql` no Supabase com autorização do proprietário — versão `20260822013131`, com as três constraints provadas contra o banco real;
- [ ] confirmar no painel admin de produção que os registros aparecem como texto — **depende de sessão autenticada**. O banco não tem nenhum payload legado, então a conferência é de ausência, não de neutralização;
- [ ] confirmar a CSP no host que efetivamente serve `nefroquest.com` — **auditado em 22/08/2026: não existe CSP alguma**, nem header nem `<meta>`, em `/` nem em `/jogar/`. E não é um item pequeno: o GitHub Pages não define header de resposta, e a via `<meta>` esbarra em **161 handlers inline** (`onclick=` e similares; 140 só em `jogar/index.html`) e **12 blocos `<script>` inline**. Sem `unsafe-inline` o app quebra inteiro; com `unsafe-inline` a CSP deixa de proteger contra XSS, que é o motivo de existir. `<meta>` também ignora `frame-ancestors`, `report-uri` e `sandbox`. Uma CSP com valor real fica atrás de um refactor do modelo de eventos — etapa própria, com risco de regressão em toda a UI, e prioridade menor que NQ-00B enquanto o vetor real está fechado em duas camadas.

Não marcar NQ-00A como encerrado apenas porque o teste local passou. Duas das quatro fronteiras — render e banco — têm evidência datada; o host e o olho humano ainda não.

#### NQ-00B — Gate médico-editorial cumulativo

**Estado:** implementado e em vigor desde 22/08/2026 ([#764](https://github.com/orlandobrunet-sketch/base-verification/pull/764)).

- [x] o validador exige veredito, Evidência, Pendência e Publicação por item;
- [x] publicação bloqueada, pendência decisiva e combinações inválidas falham na CI — os cinco arquivos de teste do validador NUNCA haviam rodado na CI; agora rodam no job Quality Gates, que bloqueia merge;
- [x] o gate técnico não afirma aprovação clínica por conta própria, e há teste garantindo que nenhum caminho devolve LIBERADA sem veredito de aprovação declarado.

A Regra 7 foi percorrida por inteiro: das 63 combinações dos três eixos, exatamente quatro produzem LIBERADA. Verificação vermelho/verde desligando uma regra do Handbook por vez.

Os 132 manifests históricos não declaram os eixos e não são revalidados — o portão vale para o lote que o PR altera. **O próximo PR de lote editorial falha até declarar os quatro campos.** Formato documentado em `docs/editorial/review-batches/README.md`.

Decisão de recorte a confirmar: os eixos são exigidos nas ações `rebuild`, `refs_only`, `add` e `reviewed_unchanged`, e não em `technical_only` nem `retire`. Fica num único `Set` no topo de `manifest.mjs`.

### NQ-01 — Isolamento de conta, sincronização e atualização atômica

**Status:** `ATIVO` — isolamento de conta fechado na v14.78; faltam o merge entre dispositivos e a transição atômica do Service Worker
**Resultado:** uma conta nunca herda dados de outra, dois dispositivos não apagam o melhor histórico e uma release nunca mistura HTML novo com JS/CSS antigo.

Escopo:

- [x] inventariar toda chave local como global, por dispositivo ou por conta — 32 chaves medidas, nenhuma dinâmica, nenhuma em sessionStorage;
- [x] limpar no logout competências, erros, conhecimento, favoritos, histórico, votos e avaliações locais — doze chaves ficavam para trás, incluindo uma pontuação pendente que seria publicada no ranking pela conta seguinte ([#766](https://github.com/orlandobrunet-sketch/base-verification/pull/766));
- versionar o payload da Central e definir merge determinístico por resposta/evento;
- testar duas contas e dois dispositivos com estados concorrentes;
- tornar a transição do Service Worker version-aware/atômica, com aviso ou reload seguro;
- adicionar teste real de upgrade vN → vN+1, online e offline.

Pronto quando nenhum dado pedagógico ou de perfil cruza contas, o merge não rebaixa histórico e uma primeira abertura pós-release usa um conjunto coerente de assets.

### NQ-02 — Integridade pedagógica e gate crítico de regressão

**Status:** `PRONTO PARA INICIAR`
**Resultado:** a Central não prescreve uma fraqueza não medida, não promete evolução impossível e os contratos críticos impedem merge quando quebram.

Escopo:

- corrigir substring/negação do classificador sob revisão editorial formal;
- iniciar a migração para `competency_ids` curados e versionados por questão;
- representar separadamente portão de acertos e XP na evolução do nível;
- testar fim de jornada → nova jornada sem dupla contagem;
- filtrar conquistas removidas também no popup legado;
- implementar foco inicial, contenção e restauração na escolha de classe;
- corrigir o flake do Enter reflexo e sua janela no runtime;
- tornar bloqueantes os specs críticos 21, 22, 28, 30, 31, 33 e 34;
- classificar explicitamente qualquer flake restante, sem `|| echo`.

Pronto quando as recomendações têm fonte e confiança explícitas, a progressão observada coincide com a regra do jogo e o conjunto crítico falha a CI ao reintroduzir um defeito.

## Próximo

### NQ-03 — Confiança de produção da release corrigida

**Status:** `BLOQUEADO` por NQ-00, NQ-01 e NQ-02
**Resultado:** saber, com evidência datada, se a experiência entregue no repositório é a experiência recebida pelo usuário.

Escopo:

- versão, host, headers e Service Worker em produção;
- Portal → Átrio → Classe → Dificuldade → Questão → Feedback → Central → Retomada;
- visitante, conta autenticada, save novo, save legado e estado vazio;
- desktop/mobile, teclado, toque, foco, zoom, leitor de tela e movimento reduzido;
- Oráculo, diagnóstico, contato, reporte, sugestão de artigo, quota de IA e offline;
- retry/erro/atraso de `refs.js` e `articles.js` em todos os consumidores;
- Sentry, GA4 e rollback conhecido.

Pronto quando houver smoke datado, nenhum P0/P1 aberto e observabilidade da release correta.

### NQ-04 — Encerrar a vertical Lúmen atual

**Status:** `PRONTO PARA INICIAR` após NQ-03
**Resultado:** consolidar o que já foi publicado antes de abrir outra grande frente visual.

Escopo:

- classificar cada superfície como `Lúmen`, `legado aceitável` ou `a migrar`;
- revisar a continuidade visual e funcional do fluxo principal completo;
- validar a Central em estados rico, vazio, legado e corrompido;
- resolver apenas inconsistências comprovadas de hierarquia, densidade, tipografia, cor semântica e retorno de navegação;
- registrar baseline em 1366×768, 1440×900, 390×844 e 320×568.

Não inclui uma nova releitura estética do dashboard. O sistema vigente é o [`Sistema Visual Lúmen Vivo`](design/NQ_LUMEN_VISUAL_SYSTEM_V1.md), não a antiga paleta roxo/dourado do roadmap arquivado.

### NQ-05 — Receita e funil verdadeiros

**Status:** `BLOQUEADO`
**Resultado:** provar que uma intenção de compra se converte em premium de forma idempotente, observável e atribuível.

Escopo:

- mensal e vitalício;
- preference → checkout → webhook → perfil premium;
- repetição de webhook e recuperação após retorno/cancelamento;
- comportamento web e TWA;
- funil `paywall_shown → plan_selected → checkout_started → payment_confirmed`;
- `payment_confirmed` derivado de verdade do backend, não de simulação no cliente.

Bloqueio: liberação do proprietário e acesso ao ambiente de teste do Mercado Pago.

### Fila seguinte

| ID | Resultado | Status | Dependências | Critério essencial |
|---|---|---|---|---|
| NQ-06 | **Páginas internas Lúmen** — Estudo/Revisão → Oráculo → Forja/Inventário → Simulado → Conta/Paywall | `PRONTO PARA INICIAR` após NQ-04 | Inventário e aprovação da vertical atual | Uma superfície por entrega, com todos os estados e caminho de volta completos |
| NQ-07 | **Plano semanal de aprendizagem** — prescrição determinística, explicável e iniciável em um clique | `EM DESCOBERTA` | FSRS, competências confiáveis, tempo disponível e rotas de estudo | IA pode explicar o plano; não pode inventar prioridade, progresso ou disponibilidade |
| NQ-08 | **Proveniência editorial no produto** — histórico de alteração, evidência, veredito, autoria e publicação | `EM DESCOBERTA` | NQ-00 e decisão Git/CI versus banco/admin | Complementar os documentos canônicos sem duplicar ou enfraquecer o gate editorial |
| NQ-09 | **Distribuição Android PT-BR** | `BLOQUEADO` | NQ-03, NQ-05, conta Play, APK e SHA-256 | Pagamento, privacidade, suporte, assets e `assetlinks.json` verificados antes da submissão |

### Ordem das páginas internas

1. **Estudo e revisão:** maior ligação direta entre diagnóstico, FSRS e próxima ação.
2. **Oráculo:** contexto clínico e estados de IA, limite, erro e indisponibilidade.
3. **Forja, inventário e progressão:** transformar domínio real em desejo de evolução do personagem.
4. **Simulado:** início, prova, retomada e resultado como fluxo próprio.
5. **Conta, planos e pagamento:** somente junto da validação de receita.

Mapa, Grimório, Conquistas e Ranking já vivem na Central; melhorias futuras devem partir de uso medido, não de recriação automática como páginas separadas.

## Depois

- inventário de strings e arquitetura i18n;
- tradução médica para inglês sob gate editorial e revisão bilíngue próprios;
- Google Play em inglês;
- iOS após decisão de estratégia e monetização;
- novas expansões de IA, parcerias e modos somente após evidência de retenção e operação estável.

## Decisões e bloqueios do proprietário

| Decisão/acesso | Desbloqueia | Evidência necessária |
|---|---|---|
| Ambiente de teste Mercado Pago | NQ-05 e NQ-09 | Credenciais de teste, mensal e vitalício confirmados |
| Consoles Supabase, Sentry e GA4 | NQ-03 | Logs/eventos da release e horário da validação |
| Conta Google Play e APK assinado | NQ-09 | SHA-256 e checklist do Console |
| E-mail `contato@nefroquest.com` | contato e suporte de loja | Caixa ativa e entrega testada |
| Revisor médico bilíngue | tradução EN | glossário, lote-piloto e veredito editorial |

## Despriorizado agora

- executar a antiga sequência F0–F7 ou restaurar sua paleta “definitiva”;
- criar outra biblioteca genérica de componentes antes de duas telas provarem reutilização;
- usar cor para diferenciar navegação equivalente;
- adicionar progresso, tendência ou domínio simulados;
- premiar pressa, madrugada, maratona ou volume sem benefício pedagógico;
- gerar plano semanal com IA antes de existir versão determinística auditável;
- iOS/inglês antes de validar retenção, suporte e monetização em PT-BR;
- manter catálogo de plugins como backlog do produto.

## Gates permanentes

### Definition of Ready

- problema e usuário afetado;
- resultado e métrica/baseline;
- escopo e não escopo;
- fonte de cada dado mostrado;
- dependências, bloqueios e responsável;
- estados vazio, loading, erro, legado e premium quando aplicáveis;
- plano de teste, observabilidade e rollback;
- gate médico identificado quando houver conteúdo clínico.

### Definition of Done

- critérios funcionais verificados no navegador;
- nenhum valor simulado apresentado como dado real;
- hover, teclado, toque e foco equivalentes;
- `prefers-reduced-motion` preserva todo o significado;
- nenhuma animação infinita distrativa ou movimento que cause layout shift;
- contraste, zoom, leitor de tela e alvos de toque proporcionais ao risco;
- testes de regressão e gates de CI verdes, sem esconder flake;
- segurança e privacidade verificadas;
- versão, Service Worker e cache-busters coerentes quando assets mudarem;
- smoke em produção e observabilidade confirmados;
- PR, versão, evidência e decisão do proprietário registrados.

## Marcos publicados

| Marco | Estado |
|---|---|
| Segurança, PWA, FSRS, IRT, Ritual, Simulado, Biblioteca e operações editoriais anteriores | `PUBLICADO` — detalhes no roadmap legado e no histórico Git |
| Portal, Átrio, Dificuldade e Câmara de Conduta Lúmen | `PUBLICADO` |
| Central de Inteligência e Seleção de Classe — v14.50–v14.75 | `PUBLICADO` — auditado em 21/08/2026 |
| Automação de release/cache, desempenho, acessibilidade do boss e correção de estado de combate | `PUBLICADO` — PRs #747–#761 |

## Referências canônicas

- Direção visual: [`design/NQ_LUMEN_VISUAL_SYSTEM_V1.md`](design/NQ_LUMEN_VISUAL_SYSTEM_V1.md)
- Sequência detalhada do redesign: [`design/NQ_INTERNAL_REDESIGN_ROADMAP_V1.md`](design/NQ_INTERNAL_REDESIGN_ROADMAP_V1.md)
- Qualidade: [`QA_CHECKLIST.md`](QA_CHECKLIST.md)
- Regras de decisão: [`DECISION_RULES.md`](DECISION_RULES.md)
- Modelo de conhecimento: [`editorial/NQ_KNOWLEDGE_MODEL_v1.md`](editorial/NQ_KNOWLEDGE_MODEL_v1.md)
- Handbook editorial: [`editorial/NQ_EDITORIAL_HANDBOOK_v1.md`](editorial/NQ_EDITORIAL_HANDBOOK_v1.md)
- Especificidades de nefrologia: [`editorial/annex-c-nefrologia.md`](editorial/annex-c-nefrologia.md)
- Planos técnicos históricos: [`../plans/README.md`](../plans/README.md)
