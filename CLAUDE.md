# NefroQuest — Guia Operacional para Claude Code

## O que é o NefroQuest

NefroQuest é um jogo RPG educacional de perguntas e respostas sobre Nefrologia, voltado para estudantes de medicina e residentes. Stack: HTML/CSS/JS vanilla (SPA), sem framework frontend, sem build step. Backend: Supabase (Auth, DB, Edge Functions). Hospedagem: GitHub Pages + Vercel.

- **URL de produção:** https://nefroquest.com
- **Repositório:** orlandobrunet-sketch/base-verification
- **Branch principal:** `main` (deploy automático via GitHub Pages → nefroquest.com)
- **Branch de trabalho:** uma branch por tarefa (definida no início de cada sessão)
- **Versão atual:** ver `version.json` — fonte de verdade; não hardcodar o número aqui


## Documentos de referência

- `docs/ROADMAP.md` — roadmap, backlog e histórico de tarefas do produto

### Documentos editoriais canônicos

- [`docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md`](docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md) — define os **conceitos**: ontologia, entidades, objetivo pedagógico, validade, dificuldade.
- [`docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md`](docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md) — define as **regras editoriais e suas consequências**: criação, avaliação, Advogado do Recurso, critérios eliminatórios, NQ Editorial Score, árvore de decisão, três eixos (§18.4).
- [`docs/editorial/annex-c-nefrologia.md`](docs/editorial/annex-c-nefrologia.md) — contém as **especificidades de nefrologia**: rubricas-âncora de Bloom/dificuldade, catálogo de erros clínicos, checklist de segurança, atribuição de referências.

Este `CLAUDE.md` **não substitui** esses documentos nem tem precedência sobre eles — apenas aponta para onde a regra editorial completa vive. Em caso de conflito, prevalece sempre o documento canônico.

## ⚠️ REGRA CRÍTICA — Service Worker Cache

**Todo PR que altere `style.css`, `js/*.js` ou qualquer asset estático DEVE incluir no mesmo commit:**

```bash
# Incrementar X.XX em sw.js (linha 1-2) e version.json
# sw.js:
const CACHE = 'nefroquest-vX.XX';

# version.json:
{"version": "X.XX"}
```

**Nunca abrir PR separado de version bump.** Se o bump não está no mesmo commit que o CSS/JS fix, o Service Worker continua servindo o arquivo antigo do cache após o merge, e as mudanças não aparecem para o usuário.

Sequência obrigatória em todo PR com mudança de asset:
1. Editar `style.css` / `js/*.js`
2. Bumpar `version.json` e `sw.js` no mesmo commit
3. Abrir um único PR com tudo junto

**Guard automático:** o git pre-commit hook em `.githooks/pre-commit` bloqueia commits de `style.css`/`js/*.js` sem `version.json` + `sw.js` no mesmo commit. Ative uma vez por clone:

```bash
git config core.hooksPath .githooks
```

(Em emergência, `git commit --no-verify` pula a verificação.)

---

## Estrutura de Arquivos

