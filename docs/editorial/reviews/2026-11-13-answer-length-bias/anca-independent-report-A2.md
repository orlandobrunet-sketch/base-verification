# ANCA: revisão independente da versão A2

12 reescritas exatas aprovadas e1objeto inalterado revisado; o problema global de comprimento continua aberto. A publicação depende também do card RAVE C1 exato aprovado.

|qid|Veredito|Evidência|Pendência|Score|Publicação|
|---|---|---|---|---|---|
|1fd6a5cf|aprovada|VERIFICADA|NENHUMA|19|LIBERADA|
|91355bed|aprovada|PARCIALMENTE VERIFICADA|NÃO DECISIVA|19|LIBERADA|
|4efef2a5|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|04cb2429|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|ddfb3df6|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|60efeb87|aprovada|VERIFICADA|NENHUMA|19|LIBERADA|
|2a595b23|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|cc9dc9d0|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|e5b44fbe|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|89af997c|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|ebd066db|aprovada|VERIFICADA|NENHUMA|20|LIBERADA|
|91cfbe6c|aprovada|VERIFICADA|NENHUMA|19|LIBERADA|
|ae0f4fef|aprovada|PARCIALMENTE VERIFICADA|NÃO DECISIVA|19|LIBERADA|

## 1fd6a5cf

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Interpretar o efeito de um regime combinado no RITUXVAS sem atribuir eficácia a rituximabe isolado. Competência:interpretação. Bloom:Analisar. Miller:Sabe como. Dificuldade:medium. Distingue intervenção combinada e atribuição causal, sem decisão individual de alto risco.

O contraste é atribuição causal de regime combinado, não dose decorada. O braço experimental inclui CYC e GC, de modo que não testa RTX isolado.

Advogado do Recurso:Testei se semelhança de remissão provaria equivalência formal ou segurança superior: não. O texto diz semelhante e não demonstra superioridade, sem confundir teste de diferença com equivalência. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:19/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score19/20;aprovação→LIBERADA.

Fontes específicas:RITUXVAS-2010; KDIGO-ANCA-2024. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:f675f316f604dec11e13211988005e4851e3db751cef1a7359efb99484c3e2b5. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "RITUXVAS — Indução na Vasculite ANCA Renal Grave",
  "qid": "1fd6a5cf",
  "q": "Na vasculite associada a anticorpos anticitoplasma de neutrófilos (ANCA), qual interpretação do RITUXVAS respeita o desenho do ensaio?",
  "refs": [
    "rituxvas_study",
    "kdigo_anca_2024"
  ],
  "opts": [
    "Os resultados correspondem a rituximabe com ciclofosfamida, e não a rituximabe isolado",
    "Os resultados demonstram eficácia de rituximabe sem ciclofosfamida na doença renal grave",
    "Os resultados demonstram superioridade do regime com rituximabe para remissão sustentada",
    "Os resultados comprovam menos eventos adversos graves precoces com o regime de rituximabe"
  ],
  "ans": 0,
  "exp": "O RITUXVAS incluiu 44 pacientes com vasculite ANCA recém-diagnosticada e envolvimento renal, muitos com disfunção grave. O braço experimental recebeu rituximabe 375 mg/m² semanal por quatro semanas, dois pulsos intravenosos de ciclofosfamida e glicocorticoide; o controle recebeu ciclofosfamida intravenosa seguida de azatioprina e glicocorticoide. Remissão sustentada em 12 meses foi semelhante, mas o estudo não mostrou superioridade nem economia clara de eventos adversos e não permite atribuir o resultado a rituximabe sem a ciclofosfamida concomitante.",
  "diff": "medium",
  "cat": "glomerular"
}
```


## 91355bed

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:PARCIALMENTE VERIFICADA;Pendência:NÃO DECISIVA;Publicação:LIBERADA.

OP:Interpretar retratação por problemas de integridade como perda da confiabilidade dos resultados sem inferir ineficácia universal ou conduta individual abrupta. Competência:interpretação. Bloom:Analisar. Miller:Sabe como. Dificuldade:medium. Distingue ausência de evidência confiável de evidência universal de ausência; princípio aplicável à segurança terapêutica, sem cálculo ou decisão individual complexa.

Retratação e manipulação pós-descegamento retiram confiabilidade, sem concluir ineficácia universal ou dar ordem individual de interromper. FDA é proposta histórica EUA explicitamente datada.

Advogado do Recurso:Testei preservar só não inferioridade: não restaura integridade. Mecanismo plausível também não valida dados. O caso não pede inferir status mundial atual. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:19/20. PARCIALMENTE VERIFICADA+NÃO DECISIVAválidos;semeliminatório;semrecurso;score19/20;aprovação→LIBERADA.

Fontes específicas:FDA-NOOH-April2026; NEJM-retraction-2026. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. Nota NEJM integral não acessível. Conteúdo decisivo retratação/data/integridade conferido independentemente em HealthCanada e documentoFDA íntegro; detalhe biográfico herdado nos cards sobre solicitação pelos autores não é pressuposto, gabarito ou segurança desta questão. Não alegar validação integral dos cards históricos.

Hash:4ab68e1b1ffa45699542522defbd062617cc8994832d822f9da68365720bbee8. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "ADVOCATE — Retratação e Validade da Evidência",
  "qid": "91355bed",
  "q": "O artigo ADVOCATE foi retratado em junho de 2026 após problemas de integridade dos desfechos. Como seus resultados de eficácia devem ser usados no ensino?",
  "refs": [
    "advocate_study",
    "advocate_retraction_2026",
    "fda_tavneos_nooh_2026"
  ],
  "opts": [
    "Não usar os resultados publicados como comprovação confiável de não inferioridade ou superioridade",
    "Preservar a conclusão de não inferioridade, descartando apenas a análise de superioridade",
    "Concluir ineficácia em qualquer paciente, independentemente de novas evidências",
    "Validar o ensaio pela coerência entre o mecanismo farmacológico e a doença"
  ],
  "ans": 0,
  "exp": "O artigo ADVOCATE foi retratado pelo NEJM em 29 de junho de 2026. A investigação identificou readjudicação dos desfechos primários de nove participantes após fechamento e descegamento do banco, sem divulgação no artigo. Esses resultados não devem ser ensinados como comprovação confiável de não inferioridade ou superioridade; omitir uma das análises não restaura a integridade do ensaio. Isso tampouco demonstra ineficácia universal, e plausibilidade farmacológica não valida dados comprometidos. Em 27 de abril de 2026, a FDA propôs retirar a aprovação nos Estados Unidos por considerar a eficácia não demonstrada e apontar informações materiais inexatas no dossiê. Essa notificação histórica é uma proposta referente aos Estados Unidos, não uma decisão final nem um resumo da situação em outras jurisdições.",
  "diff": "medium",
  "cat": "glomerular"
}
```


