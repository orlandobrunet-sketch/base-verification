# Tooltip com movimento reduzido — candidata 17.05

**Estado: em validação no PR959; ainda não publicado.** A produção permanece na 17.04. A rodada começou pela configuração dos testes e passou a incluir uma correção de produto após reproduzir um recorte real. Conteúdo médico fora do escopo.

## Defeito e mudança mínima

O diagnóstico mobile reproduziu a asserção de geometria da 112 mesmo com prazo de 60 s: o tooltip terminou em **1.128,9375 px**, além do limite de **836 px**. Foi falha de asserção, não timeout.

Com movimento reduzido, a regra global de transição de `.01ms` ainda animava `max-height` enquanto `positionStatTooltip` media a altura sincronicamente. A medição durante essa transição permitia corte ou sobreposição. O ajuste em `styles/lumen/game.css` aplica `transition-property: none` somente a `body > .stat-tip-floating[data-nq-ui="lumen"]` dentro de `@media (prefers-reduced-motion: reduce)`.

Esse é o único CSS funcional alterado; não há alteração de lógica do aplicativo, questões ou serviços. O bump para **17.05** e seus metadados de cache, manifesto e release foram preparados junto da correção. O produto corrigido passou nos **três cenários móveis focais em 2,0 min**, preservando as mesmas asserções estritas: tooltip em 320/390 px e explicação longa. A CI do novo HEAD continua pendente.

Essa rodada diagnóstica local usou prazo de 60 s para acomodar o preparo, com durações de 37,8/52,1/25,5 s. Isso não altera os limites versionados: **os timeouts de 20 s da CI permanecem intactos**. O resultado local aprovado não substitui a bateria final com seus próprios limites.

## Testes e preparações associados

- [Configuração de movimento](NQ_MOTION_TEST_CONFIG_2026-11-12.md): `contextOptions` efetivo, guard de CI e `matchMedia` na 243.
- 112: a medição de fonte aguarda `CSSTransition.finished`; esse ajuste de teste passou em dois casos em 1,2 min, separadamente dos três cenários do CSS do tooltip.
- 152/164: os percursos de filme declaram movimento normal explicitamente.
- 208: a medição aguarda a entrada natural do painel ancestral, sem substituir o movimento do produto ou remover asserções.
- 54: o SDK real é isolado da conta fictícia da preparação visual do Oráculo. A ordem natural de `INITIAL_SESSION` não foi reproduzida; não afirmar uma causa de produto comprovada.
- 84/107: entrada real de visitante antes de injetar o save e recarregar, preservando ações, transações, recorder, asserções e prazos.

## Evidência e resultados pendentes

A **CI1061 anterior reprovou**: 3.300 cenários = 3.023 aprovações diretas + três após repetição + 265 skips + nove falhas finais; 21 retries. Esse resultado é histórico preservado, não aprovação da candidata com os reparos posteriores. **A CI vermelha identificou também um defeito real do produto: o tooltip recortado.** Ele foi reproduzido por asserção e corrigido em CSS; não deve ser apresentado como mera falha de preparação. A espera de fonte da 112, a entrada do painel da 208, a preferência dos filmes 152/164 e as identidades das fixtures 54/84/107 são ajustes de teste distintos. A CI do novo HEAD ainda precisa concluir.

A 243 ampliada passou 8/8 localmente e o guard 9/9 antes do reparo final de produto. O CSS passou 3/3 mobile localmente; a espera natural da fonte, 2/2. Os percursos de filme, painel e preparações de identidade ainda serão conferidos pelo responsável principal enquanto a CI roda. Os oito percursos públicos anteriores passaram em **81 s sobre a 17.04**, com banco técnico local na sessão. Eles não validam o CSS ainda não publicado da 17.05. A candidata exigirá conferência pública após merge e Pages, com versão e hashes atualizados.

O HUD da 191 teve dois registros locais de prazo global excedido, sem causa comprovada. Na rodada completa, as dez combinações e as asserções geométricas passaram antes do timeout; no isolado, seis combinações terminaram e o próximo clique iniciou com aproximadamente 1,59 s restantes. Não foi interceptação comprovada. Isso permanece separado da intermitência histórica de visibilidade da correção do Estudo, que continua aberta.

Não anunciar a 17.05 como aprovada ou publicada enquanto seus resultados finais estiverem pendentes. Aparelhos físicos, contas e serviços reais, conteúdo médico e a causa da intermitência histórica não foram certificados nesta rodada. Artefatos detalhados permanecem externamente em `campaign-scroll-1705`.