```
/
├── index.html          # Landing comercial canônica — https://nefroquest.com/
├── jogar/
│   └── index.html      # App principal — toda a UI do jogo está aqui (SPA)
├── landing/
│   ├── styles.css      # Identidade e layout da landing
│   ├── script.js       # Interações progressivas da landing
│   └── assets/         # Imagens e ícones da landing
├── style.css           # Estilos globais (tema dark medieval, variáveis CSS)
├── sw.js               # Service Worker — cache offline e versioning
├── manifest.json       # PWA manifest
├── version.json        # fonte de verdade da versão do app — controla invalidação de SW
├── 404.html            # Página 404
├── offline.html        # Página offline
├── clear-cache.html    # Redireciona após limpar SW cache
├── CNAME               # nefroquest.com
├── vercel.json         # Configuração Vercel

├── js/
│   ├── game.js         # Lógica principal do jogo (RPG, badges, batalha, IA)
│   ├── utils.js        # Utilitários: streak, analytics, toast, revisão espaçada (FSRS-4.5)
│   ├── leaderboard.js  # Ranking global (fetch/push para Supabase)
│   ├── audio.js        # Sistema de áudio
│   ├── study-mode.js   # Modo estudo (fora do jogo principal)
│   ├── dashboard.js    # Dashboard do Nefrologista (admin)
│   ├── admin.js        # Funções de admin
│   ├── minigame.js     # Minigame integrado + Ritual de Iniciação (placement PED-3)
│   ├── minigame-acidbase.js # Câmara do Equilíbrio — minigame ácido-base (20 casos)
│   ├── achievements.js # Conquistas e badges
│   ├── changelog.js    # Modal de changelog
│   ├── auth.js         # Autenticação
│   ├── paywall.js      # Paywall premium
│   ├── account.js      # Conta do usuário
│   ├── boss.js         # Boss battle (Arqui-Nefromante)
│   ├── exam.js         # Modo prova simulada
│   └── notifications.js # Web Push notifications

├── data/
│   ├── topics.js       # ~1.4 MB — banco de questões de nefrologia (lazy loaded)
│   ├── articles.js     # Artigos de referência
│   ├── competencies.js # PED-2 — Mapa de Competências (classificação por keywords)
│   ├── rapid-quiz.js   # Questões do modo quiz rápido
│   └── refs.js         # Referências bibliográficas

├── assets/
│   ├── audio/          # welcome-theme.mp3
│   ├── badges/         # badge1-5 (.jpg e .png)
│   ├── classes/        # Imagens dos personagens por nível
│   ├── images/         # Favicons, splash screens iOS
│   └── bg-hall.jpg     # Background principal (hall medieval azul)

├── supabase/
│   ├── config.toml     # project_id = "wviutasgroltjuyxpevc"
│   ├── migrations/
│   └── functions/      # Edge Functions (Deno/TypeScript)

├── docs/
│   ├── ROADMAP.md      # Roadmap e backlog do produto
│   └── editorial/      # Documentos editoriais canônicos (Knowledge Model, Handbook, Anexo C)

├── .claude/
│   └── skills/
│       ├── criar-nefroquest/    # Criação de questões médicas novas
│       └── revisar-nefroquest/  # Revisão, veredito editorial e autorização de publicação

└── tests/              # Playwright E2E (13 suites)
```

---

## Backend — Supabase

- **Project ID:** `wviutasgroltjuyxpevc`
- **URL:** `https://wviutasgroltjuyxpevc.supabase.co`

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados do usuário: `premium_plan`, `premium_expires_at`, `mp_payment_id`, `is_premium` (migration 001) |
| `leaderboard` | Ranking global: `user_id`, `player_name`, `score`, `level`. RLS habilitada (migration 002) |
| `ai_usage` | Quota diária de IA: PK composta `(user_id, feature, date)` (migration 003) |
| `push_subscriptions` | Inscrições Web Push por usuário (migration 004) |
| `game_progress` | Progresso de jogo sincronizado entre dispositivos (migration 005) |
| `processed_payments` | Idempotência do webhook Mercado Pago por `paymentId` (migration 007) |
| `question_ratings` | Avaliação 5★ (qualidade + aprendizado) por questão; insert público, leitura só admin (migration 008) |
| `profiles_stats` | Perfil Global acumulado: `total_correct`, `total_games`, `best_level` (DC-4/DC-5, migration 009) |
| `question_difficulty_votes` | Votos de dificuldade crowd-sourced para recalibrar o banco (migration 010) |
| `question_error_reasons` | PED-1: padrão de raciocínio nomeado ao errar uma questão (migration 011) |

### Edge Functions

| Função | Propósito |
|--------|-----------|
| `ai-mentor` | Oráculo dos Néfrons — Claude Haiku, 5 consultas/dia free |
| `ai-diagnosis` | Diagnóstico de lacunas — Claude Haiku, 3 consultas/dia free |
| `send-flag` | Proxy reportar erro em questão (Web3Forms) |
| `send-contact` | Formulário de contato (Web3Forms) |
| `create-mp-preference` | Cria preferência Mercado Pago |
| `mp-webhook` | Webhook pagamento aprovado → atualiza `profiles` |
| `send-push` | Web Push (campanha admin) — aceita JWT de admin (`app_metadata.is_admin`) OU service-role key |

