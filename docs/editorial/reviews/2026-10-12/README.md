# Checkpoint da revisão de questões

Estes arquivos são pareceres e propostas exatas, separados do conteúdo usado pelo jogador. A release técnica 16.08 não aplica alterações a `data/topics.js` ou `data/refs.js`. O banco de origem é o commit `25f44e4449e770314c94f9a59256dfc2e1ab4d17`.

`queue.json` atribui todas as 741 questões principais a grupos e lotes, com prioridade para as 611 cuja correta é exclusivamente a mais longa. Cada entrada distingue questão ainda não revisada, parecer do autor e eventual parecer independente. `index.json` contém cobertura real, nomes, tamanhos e hashes dos relatórios portáveis. V/F e formatos numéricos ou de cartas ainda precisam de revisão própria; esses formatos não recebem aprovação por associação.

Os relatórios conservam as propostas clínicas, os três eixos do gate editorial e as fontes primárias. A exportação confere que os objetos BEFORE/AFTER de questões e cards permanecem idênticos aos pareceres locais. Caminhos privados e identificadores transitórios do navegador foram omitidos; hashes da evidência local permanecem quando disponíveis. Os textos BEFORE e propostas BLOQUEADA servem à revisão e não devem ser introduzidos no produto.

Os hashes dos arquivos portáveis usam os bytes UTF-8/LF do Git. A `.gitattributes` desta pasta preserva LF também em clones Windows; o hash do relatório local de origem é distinto do hash do arquivo exportado.

LIBERADA identifica a proposta exata avaliada, e não uma autorização geral do banco ou uma confirmação de integração. Consulte as qualificações de cada parecer: há cards novos que exigem registro atômico, divergências de taxonomia BULA/NEWS/EXPERIMENTAL e itens cujo acesso à fonte decisiva ficou pendente. Uma alteração material exige novo parecer. A remoção do viés de comprimento permanece em andamento; o embaralhamento técnico não resolve essa pendência editorial.

Antes de integrar qualquer mudança clínica, resolver a compatibilidade entre a revisão do texto e os snapshots salvos da 16.08. O restaurador exige a mesma revisão autoral: alterar enunciado, opções, explicação ou referências pode invalidar um snapshot. Planejar e testar a migração ou preservação da versão histórica sem reinterpretar a escolha, duplicar recursos ou perder a revisão de erros. Depois, aplicar somente propostas e cards com gate completo da versão exata, conferindo o BEFORE contra o banco corrente.

Para retomar, consultar o primeiro lote NOT_REVIEWED de cada grupo em `queue.json`, carregar `AGENTS.md` e a skill `revisar-nefroquest` disponível no checkout, e reconferir fontes que possam ter mudado. Os inputs locais mencionados pelos pareceres podem ser reconstruídos com os qids do grupo/lote na fila e os objetos autorais de `data/topics.js`, conferindo o commit e o hash de origem; os inputs completos não foram duplicados aqui. Os pareceres independentes não substituem a verificação do estado real do banco e dos cards antes da aplicação.
