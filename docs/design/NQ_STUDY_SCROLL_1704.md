# Rolagem da jornada durante o Estudo — 17.04

O usuário autorizou continuar a revisão técnica após a publicação da 17.03. Conteúdo médico, serviços reais e a decisão sobre vídeos permanecem fora desta entrega.

**17.04 publicada e conferida:** [PR958](https://github.com/orlandobrunet-sketch/base-verification/pull/958), merge `ce39f6502ddd19a86a2f883faf77474db5f2414b`, Pages `43268841232` aprovado, seis arquivos públicos idênticos e quatro regressões públicas aprovadas. CI1060: 3.031 testes completos + 265 skips previstos, sem falhas, intermitências ou retries; 15/15 jobs aprovados.

## Defeito reproduzido

Ao esgotar o baralho, `finishDeck` embaralha a fila e agenda `renderQuestion` para 1.800 ms depois. Se o jogador entra e responde no Estudo antes disso, o vínculo da jornada continua válido. O callback prepara a carta escondida e a rolagem global de `renderQuestion` levava a janela ao topo, mantendo o foco em `studyFeedback`, agora fora da tela.

O teste percorre a última carta de um banco exclusivamente técnico, responde e avança pelos handlers reais, abre o Estudo e cruza o prazo com relógio controlado. Os dois perfis falharam na interseção do feedback após o callback, enquanto foco e carta nova permaneciam corretos. A evidência registra `finishDeck → renderQuestion → scrollTo(top:0)` com campanha escondida e Estudo ativo; depois disso, scrollY era zero e o feedback começava abaixo de 6.400 px numa janela de 740 px.

## Mudança e conservação

Somente a rolagem ao topo exige que `mainApp` exista, esteja visível e não esteja inerte. O callback, a seleção da carta, o DOM escondido, os vínculos de conta/piloto e a gravação são preservados. Retomar uma resposta já avaliada continua sem reposicionamento automático.

A regressão 243 exige correção focada e na janela antes/depois do prazo, carta nova realmente preparada e retorno que permita respondê-la sem perda de estado. A entrega publicada validou dois contratos nos dois perfis. A rodada posterior ampliou para dois movimentos explícitos e conferiu `matchMedia`: oito cenários locais aprovados em 1,7 min, sem retry, e oito percursos públicos aprovados em 81 s sobre a 17.04. A CI1061 posterior reprovou; os ajustes seguintes agora compõem a candidata 17.05, com correção separada de CSS do tooltip e nova validação pendente. Não substitui nem enfraquece testes legados; [configuração e limites](NQ_MOTION_TEST_CONFIG_2026-11-12.md).

## Limites da investigação

- A falha histórica de primeira resposta em 191 continua aberta. Seus dois qids foram identificados por correspondência técnica de texto, sem análise médica, e não estavam nas trinta sessões antigas aprovadas. Replays específicos com três alternativas erradas, processamento reduzido e sem instrumentação passaram. Nenhuma dessas aprovações demonstra a causa ou a solução de 191.
- A rodada inicial de oito baselines tinha hooks que liam caixas e podiam alterar o layout; serve como observação, não prova de solução. As rodadas seguintes mantiveram separadas as medições e os gestos.
- Um controle experimental que exigia scrollY exatamente zero na campanha visível falhou também antes do patch. Esperar quadros, desativar ancoragem e focar Próxima não resolveram o resultado. A investigação posterior comprovou que a configuração de movimento reduzido era ignorada: o controle falhou 2/2 nessa condição, passou 2/2 com `reduce` efetivamente aplicado e passou 2/2 com movimento normal e 1.200 ms reais para acomodação. Movimento normal com apenas relógio JavaScript controlado continuou falhando 2/2, incluindo posição de 229 px. Compositor nativo e timers JavaScript não avançam de forma equivalente; a premissa falsa não sustenta uma regressão do produto. Esse controle não motivou ajuste de CSS, foco ou rolagem; o CSS posterior do tooltip trata outro defeito reproduzido. Registros externos em `campaign-scroll-1705` e análise no documento de configuração acima.
- A 191 já usava configuração de movimento correta. A correção de infraestrutura não reproduz nem explica sua intermitência histórica e não encerra esse item.
- Dois registros posteriores de timeout global do HUD não comprovaram uma causa nem foram relacionados causalmente à correção histórica fora da janela. Na rodada completa, as dez combinações geométricas passaram antes do timeout; no isolado, o prazo acabou após seis combinações. Preservar os dois registros sem chamar a rodada de aprovada nem atribuir causa de produto ou ambiente sem prova.
- Relógio controlado verifica o prazo e a disputa; não substitui aparelhos físicos ou serviços reais. Conteúdo e fontes médicas não foram alterados.

A publicação da 17.04 está concluída; artefatos detalhados estão na pasta externa `study-feedback-1704` desta sessão. A rodada posterior passou a incluir o [tooltip com movimento reduzido da candidata 17.05](NQ_REDUCED_MOTION_TOOLTIP_1705.md), com bump e validação final pendente. Consultar o PR959 para resultados e publicação dessa candidata; os percursos públicos sobre a 17.04 não aprovam automaticamente seu CSS novo.