### Variáveis de ambiente

| Função | Variável |
|--------|----------|
| ai-mentor, ai-diagnosis | `ANTHROPIC_API_KEY` |
| send-flag, send-contact | `WEB3FORMS_KEY` |
| create-mp-preference, mp-webhook | `MP_ACCESS_TOKEN`, `APP_URL` |
| send-push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |

### Auth e Premium

- Auth: Supabase Auth (email/password, magic link)
- Premium: `user.app_metadata.premium === true` OU `is_admin === true`
- `isPremium()` exige `authUser` autenticado — nunca concede para anônimos
- Pagamento: Mercado Pago → preference → checkout → webhook → `profiles`

---

## Mecânicas do Jogo

- **Classes:** Guerreiro Glomerular, Maga Metabólica, Clérigo Renal (10 níveis de imagem cada)
- **Progressão:** 100 acertos = vitória. Streak x1.25 → x2.5 (começa em 3 acertos seguidos)
- **Badges:** 5 total (20 / 40 / 60 / 80 / 100 acertos)
- **Dificuldades:** 4 modos — Fácil (5 vidas) · Médio (4, recomendado) · Difícil (3) · Hardcore (1). O modo (`state.difficulty` = easy/normal/hard/hardcore) controla as proporções de questões por `_d` (easy/medium/hard) no `shuffleQueue`. O **Ritual de Iniciação** (placement, PED-3) recomenda e pré-seleciona o modo.
- **Motor adaptativo (E1, IRT leve):** fora de hardcore/boss/estudo, o `drawQuestion` (em `js/game.js`) ajusta a dificuldade da próxima questão por categoria via IRT 1PL leve — `calculateUserTheta` + `getAdaptiveTargetDifficulty` em `js/utils.js` (theta por logit de acerto + refinamento SGD no histórico; `window.questionBank` precisa estar exposto p/ o SGD rodar).
- **Modo Leitura:** `body.reading-mode` aumenta fonte/contraste de enunciado e alternativas; persiste em localStorage (`toggleReadingMode` em `js/utils.js`)
- **Banco de questões:** `data/topics.js` ~1.4 MB, lazy loaded, organizado por eixo temático

---

## PWA e Service Worker

- `version.json` → cliente detecta versão nova → redireciona para `clear-cache.html` → SW limpa cache
- `sw.js` CACHE name `nefroquest-vX.XX` → activate event deleta caches antigos
- `version.json` e `/clear-cache.html` são excluídos do fetch handler do SW (sempre rede)
- iOS: splash screens em `assets/images/` para múltiplos tamanhos

---

## Analytics

- **Sentry:** DSN inline em `index.html` e `jogar/index.html`
- **GA4:** `gtag()` — eventos: `game_started`, `question_answered`, `boss_entered`, `game_completed`, `paywall_shown`, `premium_converted`

---

## Fluxo de Deploy

1. **GitHub Pages** — push para `main` → deploy automático em nefroquest.com
2. **Edge Functions** — redeploy manual no Supabase Dashboard ou via CLI:
   ```bash
   supabase link --project-ref wviutasgroltjuyxpevc
   supabase functions deploy <nome-da-função>
   ```
3. **Migrations** — rodar manualmente no SQL Editor do Supabase

---

## Convenções de Código

- JS vanilla no frontend, TypeScript nas Edge Functions (Deno)
- SPA puro — sem framework, sem build step
- CSS: variáveis `var(--gold)`, `var(--txt-dim)`, etc.
- Fontes: Cinzel, Cinzel Decorative, Philosopher (Google Fonts)
- Event delegation: `data-action` → `window[action]()`
- Estado global: `state` Proxy com debounce-save 500ms

---

## Regras absolutas

- Não altere código funcional sem pedido explícito
- Não refatore além do escopo pedido
- Não execute itens do roadmap automaticamente — veja `docs/ROADMAP.md`
- **Todo PR com mudança de asset inclui bump de versão no mesmo commit**

### Conteúdo médico (`data/topics.js`) — gate cumulativo

Editar ou implementar conteúdo médico em `data/topics.js` exige, **cumulativamente**:

