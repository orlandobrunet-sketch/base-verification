# NefroQuest: Ascension — Contexto do Projeto para Claude

## O que é o NefroQuest

NefroQuest é um jogo RPG educacional de perguntas e respostas sobre Nefrologia, voltado para estudantes de medicina e residentes. O jogador escolhe uma classe de personagem, responde questões de nefrologia, sobe de nível, coleta equipamentos e derrota o "Arqui-Nefromante" ao acertar 100 questões.

- **URL de produção:** https://nefroquest.com
- **Repositório GitHub:** orlandobrunet-sketch/base-verification
- **Branch principal:** `main`
- **Branch de trabalho atual:** `claude/fix-nefroquest-migration-pCkmH`
- **Versão atual:** 9.23
- **Hospedagem:** GitHub Pages (CNAME aponta para nefroquest.com) + Vercel (vercel.json presente)
- **Domínio customizado:** nefroquest.com

---

## Estrutura de Arquivos

```
/
├── index.html          # App principal — toda a UI do jogo está aqui (SPA)
├── style.css           # Estilos globais (tema dark medieval, variáveis CSS)
├── sw.js               # Service Worker — cache offline e versioning
├── manifest.json       # PWA manifest
├── version.json        # {"version": "9.23"} — controla invalidação de SW
├── 404.html            # Página 404
├── offline.html        # Página offline
├── clear-cache.html    # Redireciona após limpar SW cache
├── CNAME               # nefroquest.com
├── vercel.json         # Configuração Vercel
├── robots.txt / sitemap.xml / favicon.ico

├── js/
│   ├── game.js         # Lógica principal do jogo (RPG, badges, batalha, IA)
│   ├── utils.js        # Utilitários: streak, analytics, toast, spaced repetition
│   ├── leaderboard.js  # Ranking global (fetch/push para Supabase)
│   ├── audio.js        # Sistema de áudio
│   └── study-mode.js   # Modo estudo (fora do jogo principal)

├── data/
│   ├── topics.js       # ~1.4 MB — banco de questões de nefrologia (lazy loaded)
│   ├── articles.js     # Artigos de referência
│   ├── rapid-quiz.js   # Questões do modo quiz rápido
│   └── refs.js         # Referências bibliográficas

├── assets/
│   ├── audio/          # welcome-theme.mp3
│   ├── badges/         # badge1-5 (.jpg e .png)
│   ├── classes/        # Imagens dos personagens por nível (clerigo_renal, guerreiro_glomerular, maga_metabolica)
│   └── images/         # Favicons, splash screens iOS (múltiplos tamanhos)

├── supabase/
│   ├── config.toml     # project_id = "wviutasgroltjuyxpevc"
│   ├── migrations/
│   │   ├── 001_payment_columns.sql  # Colunas premium na tabela profiles
│   │   ├── 002_leaderboard_rls.sql  # RLS + user_id + constraints no leaderboard
│   │   └── 003_ai_usage.sql         # Tabela de quota diária de IA
│   └── functions/
│       ├── ai-mentor/index.ts        # Oráculo dos Néfrons (explicação de questões)
│       ├── ai-diagnosis/index.ts     # Diagnóstico de lacunas de conhecimento
│       ├── send-flag/index.ts        # Reportar erros em questões (Web3Forms)
│       ├── send-contact/index.ts     # Formulário de contato (Web3Forms)
│       ├── create-mp-preference/index.ts  # Pagamento Mercado Pago
│       └── mp-webhook/index.ts           # Webhook de confirmação de pagamento

├── tests/              # Playwright E2E tests
│   ├── package.json
│   ├── playwright.config.ts
│   └── specs/
│       ├── 01-landing.spec.ts
│       ├── 02-gameplay-basic.spec.ts
│       ├── 03-answer-feedback.spec.ts
│       ├── 04-progression.spec.ts
│       ├── 05-boss-mode.spec.ts
│       ├── 06-security.spec.ts
│       ├── 07-leaderboard.spec.ts
│       ├── 08-save-migration.spec.ts
│       └── 09-unit-pure-functions.spec.ts

└── .github/workflows/ci.yml  # CI pipeline
```

---

## Backend — Supabase

### Projeto Supabase
- **Project ID:** `wviutasgroltjuyxpevc`
- **URL:** `https://wviutasgroltjuyxpevc.supabase.co`

### Tabelas do Banco de Dados

