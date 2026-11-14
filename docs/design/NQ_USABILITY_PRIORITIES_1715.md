# 17.15 — acabamento dos percursos e reflow do encerramento

Estado da preparação: candidata não publicada. Os assets 17.15 estão no HEAD `ac1b3d05c6d668cea4d33b8fdb05fddd2a54c358`; a revisão seguinte muda somente testes e documentação. As candidatas 17.13/17.14 permanecem preservadas sem publicação. O [relatório histórico da 17.14](NQ_USABILITY_PRIORITIES_1714.md) descreve os dois lotes autorizados: revisão agendada, personagem, Prova/leitura, recuperação, Painel, Portal/primeiro acesso/Preferências e páginas de apoio.

A auditoria adicional encontrou o `dt` Acertos maior que sua coluna na derrota em 320 px/fonte 32. O reparo usa pares rótulo/valor por linha até 480 px, preservando fontes e desktop. A contraprova completa passou 2/2; a observação adicional passou 1/1. Capturas 390/16 e 320/32 mostram estatísticas e controles alcançáveis. Resultados, crédito único e nova tentativa conservam as mesmas verificações.

## Candidatas anteriores e reparos delimitados

A CI1076 do HEAD 17.14 concluiu 15 jobs, 13 verdes e 2 reprovados: 3.572 casos = 3.301 aprovações diretas + 2 falhas finais + 4 flaky + 265 skips. As duas falhas são o seletor antigo 109 em desktop/celular: o novo índice também contém o título procurado. A seleção agora exige o título histórico exato, mantendo as verificações de histórico, rolagem e fechamento.

Os quatro casos intermitentes 64/70/78/181 tiveram o Portal sobreposto ao contexto preparado sem entrada Guest. Logs e traces oficiais comprovam a interceptação; na 181 há um frame dentro do intervalo de medição. Os preparos agora entram como visitante pelo caminho existente. O código do Boss e suas asserções de texto/tamanho/hit-test permanecem intactos.

A CI1077 acompanha o HEAD `ac1b3d05` e ainda contém o seletor 109 antigo. Seus resultados são preservados separadamente; sua aprovação parcial não autoriza publicação. Também registrou preparos sem Guest em 65/112, reparados nesta revisão. As intermitências 97/198 continuam sem causa comprovada; não se atribui o hit-test/rolagem ao Portal apenas porque o helper era antigo.

## Verificação local

- Prova/Câmara 70/78: 30 aprovações e 2 skips previstos, sem falhas finais; não são 32 aprovações.
- Grimório/Novidades 64/109: 4/4; chefe 181 com alternativas longas: 4/4.
- Referência/leitura 65/112: os quatro primeiros casos atingiram 20 s locais. Traces mostraram preparo com duas cargas completas do app; o leitor respondeu às teclas. Uma opção exclusiva dos dois pontos de chamada permite semear o mesmo save na 404 da mesma origem e abrir o app uma única vez. O recarregamento padrão, os dados, owner/Auth/Guest, `continueGame`, as asserções e o prazo de 20 s foram preservados. A contraprova seguinte passou 4/4 em 11,4–15,3 s. Isso mede o preparo de teste local, não a latência de usuários reais.
- Os recortes anteriores passaram 449/449 de lógica, 12/12 de leitura por largura, 12/12 de recuperação do Ranking e 6/6 de Preferências. Essas provas têm suas próprias condições; não substituem a CI do HEAD final.

As rodadas de recompensa continuam separadas: 5/10 inicial, 3/4 R1 focal, 2/2 após o reparo da derrota, 1/1 Conquistas R2 e 1/1 de observação adicional. Não são apresentadas como uma rodada única 10/10. O RNG produziu equipamentos; o ramo de pergaminho não foi observado nessa auditoria.

A captura 320/32 de Conquistas foi investigada sem alterar o produto. O helper forçava um painel alto para o topo, rolando 525 px do Dashboard com overflow oculto. Os 90 pontos permaneceram cobertos pelo Dashboard e o jogo inerte. A R3 enquadra somente o título com `nearest`, sem reset forçado; passou 1/1, com rolagem externa zero e 90/90 pontos cobertos. Capturas normais e ampliadas foram conferidas. O ajuste pertence exclusivamente ao helper externo de captura.

## Publicação e limites

A próxima revisão mantém os mesmos assets/SW/versão 17.15 e muda somente testes/documentação. Antes da publicação, concluir a CI do HEAD final, integração, Pages, hashes do merge e percursos públicos somente leitura. O estado final e os números efetivos de publicação ficam no [PR967](https://github.com/orlandobrunet-sketch/base-verification/pull/967).

O [ledger das 35 superfícies](NQ_35_SURFACES_EXECUTION_1715.md) mantém todas as linhas e distingue aplicação, conferência delimitada e trabalho pendente. Conteúdo médico, referências, bindings, FSRS, economia e pagamentos permanecem preservados. A intermitência histórica 191 continua aberta. Celulares são emulados; aparelhos físicos, leitor de tela falado, sincronização entre aparelhos reais e serviços reais têm validação própria. Este lote não certifica todas as 35 páginas ou perfeição geral do site.