## 4efef2a5

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Conciliar resultado global do PEXIVAS e seleção individual de troca plasmática em risco extremo. Competência:conduta. Bloom:Avaliar. Miller:Sabe como. Dificuldade:hard. Integra evidência global, heterogeneidade de risco e benefício versus infecção.

Resultado global e decisão individual de alto risco são separados. Critérios KDIGO2024 corrigidos incluem Cr>3,4, diálise/elevação rápida e DAH com hipoxemia. Anti-MBG exige acrescentar troca.

Advogado do Recurso:Resultado global não autoriza alegar benefício nulo em cada dialítico, nem PLEX em toda hemorragia ou por título ANCA. Troca continua adicional à imunossupressão. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:PEXIVAS-2020; KDIGO-ANCA-2024. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:d8754b5c1666a29b56678d107f72a528c2f9e321f13f68960c51934985a88c43. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "PEXIVAS — Troca Plasmática sem Regra Absoluta",
  "qid": "4efef2a5",
  "q": "Como conciliar o resultado global do PEXIVAS com a orientação KDIGO 2024 sobre troca plasmática na vasculite associada a anticorpos anticitoplasma de neutrófilos (ANCA)?",
  "refs": [
    "pexivas_trial",
    "kdigo_anca_2024"
  ],
  "opts": [
    "Considerar a troca em situações selecionadas de alto risco, ponderando benefício e infecções",
    "Excluir a troca de qualquer paciente em diálise, pois o resultado global demonstra ausência de benefício",
    "Usar a troca rotineiramente em toda hemorragia alveolar, independentemente de hipoxemia",
    "Definir a indicação da troca pelo título de ANCA, que identifica quem terá benefício"
  ],
  "ans": 0,
  "exp": "No PEXIVAS, sete trocas plasmáticas não reduziram significativamente o composto de morte ou falência renal no conjunto de 704 pacientes com vasculite associada ao ANCA grave. O resultado não sustenta uso rotineiro, mas também não demonstra benefício nulo em todo paciente sob diálise ou de risco extremo. A KDIGO 2024 permite considerar troca quando a creatinina é maior que 3,4 mg/dL, há necessidade de diálise ou elevação rápida da creatinina, ou há hemorragia alveolar difusa com hipoxemia. Na sobreposição com doença por anticorpos antimembrana basal glomerular (anti-MBG), orienta acrescentar a troca. A decisão pondera possível benefício renal contra infecções; a troca é adicional à indução imunossupressora, e o título de ANCA não seleciona sozinho quem terá benefício.",
  "diff": "hard",
  "cat": "glomerular"
}
```


## 04cb2429

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Integrar sorologia ANCA ao fenótipo suspeito de EGPA sem usá-la para confirmar ou excluir isoladamente. Competência:diagnóstico. Bloom:Aplicar. Miller:Sabe como. Dificuldade:medium. Interpreta limitação de biomarcador no contexto sindrômico, sem requerer serotipo obrigatório.

Objeto original mantido: sorologia apoia fenótipo, não confirma nem exclui isoladamente EGPA.30–40% e predomínio MPO conferidos.

Advogado do Recurso:ANCA negativo não é argumento de exclusão; padrão p-ANCA isolado é menos específico. Sobreposição fenotípica é preservada. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:EGPA-guideline-2023. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:3c03b5ee8bf3fbe513892cff3ac3fe9c31b6d56a7592f5b566f886157b4c29a7. Implementação:Não reescrever: objeto integralmente igual já adequado; registra revisão formal.

```json
{
  "t": "EGPA — MPO-ANCA não é Obrigatório",
  "qid": "04cb2429",
  "q": "Como interpretar o ANCA na suspeita de granulomatose eosinofílica com poliangeíte (EGPA)?",
  "refs": [
    "egpa_guideline_2023"
  ],
  "opts": [
    "MPO-ANCA apoia um fenótipo compatível; ANCA negativo permite manter a suspeita clínica de EGPA.",
    "MPO-ANCA estabelece EGPA por sua especificidade, mesmo sem asma, eosinofilia ou lesão de órgãos.",
    "ANCA negativo favorece excluir EGPA, mesmo diante de asma, eosinofilia e neuropatia multifocal.",
    "p-ANCA positivo permite substituir o teste específico de MPO/PR3 na avaliação da suspeita de EGPA."
  ],
  "ans": 0,
  "exp": "MPO-ANCA pode apoiar EGPA no contexto compatível, mas ANCA negativo não exclui a doença. A diretriz de 2023 informa positividade em 30-40%, com predomínio de MPO entre as pessoas positivas. O diagnóstico integra asma, eosinofilia, manifestações de órgãos e exclusão de outras doenças eosinofílicas ou vasculíticas. GN, neuropatia e púrpura são mais frequentes no grupo ANCA positivo; cardiomiopatia e determinadas manifestações eosinofílicas são mais frequentes no negativo, com sobreposição importante. Um padrão p-ANCA isolado tem menor especificidade que MPO-ANCA e não confirma EGPA; a investigação usa testes específicos para MPO/PR 3 e avaliação clínica. A sorologia não deve apagar o fenótipo nem determinar sozinha o tratamento.",
  "diff": "medium",
  "cat": "glomerular"
}
```


## ddfb3df6

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Reconhecer o significado histológico de pauci-imune sem inferir ausência de inflamação ou ANCA obrigatório. Competência:interpretação. Bloom:Compreender. Miller:Sabe. Dificuldade:easy. Define diretamente o padrão de imunofluorescência e seus limites.

Define depósitos na IF, sem fornecer a resposta no enunciado nem confundir pauci-imune com inflamação escassa, cicatriz ou título sérico.

Advogado do Recurso:A necrose e os crescentes do caso são compatíveis com pouco depósito. Linear corresponde a outro padrão, e ANCA negativo não exclui GN pauci-imune. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:KDIGO-ANCA-2024; EULAR-2022-update. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:a976ef24d1d6326dc180cbe24410d4c400160bfada0cf00b5c952adbbca88cd9. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "GN Pauci-imune — O que a Imunofluorescência Diz",
  "qid": "ddfb3df6",
  "q": "Biópsia renal mostra glomerulonefrite necrosante com crescentes, classificada como pauci-imune. A que se refere essa classificação?",
  "refs": [
    "kdigo_anca_2024",
    "eular_aav_2022"
  ],
  "opts": [
    "Escassa deposição de imunoglobulinas e complemento na imunofluorescência",
    "Predomínio de lesões cicatriciais, com escassa inflamação glomerular ativa",
    "Baixos títulos de autoanticorpos circulantes, proporcionais à intensidade da lesão renal",
    "Deposição linear de imunoglobulinas ao longo da membrana basal glomerular"
  ],
  "ans": 0,
  "exp": "Pauci-imune descreve o padrão da imunofluorescência: ausência ou pequena quantidade de imunoglobulinas e complemento. Não descreve a quantidade de autoanticorpos no sangue nem implica pouca inflamação ou lesões apenas cicatriciais; necrose e crescentes podem ser extensos. O padrão linear sugere doença por anticorpos antimembrana basal glomerular (anti-MBG), enquanto depósitos granulares favorecem complexos imunes. Na apresentação adequada, o padrão pauci-imune sustenta vasculite associada a anticorpos anticitoplasma de neutrófilos (ANCA), integrando testes para proteinase 3 (PR3), mieloperoxidase (MPO) e fenótipo clínico. ANCA negativo não exclui essa possibilidade.",
  "diff": "easy",
  "cat": "glomerular"
}
```


