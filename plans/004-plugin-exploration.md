# Plan 004: Explorar os ~80% de plugins/MCP ainda ociosos — 1 por 1, com uso concreto no NefroQuest

> **Natureza deste plano**: diferente dos planos 001–003 (mudança de código), este é um
> **plano operacional de exploração**. Cada item abaixo é uma sessão curta: "usar o plugin X
> para a tarefa concreta Y no NefroQuest; explorado = Z". Executar **em ordem**, um por vez,
> reportando o achado de cada um antes de seguir. Nada aqui altera código por si só — quando
> um plugin revelar um conserto necessário, isso vira um plano/PR próprio.
>
> **Planned at**: commit `2c92b91`, 2026-06-26 · **Categoria**: dx/ops

## Status

- **Priority**: P2 (exploração de capacidade; não bloqueia features)
- **Effort**: M no total; cada item é S
- **Depends on**: nada. Mercado Pago (item 7) está **em espera** por decisão do usuário.

## Por que isto importa

A sessão atual usou bem `improve`, `revisar/criar-nefroquest`, `systematic-debugging`,
PubMed e ClinicalTrials — mas isso é ~20% do que está disponível. Vários plugins mapeiam para
necessidade real e não-explorada do NefroQuest (saúde pós-deploy, backend ao vivo, verificação
visual, evidência médica mais profunda). O objetivo é **descobrir valor real**, não usar
ferramenta por usar: cada item tem um teste de "isto entregou algo útil ou é ruído para este
projeto?".

Contexto recente (não duplicar): a auditoria `improve` (planos 001–003) já rodou; o **DIR-1
(motor IRT)** foi implementado via Antigravity (#530, v12.35); o **Plano 003 (send-push deno
types)** também (deno check voltou a ser bloqueante).

## Convenções de execução

- Executar **em ordem** (Tier 1 → Tier 2). Parar e reportar após cada item.
- Para cada item registrar: **(a)** o que foi feito, **(b)** achado concreto, **(c)** veredito
  `ÚTIL / SITUACIONAL / RUÍDO` para o NefroQuest, **(d)** follow-up (vira plano/PR? qual?).
- Atualizar a tabela de status no fim deste arquivo a cada item.
- **Somente leitura por padrão.** Qualquer escrita/efeito externo (mandar push, mudar config,
  abrir issue, deploy) exige confirmação do usuário antes — ver "Guardrails".
- Plugins que exigem `authenticate` (OAuth) **não** são acionados sem o usuário autorizar a
  conexão na hora.

## Guardrails (o que NÃO fazer sem OK explícito)

- **Sentry**: ler/triar à vontade; **não** resolver/ignorar/atribuir issues sem confirmação.
- **Supabase**: apenas leitura (advisors, schema, RLS, contagens). **Nenhuma** migration,
  alteração de dados, deploy de function ou mudança de RLS sem plano + OK.
- **send-push / Edge Functions**: **nunca** disparar push real (alcança usuários). Só inspeção.
- **Vercel**: ler status/logs/env keys (nomes, nunca valores). **Nenhum** deploy/promote/rollback
  nem mudança de env sem OK.
- **Browser/Chrome/Playwright MCP**: navegar e observar produção é ok; **não** logar em conta,
  preencher formulário, clicar em compra/checkout, nem aceitar banners.
- **Mercado Pago**: **em espera** — não tocar.
- Segredos: nunca imprimir valores de env/keys/tokens; só nome + localização.

---

## Tier 1 — Alto encaixe (executar nesta ordem)

### 1. Sentry — saúde pós-deploy (COMEÇAR AQUI)

- **Uso concreto**: soltamos v12.31→v12.35 hoje (fix do boss/Fase Final, reescrita de questão,
  motor IRT). Puxar os erros do topo das últimas 24–48 h e cruzar com esses deploys: algo novo
  surgiu? o IRT (`drawQuestion`/`calculateUserTheta`) ou o `window.state` global geraram exceção?
  o alerta histórico #677057 reapareceu?
- **Como**: MCP `sentry` (`find_organizations` → `find_projects` → `search_issues`/`search_events`),
  ou a skill `sentry:sentry-workflow`. Memória [[sentry-triage]] tem org/projeto e o baseline
  (574 do topo = ruído de extensão).
- **Explorado =**: lista priorizada dos issues ativos pós-v12.31, marcando o que é (i) regressão
  real dos deploys de hoje, (ii) ruído conhecido, (iii) novo a investigar. Cada regressão real
  vira um plano/PR.
