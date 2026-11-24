# Reconciliação do backlog médico/editorial — ponto de partida 17.27

Leitura do commit 34d9d6ccc674c5210eaed6578dd88161ec9ad1a3, com 741 questões e 373 cards. Nenhuma escrita no repositório. Este mapa concilia rastreabilidade e prioridades; somente o pacote autoral separado dos vaptanos contém nova revisão clínica.

## Prioridade proposta

| Ordem | Questões/grupo | Situação concreta | Próxima ação e condição |
|---|---|---|---|
| 1 | cfeef8e1 + 4c7d3db3 | Dois originais ainda exatamente iguais à revisão formal bloqueada de 15/11. Correta do destinatário 2,540 vezes o maior distrator; duplicidade nas quatro dimensões. | Revisar independentemente vaptan-author-A1.json: reparar destinatário no mesmo OP/qid e consolidar parceiro somente após o gate. Banco 740 é aceito; nenhum novo OP para preservar contagem. |
| 2 | ebac9c20; 3ecb266a; c94c8d2d; 2be4ea1f; a12cb84d; cf42455e; 760901ee | Sinais graves de extensão, ainda atuais; não são automaticamente defeitos clínicos nem itens aprovados. | Lote autoral pequeno por OP, fontes primárias atuais, revisão independente dos literais/card. Inventário mecânico completo cabe à outra frente. |
| 3 | 13e53210 + 5906012f — finerenona | Hold formal: redirecionar/fundir; maior razão estrutural é 13e=5,000. Não são encurtamentos simples autorizados. | Resolver identidade/OP e disposição próprias. Se mudar decisão central, seguir criação e novo qid, não reaproveitar liberação antiga. |
| 4 | 061c9bcb + 1e6a4479 — anemia; 21e9cefb + 22189222 — MBD | Holds formais antigos ainda registrados, com evidência/pêndencia incompatíveis em parte dos eixos. | Reabrir formalmente as disposições e eixos antes de qualquer transformação. VERIFICADA+DECISIVA não pode gerar LIBERADA. |
| 5 | 5530b59c — tratamento geral da IgAN | Revisão maior; correção isolada do card Moeller não aprovou a questão. | Refazer versão de questão pertinente e revisar de forma independente; preservar versão histórica do card antes de modificar consumidor externo. |
| 6 | e8040054 + e1f9ccd1 — peritonite fúngica DP | Apenas triagem; não existe nesse registro autorização formal de fusão ou retirada. | Revisão formal de quatro dimensões antes de decidir se variações legítimas ou duplicata. |
| 7 | f77abde0,994ee93c,fe3a5b91,bd45bf21 — dose de HD | Quatro originais suspensos, sem candidatos liberados. | Autoria e revisão científica completas; não contar como revisados/aplicados. |
| 8 | c18e6af7/856f45a6 — sparsentana;17c980fc/aa732568/9fea5862/03397c91/9dd26bf4 — agentes IgAN | Sete originais suspensos; aa732568 aparece entre os maiores sinais de comprimento. | Atualizar evidência primária por agente, sem converter manchetes ou resumo de congresso em certeza de conduta. |
| 9 | 68 AFTERs históricos com BEFORE atual ainda exato | Triagem estrutural encontrou original inalterado + AFTER exato de fila + dois gates antigos + sem hold daquele índice. | Somente candidatos a reconciliar: conferir todas as referências de 12campos, vigência e eventual revisão posterior antes de reuso. Não são 68 permissões atuais. |

## Propostas históricas que merecem conferência primeiro

A ordem abaixo usa correta/maior distrator, sem alegar desempenho psicométrico. Ausência de ID faltante não confirma os 12campos do card. Todos os caminhos e hashes atuais/antigos estão no JSON de reconciliação.

