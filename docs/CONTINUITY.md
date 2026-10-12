# Continuidade do NefroQuest

A etapa atual é a revisão completa das 741 questões principais e a integração segura das propostas liberadas. A branch é `codex/clinical-review-2026-10-12`, criada sobre o merge publicado `135899077669af6dcf564717833227828ba03fe5` da 16.09. A candidata 16.10 ainda está em validação; consultar `version.json`, o HEAD e a CI correspondente antes de reutilizar qualquer resultado.

A 16.09 já foi publicada pelo [PR896](https://github.com/orlandobrunet-sketch/base-verification/pull/896), com a [CI930](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/38298483823) aprovada e o deploy Pages correspondente. Esse resultado encerra o embaralhamento técnico daquela versão. Ele não aprova mudanças posteriores nem conclui a revisão clínica.

Neste checkpoint, **168/741 questões foram revisadas e 573 seguem pendentes**. São 142 propostas autorais liberadas e 26 bloqueadas. Há 73 questões com parecer independente, das quais 65 têm proposta liberada e AFTER exato conferido. **Zero questões e zero cards foram aplicados.** A fila e os 39 relatórios portáteis estão em `docs/editorial/reviews/2026-10-12/`; `index.json` registra hashes e cobertura. Lotes em andamento não entram nessa contagem.

O banco `data/topics.js` permanece igual ao commit de origem `25f44e4449e770314c94f9a59256dfc2e1ab4d17` e ao merge 16.09. Seu SHA256 com LF é `83fb21eb7f79cf9da8d68f9901cf20fbec7b816492dfa8313d4ec25ebe8dd635`. O arquivo local CRLF tem SHA256 `56deb215d2da0ea0c212d1d121483423159652d2bea9e8f9521d160ac48054a5`; a diferença é apenas o fim de linha. O viés editorial de comprimento continua em revisão; diferenças naturais entre nomes de medicamentos não autorizam preencher alternativas artificialmente.

A candidata 16.10 acrescenta catálogo de revisões, bindings externos e histórico das versões. Uma resposta histórica mantém resultado, mapping, explicação e cards; o conteúdo atual aparece separadamente. Uma questão histórica pendente bloqueia a resposta até uma troca explícita para a versão atual. Retomar ou consultar não pode conceder crédito, reinterpretar escolhas ou regravar o registro original.

A campanha passou nos nove testes focais de histórico, troca pendente, recursos, ledger, forja, cloud inválido e rollback. Exam e collections passaram em 43 testes, incluindo compensação somente do próprio candidato após falha de readback; as 60 linhas de assertivas das fixtures foram preservadas. Estudo/offline passaram nos 48 testes finais de storage, incluindo readback, recusa e concorrência. Uma execução ampliada teve 254/258 PASS: as quatro falhas ocorreram ao criar repositórios Git temporários no sandbox e permanecem registradas. Navegador integrado e CI do HEAD final ainda estão pendentes.

Para conteúdo médico, seguir `AGENTS.md`, os documentos editoriais canônicos e `.claude/skills/revisar-nefroquest/SKILL.md`. Aplicar apenas AFTER e cards exatos com gate completo. Nenhum item BLOQUEADA pode entrar no banco. Mudanças materiais exigem nova revisão formal; aprovação não se transfere entre versões ou consumidores.

Substituições compartilhadas precisam reconciliar todos os consumidores: UKKA tem 20 consumidores atuais, Saha tem 2 e BPROAD tem 7. A005 mantém o IMWG antigo, enquanto C006 propõe outra versão; mudar esse vínculo exige reavaliação. Fusões preservam IDs/históricos e seguem bloqueadas. O texto integral ISN/RPS2018 inacessível é pendência decisiva dos itens correspondentes. Divergências de taxonomia devem ser resolvidas com tipos de fonte honestos.

Continuar lotes não revisados, pareceres independentes e reconciliação de cards, mantendo progresso em commits seguros. PDFs, capturas grandes, dados locais e segredos ficam fora do Git. Ativar hooks com `git config core.hooksPath .githooks`; mudanças de assets incluem `version.json`, `sw.js` e cache-busters coerentes no mesmo commit. Testes usam backend simulado e perfis temporários de navegador.

Recompensa vitalícia Hardcore com validação confiável no servidor, membros honorários e Meus troféus ficam depois das questões. Revisão parcial e testes focais não encerram esta etapa.

A proposta `0e1a838d` foi bloqueada independentemente por duplicidade, apesar da liberação autoral; não pode ser integrada isoladamente. O checkpoint conserva os dois pareceres e a divergência na fila. Sessões expiradas/concluídas foram verificadas em testes focais adicionais: o bundle novo preserva o raw e não concede crédito na consulta. A validação de navegador está em andamento; nenhum asset clínico foi aplicado.
