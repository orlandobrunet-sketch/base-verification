# Intermitências — investigação técnica de 14/11/2026

Base publicada: 17.17, merge `c0a6b53e2051c6d084ee0d4427f03686a5aa021f`. O proprietário autorizou investigar e resolver o que dependesse do desenvolvimento, mantendo conteúdo médico fora do escopo.

## Causas demonstradas

Os registros oficiais da CI1077 das specs 180 e 198 mostram o Portal interceptando, respectivamente, a entrada no confronto e o ponto do teste do rodapé. Os preparos antigos ocultavam telas sem estabelecer a sessão de visitante. A entrega tardia de autenticação podia reabrir o Portal por cima do contexto preparado.

As reproduções controlam somente a fronteira externa de autenticação e conservam os controladores reais. Na 180, duas entregas tardias falharam antes do filme e dois controles imediatos passaram; após a única linha de entrada Guest, os mesmos quatro controles e o cenário original passaram. Na 198, duas entregas tardias falharam no hit-test original; os 28 cenários originais e os dois controles tardios com Guest passaram em rodadas separadas. Os ajustes se limitam à preparação dos testes. Não alteram Auth, confronto, vídeo, rodapé, atalhos, progresso ou conteúdo.

## Estudo: proteção existente e limite histórico

A investigação preserva três provas diferentes. Seis percursos técnicos de clique/teclado passaram no código publicado, com movimento reduzido efetivamente conferido. Uma comparação controlada produziu dois RED com o CSS antigo, mantendo foco e uma única resposta, mas deixando a correção a cerca de 15 mil pixels da janela. Os quatro controles publicados passaram.

Uma contraprova adicional isolou exatamente as 13 linhas (484 bytes) da proteção geométrica entregue na 17.06: com o mesmo JS anterior à 17.17, os dois perfis passaram. O restante do CSS comparado permaneceu idêntico. Essa prova confirma a proteção já existente sem depender do observador de reflow da 17.17. Não representa uma release histórica montada integralmente.

Os dois registros antigos da spec 191 conservam somente o contexto de erro, sem trace ou geometria suficientes para atribuição retrospectiva exclusiva. A reprodução de um mecanismo compatível não prova que ambos tiveram uma única causa. Não foi identificado novo reparo de produto para esse recorte, nem acrescentada uma regressão que duplicasse 244/268.

## Intermitências sem causa comprovada

- **226 / contexto da entrada:** a mensagem do Playwright não prova, sozinha, que houve navegação. A trace oficial da CI1081 registra somente o goto e o reload explícitos, sem destino adicional comprovado. Quatro controles de espera do catálogo e coleta explícita de memória passaram, sem reproduzir o erro. Um lançamento posterior que não iniciou o runner não é contado como teste. Não há retry, sleep ou exceção engolida para ocultar a falha.
- **97 / tecla End no leitor:** o registro antigo rolou o documento em vez do leitor. O Portal atrás do capítulo não demonstra essa causa. Nos dois controles finais, End chegou ao leitor, rolou-o de 0 a 520 pixels e manteve a página em zero, com e sem Portal atrás. A primeira captura externa apontava para um leitor genérico oculto e foi corrigida somente no diagnóstico, sem apagar os resultados anteriores. A causa histórica permanece desconhecida.
- **193 / avaliação de largura da Câmara:** o evaluate pendente começou cerca de 3,5 segundos depois da abertura da página, após o feedback das cartas. Não há base para atribuir a falha ao esgotamento do prazo pelo preparo. Dois percursos atuais intactos passaram com perfil de CPU e trace; isso não explica o bloqueio antigo nem constitui benchmark de resposta do produto.

## Evidência futura

As specs 97/191/193/226 passam a produzir um anexo somente após falha, com viewport, rolagem, foco e geometria das telas. A coleta não toca o gesto, executa serviços reais, lê storage, copia textos clínicos ou muda prazos/asserções. Query e hash da URL são omitidos. O limite de leitura é de três segundos; se a página não responder, o anexo registra indisponibilidade e conserva a falha original. `ownBoxVisible` descreve somente a caixa e o estilo próprio, não uma certificação de visibilidade por todos os ancestrais.

Seis contratos Node/VM e três diagnósticos técnicos de navegador passaram. A página fechada e o renderer pausado via CDP produziram indisponibilidade explícita; o último foi retomado e encerrado normalmente. A prova AST conserva todos os statements anteriores das quatro specs, acrescentando somente import e hook. Revisão independente não encontrou alteração do resultado original, efeito no caminho verde ou coleta de dados privados.

## Validação e publicação

As seleções finais do coordenador passaram em duas rodadas: oito casos de Estudo/Câmara/entrada e dois do leitor, sem retry, skip ou erro do runner. A configuração preserva os perfis originais, asserções e prazo de 20 segundos. Nenhum anexo pós-falha foi coletado no caminho verde. Os 28 casos da 198, os quatro controles da 180 e as contraprovas do helper/Estudo possuem suas próprias rodadas; não são apresentados como uma única bateria.

Falhas de lançamento por cache de navegador ausente e filtros que não coletaram testes foram preservados como problemas do ensaio, sem contá-los como RED do produto. A CI completa do HEAD final ainda é necessária antes de integrar. A versão pública continua 17.17; testes e documentação não justificam invalidar o cache dos jogadores. Todos os arquivos alterados pertencem a testes ou documentação. Não houve alteração de dados, fórmulas, referências ou geradores clínicos.
