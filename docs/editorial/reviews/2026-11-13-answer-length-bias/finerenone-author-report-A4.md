# Finerenona: proposta autoral A4, ainda bloqueada

O pacote contém oito reescritas, uma questão integralmente preservada e duas retidas. Não emite veredito de revisão nem autorização de publicação. Nenhum objeto foi escrito no aplicativo.

Versão exata: `finerenone-candidates-A4.json`, SHA256 `ee0d19543321bbc37cfb8802cb9bced525301c8bd081221c5805bdf19e2c5cc5`. A1 foi preservada; A2 reconcilia classificação com a leitura cega independente anterior. O conteúdo correto não foi abreviado por retirada de qualificadores de segurança. A justificativa saiu das alternativas para explicações quando não necessária à decisão. Os novos distratores representam confusões de classe, limiares, posição terapêutica ou validade de inferência.

## Classificação e identidade

| qid | OP preservado | Bloom / dificuldade final proposta | Alteração e critério |
|---|---|---|---|
|3d8fc3fe|Identificar a classe farmacológica|Lembrar / fácil|Alternativas de classes paralelas, retirando o distrator incoerente “diurético de alça poupador de potássio”. A vinheta não transforma reconhecimento em aplicação. Referência passa à bula, que sustenta mecanismo diretamente.|
|86949ab7|Aplicar seleção do FIDELIO ao K+5,2|Aplicar / média|Objeto original mantido integralmente: já distingue entrada do ensaio de limite regulatório; não demanda alteração pelo comprimento.|
|f9976e40|Adiar início por hipercalemia e reavaliar|Aplicar / média|Não retira o dado decisivo; explicação mantém K+>5, TFGe<25, dose10mg para25–<60, diferença entre início e continuidade. Distratores são condutas de prescrição concorrentes.|
|d7ac22f6|Reconhecer adição cardiorrenal e vigilância de potássio|Compreender / média|Nenhuma indicação nova. Benefício, população, bloqueio do SRAA e segurança continuam explícitos.|
|65fcdeae|Precauções farmacológicas no transplantado|Analisar / difícil|Preserva avaliação de segurança, não vira recomendação de indicar o fármaco. Retira FIDELIO como suporte do transplante; usa bula e a pequena coorte específica. Explicação não presume interação PK tacrolimo→finerenona.|
|b86f4e37|Interpretar achado principal e limites do CONFIDENCE|Compreender / média|Desfecho albuminúria180dias, não diálise/mortalidade nem equivalência com introdução sequencial.|
|13e53210|Recordar18%|Retida / redirecionar proposto|Trivia numérica. Cortar IC da opção não corrige validade. Não transformar em interpretação de HR sob a identidade atual. Original não alterado.|
|e3f0e529|Identificar seletividade receptorial e diferença farmacológica|Compreender / fácil|Bula§12.1/12.3 suporta mecanismo/PK; não usa FIDELIO como comparação direta com espironolactona nem promete superioridade clínica.|
|b81a3c8a|Reconhecer o desfecho primário FIGARO|Lembrar / fácil|Mantém altitude do comando. Distratores são desfechos de estudos concorrentes; explicação distingue composto renal secundário não significativo.|
|73030d16|Avaliar limites de pequena coorte selecionada|Avaliar / difícil|Mantém desenho, seleção de toleradores, comparação intragrupo versus entregrupos e denominadores. Não promete enxerto ou segurança por TFGe estável.|
|5906012f|Reconhecer classe e indicação|Retida / fundir proposto|Sobrepõe a3d8fc3fe em competência, conceito, raciocínio e contexto que não muda a resposta. “Principal indicação aprovada” é temporal e sem jurisdição: EUA9/2026 já inclui DRC/DM1 e IC/FEVE≥40%. Não remover nem alterar silenciosamente.|

As oito reescritas preservam qid, competência, conceito correto, índice do gabarito e identidade reconhecível. Mudança de dificuldade decorre do comando e das âncoras, nunca do comprimento. Não se altera motor adaptativo, votos ou calibração empírica.

## Fontes primárias lidas pelo autor

1. Bula DailyMed exata `fc726765-5d5a-4d6e-b037-b847bda9fb7c`, revisão9/2026: §1 (indicações), §2 (K/TFGe/doses/monitorização em DRC/DM), §5.1, §7.1, §12.1 e§12.3. Classe não esteroidal, seletividade, ausência de afinidade relevante por receptores androgênicos/progesterona, meia-vida2–3h, metabólitos inativos, CYP3A4, K+>5 e TFGe<25 conferidos diretamente. URL: https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=fc726765-5d5a-4d6e-b037-b847bda9fb7c
2. Resumos primários integrais FIDELIO(PMID33264825, DOI10.1056/NEJMoa2025845), FIGARO(PMID34449181, DOI10.1056/NEJMoa2110956), CONFIDENCE(PMID40470996, DOI10.1056/NEJMoa2410659) recuperados por EuropePMC core. Resposta SHA256 `b3a6e7833689e896bee1c40cc70e6de1fea531889a02af8a056cb58308fafaf7`. Métodos/desfechos/resultados/limites lidos; não se alega texto NEJM integral. O candidato não depende do número818 ausente do resumo CONFIDENCE.
3. Kahvecioglu2025, JClinMed14(23):8296, texto primário XML integral PMC12693042. Resposta SHA256 `1a29021e478ede6b6326d62a575bf72be562f4607601d039e9fa16e8974b688e`. Métodos, resultados e limitações lidos;39prescritos,15toleradores/15controles,4K>6interrupções, sem diferença de tacrolimo, sem prova de benefício no enxerto. URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC12693042/
4. O desenho FIDELIO foi confrontado pelo revisor independente no manuscrito primário; minha tentativa de endpoint XMLPMC6888890 retornou500. Não reivindico leitura integral por essa rota.86949ab7 permanece intacta até gate independente do run-in+triagem.

## Referências e pendências não mascaradas

`kdigo_diabetes_in_ckd_guideline` não será alterado neste pacote: o card herdado tem limiares indevidos de RAC≥300 para finerenona e uma regra de iSGLT2 que mistura populações. A referência é retirada de3d8 porque o OP é a classe, sustentada diretamente pela bula, não por conveniência para encobrir erro. A correção do card integral requer inventário de todos consumidores e gate próprio.

O card FIGARO herdado omite falência renal da descrição do composto secundário e apresenta HR0,87 sem IC95%0,76–1,01, podendo sugerir certeza indevida. O candidato não repete a inferência: descreve expressamente o intervalo incluindo ausência de efeito. Recomenda-se correção integral do card com versão própria e inventário. Isso não autoriza a questão ou o card automaticamente; cabe ao revisor classificar se há pendência decisiva.

As duas retenções são recomendações editoriais bloqueadas, sem exclusão, fusão ou novo qid implementado. Todas as nove questões potencialmente aprováveis também permanecem bloqueadas até revisão formal da versão exata A4 e seus vínculos de referência.


## Contraprova e versão final A4

A3 substituiu os distratores inadequados de65/e3, restringiu a frase de segurança CONFIDENCE aos três eventos verificados e expandiu as siglas nas versões reescritas.3d8pergunta diretamente a classe, sem vinheta decorativa, preservando oOP. A4alterou somente a opçãoD de e3 para uma afirmação de independência do citocromoP4503A4, refutada diretamente pela bula, sem comparar graus de dependência frente à espironolactona. A2eA3foram preservadas; não se herda gate. Os dois cardsC1do pacote separado também aguardam gate integral independente, com inventários completos. O relatório autoral não concede publicação.
