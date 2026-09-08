# Auditoria do ciclo Claude Code — v14.50 a v14.75

**Data:** 21/08/2026
**Janela auditada:** `1a46ddf^..d33ab07` — PRs #734 a #761
**Escopo:** produto, frontend, persistência, PWA, CI, acessibilidade, desempenho e documentação

## Escopo e método

O ciclo contém **28 commits**, **63 arquivos alterados**, **6.210 inserções** e **1.537 remoções**, entre 15 e 21/08/2026.

A revisão combinou:

- histórico e mensagens completas dos commits;
- diff acumulado e leitura do código atual;
- inspeção dos gates de CI, Service Worker, migrations e contratos das Edge Functions;
- `node --check` nos 24 arquivos `js/*.js` e `data/*.js`;
- verificação de coerência de `version.json`, `sw.js` e cache-busters;
- execução local, em Chromium, das 14 suites diretamente ligadas ao ciclo recente.

Resultado da rodada local: **110 testes passaram e 1 ficou flaky**. O cenário instável foi “Enter reflexo logo após responder não pula a explicação”, em `tests/specs/33-gabarito-sem-cor.spec.ts`. A última execução registrada no PR #761 declarava 244 testes sem falha nem flake; a auditoria atual mostra que esse estado não é totalmente reproduzível.

Esta auditoria **não reavaliou a correção clínica das questões**. Ela verificou apenas a infraestrutura editorial e a forma como metadados/competências são processados. Qualquer correção de classificação clínica ou de `data/topics.js` continua sujeita ao gate editorial canônico.

## Veredito executivo

O ciclo produziu um salto real, não apenas cosmético. A Central passou a exibir memória, competência, progressão e conquistas com muito mais honestidade; a seleção de classe ganhou uma página própria; o primeiro acesso ficou mais leve; e a cobertura de regressão cresceu de forma importante.

Ao mesmo tempo, “muitos testes” e “visual publicado” foram tratados como sinônimo de sistema encerrado. A auditoria encontrou dois bloqueadores de publicação e contratos centrais ainda abertos em segurança, gate médico, isolamento de conta, sincronização, atualização PWA e CI. O próximo passo correto é fechar esses contratos antes de continuar o redesenho interno.

## O que ficou claramente melhor

| Frente | Entrega comprovada | Evidência |
|---|---|---|
| Central de inteligência | FSRS na superfície, radar sem transformar ausência em 0%, Mapa clínico, comparação semanal, selos persistentes, badges reais e estados vazios acionáveis | #734, #736, #738–#746 |
| Ética de progressão | Remoção de conquistas que premiavam pressa, madrugada e maratona; progresso sem denominador artificial | #736 e specs 23/30/31 |
| Taxonomia | Sete domínios clínicos completos, zero tema específico inalcançável e redução do fallback global para cerca de 40% | #737, #742, #751–#755 e spec 28 |
| Escolha de classe | Página Lúmen própria, bônus explicados, dez estágios visíveis, teclado, mobile e movimento reduzido | #735 e #761 |
| Acessibilidade | Gabarito do boss não depende só de cor; foco migra para feedback; alvos de toque e contraste melhoraram | #758 e #761 |
| Cor com função | Navegação equivalente deixou de receber cores arbitrárias; ciano, ouro, jade e coral voltaram a codificar estado/dado | #738 e #759 |
| Desempenho | Primeiro acesso reduziu requisições/bytes duplicados; sons caíram de 704 KB para 103 KB; 620 KB saíram do parse crítico; 37,9 KB de CSS morto saíram do runtime | #749, #756, #757 e #761 |
| Release/PWA | Bump, releases Sentry, busters e mapa de assets passaram a ser derivados e conferidos | #747 e #749 |
| Testes | Servidor local concorrente, fixture comum e 13 novas suites para a camada recente | #748, #750 e specs 22–34 |
| Estado de combate | Atordoamento do boss deixa de atravessar restauração e a tarja volta ao posicionamento correto | #760 |

Essas decisões devem ser preservadas. Em particular, não se deve reintroduzir cor decorativa na navegação, progresso simulado, conquistas nocivas ou a antiga paleta “definitiva” do roadmap legado.

## Bloqueadores de publicação

### P0 — Stored XSS no painel administrativo

`js/admin.js` renderiza em `innerHTML` valores graváveis por inserções públicas:

- `question_id` em avaliações (`js/admin.js:285-300`);
- `current_diff`/label em votos de dificuldade (`js/admin.js:343-355`).

As migrations 008 e 010 permitem `INSERT` público, e `current_diff` é texto sem constraint de allowlist. Um payload persistido pode executar quando um administrador abre o painel. A CSP não é defesa suficiente: `vercel.json` ainda aceita `'unsafe-inline'`, e esses headers precisam ser confirmados no host que realmente serve o domínio.

O grep atual da CI não alcança essas interpolações multilinha. Conclusão: é um bloqueador de publicação, não uma dívida estética.

Critério de correção futuro:

- renderização por DOM/`textContent` ou escape robusto;
- constraints/allowlists no banco;
- teste com payload persistido real;
- confirmar CSP no host efetivo de produção.

### P0 — Gate médico-editorial incompleto no CI

O validador de lote exige manifesto e coerência estrutural, mas não exige nem deriva os três eixos canônicos:

- Evidência;
- Pendência;
- Autorização de publicação.

Também não valida um veredito editorial aprovado nem `Autorização de publicação: LIBERADA`. Os testes atuais provam o contrato implementado, não o contrato exigido pelo Handbook/AGENTS.

Conclusão: uma alteração clínica pode ficar verde na CI sem o gate cumulativo completo. Corrigir a automação exige testes negativos para publicação bloqueada, pendência decisiva e combinações inválidas. Nenhuma questão individual foi julgada nesta auditoria.

## Achados de alta prioridade

### P1 — Dados de uma conta podem aparecer na conta seguinte

O logout chama `clearLocalProgress()`, mas a lista não remove várias chaves usadas pela nova Central, entre elas competências, padrões de erro, conhecimento acumulado, favoritos, histórico de questões, avaliações e votos locais.

Em um navegador compartilhado, o próximo usuário pode herdar mapa clínico, favoritos e perfil de aprendizagem do anterior. Isso é simultaneamente problema de confiança, privacidade e validade pedagógica.

### P1 — A “sala de controle” não tem sincronização completa

O payload de nuvem não inclui todos os dados exibidos pela Central. A resolução atual também pode preferir um estado local antigo e reenviá-lo para a nuvem, sobrescrevendo histórico melhor.

Antes de prometer continuidade entre dispositivos, é necessário definir:

- quais chaves são por conta;
- schema/versionamento;
- merge determinístico por resposta/evento;
- precedência por timestamp apenas quando semanticamente válida;
- testes com duas contas e dois dispositivos concorrentes.

### P1 — Atualização PWA pode misturar HTML novo com JS/CSS antigo

O Service Worker canonicaliza URLs removendo `?v=` e usa cache-first por pathname. Durante a primeira abertura após uma release, o SW anterior pode responder ao HTML novo com o asset antigo. O beacon atualiza em background e não recarrega.

Esse contrato é coerente com o sintoma histórico de “as mudanças não aparecem” e pode produzir incompatibilidade transitória. O teste atual cobre deduplicação/offline, mas não simula a transição real vN → vN+1.

### P1 — O E2E completo não bloqueia regressões

Na CI, apenas landing e funções puras bloqueiam. O job completo usa `continue-on-error: true` e ainda converte falha em sucesso com `|| echo`.

A rodada atual confirmou o risco: o spec 33 passou na retentativa e ficou flaky. O timestamp da guarda é gravado cedo no handler; em CPU lenta, trabalho dentro do próprio handler pode consumir parte dos 700 ms antes do segundo Enter.

O conjunto crítico — Central, classe, classificador, nível, selos, boss, persistência e segurança — deve bloquear depois que flakes forem corrigidos ou isolados explicitamente.

### P1 — O classificador ainda pode ensinar uma fraqueza que não foi medida

O matcher continua baseado em `includes`, sem limites de palavra e sem compreender negação. Exemplos computacionais encontrados:

- a keyword curta `rave ` casa dentro de `grave `;
- uma questão que menciona vasculite/anti-MBG como hipóteses excluídas ainda pode receber a competência.

O próprio gate aceita até 41% das atribuições no fallback. Isso é aceitável como estimativa transparente, não como verdade fina para prescrever estudo. A próxima rodada deve passar por revisão editorial formal e, progressivamente, substituir inferência por `competency_ids` curados por questão.

### P1 — Promessa de evolução do nível não representa as duas condições reais

