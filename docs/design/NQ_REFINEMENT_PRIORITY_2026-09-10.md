# NefroQuest — Prioridades de refinamento da experiência

**Data do plano:** 10/09/2026. **Atualização:** 22/09/2026. **Estado:** Conquistas/Objetivos, nome Dashboard, Jornada Ativa e continuidade publicados. Grimório compacto com links e cópia de título publicado em 15.16 (PR #808). Estudo e Revisão integrado em implementação e validação local (15.17).

Este plano registra o pedido do proprietário: recuperar a qualidade visual de Conquistas e Objetivos, preservar a apresentação rica dos artigos no Dashboard, voltar ao nome Dashboard, melhorar o card Jornada Ativa e redesenhar progressivamente os popups do jogo. A ordem abaixo passa à frente da expansão de funcionalidades. Uma superfície por entrega.

## O que foi conferido

- Documento de retomada do Claude, roadmap ativo, sistema visual Lúmen, código e assets locais.
- Navegação em produção pelo Átrio, Visão geral e Conquistas, sem responder questões ou alterar progresso. O perfil disponível nessa inspeção tinha pouco histórico; isso não certifica os estados ricos do Grimório do proprietário.
- Imagem do card fornecida pelo proprietário e seus componentes no código.
- PRs #798 e #799: estavam abertos na consulta inicial; a integração de ambos em `main` foi confirmada durante a implementação. A branch visual foi atualizada sobre a base 15.03.

Relatos visuais do proprietário são problemas de produto válidos. A causa específica de cada um só é classificada como defeito técnico quando houver evidência; não se presume arquivo apagado, erro de rede ou animação quebrada apenas pela aparência.

## Fila prioritária

| Ordem | Recorte | Resultado esperado | Critério de conclusão |
|---|---|---|---|
| 1 | **NQ-04A — Conquistas e Objetivos** | Artes com presença, detalhes legíveis e unidade visual; eliminar a aparência de ícones provisórios | Comparar originais e derivados; recuperar artes históricas quando localizadas; substituir emojis principais por uma família de artes coerente; preservar estados e histórico de conquista; verificar desktop e celular |
| 1, junto | **NQ-04D — Nome Dashboard** | Um nome consistente em todos os acessos | Átrio, menu de perfil, navegação, carregamento e nomes acessíveis usam Dashboard; textos de retorno refletem a origem |
| 2 | **NQ-04B — Grimório integrado** | Apresentação editorial rica dentro do Dashboard, acessível também a partir das perguntas | Metadados, impacto, cores semânticas, resumo e ações preservados; leitura sem popup empilhado; busca, filtros, favoritos e retorno com contexto; loading, vazio e falha distintos |
| 3 | **NQ-04C — Jornada Ativa no Átrio** | Identidade do personagem, próxima evolução e progresso compreensíveis | Sem curva arbitrária; avanço visual proporcional ao dado exibido; XP e requisito de acertos distintos; animação breve com significado; todos os estados e movimento reduzido |
| 4 | **NQ-04 — Continuidade e acabamento** | Consolidar o conjunto antes de ampliar o redesenho | Baselines nas quatro dimensões previstas; texto a 200%; estados rico/vazio/legado/corrompido; teclado, foco, toque e retorno; revisão conjunta com o proprietário |
| 5 | **NQ-06 — Fluxos internos sem popups de uso prolongado** | Estudar, consultar e gerenciar o personagem em superfícies integradas | Migrar uma superfície por entrega, mantendo suas ações, dados e caminho de volta; inventário detalhado abaixo |

Os sufixos NQ-04A–D são recortes novos deste plano. Não representam entregas publicadas.

## Conquistas e Objetivos: diagnóstico e direção

Os cinco selos da jornada ainda têm os originais `assets/badges/badge1.png` a `badge5.png`, de 512 × 512, e derivados `badge1-384.jpg` a `badge5-384.jpg`, de 384 × 384. O Dashboard já usa os derivados. Portanto, não há evidência de perda desses cinco arquivos.

Já os objetivos especiais vêm de `ACHIEVEMENTS_LIST`: 11 dos 12 usam emojis; somente Campeão da Nefrologia possui `imgIcon`. Não foi comprovada nesta revisão a existência de uma coleção histórica de 12 ilustrações correspondente a esses objetivos. A recuperação dessa coleção, caso exista, exige rastrear a versão anterior antes de prometer restauração.

O tratamento atual reduz as artes da trilha a miniaturas, escurece os selos bloqueados e coloca os emojis em pequenas molduras. Essa composição enfraquece a recompensa visual. Os originais preservados permitem comparar nitidez e enquadramento antes de decidir por novas imagens.

Proposta:

- Dar aos selos espaço suficiente para reconhecer a arte e ao próximo selo uma posição de destaque clara.
- Usar ilustrações ou emblemas autorais coerentes nos objetivos; ícones funcionais pequenos ficam reservados a navegação e ações.
- Diferenciar bloqueado, em progresso, conquistado e reconquistando com rótulo, moldura e luz, mantendo a arte reconhecível.
- Preservar o histórico de posse entre jornadas. Não transformar uma conquista anterior em algo que parece nunca ter sido obtido.
- Comparar a primeira composição completa antes de produzir toda a família de novas artes, se forem necessárias.

**Fontes técnicas:** `js/dashboard.js` (`BADGE_MILESTONES`, `_achievementIconMarkup`, `_badgePathMarkup`, `_tabAchievements`), `js/achievements.js`, `styles/lumen/dashboard.css` e `assets/badges/`.

## Grimório: o que preservar e o que mudar

Há dois renderizadores. O legado, em `js/utils.js`, apresenta autor, publicação, ano, tipo, raridade e impacto no próprio cartão. Seu resumo separado organiza resumo, conclusão, curiosidade e impacto em seções. O Dashboard, em `js/dashboard.js`, já recebe esses campos, mas transfere publicação/autores para o detalhe expandido e limita o impacto a duas linhas. A informação em grande parte existe; o trabalho principal é de apresentação e navegação.

As combinações de emojis de pergaminho com gema, orbe ou coroa são usadas nos dois caminhos. No Dashboard, também aparecem em lombadas pequenas e em insígnias estreitas. O relato de ícones feios é consistente com essa implementação; um defeito específico de quebra ou sobreposição ainda precisa ser reproduzido com acervo rico.

Proposta:

- Cabeçalho de artigo com título, tipo/raridade, publicação, ano e autores disponíveis; impacto visível com hierarquia própria.
- Preservar cores associadas a tipo e raridade, com rótulo textual. A semântica apreciada pelo proprietário prevalece sobre uniformizar todos os artigos numa única cor.
- Substituir emojis decorativos por uma linguagem gráfica consistente. Revisar a utilidade da estante: miniaturas precisam ajudar a reconhecer ou navegar pelo acervo.
- Leitura integrada: coluna ou área de leitura na própria superfície em desktop; painel em sequência no celular. Sem abrir um segundo popup sobre a biblioteca.
- O acesso pela pergunta abre o Grimório adequado e oferece **Voltar à questão**; o acesso pelo Átrio oferece **Voltar ao Átrio**. Preservar questão, resposta selecionada quando aplicável, estado da jornada, busca, filtro e posição de leitura.
- Unificar a apresentação e explicitar as diferenças legítimas de catálogo: o legado também mostra itens bloqueados e pode ampliar o acervo para administradores; o Dashboard apresenta descobertas válidas. Não liberar conteúdo ou reduzir o catálogo silenciosamente durante a migração.
- Manter favoritos, links de publicação, sugestão de artigo e mensagens de erro. Preservar as correções de carga e nova tentativa dos PRs #788/#790 e o contrato de sugestão do #791.

O conteúdo médico dos artigos e das questões não muda neste recorte.

**Fontes técnicas:** `js/utils.js` (`_buildBibItems`, `_bibRenderList`, `_showResumoModal`, `openBibliotecaModal`), `js/dashboard.js` (`_libraryItems`, `_libraryCards`, `_tabLibrary`), `jogar/index.html` e `styles/lumen/dashboard.css`.

## Jornada Ativa: proposta para o card da imagem

O card pertence ao **Átrio**, não à Visão geral do Dashboard. A forma ondulada é fixa, enquanto o comprimento destacado é associado ao progresso. O código prevê animação breve na primeira apresentação ou no avanço; não há fundamento para afirmar que deveria se mover continuamente.

O problema de design é que o traçado se parece com um gráfico sem eixo ou marcos. Ele ocupa o centro, mas não ajuda a entender a próxima recompensa. XP, acertos, nível, pontuação e vidas competem em três compartimentos rígidos. O botão de retomada já comunica bem a ação principal e deve conservar essa clareza.

Direção recomendada: **personagem atual → progresso legível → próxima evolução**.

- Retrato com maior presença e enquadramento adequado, nome e título juntos.
- Nível atual e próxima forma como extremos reconhecíveis do percurso.
- Trilho curto e preciso, preenchido proporcionalmente ao dado identificado; marcar claramente início, posição e destino.
- Separar XP do requisito de acertos que libera o nível. Conferir o texto do Átrio contra o contrato já explicado no Dashboard, inclusive quando a barra de XP está cheia.
- Pontuação e vidas como contexto secundário, sempre legíveis.
- Retomar jornada como ação dominante; nova jornada como ação secundária.
- Um breve percurso de luz quando houver avanço; reação discreta a foco/ponteiro quando útil. Movimento reduzido mantém todo o significado.

Evitar resolver a crítica apenas fazendo a mesma onda se mexer. A qualidade da composição deve permanecer quando a animação termina.

**Fontes técnicas:** `jogar/index.html` (`welcomeSavedInfo`), `js/game.js` (`refreshWelcomeSave`, `_syncWelcomeProgress`), `styles/lumen/atrium.css`. O contrato de nível também aparece em `_levelGateMarkup`, em `js/dashboard.js`.

## Migração das superfícies internas

| Sequência | Superfície | Destino proposto | O que preservar |
|---|---|---|---|
| Primeiro, NQ-04B | Grimório, referências e resumo de artigo | Área de biblioteca/leitura no Dashboard, com entrada contextual pelo jogo | Metadados, cores, desbloqueios, favoritos, sugestão, links e retorno à questão |
| Depois | Estudo e Revisão | Fluxo integrado de escolha, sessão e resultado | FSRS, recomendações com fonte explícita, retomada e estados vazios |
| Depois | Oráculo e diagnóstico | Área contextual junto ao aprendizado; leitura mais ampla quando necessária | Questão de origem, conversa, cota real, falhas e indisponibilidade |
| Depois | Forja, inventário e evolução | Área própria do personagem | Equipamentos, comparação, requisitos, recursos e ações existentes |
| Depois | Simulado | Fluxo de preparação, prova, retomada e resultado | Respostas, tempo conforme as regras atuais, correção e revisão |
| Inventariar no mesmo ciclo | Ritual, seleção de modos, minigames, confronto e celebrações | Superfícies de percurso ou feedback contextual conforme a duração | Narrativa, escolhas, resultados e retorno sem perda de estado |
| Conta depois; receita no fim | Conta, preferências, planos e pagamento | Área de conta; compra junto da validação de receita | Sessão, campos, erros, cancelamento e confirmação de ações |
| Por último, conforme uso | Ajuda, novidades, contato, privacidade e administração | Páginas ou seções adequadas à duração e à tarefa | Informação completa e acesso às ações existentes |

Todas as sobreposições entram no inventário. A recomendação é eliminar popups de navegação e leitura prolongada; para decisões breves, avaliar confirmação no próprio contexto, mantendo diálogos pequenos apenas quando trouxerem clareza. Transformar uma caixa em uma caixa maior não conclui a migração: foco, navegação, rolagem e retorno precisam funcionar como parte do fluxo.

## Pendências anteriores que continuam válidas

| Frente | Pendência real | Posição na fila |
|---|---|---|
| Integração | Publicar e validar a nova entrega visual após revisão; #798 e #799 já integrados e incorporados à branch | Distinguir validação local, revisão do PR e verificação do deploy |
| NQ-03 | GA4 e verificação com leitor de tela real | Fechamento operacional; não precisa impedir a preparação das correções visuais solicitadas |
| Acabamento | Quatro transbordamentos restantes a 200% registrados no Dashboard; ampliar medição para Átrio, perguntas e popups | Junto das superfícies tocadas; reproduzir antes de corrigir |
| NQ-04 | Baselines em 1366×768, 1440×900, 390×844 e 320×568 | Parte de cada entrega visual |
| Suporte | Decidir o canal anunciado como `contato@nefroquest.com`; ausência de MX registrada na medição de 09/09 | Decisão do proprietário, independente do layout |
| NQ-00C | Reparar save histórico contaminado | Não automatizar; progresso legítimo não é inferível com segurança |
| NQ-00B | Confirmar o recorte de ações do gate editorial | Decisão editorial própria |
| NQ-10 | Classificador e competências curadas; proposta de separar correção mecânica da migração | Frente separada, dependente de decisão; sem alteração de questões neste ciclo |
| NQ-02 | Flake do Enter reflexo, sem ocorrência recente registrada | Investigar mediante reprodução; não promover suspeita a bloqueador |
| NQ-07 / NQ-08 | Plano semanal determinístico e proveniência editorial no produto | Descoberta futura |
| Segurança | CSP exige revisão do modelo de eventos | Frente técnica futura, sem reabrir XSS resolvido |
| NQ-05 / NQ-09 | Validação de receita e distribuição Android | Pagamento permanece no fim da fila; Android depende dos seus pré-requisitos |
| Expansões | Inglês, iOS, novas modalidades e parcerias | Depois da experiência PT-BR e da operação estável |

## Entregas que não devem ser reabertas como pendência

Conforme a reconciliação de 10/09: instrumento de auditoria, recuperação do Grimório, sugestão de artigo, isolamento do Sentry local, jornada ponta a ponta, migração de save legado, correção da cota do Oráculo e ranking sem rede já foram entregues. Também permanecem entregues a base de segurança, o gate editorial, o isolamento/sincronização de conta, a atualização do Service Worker e Estudo/Revisão inicial.

Essa conclusão é sobre o escopo dessas correções, não uma certificação estética de todas as telas. Uma nova inconsistência visual pode existir na mesma superfície.

## Forma de encerrar cada entrega

1. Reproduzir o problema e registrar o antes com dados locais controlados.
2. Fazer uma composição coerente da superfície e conferir os estados relevantes.
3. Verificar que artes carregam, dados permanecem verdadeiros e os caminhos de volta conservam contexto.
4. Conferir desktop, celular, texto ampliado, teclado e movimento reduzido; testar regressões de comportamento quando houver mudança funcional.
5. Preparar um único PR por entrega com release/cache no mesmo commit quando assets mudarem.
6. Validar a publicação pelo comportamento e registrar evidência. A avaliação visual do proprietário encerra o refinamento da superfície antes da próxima grande migração.

**Primeira entrega definida:** NQ-04A, Conquistas e Objetivos, acompanhada da padronização do nome Dashboard. Grimório e card do Átrio vêm em entregas próprias, nessa ordem.

## Primeira entrega — implementação

- Após a revisão do proprietário, os cinco selos também receberam novas artes: medalhões de ouro envelhecido sobre azul profundo. As versões de 512 e 384 pixels foram substituídas juntas, preservando IDs, requisitos e histórico. O destaque reconhece a reconquista de um selo já obtido.
- Os 11 objetivos antes ilustrados por emojis receberam artes próprias em WebP, 512 × 512, total de 634.818 bytes. A arte original de Campeão da Nefrologia foi preservada. São novas ilustrações decorativas, sem alteração de conteúdo médico ou critérios de conquista.
- Cartões com arte e texto em duas colunas no espaço normal; a arte passa acima do texto quando a leitura ampliada exige mais espaço. Filtros podem mudar de linha. Histórico, progresso, filtros e detalhes continuam disponíveis.
- Átrio, menu de perfil, navegação, carregamento, falha e nomes acessíveis usam Dashboard.
- As novas artes dos objetivos e dos cinco selos, além da arte de Campeão, entram no cache offline. Release/cache e referências dos assets foram atualizados juntos pelo script oficial. Prompts e arquivos dos selos estão registrados em `NQ_BADGE_ART_PROMPTS_2026-09-11.json`; foi usada a ferramenta integrada de geração de imagens.
- Capturas locais controladas em 1440×900, 1366×768, 390×844 e 320×568 ficam em `.codex-test-output/conquistas/`; não representam dados reais do proprietário. Nenhum transbordamento horizontal do Dashboard ou imagem quebrada foi encontrado nessas capturas.
- Verificações: sintaxe JavaScript, coerência de release/cache, artes disponíveis offline e seis suites de Dashboard, auditoria, memória dos selos, abas, legibilidade e texto ampliado. A rodada inicial registrou 97 passes, 7 skips previstos e 4 falhas: duas na medição antiga de resolução de imagens (incompatível com `srcset`) e dois timeouts de navegação. A medição passou a verificar o arquivo realmente selecionado; os quatro casos e a nova cobertura dos cartões a 200% foram verificados novamente. Os timeouts continuam registrados como instabilidade da rodada, sem mudança funcional de navegação.
- Publicação explicitamente autorizada pelo proprietário após substituir os cinco selos. PR #800 integrado em 12/09, commit `80e87dfcdd3752cc14a8676a2271b0657ae1f9b3`; GitHub Pages concluído e produção conferida em `15.05`. Os cinco JPGs publicados correspondem byte a byte aos novos arquivos locais (SHA-256). Próximos recortes: Grimório integrado e Jornada Ativa no Átrio.

**Rodada final dos oito casos selecionados:** 7 passaram de primeira; a navegação por todas as abas no projeto mobile passou na retentativa e foi rotulada `flaky` pelo runner. A instabilidade fica registrada para acompanhamento; os casos de imagens, filtros a 200% e isolamento dos atalhos passaram de primeira nessa rodada.

**Substituição dos cinco selos:** nova rodada específica de imagens, cache offline e memória entre jornadas com 13 passes, 1 skip previsto e nenhuma retentativa. A primeira tentativa desta rodada foi interrompida porque o servidor local estava encerrado; a medição válida ocorreu após reiniciá-lo. A CI completa do primeiro commit do PR #800 também passou. O comando de integração automática foi aceito como merge imediato pelo GitHub: a suite completa do commit com os cinco selos ainda estava em andamento na integração. Quality Gates e Smoke passaram; a suite completa também concluiu com sucesso no run `34717610505`, confirmado em 12/09. A verificação de produção não equivale à aprovação dessa suite.

**Pendência observada fora do catálogo e corrigida nesta continuação:** com texto a 200%, marca, avatar e retorno se sobrepunham. O cabeçalho compacto agora prioriza marca e retorno quando falta espaço; o avatar cede lugar. O clique de retorno desobstruído foi testado em 320px com texto a 200%.

## Segunda entrega — Grimório integrado (15.07 publicado, PR #801)

- Cards recuperam autores, publicação, ano e impacto visíveis, com as cores de raridade e dos tipos de referência. Ícones de livro/documento substituem emojis; a estante decorativa de pequenos livros foi retirada.
- Resumo, conclusão e curiosidade têm seções próprias dentro do card, sem novo popup. Os textos vêm integralmente dos mesmos dados; nenhum conteúdo médico foi editado.
- Busca, coleções, filtros, ordenação, favoritos e descobertas mantêm seus contratos. Estado vazio e recuperação de carregamento permanecem disponíveis.
- Os acessos do Átrio e das perguntas agora abrem diretamente a aba Grimório no Dashboard. Fechar devolve foco ao acionador e preserva a questão em andamento. Falha de carregamento oferece nova tentativa e retorna à mesma aba.
- Todas as referências já desbloqueadas e ainda presentes no catálogo são mantidas, inclusive quando deixaram de aparecer no banco atual de questões. A visão administrativa mostra o catálogo completo, sem gravar desbloqueios no perfil. Itens bloqueados são resumidos em duas contagens com instruções de descoberta.
- O formulário de sugestão acompanha a página, com os mesmos IDs, validação e envio. O elemento original é movido e restaurado ao fechar, mantendo rascunho e evitando duplicação. O filtro de diretrizes também foi preservado. O modal antigo permanece como fallback técnico se o módulo Dashboard não estiver disponível; os acessos normais não o exibem.
- Popups individuais de referência, baús e outras superfícies do jogo permanecem no inventário de NQ-06; esta integração cobre a abertura do Grimório.
- Capturas locais em 1440×900, 1366×768, 390×844 e 320×568, além de texto a 200% no celular. A sobreposição do cabeçalho ampliado foi corrigida nesta continuação.
- Validação: 14 testes passaram sem retentativa (desktop e mobile), cobrindo metadados/textos iguais à fonte, leitura no card, favoritos/busca, estado vazio e recuperação de refs/articles após falha de rede. Sintaxe JavaScript e coerência de release/cache conferidas. Capturas em `.codex-test-output/grimorio/` (artefatos locais, não versionados).

**Continuação da integração:** a primeira rodada teve 19 passes, 1 skip previsto e 2 falhas na expectativa antiga de texto “carregando”. O Dashboard apresenta “Preparando seu Dashboard”; o teste foi atualizado para verificar esse texto e o estado `loading`. Ambos os casos passaram na rodada corrigida, sem retentativa. A CI completa da primeira revisão (15.06) também passou; a continuação 15.07 terá validação própria.

**Regressão final da integração:** 14 testes passaram sem retentativa, incluindo atalhos de resposta isolados, Enter sem avançar a campanha, navegação entre áreas, favoritos, filtro de diretrizes, catálogo administrativo, alvos de 44px e auditoria de acessibilidade. A integração está pronta para revisão e CI no PR #801; a publicação foi concluída em 14/09 após aprovação da CI completa, commit 09b2a853ce13f756740f283e64cc4953ac4a5555. Produção confirmou versão 15.07 e hashes dos arquivos dashboard.js/utils.js.

## Terceira entrega — Jornada Ativa (15.09 publicado, PR #802)

- A curva arbitrária foi substituída por uma régua linear com marcador na posição real de XP e divisões de quarto de escala.
- A régua representa somente XP. O texto informa os dois requisitos reais da próxima evolução: XP restante e acertos até o limite de nível. Distingue XP completo, acertos completos e ambos satisfeitos; no nível máximo, mostra os acertos rumo aos 100 da jornada. Nenhuma regra de progressão foi alterada.
- O nome do personagem pode quebrar linha em vez de aparecer truncado. Cores da classe, imagem, nível, vidas, pontuação e ações existentes foram preservados.
- Movimento continua ligado a avanço real, uma vez por atualização, e respeita movimento reduzido. O marcador também funciona com a animação desativada.
- Primeira validação: 8 testes passaram sem retentativa, em desktop e mobile, cobrindo jornada salva, atualização de XP, paletas e movimento reduzido. Sintaxe e coerência de release/cache verificadas. Capturas locais em .codex-test-output/jornada/.
- Esta entrega foi atualizada sobre o PR #801 já integrado e tem branch própria, codex/jornada-ativa. PR #802 integrado em main e publicado após conclusão da CI.

- Defeito adicional confirmado e corrigido: non-scaling-stroke alongava o dash de progresso quando o SVG era comprimido. Medição com isPointInStroke confirmou preenchimento incorreto além do valor em 1440, 390 e 320px, e ausência desse erro após a correção. O teste de jornada salva agora mede pontos antes e depois do fim real do traço, além dos atributos acessíveis.

**Validação de 15/09:** quatro testes passaram sem retentativa em desktop e mobile, cobrindo preenchimento real, requisitos simultâneos, XP completo com acertos pendentes, acertos completos com XP pendente e nível máximo. A primeira tentativa não alcançou o app porque o servidor local estava encerrado; a rodada válida ocorreu após reiniciá-lo. Capturas de 1440, 390 e 320px atualizadas e conferidas. A CI completa da revisão anterior (2222608) passou; a revisão 15.09 também recebeu aprovação completa, registrada abaixo.

**Publicação da Jornada Ativa:** PR #802 integrado após sucesso de Quality Gates, Smoke e Full E2E no commit 575ff9d (run 35043825623). GitHub Pages concluído para o commit 1507a0a6df14552383f0735dd37e2d14b2541472; produção confirmou 15.09 e os arquivos game.js/atrium.css correspondem byte a byte ao commit publicado.

## Continuidade — retorno contextual do Dashboard (15.10 publicado, PR #803)

- Os botões de retorno identificam a origem: Voltar à questão ou Voltar ao Átrio, inclusive durante carregamento e erro. A navegação e a restauração de foco existentes são preservadas.
- Validação: 20 testes passaram sem retentativa em desktop e mobile, cobrindo retorno e foco, rascunho, texto ampliado a 200%, catálogo e recuperação de carregamento. Sintaxe e release/cache conferidos.

- Publicação: PR #803 integrado após CI completa aprovada no commit b72634b, run 35049603752. Produção confirmou 15.10 e dashboard.js corresponde byte a byte ao commit publicado 31a01e4c9cd65edf94963fca4a0b77f16c57b6a9.

## Continuidade — retomada da leitura no Grimório (15.11 publicado, PR #804)

- Busca, coleção, filtro, ordenação, resumos abertos e posição de leitura são mantidos ao fechar e reabrir o Dashboard durante a mesma sessão da página. A troca de abas também guarda a posição do Grimório.
- Estado transitório em memória, separado por identidade e visão administrativa, sem alterar progresso, desbloqueios ou favoritos. Ao mudar de conta ou de acesso administrativo, o contexto anterior é descartado.
- Validação: oito testes passaram sem retentativa em desktop e mobile, incluindo retomada de controles, resumo expandido, rolagem e descarte do contexto ao trocar de conta. Sintaxe e release/cache conferidos.

## Continuidade — referências dentro da questão (15.12, em preparação)

- O botão Ver resumo expande Resumo, Conclusão principal e Curiosidade dentro do card da referência, sem overlay, com recolhimento no mesmo botão e estado acessível. Os textos são lidos dos mesmos dados e escapados; nenhum conteúdo médico foi editado.
- O acesso legado sem card visível mantém o fallback existente. O evento analítico de abertura permanece e não dispara no recolhimento.
- Dois testes passaram sem retentativa (desktop/mobile), conferindo texto igual à fonte, estado da questão inalterado, ausência de popup, teclado e largura do resumo a 200% em 320px.
- PR #804 integrado após CI completa aprovada no commit bf3da56, run 35111778138. Produção confirmou 15.11 e dashboard.js corresponde byte a byte ao commit publicado 2076e95.

- Captura local de 390px conferida em .codex-test-output/referencias-inline/card-390.png.

## Ajuste solicitado em 20/09 — um estudo por linha (15.13)

O proprietário prefere leitura em lista no Grimório. A grade passa a ter uma coluna em todas as larguras, tanto para pergaminhos quanto para fontes clínicas e favoritos. Cards, cores, metadados, resumos, filtros e retomada de leitura são preservados. Não usar novamente dois estudos lado a lado.
Conferido localmente em 1440, 1366, 390 e 320px, com abertura e recolhimento dos resumos. Sem transbordamento horizontal nas quatro larguras. PR #805 publicado como 15.12; esta correção segue em entrega própria.

## Acabamento — texto ampliado (15.14, em validação)

- Auditoria local a 200%, em 390 e 320px: reproduzidos transbordamentos do botão de estudo e dos dias finais do gráfico; em 320px o personagem comprimido fazia Jornada ativa quebrar letra a letra.
- A composição do personagem passa a uma coluna conforme a largura disponível em relação ao tamanho do texto. A ação de estudo cabe no painel. Os sete dias mantêm escala e ordem em uma região com rolagem local acessível pelo teclado.
- Abas de coleções do Grimório têm rolagem horizontal intencional; não foram classificadas como transbordamento do painel.
- PR #806 integrado após aprovação de Quality, Smoke e Full E2E (run 35520625815); produção confirmou 15.13 e CSS idêntico ao commit publicado 6dbb258.

- Validação: quatro testes passaram sem retentativa, cobrindo texto a 200%, acesso aos sete dias por teclado e ausência de transbordamento/alvos pequenos nas abas em 360px.

## Redesenho do Grimório — lista de estudos (15.15)

O proprietário rejeitou os cards altos: um estudo por linha continua sendo requisito, mas cada estudo precisa permitir comparação rápida. A composição agora reúne identificação, impacto clínico e ações na mesma linha no desktop; no celular, reorganiza esses campos sem ocultar informações. O espaço de leitura surge ao expandir o resumo.

Mantidos fundo azul escuro, tipografia do projeto e cores de raridade/tipo. Retirados molduras empilhadas, altura mínima e bloco de impacto com grandes preenchimentos. Cabeçalho explica a consulta de evidências, retomada e favoritos; contagens têm peso secundário.

Comparação nos mesmos três estudos: desktop 330 → 142px (1440px), 329 → 142px (1366px); celular 320/295/317 → 271/248/248px (390px). Sem transbordamento do Dashboard em 1440, 1366, 390 e 320px. Oito testes de comportamento passaram sem retentativa. Capturas e medidas locais em .codex-test-output/grimorio-redesenho/. Conteúdo médico inalterado.
A nova proteção de densidade passou em desktop; a execução mobile excedeu 30s durante capturas concorrentes e passou isolada em 25,3s, sem alteração no teste. Texto a 200% conferido em 390 e 320px sem transbordamento do Dashboard. A correção anterior de acessibilidade foi publicada e conferida em 15.14.

## Recuperação das ações do acervo (15.16)

Cada linha do Grimório volta a oferecer Copiar título e acesso à publicação, sem exigir expansão do resumo. Usa o endereço HTTPS cadastrado; quando não existe, identifica explicitamente Buscar artigo e pesquisa o título no Google Scholar. A cópia confirma sucesso somente após a resposta da área de transferência e informa eventual recusa do navegador. Nenhum conteúdo médico foi alterado.

Mantida uma linha por estudo e ações em duas colunas compactas, com adaptação ao texto ampliado. O teste de navegação foi atualizado para o título atual Grimório: a execução completa anterior teve 768 testes aprovados e duas falhas nessa mesma expectativa antiga. A versão 15.16 exige nova validação completa antes da publicação.
Validação das ações restauradas: testes de links (direto e pesquisa), cópia com sucesso e recusa passaram em desktop e celular. Densidade passou nos dois perfis. Navegação passou em celular; desktop excedeu 30s uma vez no carregamento e passou isolado em 19,6s, sem alterar a expectativa ou o limite de tempo. Ocorrência mantida no registro, não tratada como execução limpa.

## Estudo e Revisão — direção da próxima entrega (15.17)

Grimório 15.16 publicado pelo PR #808: CI completa aprovada no commit d7c281e; produção confirmou versão e bytes de dashboard.js e dashboard.css no commit ada3a69.

Direção de Estudo: página contínua para escolha, temas, sessão e resultado. Base azul #0b111c, divisórias #34434e, dourado do projeto, leitura clara, acento de revisão #baa6d2 e foco #78d9e3. Cinzel nos títulos; fontes de leitura já adotadas no jogo. Alinhamento à esquerda e largura de leitura limitada. Uma opção por linha, com descrição e ação próxima, evitando cartões altos. A seleção por eixo e os cálculos de revisão existentes permanecem; nenhuma alteração no conteúdo médico.

Percurso: origem → escolha de estudo → temas (opcional) → sessão → resultado. Pausar retorna à origem com sessão salva; retomar não sorteia questões novas. A etapa de seleção deixa de ser diálogo com fundo escurecido e rolagem interna. Verificações devem cobrir foco, isolamento de atalhos da campanha, revisão vencida, retomada e tela estreita.

Validação de 15.17: 22 testes do fluxo novo e da seção de Estudo e Revisão passaram em desktop e celular. O teste adicional de conclusão/reinício passou nos dois perfis. Entrada pelo Dashboard, volta à mesma aba, substituição explícita de sessão salva, pausa sem resposta duplicada e texto a 200% em 320px foram exercitados. Os estados de resultado foram compactados após revisão visual local. A revisão completa da CI ainda é necessária antes da publicação.
