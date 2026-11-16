# Preparação da 17.27 — recuperação da IA, entrada e TTKG

Checkpoint de preparação em 15/11/2026. A 17.27 está em revisão na PR976, ainda sem publicação neste registro. Base: 17.26, [PR975](https://github.com/orlandobrunet-sketch/base-verification/pull/975), fonte `bbcbaee6aa8298bd488aac70c76727ea99c3d6da` e merge `c6d1cd379ec73d6d3aa09b7e5e8276814d4d6dd7`. Branch de trabalho: `codex/recovery-editorial-1727`.

O usuário autorizou expressamente continuar a investigação da Aquaria, o TTKG e as melhorias do Oráculo, incluindo revisão médica. As liberações clínicas abaixo se aplicam somente aos literais revisados. Os resultados de produção da 17.26 não certificam esta candidata.

## Comportamento preparado

O Oráculo e o diagnóstico passam a ter um prazo total de 30 segundos, contado desde a autenticação até a leitura da resposta. Ao esgotar esse prazo, a interface libera uma tentativa manual e explica a demora. Não há reenvio automático nem promessa de devolução da cota: uma nova tentativa pode consumir outra consulta do limite diário para quem usa o plano gratuito. O aviso sobre limite diário aparece somente no plano gratuito. Quatro controles Premium e quatro regressões gratuitas passaram na fonte final.

Sair do Estudo ou substituir sua tela cancela o diagnóstico pendente, inclusive quando a obtenção do token ignora o cancelamento. O trabalho tardio verifica o cancelamento e o contexto antes de entregar resposta ou alterar a cota local. As provas usam fronteiras externas simuladas; não certificam prazo ou cobrança dos serviços reais.

O helper de entrada dos testes guarda a promessa no próprio documento e aguarda sua conclusão real. Não considera a ação concluída apenas porque o jogo ficou visível, não reinvoca a ação e conserva os erros reais. Em experimento controlado, o Chromium coletou uma promessa sem navegação e devolveu `Promise was collected`; o Playwright apresentou a mensagem genérica de contexto destruído. A retenção impediu esse mecanismo. Isso demonstra uma fragilidade possível da fronteira do teste, sem atribuir retrospectivamente a causa exclusiva da ocorrência 279/Aquaria na CI1098. O controlador de entrada do produto não foi alterado por esse reparo.

## TTKG: nova identidade e preservação do histórico

A nova questão `b515e1c7` trata da limitação fisiológica da correção por osmolalidade no TTKG (Gradiente Transtubular de Potássio). O objetivo pedagógico mudou em relação à interpretação do índice baixo do item anterior; por isso recebeu uma identidade nova. Foi acrescentado o card `kamel_halperin_urine_electrolytes_2021`, com seus 12 campos. A questão e o card foram aprovados formalmente, com Evidência VERIFICADA, Pendência NENHUMA e Autorização de publicação LIBERADA.

A autoridade clínica é o parecer independente do `/root`, `independent-review-A2.json`, SHA-256 `5a1a3ab01413010e433795d834376372ae56ce8c87e0ffe933d94169505a164a`. Ele libera exatamente dois objetos novos: a questão e o card. Não estende aprovação ao item antigo, ao card antigo de Brenner nem ao restante do banco. O pacote do autor permanece separado do parecer que o aprovou.

O item `6474ec20` é retirado apenas dos novos sorteios. Seu conteúdo real da 17.26, as quatro apresentações, o card associado e os vínculos de versão foram arquivados. A consulta da identidade antiga como atual retorna indisponível; a identidade nova só entra no lugar de uma pergunta salva pendente após confirmação explícita. Uma resposta já registrada continua ligada à versão respondida, sem recalcular sua avaliação. O save original é preservado na troca. Não há cópia de aprendizagem, reinício ou migração do FSRS antigo para o novo objetivo.

Campanha, Prova, Estudo e modo offline conservam essa distinção. A retirada de um item anterior na fila da campanha também desconta sua posição antes de restaurar o cursor, evitando pular a próxima questão elegível. Uma versão desconhecida ou ambígua continua exigindo conferência; a existência de um sucessor não resolve a ambiguidade automaticamente.

| Conferência dos dados | Resultado local |
| --- | --- |
| Questões atuais | 741; as outras 740 e seus índices preservados |
| Referências | 372 → 373; os 372 cards anteriores preservados |
| Histórico | 180 → 181; conteúdo e prefixo literal anteriores preservados |
| Vínculos históricos | 720 → 724 |
| Apresentações atuais, nos quatro modos | 2.964 |
| Dados de usuário escritos pelo integrador | Nenhum |

Os cinco arquivos de dados aplicados correspondem ao plano aprovado: `topics.js`, `refs.js`, histórico, manifesto e a nova política `question-replacements.json`. A conferência posterior do autor é uma **verificação de transporte**, não uma revisão clínica independente: `author-transport-check-A2.json`, SHA-256 `fd8d43293443d86e1b41ff4f757f2c1585f2e341bdeea3c2ee74e8135649327a`.

## Provas locais disponíveis neste checkpoint

Os grupos abaixo são registrados por execução e finalidade. Há sobreposição entre rodadas; seus números não formam um total de casos únicos.

| Grupo | Evidência disponível |
| --- | --- |
| Bateria de lógica | 559 aprovações, sem falha, cancelamento ou skip |
| Configuração dos testes de navegador | Nove aprovações; não substituem percursos no navegador |
| Contratos do helper de entrada | Três falhas reproduzidas e quatro controles aprovados antes do reparo; depois, sete contratos aprovados no computador; a versão permanente passou nos 14 controles de computador e celular emulado, sem repetição |
| Percursos originais de entrada 226/279 | Oito aprovações, em computador e celular emulado, sem repetição |
| Recuperação da IA | 34 casos focais aprovados; rodada posterior de 66 aprovações inclui esses 34 e mais 32 regressões, sem repetição ou skip |
| Retomada do item retirado no Estudo | Seis percursos focais e dois contratos de lógica aprovados; não somar automaticamente à bateria geral |
| Substituição nos quatro modos, spec303 | 28 aprovações na fonte final do runtime; duas aprovações focais adicionais após corrigir uma asserção redundante da fila, sem repetir os 28 |
| Texto da IA para Premium | Quatro controles Premium e quatro gratuitos aprovados, sem repetição; sobrepostos parcialmente à rodada anterior |

A primeira rodada completa da IA registrou 32 aprovações e duas falhas de preparo: atribuir `authUser` não emitia a notificação de troca de contexto que o teste pressupunha. O preparo passou a usar a saída nativa `NQPilot.release`, mantendo as asserções de cancelamento e conclusão; a falha e a fonte anteriores foram preservadas. As três correções de preparo da spec303 (campo eventId, backup após avançar e catálogo offline sem registry de cards) também não são contabilizadas como reparos de produto. Uma asserção redundante foi ajustada para conservar um sucessor que já estivesse legitimamente na fila; a igualdade exata da fila filtrada foi mantida e conferida nos dois perfis.

Na rodada de 66 casos da IA, todos registraram auditoria de erros de página, sem ocorrências. Há contadores de rede completos em 54 casos; os outros 12 têm guards de rede e auditoria de erros, sem inventar contadores. Não houve escrita externa inesperada nos casos medidos. Autenticação e IA reais foram isoladas. O prazo de 30 segundos foi exercitado com relógio controlado, sem uma espera real de 30 segundos por cenário.

As fontes de evidência são os recibos locais da 17.27: logs de lógica/configuração, `ENTRY_HANDSHAKE_REVIEW.json`, `implementation-summary.json`, os relatórios nativos de recuperação/retomada, o parecer clínico A2 e o recibo de transporte. O manifesto da entrega deve conservar os hashes dos arquivos efetivamente verificados, inclusive as tentativas iniciais; uma rodada anterior não certifica uma alteração posterior.

## CI1100 e correção de duas preparações anônimas

A CI1100 da fonte `dcc6fd6c8f2e95da9e905f03f4ccaa43e0556349` concluiu os 16 grupos com sucesso: 3.658 aprovações diretas, duas após repetição e 268 skips previstos, em 3.928 casos únicos. Não houve falha final. Todos os 14 ZIPs e os relatórios completos foram conferidos; os 80 casos novos desta etapa passaram diretamente. As duas intermitências foram preservadas, não apagadas pelo retry.

Na 187/Chromium e na 216/mobile, o Portal interceptou o clique antes das asserções da Forja e da progressão. Os controles reproduziram o retorno do Portal com uma sessão inicial null entregue tardiamente. A correção escolhe explicitamente o visitante nativo nas entradas anônimas: um argumento na 187 e sete na 216. Não altera runtime, helper compartilhado, mecânicas ou conteúdo médico. A entrega específica que ocorreu na CI não é distinguível retrospectivamente; a classe de preparo incompleto foi demonstrada.

Provas separadas: quatro RED causais, quatro GREEN e uma conferência nativa de recarga. Depois, os 34 testes originais passaram diretamente: seis da Forja com 20 s; 28 de progressão, sendo 24 com 20 s e quatro com os 45 s originais. As 85 asserções foram preservadas. Nove auditorias pertencem aos controles e seis à rodada nativa da Forja; os 28 originais de progressão não receberam contadores inventados. Uma execução da Forja foi interrompida pelo supervisor externo aos 100 s antes de gerar relatório completo e foi excluída das contagens; a execução integral seguinte manteve os prazos de cada teste.

A revisão independente `guest-preparation-independent-review.json`, SHA-256 `e7851133e0ecb31c9a0b7494b7ef3d73c03328441f1962402819bde835a8de08`, aprovou somente o escopo técnico desses argumentos, sem bloqueios. Os relatórios e hashes estão no pacote de revisão. Os novos argumentos exigem uma nova CI na fonte final; a CI1100 não a substitui.

## Condições de fechamento

- Percursos locais concluídos: 28 da spec303, dois focais de fila, 14 da spec304 e oito do ajuste Premium/gratuito, sem falha ou repetição nas rodadas finais.
- Integração e escopo conferidos; revisão técnica independente sem achado acionável. Dados, código, versão e cache seguem no mesmo commit.
- Executar a CI completa da candidata exata e separar aprovações diretas, repetições, skips e falhas finais.
- Integrar após as verificações, aguardar Pages no merge exato, comparar arquivos públicos e executar percursos nativos no domínio.
- Fechar os servidores de prévia e registrar o recibo de publicação com revisão, provas e limites.

CI completa, integração, Pages e validação pública da 17.27 estão **pendentes** neste checkpoint. A revisão médica global, o restante das pistas de comprimento e a disposição formal do par de mecanismo de vaptanos continuam abertos. A prova do helper não encerra as causas históricas sem atribuição exclusiva. Aparelhos físicos e contas, pagamentos ou outros serviços reais permanecem fora desta evidência.

## Fechamento da base 17.26

A 17.26 foi efetivamente publicada pela [PR975](https://github.com/orlandobrunet-sketch/base-verification/pull/975). CI1098 (`43758113299`): 16 grupos aprovados, 3.579 aprovações diretas, uma após repetição na 279, 268 skips previstos e nenhuma falha final em 3.848 casos; smoke 130. Pages `43761242796` aprovado no merge exato, oito arquivos públicos idênticos e 30 percursos nativos públicos aprovados, com 30 auditorias, sendo 15 em computador e 15 em celular emulado, sem repetição ou skip.

Recibo externo: `NQ_PUBLICATION_1726_RECEIPT.json`, SHA-256 `9b695e99f039ac5cf4748f81c758202d29ac6555a01054003ecbf53a5c9bbecf`. Os checkpoints antigos de candidata 17.26 descrevem sua preparação anterior a esse fechamento e não reabrem a publicação. Os resultados pertencem à base publicada, não à candidata 17.27.
