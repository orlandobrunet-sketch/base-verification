# NefroQuest — Roadmap

## Aviso

Este documento orienta a direção do produto. Nenhum item aqui autoriza execução automática.
Toda tarefa deve ser solicitada explicitamente pelo usuário.

---

## 10 Melhorias Estratégicas — Pendentes para Avaliação Conjunta

> Levantadas pela auditoria técnica sênior (maio/2026). Cada item requer discussão antes de execução.
> Nenhum destes itens deve ser implementado automaticamente.

| # | Melhoria | Descrição | Impacto esperado |
|---|----------|-----------|-----------------|
| E1 | **Motor adaptativo de aprendizado (IRT leve)** | Ajustar dificuldade por eixo temático em tempo real com base no histórico individual do usuário. Algoritmo IRT (Item Response Theory) simplificado integrado ao banco de questões. _Base parcial existente:_ votação de dificuldade crowd-sourced (`question_difficulty_votes`, migration 010, v11.82) para recalibrar o `_d` das questões. Falta o motor adaptativo por usuário em si. | Retenção, engajamento premium |
| E2 | **Plano de estudo inteligente semanal** | Trilhas automáticas geradas por IA baseadas nos erros recorrentes e tempo disponível declarado. Ex.: "Esta semana: 3 sessões de 20min focadas em TFG e Proteinúria." | Recorrência de uso, diferencial competitivo |
| E3 | **Dashboard pedagógico premium** | **Concluído (v11.47)** — Métricas por competência (acurácia por eixo, pior rendimento em destaque, etc.) com gráfico em radar e estatísticas detalhadas. | Monetização, valor percebido premium |
| E4 | **Simulado estilo prova de residência** | **Concluído** — Modo de simulado (60 questões com tempo limite de 90min e histórico/resultados do simulado). | Conversão premium, NPS |
| E5 | **Sistema de revisão espaçada robusto (SM-2/FSRS)** | **Concluído (v11.79)** — Motor FSRS-4.5 em `js/utils.js` (`updateSRData`) substitui o SM-2, com migração transparente dos cards antigos (`{ef,interval,reps,due}` → estado FSRS). Deck de revisão diária + push personalizado: parcialmente coberto (forecast no dashboard + campanha de push admin). | Retenção de longo prazo |
| E6 | **Banco de questões versionado com revisão editorial** | Workflow interno de QA: status por questão (rascunho → revisão médica → publicado), painel de auditoria, versionamento de gabaritos e revisão de questões flagadas pelos usuários. | Qualidade do conteúdo, confiança |
| E7 | **Telemetria de funil de conversão premium** | Rastrear jornada completa: paywall_shown → plan_selected → checkout_started → payment_approved por coorte (canal, classe, nível). Otimizar gatilho do paywall por contexto comportamental. | Receita, otimização de monetização |
| E8 | **Modo offline enriquecido** | **Concluído (v11.47)** — Estudo Livre offline servido via Service Worker (offline.html) carregando banco local e sincronização automática transparente ao reconectar. | Retenção mobile, experiência em áreas sem sinal |
| E9 | **Programa de segurança contínua** | Suíte automatizada de testes de segurança: CSP validation, XSS payloads em campos livres (ranking, perfil, formulários), fuzzing de endpoints IA, scan de dependências. CI obrigatório antes de merge. | Segurança, confiança do usuário |
| E10 | **Internacionalização planejada (pt-BR / en)** | Arquitetura i18n para expansão acadêmica e parcerias internacionais. Separar strings de UI em arquivo de locale, traduzir questões com revisão médica em inglês. | Alcance global, parcerias |

---

## Dívida Técnica

> Achados da auditoria técnica sênior (maio/2026). **Todos resolvidos (v11.55–v11.56).**

| # | Item | Severidade | Status |
|---|------|-----------|--------|
| DT1 | **FSM de áudio explícita** | Média | **Concluído (v11.55)** — FSM `idle→starting→playing→paused→failed→stopped` para música de boas-vindas e de fundo em `js/audio.js`, com shim de retrocompatibilidade (`welcomeMusicStarted`/`musicStarted` viraram getters). |
| DT2 | **Leaderboard push — idempotência por partida** | Média | **Concluído (v11.55)** — FSM `idle→in_flight→done→failed` com timeout defensivo de 10s em `js/leaderboard.js`; `_boardPushedThisSession` virou getter derivado do estado. |
| DT3 | **Superfície de `innerHTML` — campanha de redução** | Alta | **Concluído (v11.55)** — Renderizadores migrados para `createElement`/`textContent` no ranking, dashboard e painel admin. |
| DT4 | **Pipeline E2E reproduzível** | Alta | **Concluído (v11.55)** — Script `npm run setup:e2e` provisiona browsers; smoke-test separado no CI. |
| DT5 | **Webhook Mercado Pago — hardening** | Baixa | **Concluído (v11.56)** — Idempotência por `paymentId` via tabela `processed_payments` (migration 007); assinatura HMAC SHA-256 já validada; **adicionados** comparação em tempo constante (`timingSafeEqual`, anti-timing-attack) e log estruturado de tentativas inválidas (`mp_webhook_rejected`). |
| DT6 | **Observabilidade de erros silenciosos** | Média | **Concluído (v11.55)** — Roteador unificado de exceções com contexto enviado a Sentry/GA4. |

