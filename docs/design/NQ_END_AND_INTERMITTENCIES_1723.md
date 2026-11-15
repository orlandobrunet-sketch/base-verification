# End e intermitências — candidata 17.23

**NÃO PUBLICADA.** Registro local de 15/11/2026, a partir da 17.22 publicada (`6246a0b3f0e8f07a80c1a13a3df6f740baa772e6`). Integração, CI e conferência pública aguardam o coordenador. Conteúdo médico, respostas e regras de progressão não foram alterados neste recorte.

## Dois defeitos comprovados

**End após ampliar o texto.** Sob movimento reduzido, a duração global de transição de `0.01ms` também criava uma microtransição no `font-size` do HTML. Escrever `32px` ainda devolvia `16px` computados na mesma tarefa: o leitor cabia naquele instante, End rolava o documento e o overflow do leitor só surgia depois. Nos dois REDs nativos, a tecla chegou ao leitor focado, com o documento ativo e sem `preventDefault`.

O reparo em `style.css` troca somente essa duração global por `0s`. Não acrescenta espera, handler de End ou mudança de preparo aos testes antigos. `animation-duration`, movimento normal e o override mais específico do Átrio continuam fora da alteração. A leitura dos três consumidores de `transitionend` não encontrou dependência exclusiva desse evento: Câmara, baús e convites também têm observadores e outros caminhos de entrega.

**Foco atrasado da Câmara.** Os callbacks de 30 ms do próximo botão e do campo numérico podiam tirar o foco de Preferências recém-abertas; o listener real de `focusin` fechava o popup. Os dois guards em `js/minigame-acidbase.js` conservam binding e nó conectado e agora só recuperam foco do prompt do ato ou de `body`/`html`. Uma escolha posterior de controle ou leitura é respeitada. Prazos e handlers dos atos foram preservados.

## Provas locais, sem somar rodadas diferentes

| End | Resultado e alcance |
| --- | --- |
| R1, fronteira Auth | 6 controles PASS; hipótese de Portal não reproduziu End. |
| R2, fronteira de layout | 2 RED no poll nativo de chefe/capítulo e 4 PASS. O atordoamento fresco já tinha dois frames antes da tecla e não cobriu a janela antecipada. |
| R3, prontidão | Preparada, nunca executada. |
| R4, resposta CSS controlada | Apenas a duração `0s`, sem espera antes de End: 3 PASS; fonte computada pronta, leitores rolados e documento no topo. |
| Nova spec 290, antes do reparo | 6 RED determinísticos na fonte ainda computada em `16px`, antes de End. |
| Matriz final | **32/32 PASS = 6 novos + 26 originais 96/97/98 intactos**. 20 s/caso, um worker, zero retry/skip. Só os seis novos têm auditorias instrumentadas: seis anexos reais, sem erro de página, não GET ou WebSocket. |

| Câmara | Resultado e alcance |
| --- | --- |
| `chamber-focus-r1` | 4 falhas de preparo: o clock tentou um instante passado antes da resposta. Não são REDs do produto. |
| `chamber-focus-r2` | 2 RED causais do próximo botão e 2 controles PASS. |
| `chamber-numeric-focus-r1` | 2 RED causais do campo numérico e 2 controles PASS. |
| `chamber-focus-green` | Os mesmos oito contratos causais: 8 PASS. |
| Nova spec 291 | **20/20 PASS**, 20 s/caso, um worker, zero retry/skip; 20 auditorias reais limpas. |
| Conferência final do coordenador, após CSS e versão 17.23 | Os mesmos **20/20 PASS**, com 20 auditorias reais limpas; fonte da Câmara/291 preservada. Rodada distinta, não 40 casos novos. |

A 291 controla a fronteira de 30 ms com relógio simulado e usa ações nativas. Os leitores reais recebem `tabindex` somente na fixture técnica; isso não cria uma nova função de acessibilidade no produto. Recuperação normal, Preferências, leitura escolhida, saída, avanço e troca de ato estão cobertos. As rodadas causais anteriores não são adicionadas aos 20 finais.

## Captura de protocolo 226/279

O coletor opt-in em `tests/diagnostics/`, com controles em `tests/probes/`, seleciona os originais 226 móvel e 279 desktop/Glomerulus, sem mudar seus corpos, awaits ou helpers. Usa um worker, zero retry e 20 s/caso; não integra DEBUG global às doze shards.

