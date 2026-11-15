# Recuperação e movimento — 17.22

Escopo técnico das superfícies 17, 26 e 27 do relatório de 35 páginas. Nenhuma alteração médica, de permissões, de pagamento ou das regras do jogo.

## Reparos

- **Julgamento Rápido:** o pulso de urgência pertence à pergunta ainda sem resposta. Ao acertar, errar ou esgotar o tempo, a correção fica disponível sem o relógio continuar pulsando. A pergunta seguinte pode voltar à urgência normalmente.
- **Oráculo e Diagnóstico:** uma falha ao guardar o contador local não deve substituir a resposta válida nem esconder uma recusa por limite do servidor. A indicação transitória deve conservar o isolamento entre contas e dias; o servidor continua decidindo a cota.
- **Reporte de questão:** prazo único de 30 segundos para sessão, envio e leitura da confirmação. Ao expirar, conserva comentário e categoria e libera nova tentativa explícita. O aviso informa que não foi possível confirmar; não afirma que o servidor deixou de receber. Resposta tardia não confirma o formulário antigo ou o reaberto. Não há reenvio automático.

## Validação e limites

As regressões usam questões técnicas e respostas controladas. Não enviam relatos reais nem consomem consultas de IA. Movimento normal é exigido no teste de urgência; os dois perfis são computador e celular emulado.

Validação local concluída antes do PR:

| Recorte | Aprovações sem retry/skip |
| --- | ---: |
| Urgência real e encerramento, spec 287 | 8 |
| Falha de armazenamento da cota, spec 288 | 12 |
| Prazo/rascunho/retorno do reporte, spec 289 | 10 |
| Regressões existentes de prazo e ciclo do Julgamento | 32 |
| Regressões existentes de continuidade e cota, specs 270/272 | 20 |
| Bateria Node completa dos oito grupos locais | 522 |

Os REDs foram preservados. A bateria Node inicial teve 11 falhas por ausência de `setProperty` no estilo do DOM simulado; somente o simulador foi atualizado, conservando todas as asserções e o runtime já aprovado no navegador. A bateria completa posterior passou 522/522. No teste adicional do orçamento acumulado, o relógio foi pausado antes do envio para medir exatamente 20.000 + 5.000 + 4.999 + 1 ms, sem avanço paralelo em tempo real; isso não alterou o prazo do produto. Tentativas iniciais sem acesso à prévia local não são prova de defeito do produto.

A revisão independente dos três reparos não encontrou impedimentos. Versão, Service Worker, cache-busters e manifesto técnico foram sincronizados no mesmo lote; o manifesto mudou somente seu metadado de release.

## Preparo do Confronto Final

A CI1088 registrou aprovações após repetição no cenário 33:66, nos dois perfis: o Portal interceptava a alternativa que estava visível e estável. Os dois casos do boss eram os únicos dessa spec que ainda preparavam um visitante sem registrar a entrada nativa antes do reload.

Somente duas linhas foram acrescentadas ao teste: `playAsGuest()` antes de `injectBossState`. Helper compartilhado, valores do boss, produto, prazos e asserções não mudaram. Dois REDs com resposta de autenticação nula entregue após a pergunta pronta passaram com a mesma fronteira e asserções após essa correção. Os 12 cenários originais também passaram sem retry/skip. Nessa reprodução controlada a tela principal ficou oculta; no registro oficial a alternativa permanecia estável sob o Portal. Esses instantes distintos não foram apresentados como capturas idênticas da ocorrência histórica.

As 82 aprovações locais anteriores e os 522 testes de lógica continuam associados à fonte inicial. Seus arquivos de produto, teste e helper permanecem idênticos após a alteração exclusiva da spec 33 e deste registro. Os 12 cenários originais da 33 são uma validação adicional própria. Uma nova CI deve conferir o HEAD final; a CI1088, com suas repetições, fica preservada.

As seis ocorrências históricas 96/97/191/193/226/279 permanecem sem causa exclusiva demonstrada. A triagem da 17.21 não encontrou nova reprodução; suas aprovações posteriores não encerram essas causas. O diagnóstico existente fica disponível para uma próxima ocorrência.

Ficam para um lote posterior: recuperação local da consulta administrativa após falha e investigação, com reprodução, do foco tardio de Oráculo/Diagnóstico e da consulta de sessão anterior ao prazo da confirmação de pagamento. Esses pontos não estão declarados corrigidos nesta etapa.

## Conferência posterior à CI1089

A CI1089 terminou com 15 grupos aprovados: 3.537 aprovações diretas, três após repetição e 268 pulos previstos em 3.808 casos; smoke 130. As repetições foram 98 móvel (End sem rolagem), 181 móvel (Portal interceptando o clique) e 288 móvel (espera de transporte). A CI1088 e esta rodada ficam preservadas, sem cancelamento ou reclassificação como inteiramente diretas.

- **181:** o SDK nulo entregue durante o preparo reproduziu a alternativa visível e estável sob o Portal. Somente o preparo foi alterado: visitante na seed comum e entrada nativa antes dos confrontos curtos. Quatro REDs controlados passaram com o mesmo SDK e asserções; os 28 casos originais passaram a 20 s, sem retry/skip. Valores, helper e testes de Portal/retomada permaneceram intactos.
- **288:** a trace oficial mostra resposta 200 seguida de `net::ERR_ABORTED`, enquanto o teste aguardava `Response.finished()`. A espera passou a observar a conclusão real do aplicativo: controles antigos reabilitados pelo `finally` do Oráculo e a promessa real cancelada do Diagnóstico. As asserções anteriores foram preservadas e receberam verificações adicionais de histórico/cache. Os 12 casos passaram em uma única rodada a 20 s, sem retry/skip. Não houve alteração de produto para essa falha.
- **98:** a trace mostra foco na região correta e End cerca de 6,4 ms depois, mas não registra o alvo efetivo nem o cancelamento da tecla. A região está ativa no registro final e o Portal coexiste no DOM; isso não demonstra interceptação. A causa permanece aberta. Um observador passivo de End/foco/rolagem, limitado a 48 eventos e sem medir layout no gesto, anexa dados somente após falha. Uma única falha deliberada externa após o End original passar comprovou dados reais; os oito originais passaram sem retry. Gesto, preparação, prazos e asserções permanecem iguais.

A auditoria dos helpers encontrou 171 chamadas sintáticas em 124 specs, incluindo usos autenticados, migração e reload. Não são 171 percursos nem 98 defeitos por haver 98 chamadas sem intenção no argumento. O default compartilhado foi conservado para não mascarar esses contratos.

Para o HEAD seguinte, há 70 cenários locais reaproveitados após identidade dos arquivos e 60 verificações novas: 12 da 288, 12 da 33, 28 da 181 e oito da 98. São 130 aprovações locais consideradas, não 130 reexecuções. Os 522 testes de lógica permanecem associados às fontes idênticas. As provas controladas e a falha deliberada dos diagnósticos são registros separados. Produto, helpers compartilhados, estilos e metadados permanecem idênticos à fonte inicial `6a4cdac08fff5cfdbd9b070206953d04ba09cc84`.

Publicação e contagens finais devem ser registradas após a CI do HEAD consolidado e a conferência da versão pública.
