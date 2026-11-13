# Abertura da Câmara e acabamento das páginas — 17.11

Escopo solicitado em 13/11/2026: aplicar os cinco ajustes visuais concretos de Câmara, Grimório, Competências e Visão Geral. Este documento registra a implementação em revisão; os resultados finais de CI, integração e publicação ficam no PR da entrega. A 17.11 não é declarada validada ou publicada neste checkpoint.

## Cinco pedidos aplicados no rascunho

1. **Câmara, abertura:** a cena da balança passa a compor todo o palco de entrada, com título, progresso real, próximo caso e CTA reunidos. O texto explicativo fica em um `details` chamado “O que você vai praticar”. A composição conserva os controles nativos, as abas de catálogo e as rotas existentes.
2. **Câmara, exames:** os oito parâmetros existentes são apresentados em dois grupos de quatro, com leitura vertical, valor alinhado e unidade próxima. Gasometria e exames complementares ficam separados. A imagem de referência orienta a organização visual; suas faixas normais e conteúdo clínico não foram copiados. Os valores gerados dos casos permanecem os mesmos.
3. **Grimório:** nova arte gerada pela ferramenta nativa de imagem, a partir de PNG e exportada como WebP de 2172×724 px, em `assets/images/grimoire-banner-1711.webp`. A apresentação usa `object-fit: contain` para conservar a proporção do livro. O cabeçalho permanece compacto, com texto legível e a busca próxima dos artigos; em tela estreita a arte decorativa não disputa espaço com o conteúdo.
4. **Competências:** um único `h1` “Competências” substitui o título repetido entre a página e o atlas. A explicação fica junto do diagrama, com espaçamento mais curto. Amostras, percentuais e seleção de área mantêm sua origem e seus controles.
5. **Visão Geral:** cards de próxima ação recebem emblemas SVG próprios e decorativos, alinhamento entre texto e botão e tratamento de superfície/foco. Não há novos destinos, indicadores de progresso ou métricas artificiais; os ícones não são controles adicionais.

Os dados, questões, referências, fórmulas, gabaritos, pontuação e regras de progressão não são alterados por esta entrega visual. O manifesto corrente muda somente a identificação do release.

## Movimento e continuidade

A nova cena de entrada usa um deslocamento discreto de câmera no ciclo de movimento já existente. O estado `data-motion` controla sua execução; movimento reduzido desativa a animação, e a suspensão quando a aba fica oculta preserva o ciclo de vida vigente. Não foi introduzido um controle de pausa dentro da cena nem um novo mecanismo de timers para coordenar a navegação. A adaptação do workspace move o palco como unidade e mantém o retorno e a restauração dos nós existentes.

## Contratos observados e reparo do quadro compacto

A primeira rodada do contrato 179 produziu duas falhas, uma aprovação e três skips de plataforma antes do reparo compacto. A disposição vertical dos exames exigia mais altura no desktop baixo. O ajuste usa os dois grupos verticais lado a lado no quadro compacto, conservando cada sequência de quatro parâmetros e todas as unidades.

Depois do ajuste, o 179 passou com três aprovações e os três skips de plataforma previstos. Foram percorridos os vinte casos nas resoluções de 1159×684 e 1280×720, mantendo os limites do contrato. Isso comprova esses quadros e não é uma certificação de todos os aparelhos.

A prévia final passou dois cenários; as capturas ficam nos artefatos externos da execução. A rodada de 68 cenários relacionados encerrou com 58 aprovações e dez falhas: duas de overflow real dos cards (206), duas do helper que exigia caixa de um ancestral `display: contents` (240), cinco do helper que tratava BODY como caixa de conteúdo (256) e uma de aborto tardio da imagem no preparo (247). O registro inicial foi preservado. O reflow dos cards, o inventário de cache e os helpers/preparos correspondentes foram corrigidos; não se tratou o conjunto inteiro como erro de teste.

A rodada focada seguinte terminou com doze aprovações e duas falhas, restritas ao 240: o teste ainda exigia abas do workspace no fallback nativo com fonte de 32 px, embora o workspace existente só se aplique no desktop elegível com fonte de até 20 px. O contrato foi adaptado às duas navegações existentes, conservando as verificações de imagem, recorte e hit-testing. Os dois cenários finais do hub passaram em 37 s, sem retries; o resultado anterior foi preservado. Os 29 contratos Node do Service Worker e os 42 da Câmara passaram. Não se declara a 17.11 validada ou publicada com base nessas aprovações parciais; CI, publicação e resultados finais ficam no PR.

## CI1071 e reparos da primeira bateria completa

A CI1071 no HEAD `58f7ae165f7cac373d573da29def42bec57af16b` terminou com 3.177 aprovações diretas, seis falhas finais, duas aprovações após repetição e 265 skips previstos: 3.450 casos. Os 435 testes Node, 43 de PostgreSQL, 130 smoke, oito Deno e o typecheck de nove funções passaram. O resultado completo é preservado; a aprovação dos controles não substitui a resolução dos cenários reprovados.

