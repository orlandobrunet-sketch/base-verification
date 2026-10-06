# Conteúdo NefroQuest — inventário e sequência editorial

Data: 2026-10-06. Base: main 10e5996, versão 15.85. Natureza: inventário técnico e plano de revisão; não é veredito editorial nem autorização de publicação de conteúdo médico.

## Padrão confirmado pelo proprietário

Plugin pessoal **Concise Medical Summary**, ID `plugin_6319d75d33908191b708355440b615cf`, release `pluginrel_6ab7dd965e2c8191b7a12a1d52c04ee7`, versão 0.30.2+bundle.sum. Acesso direto ao link público falhou; os arquivos da release foram acessados pelo conector de plugins, com autorização do proprietário. Foi lida integralmente `skills/instructions/SKILL.md`.

Link: https://chatgpt.com/plugins/plugin_6319d75d33908191b708355440b615cf?open_in_app

Contrato para o campo resumo: um único parágrafo, nome do estudo/ano, n exato, resultado primário quantificado com medida adequada/IC/P quando reportados, comparação/intervenção/população/duração, segurança relevante e fonte original ao final. Não preencher dados ausentes; não copiar números dos exemplos sem verificar a publicação. Consistência de subgrupos não significa independência causal de comorbidades. Estudos negativos, desfechos substitutos e artigos retratados precisam preservar seu significado real; não forçar uma redução clínica positiva para atender ao formato. Os demais campos do pergaminho continuam separados no layout existente.

## Inventário reproduzível

Leitura das constantes `topics` e `nefroArticles` com Node VM, sem execução do jogo. Normalização de texto para comparação exata: NFKC, minúsculas e espaços compactados.

- 741 questões, 741 qids únicos, nenhum qid ausente e nenhuma questão sem referências declaradas.
- 741 enunciados distintos pela normalização acima. Isso não exclui duplicatas clínicas, que dependem de decisão, dados, erro-alvo e linguagem.
- Dificuldade declarada: 41 fáceis (5,5%), 342 médias (46,2%), 358 difíceis (48,3%). São classificações atuais, não dificuldade recalibrada por revisão.
- 191 pergaminhos, com 191 títulos distintos. Campos: titulo, autores, jornal, resumo, conclusao, curiosidade, ano, impacto e raridade.
- Mediana do campo resumo: 177 caracteres. É uma medida de extensão, não um veredito sobre qualidade.
- Não há campos próprios de DOI/URL nos objetos dos pergaminhos. Isso não implica ausência de referências: há autoria/periódico e a biblioteca `data/refs.js`, cuja correspondência precisa ser auditada.

| Categoria do banco | Questões |
|---|---:|
| dialise | 68 |
| hipertensao | 27 |
| nefropatia_diabetica | 21 |
| acido_base | 52 |
| drc | 89 |
| glomerular | 141 |
| transplante | 44 |
| litíase | 22 |
| eletrólitos | 90 |
| genetica | 37 |
| lra | 55 |
| oncologia_renal | 9 |
| nefrologia_geral | 24 |
| farmacologia | 29 |
| infeccao | 16 |
| uti | 17 |
| **Total** | **741** |

Para superar 1.000: pelo menos 260 adições líquidas aprovadas, chegando a 1.001. Exclusões ou fusões exigem aumentar o número bruto de novas questões. Contagem por categoria não comprova cobertura de competências; não distribuir cotas automaticamente pelos menores grupos.

## Primeira sequência proposta

1. **Consistência e segurança:** comparar pergaminhos com questões e referências já atualizadas. Prioridade: avacopan/ADVOCATE. Os qids `91355bed` e `ae0f4fef` e as referências `advocate_retraction_2026`/`fda_tavneos_nooh_2026` já registram a revisão de 2026; o pergaminho de índice 35 ainda conserva uma conclusão favorável antiga. Preservar as questões atualizadas.
2. **Piloto de cinco pergaminhos:** índices atuais 31 BPROAD, 32 TESTING, 35 Avacopan, 36 Sparsentan em GESF e IgAN, 37 Iptacopan. Conferir fontes originais, bibliografia, populações, resultados primários, segurança e limites. Seleção é triagem, não aprovação de patches. Identificar por título e índice para não deslocar descobertas/progresso.
3. **Aplicar o padrão confirmado:** elaborar os cinco textos em relatório, com registro de claims e verificação formal pela skill revisar-nefroquest. Manter layout, raridade e identidade dos cards. Separar resultados de publicações intermediárias e finais; separar DUPLEX e PROTECT em vez de misturar populações e conclusões.
4. **Escalar os 191:** lotes de 10–15 após o piloto, priorizados por risco de extrapolação, bibliografia inconsistente e informação desatualizada. Não presumir que todos os resumos precisam do mesmo tipo de correção.
5. **Mapear lacunas de perguntas:** inventariar objetivo pedagógico, decisão clínica, erro-alvo, Bloom/Miller e dificuldade pelas regras canônicas. Comparar cobertura real, duplicatas clínicas e relevância; manter IDs existentes.
6. **Expandir o banco:** primeiro lote de 20 novas questões pelas lacunas identificadas. Criação pela criar-nefroquest; revisão formal pela revisar-nefroquest; contar somente itens aprovados e publicados. Depois lotes de 20–30 até atingir mais de 1.000 questões válidas.