- A rodada portátil **V1 passou 4/4**: dois controles técnicos e os dois originais. Capturou 278 metadados de 5.679 linhas DEBUG dos workers, inclusive dois erros CDP reais distintos (`-32000`: contexto destruído após reload e objeto remoto inválido sem navegação). As falhas históricas não reapareceram.
- A revisão encontrou dois defeitos sintéticos do coletor: IDs em formato de objeto podiam ser copiados e linhas comuns escapavam do limite. O TDD de robustez teve **21 contratos: 16 PASS + 5 RED**. O fechamento teve **22/22 Node PASS**, incluindo um contrato adicional de completude; não são os mesmos 22 casos de uma rodada RED.
- A revisão final encontrou uma lacuna de saída do launcher: término por sinal/código nulo, ou código zero com resultado contraditório, podia retornar sucesso. A etapa própria teve **26 contratos: 23 PASS + 3 RED**, depois **26/26 PASS**. O callback real foi exercitado com fronteiras Node controladas, sem filho/browser ou patch do Playwright. Código/sinal e status reais são preservados; código positivo de falha continua positivo. Os 22 anteriores permanecem um estágio separado, não um total a somar aos 26.
- A V2 aceita IDs numéricos seguros, transforma IDs opacos limitados em hashes e aplica orçamento combinado ao protocolo e às linhas comuns. IDs inválidos, perdas ou contadores ausentes tornam a captura `incomplete`.
- Os 278 metadados V1 passaram na nova projeção **offline**, sem IDs inválidos ou perdas. Os quatro browsers não foram repetidos após esse endurecimento: configuração, reporter, controles, originais e helpers permaneceram iguais. Reprojeção não é nova captura de navegador nem execução Linux.

O filtro atua antes de persistir tanto nos streams do launcher quanto nos eventos do reporter dos workers. Parâmetros, scripts, resultados e stderr bruto não entram nas projeções. **Limite aceito:** o Playwright pode criar por conta própria `artifacts/.../error-context.md`, com erro, snapshot e codeframe; o filtro não controla esse arquivo nativo. Somente estes seis arquivos podem ser enviados pela captura focal: `collector-summary.json`, `results-summary.json`, `protocol-metadata.jsonl`, `child-output-metadata.jsonl`, `worker-protocol-metadata.jsonl` e `worker-output-metadata.jsonl`. A pasta `artifacts` inteira fica fora do upload.

### Captura Linux da CI1094

No HEAD `85b53d47c4962bc65f77bc20d31679ed882fb232`, run `43729727169`, o job focal `132859523674` terminou reprovado: **quatro casos Linux passaram diretamente, sem retry**, mas o coletor saiu com código 70. O processo de testes retornou zero; somente o contador `malformedIdentifiers=3` tornou a captura incompleta. Os demais contadores de perda/parse ficaram em zero; os seis arquivos e os dois erros CDP dos controles foram preservados.

A fonte instalada do transporte usa `id=-9999` nas respostas de fechamento do browser. Três fechamentos reproduziram em Node o mesmo contador: **27 contratos, 26 PASS + 1 RED**, depois **27/27 PASS** com o reparo. Respostas de inteiro seguro sem request rastreado agora são ignoradas antes da validação dos IDs rastreados; objetos, frações, números inseguros e contextos inválidos continuam barrados. Um contador limitado dos ACKs reservados permitirá conferir essa fronteira na próxima captura. Como os três IDs rejeitados antigos foram omitidos, sua atribuição exclusiva ao fechamento continua sendo inferência, não fato recuperado do artefato. Nenhum browser, await, helper ou teste original foi alterado ou reexecutado por esse reparo. A CI1094 e seu resultado focal permanecem intactos; o resultado da CI completa não é deduzido deste job.

## Investigação de pilha da 193

| Controle externo | Resultado preservado |
| --- | --- |
| R1 | 1 PASS + 1 falha. Capturou uma tarefa técnica ocupada, mas não confirmou todos os comandos de cleanup no prazo. O recibo não distinguia rejeição de timeout nesses comandos. |
| R2 | 2 PASS, mudando a ordem de cleanup: `Runtime.disable` e `Debugger.disable` confirmados enquanto pausado; tarefas originais concluídas antes do detach. Exigia debugger habilitado antes da tarefa; o controle ocioso também mostrou frames da automação. |
| R3, attach após marcador | 2 falhas do contrato diagnóstico: `Debugger.enable` excedeu 500 ms durante a tarefa ocupada; o controle ocioso não emitiu `paused` em 800 ms. Tarefas e cleanup terminaram; nenhuma falha do produto foi deduzida. |