a. autorização explícita do usuário para aplicar a alteração;
b. revisão formal pela skill `revisar-nefroquest` (`.claude/skills/revisar-nefroquest/`);
c. veredito editorial de aprovação (emitido apenas por `revisar-nefroquest` — ver seção "Regras editoriais" abaixo);
d. `Autorização de publicação: LIBERADA`;
e. ausência de pendência decisiva ou de combinação inválida entre Evidência e Pendência (Handbook §18.4).

Nenhuma dessas condições substitui as demais:

- autorização genérica do usuário **não** substitui o gate editorial (b–e);
- publicação LIBERADA **não** substitui a autorização explícita do usuário (a).

**Item com Autorização de publicação BLOQUEADA não pode ser escrito em `data/topics.js`, em nenhuma circunstância.**

#### Mudança material invalida liberação anterior

Qualquer mudança material em enunciado, alternativas, gabarito, explicação ou referências **invalida** a liberação anterior até reavaliação formal pela `revisar-nefroquest` (Handbook §18.4). Correções estritamente técnicas ou ortográficas devem se manter dentro do escopo autorizado e não podem ser usadas para introduzir mudança clínica sem nova revisão.

---

## Regras editoriais

Sempre que a tarefa envolver avaliar, revisar, corrigir, reescrever, criar, excluir, classificar ou implementar uma questão médica do NefroQuest, carregue e siga integralmente a skill apropriada antes de analisar ou modificar a questão.

Isso inclui solicitações sobre:

* enunciado;
* alternativas;
* gabarito;
* explicação;
* referências;
* cards científicos;
* dificuldade;
* ambiguidade;
* qualidade pedagógica;
* atualização científica;
* implementação de questões no código;
* revisão em lote do banco de questões.

Não faça revisão médica apenas com conhecimento geral quando essa skill estiver disponível.

Caso o usuário peça apenas uma alteração visual, estrutural ou técnica que não envolva o conteúdo médico da questão, a skill não precisa ser carregada.

### Roteamento obrigatório pelas skills

**Criação** — use `.claude/skills/criar-nefroquest/`:

- não emite veredito editorial;
- todo item recém-criado nasce com `Autorização de publicação: BLOQUEADA`;
- entrega o pacote da questão e encaminha para revisão formal — nunca escreve diretamente em `data/topics.js` nesse estado.

**Revisão** — use `.claude/skills/revisar-nefroquest/`:

- é a única skill que emite um dos 7 vereditos editoriais do Handbook;
- é a única skill que pode derivar `Autorização de publicação: LIBERADA`.

### Os três eixos

Toda questão médica é classificada em três eixos independentes (Handbook §18.4):

- **Evidência:** VERIFICADA · PARCIALMENTE VERIFICADA · NÃO VERIFICADA
- **Pendência:** NENHUMA · NÃO DECISIVA · DECISIVA
- **Publicação:** LIBERADA · BLOQUEADA — sempre **derivada** dos dois eixos acima e do veredito editorial, nunca atribuída livremente

O veredito editorial (um dos 7, emitido apenas por `revisar-nefroquest`) é distinto desses três eixos. A fórmula completa de derivação está no Handbook §18.4 e não é duplicada aqui.

---

## Workflow padrão

1. Ler este arquivo e identificar apenas os arquivos necessários
2. Se a tarefa envolver conteúdo médico (`data/topics.js` ou qualquer questão):
   a. identificar se é criação ou revisão;
   b. carregar a skill correspondente (`criar-nefroquest` ou `revisar-nefroquest`);
   c. trabalhar primeiro em modo relatório, salvo instrução explícita em contrário;
   d. confirmar autorização explícita do usuário para a alteração;
   e. confirmar o gate editorial (veredito de aprovação + `Autorização de publicação: LIBERADA` + ausência de pendência decisiva/combinação inválida);
   f. só então editar `data/topics.js`
3. Fazer a menor mudança possível que resolve o problema
4. Se mudou `style.css` / `js/*.js` / qualquer asset: bumpar `version.json` e `sw.js` no mesmo commit
5. Abrir um único PR com fixes + version bump juntos
6. Listar arquivos alterados e explicar como testar
