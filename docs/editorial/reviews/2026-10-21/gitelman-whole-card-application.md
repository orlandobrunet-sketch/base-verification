# Aplicação do card integral de Gitelman

Esta alteração aplica exclusivamente o objeto `/wholeCard` do candidato A1, preservando seus 12 valores e a ordem. Os pareceres autoral e independente integrais aprovam essa versão exata: VERIFICADA / NENHUMA / LIBERADA. O original recebeu revisão maior; nenhum gate da questão foi transferido para o card.

Foram corrigidos `label`, `tipo`, `badge`, `impacto`, `resumo` e `conclusao`. A referência é identificada como consenso, com limites da evidência e da interpretação diagnóstica explícitos. A fonte principal é o [relatório KDIGO de2017](https://kdigo.org/wp-content/uploads/2017/02/KDIGO-Gitelman-conf-report.pdf); bibliografia, verificações e limites de acesso estão nos pareceres completos anexos.

## Identidade científica e histórico

- BEFORE canônico ordenado por chaves: `sha256:dc2ed96f52cab471d53e333a4ed0ae4ca237b611e315df84efbb02d10a3bfe6c`.
- AFTER canônico ordenado por chaves: `sha256:aa02ffc07c33a7bf4b2aeb21c7c32839a9215e67dbd549ee5ff314b656ec361f`.
- AFTER JSON compacto na ordem original: `65950e77ed553f0478e5a39d1deed9226f89684722d4da662a80a6c9542cb24c`.
- Os três JSONs anexos são cópias integrais dos arquivos congelados da revisão. Seus metadados locais e flags de criação foram preservados como proveniência histórica; não descrevem o estado operacional posterior desta aplicação. Os caminhos locais ali registrados não são resolvidos pela CI.
- O validador compara os bytes dos relatórios, seus apontadores de versão/gate, cobertura dos12campos, hashes e literal independente com o card aplicado. Não executa o JavaScript do registro de referências.

## Consumidores e saves

Os consumidores atuais são `1e2668d6`, `81740f2d` e `940b2835`. A questão `b933be69`, que motivou a investigação documental, ainda usa `kdigo_ckd` e `brenner_rector` no banco vigente. Ela não foi vinculada silenciosamente ao card nem alterada nesta entrega.

`data/topics.js` permanece intacto. Nos três consumidores, `authorRevision` e os quatro `sourceRevisions` permanecem iguais. A nova referência modifica apenas a identidade de referência/registro. Os três registros anteriores completos, com as fontes dos quatro perfis, referências antigas e release16.19, são acrescentados ao histórico:13→16entradas. Saves com binding anterior continuam históricos; fontes sem binding cuja identidade é ambígua exigem decisão explícita, sem promoção automática à versão atual.

Não há nova aprovação clínica das três questões nem promoção de elegibilidade editorial de outros itens. A alteração do badge para CONSENSUS usa a regra de raridade já existente, cujo fallback é Comum; nenhuma regra visual ou de recompensa foi alterada aqui.

## Validação e envio

O modo explícito `reference_only` permite declarar este caso sem inventar uma questão alterada. Ele exige topics idêntico, conjunto exato de cards atualizados, mesmos consumidores completos e os dois pareceres próprios aprovados da versão integral. O comportamento anterior dos lotes de questões permanece coberto por seus testes.

Os testes específicos verificam o literal aprovado, consumidores, restauração histórica nos quatro perfis e leitura do texto completo no popup. A suíte de identidade existente também é exercitada. O diff deve receber conferência técnica independente antes do commit; os resultados executados são relatados na PR draft.

O candidato técnico é16.20, incluindo Service Worker, releases Sentry e URLs dos dois arquivos de identidade alterados. O redesenho do popup pertence a outra branch e não integra este lote. Este envio não inclui merge nem publicação em produção.
