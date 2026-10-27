# Integração cinematográfica desktop

Esta revisão integra as histórias e os seis filmes aprovados da A6 no fluxo nativo, com som opt-in e retorno aos resultados nativos. A apresentação é habilitada somente em desktop com ponteiro fino, sem touch; mobile, piloto e sandbox preservam a entrada nativa.

Os hooks em `js/game.js` e `js/boss.js` observam o resultado já calculado pelo jogo. A apresentação não decide respostas, recompensas ou progresso. O áudio usa uma autorização temporária sobre as instâncias existentes, sem regravar preferências. Pausa, mute, término, pulo, fechamento, falha e mudança de contexto liberam essa autorização; replay começa mudo.

As imagens e filmes mantêm os bytes aprovados, registrados em `assets-manifest.json`. Filmes não são pré-carregados pelo service worker: o navegador conserva o transporte HTTP Range e a interface oferece continuação quando a mídia falha. As demais estratégias de cache continuam existentes.

Os avisos nativos de atordoamento e conquista ocupam uma faixa no fluxo do layout durante o confronto desktop. Conteúdo, gatilhos, duração e recompensas continuam sob o código nativo.

Se um popup de recompensa interrompe a apresentação da vitória, a entrega dos resultados aguarda seu fechamento pelos controles nativos. O estado de conclusão e as recompensas já estão resolvidos; a fila cuida somente da apresentação e do foco. Mudança de contexto cancela a entrega antiga, e o descarte da bridge devolve imediatamente o controle ao modal nativo.

O filme interrompido por uma recompensa nativa volta após seu fechamento, começando mudo. A evolução causada pelo último acerto usa a função nativa uma única vez no prazo original e conserva seu próprio nó, sem pintura concorrente. O anúncio aparece após o fechamento dos resultados; outras evoluções continuam delegadas à função nativa. Este trecho foi portado seletivamente da revisão local A7 e combinado com a fila de recompensas do PR, sem substituir seu snapshot.

Validação realizada antes do PR: 318 testes Node dos gates existentes, sintaxe de todos os arquivos JS, percurso real de zero a 100 acertos na sucessora e regressões de áudio/encerramento/interrupção. Capturas em 1440×900 e 1280×720 tiveram inspeção visual independente. O percurso HTTP com service worker e a suíte agregada E2E são registrados separadamente no relatório de entrega. Não houve revisão de conteúdo médico nem geração de mídia.

Limite: a observação dos elementos reais de mídia comprova mute/opt-in/restauração, mas não constitui escuta perceptiva dos filmes.
