# Publicação 17.22 — fechamento técnico

Publicada e conferida em 15/11/2026, sem alteração de conteúdo médico.

- [PR971](https://github.com/orlandobrunet-sketch/base-verification/pull/971), fonte `78bce2e12cf2e6c9fc06fe29038fc47159903909`, merge `6246a0b3f0e8f07a80c1a13a3df6f740baa772e6` e árvore idêntica `e73d08c5ea027aeb9484bcc3b6d5a6e88a733250`.
- [CI1090](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/43718882266): 15 grupos aprovados, 3.540 aprovações diretas, 268 pulos previstos, nenhuma falha ou aprovação após repetição, em 3.808 casos. Smoke: 130 aprovações.
- [Pages](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/43721260172) aprovado no merge exato. Oito arquivos públicos idênticos à fonte aprovada.
- No domínio publicado: 22 percursos de Oráculo, Diagnóstico e reporte sem retry/skip, com 22 auditorias reais limpas. Não houve envio real de relatos ou consumo real de IA.

## Comportamento entregue

O reporte recupera a espera após 30 segundos, conserva o rascunho e exige nova tentativa explícita. Oráculo e Diagnóstico preservam as respostas válidas quando a gravação local da cota falha. O relógio do Julgamento deixa de pulsar durante a correção e volta à urgência na pergunta seguinte.

Os preparos anônimos comprovadamente incompletos das specs 33/181 passaram pela entrada nativa como visitante. A 288 passou a aguardar a conclusão real do handler, em vez de exigir término de um transporte que já podia estar abortado. A 98 recebeu somente observação passiva para uma próxima falha; a causa do End não foi declarada resolvida.

## Proveniência e limites

As 130 verificações locais consideradas são 70 reaproveitadas após identidade dos arquivos e 60 novas: 12 da 288, 12 da 33, 28 da 181 e oito da 98. Não são 130 reexecuções. Os 522 testes de lógica permanecem associados às fontes idênticas. As provas controladas e a falha deliberada dos diagnósticos são registros separados.

CI1088 permanece com duas aprovações após repetição; CI1089, com três. Nenhuma dessas execuções foi cancelada ou reclassificada como inteiramente direta. As causas 96/97/98/191/193/226/279 continuam abertas. Celulares foram emulados; aparelhos físicos, sincronização remota e serviços reais não foram exercitados. A memória de cota é transitória na página.

O recibo externo `NQ_PUBLICATION_1722_RECEIPT.json` tem SHA256 `7e0dc176ae2dc85c66312c6c5705ee6c4a5fafd4320de3fc7a5206c91a96095b`; o relatório externo tem SHA256 `c11989d816c94f9a3ba8baf87b3c6c5d76212afbe01e3c499f26cf203244cfc5`. A prévia própria da publicação foi encerrada. [Registro de preparação e provas locais](NQ_RESILIENCE_1722.md).