---

## Grimório — Conteúdo Pendente

| # | Item | Detalhe | Status |
|---|------|---------|--------|
| G1 | **Resumos das referências (`refsDB`)** | Cada entrada em `data/refs.js` possui os campos `resumo`, `conclusao` e `curiosidade` estruturados e exibidos no Grimório e nas respostas do jogo. | **Concluído** |

---

## Bugs Ativos

| # | Bug | Arquivo | Status |
|---|-----|---------|--------|
| B1 | Fase Final (admin): tela de perguntas não muda ao ativar | `js/game.js:adminJumpToBoss` | **Corrigido** |
| B2 | Oráculo: pergunta cortada na exibição do contexto | `js/study-mode.js:1248` | **Corrigido** |

---

## Alta Prioridade — Segurança

| # | Tarefa | Detalhe |
|---|--------|---------|
| S1 | Chave Web3Forms proxy | Já em edge function (`send-flag`, `send-contact`) — **feito** |
| S2 | JWT nas edge functions | `ai-mentor` e `ai-diagnosis` já verificam JWT; `send-flag`/`send-contact` são públicas por design |
| S3 | Content Security Policy (CSP) | **Feito** — `media-src`, `worker-src` adicionados; `api.web3forms.com` removido |

---

## Alta Prioridade — Performance

| # | Tarefa | Detalhe |
|---|--------|---------|
| P1 | `topics.js` lazy load | **Feito** (v9.22) |
| P2 | SDK Supabase com `defer` | **Feito** — SDK já estava no fim do `<body>`, não bloqueia renderização |
| P3 | Fontes: `font-display: swap` | **Feito** — `display=swap` no URL Google Fonts + `media=print/onload` não-blocking |
| P4 | Imagens: `loading="lazy"` | **Feito** — já presente em todas as `<img>` |

---

## Média Prioridade — PWA

| # | Tarefa | Detalhe |
|---|--------|---------|
| W1 | Screenshots no manifest | **Feito** — imagens e entradas no manifest já presentes |
| W2 | iOS splash screens | **Feito** (v9.21) |
| W3 | Push notifications server-side | **Concluído (v11.77)** — migration 004 ✅, VAPID secrets ✅, `window._VAPID_PUBLIC_KEY` ✅. Edge function `send-push` criada em `supabase/functions/send-push/` com autorização por JWT de admin (`app_metadata.is_admin`) + UI de campanha de push no painel admin. |

---

## Média Prioridade — CSS/UI

| # | Tarefa | Detalhe |
|---|--------|---------|
| C1 | `!important` — reduzido | De 321 para ~99; restantes têm conflito legítimo com `.boss-battle-mode` — **concluído** |
| C2 | z-index centralizado | `.app` e `.action-dock` migrados; valores locais (0-3, 10-11 em stacking contexts) deixados como estão — **concluído** |
| C3 | `prefers-reduced-motion` | **Feito** — media query global no fim do `style.css` cobre todas as animações |
| C4 | Estilos inline JS → classes CSS | **Feito** — flag-chip, flag-status, ref-copy-btn, boss-hp, meter-result, minigame-fb migrados para classes CSS |

---

## Baixa Prioridade — Arquitetura JS

| # | Tarefa | Detalhe |
|---|--------|---------|
| A1 | Separar `game.js` | **Feito** — 6180 → 3094 linhas; 9 módulos extraídos |
| A2 | Store central de estado | **Feito** — Proxy reativo com debounce de 500ms + auto-invalidação de statsCache |
| A3 | `await`/`try-catch` em async | **Feito** — 7 funções de auth + authLogout + enableStudyReminders + floating promises |
| A4 | Event delegation | **Feito** — todos `onclick=` inline migrados para dispatcher central |

---

## A Testar em Produção (pós-redeploy)

- [ ] `ai-mentor` — Oráculo respondendo corretamente
- [ ] `ai-diagnosis` — diagnóstico ao final de sessão
- [ ] `send-flag` — reportar erro em questão (checa se WEB3FORMS_KEY chegou)
- [ ] `send-contact` — formulário de contato
- [ ] `ai_usage` — quota sendo contabilizada na tabela (SQL: `SELECT * FROM ai_usage ORDER BY date DESC LIMIT 10`)
- [ ] Paywall premium — fluxo de compra Mercado Pago funcionando
- [ ] GA4 — verificar dados chegando no painel após fix do Measurement ID (G-0TS171XV3K)

---

## Pendente — Infraestrutura e Negócio

| # | Tarefa | Detalhe |
|---|--------|---------|
| I1 | Criar e-mail `contato@nefroquest.com` | Necessário para formulário de contato e identidade profissional |
| I2 | Testar fluxo completo de pagamento | Mercado Pago: preference → checkout → webhook → `profiles.is_premium = true`; testar plano mensal e vitalício |
| I3 | ~~Deploy edge function `send-push`~~ | **Feito** — deployada no Supabase Dashboard |

