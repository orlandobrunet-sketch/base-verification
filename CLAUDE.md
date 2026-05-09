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
- **Cache busting:** `?v=9.23` nos assets principais
- **iOS PWA:** splash screens para múltiplos tamanhos de iPhone/iPad
- **Offline:** página `offline.html` servida pelo SW quando sem conexão

---

## Analytics e Monitoramento

- **Sentry:** monitoramento de erros (DSN configurado inline no `index.html`, release `nefroquest@9.23`)
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

### CRÍTICO — Bugs ativos
| # | Bug | Arquivo | Status |
|---|-----|---------|--------|
| B1 | Fase Final (admin): tela de perguntas não muda ao ativar | `js/game.js:adminJumpToBoss` | **Corrigido** |
| B2 | Oráculo: pergunta cortada na exibição do contexto | `js/study-mode.js:1248` | **Corrigido** |

### ALTA PRIORIDADE — Segurança (restante)
| # | Tarefa | Detalhe |
|---|--------|---------|
| S1 | Chave Web3Forms proxy | Já em edge function (`send-flag`, `send-contact`) — **feito** |
| S2 | JWT nas edge functions | `ai-mentor` e `ai-diagnosis` já verificam JWT; `send-flag`/`send-contact` são públicas por design |
| S3 | Content Security Policy (CSP) | **Feito** — `media-src`, `worker-src` adicionados; `api.web3forms.com` removido |

### ALTA PRIORIDADE — Performance
| # | Tarefa | Detalhe |
|---|--------|---------|
| P1 | `topics.js` lazy load | **Feito** (v9.22) |
| P2 | SDK Supabase com `defer` | **Feito** — SDK já estava no fim do `<body>`, não bloqueia renderização |
| P3 | Fontes: `font-display: swap` | **Feito** — `display=swap` no URL Google Fonts + `media=print/onload` não-blocking |
| P4 | Imagens: `loading="lazy"` | **Feito** — já presente em todas as `<img>` |

### MÉDIA PRIORIDADE — PWA
| # | Tarefa | Detalhe |
|---|--------|---------|
| W1 | Screenshots no manifest | **Feito** — imagens e entradas no manifest já presentes |
| W2 | iOS splash screens | **Feito** (v9.21) |
| W3 | Push notifications server-side | **Feito** (v9.26) — migration 004 ✅, VAPID secrets ✅, `window._VAPID_PUBLIC_KEY` ✅. **Pendente**: fazer deploy da edge function `send-push` pelo Supabase Dashboard (não existe ainda — precisa ser criada/deployada manualmente via CLI ou upload) |

### MÉDIA PRIORIDADE — CSS/UI
| # | Tarefa | Detalhe |
|---|--------|---------|
| C1 | `!important` — reduzido | De 321 para ~99; restantes têm conflito legítimo com `.boss-battle-mode` — **concluído** |
| C2 | z-index centralizado | `.app` e `.action-dock` migrados; valores locais (0-3, 10-11 em stacking contexts) deixados como estão — **concluído** |
| C3 | `prefers-reduced-motion` | **Feito** — media query global no fim do `style.css` cobre todas as animações |
| C4 | Estilos inline JS → classes CSS | **Feito** — flag-chip, flag-status, ref-copy-btn, boss-hp, meter-result, minigame-fb migrados para classes CSS |

### BAIXA PRIORIDADE — Arquitetura JS
| # | Tarefa | Detalhe |
|---|--------|---------|
| A1 | Separar `game.js` | **Feito** — 6180 → 3094 linhas; 9 módulos extraídos |
| A2 | Store central de estado | **Feito** — Proxy reativo com debounce de 500ms + auto-invalidação de statsCache |
| A3 | `await`/`try-catch` em async | **Feito** — 7 funções de auth + authLogout + enableStudyReminders + floating promises |
| A4 | Event delegation | **Feito** — todos `onclick=` inline migrados para dispatcher central |

### A TESTAR em produção (pós-redeploy)
- [ ] `ai-mentor` — Oráculo respondendo corretamente
- [ ] `ai-diagnosis` — diagnóstico ao final de sessão
- [ ] `send-flag` — reportar erro em questão (checa se WEB3FORMS_KEY chegou)
- [ ] `send-contact` — formulário de contato
- [ ] `ai_usage` — quota sendo contabilizada na tabela (SQL: `SELECT * FROM ai_usage ORDER BY date DESC LIMIT 10`)
- [ ] Paywall premium — fluxo de compra Mercado Pago funcionando
- [ ] GA4 — verificar dados chegando no painel após fix do Measurement ID (G-0TS171XV3K)

### PENDENTE — Infraestrutura / Negócio
| # | Tarefa | Detalhe |
|---|--------|---------|
| I1 | Criar e-mail `contato@nefroquest.com` | Necessário para formulário de contato e identidade profissional |
| I2 | Testar fluxo completo de pagamento | Mercado Pago: preference → checkout → webhook → `profiles.is_premium = true`; testar plano mensal e vitalício |
| I3 | Deploy edge function `send-push` | Colar `supabase/functions/send-push/index.ts` no editor do Dashboard → nome `send-push` → Deploy |

### NOVA FEATURE — Minigame Ácido-Base
| # | Tarefa | Detalhe |
|---|--------|---------|
| M1 | Minigame Ácido-Base interativo | Modo de jogo educacional com narrativa que ensina diagnóstico e manejo de distúrbios ácido-base |

**Conceito do Minigame Ácido-Base:**
- **Narrativa:** o jogador é um "Alquimista Renal" chamado para equilibrar o pH do reino. Cada caso clínico é apresentado como uma missão — um personagem do reino com sintomas
- **Mecânica:** o jogador recebe gasometria (pH, PaCO2, HCO3, BE) e precisa: (1) identificar o distúrbio primário, (2) calcular a compensação esperada usando as fórmulas, (3) escolher a conduta
- **Fórmulas ensinadas interativamente:**
  - Acidose metabólica: `PaCO2 esperado = 1.5 × HCO3 + 8 (±2)` (Winter)
  - Alcalose metabólica: `PaCO2 esperado = 0.7 × HCO3 + 21 (±2)`
  - Acidose respiratória aguda: `HCO3 sobe 1 para cada 10 de PaCO2`
  - Acidose respiratória crônica: `HCO3 sobe 3.5 para cada 10 de PaCO2`
  - Alcalose respiratória aguda: `HCO3 cai 2 para cada 10 de PaCO2`
  - Alcalose respiratória crônica: `HCO3 cai 5 para cada 10 de PaCO2`
  - Ânion gap: `AG = Na - (Cl + HCO3)` normal 8–12; com albumina: `AG corrigido = AG + 2.5 × (4 - albumina)`
  - Delta-delta: `ΔAG/ΔHCO3` — distingue distúrbios mistos
- **Progressão:** 5 casos de dificuldade crescente (simples → misto → triplo). A fórmula relevante aparece como "dica do grimório" antes de cada cálculo
- **Integração:** acessível via "Modos de Jogo" no menu principal; salva progresso no `localStorage`; eventos GA4 `minigame_acid_base_started` e `minigame_acid_base_completed`
- **Arquivo:** `js/minigame-acidbase.js` + seção dedicada no `index.html`

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