## 60efeb87

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Interpretar resultado do MAINRITSAN e selecionar opções válidas de manutenção da vasculite ANCA. Competência:conduta. Bloom:Analisar. Miller:Sabe como. Dificuldade:medium. Relaciona ensaio e aplicabilidade clínica, sem dado individual de conflito complexo.

Esquema fixo MAINRITSAN e suas recidivas maiores são diferenciados de doses só por ANCA. AZA permanece alternativa válida na diretriz.

Advogado do Recurso:A preferência de RTX em muitos pacientes não torna AZA inválida; a pergunta não obriga uma escolha individual sem dados de infecção/IgG/acesso. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:19/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score19/20;aprovação→LIBERADA.

Fontes específicas:MAINRITSAN-2014; KDIGO-ANCA-2024. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:8f6cd4ed5e30f74b207cf27d621690c4fa4715c04958276254642e7ad9c5359a. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "MAINRITSAN — Manutenção após Indução",
  "qid": "60efeb87",
  "q": "Qual conclusão sobre manutenção da vasculite associada a anticorpos anticitoplasma de neutrófilos (ANCA) é sustentada pelo MAINRITSAN e pela KDIGO 2024?",
  "refs": [
    "mainritsan_trial",
    "kdigo_anca_2024"
  ],
  "opts": [
    "Rituximabe em esquema fixo reduziu recidivas maiores; azatioprina continua opção de manutenção",
    "Rituximabe e azatioprina foram equivalentes para prevenir recidiva maior ao fim de 28 meses",
    "Azatioprina reduziu mais recidivas maiores, favorecendo sua preferência na doença recorrente",
    "Doses de rituximabe guiadas apenas pelo ANCA preveniram mais recidivas que azatioprina"
  ],
  "ans": 0,
  "exp": "Após indução com ciclofosfamida e glicocorticoide, o MAINRITSAN comparou rituximabe 500 mg nos dias 0 e 14 e meses 6, 12 e 18 com azatioprina até o mês 22. Recidiva maior no mês 28 ocorreu em 5% versus 29%. O resultado favorece rituximabe para muitos pacientes com alto risco de recaída, mas não torna azatioprina inválida: a KDIGO recomenda rituximabe ou azatioprina com baixa dose de glicocorticoide, individualizando subtipo de ANCA, recaídas, imunoglobulinas, infecção, fertilidade, acesso e preferência.",
  "diff": "medium",
  "cat": "glomerular"
}
```


## 2a595b23

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Identificar IgAN rapidamente progressiva pelo declínio temporal da TFGe e oferecer indução apropriada. Competência:conduta. Bloom:Aplicar. Miller:Sabe como. Dificuldade:hard. Integra declínio expressivo, tempo, exclusão de mimetizadores e lesão ativa com urgência terapêutica.

Queda55% em10semanas, exclusões e lesão ativa sustentam IgAN rapidamente progressiva; CYC+GC e profilaxias são adequados.

Advogado do Recurso:Não se indica CYC por qualquer crescente isolado. RTX não tem superioridade estabelecida; terapias habituais de nefroproteção não substituem indução nessa variante. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:KDIGO-IgAN-2025; KDIGO-ANCA-2024. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:92bc16ef305a25b7a6f8d25f9cff901f9206c5135396089a38d82c33fa3abdb4. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "IgAN Rapidamente Progressiva — Definição e Indução",
  "qid": "2a595b23",
  "q": "Pessoa com nefropatia por IgA (IgAN) perde 55% da taxa de filtração glomerular estimada (TFGe) em dez semanas. Causas reversíveis, vasculite associada a anticorpos anticitoplasma de neutrófilos e doença por anticorpos antimembrana basal glomerular foram excluídas. A biópsia mostra necrose e muitos crescentes. Qual conduta é mais alinhada à KDIGO 2025?",
  "refs": [
    "kdigo_igan_igav_2025",
    "kdigo_anca_2024"
  ],
  "opts": [
    "Induzir remissão com ciclofosfamida e glicocorticoide sistêmico",
    "Induzir remissão com rituximabe e glicocorticoide, pela superioridade estabelecida",
    "Usar budesonida de liberação direcionada para substituir a indução sistêmica",
    "Manter apenas nefroproteção e aguardar estabilização para decidir imunossupressão"
  ],
  "ans": 0,
  "exp": "IgAN rapidamente progressiva é definida por queda de pelo menos 50% da TFGe em até três meses, após excluir causas reversíveis e outros diagnósticos de glomerulonefrite rapidamente progressiva. A biópsia é essencial e costuma mostrar hipercelularidade, necrose e muitos crescentes. A KDIGO orienta oferecer ciclofosfamida com glicocorticoide sistêmico, em estrutura semelhante à indução da vasculite ANCA, acompanhada de profilaxias. Crescentes sem elevação concomitante da creatinina não definem essa variante, e a evidência para rituximabe é insuficiente.",
  "diff": "hard",
  "cat": "glomerular"
}
```


