# NefroQuest — Prioridades de refinamento da experiência

**Data do plano:** 10/09/2026. **Atualização:** 11/09/2026. **Estado:** primeira entrega (NQ-04A + NQ-04D) implementada; revisão local concluída, aguardando revisão visual e publicação. Release proposta: 15.04.

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

- Os cinco selos usam os arquivos originais preservados, com seleção de resolução por tela, imagens maiores e estados de posse escritos. O destaque reconhece a reconquista de um selo já obtido.
- Os 11 objetivos antes ilustrados por emojis receberam artes próprias em WebP, 512 × 512, total de 634.818 bytes. A arte original de Campeão da Nefrologia foi preservada. São novas ilustrações decorativas, sem alteração de conteúdo médico ou critérios de conquista.
- Cartões com arte e texto em duas colunas no espaço normal; a arte passa acima do texto quando a leitura ampliada exige mais espaço. Filtros podem mudar de linha. Histórico, progresso, filtros e detalhes continuam disponíveis.
- Átrio, menu de perfil, navegação, carregamento, falha e nomes acessíveis usam Dashboard.
- As novas artes, os originais dos selos e a arte de Campeão entram no cache offline. Release/cache e referências dos assets foram atualizados juntos pelo script oficial.
- Capturas locais controladas em 1440×900, 1366×768, 390×844 e 320×568 ficam em `.codex-test-output/conquistas/`; não representam dados reais do proprietário. Nenhum transbordamento horizontal do Dashboard ou imagem quebrada foi encontrado nessas capturas.
- Verificações: sintaxe JavaScript, coerência de release/cache, artes disponíveis offline e seis suites de Dashboard, auditoria, memória dos selos, abas, legibilidade e texto ampliado. A rodada inicial registrou 97 passes, 7 skips previstos e 4 falhas: duas na medição antiga de resolução de imagens (incompatível com `srcset`) e dois timeouts de navegação. A medição passou a verificar o arquivo realmente selecionado; os quatro casos e a nova cobertura dos cartões a 200% foram verificados novamente. Os timeouts continuam registrados como instabilidade da rodada, sem mudança funcional de navegação.
- A publicação e a avaliação visual do proprietário ainda não estão certificadas. Próximos recortes: Grimório integrado e Jornada Ativa no Átrio.

**Rodada final dos oito casos selecionados:** 7 passaram de primeira; a navegação por todas as abas no projeto mobile passou na retentativa e foi rotulada `flaky` pelo runner. A instabilidade fica registrada para acompanhamento; os casos de imagens, filtros a 200% e isolamento dos atalhos passaram de primeira nessa rodada.

**Pendência observada fora do catálogo:** com texto a 200%, a marca, o avatar e o botão de retorno do cabeçalho compacto ainda podem se sobrepor. Pertence ao acabamento global NQ-04; a nova validação dos cartões não certifica todo o Dashboard nesse tamanho de texto.