| qid | Título atual | Razão | IDs do AFTER ausentes hoje | Relatório autoral antigo |
|---|---|---:|---|---|
| e4ef7329 | Vancomicina na CRRT — Dose Individualizada | 1.954 | nenhum ID | group-a-output-011-A5.json |
| 6a54b25c | Tiazídicos na DRC — PA e Potássio | 1.927 | click_chlorthalidone_2021 | group-a-output-008-A4.json |
| 5189c79f | Tratamento de Longo Prazo da Hipercalcemia Maligna | 1.736 | nenhum ID | group-a-output-011-A5.json |
| 3d81f74d | LRA Crítica — HEMODIAFE, SLED e CRRT | 1.667 | nenhum ID | group-a-output-011-A5.json |
| 85e1d082 | ATR Tipo 1 vs Tipo 2 — pH Urinário | 1.663 | nenhum ID | group-a-output-010-A4.json |
| 0ffc255a | Peritonite Bacteriana Espontânea | 1.636 | bsg_basl_ascites_2021 | group-a-output-015-A3.json |
| 81740f2d | Síndrome de Gitelman — Tetania e Hipomagnesemia | 1.587 | nenhum ID | group-a-output-007-A3.json |
| 86ad6fc4 | Hipermagnesemia Grave: Manifestações Clínicas | 1.556 | nenhum ID | group-a-output-001.json |
| ed78156f | Hemodiálise — Alcalemia Pós-Diálise e Bicarbonato | 1.537 | abramowitz_bicarbonate_dialysis_2017 | group-a-output-014-A3.json |
| 646b9077 | Bioimpedância — Ângulo de Fase na Hemodiálise | 1.496 | nenhum ID | group-a-output-003-A2.json |
| 69018bb9 | Hipercalemia: Diurético de Alça e Caliurese | 1.475 | nenhum ID | group-a-output-007-A3.json |
| f3d5015d | Hipercalemia Crônica em Uso de Bloqueio do SRAA | 1.472 | nenhum ID | group-a-output-008-A4.json |

## O que já mudou desde a seleção 17.25

Dos 12 itens da seleção de 15/11, somente cfeef8e1 e 4c7d3db3 conservam o objeto autoral canônico original. Nove já têm nova redação em 17.25/17.26; o TTKG 6474ec20 foi retirado/reposto por b515e1c7 em 17.27. Repetir a seleção antiga sem conciliar esses hashes reabriria trabalho já feito ou aplicaria a outra versão.

## Cobertura e liberação não são sinônimos

O índice portátil no repositório é o snapshot A20 de 12/10: 448 revisados, 293 não revisados, 362 liberações independentes correspondentes; não é o artefato completo A37 mencionado na continuidade. Busca dirigida não localizou esse A37; isso não prova inexistência fora dos locais examinados. A37 com 741 disposições não representa741 aprovações.

Comparando os 741 qids do snapshot antigo com o banco atual: 567 mantêm BEFORE; 165 diferem de BEFORE e AFTER; 8 coincidem com AFTER; 1 não existe mais (TTKG 6474ec20). O novo b515e1c7 não fazia parte da fila antiga. BEFORE usa SHA256 de JSON.stringify preservando ordem; AFTER usa canonicalização do builder. Não intercambiar os dois hashes.

## Originais congelados versus atuais

| qid | Hash bruto atual coincide com original congelado? | Fonte |
|---|---|---|
| 061c9bcb | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/../2026-11-13-answer-length-bias/anemia-independent-gates-A2.json |
| 1e6a4479 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/../2026-11-13-answer-length-bias/anemia-independent-gates-A2.json |
| 13e53210 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/../2026-11-13-answer-length-bias/finerenone-independent-gates-A4.json |
| 5906012f | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/../2026-11-13-answer-length-bias/finerenone-independent-gates-A4.json |
| 21e9cefb | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/../2026-11-13-answer-length-bias/mbd-independent-gates-A4.json |
| 22189222 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/../2026-11-13-answer-length-bias/mbd-independent-gates-A4.json |
| 5530b59c | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-treatment-general-independent-gates-A2.json |
| f77abde0 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/hd-dose-original-4.json |
| 994ee93c | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/hd-dose-original-4.json |
| fe3a5b91 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/hd-dose-original-4.json |
| bd45bf21 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/hd-dose-original-4.json |
| c18e6af7 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-sparsentan-original.json |
| 856f45a6 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-sparsentan-original.json |
| 17c980fc | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-targeted-agents-original.json |
| aa732568 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-targeted-agents-original.json |
| 9fea5862 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-targeted-agents-original.json |
| 03397c91 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-targeted-agents-original.json |
| 9dd26bf4 | sim | docs/editorial/reviews/2026-11-13-answer-length-bias-continuation/igan-targeted-agents-original.json |

A suspensão “não iniciar novos grupos nesta continuação” era um limite do fechamento anterior, não um bloqueio da autorização atual do usuário. Mesmo com a nova autorização, candidatos inéditos não herdam gates antigos.

## Artefatos desta frente

- backlog-reconciliation.json: todos os 741 vínculos do snapshot, 68 candidatos de reuso e grupos de pendências com hashes atuais.
- frozen-original-bindings.json: conferência exata de originais suspensos/holds.
- vaptan-author-A1.json e .md: candidato completo, card único de 12campos, fontes primárias e disposição do par para revisão independente.

Nenhuma alteração em data/topics.js, data/refs.js, ARTICLES, banco ou dados de usuários foi feita nesta frente.