Três falhas revelaram defeitos reais:

- **CTA móvel (256):** o botão de entrada media 42 px em vez dos 44 px exigidos. A regra da CTA recebe somente `min-height: 44px`, preservando crescimento natural, texto, destino e estados.
- **Título do próximo caso (78):** “A Forja Escaldante” excedia a tela de 320 px com fonte a 200%. O título passa a respeitar a largura disponível e a quebrar palavras quando necessário. O TreeWalker de texto, contraste e alvos originais permanece exigido.
- **Quadro alto (179, 1920×1080):** a coluna de exames empilhava os dois grupos, embora o workspace conserve um quadro máximo de 760 px também em janelas altas. A disposição em duas colunas passa a valer em todo workspace desktop para os atos; introdução e cardflow continuam excluídos. Cada grupo mantém sua sequência vertical de quatro valores e unidades.

As outras três falhas eram expectativas anteriores à composição solicitada. A spec 192, nos dois perfis, exigia o texto explicativo visível dentro de um `details` intencionalmente fechado. Agora confirma o estado recolhido, foco e hit-testing do summary e abre o conteúdo nativamente com Enter; texto exato, legibilidade, overflow, arte e controles continuam verificados. O contrato art-manifest exigia `contain` para a sala; agora verifica `cover`, cobertura do palco e escala uniforme, conservando os pixels nativos 1280×720, origem, decodificação, texto canônico e overflow anteriores. Não se alterou o produto para restaurar essas apresentações antigas.

Antes dos respectivos reparos, as contraprovas locais reproduziram os registros: `visual-1711-title-art-red.json` contém duas falhas e dois skips de plataforma; `visual-1711-tall-frame-red.json`, uma falha e um skip. São registros separados das rodadas anteriores de 68, 14 e dois cenários do hub. O reparo de altura mínima passou quatro cenários (`visual-1711-minheight-four.json`) e a abertura do conteúdo recolhido passou dois (`visual-1711-disclosure-final.json`), sem repetição.

A rodada final desses reparos, `visual-1711-ci1071-fixes.json`, terminou em cerca de 2,5 minutos com 11 aprovações e cinco skips previstos de plataforma, sem falhas, flaky ou retries. Os contratos que produziram as seis falhas da CI foram exercitados: quadro em 1159 px e 1920 px, disclosure nos dois perfis, hub e conservação dos exames nos dois perfis, 320/390 px com texto ampliado e imagem nativa do manifesto. Isso valida o recorte local; a próxima CI, integração, Pages, hashes e conferência pública ainda dependem da conclusão registrada no [PR965](https://github.com/orlandobrunet-sketch/base-verification/pull/965).

As duas aprovações após repetição da CI1071 ocorreram nas specs 18/33. A análise dos traces identificou uma sondagem tardia de carregamento na 18, cerca de 1.882 ms depois de a restauração já estar pronta, e ausência de entrada Guest na preparação da 33. Os ajustes ficam restritos aos preparos: uma barreira local conserva o loader nativo pendente e o restaura em finally; as quatro fixtures normais da spec33 usam o Guest nativo. A rodada focada passou três cenários e um skip previsto, com um worker, zero retries e timeout original de 20 s (ci1071-flake-preparations-focused.json). Os outros seis percursos de foco e Enter passaram nos dois perfis em 1,5 minuto (visual-1711-guest-prep-followthrough.json). Isso confirma o preparo; não é apresentado como correção de defeito do produto.

## Conferência do smoke público

O smoke 44 passa a classificar erros de console pela URL de origem, além da mensagem. Falhas da própria origem, fontes desconhecidas e exceções de página continuam reprovando; não há exclusão geral de erros de rede. O wrapper público de conferência permite os GET da própria origem e as fontes Google e bloqueia outros scripts externos antes da execução. Ele verifica a página pública Guest, sem autenticar, enviar formulários, consumir IA ou acessar recurso protegido por CAPTCHA. Essa política de QA não muda o CAPTCHA nem a autenticação do produto.

## Planejamento e limites

O [plano geral das páginas](NQ_INTERNAL_PAGES_PLAN_2026-11-13.md) descreve sugestões para 35 superfícies ou fluxos, incluindo os contextos de administração, recuperação, pagamento, leitura, reporte e rotas auxiliares. Somente os cinco pedidos acima foram aplicados nesta entrega; o restante continua como planejamento, sem autorização automática de implementação.

A intermitência histórica 191 do Estudo continua sem causa comprovada. Esta entrega não a encerra. Aparelhos físicos, serviços reais, leitor de tela falado, recebimento de telemetria Sentry e compra/estorno reais permanecem fora da evidência visual aqui registrada.