---

## Features Futuras

### Eixo Pedagógico — Raciocínio Clínico (proposto jun/2026)

> Conjunto de melhorias para elevar o app de "quiz gamificado" para **ferramenta de formação de raciocínio clínico**. Nenhuma altera o conteúdo das questões — apenas adiciona camadas/metadados por cima. Discutir antes de executar.
> O item 5 da proposta original (Modo Leitura / acessibilidade) **já foi implementado** (v11.81).

| # | Melhoria | Descrição | Impacto |
|---|----------|-----------|---------|
| PED-1 | **Raciocínio guiado no erro** | **Concluído (v11.86)** — Ao errar na jornada, chips "por que você escolheu essa?" mapeando o erro a um padrão de raciocínio nomeado (`knowledge`, `between_two`, `confusion`, `anchoring`, `misread`, `guess`) com antídoto pedagógico. Registro local + Supabase (`question_error_reasons`, migration 011) alimenta o card "Padrões de Raciocínio". | Diferencial central — raciocínio, não só recall |
| PED-2 | **Mapa de Competências** (área separada do radar por eixo) | Camada de *tags de competência* sobre as questões (interpretar gasometria, estratificar risco de progressão, ajustar dose em DRC, reconhecer emergência dialítica...). **Área própria no dashboard, distinta do gráfico de radar por eixo temático** — radar responde "onde acertei menos"; o mapa responde "o que ainda não sei fazer". Habilita certificação informal ("Você domina interpretação ácido-base"). | Plano de desenvolvimento real; valor premium |
| PED-3 | **Onboarding com diagnóstico inicial (placement)** | **Concluído — Fase A (v11.83)** — "Ritual de Iniciação" (`js/minigame.js`, `openRitual`, 8 questões adaptativas por banda de dificuldade) estima o nível e pré-seleciona a dificuldade recomendada. _Pendente:_ semear diretamente o agendamento FSRS a partir do resultado do ritual. | Retenção desde o 1º minuto |
| PED-4 | **Sistema de design (tokens + componentes)** | Consolidar cores/raios/sombras/espaçamentos/tipografia em design tokens + classes utilitárias; migrar componentes recorrentes (`.nq-card`, `.nq-modal`, `.nq-btn`, `.nq-badge`) dos estilos inline em `innerHTML` para CSS real. Elimina a deriva visual (tons de roxo/raios divergentes entre modais) e acelera tudo que vier depois. | Coerência visual = rigor percebido; velocidade de dev |

### Biblioteca de Referências

**Conceito:** Botão na página principal que abre um modal/página com **todas as referências bibliográficas** nas quais as questões do jogo são embasadas. Demonstra o rigor científico da ferramenta e agrega valor percebido ao usuário.

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| REF-1 | Botão "Biblioteca" na main page | Botão visível na tela principal (landing + game screen), acessível sem login | ✅ Concluído |
| REF-2 | Modal de referências | Lista completa em ordem alfabética (autor, título, revista, ano, DOI/link), visual similar ao painel de refs das perguntas | ✅ Concluído |
| REF-3 | Dados das referências | Consolidar `data/refs.js` + `data/articles.js` em lista única deduplicada, ordenada A–Z por primeiro autor | ✅ Concluído |
| REF-4 | Seção "Sugerir artigo" | Ao final da biblioteca: formulário onde o usuário envia (a) link/DOI do artigo, (b) texto livre explicando por que é relevante para o NefroQuest — enviado via `send-contact` (Web3Forms) ou endpoint dedicado | ✅ Concluído |
| REF-5 | Edge function `suggest-article` | Recebe `{ articleUrl, articleTitle?, reason, userEmail? }` e encaminha por e-mail via Web3Forms. Alternativa: reutilizar `send-contact` com campo `subject` padronizado | ✅ Concluído |
| REF-6 | Referências das perguntas com artigo completo desbloqueável no baú | As referências de `data/refs.js` e `data/articles.js` são integradas e desbloqueadas à medida que o jogador acerta questões e abre baús. | ✅ Concluído |

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

### Minigame Ácido-Base

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| M1 | Minigame Ácido-Base interativo | Modo de jogo educacional com narrativa que ensina diagnóstico e manejo de distúrbios ácido-base | **Concluído (v11.47)** |

**Conceito:**
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

### Expansão Internacional (Longo Prazo)

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
| EN-7 | Infraestrutura EN | Registrar domínio `nephroquest.com` + criar e-mail `contact@nephroquest.com` para a versão em inglês | ⏳ Pendente |

#### Fase B — Google Play (Android) — versão EN

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| GP-1 | Listing em inglês | Título, descrição curta (80 chars), descrição completa (4.000 chars) em inglês | ⏳ Pendente |
| GP-2 | Screenshots EN | Capturas com UI em inglês — mesmas especificações (1080×1920, 9:16) | ⏳ Pendente |
| GP-3 | Publicar versão EN no Play Store | Mesma conta ($25 já paga), novo listing ou atualização com suporte a idioma | ⏳ Pendente |

