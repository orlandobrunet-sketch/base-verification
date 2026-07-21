# NefroQuest — Documentação Técnica

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML/CSS/JS vanilla — SPA sem framework, sem build step |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions Deno) |
| Hospedagem | GitHub Pages (produção) + Vercel (preview) |
| Pagamento | Mercado Pago (preference API + webhook) |
| IA | Anthropic Claude Haiku via Edge Function |
| Monitoramento | Sentry (erros) + GA4 (eventos) |

---

## Arquitetura

### Entrada comercial + SPA

`index.html` é a landing comercial canônica de `https://nefroquest.com/`. Seus estilos, interações e imagens ficam em `landing/`.

O jogo vive em `jogar/index.html`, acessível em `https://nefroquest.com/jogar/`. A landing encaminha callbacks antigos de autenticação, pagamento e PWA para essa rota sem trocar o origin.

Toda a UI do jogo está em um único `jogar/index.html`. Dentro do app não há roteamento de páginas. As telas são `<div>` com classe `.hidden` alternadas por JS. Fluxo:

```
#landingScreen (login)
  → #welcomeScreen (menu principal)
    → seleção de classe → seleção de dificuldade
      → #mainApp (jogo ativo)
```

Não há framework de componentes. Estado global em objeto `state` wrapped em `Proxy` que:
- Auto-invalida `statsCache` ao mudar propriedades relevantes
- Debounce-salva no `localStorage` a cada 500ms

### Módulos JS

Cada arquivo é um módulo IIFE ou conjunto de funções expostas no escopo global. Não há `import/export` — os scripts são carregados em ordem via `<script src="...">` no fim do `<body>`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `js/game.js` | Lógica principal: RPG, pergunta/resposta, streak, HUD, boss |
| `js/utils.js` | Utilitários: analytics, toast, spaced repetition, streak |
| `js/leaderboard.js` | Ranking: fetch/push para Supabase |
| `js/audio.js` | Sistema de áudio (sons + música) |
| `js/study-mode.js` | Modo estudo, radar de eixos, NEFRO_AXES |
| `js/dashboard.js` | Dashboard do Nefrologista (admin only) |
| `js/admin.js` | Funções de administrador |
| `js/minigame.js` | Julgamento Rápido (V ou F) |
| `js/achievements.js` | Conquistas e badges |
| `js/changelog.js` | Modal de changelog |
| `js/auth.js` | Autenticação Supabase |
| `js/paywall.js` | Paywall e planos premium |
| `js/account.js` | Conta do usuário |
| `js/boss.js` | Boss battle (Arqui-Nefromante) |
| `js/exam.js` | Prova simulada cronometrada |
| `js/notifications.js` | Web Push (subscribe/unsubscribe) |

### Event Delegation

Nenhum `onclick=` inline em HTML. Todos os cliques passam por um dispatcher central em `game.js`:

```js
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (typeof window[action] === 'function') window[action](btn.dataset.arg, e, btn);
});
```

### Lazy Loading

`data/topics.js` (~1.4 MB) é carregado sob demanda com `dynamic import()` apenas quando o jogo começa, para não bloquear o carregamento inicial da página.

---

## Autenticação e Premium

- **Provider:** Supabase Auth (email/password, magic link, Google OAuth)
- **Sessão:** `supabase.auth.getUser()` — verifica JWT junto ao servidor. Nunca usar `getSession()` sem verificação server-side para decisões de segurança.
- **Premium:** verificado via `user.app_metadata.premium === true` OU `user.app_metadata.is_admin === true`
- **`isPremium()`** sempre exige `authUser` autenticado — nunca concede acesso para usuários anônimos nem via `localStorage`

---

## Banco de Dados — Supabase

**Project ID:** `wviutasgroltjuyxpevc`
**URL:** `https://wviutasgroltjuyxpevc.supabase.co`

### `profiles`

