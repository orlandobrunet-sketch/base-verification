# Lote cardiorrenal — triagem e registro de fontes

Data: 06/10/2026. Continuidade após o piloto autorizado/publicado na release 15.86 (PR 878). Modo: revisão em relatório; nenhuma alteração médica aplicada neste lote.

## Recorte de dez objetos

| Índice | Pergaminho | Revisão a realizar |
|---|---|---|
| 7 | MDRD Study | Desenho, resultado global versus subgrupos e distinção da publicação da equação |
| 8 | RALES - Espironolactona na IC | População, mortalidade e segurança do ensaio versus uso clínico fora dos critérios |
| 9 | RENAAL - Losartana na Nefropatia Diabética | Componentes do primário, efeito pressórico e coerência com outro card RENAAL |
| 12 | CANVAS - Canagliflozina | Primário cardiovascular, análise renal e segurança |
| 14 | DAPA-CKD | Primário cardiorrenal versus composto exclusivamente renal; reconciliar índice 22 |
| 15 | FIDELIO-DKD - Finerenona | População/comparador, segurança e afirmações sobre associação com SGLT2i |
| 16 | EMPA-KIDNEY | Elegibilidade, composto e limites da expressão universal |
| 21 | CREDENCE Trial | Elegibilidade exata, tratamento de base, composto e segurança |
| 22 | DAPA-CKD Trial | Mesma publicação do índice 14; preservar descoberta/indexação enquanto reconcilia conteúdo |
| 23 | FIDELIO-DKD Trial | Comparação alegada com espironolactona versus comparador real; reconciliar índice 15 |

A repetição de uma publicação não implica automaticamente veredito FUNDIR: verificar identidade pedagógica e uso no jogo antes de alterar índices. Não excluir artigos ou migrar progresso nesta etapa. RENAAL índice 40 e MDRD índice 43 são consumidores relacionados a conferir, mas não novos objetos autorizados para edição.

## Fontes primárias já recuperadas

Abstracts completos lidos pelo Europe PMC, consulta `EXT_ID:<PMID>`, `resultType=core`, em 06/10/2026. Isso verifica o conteúdo dos abstracts; detalhes fora deles exigem texto integral/suplementos. Abaixo são registros de triagem, não patches nem vereditos de publicação.

### DAPA-CKD — índices 14 e 22

Fonte: https://doi.org/10.1056/NEJMoa2024816 (PMID 32970396).

O HR 0,61 corresponde ao composto que inclui morte cardiovascular. O composto sem morte cardiovascular tem HR 0,56. Evitar rotular ambos como se fossem o mesmo desfecho renal. A mesma publicação aparece em dois cards com títulos diferentes; reconciliar a interpretação antes de decidir sobre redundância. Já conferidos no abstract: amostra, elegibilidade, dose, seguimento, efeito e NNT do primário. Segurança detalhada e claims de subgrupos requerem conferência adicional antes do patch.

### FIDELIO-DKD — índices 15 e 23

Fonte: https://doi.org/10.1056/NEJMoa2025845 (PMID 33264825).

O comparador randomizado foi placebo, com bloqueio do sistema renina–angiotensina de base. O estudo não é comparação direta com espironolactona. Não derivar do ensaio pivotal sozinho uma superioridade de segurança frente a outro antagonista mineralocorticoide. Para avaliar a alegação de associação com SGLT2i, examinar o ensaio integral e análise específica: https://pmc.ncbi.nlm.nih.gov/articles/PMC8720648/ (fonte localizada; ainda não conferida integralmente nesta etapa). Registrar separadamente amostra randomizada e população de análise.

### EMPA-KIDNEY — índice 16

Fonte: https://doi.org/10.1056/NEJMoa2204233 (PMID 36331190).

Elegibilidade diferenciada por TFGe: 20 a <45, ou 45 a <90 mL/min/1,73 m² com RAC ≥200 mg/g. O benefício na população elegível não autoriza tratar qualquer pessoa com DRC como população diretamente estudada. O composto primário inclui progressão renal e morte cardiovascular. Não transferir significância para todos os componentes ou para mortalidade total. Abstract conferido; subgrupos de albuminúria e publicações posteriores ainda precisam ser distinguidos.

## Próxima entrega e gates

Preparar dez objetos completos no padrão Concise Medical Summary, preservando schema, títulos, anos, raridades e índices. Aplicar revisar-nefroquest com registro de claims, Advogado do Recurso, limites, veredito e eixos Evidência/Pendência/Publicação por versão exata. Os cinco outros estudos acima ainda precisam de recuperação primária.

Nenhum texto deste lote possui patch final aprovado neste documento. Não usar este registro como liberação de publicação. Obter autorização explícita de aplicação após os pareceres e patches concretos, conforme AGENTS.md; o aceite do piloto não foi estendido silenciosamente a outros artigos.

## Evidência de publicação do piloto

PR: https://github.com/orlandobrunet-sketch/base-verification/pull/878. Merge: 538f5a26e975b6702c88abbb3508c6b736523a8d. Pages run 37530739957 concluído com sucesso. Produção conferida por SHA-256 contra os blobs do merge em version.json, sw.js, data/articles.js, index.html e jogar/index.html. Os 191 artigos foram carregados e as cinco correções correspondem ao commit. Testes locais: 5 testes do leitor aprovados, mais os 5 textos reais sem transbordamento a 320 px com texto 200%. Quality Gates remoto aprovado; smoke e suíte completa devem ser consultados no run 37530461220 (não foram declarados aprovados neste registro).

