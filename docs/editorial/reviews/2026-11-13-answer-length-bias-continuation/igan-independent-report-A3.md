# IgAN: diagnóstico, patologia e prognóstico — revisão independente A3

Seis questões exatas aprovadas: VERIFICADA/NENHUMA/LIBERADA. Dois novos cards integralmente conferidos em gate separado, sem NQ Editorial Score de questão. A3 não herdou aprovação de A1/A2.

O quadro global de viés de comprimento permanece aberto. Não houve equalização mecânica ou retirada de qualificadores clínicos. Fontes, hashes, classificações cegas e contraprovas estão nos JSONs.

## ce79d609

Veredito: aprovada; confiança alta; score19/20. OP: Interpretar MEST-C e dano crônico em conjunto com dados clínicos, sem prescrição automática por uma lesão.. Bloom/Miller: Analisar/Sabe como; dificuldade final medium. Relaciona escore histológico e seu limite prognóstico/terapêutico; não há conflito individual avançado.

O laudo completo agrega prognóstico e cronicidade; não determina sozinho imunossupressão.

Advogado do Recurso: T2 não significa ausência absoluta de benefício; a candidata não afirma isso. E0eC0 não anulam atividade clínica/cronicidade. Evidência2026de subgrupos não equivale a ensaio prospectivo de tratamento selecionado pelo escore. Nenhuma segunda opção defensável. Eliminatórios: nenhum. KDIGO2025PP1.4.2.3;Oxford2017Table3;Rodrigues2017Patologia;Shi2026resumo/Nong2026Methodslimites.

EvidênciaVERIFICADA/PendênciaNENHUMA/AutorizaçãoLIBERADA,derivada conformeHandbook18.4. PreservadosOP,competência,conceito correto e raciocínio reconhecível;alteração de redação,distratores,refs e metadata não cria nova identidade.Handbook18.5 permite preservarqid/FSRS.

Patch editorial exato:

~~~json
{
  "t": "IgAN — Oxford MEST-C sem Prescrição Automática",
  "qid": "ce79d609",
  "q": "Na nefropatia por imunoglobulina A (IgA), a classificação de Oxford registra hipercelularidade mesangial (M), hipercelularidade endocapilar (E), esclerose segmentar (S), atrofia tubular/fibrose intersticial (T) e crescentes (C). Um laudo informa M1 E0 S1 T2 C0. Como esse resultado deve ser usado?",
  "refs": [
    "kdigo_igan_igav_2025",
    "rodrigues_haas_reich_igan_2017"
  ],
  "opts": [
    "Acrescenta informação prognóstica aos dados clínicos, sem escolher sozinho a terapia",
    "Seleciona a imunossupressão a partir de M1 e S1, sem depender da evolução clínica",
    "Estabelece baixo risco a partir de C0, mesmo com atrofia e fibrose cortical extensas",
    "Demonstra ausência de atividade a partir de E0, mesmo se houver proteinúria persistente"
  ],
  "ans": 0,
  "exp": "O escore de Oxford acrescenta informação prognóstica à avaliação clínica. T2 corresponde a atrofia tubular/fibrose intersticial em mais de 50% do córtex e sinaliza dano crônico extenso. Esse dado deve ser integrado à taxa de filtração glomerular estimada (TFGe), proteinúria, pressão e trajetória clínica. E0 informa ausência de hipercelularidade endocapilar na amostra, sem excluir toda atividade da doença. C0 não anula o risco ligado à cronicidade. M1 e S1 também não selecionam, por si sós, imunossupressão ou um fármaco específico: essa inferência não foi validada por ensaios prospectivos de tratamento baseado no escore.",
  "diff": "medium",
  "cat": "glomerular"
}
~~~

## 795d4589

Veredito: aprovada; confiança alta; score19/20. OP: Reconhecer finalidade prognóstica do International IgAN Prediction Tool e seu limite para predizer resposta a tratamento.. Bloom/Miller: Compreender/Sabe; dificuldade final easy. Classificação cega do originalmedium reavaliada contra comando final: perguntar finalidade principal sem cálculo/decisão multietapa éCompreender/easy. Nenhuma reclassificação baseada em comprimento.

A finalidade do modelo é prognóstica em adulto comIgANprimária confirmada;MESToriginalnãoincluiC.

Advogado do Recurso: A3delimita população válida. Predição de risco não prova resposta de uma intervenção. Não se afirma que o modelo na biópsia seja a única versão disponível. Nenhuma segunda opção defensável. Eliminatórios: nenhum. Barbour2019MethodsDefinitions/Fullmodels/Discussion;KDIGO2025PP1.3.1ePP1.4.2.3.