## cc9dc9d0

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Integrar fenótipo pulmão-rim e MPO-ANCA para reconhecer poliangeíte microscópica sem exclusividade sorológica. Competência:diagnóstico. Bloom:Aplicar. Miller:Sabe como. Dificuldade:medium. Integra fenótipo e sorologia típicos, sem depender de exceção rara ou forte incerteza.

MPO com GN pauci-imune e doença intersticial favorece MPA, sem declarar sorologia exclusiva. Imunoensaios específicos e fenótipo permanecem centrais.

Advogado do Recurso:A ausência de granulomas não exclui AAV; MPO não confirma GPA e padrão p-ANCA não supera teste específico. A correta diz favorece, não confirma isoladamente. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:EULAR-2022-update; KDIGO-ANCA-2024. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:1a4b77499f68a3956829eb2d99497564a7fd5396e12e9e0896d32d72a91fd5c2. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "qid": "cc9dc9d0",
  "q": "Pessoa com síndrome pulmão-rim tem anticorpos anticitoplasma de neutrófilos (ANCA) contra mieloperoxidase (MPO), glomerulonefrite pauci-imune e doença pulmonar intersticial, sem nódulos granulomatosos ou doença destrutiva de vias aéreas. Qual interpretação é mais adequada?",
  "opts": [
    "Favorece poliangeíte microscópica pela integração entre sorotipo, órgãos acometidos e histologia",
    "Confirma granulomatose com poliangeíte pelo MPO-ANCA, apesar do padrão não granulomatoso",
    "Afasta vasculite associada ao ANCA, já que faltam as lesões granulomatosas típicas",
    "Define o subtipo pela imunofluorescência perinuclear, dispensando integrar o fenótipo"
  ],
  "ans": 0,
  "exp": "MPO-ANCA é frequente na poliangeíte microscópica, enquanto anticorpos contra proteinase 3 (PR3) e manifestações granulomatosas de vias aéreas são mais comuns na granulomatose com poliangeíte. Porém, há sobreposição de sorotipos e fenótipos; o diagnóstico não deve ser feito pelo anticorpo isolado. A associação entre MPO-ANCA, glomerulonefrite pauci-imune e doença pulmonar intersticial favorece poliangeíte microscópica nessa apresentação. Imunoensaios específicos para MPO e PR3 são preferidos ao padrão perinuclear (p-ANCA) ou citoplasmático (c-ANCA) na imunofluorescência indireta. A combinação de órgãos acometidos, imagem, histologia e exclusão de mimetizadores define a interpretação clínica.",
  "refs": [
    "eular_aav_2022",
    "kdigo_anca_2024"
  ],
  "cat": "glomerular",
  "diff": "medium",
  "t": "PAM — Serótipo e Fenótipo"
}
```


## e5b44fbe

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Selecionar indução combinada na vasculite ANCA ameaçadora de órgãos e separar indicação de troca plasmática. Competência:conduta. Bloom:Aplicar. Miller:Sabe como. Dificuldade:medium. Reconhece estrutura padrão da indução; enunciado não exige escolher agente por função renal detalhada.

A estrutura pedida é indução imediata GC+RTX/CYC na ameaça a órgãos, individualizando agente e separando PLEX adicional.

Advogado do Recurso:A pergunta não fornece creatinina para impor um agente; correta admite ambos. MMF/AZA ou PLEX com adiamento dos agentes não substituem a indução padrão na síndrome grave. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:KDIGO-ANCA-2024; PEXIVAS-2020; RITUXVAS-2010. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:6e5411d6667dc8c318d6b9032548537d552215a52c4745029a777a24048c62db. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "qid": "e5b44fbe",
  "q": "Paciente com vasculite associada a anticorpos anticitoplasma de neutrófilos (ANCA) contra proteinase 3 (PR3) apresenta glomerulonefrite rapidamente progressiva e hemorragia alveolar. Qual estrutura de indução é mais adequada?",
  "opts": [
    "Glicocorticoide com rituximabe ou ciclofosfamida, iniciados prontamente",
    "Glicocorticoide com micofenolato, como primeira escolha para essa doença renal grave",
    "Glicocorticoide com azatioprina, como primeiro esquema de indução da síndrome pulmão-rim",
    "Glicocorticoide com troca plasmática, adiando rituximabe ou ciclofosfamida até a resposta"
  ],
  "ans": 0,
  "exp": "Doença ameaçadora de órgão requer indução imediata com glicocorticoide associado a rituximabe ou ciclofosfamida; a escolha considera função renal, recaída, PR3 ou MPO, idade, fertilidade, infecção, acesso e experiência. Rituximabe é particularmente atraente em doença recidivante e PR3, enquanto ciclofosfamida ou combinação podem ser considerados em apresentações renais muito graves. Troca plasmática não é automática pelo ANCA: é decisão adicional em risco renal extremo, hemorragia alveolar com hipoxemia ou sobreposição anti-MBG.",
  "cat": "glomerular",
  "diff": "medium",
  "refs": [
    "kdigo_anca_2024",
    "pexivas_trial",
    "rituxvas_study"
  ],
  "t": "Vasculite ANCA Grave — Estrutura da Indução"
}
```


