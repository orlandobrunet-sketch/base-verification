# Rolagem da jornada durante o Estudo — 17.04

O usuário autorizou continuar a revisão técnica após a publicação da 17.03. Conteúdo médico, serviços reais e a decisão sobre vídeos permanecem fora desta entrega.

**17.04 publicada e conferida:** [PR958](https://github.com/orlandobrunet-sketch/base-verification/pull/958), merge `ce39f6502ddd19a86a2f883faf77474db5f2414b`, Pages `43268841232` aprovado, seis arquivos públicos idênticos e quatro regressões públicas aprovadas. CI1060: 3.031 testes completos + 265 skips previstos, sem falhas, intermitências ou retries; 15/15 jobs aprovados.

## Defeito reproduzido

Ao esgotar o baralho, `finishDeck` embaralha a fila e agenda `renderQuestion` para 1.800 ms depois. Se o jogador entra e responde no Estudo antes disso, o vínculo da jornada continua válido. O callback prepara a carta escondida e a rolagem global de `renderQuestion` levava a janela ao topo, mantendo o foco em `studyFeedback`, agora fora da tela.

O teste percorre a última carta de um banco exclusivamente técnico, responde e avança pelos handlers reais, abre o Estudo e cruza o prazo com relógio controlado. Os dois perfis falharam na interseção do feedback após o callback, enquanto foco e carta nova permaneciam corretos. A evidência registra `finishDeck → renderQuestion → scrollTo(top:0)` com campanha escondida e Estudo ativo; depois disso, scrollY era zero e o feedback começava abaixo de 6.400 px numa janela de 740 px.

## Mudança e conservação

Somente a rolagem ao topo exige que `mainApp` exista, esteja visível e não esteja inerte. O callback, a seleção da carta, o DOM escondido, os vínculos de conta/piloto e a gravação são preservados. Retomar uma resposta já avaliada continua sem reposicionamento automático.

A regressão 243 exige correção focada e na janela antes/depois do prazo, carta nova realmente preparada e retorno que permita respondê-la sem perda de estado. A entrega publicada validou dois contratos nos dois perfis. A rodada posterior, restrita a testes, amplia para dois movimentos explícitos e confere `matchMedia`: oito cenários aprovados em 1,7 min, sem retry. A bateria relacionada de 52 cenários está em execução e a CI dessa rodada permanece pendente. Não substitui nem enfraquece testes legados; [configuração e limites](NQ_MOTION_TEST_CONFIG_2026-11-12.md).

## Limites da investigação

- A falha histórica de primeira resposta em 191 continua aberta. Seus dois qids foram identificados por correspondência técnica de texto, sem análise médica, e não estavam nas trinta sessões antigas aprovadas. Replays específicos com três alternativas erradas, processamento reduzido e sem instrumentação passaram. Nenhuma dessas aprovações demonstra a causa ou a solução de 191.
- A rodada inicial de oito baselines tinha hooks que liam caixas e podiam alterar o layout; serve como observação, não prova de solução. As rodadas seguintes mantiveram separadas as medições e os gestos.
- Um controle experimental que exigia scrollY exatamente zero na campanha visível falhou também antes do patch. Esperar quadros, desativar ancoragem e focar Próxima não resolveram o resultado. A investigação posterior comprovou que a configuração de movimento reduzido era ignorada: o controle falhou 2/2 nessa condição, passou 2/2 com `reduce` efetivamente aplicado e passou 2/2 com movimento normal e 1.200 ms reais para acomodação. Movimento normal com apenas relógio JavaScript controlado continuou falhando 2/2, incluindo posição de 229 px. Compositor nativo e timers JavaScript não avançam de forma equivalente; a premissa falsa não sustenta uma regressão do produto. Nenhum CSS ou foco adicional entrou no aplicativo. Registros externos em `campaign-scroll-1705` e análise no documento de configuração acima.
- A 191 já usava configuração de movimento correta. A correção de infraestrutura não reproduz nem explica sua intermitência histórica e não encerra esse item.
- Relógio controlado verifica o prazo e a disputa; não substitui aparelhos físicos ou serviços reais. Conteúdo e fontes médicas não foram alterados.

A publicação da 17.04 está concluída; artefatos detalhados estão na pasta externa `study-feedback-1704` desta sessão. A rodada posterior altera somente testes, CI e documentação, sem bump ou mudança do site. Consultar seu PR final para resultados ainda pendentes, sem confundi-los com a publicação já concluída.
