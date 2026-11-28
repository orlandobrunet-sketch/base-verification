# Parecer autoral — alternativas de hemodiálise

Base 17.39, commit `1b59dc648b7cc224507a678bfad096ce4d6a7f8a`. Avaliação do conteúdo exato de [propostas-A1.json](propostas-A1.json). O parecer independente antecede a aplicação.

| Questão | Tema | Veredito da proposta | Gravidade máxima do original | Evidência | Pendência | Autorização editorial |
|---|---|---|---|---|---|---|
| `646b9077` | Ângulo de fase na hemodiálise | Aprovada | Menor | VERIFICADA | NENHUMA | LIBERADA |
| `6ded255a` | Interpretação do DIALIZE-Outcomes | Aprovada | Menor | VERIFICADA | NENHUMA | LIBERADA |

O equivalente legado para as duas propostas exatas é MANTER. A confiança autoral é alta. Os vereditos se aplicam ao texto exato conferido, com o card atual de cada questão. A avaliação segue os capítulos 4–10 e 12–19 do Handbook, as seções 3.2, 8 e 10–11 do Model e as seções C.1, C.2 e C.4–C.7 do Anexo C.

## 646b9077 — Ângulo de fase na hemodiálise

### Objetivo pedagógico

Interpretar o ângulo de fase da bioimpedância junto da avaliação nutricional e muscular em hemodiálise de manutenção. Competência primária de integração de marcadores de nutrição e função muscular. Bloom Analisar, Miller Sabe como, dificuldade intermediária. Ângulo de fase baixo, força de preensão reduzida e escore elevado de desnutrição-inflamação continuam sendo os dados decisivos do caso. Permanece o mesmo objetivo mensurado na 17.39.

### Justificativa e problemas encontrados

1. **Menor.** A correta do original tem 169 caracteres. As demais têm 102, 107 e 113. A ressalva e a especificidade aparecem concentradas no gabarito. Na proposta, os quatro textos têm de 78 a 82 caracteres, com 81 no gabarito.
2. **Menor.** Os distratores originais sobre filtração residual, água intracelular e suplementação enteral afastam a atenção da interpretação do marcador. Os novos distratores representam erros sobre diagnóstico isolado, ajuste pelo escore e substituição da medida de força.
3. **Menor.** A pergunta passa a identificar a coorte em que a interpretação prognóstica é avaliada. O objetivo continua sendo interpretar os achados do caso e os limites do marcador.

