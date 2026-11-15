# Revisão técnica da candidata 17.27

**Resultado:** nenhum achado acionável nos deltas revisados. Esta conclusão é limitada ao escopo e às fontes preservadas; não declara o site sem bugs nem autoriza publicação por si só.

Foram revisados os deltas da Campanha, Prova, catálogo de revisões, offline, gerador do manifesto, helper de entrada, recuperação da IA e seus testes focais. Quinze fontes foram preservadas com hashes. Durante a revisão, somente `study-mode.js` mudou: dois trechos de texto passaram a omitir o aviso de cota diária para Premium. Esses trechos foram conferidos, sem mudança nos caminhos de cancelamento, gravação ou crédito. A fonte final desse arquivo também foi preservada.

## Conclusões

- A substituição mantém identidades distintas. O catálogo exige o registro histórico antigo e a identidade nova atual nos quatro modos; um binding antigo nunca passa a representar a questão nova.
- A troca de uma pergunta pendente depende de confirmação, conserva a origem salva e não atribui resposta, recursos ou FSRS. Avaliações antigas permanecem ligadas ao conteúdo respondido. O cursor da Campanha desconta itens retirados antes da posição salva.
- O helper guarda a promessa no documento, chama a ação uma vez e aguarda conclusão ou rejeição real antes de verificar a tela. Os sete contratos da spec304 testam também conteúdo já visível, coleta, troca de documento/fonte e propagação de erro. A inspeção não se baseou apenas na visibilidade da UI.
- Não foi encontrada nova transferência de aprendizagem, perda de progresso ou ampliação indevida de autoridade nos deltas revisados. As proteções de leitura e confirmação não constituem uma transação atômica universal entre abas.

## Hipótese da conclusão antiga do diagnóstico

A hipótese de que uma conclusão cancelada antiga não sobrescreve a entrada nova foi sustentada pelos caminhos revisados e por três contraprovas em Node VM.

`_retireStudyDiagnosis` aborta os controladores e remove as entradas pendentes. `_pedirDiagnostico` retorna `cancelado` após abort ou perda do binding. `_fetchDiagnosis`, linha 2125, retorna antes de gravar no mapa se recebeu esse estado, se o binding deixou de corresponder ou se a instância do card mudou. `NQPilot.matchesBinding` compara geração, dono, domínio e jornada; `release` incrementa a geração antes da notificação. Voltar ao mesmo dono não recupera a geração anterior.

As três provas executaram os trechos exatos das funções revisadas e a lógica real de captura/comparação de binding, com DOM, token, fetch e transições de geração simulados. Cobriram retirada da tela, troca de contexto e retorno ao mesmo dono mantendo deliberadamente o mesmo card. Em todos os casos, a entrada nova permaneceu intacta; liberar o token antigo tardiamente não fez fetch nem consumiu cota. Somente a solicitação nova fez um fetch e um crédito local; o conjunto de controladores terminou vazio. Isso não substitui a execução nativa no navegador.

O prazo limpa seu timer e listener ao terminar. Uma promessa externa que ignora cancelamento não pode ser encerrada à força; a revisão confirma a conclusão da espera controlada pela aplicação e a rejeição dos efeitos tardios, sem afirmar que o SDK liberou seus próprios recursos internos.

## Evidência e limites

- Parecer completo: `technical-review.json`, SHA-256 `e6c8fefa953abba063d55d24a786b4e21427690fc1882a04e3e4079ac1f1bbe0`.
- Prova focada: `diagnosis-race-probe.json`, SHA-256 `2f292a4081cebfdbd4023691121643467143231b3e8502beb6472924508d3afd`.
- Fontes iniciais: `source-pins.json`, SHA-256 `df653a9303c1ebeb7fc5c67ca5acde8443de8fc614fff92a3c4f5f792262f886`.
- Fonte final de Estudo: SHA-256 `ce1c166420b36cf6b9c468957d4e04e06ad522579dc3306cdd74f24851df07ed`.

Nenhum arquivo do repositório foi alterado nesta revisão. Não foi executada uma nova rodada de navegador, CI ou produção pelo revisor. A causa exclusiva da ocorrência histórica 279 permanece sem atribuição; o experimento de coleta demonstra um mecanismo possível.

O revisor foi autor do novo pacote TTKG e da ferramenta de transporte dos dados; não foi autor dos reparos de runtime examinados aqui. Esta revisão é técnica, sem novo julgamento clínico. O parecer clínico independente continua sendo o A2 emitido pelo root, com SHA-256 `5a1a3ab01413010e433795d834376372ae56ce8c87e0ffe933d94169505a164a`. A conferência final e a publicação permanecem sob responsabilidade do root.
