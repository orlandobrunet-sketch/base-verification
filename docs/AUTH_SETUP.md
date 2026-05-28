# NefroQuest — Auth Setup (Google OAuth via Supabase)

Guia operacional para configurar/manter o login com Google e preparar a troca futura para um custom domain (`auth.nefroquest.com`).

---

## Estado atual

**Frontend (este repositório):**

- `js/auth.js`: define `SUPA_URL`, `SUPA_KEY` e `AUTH_REDIRECT_URL`; também expõe via `window.NQ_CONFIG.{SUPA_URL, SUPA_KEY, AUTH_REDIRECT_URL}`.
- `loginWithGoogle()` chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: AUTH_REDIRECT_URL } })`.
- `AUTH_REDIRECT_URL`:
  - localhost / 127.0.0.1 → `location.origin` (dev)
  - qualquer outro hostname → `https://nefroquest.com` (produção)
- Demais módulos consomem `SUPA_URL` do escopo global ou de `window.NQ_CONFIG` como fallback.

**Supabase Dashboard — Auth Settings:**

- Site URL = `https://nefroquest.com`
- Redirect URLs (allowlist):
  - `https://nefroquest.com/**`
  - `http://localhost:8000/**` (ou porta usada pelo dev local)
  - `http://127.0.0.1:8000/**`

**Google Cloud Console — OAuth Client (Web application):**

- OAuth consent screen → App name = **NefroQuest** (controla o texto "Continuar para …")
- Authorized JavaScript origins:
  - `https://nefroquest.com`
  - `http://localhost:8000`
- Authorized redirect URIs:
  - `https://wviutasgroltjuyxpevc.supabase.co/auth/v1/callback` (atual)
  - `http://localhost:8000` (opcional para dev)

---

## Por que aparece "Prosseguir para wviutasgroltju...supabase.co"?

A frase de consent screen do Google é definida pelo **hostname registrado como Authorized Redirect URI** no OAuth Client. Como o callback do Supabase está hospedado em `https://[PROJECT_REF].supabase.co/auth/v1/callback`, o Google mostra esse domínio.

Não há mudança no frontend que altere esse texto. As opções para resolver são:

1. **Personalizar o App Name no Google Cloud OAuth consent screen.** Não tira o hostname, mas o "NefroQuest" aparece logo acima como app oficial.
2. **Configurar custom auth domain no Supabase** (recurso do plano Pro) — passa o callback para `https://auth.nefroquest.com/auth/v1/callback` e o Google passa a mostrar `auth.nefroquest.com`. Esta é a solução completa.

---

## Plano de migração para `auth.nefroquest.com`

### 1. Supabase Dashboard
- Settings → Custom Domains → adicionar `auth.nefroquest.com`
- Seguir wizard para gerar registros DNS
- Aguardar provisionamento (até alguns minutos)

### 2. DNS (Registro.br / Cloudflare / etc)
Adicionar registros que o Supabase pedir, tipicamente:
- `CNAME` `auth` → `customer-XXXX.supabase-domains.net` (ou similar)
- `TXT` (verificação)

### 3. Google Cloud Console — Atualizar OAuth Client
Adicionar (sem remover o antigo ainda):
- Authorized JavaScript origins → adicionar `https://auth.nefroquest.com`
- Authorized redirect URIs → adicionar `https://auth.nefroquest.com/auth/v1/callback`

Manter o antigo (`wviutasgroltjuyxpevc.supabase.co/auth/v1/callback`) ativo por algumas horas para evitar quebra durante a propagação.

### 4. Atualizar este repositório
- `js/auth.js` linha do `SUPA_URL`: trocar para `https://auth.nefroquest.com`
- (CSP em `vercel.json` já permite `*.supabase.co`; talvez precise abrir também `auth.nefroquest.com` no `connect-src` se o Supabase mover o WebSocket realtime para o custom domain)

### 5. Verificar
- Login com Google: consent mostra `auth.nefroquest.com` no lugar de `…supabase.co`
- Logout / re-login: token funciona, sessão persiste

### 6. Após confirmação (24–48 h)
- Remover do Google Cloud OAuth Client o redirect URI antigo `wviutasgroltjuyxpevc.supabase.co/auth/v1/callback`

---

## Locais com `wviutasgroltjuyxpevc.supabase.co` hardcoded

Apenas para referência ao migrar (não mexer agora):

| Arquivo | Linha aprox. | Tipo |
|---------|-------------|------|
| `js/auth.js` | `const SUPA_URL = ...` | **Único ponto a mudar quando migrar** |
| `js/utils.js` | fallback string em `send-contact` | só usado se o global não estiver definido |
| `supabase/config.toml` | `project_id` | identifica o projeto — **NÃO MUDA** mesmo com custom domain |
| `vercel.json` | CSP `connect-src` `https://*.supabase.co` | continua válido (wildcard) |
| `CLAUDE.md`, `docs/PROJECT_NEFROQUEST.md` | doc | atualizar quando migração concluir |

---

## Variáveis de ambiente das Edge Functions (Supabase)

Continuam as mesmas:

| Função | Variável |
|--------|----------|
| ai-mentor, ai-diagnosis | `ANTHROPIC_API_KEY` |
| send-flag, send-contact | `WEB3FORMS_KEY` |
| create-mp-preference, mp-webhook | `MP_ACCESS_TOKEN`, `APP_URL` |
| send-push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |

**Importante:** se `APP_URL` (em `create-mp-preference`) estiver setado para `https://nefroquest.com`, não precisa mudar na migração — é o redirect pós-pagamento, não relacionado ao auth callback.

---

## Checklist rápido (debug login Google)

- [ ] Site URL no Supabase Dashboard = `https://nefroquest.com`
- [ ] Redirect URL `https://nefroquest.com/**` listada no Supabase
- [ ] OAuth consent screen no Google → App name = "NefroQuest"
- [ ] OAuth Client → Authorized redirect URI inclui `https://[PROJECT_REF].supabase.co/auth/v1/callback`
- [ ] CSP em `vercel.json` permite `*.supabase.co` no `connect-src` ✓
