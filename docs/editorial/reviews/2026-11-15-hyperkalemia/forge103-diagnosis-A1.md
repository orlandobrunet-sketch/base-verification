# CI1097 — diagnóstico do103/Chromium

A falha0 vem de uma preparação incompleta do teste: a fixture entra na jornada sem ativar o modo visitante e concorre com a conclusão assíncrona da autenticação anônima. A compra da Forja já havia terminado; o portal de acesso interceptou o clique de retorno. Não há demonstração de defeito no caminho Guest nativo nem indicação de cobrança extra nessa falha.

O trace original (`fe2a1b7f8fbcfa4e644232ed5a420c16ae4248d6b4ddf8fae0dd393fdf7b019c`) mostra `landingScreen` exposto no snapshot imediatamente posterior ao comando que o ocultou: chamada11179 termina em330069,423 e snapshot330077,425 já tem `class=""`. Depois, `landingScreen` e `mainApp` visíveis coexistem, antes da primeira confirmação de gasto. A leitura do ouro retorna950 após a compra de300; o fechamento do resultado funciona. O clique seguinte, na linha17, é interceptado pelo cabeçalho do portal até expirar20s.

`103-confirmacao-gasto.spec.ts:5` usa `injectGameState(page,{gold})`, sem `{asGuest:true}`. O caminho padrão do helper apenas oculta o portal no DOM. Em `auth.js:187/210`, os dois caminhos de conclusão de sessão nula reabrem o portal se não há usuário nem visitante. `playAsGuest` marca visitante em memória e armazenamento antes de ocultá-lo. Esses callbacks iniciais não zeram ouro nem retiram a Forja. Um logout/troca real seguiria outro caminho, com `_stopLocalJourney`, que faz ambos.

O resultado da Forja usa `dialog.showModal()` (`game.js:6487`), cuja camada modal nativa permite clicar mesmo com o portal atrás. Fechá-lo expõe a página normal da Forja, de z10, sob o portal fixo de z9000. Isso explica a falha somente no segundo botão; o fechamento não criou a sobreposição.

## Contraprova dirigida

Foi executada uma orquestração local em5514, fonte845 limpa. Cópia isolada do103, assertivas/corpo preservados, timeout20s e retries2 daCI, observer passivo. GET somente no localhost5514, demais requisições e WebSockets bloqueados; nenhuma função/resposta de produto foi substituída. O controle muda apenas a opção de preparação já suportada pelo helper.

| Preparação | Tentativa | Resultado | Observação |
|---|---:|---|---|
| Original, sem visitante | 0 | Timeout20.667ms | Mesma interceptação doCI; visitantefalse; portal hidden→visível em0,8ms; ouro950; Forja permanece |
| Original, retry configurado | 1 | Passou5.836ms | Visitante continuafalse; conclusão anônima ocorre antes da ocultação; portal fica oculto |
| Entrada Guest nativa | 0 | Passou6.034ms | Visitantetrue, armazenamento1, portal oculto; ouro950; Forja removida e foco devolvido |

Não houve nova execução manual para obter sucesso. O retry configurado reforça a ordem variável: a preparação inválida permanece inválida mesmo quando passa. O resultado Guest é um único controle dirigido, não uma bateria completa ou garantia geral de autenticação.

## Limites e encaminhamento

O traceCI não registra stackJavaScript nem flagGuest. A análise não distingue qual dos dois callbacks iniciais equivalentes reabriu o portal. A observação local e as guardas lidas estabelecem a corrida de preparação; não autorizam concluir que nunca exista outro defeito de produto.

Auth, jogo, CSS, helper, teste103 e configuração são canonicamente idênticos à17.24. A diferença em `jogar/index.html` é somente a identificaçãoSentry da release. Não há prova de causa semântica das questões médicas; variações de tempo podem expor a corrida preexistente.

A menor correção candidata é local ao preparo do103: usar `{asGuest:true}` e verificar portal oculto na fronteira de preparação/retorno, mantendo cliques nativos e todas as verificações de gasto/cancelamento/foco. O teste269 existente já cobre sessão inicial nula tardia por promessa/evento; foi somente lido nesta investigação, pois usaSDK controlado. Qualquer alteração permanece sob revisão/autorização da raiz. Não foi aplicada correção, aumentotimeout/retries, `force:true` ou mudança de camadasCSS.

Uma tentativa preliminar não encontrou o executável do navegador por configuração do ambiente isolado; seus retries nem abriram o app. Esse erro de infraestrutura está preservado separadamente em `report-original-unmarked.json` e não entra nos resultados acima.

Servidor realPID33256 encerrado. Verificação por conexão retornou porta fechada; `netstat` mostrou somenteTIME_WAIT e nenhumLISTENING na5514; processo não encontrado. ROOT permaneceu limpo antes/depois; todas as gravações desta investigação estão nesta pastaART.

Dados completos: `forge103-diagnosis-A1.json`, `ci-attempt0-trace-analysis.json`, `report-original-unmarked-localbrowser.json`, `report-guest-native-localbrowser.json`, `local-probe-session.json`. Traces de cada tentativa estão nos respectivos diretórios `results-*`; oJSON principal inclui seus hashes.