EvidênciaVERIFICADA/PendênciaNENHUMA/AutorizaçãoLIBERADA,derivada conformeHandbook18.4. PreservadosOP,competência,conceito correto e raciocínio reconhecível;alteração de redação,distratores,refs e metadata não cria nova identidade.Handbook18.5 permite preservarqid/FSRS.

Patch editorial exato:

~~~json
{
  "t": "IgAN Prediction Tool — Prognóstico, não Resposta Terapêutica",
  "qid": "795d4589",
  "q": "Em adulto com nefropatia por imunoglobulina A (IgA) primária confirmada por biópsia, qual é a principal finalidade do International IgAN Prediction Tool?",
  "refs": [
    "kdigo_igan_igav_2025",
    "barbour_igan_prediction_2019"
  ],
  "opts": [
    "Estimar o risco de progressão renal combinando dados clínicos e histológicos",
    "Estimar a resposta à imunossupressão a partir das lesões inflamatórias na biópsia",
    "Estabelecer o diagnóstico da doença combinando IgA sérica, hematúria e proteinúria",
    "Determinar o intervalo definitivo de seguimento a partir do risco calculado na biópsia"
  ],
  "ans": 0,
  "exp": "A ferramenta estima risco de queda de 50% da taxa de filtração glomerular estimada (TFGe) ou falência renal e auxilia a discussão do prognóstico. Nos modelos originais na biópsia, entram dados clínicos e os componentes de hipercelularidade mesangial, hipercelularidade endocapilar, esclerose segmentar e atrofia tubular/fibrose intersticial (MEST). Crescentes são registrados no laudo atualizado de Oxford, mas não compõem esses modelos originais. A diretriz reúne versões da ferramenta para momentos definidos na biópsia ou após ela. O cálculo não diagnostica a doença, não define um seguimento imutável e não foi validado para prever resposta ou selecionar uma terapia específica.",
  "diff": "easy",
  "cat": "glomerular"
}
~~~

## 5e5b8558

Veredito: aprovada; confiança alta; score19/20. OP: Reconhecer fenótipo sinfaringítico sugestivo de IgAN e necessidade de confirmação histológica/avaliação de risco.. Bloom/Miller: Aplicar/Sabe como; dificuldade final medium. Integra relação temporal da hematúria, proteinúria persistente e limites de confirmação clínica.

Fenótipo sinfaringítico e proteinúria0,7g/d justificam suspeitar e considerar biópsia;IgAsérica normal não exclui.

Advogado do Recurso: A correta diz considerar, não obrigação sem contraindicações. Curta latência não confirma etiologia e proteinúria persistente não pode ser desconsiderada. A investigação de causa secundária permanece necessária. Nenhuma segunda opção defensável. Eliminatórios: nenhum. KDIGO2025PP1.2.1/algoritmodiagnóstico;Rodrigues2017Clinicalmanifestations.

EvidênciaVERIFICADA/PendênciaNENHUMA/AutorizaçãoLIBERADA,derivada conformeHandbook18.4. PreservadosOP,competência,conceito correto e raciocínio reconhecível;alteração de redação,distratores,refs e metadata não cria nova identidade.Handbook18.5 permite preservarqid/FSRS.

Patch editorial exato:

~~~json
{
  "qid": "5e5b8558",
  "q": "Adulto jovem apresenta hematúria macroscópica recorrente durante ou até dois dias após infecções de vias aéreas, com proteinúria persistente de 0,7 g/d entre os episódios. A imunoglobulina A (IgA) sérica é normal. Qual interpretação e próximo passo são mais apropriados?",
  "opts": [
    "Suspeitar de nefropatia por IgA e considerar biópsia renal na investigação da proteinúria",
    "Suspeitar de glomerulonefrite pós-infecciosa e usar a curta latência para dispensar biópsia",
    "Suspeitar de doença da membrana basal fina e atribuir a proteinúria à hematúria recorrente",
    "Suspeitar de nefropatia por IgA e usar a dosagem sérica normal para encerrar a investigação"
  ],
  "ans": 0,
  "exp": "Hematúria visível junto ou logo após uma infecção de mucosa é uma apresentação sugestiva de nefropatia por IgA, chamada sinfaringítica. O padrão não basta para confirmar a doença, e IgA sérica normal não a exclui: não existe biomarcador sérico ou urinário validado para substituir o diagnóstico por biópsia. A KDIGO orienta considerar biópsia em adulto com possibilidade dessa doença e proteinúria de pelo menos 0,5 g/d, se não houver contraindicação, além de investigar causas secundárias. Recorrência e curta latência também não comprovam doença da membrana basal fina ou glomerulonefrite pós-infecciosa nem justificam ignorar proteinúria persistente.",
  "refs": [
    "kdigo_igan_igav_2025",
    "rodrigues_haas_reich_igan_2017"
  ],
  "cat": "glomerular",
  "diff": "medium",
  "t": "IgAN — Hematúria Sinfaringítica e Confirmação"
}
~~~

