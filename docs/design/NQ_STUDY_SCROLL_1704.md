# Rolagem da jornada durante o Estudo — 17.04

O usuário autorizou continuar a revisão técnica após a publicação da 17.03. Conteúdo médico, serviços reais e a decisão sobre vídeos permanecem fora desta entrega.

## Defeito reproduzido

Ao esgotar o baralho, `finishDeck` embaralha a fila e agenda `renderQuestion` para 1.800 ms depois. Se o jogador entra e responde no Estudo antes disso, o vínculo da jornada continua válido. O callback prepara a carta escondida e a rolagem global de `renderQuestion` levava a janela ao topo, mantendo o foco em `studyFeedback`, agora fora da tela.

O teste percorre a última carta de um banco exclusivamente técnico, responde e avança pelos handlers reais, abre o Estudo e cruza o prazo com relógio controlado. Os dois perfis falharam na interseção do feedback após o callback, enquanto foco e carta nova permaneciam corretos. A evidência registra `finishDeck → renderQuestion → scrollTo(top:0)` com campanha escondida e Estudo ativo; depois disso, scrollY era zero e o feedback começava abaixo de 6.400 px numa janela de 740 px.

## Mudança e conservação

Somente a rolagem ao topo exige que `mainApp` exista, esteja visível e não esteja inerte. O callback, a seleção da carta, o DOM escondido, os vínculos de conta/piloto e a gravação são preservados. Retomar uma resposta já avaliada continua sem reposicionamento automático.

A regressão 243 exige correção focada e na janela antes/depois do prazo, carta nova realmente preparada e retorno que permita respondê-la sem perda de estado. São dois contratos nos dois perfis. Não substitui nem enfraquece testes legados.

## Limites da investigação

- A falha histórica de primeira resposta em 191 continua aberta. Seus dois qids foram identificados por correspondência técnica de texto, sem análise médica, e não estavam nas trinta sessões antigas aprovadas. Replays específicos com três alternativas erradas, processamento reduzido e sem instrumentação passaram. Nenhuma dessas aprovações demonstra a causa ou a solução de 191.
- A rodada inicial de oito baselines tinha hooks que liam caixas e podiam alterar o layout; serve como observação, não prova de solução. As rodadas seguintes mantiveram separadas as medições e os gestos.
- Um controle experimental que exigia scrollY exatamente zero na campanha visível falhou também antes do patch. Esperar quadros, desativar ancoragem no elemento raiz e focar o botão Próxima não confirmaram uma causa. Os registros externos foram preservados; esse controle não é chamado de aprovado nem de regressão introduzida pelo guard.
- Relógio controlado verifica o prazo e a disputa; não substitui aparelhos físicos ou serviços reais. Conteúdo e fontes médicas não foram alterados.

Os resultados completos da candidata e o estado de publicação devem ser conferidos no PR da entrega. Artefatos detalhados estão na pasta externa `study-feedback-1704` desta sessão.
