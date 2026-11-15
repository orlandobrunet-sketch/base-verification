# Integrador 17.26 — reparo R2

R1 preservada no SHA 641223cc629810030bb912cc41f85889e39b20fc28ca37030d6f5fed5d83c637. A nova R2 tem SHA 3b86f0fd27f3e525e6df615bc76d99beae22c6e35c4b77782603de82d0b1b45f.

Somente duas linhas diferem: linha 6 atualiza o nome do comando de uso; linha 130 ancora a origem inteira e permite apenas o repositório github.com/orlandobrunet-sketch/base-verification nas formas HTTPS, SSH SCP e ssh://git@github.com/, com .git opcional. Domínios semelhantes, credenciais embutidas, caminhos locais, outros transportes, portas e sufixos são recusados.

A mesma bateria produziu 22 aprovações/14 falhas na R1 e 36 aprovações/0 falhas na R2. Os testes executam a assertion privada real, não uma expressão copiada no teste. Os quatro percursos sem recibo continuaram AWAITING_PUBLISHED_17_25_BASE, planProduced:false e dataWritten:false; hashes dos arquivos-base ficaram intactos. Sintaxe conferida. Logs RED/GREEN e hashes estão em integration-R2-review.json.

Os demais blocos são idênticos e conservam: três arquivos de escrita; refs.js intacto; três gates de questão e um card existente exatos; TTKG 6474ec20 retida; 177→180 históricos; 708+12 vínculos; 2964 apresentações e nenhum reset FSRS. A revisão paralela somente de leitura não encontrou outro bloqueio material.

Continuam necessários o recibo real da publicação 17.25, o merge-base publicado, verificação de origin/main e produção e posterior recibo operacional exato. Não executei prepare com recibo de publicação nem --apply, não criei recibo e não produzi hashes de saída futuros. Nenhum gate clínico foi adaptado à ferramenta. A recuperação continua síncrona e compensatória, sem garantia contra encerramento abrupto.