As três rodadas não capturaram o bloqueio histórico da 193. **Nenhum coletor de pilha foi integrado à 193, aos helpers ou ao runtime.** Pausar o debugger altera a execução; R2 não transforma R1/R3 em aprovações nem demonstra uma captura confiável somente após travamento.

## Inventário histórico e limites

- **96/97/98:** a corrida nova de layout está demonstrada, mas não foi atribuída retrospectivamente a todas as ocorrências. A janela antecipada da 98 histórica continua sem demonstração exclusiva.
- **191:** os dois registros históricos de correção fora da janela continuam sem atribuição exclusiva; os mecanismos anteriores de reflow não encerram esses eventos.
- **193:** evaluate bloqueado sem pilha do evento real; o defeito novo de foco da Câmara é separado.
- **226/279:** origem dos erros históricos de contexto continua desconhecida. Controles negativos e a mensagem genérica do Playwright não provam navegação, coleta de Promise ou causa comum. Nenhum vínculo causal com a 288 foi estabelecido.
- **181/288:** já têm atribuição e reparo de preparo publicados na 17.22: entrada nativa Guest contra o Portal e espera do handler real em vez de `Response.finished()` após transporte abortado. Não são reabertos aqui como defeitos atuais nem usados para explicar 226/279. Ver [fechamento da 17.22](NQ_RELEASE_1722.md) e [provas anteriores](NQ_RESILIENCE_1722.md).

Os perfis móveis são emulados. Não houve validação em telefone físico, conta, IA, pagamento ou serviço real. Capturas diagnósticas podem alterar timing. As quantidades de browser, Node e reprojeção são conjuntos distintos, sem total agregado de “testes novos”.

A bateria Node anterior do coordenador passou **548/548**, incluindo os 26 contratos do coletor. Após o ajuste diagnóstico da CI1094, uma nova bateria passou **549/549**, incluindo os 27 contratos: não são 549 mais 27 nem a reclassificação da rodada anterior. Esses resultados locais não substituem a CI do HEAD consolidado.

## Recibos e integração pendente

`ART` designa a pasta externa de evidências da sessão: `C:\Users\orlan\.codex\visualizations\2026\11\03\01a19f2d-0745-73d0-8277-eb5569ee888b`.

| Recibo em ART | SHA256 |
| --- | --- |
| `ux-1723-end/END_TEXT_ENLARGEMENT_1723_SUMMARY.json` | `6c083550bb6eed188d7c8c69e880778b6a5ffed6c4e112ee128259a02e7ba0fa` |
| `ux-1723-study/CHAMBER_DELAYED_FOCUS_SUMMARY.json` | `f98123ea8c36403c76d8d92e54b8eae9124b0607762438e8358984587d41f3a4` |
| `ux-1723-chamber-final-receipt.json` | `b4c9c9a891678e63685b700743023fccc2f793f2601df0ef5d422e8500b8b89b` |
| `ux-1723-context/PORTABLE_CONTEXT_COLLECTOR_SUMMARY_V2.json` | `9b017bb4971293e1611d202e37fe634b7ef585eeac319de16c7247180ce8ccb2` |
| `ux-1723-context/PORTABLE_CONTEXT_EXIT_SUMMARY.json` | `68a3d796e80f8e9bb2363229c110cf90555b553cbca35818adbdfea69e921b62` |
| `ux-1723-protocol-review/PROTOCOL_DIAGNOSTICS_INDEPENDENT_REVIEW_V2.json` | `273283a2e94fcf0ef65c7a1c56c14a09890f92dc97b09d833c9de2fec3dd9d49` |
| `ux-1723-study/BLOCKED_STACK_PROBE_SUMMARY.json` | `6afca9a35f9fb370f31e0e456d831316481ba02394ca1b6c6717881028bba01a` |
| `ux-1723-study/BLOCKED_STACK_ORDER_R2_SUMMARY.json` | `9ee1b18d86f3901e0bc30d1fbc37f95fb649265d0db3be6a5fea7d724792bd8f` |
| `ux-1723-study/POST_BLOCK_STACK_R3_SUMMARY.json` | `f02b3f6c8a2365360ba8c437ea956a4604be32aaf53d3ae58bb692ad857397bd` |

**CI/publicação: aguardando o coordenador.** Este documento não certifica uma CI da candidata, execução Linux do coletor, Pages, hashes públicos ou publicação da 17.23. O coordenador registrará o commit consolidado, os resultados reais da CI e a conferência pública após os respectivos gates; aprovações da 17.22 não substituem essa etapa.