#### `profiles`
Armazena dados do usuário autenticado.
- Colunas base: padrão Supabase Auth
- Colunas adicionadas (migration 001):
  - `premium_plan` TEXT — `'monthly'` ou `'lifetime'`
  - `premium_expires_at` TIMESTAMPTZ — NULL = vitalício
  - `premium_updated_at` TIMESTAMPTZ
  - `mp_payment_id` TEXT — ID do pagamento no Mercado Pago
- `is_premium` BOOLEAN — campo existente anterior, usado para checar acesso

#### `leaderboard`
Ranking global de jogadores.
- Colunas: `id`, `player_name`, `score`, `level`, `created_at`
- Colunas adicionadas (migration 002):
  - `user_id` UUID REFERENCES auth.users — permite 1 entrada por usuário
- RLS habilitada: leitura pública, escrita apenas pelo próprio usuário
- Índice único em `user_id` (exceto NULL — entradas anônimas permitidas)
- Constraints: `score` 0–9.999.999, `level` 1–999, `player_name` 1–40 chars

#### `ai_usage`
Quota diária de uso de IA por usuário (migration 003).
- `(user_id, feature, date)` — chave primária composta
- `feature` TEXT CHECK IN ('mentor', 'diagnosis')
- `count` INTEGER — uso acumulado no dia
- RLS: usuário lê apenas suas próprias linhas; escrita só via service role

### Migrations Realizadas
| # | Arquivo | Status |
|---|---------|--------|
| 001 | `001_payment_columns.sql` | Aplicada |
| 002 | `002_leaderboard_rls.sql` | Aplicada |
| 003 | `003_ai_usage.sql` | Aplicada (última ação) |

---

## Edge Functions

Todas as funções rodam no Supabase Edge (Deno). CORS configurado para aceitar:
- `https://nefroquest.com`
- `https://www.nefroquest.com`
- `*.vercel.app` (preview deploys)
- `localhost` / `127.0.0.1` (desenvolvimento)

### `ai-mentor`
- **Propósito:** "Oráculo dos Néfrons" — explica questões erradas ao aluno via Claude Haiku
- **Modelo:** `claude-haiku-4-5-20251001`
- **Quota:** 5 consultas/dia para usuários free; ilimitado para premium
- **Env vars necessárias:** `ANTHROPIC_API_KEY`, `SUPABASE_URL` (auto), `SUPABASE_SERVICE_ROLE_KEY` (auto)
- **Endpoint:** POST com `{ questionText, options, correctOption, explanation, userQuestion, history }`

### `ai-diagnosis`
- **Propósito:** Diagnóstico de lacunas de conhecimento ao final da sessão
- **Modelo:** `claude-haiku-4-5-20251001`
- **Quota:** 3 consultas/dia para usuários free; ilimitado para premium
- **Env vars necessárias:** `ANTHROPIC_API_KEY`, `SUPABASE_URL` (auto), `SUPABASE_SERVICE_ROLE_KEY` (auto)
- **Endpoint:** POST com `{ axes: [{name, correct, wrong}], totalCorrect, totalWrong, accuracy }`

### `send-flag`
- **Propósito:** Proxy para reportar erros em questões via Web3Forms (sem expor a chave no cliente)
- **Env vars necessárias:** `WEB3FORMS_KEY`
- **Endpoint:** POST com `{ subject, message }`

### `send-contact`
- **Propósito:** Formulário de contato via Web3Forms
- **Env vars necessárias:** `WEB3FORMS_KEY`
- **Endpoint:** POST com `{ name, email, message }`

### `create-mp-preference`
- **Propósito:** Cria preferência de pagamento no Mercado Pago e retorna URL de checkout
- **Planos:** `monthly` (R$14,90) | `lifetime` (R$199,00)
- **Env vars necessárias:** `MP_ACCESS_TOKEN`, `APP_URL`, `MP_SANDBOX`
- **Requer:** usuário autenticado (JWT obrigatório)

### `mp-webhook`
- **Propósito:** Recebe notificação de pagamento aprovado do Mercado Pago e atualiza `profiles`