Extende `auth.users`. Criada automaticamente pelo Supabase Auth trigger.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | FK para `auth.users.id` |
| `premium_plan` | TEXT | `'monthly'` ou `'lifetime'` ou NULL |
| `premium_expires_at` | TIMESTAMPTZ | NULL = vitalício |
| `premium_updated_at` | TIMESTAMPTZ | Última atualização de premium |
| `mp_payment_id` | TEXT | ID do pagamento no Mercado Pago |
| `is_premium` | BOOLEAN | Campo legado — verificado junto com `app_metadata` |

### `leaderboard`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK para `auth.users` (único por usuário) |
| `player_name` | TEXT | 1–40 chars |
| `score` | INTEGER | 0–9.999.999 |
| `level` | INTEGER | 1–999 |
| `created_at` | TIMESTAMPTZ | |

RLS habilitada: leitura pública, escrita apenas pelo próprio `user_id`. Índice único em `user_id` (entradas anônimas com `user_id = NULL` permitidas).

### `ai_usage`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `user_id` | UUID | PK composta (1/3) |
| `feature` | TEXT | PK composta (2/3) — `'mentor'` ou `'diagnosis'` |
| `date` | DATE | PK composta (3/3) |
| `count` | INTEGER | Uso acumulado no dia |

RLS: usuário lê apenas suas próprias linhas. Escrita exclusiva via service role (Edge Functions).

---

## Edge Functions

Todas rodam no Supabase Edge (Deno/TypeScript). CORS habilitado para `nefroquest.com`, `*.vercel.app`, `localhost`.

### `ai-mentor`
- **Propósito:** Explica questões erradas — "Oráculo dos Néfrons"
- **Modelo:** `claude-haiku-4-5-20251001`
- **Quota:** 5/dia free, ilimitado premium
- **Auth:** JWT obrigatório
- **Input:** `{ questionText, options, correctOption, explanation, userQuestion, history }`
- **Env vars:** `ANTHROPIC_API_KEY`

### `ai-diagnosis`
- **Propósito:** Diagnóstico de lacunas ao final de sessão
- **Modelo:** `claude-haiku-4-5-20251001`
- **Quota:** 3/dia free, ilimitado premium
- **Auth:** JWT obrigatório
- **Input:** `{ axes: [{name, correct, wrong}], totalCorrect, totalWrong, accuracy }`
- **Env vars:** `ANTHROPIC_API_KEY`

### `send-flag`
- **Propósito:** Proxy para reportar erro em questão via Web3Forms
- **Auth:** Pública por design (sem JWT)
- **Input:** `{ subject, message }`
- **Env vars:** `WEB3FORMS_KEY`

### `send-contact`
- **Propósito:** Formulário de contato via Web3Forms
- **Auth:** Pública por design
- **Input:** `{ name, email, message }`
- **Env vars:** `WEB3FORMS_KEY`

### `create-mp-preference`
- **Propósito:** Cria preferência de pagamento Mercado Pago, retorna URL de checkout
- **Auth:** JWT obrigatório
- **Planos:** `monthly` (R$14,90) | `lifetime` (R$199,00)
- **Env vars:** `MP_ACCESS_TOKEN`, `APP_URL`, `MP_SANDBOX`

### `mp-webhook`
- **Propósito:** Recebe confirmação de pagamento aprovado → atualiza `profiles`
- **Auth:** Verificação de assinatura Mercado Pago
- **Env vars:** `MP_ACCESS_TOKEN`

