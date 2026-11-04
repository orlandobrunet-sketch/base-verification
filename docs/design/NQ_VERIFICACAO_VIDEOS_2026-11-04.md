# Verificação dos vídeos publicados — 04/11/2026

Base: nefroquest.com, versão 16.64, merge 1099f12. A falha de abertura relatada pelo proprietário não foi reproduzida nas sessões novas testadas. Foram aprovados 12 fluxos (seis desktop e seis caminhos nativos mobile), mais uma repetição da vitória pelo controle Rever, sem retries.

## Reprodução observada no desktop

As jornadas de cada personagem foram iniciadas pelos controles reais de visitante, dificuldade, seleção e confirmação. A Câmara foi aberta por Modos. Para alcançar confronto e vitória, foram usados saves de QA apenas no localStorage do contexto descartável; os controles e a lógica do jogo publicado permaneceram reais. Nenhuma mídia foi mockada e nenhum dado foi enviado ao backend.

| Apresentação | Resultado observado |
|---|---|
| Dr. Nephros | Filme de oito segundos terminou; Rever introdução abriu novamente; Pular fechou |
| Dra. Aquaria | Filme de oito segundos terminou; Rever introdução abriu novamente; Pular fechou |
| Dr. Glomerulus | Filme de oito segundos terminou; Rever introdução abriu novamente; Pular fechou |
| Câmara do Equilíbrio | Filme de oito segundos terminou, devolvendo o hub; replay e saída funcionaram |
| Confronto final | O botão nativo de introdução abriu camera04; o filme de oito segundos terminou e devolveu a batalha |
| Vitória | O trecho inicial do vídeo dissolveu para o retrato, mostrou a legenda final e entregou os resultados uma vez. Rever reiniciou a sequência sem duplicar trilha ou entrega |

Os seis arquivos responderam HTTP 200, com Content-Type video/mp4 e suporte a ranges. Os quadros de 1280×720 foram decodificados de verdade: houve avanço de cerca de 2,2 segundos e 52–55 quadros nas janelas de medição. Capturas A/B diferentes foram guardadas e inspecionadas. Pausa e retomada funcionaram nos seis casos.

Não houve quadros adicionais descartados durante essas janelas nem eventos stalled. A vitória já registrava um quadro descartado antes da amostragem; isso permanece registrado. As trilhas dedicadas de confronto e vitória emitiram waiting seguido de playing ao serem ativadas. Não houve erro de mídia ou exceção JavaScript nos 12 fluxos.

## Áudio: o que foi e não foi verificado

Após Ativar som, o elemento de saída ficou desmutado e em reprodução. A captura digital de áudio pelo navegador apresentou energia não nula nos seis casos. O confronto e a vitória usaram a trilha dedicada; ao terminar, o gate nativo de áudio estava liberado. O replay da vitória manteve uma única instância de trilha.

Isso comprova carregamento, decodificação, avanço e sinal digital. Não houve escuta acústica humana, avaliação semântica da narração ou teste de volume nos alto-falantes do proprietário. Os marcadores semanticAudioVerified não foram alterados.

## Celular e limites

No Pixel 7 emulado, as três entradas de personagem, Câmara, confronto e resultados funcionaram sem abrir um player. Esse é o comportamento programado: os filmes exigem viewport de pelo menos 769 px, hover e ponteiro fino. Uma janela estreita de computador também pode cair na apresentação nativa. A revisão não habilitou vídeos mobile automaticamente.

Os testes usaram Chromium automatizado, não um telefone físico. O service worker foi bloqueado para obter uma sessão de rede nova; o cache antigo do usuário não foi reproduzido. Nenhuma aba do NefroQuest estava exposta pelo conector de navegador para essa inspeção. Foi solicitada informação sobre dispositivo, navegador e janela do teste anterior, sem bloquear a revisão.

## Histórico dos instrumentos

O primeiro harness de produção tentou ler window.state, que não existe nesse contexto. A leitura foi corrigida para o estado léxico do app, preservando os logs anteriores. Uma rodada seguinte teve 11 aprovações e uma falha ao exigir o evento ended do arquivo de vitória. O código e os contratos existentes mostraram que o epílogo dissolve intencionalmente após cerca de 5,5 segundos do arquivo de oito segundos e termina a sequência completa em aproximadamente 11 segundos. A conferência específica passou a verificar retrato, legenda final, encerramento e entrega única; uma nova rodada integral aprovou os 12 fluxos. Nenhum teste permanente foi afrouxado e nenhum player foi alterado para satisfazer o instrumento.

Evidências: audit-media-production-verified.log (12 aprovações), audit-media-victory-replay.log (uma aprovação), media-production-summary.json, media-verified-*.json/png e media-replay-*.json/png no workspace da execução. As regressões locais de cinema somaram 28 aprovações e 24 skips previstos, sem falhas ou retentativas. Não há alegação de fluidez universal em todos os dispositivos ou redes.
