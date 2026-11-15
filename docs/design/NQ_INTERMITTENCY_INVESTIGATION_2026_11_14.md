# Intermitências — investigação técnica de 14/11/2026

Base publicada: 17.17, merge `c0a6b53e2051c6d084ee0d4427f03686a5aa021f`. O proprietário autorizou investigar e resolver o que dependesse do desenvolvimento, mantendo conteúdo médico fora do escopo. Durante a conferência foram encontrados defeitos atuais no gestor de foco e na apresentação atrasada de baús. A candidata 17.19 reúne o reparo de foco da 17.18 não publicada e a continuidade dos baús, acompanhando o cache no mesmo commit de cada asset.

## Defeito atual de foco — incluído na candidata 17.19

O observador `reparo` de `nqDialogo` podia retirar o foco de um diálogo novo quando o conteúdo do diálogo anterior recebia uma atualização tardia. O binding permanecia válido e ambos os diálogos estavam conectados: o problema era considerar qualquer foco fora da raiz antiga como foco perdido.

Dois perfis reproduziram a trilha controle antigo → controle novo → controle antigo. A recuperação quando o botão focado era removido continuou funcionando nos dois controles. Um terceiro contrato reproduziu a interrupção de um input escolhido fora da raiz. O reparo restringe a recuperação aos estados sem alvo válido (`body`, `html` ou nulo), preservando o controle que já recebeu foco. `manageDialogFocus`, binding, vigia, fechamento e liberação do ciclo não mudam.

As rodadas ficam separadas: dois RED e dois controles iniciais aprovados; dois RED do input externo; quatro contraprovas originais aprovadas; seis casos da nova spec 284 aprovados. A seleção final da 17.18 passou 13 casos e três skips móveis originais, sem retry: a nova regressão e os controles existentes de fechamento, Escape, retorno e Paywall → Preços. Revisão independente não encontrou impedimento. Isso não atribui retrospectivamente a causa dos registros antigos da 97 ou da 191.

## Causas demonstradas

Os registros oficiais da CI1077 das specs 180 e 198 mostram o Portal interceptando, respectivamente, a entrada no confronto e o ponto do teste do rodapé. Os preparos antigos ocultavam telas sem estabelecer a sessão de visitante. A entrega tardia de autenticação podia reabrir o Portal por cima do contexto preparado.

As reproduções controlam somente a fronteira externa de autenticação e conservam os controladores reais. Na 180, duas entregas tardias falharam antes do filme e dois controles imediatos passaram; após a única linha de entrada Guest, os mesmos quatro controles e o cenário original passaram. Na 198, duas entregas tardias falharam no hit-test original; os 28 cenários originais e os dois controles tardios com Guest passaram em rodadas separadas. Os ajustes se limitam à preparação dos testes. Não alteram Auth, confronto, vídeo, rodapé, atalhos, progresso ou conteúdo.

## Estudo: proteção existente e limite histórico

A investigação preserva três provas diferentes. Seis percursos técnicos de clique/teclado passaram no código publicado, com movimento reduzido efetivamente conferido. Uma comparação controlada produziu dois RED com o CSS antigo, mantendo foco e uma única resposta, mas deixando a correção a cerca de 15 mil pixels da janela. Os quatro controles publicados passaram.

Uma contraprova adicional isolou exatamente as 13 linhas (484 bytes) da proteção geométrica entregue na 17.06: com o mesmo JS anterior à 17.17, os dois perfis passaram. O restante do CSS comparado permaneceu idêntico. Essa prova confirma a proteção já existente sem depender do observador de reflow da 17.17. Não representa uma release histórica montada integralmente.

Os dois registros antigos da spec 191 conservam somente o contexto de erro, sem trace ou geometria suficientes para atribuição retrospectiva exclusiva. A reprodução de um mecanismo compatível não prova que ambos tiveram uma única causa. Não foi identificado novo reparo de produto para esse recorte, nem acrescentada uma regressão que duplicasse 244/268.

## CI1083: duas causas adicionais demonstradas

### Home / 271 — precondição do ensaio

A trace oficial mostrou o salto controlado de 1450 ms ocorrendo em 1,66 ms reais enquanto a atividade da conversa ainda estava `running`; o observador aplicou `paused` depois da leitura que falhou, de zero para duas mensagens. Geometria fora da janela não garante que o IntersectionObserver já entregou a saída. O retorno já aguardava a atividade observável, mas a saída não.

Dois perfis reproduziram o RED ao reter somente a notificação nativa; os dois controles com entrega antes do salto passaram. Uma segunda rodada preservou os mesmos dois RED deliberados e dois PASS. A única alteração na spec271 aguarda `animationPlayState === 'paused'` antes do relógio. `shown`, texto, 1450/1600 ms e prazo de 20 s permanecem intactos. Os oito originais passaram sem retry; JS e CSS da Home continuam idênticos.