### `send-push`
- **Propósito:** Envia Web Push notifications para um usuário ou para todos os assinantes (admin only via service-role key)
- **Auth:** Requer `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` — não exposto ao cliente
- **Env vars necessárias:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL` (auto), `SUPABASE_SERVICE_ROLE_KEY` (auto)
- **Endpoint:** POST com `{ userId?: string, title: string, body: string, url?: string, tag?: string }`

---

## Configuração de Variáveis de Ambiente nas Edge Functions

| Função | Variável | Fonte |
|--------|----------|-------|
| ai-mentor | `ANTHROPIC_API_KEY` | Anthropic Console |
| ai-mentor | `SUPABASE_URL` | Injetada automaticamente |
| ai-mentor | `SUPABASE_SERVICE_ROLE_KEY` | Injetada automaticamente |
| ai-diagnosis | `ANTHROPIC_API_KEY` | Anthropic Console |
| ai-diagnosis | `SUPABASE_URL` | Injetada automaticamente |
| ai-diagnosis | `SUPABASE_SERVICE_ROLE_KEY` | Injetada automaticamente |
| send-flag | `WEB3FORMS_KEY` | Web3Forms Dashboard |
| send-contact | `WEB3FORMS_KEY` | Web3Forms Dashboard |
| create-mp-preference | `MP_ACCESS_TOKEN` | Mercado Pago |
| create-mp-preference | `APP_URL` | `https://nefroquest.com` |
| mp-webhook | `MP_ACCESS_TOKEN` | Mercado Pago |
| send-push | `VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` |
| send-push | `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` |
| send-push | `VAPID_SUBJECT` | `mailto:admin@nefroquest.com` |

---

## Sistema de Autenticação e Premium

- **Auth:** Supabase Auth (email/password, magic link)
- **Verificação de premium:** `user.app_metadata.premium === true` OU `user.app_metadata.is_admin === true`
- **isPremium() no cliente:** exige `authUser` autenticado — não concede premium para anônimos
- **Pagamento:** Mercado Pago (preference → checkout → webhook → atualiza profiles)

---

## Mecânicas do Jogo

### Classes de Personagem (3 opções)
1. **Guerreiro Glomerular** — tanque, bônus em defesa
2. **Maga Metabólica** — maga, bônus em poder mágico
3. **Clérigo Renal** — suporte, bônus em cura

Cada classe tem 10 níveis de imagens (`assets/classes/<nome>/nivel_01.jpg` ... `nivel_10.jpg`)

### Progressão
- 100 questões corretas = fim de jogo (derrota o Arqui-Nefromante)
- Pontuação com multiplicador de streak (x1.25 / x1.5 / x1.75 / x2 / x2.5)
- Streak começa em x1.25 aos 3 acertos seguidos, máximo x2.5 com 15+

### Badges (5 total)
| Badge | Requisito (acertos totais) |
|-------|--------------------------|
| Vórtice do Néfron | 20 |
| Sábio do Microscópio | 40 |
| Guardião das Águas | 60 |
| Árbitro dos Rins | 80 |
| Ascendido do NefroQuest | 100 |

### Dificuldades
- Normal e **Hardcore** (salvo em `localStorage.nefroquest-hardcore-completed`)

### Banco de Questões
- Arquivo: `data/topics.js` — ~1.4 MB, lazy loaded (carregado sob demanda)
- Contém questões organizadas por eixo temático de nefrologia
- Eixos incluem: glomerulopatias, hipertensão, ERC, distúrbios ácido-base, diálise, etc.

---

## PWA e Service Worker

- **SW versão:** controlada por `version.json` — ao detectar versão diferente, redireciona para `clear-cache.html`
- **Cache busting:** `?v=9.26` nos assets principais
- **iOS PWA:** splash screens para múltiplos tamanhos de iPhone/iPad
- **Offline:** página `offline.html` servida pelo SW quando sem conexão

---

## Analytics e Monitoramento

- **Sentry:** monitoramento de erros (DSN configurado inline no `index.html`, release `nefroquest@9.26`)
- **GA4 (Google Analytics):** via `gtag()` — eventos rastreados:
  - `game_started`, `question_answered`, `boss_entered`
  - `game_completed`, `paywall_shown`, `premium_converted`

---

## Leaderboard

- **Dados:** Supabase tabela `leaderboard`
- **Cache client-side:** 30 segundos (TTL) + fallback em localStorage (5 min)
- **Rate limiting:** 1 push por sessão de jogo
- **Top 50** jogadores exibidos, ordenados por score desc → level desc

---

## Fluxo de Deploy