#### Fase C — Apple App Store (iOS)

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| iOS-1 | Apple Developer Program | Conta em developer.apple.com — taxa anual de $99 USD | ⏳ Pendente |
| iOS-2 | Estratégia de publicação | **Opção A (recomendada):** PWA via WKWebView wrapper (ex: PWABuilder iOS) — sem Swift nativo. **Opção B:** app nativo React Native/Flutter — maior custo. | ⏳ Pendente |
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

### Dashboard e UX — Melhorias Futuras

#### Knowledge Cards — Artigos de História da Nefrologia

**Conceito:** Os artigos históricos que hoje aparecem nos baús durante o jogo ficariam também disponíveis no Dashboard como uma "Biblioteca de Conquistas". Cada card conteria um artigo da história da nefrologia que o jogador desbloqueou.

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| DC-1 | Cards de conhecimento no Dashboard | Seção "Biblioteca de Néfrons" no Dashboard: grid de cards mostrando artigos históricos já desbloqueados nos baús | ✅ Concluído (v11.76) |
| DC-2 | Estado de desbloqueio | Usar `unlockedArticles` (já salvo em localStorage) para mostrar quais artigos o jogador desbloqueou | ✅ Concluído (v11.76) |

---

#### Dashboard — Badges dentro de Conquistas

**Problema:** Os 5 badges (badge1–5 dos 20/40/60/80/100 acertos) ficam muito grandes no painel lateral esquerdo do jogo, ocupando espaço desproporcional no HUD.

**Solução:** Mover os 5 badges para dentro da seção Conquistas no Dashboard, onde fazem mais sentido contextualmente (ao lado das demais conquistas).

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| DC-3 | Mover badges para Conquistas no Dashboard | Remover `.badges-container` do painel lateral esquerdo do jogo e exibi-los dentro da modal de Conquistas / Dashboard | ✅ Concluído (v11.48) |

---

#### Leaderboard Alternativo — Perfil Global

**Problema:** O leaderboard atual registra pontuação por jogo. Um usuário com 50 partidas boas não aparece no ranking se cada jogo individual for menor que o recorde de outro.

**Conceito:** Leaderboard alternativo baseado no **perfil acumulado do usuário**: total de questões corretas, total de XP ganho, nível máximo atingido — não apenas o melhor score individual.

| # | Tarefa | Detalhe | Status |
|---|--------|---------|--------|
| DC-4 | Leaderboard de perfil global | **✅ Concluído (v11.72)** — Toggle "Recorde / Perfil Global" no ranking (`js/leaderboard.js` → `profileStatsPush`/render dedicado), ordena por `total_correct` desc + `best_level`. Reaproveitado também no dashboard. | ✅ Concluído |
| DC-5 | Coluna de stats acumulados no Supabase | **✅ Concluído** — Tabela `profiles_stats` (migration 009): `total_correct`, `total_games`, `best_level`, `character_name`, upsert por `user_id` — sem quebrar o ranking atual. | ✅ Concluído |

---

## Play Store — Checklist

### Estratégia técnica
O NefroQuest é publicado como **TWA (Trusted Web Activity)** — o APK Android é gerado automaticamente a partir da PWA via PWABuilder, sem necessidade de código nativo. A URL continua sendo `https://nefroquest.com`.

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
| PS-3b | Gerar APK TWA | pwabuilder.com → inserir `https://nefroquest.com` → Download Android Package |
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

## Redesign Visual — Fase 0 a 7

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

### Protocolo de aprovação (por tela)

```
1. Claude implementa em branch separada
2. Claude compartilha link do PR
3. Usuário abre no browser e revisa
4. Usuário aprova (merge) OU pede ajustes
5. Após merge confirmado → próxima tela
```

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

### FASE 1 — Telas de entrada

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

### FASE 2 — Game Screen

#### T4 — Game screen principal (pergunta ativa)
**Referência:** Mockup full 3 colunas

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

#### T5 — Game screen (resposta correta)
- Answer button selecionado: fundo verde + glow verde
- Ícone ✓ no círculo da letra
- Card de evidência expandido com texto completo
- "PRÓXIMA" button teal brilhante

| Status | → | ⏳ Junto com T4 |
|--------|---|-----------------|

#### T6 — Game screen (resposta errada)
- Answer button errado: fundo vermelho escuro
- Answer button correto: destacado em verde
- Opção de abrir Mentor IA
- Animação de shake no card

| Status | → | ⏳ Junto com T4 |
|--------|---|-----------------|

---

### FASE 3 — Modais principais

#### M5 — Mentor IA (Oráculo dos Néfrons)
- Header com ícone de cérebro roxo + "Oráculo dos Néfrons"
- Área de chat com bolhas de resposta
- Input de pergunta com borda dourada
- Indicador de quota (X de 5 consultas)

| Status | → | ⏳ Após T4 aprovado |
|--------|---|---------------------|

#### M1 — Baú / Chest
- Animação de abertura (CSS)
- Item revelado com moldura de raridade
- Botão "Equipar" ou "Vender"

| Status | → | ⏳ |