## 89af997c

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Selecionar indução na vasculite ANCA com função renal gravemente comprometida respeitando limites dos ensaios. Competência:conduta. Bloom:Avaliar. Miller:Sabe como. Dificuldade:hard. Creatinina maior que4e rápida queda modificam a interpretação dos dados e a escolha do regime.

Cr4,8 com rápida elevação exige respeitar limites RAVE: RTX+GC isolados não têm equivalência demonstrada nessa faixa. CYC+GC ou RTX/CYC são coerentes ao PP9.3.1.2.

Advogado do Recurso:A opção com RTX alega preferência pela equivalência comprovada RAVE, não apenas possibilidade individual; é falsa pela exclusão>4. Não se afirma contraindicação absoluta de RTX. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:KDIGO-ANCA-2024; RITUXVAS-2010; RAVE-2010; PEXIVAS-2020. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:36a3db783e599e4464ed2eb0d508572dea08e5eed6169895d6412b665d74494b. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "Vasculite ANCA Renal Grave — Indução com Função Muito Reduzida",
  "qid": "89af997c",
  "q": "Paciente com glomerulonefrite pauci-imune e anticorpos anticitoplasma de neutrófilos (ANCA) contra proteinase 3 (PR3) apresenta creatinina de 4,8 mg/dL em rápida elevação, sem hemorragia alveolar. Qual estrutura de indução é mais alinhada à KDIGO 2024?",
  "refs": [
    "kdigo_anca_2024",
    "rituxvas_study",
    "rave_study",
    "pexivas_trial"
  ],
  "opts": [
    "Glicocorticoide com ciclofosfamida; considerar rituximabe combinado a pulsos de ciclofosfamida",
    "Glicocorticoide com rituximabe, preferido pela equivalência comprovada no RAVE nessa faixa de creatinina",
    "Glicocorticoide com micofenolato, pela equivalência demonstrada na doença renal muito grave",
    "Glicocorticoide com azatioprina, por ser o tratamento de indução mais seguro nessa apresentação"
  ],
  "ans": 0,
  "exp": "Na vasculite associada ao ANCA de início recente, a indução combina glicocorticoide com rituximabe ou ciclofosfamida. Quando a creatinina está acima de 4 mg/dL ou a filtração cai rapidamente, porém, os dados para rituximabe associado apenas a glicocorticoide são limitados: o RAVE excluiu esse grau de disfunção renal. A KDIGO 2024 orienta considerar ciclofosfamida com glicocorticoide ou rituximabe combinado a pulsos de ciclofosfamida. O regime reduzido de glicocorticoide é preferível por menor toxicidade. Troca plasmática é uma decisão adicional em risco renal extremo, necessidade de diálise, creatinina rapidamente crescente ou hemorragia alveolar com hipoxemia; não substitui a imunossupressão.",
  "diff": "hard",
  "cat": "glomerular"
}
```


## ebd066db

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Obter biópsia sem retardar indução na apresentação compatível com vasculite ANCA de deterioração rápida. Competência:conduta. Bloom:Aplicar. Miller:Sabe como. Dificuldade:medium. Integra urgência, sorologia e baixa suspeita de mimetizadores para ordenar condutas.

Perda rápida, sedimento, PR3 e baixa suspeita de mimetizadores permitem tratar prontamente sem esperar laudo, mas obter biópsia assim que possível.

Advogado do Recurso:Nem todo ANCA positivo dispensa biópsia. Aqui o contexto restringe a recomendação de urgência; títulos não substituem histologia nem distinguem com segurança cicatriz. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:20/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score20/20;aprovação→LIBERADA.

Fontes específicas:KDIGO-ANCA-2024. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:c26e22dbac004850a88b42a5e01471d8ab3dd8d4500ceb4fe76ccc02c7065472. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "Vasculite ANCA Renal — Papel e Momento da Biópsia",
  "qid": "ebd066db",
  "q": "Paciente apresenta perda rápida da função renal, sedimento glomerular e anticorpos anticitoplasma de neutrófilos (ANCA) contra proteinase 3 (PR3), com baixa suspeita de infecção ou vasculite secundária. Qual é a melhor estratégia para a biópsia renal?",
  "refs": [
    "kdigo_anca_2024"
  ],
  "opts": [
    "Tratar prontamente e obter a biópsia assim que viável, sem aguardar o laudo para iniciar",
    "Aguardar o laudo histológico antes de iniciar tratamento, mesmo com rápida perda renal",
    "Iniciar tratamento e reservar biópsia apenas para quem permanecer dependente de diálise",
    "Usar títulos seriados de ANCA no lugar da biópsia para distinguir atividade de cronicidade"
  ],
  "ans": 0,
  "exp": "A biópsia renal continua sendo o padrão de referência para confirmar a glomerulonefrite necrosante pauci-imune, excluir diagnósticos concorrentes e estimar prognóstico pela proporção de glomérulos normais, crescentes e esclerose, além da lesão tubulointersticial. Entretanto, na apresentação compatível com vasculite de pequenos vasos, MPO- ou PR3-ANCA positivo, baixa suspeita de causa secundária e deterioração rápida, esperar o procedimento ou o laudo não deve atrasar a imunossupressão. O ANCA isolado não define toda a atividade nem substitui a histologia; a biópsia deve ser obtida logo após o início quando factível.",
  "diff": "medium",
  "cat": "glomerular"
}
```