1. **GitHub Pages** — branch `main` → nefroquest.com (automático)
2. **Supabase Edge Functions** — redeploy manual no Dashboard do Supabase
3. **Migrações SQL** — rodar manualmente no SQL Editor do Supabase
4. **Variáveis de Ambiente** — configurar no Dashboard: Project Settings → Edge Functions

### Como fazer redeploy de uma Edge Function
No Supabase Dashboard → Edge Functions → selecionar a função → Deploy / Redeploy

---

## Histórico de Tarefas Concluídas

- [x] Migration 001 — colunas de pagamento em `profiles`
- [x] Migration 002 — RLS + user_id no leaderboard
- [x] Migration 003 — tabela `ai_usage` para quota de IA
- [x] Redeploy das edge functions: `ai-mentor`, `ai-diagnosis`, `send-flag`, `send-contact`
- [x] Variável `WEB3FORMS_KEY` adicionada nas funções `send-flag` e `send-contact`
- [x] Segurança: cotas de IA movidas para edge function com banco (server-side)
- [x] Segurança: `isPremium()` exige `authUser` autenticado — nunca concede via localStorage
- [x] Segurança: z-index padronizado via variáveis CSS no `:root`
- [x] Performance: `topics.js` (~1,4 MB) convertido para lazy loading (dynamic import)
- [x] PWA: iOS splash screens adicionados para múltiplos tamanhos de iPhone/iPad
- [x] UI: banner do Oráculo + redesign do card de study mode
- [x] Fix: `adminJumpToBoss()` — aguarda topics.js + chama shuffleQueue/renderHUD/updateBossUI
- [x] Fix: Oráculo — pergunta truncada em 120 chars (removido `_firstSentence`, exibe texto completo)
- [x] Segurança: CSP completada — `media-src 'self'`, `worker-src 'self'` adicionados; `api.web3forms.com` removido de connect-src (browser não chama diretamente)
- [x] Performance: Google Fonts não-render-blocking (`media="print"` + `onload` + `<noscript>` fallback)
- [x] Performance: SDK Supabase já estava no fim do `<body>` — não bloqueia renderização (P2 era falso positivo)
- [x] Performance: `loading="lazy"` — já presente em todas as imagens (P4 já estava feito)
- [x] Performance: `font-display: swap` — já configurado via `display=swap` no URL do Google Fonts (P3 já estava feito)
- [x] C1: `!important` — 321 ocorrências reduzidas para ~99 (removidos 222 do bloco `.arqui-nefromante-final`)
- [x] C2: z-index centralizado — `.app` e `.action-dock` migrados para `var(--z-app)`
- [x] A4: Event delegation — todos os `onclick=` inline migrados para dispatcher central (`data-action`, `data-close-closest`, etc.)
- [x] A1: game.js modularizado — 6180 → 3094 linhas; 9 módulos extraídos: `admin.js`, `minigame.js`, `achievements.js`, `changelog.js`, `auth.js`, `paywall.js`, `account.js`, `boss.js`, `exam.js`
- [x] A2: Store central de estado — `state` wrapped em Proxy que auto-invalida statsCache e debounce-salva a cada 500ms
- [x] W1: Screenshots no manifest — `screenshot-mobile.png` e `screenshot-desktop.png` já presentes (verificado)
- [x] W3: Push notifications server-side — migration 004, edge function `send-push`, `js/notifications.js`, listener `push` no SW
- [x] Versão atual: **9.26**

---

## Roadmap do Projeto

> Avaliação estratégica externa (escala 8.2/10): "Isso tem alma. Potencial para ser o Duolingo da Medicina na LATAM. Objetivo não é um jogo bonito — é fazer médicos **melhores** mais rápido." — Relatório de Primeiro Princípios, mai/2026

---

### CRÍTICO — Bugs ativos
| # | Bug | Arquivo | Status |
|---|-----|---------|--------|
| B1 | Fase Final (admin): tela de perguntas não muda ao ativar | `js/game.js:adminJumpToBoss` | **Corrigido** |
| B2 | Oráculo: pergunta cortada na exibição do contexto | `js/study-mode.js:1248` | **Corrigido** |
| B3 | Clear-cache loop no boot (LOADED_VERSION desatualizada) | `index.html:83` | **Corrigido v9.26** |
| B4 | `saveNewPassword` não exposta no `window` (Sentry) | `js/auth.js` | **Corrigido v9.26** |

---

