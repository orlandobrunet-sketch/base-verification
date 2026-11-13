# NefroQuest 17.12 — integração local da continuação

Estado em 13/11/2026: os objetos do lote foram integrados localmente sobre a 17.11 publicada. Os testes locais descritos abaixo passaram; CI do HEAD final, integração Git, publicação e conferência pública da 17.12 ainda estão pendentes. Este registro não declara a 17.12 publicada.

## Base e escopo exatos

A base é o merge `e63cbb85fc20fd926f29e28c8132eb7bbaafba14` do [PR965](https://github.com/orlandobrunet-sketch/base-verification/pull/965), que publicou a UI 17.11 a partir do HEAD `d5d70b89537b366ed91d8cfc3ca1ebf3727a53c7`. Pages `43472577933` concluiu nesse merge; 17 hashes públicos corresponderam à revisão, oito percursos Guest e 14 cenários do host passaram. A CI1072 verde conserva um flaky da spec116, por interceptação do Portal antes do hover; não se apaga esse resultado nem a CI1071 RED anterior.

A [prova de integração](integration-17.12.json), em modo `apply`, registra 42 questões exatas e 12 operações de referências: sete atualizações integrais de cards, quatro adições e uma aposentadoria corrente. Os 107 objetos da entrega anterior, nove itens retidos/triados e os demais 699 objetos de questão permanecem intactos. O consumidor `5530b59c` recebe histórico exclusivamente pela mudança de seu card; sua questão não foi reescrita.

O pacote editorial de 136 documentos permanece selado. Seus hashes, os gates dos candidatos e o overlay delimitam os bytes autorizados; este documento novo registra a integração e não substitui nem reescreve os pareceres originais. A normalização de uma quebra de linha de referências está documentada em [refs-eol-technical-normalization-after136.json](refs-eol-technical-normalization-after136.json), sem alteração de objetos.

## Gates e aprovação operacional

Conforme os pareceres independentes das versões exatas, 39 questões estão VERIFICADA/NENHUMA/LIBERADA. As três `4decf9f9`, `9fadb7da` e `68091841` estão PARCIALMENTE VERIFICADA/NÃO DECISIVA/LIBERADA, com os limites de acesso declarados nos gates. Não se alega revisão integral das 741 questões nem leitura de fonte inacessível.

O [adendo operacional](retirement-operational-approval-e63cbb85fc20-17.12.json) vincula a aposentadoria de `kdigo_igan_2021` à base exata e63/17.11 e à entrega 17.12. Registra `retirementAuthorization: APROVADA`, `verdict: aposentar` e `publication: BLOQUEADA` para republicação do card antigo. O gate clínico original APROVADA_CONDICIONADA permanece intacto; a aprovação operacional não o converte em autorização para republicar o card.

A prova de condições tem SHA-256 `e491866eb05f10f5d4cb1bc9c502a15bb18a2470d0336dc9885dfe21915e466b`: candidato `ddb4938a` exato e liberado, zero consumidores correntes do card aposentado, card e consumidor preservados nos quatro perfis históricos, ausência de republicação da variante corrigida de 2021 e nenhuma exclusão de questão, FSRS ou avaliação. O adendo foi emitido para as saídas exatas simuladas; a prova de aplicação registra a integração local posterior. O pré-requisito de publicação/conferência da UI 17.11 foi atendido antes da aplicação.

A [contraprova operacional independente](bounded42-operational-independent-review-adpkd-e63cbb85fc20-17.12-R1.json) e a [confirmação independente da aplicação real](bounded42-applied-root-independent-receipt-adpkd-e63cbb85fc20-R1.json) acompanham o adendo com seus bytes originais. São evidências adicionais de integração, separadas dos 136 documentos selados e sem nova autoria clínica.

## Preservação do histórico

Os 126 registros anteriores e seus 504 bindings são preservados. São acrescentadas as versões realmente publicadas anteriores de 43 questões, com 172 bindings, totalizando 169 registros e 676 bindings nos quatro perfis. Os 43 são as 42 questões alteradas e `5530b59c`, cujo card foi alterado. As ambiguidades históricas não foram resolvidas por suposição. Questões, identidades, qids e registros de aprendizagem permanecem vinculados às apresentações correspondentes.

## Medição e limites

No subconjunto de 42 questões, a correta era única mais longa em 40 e passa a ser em 11. No banco inteiro de 741 questões, após as 149 reescritas acumuladas (107 anteriores mais 42), essa contagem passa de 598 na baseline original para 490. Portanto 598→490 é uma medição global de 741, não uma contagem dentro das 149 reescritas. A heurística de escolher a alternativa mais longa, dividindo empates igualmente, passa de 81,47% para 67,44% no banco inteiro. Esses números medem uma pista estrutural da redação; não medem aprendizagem ou desempenho dos jogadores. O viés global permanece aberto. [Proveniência das medições](measurement-provenance.json).

## Validação local e publicação pendente

Estão disponíveis os gates, a integridade do pacote e a prova de aplicação local na base publicada exata. As specs255/257 passaram 20/20 cenários (3,6 min); os contratos de catálogo/histórico da spec136 passaram 4/4 (45,1 s); o preview lendário da spec116 passou 2/2 (35,4 s). Foram computador e celular emulado, com um worker e zero retries. Os contratos Node de respostas passaram 114/114 (3,31 s). A spec116 usa a opção já existente `asGuest: true`, sem mudança no helper compartilhado, produto, asserções ou prazos. Seu resultado local não altera retrospectivamente o flaky publicado na CI1072.

Ainda precisam ser registrados: CI do HEAD final 17.12, commit/PR e merge, Pages e hashes públicos e conferência dos percursos publicados. Nenhum resultado de dry-run sobre outra base ou de teste da UI 17.11 é usado como prova de publicação da 17.12.

## Correção de preparação após a CI1073

A [CI1073](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/43476104388), no HEAD `c97045c1ca20d6d8f14b8ea0497d353bc1de4a03`, terminou com 13/15 jobs aprovados: 3.187 aprovações diretas, dez falhas finais, zero flaky e 265 skips, totalizando 3.462 casos. Foram cinco cenários em cada plataforma, nas specs 21 e 206. As sessões simuladas escolhiam as três/quatro primeiras questões por posição e gravavam somente seus IDs, pressupondo uma única versão atual. O segundo ID, `66b811c3`, passou a ter versões publicadas 17.11 e 17.12; a sessão não fornecia informação suficiente para escolher entre elas.

Os [anexos e a contraprova da spec 21](ci1073-shard4-fixture-proof.json) registram `ambiguous`, retomada recusada antes da tentativa de migração e raw/progresso intactos nas três tentativas. A [paridade dos objetos e motores](ci1073-shard4-study-fixture-proof.json) confirma que a lógica de Estudo e de revisão não mudou. Os [traces da spec 206](ci1073-shard4-trace-proof.json) mostram o alerta nativo com as duas revisões em menos de 35 ms após Enter, antes da expectativa de visibilidade: aumentar espera não resolveria a premissa inválida.

As duas specs agora usam IDs explícitos, sem histórico e com autores, referências e quatro fontes idênticos entre as bases. A spec 206 exige também a precondição conhecida/atual e quatro alternativas. Asserções originais de ordem, índice, teclado, visibilidade, contraste, progresso, falha de gravação e FSRS permanecem. Nenhum catálogo, banco, controlador ou helper global foi substituído. Os JSONs registram o momento de preparação independente; não são novos pareceres clínicos nem parte dos 136 documentos selados.

Antes da aplicação, os dez cenários falharam na reprodução local; após a mudança de preparação, os dez passaram sem retries (1,8 min). Ambas as rodadas locais usaram limite de 30 s; o comando da CI conserva seu limite de 20 s. A nova CI do HEAD corrigido ainda é necessária e não é substituída pelo resultado local. Os outros 14 contratos da spec 206 passaram separadamente em 2,8 min, sem retries e com limite explícito de 20 s, incluindo contraste, prioridade, teclado e texto a 200%. No conjunto das rodadas locais aprovadas, são 50 cenários de navegador e 114 contratos Node. A rodada RED original permanece preservada.
