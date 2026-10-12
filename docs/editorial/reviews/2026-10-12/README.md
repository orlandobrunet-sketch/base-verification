# Checkpoint da revisão de questões

Este checkpoint reúne 33 relatórios portáteis e propostas exatas. Foram revisadas **144/741 questões principais**; 597 ainda não têm parecer autoral fechado. Há 120 propostas autorais LIBERADA, 24 BLOQUEADA e 57 questões com parecer independente, das quais 53 têm proposta liberada e AFTER exato conferido. **Nenhuma questão ou card foi aplicado ao banco.**

O banco de origem é `25f44e4449e770314c94f9a59256dfc2e1ab4d17`, preservado no merge técnico publicado `135899077669af6dcf564717833227828ba03fe5` da 16.09. A candidata 16.10 ainda está em validação. A revisão completa e a correção do viés de comprimento permanecem em andamento.

`index.json` registra nomes, tamanhos, hashes e cobertura. `queue.json` atribui as 741 questões a grupos e lotes, priorizando as 611 cuja correta é exclusivamente a mais longa. O campo `formalGate` aponta para a proposta AFTER; quando o parecer distingue original e proposta, o gate original fica em `originalFormalGate`. Itens bloqueados sem AFTER implementável são identificados explicitamente. V/F, formatos numéricos e cartões precisam de revisão própria.

Os 23 relatórios do checkpoint publicado anterior permanecem byte a byte. Os dez novos relatórios foram selecionados por nomes e hashes congelados, sem drafts ativos. A exportação conferiu igualdade profunda de 243 objetos BEFORE/AFTER de questões e cards. Caminhos privados e identificadores transitórios foram omitidos; textos clínicos, URLs primárias e hashes foram conservados. Os hashes portáteis usam os bytes UTF-8/LF, preservados pela `.gitattributes`; o hash de origem distingue o arquivo local do exportado.

LIBERADA pertence à versão exata avaliada. Antes de aplicar, conferir o BEFORE contra o banco corrente, a aprovação formal e todos os cards ligados à proposta. Substituições compartilhadas exigem reconciliação de consumidores: UKKA tem 20 consumidores atuais; Saha, 2; BPROAD, 7. A005 mantém o card IMWG antigo e C006 propõe outra versão; mudar esse vínculo exige reavaliação formal. Pareceres de um lote ou card não aprovam questões externas por associação.

Fusões propostas permanecem BLOQUEADA, com IDs e históricos conservados. Fontes decisivas inacessíveis, como o texto integral ISN/RPS2018, mantêm os respectivos itens bloqueados. A taxonomia de cards deve refletir honestamente o tipo de fonte. Toda alteração clínica material invalida a aprovação anterior, conforme `AGENTS.md` e `.claude/skills/revisar-nefroquest/SKILL.md`.

A integração depende também da compatibilidade dos registros salvos. A candidata conserva snapshots, escolhas, gabaritos, explicações e cards da versão respondida; a troca de uma questão pendente exige ação explícita e gravação confirmada. Testes focais locais passaram na campanha e no Exam; estudo/offline passaram nos 48 testes finais de storage. Navegador integrado e CI para o HEAD final ainda estão pendentes. Esses resultados técnicos não constituem aprovação clínica.

Para continuar, consultar o primeiro lote NOT_REVIEWED de cada grupo e os pareceres independentes pendentes. Inputs podem ser reconstruídos pelos qids/lotes da fila e pelos objetos de `data/topics.js`, conferindo commit e hash. BEFOREs e propostas BLOQUEADA são evidência de revisão e não devem ser introduzidos no produto.