A Central afirma que “a próxima resposta certa aplica a evolução” quando o portão de acertos está aberto. O jogo também exige XP suficiente. O teste atual verifica o texto, mas não executa a próxima resposta.

O produto deve representar separadamente portão de acertos e XP, sem prometer uma evolução que pode não ocorrer.

### P1 — Contrato “Sugerir artigo” é incompatível

O cliente envia `{subject, message}`; `send-contact` exige `{name, email, message}`. A feature marcada como concluída retorna 400 no contrato atual e não tem teste ponta a ponta.

### P1 — Lazy load de Grimório pode falhar permanentemente na sessão

Uma falha de `refs.js`/`articles.js` resolve e memoriza a promise, sem retry. Alguns consumidores do gameplay ainda leem `refsDB`/`nefroArticles` diretamente antes do carregamento ocioso terminar. Rede lenta, offline parcial ou abertura rápida podem deixar a sessão vazia ou lançar erro.

## Achados de média prioridade

- `deleteSave()` pode incrementar a contagem de jornadas no encerramento e novamente no início seguinte; o spec cobre persistência, não a sequência completa.
- IDs de conquistas removidas permanecem no armazenamento legado e podem inflar o contador do popup antigo.
- a seleção de classe declara `aria-modal`, mas não implementa foco inicial, contenção e restauração; o teste foca manualmente o primeiro card.
- os três retratos de classe usam `fetchpriority="high"` antes de a tela ser necessária.
- o retrato `clerigo_renal/nivel_01.jpg` ainda é pedido com URLs/versionamentos divergentes.
- o guard de release não cobre todos os assets estáticos fora do precache.
- `forge.mp3` foi convertido sem QA auditivo perceptual registrado.
- gtag e Turnstile continuam como grandes consumidores de main thread.
- `components.css` e `motion.css` foram removidos corretamente do runtime por uso quase nulo; o sistema visual ainda não é uma biblioteca compartilhada madura.
- a Central voltou a usar um template grande em `innerHTML`. Há escape defensivo, mas a antiga afirmação de migração integral para DOM é falsa.
- `send-flag` e `send-contact` são proxies públicos, sem JWT/rate-limit/CAPTCHA; CORS não impede abuso direto.
- muitos overlays legados ainda não têm contrato completo de foco; o patch global de `appendChild` não substitui uma implementação modal acessível.
- o app ainda carrega aproximadamente 2 MB não comprimidos de CSS/JS/dados para a rota de jogo, e o budget da CI mede apenas HTML.

## Crítica de processo

1. **A honestidade dos dados melhorou mais rápido do que a arquitetura.** A Central ficou melhor para o usuário, mas concentrou renderização, leitura de storage e navegação em um módulo grande e dependente de chaves locais.
2. **Cobertura foi confundida com gate.** Existem bons testes; a maioria não impede merge.
3. **O design system foi tratado como folha de componentes antes de haver reutilização.** A remoção do CSS morto foi correta. O próximo passo é promover padrões somente depois de duas superfícies reais provarem o contrato.
4. **Documentação ficou duas versões de produto para trás.** O roadmap terminava na v11.86 e ainda mandava executar uma paleta incompatível com Lúmen.
5. **“Concluído” foi usado cedo demais.** Sincronização, XSS, REF-4/5, DT3, DT4 e o gate editorial precisam ser reabertos ou redefinidos.
6. **Medição local foi forte; verdade externa ficou aberta.** Sentry, GA4, serviços Supabase, pagamento e host/CSP precisam de evidência de produção.

## Ordem recomendada após a auditoria

1. Bloquear stored XSS e tornar o gate editorial realmente cumulativo.
2. Corrigir isolamento por conta, sincronização e atualização PWA atômica.
3. Corrigir contratos de integridade pedagógica: matcher/negação, promessa de nível e contagem de jornadas.
4. Corrigir o flake de teclado e tornar o conjunto crítico de E2E bloqueante.
5. Fechar carregamento do Grimório, sugestão de artigo e resíduos de cache/performance.
6. Executar smoke completo e observabilidade em produção.
7. Só então consolidar a vertical Lúmen e seguir para as páginas internas.

## Decisão para o roadmap

O roadmap antigo foi arquivado porque misturava backlog, histórico, especificação, checklist operacional e catálogo de plugins. O novo roadmap limita WIP, separa bloqueios externos e coloca segurança, gate editorial e integridade de conta antes da próxima onda visual.