## 26804856

Veredito: aprovada; confiança alta; score19/20. OP: Interpretar depósitos mesangiais predominantes de IgA como padrão compatível, integrando microscopias e pesquisa de causas secundárias.. Bloom/Miller: Aplicar/Sabe como; dificuldade final medium. Integra achado histológico típico e limites etiológicos, sem inferência sorológica isolada.

IgA predominante comC3é padrão compatível;etiologia exige correlação clinicopatológica.

Advogado do Recurso: Não se diagnostica automaticamente doença primária;C3concomitante não satisfaz domínio deC3glomerulopathy. Granular não define localização. Padrão e etiologia distinguidos, sem duas respostas. Eliminatórios: nenhum. Rodrigues2017Pathology;KDIGO2025PP1.2.1/causassecundárias.

EvidênciaVERIFICADA/PendênciaNENHUMA/AutorizaçãoLIBERADA,derivada conformeHandbook18.4. PreservadosOP,competência,conceito correto e raciocínio reconhecível;alteração de redação,distratores,refs e metadata não cria nova identidade.Handbook18.5 permite preservarqid/FSRS.

Patch editorial exato:

~~~json
{
  "t": "IgAN — Interpretação da Imunofluorescência",
  "qid": "26804856",
  "q": "Adulto com hematúria glomerular e proteinúria é submetido a biópsia renal. A imunofluorescência mostra depósitos mesangiais predominantes de imunoglobulina A (IgA), acompanhados do componente C3 do complemento, e a microscopia óptica demonstra proliferação mesangial. Qual é a interpretação mais adequada?",
  "refs": [
    "kdigo_igan_igav_2025",
    "rodrigues_haas_reich_igan_2017"
  ],
  "opts": [
    "Nefropatia por IgA primária, definida pelo predomínio mesangial sem depender de investigação clínica",
    "Padrão compatível com nefropatia por IgA, com etiologia a definir pela correlação clinicopatológica",
    "Glomerulopatia C3, definida pela presença de C3 mesmo quando a IgA é o depósito predominante",
    "Nefropatia membranosa, definida por depósitos granulares que devem ocupar o espaço subepitelial"
  ],
  "ans": 1,
  "exp": "Depósitos glomerulares de IgA predominantes ou codominantes, em geral mesangiais, são o padrão característico da nefropatia por IgA. C3 pode acompanhar esses depósitos e não transforma o caso, isoladamente, em glomerulopatia C3. A interpretação reúne microscopia óptica, imunofluorescência, microscopia eletrônica e dados clínicos. Ainda é necessário avaliar causas secundárias e diagnósticos próximos, como vasculite por IgA, cirrose, infecções virais, doença inflamatória intestinal e glomerulonefrite relacionada à infecção com IgA dominante. Depósito granular não é sinônimo de localização subepitelial nem define nefropatia membranosa.",
  "diff": "medium",
  "cat": "glomerular"
}
~~~

## 12328a3e

Veredito: aprovada; confiança alta; score19/20. OP: Classificar 35% de atrofia tubular/fibrose intersticial como T1 e reconhecer cronicidade no Oxford.. Bloom/Miller: Aplicar/Sabe como; dificuldade final easy. Mapeia um valor explícito a uma faixa histológica, em uma etapa; terminologia não cria dificuldade avançada.

35%deIFTAcortical corresponde aT1,lesão crônica;classificar não é prescrever.

Advogado do Recurso: Valor longe dos limites;T2>50%,Mmesangial eCcrescentes não medemIFTA. Domínio histológico possui utilidade prognóstica e não é número de ensaio sem consequência. Eliminatórios: nenhum. Oxford2017Table3p1018;Rodrigues2017Pathology;KDIGO2025limites histológicos.

EvidênciaVERIFICADA/PendênciaNENHUMA/AutorizaçãoLIBERADA,derivada conformeHandbook18.4. PreservadosOP,competência,conceito correto e raciocínio reconhecível;alteração de redação,distratores,refs e metadata não cria nova identidade.Handbook18.5 permite preservarqid/FSRS.

