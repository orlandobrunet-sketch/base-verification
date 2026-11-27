# Continuação editorial — candidata 17.25

Base publicada: `ca1184916b53cddfc7581df17ed75ff3a029c14f` (17.24). O usuário reabriu expressamente a parte médica em 15/11/2026. Esta autorização não substitui a revisão formal dos objetos exatos.

## Escopo liberado

| Itens | Objetivo do reparo | Versão final | Parecer independente |
|---|---|---|---|
| `a4c85d32`, `3fa2737c`, `e94a6488`, `d9257155`, `21a99f07`, `e2aae4c7` | Alternativas, suficiência do caso, segurança e referência adequada | [sodium-candidates-A4.json](sodium-candidates-A4.json) | [candidate-independent-review-A4.json](candidate-independent-review-A4.json) |
| `1a93346d`, `516ec2a6` | Interpretação dos resultados ocular e renal do SUSTAIN-6 | [sustain6-candidates-A1.json](sustain6-candidates-A1.json) | [sustain6-independent-A1.json](sustain6-independent-A1.json) |
| `sustain6` | Correção do estudo vinculado e revisão integral do card | Mesmo arquivo SUSTAIN-A1 | Mesmo parecer SUSTAIN independente |
| `hyponatremia_verbalis2013` | Novo card do consenso que sustenta três questões | Mesmo arquivo sodium-A4 | Mesmo parecer sodium independente, cobertura dos 12 campos |

Os oito itens e os dois cards receberam **aprovada / VERIFICADA / NENHUMA / LIBERADA** para as versões indicadas. Os candidatos autorais continuam marcados como rascunhos; o [pacote de vínculos](independent-gate-bundle-1725.json) aponta exclusivamente aos pareceres independentes e seus hashes. Score de questão não é aplicado a cards. A1–A3 de sódio são registros de versões superadas, sem autorização para aplicação. A revisão independente exigiu corrigir dificuldade, representação da natureza da fonte e precisão do critério renal.

Preservam-se os oito QIDs, conceitos centrais e agendamentos FSRS. A única alteração de dificuldade é `a4c85d32`: hard→medium. Gabaritos e posições continuam iguais. Não há reset de progresso. Antes da troca, o plano conserva os oito objetos realmente publicados em 17.24 com quatro apresentações, referências integrais e vínculos históricos. As 169 versões já arquivadas também são preservadas; previsão: 177 registros e 708 vínculos históricos.

## Limites e pendências

- O [inventário](inventory.json) é mecânico, não avaliação médica de 741 questões. O problema global de pistas por tamanho continua aberto; não se exige que todos os comprimentos sejam idênticos.
- A [avaliação de duplicidade](duplicate-vaptans-review.json) recomenda fundir `4c7d3db3` em `cfeef8e1`, que também exige reparo. Ambos permanecem BLOQUEADOS nesta revisão; nenhuma fusão, exclusão ou migração foi aplicada.
- URLs iguais não autorizam fusão de referências. O [inventário bibliográfico](reference-metadata.json) distingue versões de diretrizes, análises secundárias e estudos diferentes. O card LEADER permanece separado.
- As intermitências históricas 96/97/98, 191, 193, 226 e 279 sem demonstração causal exclusiva continuam abertas. Este lote médico não constitui reparo desses eventos.
- As fontes e limitações de acesso estão nos pareceres. A cópia primária do SUSTAIN-6 foi lida independentemente na Swansea; o consenso de 2013 e a diretriz de 2014, em cópias integrais identificadas. Um rascunho da ESE de 2026 não foi tratado como diretriz final.

## Validação e publicação

O plano de integração exige versões e gates pinados, confere os 733 autores e 370 cards fora do escopo, mantém o histórico e valida 2.964 apresentações. O teste de regressão novo foi executado antes da integração: cinco contratos anteriores passaram e os dois novos reprovaram pela ausência esperada da nova coorte. Isso é contraprova de histórico, não erro de produção.

Testes após aplicação, revisão do diff, versão/cache 17.25 no mesmo commit, PR, CI, publicação Pages e conferência do domínio são etapas próprias. Seus resultados devem ser registrados no recibo de fechamento; esta documentação de preparação não afirma que foram concluídos.