### `send-push`
- **Propósito:** Envia Web Push para usuário ou todos os assinantes
- **Auth:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` — admin only, nunca exposto no cliente
- **Input:** `{ userId?: string, title, body, url?, tag? }`
- **Env vars:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

---

## Mecânicas do Jogo

### Classes (3)
| Classe | Estilo |
|--------|--------|
| Guerreiro Glomerular | Tanque |
| Maga Metabólica | DPS mágico |
| Clérigo Renal | Suporte |

Cada classe tem 10 níveis de imagem em `assets/classes/<folder>/nivel_01.jpg` → `nivel_10.jpg`.

### Progressão
- 100 acertos corretos = vitória (derrota o Arqui-Nefromante)
- Streak: começa em x1.25 com 3 acertos seguidos, escala até x2.5 com 15+
- Multiplicadores: x1.25 / x1.5 / x1.75 / x2 / x2.5

### Badges (5)
| Badge | Requisito |
|-------|-----------|
| Vórtice do Néfron | 20 acertos cumulativos |
| Sábio do Microscópio | 40 |
| Guardião das Águas | 60 |
| Árbitro dos Rins | 80 |
| Ascendido do NefroQuest | 100 |

### Dificuldades
- **Normal:** padrão
- **Hardcore:** salvo em `localStorage.nefroquest-hardcore-completed`; badge exclusivo

### Banco de Questões
- `data/topics.js` — ~1.4 MB, lazy loaded
- Organizado por eixo temático (17 eixos: `NEFRO_AXES` em `study-mode.js`)
- Eixos: glomerulopatias, hipertensão, LRA, ERC, diálise, transplante, ácido-base, eletrólitos, etc.

---

## PWA e Service Worker

- `version.json` contém a versão atual. O cliente verifica a cada carregamento — se diferente, redireciona para `clear-cache.html`
- `clear-cache.html` chama `caches.keys()` e deleta todos os caches, força re-download
- `sw.js` usa cache name `nefroquest-vX.XX` — o `activate` event deleta caches com nomes diferentes
- `version.json` e `/clear-cache.html` são **excluídos** do fetch handler do SW (sempre buscam da rede)
- iOS splash screens em `assets/images/` para múltiplos tamanhos de iPhone e iPad

**Regra crítica:** toda mudança em `style.css`, `js/*.js` ou qualquer asset cacheado deve incrementar a versão em `sw.js` e `version.json` no mesmo commit.

---

## Analytics

### Sentry
- DSN configurado inline em `index.html` e `jogar/index.html`
- Captura exceções JS não tratadas em produção

### GA4
- `gtag()` via script inline na landing e no app
- Measurement ID: `G-0TS171XV3K`
- Eventos rastreados:

| Evento | Quando |
|--------|--------|
| `game_started` | Início de nova jornada |
| `question_answered` | Cada questão respondida |
| `boss_entered` | Entrada na fase do boss |
| `game_completed` | Vitória (100 acertos) |
| `paywall_shown` | Paywall exibido |
| `premium_converted` | Pagamento confirmado |

---

## Sistema de Pagamento

1. Usuário clica em plano (mensal R$14,90 ou vitalício R$199,00)
2. Frontend chama `create-mp-preference` com JWT
3. Edge Function cria preference no Mercado Pago → retorna `init_point` (URL de checkout)
4. Usuário é redirecionado para o checkout Mercado Pago
5. Após pagamento, Mercado Pago chama `mp-webhook`
6. Webhook verifica assinatura, atualiza `profiles` com `is_premium = true` e dados do plano
7. No próximo login, `app_metadata` reflete o novo status premium

**Android TWA:** botões de compra são substituídos por mensagem "Adquira em nefroquest.com" quando `_isTWA` detecta referrer `android-app://` (evita comissão Google Play Billing).

---

## Deploy

### GitHub Pages
- Push para `main` → deploy automático em `nefroquest.com`
- CNAME configurado no arquivo `CNAME`
- Tempo de propagação: 1–3 minutos

### Vercel
- `vercel.json` com headers de segurança (X-Content-Type-Options, X-Frame-Options, CSP, etc.)
- Deploy automático em PRs via integração GitHub

### Edge Functions
```bash
supabase link --project-ref wviutasgroltjuyxpevc
supabase functions deploy <nome-da-função>
```
Ou via Dashboard: Supabase → Edge Functions → selecionar → Deploy.

### Migrations
Rodar manualmente no SQL Editor do Supabase Dashboard após revisar.
