# NefroQuest: Ascension — Contexto do Projeto para Claude

## O que é o NefroQuest

NefroQuest é um jogo RPG educacional de perguntas e respostas sobre Nefrologia, voltado para estudantes de medicina e residentes. O jogador escolhe uma classe de personagem, responde questões de nefrologia, sobe de nível, coleta equipamentos e derrota o "Arqui-Nefromante" ao acertar 100 questões.

- **URL de produção:** https://nefroquest.com
- **Repositório GitHub:** orlandobrunet-sketch/base-verification
- **Branch principal:** `main`
- **Branch de trabalho atual:** `claude/fix-analytics-service-worker-MEeIh`
- **Versão atual:** 9.28
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

**Via Dashboard (atual):** Supabase Dashboard → Edge Functions → selecionar → Deploy / Redeploy

**Via CLI (recomendado para evitar drift):**
```bash
# Instalar CLI (se necessário)
npm install -g supabase

# Login e link ao projeto
supabase login
supabase link --project-ref wviutasgroltjuyxpevc

# Deploy de função específica
supabase functions deploy send-push
supabase functions deploy ai-mentor

# Deploy de migration
supabase db push
```

> ⚠️ Usar CLI garante que o código versionado é exatamente o que está em produção, eliminando risco de drift entre repositório e Dashboard.

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
- [x] W3: Push notifications server-side — migration 004, edge function `send-push` (deployada ✅), `js/notifications.js`, listener `push` no SW
- [x] Versão atual: **9.28**
- [x] Play Store PS-1a: `privacy-policy.html` standalone criada
- [x] Play Store PS-1c: TWA detection — botões de compra substituídos no APK Android
- [x] Play Store PS-1d: `manifest.json` com campo `"id": "/"`
- [x] A11y: `type="button"` em todos os 89 botões sem tipo
- [x] A11y: `aria-live="polite"` em `#authMsg` para leitores de tela
- [x] A11y: Touch targets — `min-height: 44px` em `.profile-popup-item` e `.profile-popup-logout`
- [x] Performance: `width`/`height` em 11 imagens estáticas (previne CLS)
- [x] Architecture: Profile popup deduplicado — 4 cópias idênticas → 1 `<template>` + injeção JS no DOMContentLoaded

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

- [ ] GA4 — verificar dados chegando no painel após fix do Measurement ID (G-0TS171XV3K)

### PENDENTE — Infraestrutura / Negócio
| # | Tarefa | Detalhe |
|---|--------|---------|
| I1 | Criar e-mail `contato@nefroquest.com` | Necessário para formulário de contato e identidade profissional |
| I2 | Testar fluxo completo de pagamento | Mercado Pago: preference → checkout → webhook → `profiles.is_premium = true`; testar plano mensal e vitalício |
| I3 | ~~Deploy edge function `send-push`~~ | **Feito** — deployada no Supabase Dashboard |

---

### NOVA FEATURE — Biblioteca de Referências

**Conceito:** Botão na página principal que abre um modal/página com **todas as referências bibliográficas** nas quais as questões do jogo são embasadas. Demonstra o rigor científico da ferramenta e agrega valor percebido ao usuário.

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| REF-1 | Botão "Biblioteca" na main page | Botão visível na tela principal (landing + game screen), acessível sem login | ⏳ Pendente |
| REF-2 | Modal de referências | Lista completa em ordem alfabética (autor, título, revista, ano, DOI/link), visual similar ao painel de refs das perguntas | ⏳ Pendente |
| REF-3 | Dados das referências | Consolidar `data/refs.js` + `data/articles.js` em lista única deduplicada, ordenada A–Z por primeiro autor | ⏳ Pendente |
| REF-4 | Seção "Sugerir artigo" | Ao final da biblioteca: formulário onde o usuário envia (a) link/DOI do artigo, (b) texto livre explicando por que é relevante para o NefroQuest — enviado via `send-contact` (Web3Forms) ou endpoint dedicado | ⏳ Pendente |
| REF-5 | Edge function `suggest-article` | Recebe `{ articleUrl, articleTitle?, reason, userEmail? }` e encaminha por e-mail via Web3Forms. Alternativa: reutilizar `send-contact` com campo `subject` padronizado | ⏳ Pendente |