- **Prereq**: MCP Sentry conectado (já usado antes na conta). **Guardrail**: só leitura/triagem.

### 2. Verificação no navegador — confirmar os deploys de hoje na produção real

- **Uso concreto**: shippamos 5 versões hoje sem confirmar visualmente nada. Abrir
  `https://nefroquest.com` e verificar: (a) **Fase Final** (admin) ativa o layout do boss agora
  (fix #527); (b) a questão `effd5ee0` reescrita renderiza certo com o novo card ENVISION; (c) o
  IRT roda sem erro de console numa jornada curta.
- **Como**: skill `/verify` ou `/run`; ou Claude-in-Chrome (`mcp__Claude_in_Chrome__*`) /
  Playwright MCP / Claude Preview. Ler console (`read_console_messages`) para exceções do IRT.
- **Explorado =**: confirmação visual + console limpo dos 3 itens, ou bug reproduzido com
  evidência (screenshot) → vira plano.
- **Prereq**: extensão Chrome conectada (ou Playwright MCP). **Guardrail**: não logar/clicar em
  checkout; navegação e leitura apenas.

### 3. Supabase — auditoria viva do backend (RLS, advisors, 7 Edge Functions)

- **Uso concreto**: reconferir o estado pós-migration 015 (memória [[supabase-advisors]]),
  rodar os **advisors** de segurança/perf atuais, listar policies RLS das tabelas sensíveis
  (`profiles`, `leaderboard`, `processed_payments`, `ai_usage`) e checar se as 7 Edge Functions
  estão na versão esperada. Cruzar com o que o CLAUDE.md documenta.
- **Como**: MCP `supabase` (precisa `authenticate`) ou a skill `supabase`. Advisors/queries via
  CLI também (memória diz que dá sem Docker).
- **Explorado =**: diff entre "documentado" e "real" (advisors abertos, RLS faltando, function
  desatualizada). WARNs intencionais já conhecidos **não** contam como achado.
- **Prereq**: conexão Supabase autorizada pelo usuário. **Guardrail**: leitura apenas.

### 4. context7 — docs atualizadas ao tocar backend/infra

- **Uso concreto**: ferramenta de apoio aos itens 3 e 5. Ao mexer em `@supabase/supabase-js`,
  Web Push (VAPID), ou Playwright, puxar a doc vigente em vez de confiar na memória do modelo.
- **Como**: MCP `context7` (`resolve-library-id` → `query-docs`).
- **Explorado =**: validado que responde corretamente para ao menos uma lib do stack
  (ex.: supabase-js auth). Veredito de utilidade contínua.
- **Prereq**: nenhum. **Guardrail**: n/a (somente leitura de docs).

### 5. Evidência médica além do PubMed — Consensus, ChEMBL, bioRxiv/medRxiv, OpenTargets

- **Uso concreto**: acelerar a verificação de questões de farmacologia/mecanismo (já temos um
  fluxo com PubMed + ClinicalTrials). Teste real: pegar 1 questão de fármaco do banco (ex.: um
  inibidor de SGLT2 ou um agente de glomerulopatia) e validar mecanismo/dose via **ChEMBL**
  (farmacologia) e **Consensus** (síntese de evidência); comparar com o que o card afirma.
- **Como**: MCPs `chembl`, `consensus`, `biorxiv`, `open_targets` (bio-research). Consensus exige
  citar e mostrar a mensagem de uso dele literalmente.
- **Explorado =**: para 1 questão-piloto, relatório de concordância/divergência fonte×card, e
  veredito de quais dessas fontes valem no fluxo `revisar-nefroquest` (vs. ruído).
- **Prereq**: alguns exigem `authenticate` (owkin/synapse/wiley são gated — pular se pedirem login).

---

## Tier 2 — Situacional (executar se Tier 1 indicar valor)

### 6. Playwright MCP — dirigir/depurar a suíte E2E

- **Uso concreto**: rodar interativamente os specs que aparecem "falhando" localmente (eram só
  timeout por falta de server :5500) e, de quebra, exercitar o novo `15-adaptive-learning-irt`.
- **Explorado =**: suíte verde local com server de pé, ou bug real isolado. **Guardrail**: roda
  contra local/preview, não produção com efeitos.

### 7. Mercado Pago — **EM ESPERA** (decisão do usuário)

- Há trabalho pendente (migração de conta, env+redeploy+teste — memória [[mp-account-migration]]),
  mas o usuário pediu para aguardar. **Não executar** até liberar. Quando liberar: `mp-test-setup`,
  `mp-webhooks` (simular/validar HMAC), `mp-review` (checklist oficial).

### 8. scheduled-tasks / cron — automações recorrentes

- **Uso concreto**: se o item 1 (Sentry) provar valor, agendar uma triagem recorrente
  (ex.: resumo diário dos issues novos) ou um lembrete de auditoria de questões.
- **Explorado =**: 1 tarefa agendada de exemplo proposta (não criada sem OK). **Guardrail**:
  criar agendamento exige OK.

### 9. Vercel — status de deploy / logs / env keys

- **Uso concreto**: o projeto usa GitHub Pages + Vercel. Ver status do último deploy, logs de
  função (se houver no Vercel) e **nomes** das env vars (nunca valores), conferindo contra o que
  o CLAUDE.md lista.
- **Explorado =**: inventário de env keys esperadas vs presentes; veredito se o Vercel agrega
  algo além do GitHub Pages aqui. **Guardrail**: sem deploy/promote/rollback/mudança de env.

---

## Tier 3 — Baixo encaixe (reconhecidos; NÃO perseguir sem pedido)

Notion, Canva, Figma, Asana/Atlassian/Linear/Intercom/Slack, Google Drive, BioRender,
Owkin/Synapse/Wiley (gated), computer-use. Sem mapeamento para necessidade atual do NefroQuest
(fluxos de PM/design-assets/desktop). Listados para honestidade; pular salvo pedido explícito.

## Done criteria (do plano como um todo)

- [ ] Itens 1–5 (Tier 1) executados, cada um com achado + veredito ÚTIL/SITUACIONAL/RUÍDO registrado na tabela.
- [ ] Itens 6, 8, 9 (Tier 2) executados se o Tier 1 justificar; caso contrário, marcados N/A com motivo.
- [ ] Item 7 (Mercado Pago) permanece EM ESPERA até liberação.
- [ ] Cada regressão/conserto descoberto vira um plano numerado próprio (005+), não é corrigido dentro deste plano.

## Tabela de status (atualizar a cada item)

| # | Plugin | Tier | Status | Veredito | Follow-up |
|---|--------|------|--------|----------|-----------|
| 1 | Sentry | 1 | DONE (2026-06-26) | **ÚTIL** | Pós-deploy v12.31–12.36 limpo (24h = 1 evento Turnstile externo); IRT/boss/window.state sem exceção. ReferenceErrors (ui/state/PREMIUM_KEY) são todos do release **9.71** (cache antigo), não bug atual. Opcional: estender `ignoreErrors` p/ ruído 9.71 e `localStorage em data:` |
| 2 | Browser verify (Playwright MCP) | 1 | DONE (2026-06-26) | **ÚTIL** | Prod serve v12.36; IRT presente (`calculateUserTheta`/`getAdaptiveTargetDifficulty`); 0 erros do nosso código (3 erros = Turnstile externo). **Provou o fix #532**: após `_loadTopics()`, `window.questionBank`=array(994) → SGD agora vivo. Não verificável sem login: boss/Fase Final (admin-gated) e render de questão específica |
| 3 | Supabase | 1 | PARCIAL (2026-06-26) | **SITUACIONAL** | MCP plugin **caído** (server desconectado) → advisors/RLS deep-audit bloqueado. CLI (linkado, logado) deu: projeto ACTIVE_HEALTHY, Postgres 17.6.1; **drift de tracking**: migrations 003–015 locais não registradas no histórico remoto (esperado — aplicadas manualmente no SQL Editor, CLAUDE.md). Follow-up: reconectar MCP p/ advisors; opcional `migration repair --status applied` p/ reconciliar tracking (escrita, exige OK). |
| 4 | context7 | 1 | TODO | — | — |
| 5 | Evidência médica (Consensus/ChEMBL/bioRxiv/OpenTargets) | 1 | TODO | — | — |
| 6 | Playwright MCP | 2 | TODO | — | — |
| 7 | Mercado Pago | 2 | EM ESPERA | — | aguardando usuário |
| 8 | scheduled-tasks | 2 | TODO | — | — |
| 9 | Vercel | 2 | TODO | — | — |
| — | Tier 3 (Notion/Canva/Figma/…) | 3 | N/A | RUÍDO p/ projeto | pular salvo pedido |

## STOP / reportar

- Se um plugin exigir login/OAuth (`authenticate`) → parar e pedir autorização ao usuário; não conectar sozinho.
- Se a exploração revelar uma regressão de produção → parar a exploração, reportar, e propor um plano de correção (não consertar dentro deste plano).
- Se um plugin do Tier 1 estiver indisponível/desconectado → registrar e seguir para o próximo, não travar a fila.
