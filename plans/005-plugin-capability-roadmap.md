# Plan 005: Avaliação de capacidade de TODOS os plugins + roadmap de melhoria do NefroQuest

> **Natureza**: documento estratégico. Avalia os ~28 plugins instalados e mapeia cada um a
> melhorias concretas do NefroQuest. Não altera código por si só — cada tema selecionado vira
> execução (PR/plano próprio). Complementa o [plano 004](004-plugin-exploration.md) (que já
> explorou Sentry, browser, Supabase, context7, evidência médica, Playwright, Vercel).
>
> **Planned at**: commit `fc1fc22`, v12.37, 2026-06-26 · **Categoria**: dx/ops/direção

## Contexto

O usuário instalou ~28 plugins. O objetivo aqui é honesto: dizer **o que cada um pode render
para o NefroQuest** (app: jogo educacional de nefrologia, vanilla JS SPA + Supabase, ainda
**não lançado**), separar sinal de ruído, e propor um **roadmap priorizado** de melhorias
ancorado nas capacidades reais de cada plugin.

Princípio: o NefroQuest precisa ficar "redondo" antes do lançamento. As maiores alavancas são
**qualidade de código** (codebase grande sem framework), **segurança** (auth + pagamento +
médico), **conteúdo médico** (revisar as ~994 questões) e **UX/visual** (polir antes de divulgar).

---

## Parte A — Avaliação de capacidade dos plugins

### A1. Já alavancados nesta sessão (provados úteis)

| Plugin | Capacidade | Uso no NefroQuest | Veredito |
|--------|-----------|-------------------|----------|
| **Sentry** | Monitoramento de erros, triagem | Saúde pós-deploy; release tracking consertado; triagem semanal agendada | ✅ em uso contínuo |
| **Supabase** | Backend ao vivo (advisors, RLS, functions, SQL, migrations) | Auditoria de segurança; achou checkout quebrado; migration 016 aplicada | ✅ alto valor |
| **Bio research** (PubMed, ClinicalTrials, ChEMBL, Consensus, bioRxiv, OpenTargets, BioRender…) | Evidência médica de fonte primária | Validação de questões (piloto finerenona ✓) | ✅ alto valor — motor da revisão de questões |
| **Context7** | Docs de bibliotecas vigentes | Resolveu padrão `is_admin`/SECURITY DEFINER | ✅ ferramenta de apoio |
| **Playwright** | Automação de navegador / E2E | Verificou prod (IRT, v12.37) | ✅ útil |
| **Vercel** | Deploy/hosting/config | `vercel.json` auditado (já sólido) | ✅ sem ação necessária |
| **Mercadopago** | Pagamentos (test users, webhooks, checklist) | Virada de conta + teste de checkout | ⏸️ em espera (decisão do usuário) |
| **Commit commands / Code review / Feature dev / Superpowers / Remember** | Workflow de engenharia | Usados o tempo todo (PRs, debugging, TDD, memória) | ✅ meta-suporte |

### A2. Alto valor, AINDA NÃO alavancados (a oportunidade real)

