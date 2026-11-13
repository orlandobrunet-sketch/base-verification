# Intenção de estudo e gravação secundária — 17.09

A continuidade técnica foi autorizada após a publicação da 17.08. A revisão concentrou-se em navegação, retomada e conservação das respostas. Conteúdo médico, backend, pagamentos, pontuação e decisões futuras do roadmap ficam fora desta entrega.

## O Painel fechado não deve abrir o Estudo depois

Quando o download das questões falha, o Painel continua acessível com dados locais. Seus botões de estudo podem solicitar uma nova tentativa. `_ensureTopics` conferia apenas o vínculo da conta após a espera: fechar o Painel não invalidava esse vínculo. Assim, uma resposta tardia podia abrir o seletor ou uma sessão de Estudo após voltar ao Átrio. Se um novo Painel fosse aberto durante a espera, a intenção antiga também podia removê-lo. Uma nova falha publicava um aviso mesmo depois da saída.

O carregamento passa a capturar a instância do Painel que originou a ação. Antes de autorizar a abertura e antes de mostrar um erro, exige que o mesmo nó continue conectado e que o vínculo continue atual. Os quatro chamadores retornam antes de alterar temas ou iniciar/retomar uma sessão quando essa autorização não vale mais. Não há temporizador, listener ou cancelamento global do download novo; um Painel reaberto ainda pode usar a carga compartilhada.

A reprodução inicial usou falha real de transporte no primeiro download e reteve a segunda requisição, com Guest e cliques nativos. O primeiro probe tinha seletor de retorno ambíguo e foi descartado como prova. O probe corrigido falhou funcionalmente nos dois perfis. Na regressão 252, escolher temas e estudar uma área reprovavam ao fechar, reabrir ou receber uma falha tardia; quatro controles de permanência no Painel passaram. Foram doze falhas funcionais, sem timeout, antes do reparo. Os dezesseis cenários passaram depois, sem repetição, em computador e celular emulado. Uma revisão estática independente não encontrou bloqueador na guarda nem nos quatro chamadores.

## Metadados não devem bloquear uma resposta confirmada

O Estudo salva a resposta antes de atualizar revisão e estatísticas. Entre essas etapas, gravava `nq_last_study`, usado pelo lembrete de atividade, sem tratar recusa do armazenamento. Uma exceção nessa chave interrompia a correção: a resposta primária já estava confirmada, os quatro botões continuavam habilitados, mas novas respostas eram recusadas pelo bloqueio de duplicidade. O histórico de desempenho não recebia o registro que faltou.

Um experimento com recusa exclusiva dessa chave reproduziu o defeito em dois perfis; os dois controles sem recusa passaram. Os anexos mostram uma resposta no save primário, nenhuma no histórico e ausência de correção imediatamente após o clique. Restaurar o armazenamento e retomar a sessão não cria crédito adicional.

A gravação do horário agora trata sua própria exceção, mantendo a exigência de confirmação do save primário e a ordem de revisão, registro e correção. A regressão 253 reprovou os dois cenários de recusa e aprovou os dois controles antes do reparo. Os quatro passaram depois, com correção focada, um único registro no histórico e na revisão, atalho real sem crédito duplicado e pausa/reload/retomada nativos. Não há erro de página no contrato final. A revisão estática independente não encontrou bloqueador.

## Validação e limites

As vinte regressões novas, os 42 cenários relacionados e os 167 testes Node de progressão/piloto passaram sem repetição. Os percursos relacionados cobrem recomendações por área, seletor de temas, retomada e ordem, carregamento parcial, consulta histórica e recusa do save primário. As regressões usam bancos exclusivamente técnicos, sessões Guest e ações nativas. A recusa de gravação é injetada somente na fronteira de armazenamento, preservando métodos e funções do produto. Resultados da bateria completa, integração e conferência pública são registrados no PR desta entrega.

A auditoria estática da Prova não encontrou outro defeito novo com percurso nativo demonstrável. A janela de concorrência entre processos no `localStorage` continua sendo um limite conhecido, não uma garantia de transação. Os reparos desta entrega não reconciliam retrospectivamente estatísticas de registros antigos.

A intermitência histórica 191 da correção do Estudo fora da janela permanece sem causa comprovada. Não foi encerrada nem repetida em massa para sustentar esta entrega. Aparelhos físicos, OAuth, serviços reais e anúncio falado por leitor de tela permanecem fora da evidência desta rodada.

## Câmara: geometria com movimento reduzido

A primeira bateria completa, CI1067 no commit `030700c`, reprovou o primeiro enquadramento da spec 179: documento com 700 px numa janela de 684 px. Os doze shards terminaram com 3.161 aprovações diretas, uma falha final, três aprovações após repetição e 265 skips. As três repetições ocorreram nas specs 78, 182 e 33 e não constituem diagnóstico de outro defeito novo. Essa execução não autorizou publicação.

A regra global de movimento reduzido define duração de transição de 0,01 ms em todos os elementos. A raiz da Câmara conservava a propriedade padrão `all`: ao passar da introdução para a questão, o padding inferior de 24 px podia persistir por um quadro antes de chegar aos 8 px do espaço de perguntas. O cartão de 664 px, o topo de 12 px e os 24 px antigos explicam exatamente os 700 px. Um experimento com imagens decorativas pendentes reproduziu os 700 px, registrou a transição `padding-bottom` e descartou as fontes como causa.

O reparo inclui a raiz e seus pseudo-elementos na regra já existente que suspende movimento na Câmara. As transições de cor continuam permitidas; a animação ambiente do modo normal é preservada. A regressão 254 percorre Guest e botões nativos, observa a primeira mudança de layout e não injeta funções do produto nem altera conteúdo ou progresso. Antes do reparo, o cenário desktop com movimento reduzido reprovou por uma transição de padding; três controles passaram. Os preparos que disputavam o fechamento automático do cinema com comandos adicionais foram descartados como evidência funcional. A regressão final aguarda o retorno nativo do foco ao hub após a indisponibilidade de mídia, antes de reter as imagens da introdução do caso. A suíte 179 passou seus doze cenários de desktop após o reparo, incluindo as vinte introduções e primeiras questões em duas dimensões, sem repetição, em 2,3 minutos. A regressão 254 final passou nos quatro cenários, sem repetição, em 21,5 segundos: desktop com e sem movimento reduzido e celular emulado na sua largura nativa com as duas preferências. O resultado da nova bateria completa fica no PR.