Patch editorial exato:

~~~json
{
  "t": "IgAN — Lesão T na Classificação MEST-C",
  "qid": "12328a3e",
  "q": "Na biópsia de um adulto com nefropatia por imunoglobulina A (IgA), atrofia tubular e fibrose intersticial ocupam aproximadamente 35% da área cortical. Como esse achado deve ser registrado e interpretado na classificação de Oxford?",
  "refs": [
    "kdigo_igan_igav_2025",
    "rodrigues_haas_reich_igan_2017"
  ],
  "opts": [
    "T1: comprometimento de 26–50% do córtex, indicando dano tubulointersticial crônico",
    "T2: comprometimento acima de 25% do córtex, indicando a maior faixa de extensão",
    "M1: lesão mesangial quantificada pelo percentual de atrofia e fibrose cortical",
    "C1: crescente fibrocelular quantificada pela extensão da fibrose intersticial"
  ],
  "ans": 0,
  "exp": "A lesão de atrofia tubular/fibrose intersticial é registrada pelo componente T da classificação de Oxford. Envolvimento de 26–50% do córtex corresponde a T1; acima de 50%, a T2. Assim, 35% é T1 e expressa dano crônico com valor prognóstico. M refere-se a hipercelularidade mesangial, e C a crescentes celulares ou fibrocelulares; nenhum deles é medido pela extensão de fibrose intersticial. A histologia deve ser integrada à função renal, proteinúria, pressão e evolução clínica, sem converter uma lesão isolada em prescrição automática.",
  "diff": "easy",
  "cat": "glomerular"
}
~~~

## ea37c153

Veredito: aprovada; confiança alta; score19/20. OP: Explicar a hipótese patogênica dos quatro hits da IgAN por IgA1 deficiente em galactose, autoanticorpos, imunocomplexos e lesão mesangial.. Bloom/Miller: Compreender/Sabe; dificuldade final easy. Reconhece mecanismo conceitual direto, sem decisão complexa ou integração individual de riscos.

ModeloIgA1deficiente→autoanticorpos→complexos→depósito/lesãomesangial,sem causa suficiente universal.

Advogado do Recurso: O comando pede modelo, não mecanismo universal em cada paciente. Depósito subepitelial/ordem invertida/excesso de galactose são erros de localização,sequência e glicosilação dentro doOP. Não se alteraIgA1para forçar comprimento. Eliminatórios: nenhum. Rodrigues2017Pathogenesis/Figure1;Suzuki2009resumo;KDIGO2025diagnóstico por biópsia.

EvidênciaVERIFICADA/PendênciaNENHUMA/AutorizaçãoLIBERADA,derivada conformeHandbook18.4. PreservadosOP,competência,conceito correto e raciocínio reconhecível;alteração de redação,distratores,refs e metadata não cria nova identidade.Handbook18.5 permite preservarqid/FSRS.

Patch editorial exato:

~~~json
{
  "t": "IgAN — Hipótese Patogênica dos Quatro Hits",
  "qid": "ea37c153",
  "q": "Qual sequência descreve o modelo dos quatro eventos (“hits”) na nefropatia por imunoglobulina A (IgA), envolvendo sua subclasse 1 (IgA1)?",
  "refs": [
    "kdigo_igan_igav_2025",
    "rodrigues_haas_reich_igan_2017"
  ],
  "opts": [
    "Produção de IgA1 deficiente em galactose → autoanticorpos → imunocomplexos → depósito e lesão mesangial",
    "Produção de IgA1 deficiente em galactose → autoanticorpos → imunocomplexos → depósito e lesão subepitelial",
    "Produção de IgA1 deficiente em galactose → depósito mesangial direto → lesão renal → autoanticorpos",
    "Produção de IgA1 com excesso de galactose → autoanticorpos → imunocomplexos → depósito e lesão mesangial"
  ],
  "ans": 0,
  "exp": "O modelo propõe IgA da subclasse 1 (IgA1) com glicanos deficientes em galactose, seguida por autoanticorpos que reconhecem essa alteração, formação de imunocomplexos circulantes e acúmulo mesangial com ativação celular e lesão glomerular. A alteração da IgA1 isoladamente não explica toda a doença clínica. O modelo não começa por excesso de galactose nem atribui a lesão apenas ao depósito direto de IgA1 antes dos autoanticorpos. A localização característica dos complexos é mesangial, e não subepitelial. Trata-se de um modelo patogênico, sem tornar a dosagem dessas moléculas um substituto validado da biópsia.",
  "diff": "easy",
  "cat": "glomerular"
}
~~~

