# Revisão de layout, jogabilidade e transições — 03/11/2026

Iniciada depois de publicar e conferir a 16.62 (PR927, CI994 e Pages aprovados; 14 hashes públicos idênticos ao merge). Correções na candidata 16.64. Conteúdo médico, alternativas e referências fora desta rodada.

## Cobertura

- Matriz inicial: 1440×900, 1100×800, 768×1024, 390×844, 320×740 e 844×390. Fonte 16px/movimento normal e 32px/movimento reduzido: 12 configurações e 72 estados de Átrio, Modos, Jornada, Forja, Biblioteca e retorno com save. Todos os fluxos terminaram sem exceções JavaScript ou alteração indevida do progresso.
- Extensão: seis abas do Painel (Visão geral, Competências, Mapa, Conquistas, Grimório e Ranking), inventário expandido da Forja e história do herói em 1440/16, 768/32, 320/16 e 320/32. Quatro fluxos completos aprovados, preservando o estado e o retorno de foco.
- Regressão integrada final nas specs 23, 62, 69, 107, 147, 187 e 190: 122 aprovados e 4 skips previstos, sem falhas ou retentativas. Chefe e pedidos de novembro (05, 120, 189): 57 aprovados e 5 skips previstos. Duas baterias finais somam 179 aprovações e 9 skips, sem falhas/retentativas. Incluem compra única por clique duplo, recuperação de sorteio pago, falhas de gravação, comparação de atributos, texto ampliado, movimento reduzido, vitória e legibilidade do chefe.

## Achados corrigidos

| Achado | Reprodução e causa | Correção e evidência |
|---|---|---|
| Painel mobile fechado recebe foco | Tab a partir da jornada entrava em controles fora da tela; deslocar o painel por CSS não o retirava da navegação | Drawer inerte enquanto fechado, reativado ao abrir e ao voltar ao desktop. Teste falhou antes e passou nos dois perfis; abertura, Escape, retorno ao acionador e resize preservados |
| Nome do perfil reduzido a poucas letras | Em 768px, “Jogador local” era cortado; a grade compacta ainda reservava 2,4rem a um avatar já removido do markup | Uma coluna para o conteúdo existente. Regressão confirma o nome inteiro em 768/844/980px, fontes 16/32px, nos dois perfis |
| Retorno ao Átrio perde o foco | Esconder a jornada deixava o foco no body, sem anunciar o destino | Foco programático no título do Átrio, sem criar parada extra de Tab. Teste antes/depois confirma destino, Tab seguinte e progresso preservado |
| Segundo gesto da compra decide o item | O novo card e o scroll posicionavam “Equipar” sob o segundo clique/toque; saldo passava a 4720 antes da leitura, em vez de permanecer 4700 com decisão pendente | Proteção breve das ações recém-reveladas, preservando foco, transações e recibo. As duas assertions originais da spec107 foram mantidas e passaram após o fix |
| Ranking sobrepõe texto e corta a busca | Em 768 px / fonte de 32 px, resumo e controles continuavam em colunas que já não cabiam | Reflow por container query; teste reproduziu colisão e busca fora da área antes e confirmou leitura/entrada em quatro larguras e duas fontes após |
| Fase final mobile difere da Jornada | Desktop em 1440/1280/1100 px já tinha as mesmas colunas na 16.62. No domínio, mobile em 768 px / fonte de 32 px tinha 720 px na Jornada e 744 px na final, por margens laterais de 24 px e 12 px | Inset compartilhado, incluindo breakpoint até 370 px. Spec189 fortalecida usa entrada real no chefe, bbox dos painéis e grade em 6 larguras e fontes de 16/32 px; passou após corrigir as margens |

As regressões falharam pelas causas esperadas antes dos fixes. A primeira bateria integrada registrou 122 aprovações, 2 skips e duas falhas na spec107 mobile: “compra única com clique duplo em espaço ocupado e nova compra deliberada” e “Pixel 7 compra com dois toques, decide e volta preservando o restante da jornada”. Ambas também falharam carregando game.js/dashboard.css originais da 16.62, confirmando o defeito preexistente. Após a proteção de interação, passaram com as mesmas assertions e a bateria final ficou verde. Nenhuma assertion existente, timeout, retry ou worker foi afrouxado. A spec189 ganhou comparação de larguras reais, fonte ampliada e entrada funcional no chefe. 325 testes de qualidade aprovados. Versão, SW e busters sincronizados; os 741 bindings editoriais foram preservados, alterando somente a release do manifesto.

## Triagem visual e limites

Relatórios de auditarVisual foram guardados integralmente, incluindo inconclusões. Alertas sobre o skip link fora da tela sem foco e filhos do inventário com details fechado foram tratados como estados intencionais, sem alterar o instrumento para fazê-los passar. O drawer fechado foi confirmado como defeito por navegação real, e não apenas pela geometria. As capturas do HUD foram inspecionadas: as caixas tipográficas sinalizadas não provaram perda dos glifos. Degradês e outras composições continuam explicitamente inconclusivos no instrumento; esta revisão não certifica acessibilidade integral nem substitui teste manual com leitor de tela.

Evidências locais: audit-explore.log, audit-extended.log, audit-regression.log, audit-quality.log, audit-*.json/png e publication-verification.json no workspace da execução. A CI do novo HEAD precisa concluir antes de qualquer publicação da 16.64.

## Achado adicional na CI996

A parte 3 concluiu com dois cenários instáveis da spec69 (320 e 390 px a 200%), aprovados somente na terceira tentativa. O texto auxiliar de Equipar atingiu 1,18:1 ao habilitar as ações: a cor do texto mudava imediatamente, mas o fundo herdava uma interpolação global de 200 ms. O defeito foi reproduzido localmente, sem retries, por um novo teste que amostra o contraste durante o bloqueio e sua liberação. A correção limita as transições dos botões do resultado a borda, movimento, sombra e filtro, trocando texto e fundo juntos. O bloqueio contra o segundo gesto continua intacto. O novo teste passou nos dois perfis. Nenhuma medição, assertion, limite ou política de retries foi afrouxada.

O ajuste adicional de asset inclui versão/SW/cache-busters no mesmo commit, seguindo AGENTS.md; por isso a candidata do PR928 avança de 16.63 para 16.64. A 16.62 permanece publicada. A comparação profunda confirmou os 741 vínculos editoriais idênticos; somente a release mudou. A conclusão da CI996 e a validação do novo HEAD devem ser registradas no PR antes de considerar a candidata pronta.

CI996 final (HEAD62768e79, run41725399665): status success, 2.382 aprovações, 258 skips previstos e dois flaky; zero falhas finais. Partes pass/skip/flaky: 1=454/8/0; 2=419/2/0; 3=446/7/2; 4=384/61/0; 5=343/78/0; 6=336/102/0. Os dois flaky são os cenários de contraste descritos acima, não foram descartados e motivaram o ajuste adicional. O HEAD corrigido precisa de uma nova CI completa.

Validação local adicional da candidata 16.64: 77 testes aprovados e 1 skip previsto nas specs69/107/190, zero falhas/retentativas, um worker e timeout de 20 s por teste; 325 testes de qualidade aprovados. O teste novo passou nos dois perfis após falhar antes do ajuste (1,18:1). A listagem de shards confirmou 2.644 casos únicos atribuídos exatamente uma vez, incluindo os dez casos de raridade, sem omissões/duplicações. Logs preservados: ci996-contrast-red.log, ci996-contrast-green.log, ci996-contrast-regression-final.log e ci996-quality-final.log. Um lote local anterior foi interrompido com o servidor indisponível; seu log foi preservado e não conta como validação aprovada.