## 91cfbe6c

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:VERIFICADA;Pendência:NENHUMA;Publicação:LIBERADA.

OP:Prevenir Pneumocystis e monitorar imunoglobulinaG durante indução com rituximabe. Competência:conduta. Bloom:Lembrar. Miller:Sabe. Dificuldade:easy. Recupera medidas padronizadas de segurança com consequência clínica.

Profilaxia primária Pneumocystis e IgG basal/periódica são medidas padronizadas; duração não decorre de ANCA negativo ou pneumonia prévia.

Advogado do Recurso:Hemograma tem utilidade, mas não substitui IgG. Alternativa adequada é admitida para intolerância ao TMP-SMX. A explicação A2 rebate os distratores finais, não opções antigas. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:19/20. VERIFICADA+NENHUMAválidos;semeliminatório;semrecurso;score19/20;aprovação→LIBERADA.

Fontes específicas:KDIGO-ANCA-2024. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. 

Hash:02603398fb8d53a8f79cebb5fa0f13d22e752a5a9aceca196a32734f53ad36d5. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "Vasculite ANCA — Profilaxia e Monitorização na Indução",
  "qid": "91cfbe6c",
  "q": "Paciente iniciará rituximabe e glicocorticoide para indução de vasculite associada a anticorpos anticitoplasma de neutrófilos (ANCA). Qual conjunto de medidas de segurança é mais adequado?",
  "refs": [
    "kdigo_anca_2024"
  ],
  "opts": [
    "Profilaxia para Pneumocystis com sulfametoxazol-trimetoprima ou alternativa e monitorização da imunoglobulina G",
    "Profilaxia para Pneumocystis até negativar o ANCA e monitorização da imunoglobulina G",
    "Profilaxia para Pneumocystis apenas após pneumonia prévia e monitorização da imunoglobulina G",
    "Profilaxia para Pneumocystis e monitorização só pelo hemograma, sem dosar imunoglobulina G"
  ],
  "ans": 0,
  "exp": "A KDIGO 2024 orienta sulfametoxazol-trimetoprima em baixa dose, ou uma alternativa adequada, para profilaxia de pneumonia por Pneumocystis durante todo o curso de ciclofosfamida ou por seis meses após a indução com rituximabe; uso mais prolongado pode ser considerado se houver doses repetidas, doença pulmonar estrutural ou imunossupressão persistente. Em quem recebe rituximabe, a imunoglobulina G deve ser medida antes do tratamento e periodicamente, porque hipogamaglobulinemia aumenta a vulnerabilidade a infecções. A profilaxia primária não deve aguardar pneumonia prévia nem ter sua duração definida apenas pela negativação do ANCA. O hemograma monitora outras toxicidades, mas não substitui a dosagem de imunoglobulina G.",
  "diff": "easy",
  "cat": "glomerular"
}
```


## ae0f4fef

**Veredito: aprovada. Legado: MANTER. Confiança: alta.** Evidência:PARCIALMENTE VERIFICADA;Pendência:NÃO DECISIVA;Publicação:LIBERADA.

OP:Separar mecanismo farmacológico plausível do avacopan e validade da evidência clínica após retratação. Competência:interpretação. Bloom:Analisar. Miller:Sabe como. Dificuldade:medium. Integra mecanismo e hierarquia da evidência sem tomar plausibilidade como eficácia; não exige decisão clínica avançada.

C5aR1/CD88 é o alvo, não C3/C5 direto; mecanismo não comprova eficácia em artigo retratado. Fonte KDIGO acrescentada apenas para mecanismo histórico, não eficácia pós2026.

Advogado do Recurso:Testei se mecanismo permitiria reter a não inferioridade: não. Retratação também não demonstra resposta nula universal. Status regulatório é notificação histórica EUA datada, não regra global. Nenhum argumento plausível de recurso decisivo remanescente.

Eliminatórios:nenhum. Score:19/20. PARCIALMENTE VERIFICADA+NÃO DECISIVAválidos;semeliminatório;semrecurso;score19/20;aprovação→LIBERADA.

Fontes específicas:Avacopan-mechanism-primary; KDIGO-ANCA-2024; FDA-NOOH-April2026; NEJM-retraction-2026. Acesso próprio, números e limitações estão noJSON, separado da coleta do autor. Nota NEJM integral não acessível. Conteúdo decisivo retratação/data/integridade conferido independentemente em HealthCanada e documentoFDA íntegro; detalhe biográfico herdado nos cards sobre solicitação pelos autores não é pressuposto, gabarito ou segurança desta questão. Não alegar validação integral dos cards históricos.

Hash:ea01fbc555b5d5a53808b8a39160774129e696b9122527e2e91d3135c2050a9e. Implementação:Aplicar apenas objeto A2 exato. Mudança material posterior invalida gate.89depende do cardRAVEC1 liberado.

```json
{
  "t": "Avacopan — Mecanismo versus Evidência Clínica",
  "qid": "ae0f4fef",
  "q": "Qual afirmação separa corretamente o mecanismo do avacopan da situação de sua evidência clínica em 2026?",
  "opts": [
    "É antagonista do receptor de C5a; esse mecanismo não comprova a eficácia do ADVOCATE retratado",
    "É antagonista do receptor de C5a; esse mecanismo preserva a validade da análise de não inferioridade",
    "É inibidor direto de C5; a retratação demonstra ausência de resposta em qualquer paciente",
    "É inibidor de C3; a eficácia permanece comprovada quando associado a rituximabe"
  ],
  "ans": 0,
  "exp": "Avacopan antagoniza o receptor de C5a do tipo 1 (C5aR1/CD88), reduzindo ativação e migração de neutrófilos mediadas por C5a; não é inibidor direto de C5 nem de C3. Essa descrição farmacológica é distinta da demonstração de benefício clínico. O artigo ADVOCATE foi retratado por problemas de integridade dos desfechos, e seu resultado não se torna confiável por haver um mecanismo plausível. A FDA propôs retirar a aprovação nos Estados Unidos em 27 de abril de 2026, considerando a eficácia não demonstrada e informações materiais inexatas no dossiê, além de preocupações de segurança. Essa notificação é uma proposta histórica específica dos Estados Unidos; não deve ser extrapolada como situação regulatória mundial atual. A diretriz KDIGO 2024 descreve o antagonismo do receptor de C5a, mas suas recomendações de eficácia para avacopan antecedem a retratação e não a corrigem.",
  "diff": "medium",
  "cat": "glomerular",
  "refs": [
    "advocate_retraction_2026",
    "fda_tavneos_nooh_2026",
    "kdigo_anca_2024"
  ]
}
```

## Fontes e rastreabilidade

- https://kdigo.org/wp-content/uploads/2024/05/KDIGO-2024-ANCA-Vasculitis-Guideline-Update.pdf: PDF oficial integral aberto; diagnósticoS90–S91, indução e segurançaS95–S98, trocaS99–S100 e manutençãoS100+ foram lidos independentemente. Recomendações históricas avacopan não foram usadas como eficácia atual.
- https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:20647198%20OR%20EXT_ID:32053298%20OR%20EXT_ID:25372085&format=xml&resultType=core: Três resumos primários completos lidos independentemente: Methods/Results/Conclusions, esquemas e números. Não equivale a abrir integrais NEJM.
- https://pmc.ncbi.nlm.nih.gov/articles/3137658/: Alias público abriu manuscrito primário integral621linhas após URLprefixado desafiar acesso e XML500. Métodos265–268, resultados e discussão482–490 lidos. Stone,221–232;GCemambos;CYCajustada;exclusões e limitação infertilidade confirmadas.
- https://www.fda.gov/media/192160/download: Documento primário integral24p aberto;27/04/2026, proposta/EUA,9sujeitosreadjudicadospóslock/descegamento, informações materiais inexatas e falta de evidência substancial. Não é decisão final mundial.
- https://recalls-rappels.canada.ca/en/alert-recall/tavneos-avacopan-and-health-canada-s-review-data-integrity-concerns: Comunicação primária de07/07/2026 aberta; Background confirma retrataçãoNEJM29/06/2026 por integridade. TextoNEJMdireto403; não alegada leitura integral da nota.
- https://siaaic.org/wp-content/uploads/2023/05/Evidence-based-guideline-EGPA_NRR_090523.pdf: PDF primário integral16p aberto; Statement4p6–7 e associações fenotípicas lidos.
- https://opinvisindi.is/bitstreams/eeca1efb-a428-4f38-a857-754169e589b4/download: PDF primário de coautor integral27p aberto; recomendação2, diagnóstico, associaçãoMPA/intersticial e sorologia lidos. Não importar recomendação avacopan histórica.
- https://kdigo.org/wp-content/uploads/2024/08/KDIGO-2025-IgAN-IgAV-Guideline.pdf: PDF oficial integral71p aberto;PP1.5.3S26/S50, queda≥50%em≤3meses, exclusões, biópsia, CYC+GC/profilaxias e RTXinsuficiente lidos.

Os dez escores individuais, erros de cada distrator, classificação cega, objetos integrais e hashes estão noJSON. Nenhum gate é herdado deA1. Os cards regulatórios legados não foram alterados para mascarar limites de acesso.
