# 17.14 — continuidade das 35 superfícies

O proprietário autorizou a execução do relatório e delegou a ordem de prioridades. Esta revisão reúne os dois primeiros lotes no PR967. A candidata 17.13, HEAD `5026880926f16c68710326069e574390a42fb23a`, não foi publicada: a CI1075 reprovou. Sua prova integral permanece preservada.

## Resultado pretendido

Revisão agendada mostra apenas cards existentes, válidos e vencidos; Estudo Livre continua separado. O personagem reúne retrato e benefícios antes da história no celular. A Prova conserva questão/tempo durante a rolagem e mantém o foco legível ao ampliar texto. Leitura móvel fica estável, com alternativas imóveis e correção por opacidade.

Ranking recupera falhas no próprio contexto e preserva a âncora do Atualizar durante a recarga. O término da carga libera os controles sem roubar uma edição iniciada na busca. Atualização de cache oferece nova tentativa e conserva o destino até verificar a limpeza.

No Painel, só o detalhe da nova competência recebe transição; números e gráfico não reiniciam. O Mapa mostra quantidade real e tamanho da sessão. Motivos de erro podem expandir horários realmente registrados; não se reconstrói uma alternativa histórica a partir do índice antigo.

O primeiro acesso recebe uma orientação junto da ação principal; histórico existente não é chamado de primeiro acesso. Preferências mostram estado aplicado e prévia de leitura no mesmo menu. Portal anima somente o formulário selecionado; a leitura inicial anônima reaplica a superfície correta após aposentar um registro de outra conta.

Offline mostra o estado local de conexão, sem prometer sincronização automática. Contato associa o erro ao campo e preserva o texto após falha. Privacidade e Novidades ganham índice no próprio leitor. Textos legais, notas históricas e os scripts originais do estudo offline permanecem intactos.

## CI1075 preservada

15 jobs concluídos: sete verdes e oito reprovados. Full E2E: 3.238 aprovações diretas, 16 falhas, uma intermitência e 265 skips previstos, total 3.520. Smoke 130; Node 445; PostgreSQL 43; Deno 8 e typecheck de nove funções aprovados.

| Origem | Causa comprovada e reparo delimitado |
|---|---|
|112, quatro falhas|O teste exigia texto justificado em toda largura; a mudança aprovada alinha à esquerda até768px. Expectativas condicionadas ao breakpoint, demais verificações preservadas. Uma rodada posterior mostrou limite de20s consumido pelo laço de três larguras; cada largura passa a ter seu próprio caso, sem ampliar timeout nem retirar assertions.|
|182, duas falhas|Contrato antigo exigia o tremor retirado deliberadamente. Mantém classe de erro/perda de vida e verifica alternativas sem animação mais fade de200ms da correção.|
|70, quatro falhas|Contraste era medido no rótulo secundário agora oculto no celular. Mede o h1 visível, afirma o rótulo oculto e conserva os demais critérios.|
|262, quatro falhas|O servidor daCI redireciona clear-cache.html para clear-cache. O preparo só aceitava a primeira URL e não armava a falha de armazenamento. Aceita somente as duas rotas e confirma a falha armada antes de verificar a recuperação. Produto intacto por esse reparo.|
|126, duas falhas|Regressão real de rolagem: desabilitar o Atualizar focado e reconstruir a tabela removiam sua âncora. Mantém esse foco com aria-disabled e busy; o guard existente impede outra requisição. Cargas sem esse foco continuam usando disabled nativo. O teste original permanece intacto.|
|76, uma intermitência|Preparo ocultava o Portal sem entrar como visitante; a atualização da sessão o reabria sobre o Ritual. Preparo passa pela opção Guest existente, sem mudar produto ou assertions.|

Nenhum job1075 foi repetido ou cancelado para substituir essa evidência. Logs, ZIPs oficiais e traces foram preservados; extrações tiveram caminhos e hashes conferidos.

## Verificação local e seus limites

A candidata 17.13 teve 54 casos iniciais (44 aprovados e dez reprovados), seguidos de 26/26 reparos e 32/32 regressões existentes aprovados. Os quatro percursos de 182 normal/reduzido passaram depois do ajuste do contrato. O reparo de 126 passou no teste original em 320/390px. A recuperação de 262 passou também nos quatro casos que reproduzem o redirecionamento 301 observado na CI.

Na proposta seguinte, 38 percursos deram 30 aprovações e oito reprovações. Seis resultados decorreram de expectativas/preparos novos incorretos; dois revelaram a sobreposição real do Portal na inicialização com registro de outra conta. A revisão R1 separou esses contratos e passou 40/42: ambas as inicializações e os fluxos do Painel/apoio passaram. Os dois restantes revelaram o menu fora da lateral em 320px/fonte 32px. A R2 corrigiu a lateral, mas preservou 20px de excesso inferior; essa evidência também foi mantida. A R3 aumentou somente a reserva vertical com fonte ampliada e passou os seis percursos de preferências: limites da tela, rolagem interna, alvos de 44px, teclado e preservação das escolhas. Capturas normal e ampliada foram conferidas. Duas tentativas anteriores falharam na infraestrutura, antes de alcançar o site: caminho do navegador e servidor local indisponível; foram preservadas, sem atribuição ao produto.

Os 12 cenários de leitura parametrizados por largura passaram com os mesmos critérios e prazo de 20 segundos. Os 12 de recuperação do Ranking passaram, incluindo Atualizar focado em 320px/fonte 32px, cliques duplicados e edição da busca durante a carga. Essa conferência usa dados remotos simulados na fronteira, sem requisições a contas ou serviços reais.

Os unitários de respostas/cinema/Auth passaram 133/133 após completar a fronteira de eventos do harness offline; asserções e scripts reais preservados. O conjunto local completo passou 449/449. Na primeira execução, cinco testes não puderam criar repositórios temporários por permissão do ambiente; a execução com Git normal manteve os mesmos arquivos e critérios. Quatro unitários do callback de Auth distinguem visitante, titularidade, geração da sessão e sessão autenticada; não são prova de atraso do SDK em aparelho real.

Fontes reais são exigidas nas capturas e nas novas geometrias. Um runner local por vez, sem contas/serviços reais e com escritas externas bloqueadas. O envio do contato é somente simulado na fronteira local. CI do novo HEAD, integração, Pages, hashes e percursos públicos continuam sendo condições adicionais da publicação. Resultados finais ficam no PR.

## Escopo preservado

Sem nova revisão ou alteração médica. Banco, referências, histórico, FSRS, economia, prazos e autorização de pagamento permanecem preservados; o manifesto muda apenas o release técnico. O log de motivos não tem binding histórico suficiente para reconstruir enunciados ou alternativas, portanto nenhuma funcionalidade promete esse reteste.

A intermitência histórica 191 continua aberta. Celulares são emulados. Aparelhos físicos, leitor de tela falado, sincronização entre aparelhos reais e serviços reais exigem conferência própria. O [plano das 35 superfícies](NQ_INTERNAL_PAGES_PLAN_2026-11-13.md) permanece acompanhado por recortes; publicar este lote não equivale a alterar todas as 35 páginas.