### FASE 1 — Produto-Core (Próximas 4–6 Semanas)
*Alta alavancagem: sem escala, sem impacto.*

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| F1-1 | **Banco de questões dinâmico** | Migrar `data/topics.js` (~1.4 MB estático) para tabela Supabase com colunas `id, topic, question, options, answer, explanation, difficulty, source, flagged`. Criar Edge Function `get-questions` com paginação e filtro por eixo. Admin panel simples para curadoria. | Pendente |
| F1-2 | **Adaptive Learning real** | Ampliar spaced repetition além do atual: pesos por eixo fraco (dados de `_studyAxisStats`), fila de revisão priorizada por taxa de erro individual, integração com `ai-diagnosis` para ajustar fila automaticamente. | Pendente |
| F1-3 | **Admin panel de questões** | Tela admin (isAdminUser) para adicionar/editar/desativar questões diretamente no Supabase, visualizar flags de erro acumuladas e marcar revisão. Substitui scripts Python manuais. | Pendente |
| F1-4 | **CI/CD Edge Functions** | GitHub Actions: deploy automático de `ai-mentor`, `ai-diagnosis`, `send-push` via `supabase functions deploy` no push para `main`. Atualmente é manual no Dashboard. | Pendente |
| F1-5 | **Cache de respostas IA** | Edge Function `ai-mentor`: cachear explicações de questões já respondidas em tabela `ai_cache (question_hash, explanation, created_at)`. Reduz custo Anthropic ~60-80% para questões populares. | Pendente |

---

### FASE 2 — Escala e Monetização (2–4 Meses)
*Crescimento e receita: DAU, conversão, App Stores.*

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| F2-1 | **App Stores (Capacitor)** | Empacotar SPA como app nativo iOS/Android via Capacitor. Publicar em App Store e Google Play como "NefroQuest: Ascension". PWA instalável já existe — wrapper nativo desbloqueia distribuição orgânica. | Pendente |
| F2-2 | **Analytics avançado** | Integrar PostHog (self-hosted ou cloud) para eventos granulares: tempo por questão, taxa de abandono por eixo, funil paywall→conversão, heatmap de cliques. Mover além do GA4. Cobrar semanalmente: DAU/MAU, D7/D30 retention, % completa 100 questões, custo IA por usuário ativo. | Pendente |
| F2-3 | **Expansão de conteúdo (DLCs)** | Módulos de Cardiologia, Pneumologia, Gastro como "DLCs" compráveis (ou incluídos no premium). Parcerias com ligas acadêmicas/residências para conteúdo validado por especialistas. | Pendente |
| F2-4 | **IA Melhorada (Sonnet para Premium)** | Oferecer Claude Sonnet (maior capacidade de raciocínio clínico) para assinantes premium no Oráculo. Free continua com Haiku. Adicionar opção de gerar questão complementar sobre o mesmo tema via IA. | Pendente |
| F2-5 | **Gamificação avançada** | Seasons (ranking reset mensal com recompensas), desafios semanais temáticos, guildas de estudo, leaderboards regionais (por estado/universidade), achievements cross-device sincronizados. | Pendente |
| F2-6 | **Multiplayer / Estudo Colaborativo** | Modo "duelo" assíncrono: dois jogadores respondem o mesmo set de questões, comparam acertos. Ou desafio semanal da comunidade com questão curada. | Pendente |

---

### FASE 3 — Empresa e Impacto (6+ Meses)
*Missão: ferramenta referência na formação médica da América Latina.*

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| F3-1 | **White-label / Institucional** | Versão para universidades e hospitais: custom branding, gestão de turmas (professor acompanha progresso dos alunos), relatórios exportáveis. Modelo B2B além do B2C. | Pendente |
| F3-2 | **Internacionalização (i18n)** | Suporte a EN e ES primeiro. Localizar lore (classes, Arqui-Nefromante) e questões. Desbloqueia mercado LATAM completo + EUA/Europa onde residentes brasileiros atuam. | Pendente |
| F3-3 | **Dados como produto** | Com consentimento explícito (LGPD/GDPR): relatórios anônimos de lacunas de conhecimento por eixo para pesquisa médica e programas de residência. "Onde os residentes brasileiros mais erram em Nefrologia?" | Pendente |
| F3-4 | **Open Source parcial (engine)** | Liberar game engine / core de gamificação como projeto separado para outros campos médicos (NutritionQuest, PneumoQuest). Incentiva contribuições e posiciona NefroQuest como referência técnica. | Pendente |
| F3-5 | **RAG sobre guidelines** | Edge Function com retrieval sobre KDIGO, SBN guidelines atualizadas. Oráculo passa a citar fontes atuais em vez de só explicar questões do banco. | Pendente |