Beberashvili e colaboradores acompanharam 250 adultos em hemodiálise de manutenção por dois anos. Valores basais mais altos se associaram a maior força de preensão e menor risco de primeira hospitalização. A associação com mortalidade perdeu significância ao acrescentar o escore de desnutrição-inflamação ao modelo. O desenho observacional sustenta a leitura complementar do achado. Os dados decisivos estão no resumo primário estruturado. [Artigo original, PMID 24736681](https://pubmed.ncbi.nlm.nih.gov/24736681/) · [Registro da publicação com resumo](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A24736681&resultType=core&format=json)

A avaliação contextual da KDOQI trata bioimpedância, força de preensão e escore de desnutrição-inflamação em recomendações próprias. O item não atribui à KDOQI a conclusão específica da coorte nem transforma o resultado em indicação terapêutica. O card `phase_angle_hd_2014` já fornece a evidência que decide a questão. [KDOQI 2020, recomendações 1.1.1, 1.3.1 e 1.5.2](https://www.sciencedirect.com/science/article/abs/pii/S0272638620307265)

O item mantém o construto de interpretação clínica e funcional. Os quatro textos são interpretações do mesmo achado. A próxima ação implícita é avaliar nutrição e função com os demais dados do caso. O enunciado é suficiente para essa decisão e dispensa um ponto de corte adicional. A busca no banco ativo não encontrou outro item que reúna o mesmo perfil hemodialítico, ângulo de fase, preensão e escore para a mesma interpretação em português. Questões de avaliação volêmica ou de manejo nutricional exercitam decisões com dados distintos.

### Advogado do Recurso e eliminatórios

Nenhum argumento plausível de anulação no conteúdo exato da proposta.

- A usa o resultado como componente da avaliação. Isso corresponde à associação documentada e preserva a medida direta de força e os elementos clínicos.
- B trataria o valor isolado como diagnóstico. A coorte mediu relações com um escore já aplicado e com desfechos clínicos. Seu desenho não valida o uso diagnóstico isolado.
- C seria compatível com a associação bruta e alguns modelos anteriores ao ajuste. A pergunta indica a coorte e fornece o escore, e a modelagem final relatada no resumo retirou a significância dessa associação.
- D confunde medidas correlacionadas. Preensão e ângulo de fase foram medidas separadamente. A associação no estudo não valida substituir a medida direta da força.

Nenhum eliminatório disparado. Foram conferidos resposta única, suporte da referência, alinhamento ao objetivo, segurança, plausibilidade dos distratores, consequência clínica, coerência da explicação, suficiência dos dados, independência de protocolo local e vigência do achado histórico no recorte perguntado.

### Escore e decisão

| Dimensão | Pontos |
|---|---:|
| Alinhamento ao objetivo | 2 |
| Validade de conteúdo | 2 |
| Validade de construto | 2 |
| Qualidade do enunciado | 2 |
| Alternativas | 2 |
| Distratores | 2 |
| Explicação | 2 |
| Referências | 2 |
| Naturalidade | 1 |
| Valor pedagógico | 2 |
| **Total** | **19/20** |

A repetição de estruturas interpretativas limita a naturalidade do conjunto. Árvore §19, passo 0 com evidência verificada e pendência nenhuma. Passo 1 sem duplicidade nem eliminatórios. Passo 2 sem recurso plausível. Passo 3 com escore na faixa excelente. A autorização é derivada do §18.4. A versão candidata permanece em revisão operacional até o parecer independente.

### Patch editorial sugerido

O objeto exato está na chave `questions[0].candidate` de [propostas-A1.json](propostas-A1.json). Gabarito de autoria A. Na aplicação autorizada, atualizar somente `q`, `opts` e `exp`, manter o card atual `phase_angle_hd_2014` no vínculo e arquivar os quatro perfis da apresentação anterior. A continuidade do objetivo preserva o `qid` e o histórico de repetição espaçada.

## 6ded255a — DIALIZE-Outcomes

### Objetivo pedagógico

Interpretar a combinação de controle do potássio e desfecho cardiovascular primário no DIALIZE-Outcomes. Competência primária de avaliação de desfechos bioquímicos e clínicos em ensaio randomizado de hemodiálise. Bloom Analisar, Miller Sabe como, dificuldade avançada pela diferença entre superioridade sem demonstração e equivalência. A população, a intervenção, o comparador e o par de desfechos continuam definindo o objetivo.

### Justificativa e problemas encontrados

1. **Menor.** A correta do original tem 162 caracteres. As demais têm 92, 109 e 109. O gabarito se destaca pelo tamanho e por concentrar a ressalva do encerramento precoce. Na proposta, os quatro textos têm de 80 a 90 caracteres, com 80 no gabarito. A ressalva passa para a explicação.
2. **Menor.** Os distratores sobre dialisato sem potássio e redução pela metade de morte súbita facilitavam uma eliminação que pouco exigia do raciocínio. Os pares da proposta exigem interpretar o efeito bioquímico e o primário clínico.
3. **Menor.** A expressão original “não reduziu” passa a “sem redução demonstrada”. A precisão evita que o leitor interprete um intervalo compatível com benefício ou dano como demonstração de ausência de efeito.

O ensaio randomizou 2.690 adultos em hemodiálise de manutenção com hipercalemia pré-diálise. Aos 12 meses, a manutenção da normocalemia foi mais frequente com o fármaco. O primário combinou morte súbita cardíaca, acidente vascular cerebral e internação, intervenção ou ida à emergência por arritmia. As taxas publicadas foram 8,8% e 8,9%, com razão de riscos instantâneos de 0,98 e intervalo de confiança de 95% de 0,76 a 1,26. A baixa incidência de eventos e a alta descontinuação limitaram o ensaio, encerrado precocemente. A publicação resolve essas questões no resumo estruturado. A proposta não exige os pontos de corte de potássio nem denominadores específicos do desfecho secundário. [Artigo original, PMID 40618849](https://pubmed.ncbi.nlm.nih.gov/40618849/) · [Resumo estruturado da publicação](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A40618849&resultType=core&format=json) · [Resultados do NCT04847232](https://clinicaltrials.gov/study/NCT04847232?tab=results)

A resolução exige comparar dois tipos de desfecho. As opções B e C compartilham a interpretação bioquímica correta e mudam a inferência cardiovascular. A opção D conserva a incerteza cardiovascular e troca o resultado bioquímico. A pergunta tem rigor histórico e não depende de prescrição, dose, protocolo local ou subgrupo. A busca no banco ativo encontrou uma única questão cujo objetivo em português é interpretar este par de desfechos do DIALIZE-Outcomes em hemodiálise. Ensaios sobre outras intervenções e questões terapêuticas de hipercalemia usam dados ou decisões distintas.

### Advogado do Recurso e eliminatórios

Nenhum argumento plausível de anulação no conteúdo exato da proposta.

- A conserva a vantagem bioquímica e a ausência de superioridade demonstrada no primário. A interpretação é compatível com a incerteza da estimativa.
- B generaliza o efeito sobre o potássio para o composto clínico. A análise clínica tem intervalo que inclui 1.
- C pode atrair quem lê taxas próximas como equivalência. A comparação foi planejada para avaliar efeito de superioridade. As taxas observadas e o intervalo citado são insuficientes para demonstrar equivalência.
- D poderia parecer defensável se o leitor transposesse a ausência de diferença clínica para o potássio. A direção da diferença do desfecho secundário aos 12 meses está documentada na publicação.

Nenhum eliminatório disparado. Foram conferidos os mesmos dez critérios da revisão do ângulo de fase, incluindo a fronteira entre interpretação do ensaio e orientação de conduta.

### Escore e decisão

| Dimensão | Pontos |
|---|---:|
| Alinhamento ao objetivo | 2 |
| Validade de conteúdo | 2 |
| Validade de construto | 2 |
| Qualidade do enunciado | 2 |
| Alternativas | 2 |
| Distratores | 2 |
| Explicação | 2 |
| Referências | 2 |
| Naturalidade | 1 |
| Valor pedagógico | 2 |
| **Total** | **19/20** |

A repetição deliberada das estruturas nos pares reduz um ponto de naturalidade. Árvore §19 com evidência verificada e pendência nenhuma no passo 0, sem eliminatório ou duplicata no passo 1, sem recurso plausível no passo 2 e escore excelente no passo 3. A autorização é derivada do §18.4. A versão candidata permanece em revisão operacional até o parecer independente.

### Patch editorial sugerido

O objeto exato está na chave `questions[1].candidate` de [propostas-A1.json](propostas-A1.json). Gabarito de autoria A. Na aplicação autorizada, atualizar somente `q`, `opts` e `exp`, manter `dialize_outcomes_2025` no vínculo e arquivar os quatro perfis da apresentação anterior. A continuidade do objetivo preserva o `qid` e o histórico de repetição espaçada.