**Fluxo do "Sugerir artigo":**
1. Usuário abre a Biblioteca de Referências
2. Rola até o final → vê seção "Quer contribuir?"
3. Preenche: **Link / DOI** (obrigatório) + **Por que é importante?** (textarea, mín. 20 chars)
4. Opcional: e-mail para retorno
5. Submissão → edge function → e-mail para `contato@nefroquest.com`
6. Toast de confirmação: *"Sugestão enviada! Analisaremos e podemos criar novas questões baseadas nela."*

**Dados disponíveis:**
- `data/refs.js` — referências já extraídas das questões
- `data/articles.js` — artigos curados separados
- Cada ref tem: autores, título, revista, ano, URL/DOI (formato variável — normalizar na hora da exibição)

---

### NOVA FEATURE — Expansão Internacional (Roadmap de Longo Prazo)

**Objetivo:** Traduzir o NefroQuest para inglês e publicar nas lojas globais — Google Play (Android) e Apple App Store (iOS).

#### Fase A — Internacionalização (i18n)
| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| EN-1 | Inventário de strings | Mapear todas as strings de UI em `index.html`, `js/*.js`, modais e toasts — estimar volume (~500–800 strings) | ⏳ Pendente |
| EN-2 | Sistema i18n | Criar `js/i18n.js` com dicionário `{ pt: {}, en: {} }` + função `t('key')` + detecção de idioma por `navigator.language` com override manual | ⏳ Pendente |
| EN-3 | Tradução do banco de questões | `data/topics.js` (~1.4 MB, ~1.000+ questões) traduzidas para inglês — trabalho de conteúdo médico, requer revisão especializada | ⏳ Pendente |
| EN-4 | Tradução de referências e artigos | `data/refs.js`, `data/articles.js` — geralmente já em inglês, verificar | ⏳ Pendente |
| EN-5 | Adaptar edge functions | Respostas do Mentor IA e Diagnóstico em inglês conforme idioma do usuário | ⏳ Pendente |
| EN-6 | Testes QA multilíngue | Verificar layout com strings longas em inglês (botões, cards, HUD) | ⏳ Pendente |

#### Fase B — Google Play (Android) — versão EN
> Já existe checklist para PT-BR (seção 🚀 PLAY STORE acima). Para a versão EN:

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| GP-1 | Listing em inglês | Título, descrição curta (80 chars), descrição completa (4.000 chars) em inglês | ⏳ Pendente |
| GP-2 | Screenshots EN | Capturas com UI em inglês — mesmas especificações (1080×1920, 9:16) | ⏳ Pendente |
| GP-3 | Publicar versão EN no Play Store | Mesma conta ($25 já paga), novo listing ou atualização com suporte a idioma | ⏳ Pendente |

