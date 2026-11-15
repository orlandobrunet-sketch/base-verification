# Hipercalemia — candidata 17.26

A autorização do proprietário de 15/11/2026 inclui a parte médica. Este lote aplica somente três versões exatas aprovadas na revisão formal: `ebea50d5`, `e0853fac` e `b35be598`. O card existente `ukka_hyperkalemia_2026` foi revisto integralmente e permanece inalterado.

O parecer efetivo é [independent-review-A1.json](independent-review-A1.json): cada questão tem Evidência VERIFICADA, Pendência NENHUMA, veredito aprovada e Publicação LIBERADA. O rascunho autoral e a classificação cega original são registros anteriores, sem autoridade para substituir esse parecer. Os literais e hashes aprovados vinculam o plano e os arquivos aplicados.

A base real é o merge publicado `33b203ddccc125c04b2c740c2316ae5c0ea362a0`, versão 17.25. O recibo operacional independente autoriza apenas os três outputs do plano `sha256:70ef3808fc6daab8af6e2d0b54067fe18d4fff039b1146d09249675ef37c6b34`. O recibo de aplicação registra a execução; o [parecer de transporte](application-independent-review-R2.md) confere os arquivos resultantes independentemente.

Foram preservados os 741 QIDs, ordem, categorias, gabaritos e agendamentos FSRS. Os 177 registros históricos publicados permanecem intactos; três versões anteriores da 17.25 acrescentam 12 vínculos, totalizando 180 registros e 720 vínculos históricos. As outras 738 questões e todas as 372 referências permanecem iguais. Duas dificuldades mudam conforme o parecer: SZC de hard para medium e morfologia do ECG de medium para easy.

A única mudança técnica é o preparo do teste 103 com o parâmetro Guest já existente. O [diagnóstico](forge103-diagnosis-A1.md) e o [parecer independente](forge103-independent-review-A1.json) sustentam esse alcance. Não houve alteração do produto ou do helper compartilhado, nem relaxamento de verificações, prazos ou repetições. A revisão dos seis arquivos de testes está em `tests-independent-review.json`.

`evidence-copies.json` registra a origem e o SHA-256 das cópias literais dos relatórios. A configuração de atributos preserva seus bytes. Relatórios de testes, traces, publicações e papéis científicos completos ficam fora deste diretório. Este pacote comprova a preparação e a aplicação, não afirma publicação da 17.26.

TTKG `6474ec20` e a disposição do par de vaptanos continuam retidos em revisão, sem alteração ou desativação no produto. A revisão global do banco, o viés de comprimento restante, as intermitências históricas e a validação em aparelhos físicos e serviços reais continuam abertos.