#### M2 — Forja
- Grid de itens disponíveis
- Preview de item selecionado
- Custo em ouro + botão craftar

| Status | → | ⏳ |

#### M4 — Conquista desbloqueada
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

---

## Capítulo de Plugins — Plano de Uso (proposto jun/2026)

> Foram instalados vários plugins/MCPs no ambiente de desenvolvimento. Este capítulo mapeia **cada plugin a um uso concreto no NefroQuest**, ordenado por impacto direto no produto. Nenhum item é executado automaticamente — cada um vira tarefa quando você autorizar (regra absoluta do CLAUDE.md).
>
> Legenda de prioridade: 🔴 alto impacto imediato · 🟡 acelera backlog existente · 🟢 oportunístico/futuro.

### 1. Infra do nosso stack (impacto direto)

| Plugin | O que faz | Como usar no NefroQuest | Primeira tarefa sugerida | Prio |
|--------|-----------|--------------------------|--------------------------|------|
| **supabase** (skill + MCP) | Acesso ao schema, migrations, RLS, Postgres best-practices ao vivo via MCP | Auditar RLS de **todas** as 11 tabelas (`profiles`, `leaderboard`, `ai_usage`, `question_*`, etc.), validar índices em `profiles_stats`/`leaderboard` (ordenação por `total_correct`/`score`), revisar migrations 001–011 e gerar as próximas (ex.: tabela de competências do PED-2) | **Auditado (advisors, jun/2026)** — Security: 3× RLS `WITH CHECK(true)` nas tabelas de insert público (ratings/votes/error-reasons, **intencional** — crowd-sourcing), 1× `is_admin()` SECURITY DEFINER (RLS depende, follow-up), 1× leaked-password (Pro-only). Performance: 5× `auth_rls_initplan`, 18× `multiple_permissive_policies`, 1× índice duplicado. **Migration 015 aplicada + verificada** (PR #490): Performance **24→6 WARNs** (`auth_rls_initplan` 5→0, `duplicate_index` 1→0, `multiple_permissive` 18→6). Os 6 restantes = sobreposição admin/self em `access_whitelist` SELECT (baixo impacto, deixado). Security 5 inalterado (3 inserts públicos intencionais + `is_admin` + leaked-password Pro). **Follow-up opcional**: consolidar `access_whitelist`, endurecer `is_admin()`. ✅ |
| **mercadopago** (skills + MCP) | Integra/revisa/testa Checkout, webhooks, cria test users | Fechar **I2** (testar fluxo completo mensal + vitalício): `mp-test-setup` cria usuário de teste e adiciona saldo; `mp-webhooks` simula o webhook e valida HMAC; `mp-review` roda o checklist oficial sobre `create-mp-preference`/`mp-webhook` | `mp-review` da integração atual + simular webhook aprovado | 🔴 |
| **sentry** (seer + skills + MCP) | Triagem de erros em produção, SDK setup, alertas | Sentry já está inline no `index.html`. Usar `seer` para perguntar "quais erros mais afetam usuários agora", configurar alertas (E7/observabilidade) e investigar erros silenciosos de sync Supabase | **Parcial (triagem v12.02)** — org `nefroquest`/projeto `javascript`, **816 eventos/30d**. ✅ Corrigido `_checkStudyReminder` ReferenceError (208, PR #484). **Pendente:** (a) `<unknown module>` SyntaxError "Unexpected token '<'/'function'" (574) → ruído de extensão/cache stale, filtrar via `ignoreErrors` no init do SDK; (b) `_dashGoWeakness` forEach undefined (2, dashboard.js) → null-safety; (c) `PREMIUM_KEY`/`ui`/`state`/`mgAnswer` is not defined (≤8 cada, auth/minigame) → checar `lastSeen`, provavelmente obsoletos; (d) configurar alertas E7 | 🟡 |
| **claude-api** (skill) | Referência viva de modelos/preços/tool-use Anthropic | Revisar as edge functions `ai-mentor` e `ai-diagnosis`: confirmar `model id` atual do Haiku, prompt caching para baratear quota, e migração de modelo | **Concluído (auditoria, v12.01)** — `claude-haiku-4-5-20251001` é ID válido e o **tier de custo correto** para features estudantis de alto volume; sem migração. **Prompt caching NÃO se aplica**: os system prompts (~150 tok no mentor, ~400 tok no diagnosis) ficam muito abaixo do mínimo cacheável do Haiku 4.5 (4096 tok) → `cache_control` seria no-op silencioso (`cache_creation_input_tokens: 0`). Controles de custo já sólidos: `max_tokens` limitado (600/900), validação de input, cota diária server-side fail-closed (5/3 grátis via RPC atômico migration 014). **Nenhuma mudança de código justificada.** | ✅ |
| **vercel** (skills + CLI) | Deploy, env vars, functions, firewall, performance | Hoje deploy é GitHub Pages + Vercel. Usar para gerir env vars das edge functions, e o `vercel-firewall`/BotID como base do **E9** (proteção dos endpoints de IA contra abuso) | **Avaliado (jun/2026)** — **A premissa do E9 via Vercel não se aplica:** o frontend chama os endpoints de IA **direto no Supabase** (`${SUPA_URL}/functions/v1/ai-mentor`), o tráfego **não passa pela Vercel** (que serve só o SPA estático, sem `api/`). Logo firewall/BotID/rate-limit da Vercel **não conseguem gatear os endpoints de IA**. **Anti-abuso já está na camada certa (Supabase Edge):** JWT obrigatório (bloqueia anônimo mesmo via curl direto), CORS allowlist, cota diária atômica fail-closed (5 mentor / 3 diagnosis grátis), premium server-validado. Vetor residual = account-farming (mitigação real = CAPTCHA/confirmação de e-mail no signup do Supabase Auth, **não** Vercel). `vercel.json` já tem postura forte (header set completo + CSP detalhado + cache tunado). **Follow-up opcional E9:** Turnstile/hCaptcha no signup + rate-limit por IP na edge function; `frame-ancestors 'none'` no CSP (defense-in-depth). ✅ |

### 2. Qualidade, testes e disciplina de engenharia

| Plugin | O que faz | Como usar no NefroQuest | Primeira tarefa sugerida | Prio |
|--------|-----------|--------------------------|--------------------------|------|
| **superpowers** | Workflows: brainstorming, writing/executing-plans, TDD, systematic-debugging, verification-before-completion, git-worktrees, code-review | Padrão de trabalho para **toda** feature nova grande (PED-2, i18n, redesign): brainstorming → plano escrito → execução com checkpoints. `systematic-debugging` para bugs intermitentes (race de sync). `using-git-worktrees` para isolar o redesign | Adotar como fluxo-padrão; aplicar brainstorming no PED-2 | 🔴 |
| **playwright** (MCP) | Dirige o browser p/ E2E e auditoria real | Rodar as 9 suites E2E existentes contra mudanças; **auditar de verdade** performance/contraste (validar a auditoria que fiz à mão hoje com Lighthouse/axe); cobrir fluxos sem teste (paywall, ritual de iniciação) | **Concluído (v12.01–12.03)** — (1) validação browser do grid de equipamentos (object-fit, 0 erros). (2) **Suítes E2E revividas** (PR #487): helper `injectGameState` estava quebrado (personagem antigo + assumia auto-resume) → consertado; assertions atualizadas ao UI atual; gates `isLiveEnv` removidos → **47 passed / 0 failed / 2 skip** local em ~1.9min. (3) **axe + Lighthouse** (PR #488): a11y WCAG no E2E padrão (achou+corrigiu contraste do rodapé, v12.03) + budget Lighthouse gated (a11y 94, BP 100, SEO 100). (4) **Cobertura extra** (PR #492): paywall + ritual de iniciação + axe na tela de Resultados do Simulado. Suíte: **54 passed / 3 skip**. | ✅ |
| **pr-review-toolkit** + **code-review** | Agentes especializados: bugs, silent-failure-hunter, test-analyzer, type-design, comentários; `/code-review ultra` | Rodar em todo PR antes do merge para `main` (deploy automático = risco alto). `silent-failure-hunter` é ideal p/ o código de sync Supabase | Rodar `/code-review` no próximo PR de feature | 🟡 |
| **code-simplifier** | Simplifica código preservando comportamento | Atacar a dívida de `innerHTML` com estilos inline (PED-4): simplificar renderizadores como `showExamResults` | Simplificar 1 renderizador-piloto após migrar p/ classes CSS | 🟡 |
| **feature-dev** (code-architect/explorer) | Explora codebase e desenha arquitetura | `code-explorer` para mapear o motor FSRS antes do PED-3 Fase B (semear agendamento); `code-architect` para desenhar o motor adaptativo **E1** | Blueprint do E1 (IRT leve) com code-architect | 🟡 |
| **context7** (MCP) | Docs ao vivo de libs/SDKs | Consultar APIs de Supabase JS, Web Push/VAPID, FSRS, Mercado Pago SDK sem depender de memória | Usar sob demanda nas tarefas acima | 🟢 |

### 3. Design, conteúdo e go-to-market

| Plugin | O que faz | Como usar no NefroQuest | Primeira tarefa sugerida | Prio |
|--------|-----------|--------------------------|--------------------------|------|
| **frontend-design** | Direção visual intencional (tipografia, identidade) | Guia estético do **Redesign Visual (Fases 0–7)** e do design system **PED-4** (tokens `.nq-*`) — evita "deriva de roxos/raios" citada no backlog | Definir tokens + 3 componentes-base na Fase 0 | 🟡 |
| **figma** | Design↔código, Code Connect | Se os mockups de alta fidelidade do redesign estiverem no Figma, gerar CSS a partir deles e manter Code Connect dos componentes `.nq-card`/`.nq-modal` | Importar 1 tela-piloto (T1 Landing) do Figma | 🟢 |
| **adobe-for-creativity** | Edição/redimensionamento de fotos e vídeos, design de assets, variações sociais | Gerar os assets pendentes da Play Store: **PS-2b** feature graphic 1024×500, **PS-2c/2d** screenshots 1080×1920, ícone adaptativo; e peças da campanha de Instagram (Posts A–G/Reels do roadmap) | Produzir feature graphic + 4 screenshots da Play Store | 🟡 |
| **anthropic-skills** (pptx/docx/pdf/xlsx, canvas-design, brand-guidelines) | Geração de documentos e artefatos | Material institucional: PDF de divulgação para faculdades/residências, planilha de tracking do funil (E7), deck de parcerias; `brand-guidelines` para consistência | Pitch deck de parcerias acadêmicas (pptx) | 🟢 |

### 4. Processo e manutenção do repositório

| Plugin | O que faz | Como usar no NefroQuest | Primeira tarefa sugerida | Prio |
|--------|-----------|--------------------------|--------------------------|------|
| **Notion** (skills + MCP) | Gestão de tarefas/docs no workspace | Espelhar este roadmap num board Notion para acompanhamento visual das tarefas de plugin e do backlog | Criar board "NefroQuest Roadmap" e importar pendências | 🟢 |
| **commit-commands** | Commit/push/PR padronizados | Padronizar mensagens e abertura de PR (respeitando a regra de bump de versão junto com asset) | Adotar no próximo commit | 🟢 |
| **claude-md-management** | Audita e melhora o `CLAUDE.md` | Manter o `CLAUDE.md` em dia conforme tabelas/migrations crescem (já está em 11.86→11.87) | Revisão periódica do CLAUDE.md | 🟢 |
| **plugin-dev** | Cria plugins/skills/agents/hooks | Criar um hook que **bloqueie commit de `style.css`/`js/*.js` sem bump** de `version.json`+`sw.js` — automatiza a regra crítica do projeto | Hook anti-esquecimento de version bump | 🟡 |
| **session-report / remember** | Relatórios de sessão e memória de continuidade | Continuidade entre sessões longas (redesign, i18n) sem perder contexto | Usar `remember` ao pausar tarefas longas | 🟢 |

### Sequência recomendada de adoção

1. **supabase** (audit RLS/índices) + **sentry** (triagem de erros reais) — saber o estado de saúde antes de construir.
2. **mercadopago** — fechar I2 (pagamento testado ponta a ponta) usando test-setup + webhooks + review.
3. **superpowers** + **playwright** — virar o fluxo-padrão e validar no browser a auditoria de performance/contraste.
4. **plugin-dev** — hook de version-bump (protege o deploy automático em `main`).
5. **frontend-design** + **figma** + **adobe** — destravar Redesign (Fase 0) e assets da Play Store.
6. **feature-dev** + **claude-api** — blueprint do E1 (motor adaptativo) e otimização das edge functions de IA.

---

## Arte de Equipamentos — ✅ CONCLUÍDO (Antigravity/Gemini, jun/2026)

> Toda a arte de equipamentos foi gerada e integrada (v11.98–v12.01): 18 itens iniciais específicos por personagem, todos os itens adquiríveis (6 slots × raridades), variantes femininas de armadura para a Aquaria, e os 30 portraits de nível redesenhados. Fundo #0a0e1a removido via flood-fill (scratch/clean_image.py). Slots altos (armadura/arma) exibem com object-fit: contain para imagens quadradas (v12.01).

---

## Histórico de Concluídas

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
- [x] Segurança: CSP completada — `media-src 'self'`, `worker-src 'self'` adicionados; `api.web3forms.com` removido de connect-src
- [x] Performance: Google Fonts não-render-blocking (`media="print"` + `onload` + `<noscript>` fallback)
- [x] Performance: SDK Supabase já estava no fim do `<body>` — não bloqueia renderização
- [x] Performance: `loading="lazy"` — já presente em todas as imagens
- [x] Performance: `font-display: swap` — já configurado via `display=swap` no URL do Google Fonts
- [x] C1: `!important` — 321 ocorrências reduzidas para ~99 (removidos 222 do bloco `.arqui-nefromante-final`)
- [x] C2: z-index centralizado — `.app` e `.action-dock` migrados para `var(--z-app)`
- [x] A4: Event delegation — todos os `onclick=` inline migrados para dispatcher central
- [x] A1: game.js modularizado — 6180 → 3094 linhas; 9 módulos extraídos
- [x] A2: Store central de estado — `state` wrapped em Proxy com debounce de 500ms
- [x] W1: Screenshots no manifest — `screenshot-mobile.png` e `screenshot-desktop.png` presentes
- [x] W3: Push notifications server-side — migration 004, edge function `send-push` deployada
- [x] Versão: **9.28**
- [x] Play Store PS-1a: `privacy-policy.html` standalone criada
- [x] Play Store PS-1c: TWA detection — botões de compra substituídos no APK Android
- [x] Play Store PS-1d: `manifest.json` com campo `"id": "/"`
- [x] A11y: `type="button"` em todos os 89 botões sem tipo
- [x] A11y: `aria-live="polite"` em `#authMsg` para leitores de tela
- [x] A11y: Touch targets — `min-height: 44px` em `.profile-popup-item` e `.profile-popup-logout`
- [x] Performance: `width`/`height` em 11 imagens estáticas (previne CLS)
- [x] Architecture: Profile popup deduplicado — 4 cópias idênticas → 1 `<template>` + injeção JS
- [x] Minigame Ácido-Base (Câmara do Equilíbrio) — 20 casos clínicos interativos simulando distúrbios simples, mistos e triplos com feedbacks pedagógicos avançados e bypass de administrador.
- [x] Melhorias de UX, RPG e Atalhos de Teclado (v11.47) — Feedbacks táteis aprimorados, danos de combate flutuantes, atalhos de teclado 1-4 / A-D em campanha e estudo, e z-index otimizado.
- [x] Dashboard Detalhado (v11.47) — Forecast de revisões SuperMemo SRS em barras, explorador e buscador de histórico de questões respondidas com explicações, e badge visual para o pior eixo ("Ponto Fraco").
- [x] Estudo Livre Offline (v11.47) — Página offline.html customizada com cache de topics.js, atalhos físicos e sincronização automática e transparente para o Supabase no retorno de conectividade.
- [x] Versão: **11.47**
- [x] Sincronização Supabase Hardened & Isolação de Contas (v11.48) — Correção de race conditions de salvamento concorrente inter-dispositivos, auto-sincronização no fechamento/segundo plano da aba, limpeza completa de chaves locais no logout, e fechamento exclusivo de modais via botões para evitar perdas acidentais.
- [x] Versão: **11.48**
- [x] Objetivos dinâmicos por nível + cores do Grimório (v11.50); questão de glúten na NIgA + diretrizes KDIGO 2025 (v11.52); redesenho do card de comparação de equipamento + ajustes mobile (v11.54)
- [x] Estabilidade e Dívida Técnica (v11.55) — DT1 (FSM de áudio), DT2 (FSM idempotente do ranking + timeout 10s), DT3 (migração innerHTML→DOM no ranking/dashboard/admin), DT4 (setup:e2e + smoke-test no CI), DT6 (roteador unificado de exceções → Sentry/GA4)
- [x] Sistema de avaliação 5★ (v11.55) — qualidade + aprendizado por questão; grava em `question_ratings` (Supabase) com fallback localStorage; painel de Analytics no admin. **Requer migration 008.**
- [x] Anti-duplo-clique no botão "próxima" (campanha + estudo); reorganização do dock inferior mobile (Herói/Grimório/Oráculo) — v11.55
- [x] Fix: SyntaxError de backticks em `changelog.js` que impedia a tela de Novidades de abrir (v11.56)
- [x] DT5: webhook Mercado Pago — comparação de assinatura em tempo constante + log estruturado de tentativas inválidas (v11.56)
- [x] Migration 008 — tabela `question_ratings` (insert público, leitura só admin via claim `app_metadata.is_admin`)
- [x] Versão: **11.56**
- [x] UX/Conteúdo (v11.57–v11.71) — avaliação 5★ interativa, Oráculo no dock lateral (campanha + estudo) discutindo sempre a questão em tela, raridade nos refs/grimório, galeria de assets no admin, confronto final do boss em 2 passos, busca do Histórico corrigida, e varredura ampliada de siglas inglesas no banco (ESA→AEE, UACR→RAC, BUN→ureia, DRPAD/LECO)
- [x] **DC-4 — Ranking de Perfil Global (v11.72)** — toggle Recorde/Perfil Global ordenando por acertos acumulados; reaproveitado no dashboard
- [x] Apelido no ranking (v11.74) — privacidade do nome exibido no leaderboard
- [x] **DC-1/DC-2 — Biblioteca de Néfrons (v11.76)** — galeria no dashboard dos artigos históricos desbloqueados nos baús (`unlockedArticles`)
- [x] **W3 — Campanha de push + `send-push` (v11.77–v11.78)** — edge function autorizada por JWT de admin (`app_metadata.is_admin`) + UI de campanha de push no painel admin
- [x] **E5 — Revisão espaçada FSRS-4.5 (v11.79)** — motor FSRS substitui o SM-2 em `js/utils.js`, com migração transparente dos cards antigos
- [x] **PED-5 — Modo Leitura / acessibilidade (v11.81)** — texto maior + contraste nas alternativas
- [x] Classificação de dificuldade pelo usuário (v11.82) — votos crowd-sourced (`question_difficulty_votes`, migration 010) para recalibrar o banco
- [x] **PED-3 (Fase A) — Ritual de Iniciação (v11.83)** — placement adaptativo de 8 questões estimando o nível e pré-selecionando a dificuldade
- [x] Fix: tela travada ao iniciar nova jornada (classe undefined) + remoção do rótulo "Dificuldade:" (v11.84–v11.85)
- [x] **PED-1 — Raciocínio guiado no erro (v11.86)** — chips de padrão de raciocínio ao errar (`question_error_reasons`, migration 011) → card "Padrões de Raciocínio"
- [x] Migration 009 — `profiles_stats` (DC-5); Migration 010 — `question_difficulty_votes`; Migration 011 — `question_error_reasons`
- [x] Versão: **11.86**