#### Fase C — Apple App Store (iOS)
| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| iOS-1 | Apple Developer Program | Conta em developer.apple.com — taxa anual de $99 USD | ⏳ Pendente |
| iOS-2 | Estratégia de publicação | **Opção A (recomendada):** PWA via WKWebView wrapper (ex: [PWABuilder iOS](https://pwabuilder.com)) — sem Swift nativo. **Opção B:** app nativo React Native/Flutter — maior custo. | ⏳ Pendente |
| iOS-3 | Política de monetização iOS | Apple cobra 15–30% de comissão em compras in-app. Mesma estratégia do Android: desabilitar compra dentro do app, redirecionar para nefroquest.com | ⏳ Pendente |
| iOS-4 | Assets iOS | Ícones (1024×1024 sem transparência), screenshots por device (iPhone 6.9", 6.3", iPad), preview videos opcionais | ⏳ Pendente |
| iOS-5 | App Store Connect | Criar listing, preencher metadados, declarar privacidade (App Privacy labels), submeter para revisão (~24–72h) | ⏳ Pendente |
| iOS-6 | `privacy-policy.html` já pronto | ✅ Disponível em nefroquest.com/privacy-policy.html — reutilizar | ✅ Feito |

**Ordem recomendada:**
1. Finalizar redesign + dashboard
2. Biblioteca de Referências (REF-1 a REF-5)
3. Internacionalização PT→EN (EN-1 a EN-6)
4. Google Play versão EN (GP-1 a GP-3)
5. Apple App Store (iOS-1 a iOS-6)

> ⚠️ **Decisão de conteúdo crítica:** A tradução das ~1.000 questões de nefrologia para inglês (EN-3) é o maior gargalo. Requer revisão médica por nefrologista fluente em inglês para garantir terminologia clínica correta (KDIGO, DOQI em inglês). Estimar 2–4 semanas de trabalho de conteúdo.

---

## 🚀 PLAY STORE — Checklist de Publicação

### Estratégia técnica
O NefroQuest é publicado como **TWA (Trusted Web Activity)** — o APK Android é gerado automaticamente a partir da PWA via [PWABuilder](https://pwabuilder.com), sem necessidade de código nativo. A URL continua sendo `https://nefroquest.com`.

> ⚠️ **Decisão crítica de negócio — Monetização no Android:**
> O Google Play Policy exige uso do **Google Play Billing** para venda de conteúdo digital dentro de apps Android (com comissão de 15–30%). Opções:
> 1. **Recomendado:** Desabilitar compra premium dentro do app Android — mostrar mensagem "Adquira o Premium em nefroquest.com". Compra ocorre no navegador (Mercado Pago), sincroniza via Supabase Auth. Sem comissão para o Google.
> 2. Implementar Google Play Billing (15–30% de comissão + trabalho de integração).

### PS-1: Técnico (código) — PRIORITÁRIO
| # | Tarefa | Detalhe | Responsável |
|---|--------|---------|-------------|
| PS-1a | `privacy-policy.html` standalone | ✅ **Feito** — `/privacy-policy.html` disponível em nefroquest.com/privacy-policy.html | Código |
| PS-1b | `.well-known/assetlinks.json` | Pendente — gerar após criar APK no PWABuilder e obter SHA-256 do Play Console | Código + Play Console |
| PS-1c | Desabilitar compra no Android TWA | ✅ **Feito** — `_isTWA` detecta `android-app://` referrer; botões Mensal/Vitalício substituídos por mensagem de redirecionamento | Código |
| PS-1d | `manifest.json` — `id` canônico | ✅ **Feito** — `"id": "/"` adicionado | Código |

### PS-2: Assets visuais — PRIORITÁRIO
| # | Asset | Especificação | Status |
|---|-------|---------------|--------|
| PS-2a | Ícone hi-res | 512×512 PNG sem transparência, sem arredondamento | ✅ Existe (`favicon-512x512.png`) — verificar fundo |
| PS-2b | Feature graphic | 1024×500 PNG/JPG — banner do Play Store | ⏳ Pendente — design |
| PS-2c | Screenshots Phone | Mín. 2, recomendado 4–8. Formato 1080×1920 ou 9:16 | ⏳ Pendente — design (existentes são 390×844) |
| PS-2d | Screenshots Tablet | Opcional mas recomendado | ⏳ Pendente — design |
| PS-2e | Ícone adaptativo | `foreground` + `background` layers para Android | ⏳ Pendente (usar 512x512 existente como base) |

### PS-3: Administrativo (manual — Google Play Console)
| # | Tarefa | Detalhe |
|---|--------|---------|
| PS-3a | Conta Google Play Developer | Cadastro único em play.google.com/console — taxa de $25 USD |
| PS-3b | Gerar APK TWA | [pwabuilder.com](https://pwabuilder.com) → inserir `https://nefroquest.com` → Download Android Package |
| PS-3c | Assinar APK | Play Console gera e gerencia chave de assinatura automaticamente ("Play App Signing") |
| PS-3d | Classificação etária (IARC) | Questionário no Play Console — responder: educação médica, sem violência/conteúdo adulto → classificação "Livre" ou "10+" |
| PS-3e | Seção Data Safety | Declarar: coleta e-mail (obrigatório), dados de uso (analytics), dados de pagamento (Mercado Pago). Sem compartilhamento para publicidade |
| PS-3f | Texto da listing (PT-BR) | Título (50 chars), descrição curta (80 chars), descrição completa (4.000 chars) |
| PS-3g | Política de privacidade URL | URL pública — usar `https://nefroquest.com/privacy-policy.html` (PS-1a) |
| PS-3h | Categoria | "Educação" — subcategoria Saúde/Medicina |

### PS-4: Listing text sugerido
```
Título: NefroQuest: Ascension

Descrição curta (80 chars):
RPG educacional de Nefrologia para médicos e residentes. 1.000+ questões.

Descrição completa:
Domine a Nefrologia através de um RPG épico de perguntas e respostas.

Escolha seu personagem — Guerreiro Glomerular, Maga Metabólica ou Clérigo Renal — e enfrente mais de 1.000 questões comentadas de nefrologia baseadas nas melhores evidências (KDIGO, DOQI, SBN, principais RCTs).

⚔️ JORNADA RPG GAMIFICADA
Ganhe XP, colete equipamentos, suba de nível e derrote o Arqui-Nefromante respondendo questões clínicas.

🎯 ESTUDE SEU PONTO FRACO
O sistema identifica suas lacunas por eixo temático: Glomerulopatias, LRA, ERC, Diálise, Transplante, Distúrbios Ácido-Base, Eletrólitos e muito mais.

📋 BASEADO EM EVIDÊNCIAS
Explicações detalhadas com referências bibliográficas atualizadas.

✨ MENTOR IA PERSONALIZADO
Errou uma questão? O Mentor IA explica o raciocínio clínico e responde suas dúvidas em tempo real, com tecnologia Claude (Anthropic).

📊 MODOS DE JOGO
- Jornada RPG (modo principal)
- Modo de Estudo por eixo temático
- Prova Simulada cronometrada
- Julgamento Rápido (verdadeiro ou falso)

🏆 CONQUISTAS E RANKING
Compare seu desempenho com outros jogadores no ranking global.

Ideal para estudantes de medicina, residentes de clínica médica e nefrologia.
```

### PS-5: Ordem recomendada de execução
1. ~~**PS-1a** — criar `privacy-policy.html`~~ ✅ Feito
2. ~~**PS-1d** — adicionar `id` ao manifest.json~~ ✅ Feito
3. ~~**PS-1c** — detectar TWA e esconder compra in-app~~ ✅ Feito
4. **PS-2b/2c** — criar feature graphic e screenshots (design — você)
5. **PS-3a** — abrir conta Google Play ($25) — você
6. **PS-3b** — gerar APK no PWABuilder — você
7. **PS-1b** — inserir assetlinks.json com SHA do APK gerado — código após APK
8. **PS-3c até PS-3h** — preencher Play Console e submeter — você

### PS-6: Cronograma estimado
| Etapa | Tempo estimado |
|-------|---------------|
| Código (PS-1a,b,c,d) | 2–3 horas |
| Design assets (PS-2b,c) | 2–4 horas (ou contratar designer) |
| Play Console + submissão (PS-3) | 2–3 horas |
| Revisão Google (primeira vez) | 3–7 dias úteis |
| **Total até publicação** | **~1–2 semanas** |

---

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

**Plano pedagógico detalhado (aprovado):**
- **"A Câmara do Equilíbrio"** — narrativa: Alquimista Renal recebe pacientes do reino com pH desregulado. Cada caso é um personagem com história para ancorar o diagnóstico.
- **3 pontos de entrada:** Menu "Modos de Jogo" (sempre), desbloqueio narrativo ao nível 5 no jogo principal, conteúdo pós-vitória.
- **Diagnóstico em 4 Atos** (sequência fixa, pedagogicamente intencional):
  1. Distúrbio primário (pH + PaCO2/HCO3)
  2. Compensação esperada — **cálculo ativo**: aluno insere o valor, sistema aceita ±2
  3. Distúrbio adicional? (AG, delta-delta se aplicável)
  4. Conduta clínica (múltipla escolha contextualizada)
- **"Grimório"** — aluno escolhe ver ou não a fórmula antes de calcular. Sem punição, mas com registro ("Você usou o Grimório 2× neste caso").
- **Feedback explicativo**: erro mostra o raciocínio completo com o cálculo correto.
- **5 casos com personagens fixos:**
  | Caso | Personagem | Distúrbio | Complexidade |
  |------|-----------|-----------|--------------|
  | 1 | Ferreiro Aldric | Acidose metabólica simples (Winter) | Introdução |
  | 2 | Curandeira Mara | Alcalose metabólica (vômitos) | + AG normal |
  | 3 | Guarda Theron | Acidose respiratória crônica (DPOC) | + compensação renal |
  | 4 | Mercador Vance | Acidose met. AG alto + alcalose resp. | Misto + delta-delta |
  | 5 | General Kael | Triplo distúrbio | Desafio máximo |
- **Variantes por caso:** 2–3 sets de valores diferentes (mesma narrativa, gasometria diferente) para replay sem decorar.
- **Recompensa:** ao completar todos os 5 casos → +500 ouro + conquista "Alquimista Renal" no jogo principal.
- **Sem cronômetro** — ácido-base exige raciocínio, não velocidade.
- **100% offline** — sem Supabase, funciona antes de login.

---

## Convenções de Código

- **Linguagem do código:** JS vanilla no frontend, TypeScript nas Edge Functions (Deno)
- **Sem framework frontend** — SPA puro com HTML/CSS/JS
- **Variáveis CSS:** tema dark medieval com `var(--gold)`, `var(--txt-dim)`, etc.
- **Fontes:** Cinzel, Cinzel Decorative, Philosopher (Google Fonts)
- **Sem build step** — arquivos servidos diretamente (sem webpack/vite)

---

## 🎨 ROADMAP DE REDESIGN — Layout Completo

### Contexto
Redesign completo do visual do NefroQuest baseado em mockups de alta fidelidade com estética RPG épico medieval.
Abordagem: **CSS-first** (sem dependência de imagens externas) com substituição progressiva por assets quando fornecidos.
**Regra de ouro: nenhuma tela vai ao ar sem aprovação explícita do usuário.**

### Assets de referência recebidos
| Arquivo | Conteúdo |
|---------|----------|
| UI Kit 1 (roxo/escuro) | Botões, barras de progresso, ícones HUD, level badge, answer options A–E |
| UI Kit 2 (dourado/marrom) | Menu buttons, question cards, character portrait frame, item slots, tabs |
| Mockup Landing | Tela de login com colunas + feature list footer |
| Mockup Game Screen | Layout 3 colunas: character panel / questão / sidebar |
| Mockup Difficulty | Modal 2×2 com 4 dificuldades |
| Mockup Modos de Jogo | Painel com lista de modos (Estudo, Ponto Fraco, Simulada, Julgamento) |
| Campanha publicitária | Plano de ações com Posts A–G + Reels para Instagram |

### Paleta definitiva (extraída dos mockups)
```
--bg-deep:     #060810   (fundo mais escuro)
--bg-surface:  #0d1225   (superfícies/cards)
--bg-panel:    #0f1830   (painéis laterais)
--gold-bright: #f0c040   (títulos, ornamentos)
--gold-dim:    #a07820   (bordas, detalhes)
--purple-vivid:#7c3aed   (acentos, streak, XP bar)
--purple-dim:  #3d1d6e   (backgrounds de acentos)
--blue-crystal:#4a9eff   (diamantes, highlights)
--red-hp:      #cc2222   (vida, erros)
--parchment:   #e8d9a0   (texto em cards bege/pergaminho)
--txt-primary: #d0e4f8
--txt-secondary:#7090b0
```

### Tipografia definitiva
- **Títulos grandes:** Cinzel Decorative — todas maiúsculas, dourado
- **Títulos de modal:** Cinzel — capitalizado, dourado
- **Corpo de jogo:** Philosopher — texto de questões, descrições
- **UI / Labels:** Cinzel — caps, tamanho pequeno, espaçado
- **Números / HUD:** Cinzel Bold — pontos, nível, contadores

---

### FASE 0 — Fundação CSS (pré-requisito de tudo)
> Não toca em HTML — apenas refatora variáveis e classes base em style.css

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| F0-1 | Paleta CSS atualizada | Substituir variáveis atuais pela paleta definitiva acima | ⏳ Aguardando OK |
| F0-2 | Sistema de bordas ornamentais | Classes `.frame-gold`, `.frame-parchment`, `.frame-dark` via box-shadow + border-image | ⏳ |
| F0-3 | Botão primário redesenhado | `.btn-rpg` com gradiente dourado, borda ornamental, hover com glow | ⏳ |
| F0-4 | Fundo global | Gradiente radial profundo (#060810 → #0d1225) + padrão sutil de partículas CSS | ⏳ |
| F0-5 | Scrollbar temática | Scrollbar fina dourada nos painéis | ⏳ |

---

### FASE 1 — Telas de entrada (maior impacto imediato)

#### T1 — Landing / Login
**Referência:** Mockup "landing screen" (colunas com login + feature list)
**Elementos a redesenhar:**
- Container central com moldura dourada ornamental
- Logo com tratamento Cinzel Decorative
- Botão Google com borda bege/pergaminho
- Botão Email com fundo azul escuro
- Botão "Experimentar sem conta" com fundo translúcido
- Feature list no footer com ícones dos 6 diferenciais
- "✦ Reino dos Néfrons ✦" como eyebrow text

| Status | → | ⏳ Aguardando início |
|--------|---|---------------------|
| Aprovação necessária | → | Sim — screenshot antes do merge |

---

#### T2 — Seleção de classe / Welcome screen
**Referência:** Mockup de seleção com 3 personagens lado a lado
**Elementos a redesenhar:**
- Cards de personagem com moldura azul-dourada
- Nome da classe em Cinzel
- Stats/bônus da classe
- Botão de seleção ativo/inativo
- Animação de hover (glow roxo na borda)

| Status | → | ⏳ Após T1 aprovado |
|--------|---|---------------------|

---

#### T3 — Seleção de dificuldade
**Referência:** Mockup "Escolha a Dificuldade" (grid 2×2)
**Elementos a redesenhar:**
- Modal com moldura dourada ornamental grande
- 4 cards com ícones e barras de corações
- Card selecionado com borda dourada brilhante
- Botão "Confirmar Dificuldade" teal/verde escuro
- Tag "BADGE EXCLUSIVO" em Hardcore (vermelho escuro)

| Status | → | ⏳ Após T2 aprovado |
|--------|---|---------------------|

---

#### T_MODOS — Modos de Jogo (menu lateral)
**Referência:** Mockup "Modos de Jogo" com lista de 4 modos
**Elementos a redesenhar:**
- Header com título "⚔ Modos de Jogo" em frame dourado
- 4 itens de menu com ícone octagonal, título e descrição
- "Ponto Fraco" com fundo vermelho escuro (destaque especial)
- Close button circular dourado

| Status | → | ⏳ Após T3 aprovado |
|--------|---|---------------------|

---

### FASE 2 — Game Screen (coração do jogo)

#### T4 — Game screen principal (pergunta ativa)
**Referência:** Mockup full 3 colunas
**Elementos a redesenhar:**

*Coluna esquerda — Character Panel:*
- Portrait com moldura ornamental arredondada
- Nome e subtítulo do personagem
- XP bar roxa com valor
- "Capítulo da Narrativa" em card pergaminho
- Slots de equipamento (3 quadrados com +)
- Stats: Nível, Pontos, Vidas (corações), Recorde, Ouro, Streak

*Centro — Questão:*
- Header com timer + "Questão X de Y" + botão ?
- Card pergaminho com texto da questão + watermark rim
- 4–5 answer buttons (A–D/E) com letra em círculo dourado
- "Escolha a melhor alternativa clínica" em itálico
- Card "Evidência Científica" com badge GUIDELINE, ano, fonte

*Coluna direita — Action Dock:*
- 5 botões verticais: Forja / Baú / Ranking / Stats / Conquistas
- Cada botão com ícone + label + moldura individual

| Status | → | ⏳ Após Fase 1 aprovada |
|--------|---|--------------------------|

---

#### T5 — Game screen (resposta correta)
**Elementos adicionais vs T4:**
- Answer button selecionado: fundo verde + glow verde
- Ícone ✓ no círculo da letra
- Card de evidência expandido com texto completo
- "PRÓXIMA" button teal brilhante

| Status | → | ⏳ Junto com T4 |
|--------|---|-----------------|

---

#### T6 — Game screen (resposta errada)
**Elementos adicionais vs T4:**
- Answer button errado: fundo vermelho escuro
- Answer button correto: destacado em verde
- Opção de abrir Mentor IA
- Animação de shake no card

| Status | → | ⏳ Junto com T4 |
|--------|---|-----------------|

---

### FASE 3 — Modais principais

#### M5 — Mentor IA (Oráculo dos Néfrons)
**Referência:** Post E da campanha (wizard com livro brilhante)
**Elementos:**
- Header com ícone de cérebro roxo + "Oráculo dos Néfrons"
- Área de chat com bolhas de resposta
- Input de pergunta com borda dourada
- Indicador de quota (X de 5 consultas)

| Status | → | ⏳ Após T4 aprovado |
|--------|---|---------------------|

---

#### M1 — Baú / Chest
**Elementos:**
- Animação de abertura (CSS)
- Item revelado com moldura de raridade
- Botão "Equipar" ou "Vender"

| Status | → | ⏳ |

---

#### M2 — Forja
**Elementos:**
- Grid de itens disponíveis
- Preview de item selecionado
- Custo em ouro + botão craftar

| Status | → | ⏳ |

---

#### M4 — Conquista desbloqueada
**Elementos:**
- Popup central com badge em destaque
- Nome e descrição da conquista
- Animação de brilho

| Status | → | ⏳ |

---

### FASE 4 — Telas de conteúdo

| # | Tela | Prioridade | Status |
|---|------|-----------|--------|
| T10 | Leaderboard | Alta | ⏳ |
| T11 | Modo de Estudo (seletor de eixos) | Alta | ⏳ |
| T12 | Simulado / Prova cronometrada | Média | ⏳ |
| T13 | Julgamento Rápido (V ou F) | Média | ⏳ |
| T14 | Stats / Estatísticas | Média | ⏳ |
| T15 | Conquistas (grid) | Média | ⏳ |

---

### FASE 5 — Modais de sistema

| # | Modal | Status |
|---|-------|--------|
| M7 | Auth (login/cadastro) | ⏳ |
| M8 | Pricing / Paywall (planos) | ⏳ |
| M9 | Profile popup | ⏳ |
| M10 | Conta / Account | ⏳ |
| M11 | Reportar questão | ⏳ |
| M12 | Contato | ⏳ |
| M13 | Política de Privacidade | ⏳ |
| M14 | Changelog | ⏳ |
| M15 | Notificações | ⏳ |
| M16 | Toast notifications | ⏳ |

---

### FASE 6 — Boss e desfechos

| # | Tela | Status |
|---|------|--------|
| T7 | Boss Battle (Arqui-Nefromante) | ⏳ |
| T8 | Game Over | ⏳ |
| T9 | Victory (100 acertos) | ⏳ |

---

### FASE 7 — Mobile

| # | Tela | Status |
|---|------|--------|
| T16 | Game screen mobile (status bar + dock bottom) | ⏳ |
| T17 | Ajustes gerais de responsividade | ⏳ |

---

### Protocolo de aprovação (por tela)
```
1. Claude implementa em branch separada
2. Claude compartilha screenshot ou link do PR
3. Usuário abre no browser e revisa
4. Usuário aprova (merge) OU pede ajustes
5. Após merge confirmado → próxima tela
```

### Contagem total
| Grupo | Qtd |
|-------|-----|
| Fase 0 — Fundação CSS | 5 |
| Fase 1 — Entrada | 4 |
| Fase 2 — Game screen | 3 |
| Fase 3 — Modais principais | 4 |
| Fase 4 — Conteúdo | 6 |
| Fase 5 — Modais sistema | 10 |
| Fase 6 — Boss/desfechos | 3 |
| Fase 7 — Mobile | 2 |
| **TOTAL** | **37 itens** |



- **Supabase CLI:** `supabase/config.toml` presente mas edge functions são deployadas pelo Dashboard
- **Testes:** Playwright E2E em `/tests/` (9 suites de teste)
- **Python scripts:** `apply_reviews.py`, `review_questions.py`, etc. — utilitários para gerenciar questões
- **Auditoria:** arquivos `# Relatório de Auditoria 1.txt` e `relatório 2.txt` — histórico de reviews de questões
