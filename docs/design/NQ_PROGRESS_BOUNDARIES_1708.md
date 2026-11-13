# Avanço e isolamento das sessões — 17.08

O proprietário autorizou continuar a revisão técnica após a publicação da 17.07. Esta entrega trata confirmação do avanço no Estudo, limpeza das sessões locais ao sair da conta e estabilidade dos botões do Átrio. Conteúdo médico, backend, pagamentos e regras de pontuação ficam preservados.

## Avançar somente após salvar

`nextStudyQuestion` aumentava o índice e mostrava a questão seguinte mesmo quando `_saveStudyState` recusava a gravação. O conflito com outra aba ou uma falha de armazenamento só se tornava visível ao tentar responder novamente.

A ação passa a salvar o índice proposto antes de confirmar a navegação. Uma recusa mantém a correção e o índice atuais, com orientação para tentar novamente ou conferir o estudo salvo. O bloqueio existente de cliques repetidos continua com o mesmo prazo. A consulta histórica continua navegável sem gravação ou novo crédito.

A regressão 249 utiliza bancos exclusivamente técnicos e ações nativas: conflito entre abas, recusa de gravação intermediária, recusa da última questão por Enter, fluxo normal e consulta histórica escolhida pelo catálogo ambíguo. Antes do reparo, os três cenários de falha reprovaram nos dois perfis e os dois controles normais passaram. A primeira versão do reparo passou oito cenários; a compatibilidade de consulta foi incluída antes da publicação. O contrato final passou dez cenários sem repetição, incluindo zero escritas na consulta histórica e retomada da tentativa após restaurar o armazenamento.

## Sessões de uma conta não ficam para a próxima

No domínio normal, Estudo e Prova usam chaves físicas de `localStorage`. As duas chaves não estavam na lista de `clearLocalProgress`. Nos testes técnicos, A respondeu e pausou uma sessão, saiu pelo menu nativo e B entrou; a segunda identidade conseguiu retomar questões e respostas de A. Os caminhos de nuvem e a separação do piloto não removiam essas chaves normais.

A limpeza de saída/reset normal passa a incluir `nefroquest-study-state` e `nefroquest-exam-state`. O inventário canônico da spec 37 também as classifica como dados da conta. As preferências do aparelho e o retorno antecipado de reset do piloto mantêm suas regras.

A regressão 250 reprovou quatro percursos de troca de identidade antes do reparo, enquanto quatro controles de pausa/reload da mesma conta passaram. Depois, os oito cenários passaram sem repetição. A prova utiliza identidade/transporte locais e callbacks, logout e modos reais do aplicativo; não cria contas nem valida OAuth ou serviços remotos. A tentativa de retomada por B é coletada antes da asserção, sem reduzir o teste a uma inspeção da lista de chaves.

## Rotas do Átrio estáveis durante a interação

O percurso completo de sair e reentrar como visitante encontrou um clique que não se estabilizava em “Modos de jogo” no perfil móvel. A descrição mudava de uma para duas linhas ao receber o ponteiro, aumentando sua faixa de 56 para 66,28125 px e deslocando o botão. O ponteiro residual da entrada como visitante ficava nessa faixa: o botão se afastava, disparava saída e voltava, repetindo o ciclo. O trace e a observação passiva registraram a alternância com rolagem constante; não foi atribuída a uma falha do preparo.

O Átrio agora reserva a altura intrínseca da maior descrição na largura e fonte atuais. Medidas ocultas compartilham a célula e a tipografia do texto real, ficam fora de clique, foco e acessibilidade e não duplicam texto no DOM. O nó anunciado e seus handlers permanecem. Não há altura fixa, corte de texto, espera ou ciclo de observação novo.

A regressão 251 produziu doze falhas de geometria e quatro controles largos aprovados antes do reparo. Depois, os dezesseis cenários passaram: larguras de 320, 412 e 1280 px, fonte de 16 ou 32 px, movimento normal ou reduzido e dois perfis de navegador. As cinco descrições mantêm os destinos estáveis e o texto sem corte. O percurso original completo, sem instrumentação, também passou nos quatro cenários de saída/reentrada Guest, após reprovar um deles antes do reparo. Uma revisão estática independente não encontrou bloqueador; não houve teste de anúncio falado com leitor de tela.

## Preparações intermitentes

- Spec 138: entrada explícita como visitante pelo argumento existente do helper, mantendo overrides e verificações.
- Spec 67: isolamento do SDK oficial no preparo que injeta uma identidade fictícia, seguindo o precedente de outras fixtures. O endpoint do Oráculo continua simulado pelo teste.

Experimentos externos controlam a entrega de notificações do SDK e emitem uma vez o handler nativo na fronteira relevante. Os controles reproduzem o portal sobre o botão da Prova e a perda da identidade sintética durante a retomada; os braços corrigidos passam pelo corpo original das verificações. Os quatro cenários produziram duas falhas deliberadas de controle e duas aprovações. O adaptador é exclusivo do experimento, não altera bytes do vendor nem integra o produto. Isso comprova os mecanismos controlados, sem atribuir retrospectivamente a ordem exata dos eventos na CI anterior.

## Validação e limites

Os 167 testes Node de progressão/piloto e os 88 cenários relacionados passaram. Estes últimos cobrem o Oráculo, preservação histórica da Prova, navegação do Estudo, isolamento de conta, preferências do aparelho e domínio piloto, sem repetição. Os resultados da CI, integração e publicação são registrados no PR desta entrega. Assets, versão e Service Worker seguem no mesmo commit; o manifesto muda somente o release.

A verificação pública prevista usa os dez cenários Guest da 249 e quatro percursos de saída/reentrada Guest. A troca entre identidades da 250 permanece uma prova local isolada, não um teste de conta real em produção. Hashes públicos devem corresponder ao merge antes dos percursos de interface.

Esta entrega não muda o formato dos saves nem tenta deduzir o proprietário de registros antigos sem essa informação. Não certifica aparelhos físicos, serviços reais ou atomicidade entre processos. A intermitência histórica da correção fora da janela em 191 continua sem causa comprovada e não é encerrada por estes reparos.
