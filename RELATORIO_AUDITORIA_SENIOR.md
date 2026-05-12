# Relatório Técnico Sênior — NefroQuest (varredura inicial)

## Escopo da varredura
- Leitura do contexto de arquitetura, roadmap e operações em `CLAUDE.md`.
- Inspeção estática do repositório para pontos de risco e dívida técnica.
- Tentativa de execução de suíte automatizada unitária/E2E existente (Playwright).

## Achados principais

### 1) Higiene de repositório / CI
**Severidade:** Alta

- O diretório `tests/node_modules/` está versionado no repositório, com grande volume de arquivos de terceiros.
- Isso aumenta tamanho do clone, chance de conflitos, ruído em diffs e risco de inconsistência de ambiente.

**Recomendação:** remover `tests/node_modules` do versionamento, adicionar regras em `.gitignore`, regenerar lockfile limpo e instalar dependências no CI.

---

### 2) Pipeline de testes não reproduzível no ambiente atual
**Severidade:** Alta

- A execução de `npx playwright test specs/09-unit-pure-functions.spec.ts` falhou por ausência do binário Chromium do Playwright.
- Resultado: não há validação automatizada efetiva sem etapa explícita de provisionamento dos browsers.

**Recomendação:** adicionar passo de setup explícito (`npx playwright install --with-deps chromium`) no CI e documentação local de bootstrap.

---

### 3) Superfície XSS por uso massivo de `innerHTML`
**Severidade:** Alta

- Há uso extensivo de `innerHTML` em módulos críticos (`game.js`, `study-mode.js`, `leaderboard.js`, etc.).
- Parte dos conteúdos parece ser dinâmica (dados de usuário, texto externo, respostas IA).
- Mesmo com pontos de sanitização pontuais (`escapeHtml`), o padrão geral amplia risco de regressão de segurança.

**Recomendação:**
1. Definir política: `textContent` por padrão; `innerHTML` apenas em templates estáticos.
2. Centralizar sanitização (whitelist robusta) para qualquer HTML inevitável.
3. Criar testes de segurança de injeção para entradas vindas de Supabase/IA/formulários.

---

### 4) Acoplamento elevado em frontend sem build step
**Severidade:** Média-Alta

- O projeto evoluiu com modularização, mas ainda é SPA vanilla extensa, com múltiplos pontos de manipulação direta de DOM.
- O custo de manutenção e revisão tende a aumentar com novas features (minigame, premium, IA, push, etc.).

**Recomendação:** manter vanilla (se desejado), porém adotar contratos fortes entre módulos:
- tipagem via JSDoc/TypeScript-check incremental,
- convenções de eventos e estado imutável por domínio,
- linting estrito + checks automatizados pré-commit.

---

### 5) Riscos operacionais em deploy manual de funções/migrations
**Severidade:** Média

- Contexto indica deploy/migration manuais via dashboard para etapas críticas.
- Isso pode gerar drift entre código versionado e produção.

**Recomendação:** padronizar pipeline infra-as-code (CLI) com trilha auditável para:
- migrations,
- deploy de edge functions,
- verificação de variáveis obrigatórias.

---

## Pontos positivos observados
- Histórico consistente de correções e hardening (RLS, quotas server-side, CSP, lazy loading, A11y).
- Roadmap e documentação operacional detalhados.
- Cobertura de testes E2E já estruturada por fluxos do produto.

---

## Prioridades sugeridas (ordem de execução)
1. **Confiabilidade CI:** remover `node_modules` versionado + estabilizar Playwright no pipeline.
2. **Segurança frontend:** programa de redução de `innerHTML` e hardening XSS.
3. **Operação/infra:** automação de migrations e edge deploy.
4. **Qualidade contínua:** linting/type-check/contracts em módulos JS.

---

## 10 melhorias estratégicas para o potencial do app
1. **Motor adaptativo de aprendizado (IRT leve):** ajustar dificuldade por eixo em tempo real para maximizar retenção.
2. **Plano de estudo inteligente semanal:** trilhas automáticas baseadas em erros recorrentes e tempo disponível do usuário.
3. **Dashboard pedagógico premium:** métricas por competência (acurácia, velocidade, confiança, estabilidade temporal).
4. **Simulado estilo prova de residência:** modo cronometrado com blueprint por tema + análise pós-prova.
5. **Sistema de revisão espaçada robusto:** algoritmo SM-2/FSRS simplificado para reexposição de questões.
6. **Banco de questões versionado com revisão editorial:** workflow de QA com status (rascunho, revisado, publicado).
7. **Telemetria de funil de conversão premium:** eventos de paywall por coorte para otimizar monetização sem degradar UX.
8. **Modo offline enriquecido:** pacote local de questões essenciais + sync diferido de progresso/leaderboard.
9. **Programa de segurança contínua:** testes automatizados de CSP/XSS/injeção em conteúdo IA e campos livres.
10. **Internacionalização planejada (pt-BR/en):** arquitetura i18n para expansão acadêmica e parcerias.

---

## Observações finais para o ClaudeCode
- Recomenda-se atacar primeiro **higiene de repositório + CI reprodutível**, porque isso reduz risco de regressão em qualquer melhoria futura.
- Em paralelo, iniciar uma **campanha incremental de eliminação de `innerHTML` em áreas críticas** (autenticação, ranking, respostas IA e conteúdo gerado externamente).
