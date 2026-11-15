# Validação local 303/304 — 17.27 candidata

- 303 R4: 28/28 PASS, 14 desktop + 14 móvel, 60 s/caso, um worker, zero retry/skip/runner error. Foram lidos os 28 anexos reais; errors/nonGET/sockets vazios ou zero, Guest verdadeiro.
- 303 adendo final da fila: 2/2 PASS, um por perfil, mesmos 60 s/R0, dois anexos reais limpos. A igualdade exata da fila permaneceu; a asserção adicional passou a conservar a quantidade de NEW já existente, em vez de exigir ausência quando o sorteio inicial poderia legitimamente conter NEW. R4 e fonte final estão pinadas separadamente; não se afirma uma rodada de 28 para os bytes finais dessa asserção.
- 304 integral: 14/14 PASS, sete por perfil, 20 s/caso, um worker, zero retry/skip/runner error. Quatorze anexos semânticos realmente lidos. O teste bloqueia métodos/origens/WS, mas não mede contadores de tentativa: estes anexos não são chamados de auditorias de rede.

A 303 confere o snapshot publicado 17.26 de 6474ec20 e a identidade distinta b515e1c7, os quatro perfis do catálogo, respostas históricas/notas/cards integrais, FSRS/mastery raw, troca explícita, backups originais, fila futura e isolamento do piloto pendente. Só as sementes de save são técnicas; banco, referências, catálogo e controladores permanecem reais. Os nativos foram executados depois dos reparos: os RED/GREEN de produto pertencem às provas Node/Estudo separadas.

As rodadas R1/R2/R3 foram preservadas: campo anulável ausente na semente, expectativa do cursor anterior incorreta e expectativa de registry atual de cards inexistente no Offline. Nenhuma foi apresentada como RED de produto. O Offline mantém o card histórico completo e o binding atual pinado, sem carregar a UI/registry atual de cards.

A 304 demonstra um mecanismo controlado de Promise coletada sem navegação e a preservação do contrato pelo helper. O controle bruto produz erro de protocolo deliberadamente; navegação real e rejeição JS também são controles de rejeição. Isso não identifica o gatilho histórico exclusivo da CI279. A rodada anterior dos oito 226/279 não foi repetida nem somada a esta.

Prévia própria 5522/PID29664 encerrada após identidade exata; processo ausente e listener zero. A primeira checagem recusou encerrar por conversão automática de DateTime no PowerShell7; o recibo da recusa ficou preservado, e a data textual exata foi conferida antes do fechamento por PowerShell5. Não houve encerramento de processo alheio. Sem teste público, serviço real, conta real, commit ou deploy nesta rodada.

## Pins

- OBJECTIVE_REPLACEMENT_NATIVE_REVIEW.json: `35ab825ba15a620b9c25d8c01e9bf1b8cd34d704d320bd482fafc4f51908fa5a`
- ENTRY_COMPLETION_BOTH_PROFILES_REVIEW.json: `0f910e3fd8395acb54410736198318aa8d651679098def986c23f54da00b8ffc`
- R4 raw: `07ba439a020b089a319ee1a04273b19c4c14bed64b262256af1c574bb055b1b5`
- Fila final raw: `cbf4f2921cf135066ac0deba12f8df9314be8a5ff036f06d4af9bd533a759d21`
- 304 raw: `e5d31a651cf9989d999c5c4c0ad596faad4154c87571e2898da3c0acd3c54f98`
- 303 final: `4b18928750999416e704dfeca14b866f7a333724262d278087f7bc673e0f88e5`
- 304 fonte: `6330bce649b96efc2b557ab24f181022d00e88539261cdb6f000805be88b4e94`
- helper game.ts: `20cb81107b3426d3b68e738ed0ede2888bc934c3089433beb6a52ed5793fabe2`
- server-closed.json: `807f3973a0848f738ab125acd8dd32cb70f54d0482568a3c3b8cb8acb499dee5`