---

### TECH DEBT — Manutenção e Qualidade
| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| T1 | Scripts Python → Admin Panel | `apply_reviews.py`, `review_questions.py` etc. devem ser substituídos pelo F1-3 (admin panel). Até lá, documentar uso em `scripts/README.md`. | Pendente |
| T2 | Backup automático do banco | Supabase scheduled backup habilitado + export semanal de `questions` table para JSON no repositório como fallback. | Pendente |
| T3 | Testes E2E expandidos | Adicionar suites para: fluxo premium (mock Mercado Pago), Oráculo multi-turn, push notifications, admin panel. Atualmente 9 suites cobrem happy paths. | Pendente |
| T4 | `prefers-reduced-motion` | Animações sem suporte a acessibilidade — adicionar media query global em `style.css`. | Pendente |
| T5 | Estilos inline JS → classes CSS | Mover estilos estáticos gerados por JS para classes CSS (C4 pendente). | Pendente |

---

### CONCLUÍDO — Referência Rápida
| Categoria | Itens concluídos |
|-----------|----------------|
| Segurança | CSP completa, isPremium() server-side, cotas IA no banco, Web3Forms proxy, JWT em edge functions |
| Performance | lazy load topics.js, font-display:swap, loading=lazy, Supabase no fim do body |
| Arquitetura JS | game.js 6180→3094 linhas (9 módulos), state Proxy reativo, event delegation, try-catch async |
| PWA | iOS splash screens, screenshots manifest, push notifications (send-push + SW listener) |
| CSS | !important 321→99, z-index centralizado, prefers-reduced-motion base |
| Backend | Migrations 001-004, RLS leaderboard, ai_usage quota, send-push migration |
| Bugs | adminJumpToBoss, Oráculo pergunta cortada, clear-cache loop, saveNewPassword Sentry |

---

### A TESTAR em produção (pós-redeploy)
- [ ] `ai-mentor` — Oráculo respondendo corretamente (multi-turn)
- [ ] `ai-diagnosis` — diagnóstico ao final de sessão com markdown
- [ ] `send-flag` — reportar erro em questão (checa `WEB3FORMS_KEY`)
- [ ] `send-contact` — formulário de contato
- [ ] `ai_usage` — quota contabilizada: `SELECT * FROM ai_usage ORDER BY date DESC LIMIT 10`
- [ ] Paywall premium — fluxo completo Mercado Pago (preference → checkout → webhook → profiles)
- [ ] Push notifications — rodar migration 004, configurar `VAPID_*` no Dashboard, setar `window._VAPID_PUBLIC_KEY`
- [ ] Clear-cache — confirmar que v9.26 não redireciona mais para `clear-cache.html`

---

### Métricas a Cobrar Semanalmente (KPIs de Saúde)
- **Engajamento:** DAU/MAU, retention D7/D30, % usuários completando 100 questões
- **Monetização:** conversão free→premium, receita MRR, churn mensal
- **Qualidade:** erros reportados por questão, acurácia média por eixo
- **IA:** custo Anthropic por usuário ativo, cache hit rate (após F1-5)
- **Técnico:** erros Sentry/semana, tempo médio de sessão, LCP mobile

---

## Convenções de Código

- **Linguagem do código:** JS vanilla no frontend, TypeScript nas Edge Functions (Deno)
- **Sem framework frontend** — SPA puro com HTML/CSS/JS
- **Variáveis CSS:** tema dark medieval com `var(--gold)`, `var(--txt-dim)`, etc.
- **Fontes:** Cinzel, Cinzel Decorative, Philosopher (Google Fonts)
- **Sem build step** — arquivos servidos diretamente (sem webpack/vite)

---

## Informações de Desenvolvimento

- **Supabase CLI:** `supabase/config.toml` presente mas edge functions são deployadas pelo Dashboard
- **Testes:** Playwright E2E em `/tests/` (9 suites de teste)
- **Python scripts:** `apply_reviews.py`, `review_questions.py`, etc. — utilitários para gerenciar questões
- **Auditoria:** arquivos `# Relatório de Auditoria 1.txt` e `relatório 2.txt` — histórico de reviews de questões