## Verificação já realizada e limites

A página primária da FDA foi aberta e lida em 06/10/2026. Informa proposta de retirada do Tavneos em 27/04/2026 por problemas na demonstração de eficácia e integridade dos dados; não descreve retirada definitiva automática e afirma que o medicamento permanece no mercado até decisão ou retirada do titular. O pergaminho não deve apresentar eliminação de corticoides como conclusão estabelecida: a própria FDA explicita que Tavneos não elimina seu uso.

Fonte: https://www.fda.gov/drugs/drug-alerts-and-statements/cder-proposes-withdraw-approval-tavneos

A nota NEJM `10.1056/NEJMe2608684` está registrada em `data/refs.js`, mas o texto não foi recuperado pela ferramenta nesta sessão. Registro interno não substitui verificação independente da nota. Recuperar a nota antes de concluir a revisão formal. As outras quatro fontes do piloto foram localizadas, porém a verificação integral ainda não foi concluída; não há patch liberado nesta etapa.

## Critérios de encerramento

Cada revisão deve cumprir Modelo de Conhecimento, Handbook e Anexo C, incluindo Advogado do Recurso, veredito e eixos Evidência/Pendência/Publicação. NQ Editorial Score de questões não deve ser inventado para pergaminhos sem alternativas/distratores; usar o precedente do relatório Fabry. Alteração material invalida liberação anterior.

O plano não altera `data/topics.js`, `data/articles.js`, `data/refs.js`, código ou versão. Autorização genérica de continuar o layout não substitui a autorização explícita para aplicar alterações médicas exigida em AGENTS.md. Preparar primeiro os patches concretos e sua revisão; só então obter a autorização que ainda faltar. Publicação de assets exige bump de SW/version no mesmo commit.

Referências operacionais: `docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md`, `NQ_EDITORIAL_HANDBOOK_v1.md`, `annex-c-nefrologia.md` e `review-batches/fabry-pergaminho-2001-2026-10-02.md`.

## Avanço em 06/10/2026

- Piloto: cinco pergaminhos publicados na 15.86 (PR #878), sob o padrão confirmado do plugin pessoal.
- Leitor: quebra de DOIs longos publicada na 15.87 (PR #879), validada em 320 px com texto a 200%.
- Cardiorrenal: dez objetos aprovados e aplicação/publicação explicitamente autorizadas pelo proprietário; versão de aplicação 15.88. Ver [parecer](CARDIORRENAL-2026-10-06-parecer.md) e patch exato. Mantidos 191 registros e todos os índices; nenhuma fusão ou alteração de questões.
- Próxima revisão: conferir os consumidores relacionados de RENAAL (40) e MDRD (43), sem assumir que compartilham aprovação ou redação dos cards já revisados. Depois, selecionar o próximo lote de 10–15 pelo risco e pela qualidade das fontes. Revisão em relatório precede qualquer aplicação.
- Expansão: permanece em planejamento; 741 questões atuais e pelo menos 260 adições líquidas aprovadas para superar 1.000. Não gerar ou publicar questões automaticamente a partir da contagem.

## Cards relacionados — revisão concluída

RENAAL (40) e MDRD (43): [parecer formal](RELACIONADOS-2026-10-06-parecer.md) e dois objetos completos preparados. O MDRD de 1999 é desenvolvimento/validação de equação, não o ensaio de intervenção de 1994. Os patches receberam aprovação, Evidência VERIFICADA, Pendência NENHUMA e Publicação editorial LIBERADA. Aplicação ainda depende de autorização explícita destes dois objetos; nenhuma fusão ou mudança de progresso proposta. Leitura validada em desktop/celular com texto ampliado.

## Publicação e próximo lote — 06/10/2026

RENAAL (40) e MDRD (43) foram aplicados e publicados na versão 15.89, PR #881. Os arquivos publicados foram conferidos contra o commit de publicação; os cinco testes do leitor passaram. Mantidos 191 pergaminhos e 741 questões.

O próximo lote reúne onze pergaminhos: captopril (6), DAPA-HF (13), FIGARO-DKD (24), SHARP (26), SPRINT (27), ONTARGET (28), FLOW (30), NOSTONE (33), NefIgArd (38), IDNT (41) e MICRO-HOPE (42). Ver [parecer e validação](TERAPEUTICA-2026-10-06-parecer.md). Os objetos propostos receberam aprovação editorial, Evidência VERIFICADA, Pendência NENHUMA e Publicação editorial LIBERADA. Foram preparados e testados, mas não aplicados. A revisão automática de autorização bloqueou a aplicação por considerar que a continuidade autorizava os dois cards anteriores, sem cobertura clara destes onze. Aguardar autorização explícita do proprietário para aplicar e publicar o patch exato; manter versão e cache juntos no mesmo commit de aplicação.

## Aplicação autorizada da proposta #882 — 06/10/2026

O proprietário autorizou explicitamente aplicar e publicar os onze textos exatos da #882 e continuar o plano com autonomia, preservando os gates editoriais. O patch aprovado foi aplicado no branch sem mudança material; release preparada 15.90. A autorização supera a pendência operacional registrada na seção anterior. Conferência do CI e produção ainda pendentes; não considerar publicado até sua conclusão. Os 191 pergaminhos e 741 questões foram preservados, sem fusão de registros ou expansão do banco.
