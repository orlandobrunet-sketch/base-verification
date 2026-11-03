# Revisão de layout, jogabilidade e transições — 03/11/2026

Iniciada depois de publicar e conferir a 16.62 (PR927, CI994 e Pages aprovados; 14 hashes públicos idênticos ao merge). Correções na candidata 16.63. Conteúdo médico, alternativas e referências fora desta rodada.

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
| Ranking sobrepõe texto e corta a busca | Em768px/fonte32px, resumo e controles continuavam em colunas que já não cabiam | Reflow por container query; teste reproduziu colisão e busca fora da área antes e confirmou leitura/entrada em quatro larguras e duas fontes após |
| Fase final mobile difere da Jornada | Desktop1440/1280/1100 já tinha as mesmas colunas na16.62. No domínio, mobile768/fonte32 dava720px na Jornada e744px na final, por margens laterais24px vs12px | Inset compartilhado, incluindo breakpoint≤370px. Spec189 fortalecida usa entrada real no chefe, bbox dos painéis e grade em6 larguras ×font16/32; passou após corrigir as margens |

As regressões falharam pelas causas esperadas antes dos fixes. A primeira bateria integrada registrou122 aprovações,2 skips e duas falhas na spec107 mobile: “compra única com clique duplo em espaço ocupado e nova compra deliberada” e “Pixel7 compra com dois toques, decide e volta preservando o restante da jornada”. Ambas também falharam carregando game.js/dashboard.css originais da16.62, confirmando o defeito preexistente. Após a proteção de interação, passaram com as mesmas assertions e a bateria final ficou verde. Nenhuma assertion existente, timeout, retry ou worker foi afrouxado. A spec189 ganhou comparação de larguras reais, fonte ampliada e entrada funcional no chefe. 325 testes de qualidade aprovados. Versão, SW e busters sincronizados; os741 bindings editoriais foram preservados, alterando somente a release do manifesto.

## Triagem visual e limites

Relatórios de auditarVisual foram guardados integralmente, incluindo inconclusões. Alertas sobre o skip link fora da tela sem foco e filhos do inventário com details fechado foram tratados como estados intencionais, sem alterar o instrumento para fazê-los passar. O drawer fechado foi confirmado como defeito por navegação real, e não apenas pela geometria. As capturas do HUD foram inspecionadas: as caixas tipográficas sinalizadas não provaram perda dos glifos. Degradês e outras composições continuam explicitamente inconclusivos no instrumento; esta revisão não certifica acessibilidade integral nem substitui teste manual com leitor de tela.

Evidências locais: audit-explore.log, audit-extended.log, audit-regression.log, audit-quality.log, audit-*.json/png e publication-verification.json no workspace da execução. A CI do novo HEAD precisa concluir antes de qualquer publicação da 16.63.