| Plugin | Capacidade | Oportunidade concreta no NefroQuest | Valor |
|--------|-----------|--------------------------------------|-------|
| **Greptile** | Busca/revisão semântica de codebase por IA | Revisão profunda do `game.js` (~5000 linhas) e dos 24k linhas de JS sem framework — achar bugs, código morto, inconsistências, duplicação entre os 3 minigames | **ALTO** |
| **Security guidance** | Revisão/orientação de segurança | Auditoria focada: auth, webhook MP (HMAC), RLS, XSS (38 sites de innerHTML), edge functions, exposição de chaves | **ALTO** |
| **PR review toolkit** | Revisão multi-agente (silent-failure-hunter, type-design, test-analyzer, comment-analyzer) | Caçar **falhas silenciosas** (o código tem ~23 `catch {}` vazios) e lacunas de teste antes de cada merge | **ALTO** |
| **Design** (accessibility-review, design-critique, ux-copy, user-research, design-system, design-handoff) | UX/UI e acessibilidade | Acessibilidade WCAG além dos testes axe atuais; crítica de UX das telas do jogo; melhorar microcopy PT-BR; consolidar o design-system PED-4 | **ALTO** (polir pré-lançamento) |
| **Frontend design** | Direção visual distintiva | Elevar o tema medieval além do "templado"; polir telas (landing, jogo, paywall) | **MÉDIO-ALTO** |
| **Code simplifier** | Simplificação de código | Reduzir o god-module `game.js`; consolidar os 38 innerHTML e os catches vazios (pareado com testes de caracterização) | **MÉDIO-ALTO** (risco sem teste) |
| **Typescript lsp** | Diagnóstico TS type-aware | Navegação/erros de tipo nas 7 Edge Functions (Deno/TS) — pegou-se atrito em `send-push` | **MÉDIO** |
| **Adobe for creativity** | Edição/geração de imagem e vídeo | Assets do jogo: badges (5), imagens de classe por nível, splash screens iOS, imagens de divulgação pré-lançamento | **MÉDIO** |
| **Github** | Operações de repo/PR/issue | Automatizar triagem de issues, insights do repo, workflow de PRs | **MÉDIO** |
| **AI firstify** | Tornar o produto "AI-first" / features de IA | Avançar features de IA do roadmap (E2: plano de estudo semanal gerado por IA) — já há Oráculo/Diagnóstico (Haiku) | **MÉDIO** (alinha com roadmap) |
| **Figma** | Design files / Code Connect | Desenhar/iterar UI em Figma e gerar componentes — só se você quiser um fluxo de design formal | **MÉDIO** (situacional) |

### A3. Meta / suporte (úteis indiretamente, baixo encaixe direto)

| Plugin | Para quê | NefroQuest |
|--------|----------|-----------|
| **Claude md management** | Manter o CLAUDE.md | **Win rápido**: o CLAUDE.md diz "Versão atual: 12.30" mas o app está em 12.37 — desatualizado. Auditar/atualizar. |
| **Plugin dev** | Criar plugins | Baixo, salvo automação custom do NefroQuest |
| **Session report** | Relatório de uso de sessão | Meta; útil p/ revisar custo/uso |
| **Notion** | Base de conhecimento | Sincronizar roadmap/tracking de revisão de questões (nice-to-have) |

### A4. Ruído para este projeto (reconhecidos; pular salvo pedido)
Plugins de PM/colaboração corporativa que não mapeiam para a fase atual (pré-lançamento, time de 1):
Asana, Atlassian, Intercom, Linear, Slack (vêm no bundle "design"), Canva, Google Drive,
computer-use, e os gated do bio-research (Owkin/Synapse/Wiley — exigem login institucional).

---

## Parte B — Roadmap de melhoria priorizado (por tema, citando os plugins)

Ordenado por leverage para deixar o app "redondo" antes do lançamento.

### Fase 1 — Qualidade e segurança do que já existe (antes de divulgar)

1. **Auditoria de segurança focada** — *plugins: Security guidance + Supabase + PR review toolkit (silent-failure-hunter)*
   - Revisar: webhook MP (HMAC/idempotência), RLS das tabelas sensíveis, os 38 `innerHTML`, as ~23 `catch {}` vazias, exposição de chaves no front. Saída: lista priorizada → fixes.
2. **Revisão profunda do código** — *plugins: Greptile + Code review + PR review toolkit*
   - Varredura semântica do `game.js` e cia: bugs, código morto, duplicação entre minigames, estados impossíveis. Saída: achados → PRs.
3. **Typecheck das Edge Functions** — *plugin: Typescript lsp* — fechar atritos de tipo nas 7 functions (o `deno check` já é bloqueante no CI).
4. **Atualizar CLAUDE.md** — *plugin: Claude md management* — está em 12.30 vs app 12.37; refletir IRT, design-system, estado das functions.

### Fase 2 — Conteúdo médico (a meta declarada: "questões revisadas")