### Baú / 276 — continuidade da recompensa

Cinco respostas e avanços nativos geram a oportunidade sem reescrever RNG ou recursos. A saída pelos botões Átrio → Modos → Julgamento Rápido, antes do prazo do baú, conserva a jornada ativa. Aos 1199 ms, `#mgSair` recebe o hit-test e o foco está no desafio; aos 1200 ms o baú antigo aparece, toma o foco e intercepta Sair. Os dois perfis reproduziram o RED e os dois controles na campanha passaram. A guarda antiga de epoch/gameStarted não certificava a superfície atual; o claim capturava a origem somente ao clicar no popup.

O reparo conserva os contadores, o sorteio e o prazo de 1200 ms. Cria uma oportunidade local somente após o commit da resposta e vincula a apresentação e o claim à sua origem, incluindo owner, domínio, jornada, lease e sandbox. Múltiplos ganhos são conservados sem sobreposição; outro modo, diálogo ou foco escolhido faz a apresentação aguardar. A retomada validada do mesmo piloto usa uma transferência opaca de uso único. Mudança de contexto aposenta timers, observador e nós capturados, sem remover um popup novo pelo ID. As aberturas diretas existentes conservam o comportamento imediato e não são transferidas como ganhos automáticos. Não há novo schema ou persistência; reload não está coberto por essa retenção transitória.

A mesma reprodução passou quatro casos após o reparo. A nova spec285 passou seis cenários em computador e celular emulado, incluindo retomada nativa com nova lease da mesma jornada e abertura pelo controle real, com sorteio original. A compatibilidade posterior fechou 18/18, com a 86 completa (12), a 153 completa (4) e os dois percursos naturais do acerto25 da 276, sem retry e com prazo de 20 s por caso. A 276 permanece intacta: não se oculta ou consome artificialmente o baú para fazer o teste passar. O retorno antecipado do cleanup vazio foi incluído depois da primeira rodada da 285; por isso a matriz final repete essa spec na fonte consolidada.

## Intermitências sem causa comprovada

- **226 / contexto da entrada:** a mensagem do Playwright não prova, sozinha, que houve navegação. A trace oficial da CI1081 registra somente o goto e o reload explícitos, sem destino adicional comprovado. Quatro controles de espera do catálogo e coleta explícita de memória passaram, sem reproduzir o erro. Um lançamento posterior que não iniciou o runner não é contado como teste. Não há retry, sleep ou exceção engolida para ocultar a falha.
- **97 / tecla End no leitor:** o registro antigo rolou o documento em vez do leitor. O Portal atrás do capítulo não demonstra essa causa. Nos dois controles finais, End chegou ao leitor, rolou-o de 0 a 520 pixels e manteve a página em zero, com e sem Portal atrás. A primeira captura externa apontava para um leitor genérico oculto e foi corrigida somente no diagnóstico, sem apagar os resultados anteriores. A causa histórica permanece desconhecida.
- **96 / tecla End no confronto:** a CI1082 do HEAD anterior ao reparo de foco repetiu um caso móvel com a mesma condição de rolagem falsa. A falha ocorreu na primeira etapa, antes de avançar; o documento rolou e o leitor não. A trace não contém o alvo efetivo da tecla ou a geometria computada naquele instante. Dois controles atuais registraram End no leitor, sem cancelamento, com as duas etapas rolando e a página parada. Uma microtransição do tamanho da fonte sob movimento reduzido foi observada em controles técnicos, mas terminou antes da tecla nos dois percursos; não foi demonstrada como causa. CSS não recebeu alteração especulativa. O sucesso no retry não explica a causa; a evidência original fica preservada.
- **193 / avaliação de largura da Câmara:** o evaluate pendente começou cerca de 3,5 segundos depois da abertura da página, após o feedback das cartas. Não há base para atribuir a falha ao esgotamento do prazo pelo preparo. Dois percursos atuais intactos passaram com perfil de CPU e trace; isso não explica o bloqueio antigo nem constitui benchmark de resposta do produto.

## Evidência futura

As specs 96/97/191/193/226 passam a produzir um anexo somente após falha, com viewport, rolagem, foco, tamanho de fonte e geometria das telas. A coleta inclui as regiões específicas do confronto e do capítulo. Não toca o gesto, executa serviços reais, lê storage, copia textos clínicos ou muda prazos/asserções. Query e hash da URL são omitidos. O limite de leitura é de três segundos; se a página não responder, o anexo registra indisponibilidade e conserva a falha original. `ownBoxVisible` descreve somente a caixa e o estilo próprio, não uma certificação de visibilidade por todos os ancestrais.