5. **Revisão sistemática das ~994 questões** — *plugins: Bio research (Consensus/PubMed/ChEMBL/ClinicalTrials) + skill revisar-nefroquest*
   - Triagem por risco (doses, condutas, guidelines recentes, fármacos novos) → verificação com fontes primárias → correções. (Você pediu para deixar por último — fica aqui, pronta para quando quiser.)
6. **Ilustrações médicas dos cards** — *plugin: BioRender (bio-research)* — figuras científicas para explicações/cards do Grimório (opcional, eleva valor pedagógico).

### Fase 3 — UX, acessibilidade e visual (polimento pré-lançamento)

7. **Auditoria de acessibilidade WCAG** — *plugins: Design (accessibility-review) + Playwright* — além dos testes axe atuais; teclado, contraste, leitores de tela.
8. **Crítica de UX + microcopy** — *plugins: Design (design-critique, ux-copy)* — telas do jogo, paywall, onboarding (Ritual); refinar PT-BR.
9. **Polimento visual + assets** — *plugins: Frontend design + Adobe for creativity* — elevar o tema medieval; gerar/retocar badges, imagens de classe, splash, imagens de divulgação.
10. **Consolidar o design-system PED-4** — *plugins: Design (design-system) + Figma (opcional)*.

### Fase 4 — Features e direção (pós-redondo)

11. **E2 — plano de estudo semanal por IA** — *plugins: AI firstify + Feature dev* — trilhas geradas por IA a partir dos erros (roadmap E2, ainda não iniciado).
12. **Mercado Pago — virada + teste de checkout** — *plugin: Mercadopago* — quando o app estiver redondo (em espera agora).
13. **Automação de repo** — *plugins: Github + scheduled-tasks* — triagem recorrente de issues/PRs (já há triagem Sentry semanal).

---

## Recomendação de início

Maior leverage agora, pré-lançamento: **Fase 1** (qualidade + segurança), porque conserta riscos
reais antes de divulgar e é majoritariamente autônoma (revisão de código + fixes). Sugestão de
ordem de ataque: **#1 (segurança) → #2 (Greptile review) → #4 (CLAUDE.md, win rápido) → #3 (TS)**.
Depois Fase 3 (UX/visual) para o polimento, e Fase 2 (questões) quando você liberar.

## Tabela de status

| # | Tema | Plugins | Fase | Status |
|---|------|---------|------|--------|
| 1 | Auditoria de segurança | Security guidance, Supabase, PR review toolkit | 1 | TODO |
| 2 | Revisão profunda de código | Greptile, Code review, PR review toolkit | 1 | TODO |
| 3 | Typecheck Edge Functions | Typescript lsp | 1 | TODO |
| 4 | Atualizar CLAUDE.md | Claude md management | 1 | TODO |
| 5 | Revisão das ~994 questões | Bio research, revisar-nefroquest | 2 | TODO (usuário pediu por último) |
| 6 | Ilustrações de cards | BioRender | 2 | TODO (opcional) |
| 7 | Acessibilidade WCAG | Design, Playwright | 3 | TODO |
| 8 | Crítica UX + microcopy | Design | 3 | TODO |
| 9 | Polimento visual + assets | Frontend design, Adobe | 3 | TODO |
| 10 | Design-system PED-4 | Design, Figma | 3 | TODO |
| 11 | E2 plano de estudo IA | AI firstify, Feature dev | 4 | TODO |
| 12 | Virada Mercado Pago | Mercadopago | 4 | EM ESPERA |
| 13 | Automação de repo | Github, scheduled-tasks | 4 | TODO |

## Notas
- Cada tema selecionado vira execução própria (PR ou plano numerado). Este doc é o mapa.
- Plugins que exigem OAuth (alguns bio-research, Notion, Figma) só conectam com seu OK na hora.
- "Ruído para o projeto" (Asana/Slack/Canva/Drive/computer-use…) listado por honestidade — pular salvo pedido.