Seis contratos Node/VM e três diagnósticos técnicos de navegador passaram, inclusive após acrescentar os campos da 96. A página fechada e o renderer pausado via CDP produziram indisponibilidade explícita; o último foi retomado e encerrado normalmente. A prova AST conserva os statements anteriores das specs, acrescentando somente import e hook. Revisão independente não encontrou alteração do resultado original, efeito no caminho verde ou coleta de dados privados.

## Contratos de lógica do baú e adaptações de harness

Os 16 contratos Node dedicados conferem commit, retenção, multiplicidade, mudança de owner/jornada/domínio/epoch/lease/sandbox, cancelamento durante abertura e transferência opaca. A prova de escrita recusada foi reforçada na revisão independente: o ledger válido chega a uma tentativa real de gravação; a recusa gera zero afterCommit. Um controle equivalente aceita a gravação e chama afterCommit uma vez, sem repetir no segundo commit. A primeira versão desse teste recusava antes por um ledger incompleto e não certificava o ponto de falha anunciado; esse limite e a correção ficam separados das provas do produto.

As extrações VM de `storage.test.cjs`, `campaign-question-revisions.test.cjs` e `save-debounce.test.cjs` passaram a carregar o colaborador real de baús, inicialmente vazio. Asserções anteriores continuam iguais. As falhas iniciais de ReferenceError nessas fixtures foram preservadas como dependências do harness; as rodadas posteriores passaram 167/167 no grupo piloto anterior à prova adicional, 16/16 nos contratos dedicados finais, 13/13 na seleção de revisão de campanha e 8/8 no debounce. Esses recortes não são somados como uma única bateria. A bateria Node completa e a matriz de navegador da fonte consolidada são registradas no PR e no recibo externo antes da publicação.

A primeira bateria completa da 17.19 teve 495 aprovações e 14 falhas, todas no extrator `.mjs` de reinício que ainda não carregava o novo colaborador. A busca anterior havia limitado extensões e deixou esse harness passar; não era uma regressão de cache ou do produto. Duas linhas condicionais carregam o bloco real vazio, preservando o suporte à base antiga, todos os statements, asserções e prazos. O grupo afetado foi conferido novamente: 29/29 aprovados com os mesmos bytes de game.js. Os outros sete grupos, com 480 aprovações, não foram repetidos. A validação local consolidada cobre 509 contratos em rodadas distintas; o RED inicial permanece preservado.

## Validação e publicação

Antes do reparo atual de foco, as seleções do coordenador passaram em duas rodadas: oito casos de Estudo/Câmara/entrada e dois do leitor, sem retry, skip ou erro do runner. A configuração preserva os perfis originais, asserções e prazo de 20 segundos. Nenhum anexo pós-falha foi coletado no caminho verde. Os 28 casos da 198, os quatro controles da 180 e as contraprovas do helper/Estudo possuem suas próprias rodadas; não são apresentados como uma única bateria. A seleção posterior de 13 aprovações e três skips usa o reparo e a versão 17.18.

Após a ampliação do diagnóstico, os dois percursos originais da 96 passaram novamente, com corpo e prazo de 20 segundos preservados e sem anexo no caminho verde. Os cinco hooks conservam os statements originais por AST. Os oito grupos locais de lógica passaram 493 testes, sem falha, skip ou drift durante a execução. Sintaxe do utilitário e alinhamento de versão/cache/Sentry/URL foram conferidos; o manifesto derivado mudou somente `release`.

Falhas de lançamento por cache de navegador ausente e filtros que não coletaram testes foram preservados como problemas do ensaio, sem contá-los como RED do produto. A CI1082 (`43656053674`, HEAD `029ee72c65a2195d4e0cfefb8687304dd3185a3c`) terminou com 15/15 grupos aprovados: 3.495 aprovações diretas, uma após repetição automática na 96, 268 skips e zero falha final; smoke 130/130. Esse conjunto ainda não continha o reparo de foco, a 284 ou o hook96. A CI1083 do HEAD `4db224585076e8df5e35992e753867ef43523873` também terminou 15/15: 3.499 aprovações diretas, três após repetição (271 desktop e 276 desktop/celular), 268 skips e zero falha final; smoke 130. Ela revelou as duas causas adicionais acima e não certifica seus reparos posteriores. A CI completa do HEAD consolidado 17.19 ainda é necessária antes de integrar. Versão, cache, Sentry e URL do utilitário acompanham seu reparo no mesmo commit. O manifesto de questões muda somente o identificador técnico da release; dados, fórmulas, referências e geradores clínicos permanecem iguais à base.
