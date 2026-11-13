# IgAN: glicocorticoides — contraprova independente A2

Três questões exatas aprovadas, VERIFICADA/NENHUMA/LIBERADA. Os dois cardsA1 foram conferidos integralmente e possuem gate próprio; não recebem NQ Editorial Score de questão. A2 foi reavaliada integralmente e não herdou aprovação de A1.

## d81defbb

Veredito: aprovada. Confiança alta. Score19/20. OP: Integrar benefício renal e toxicidade de metilprednisolona sistêmica na IgAN e reconhecer seleção de risco/esquema reduzido/profilaxia quando Nefecon indisponível.. Analisar/Sabe como/medium. Comando pede síntese de benefício-risco com contraindicações e prevenção reconhecíveis, sem decisão multietapa em apresentação atípica; original hard superestima especialização do tema. Siglas precisam expansão; distractores universais pouco plausíveis.

Benefício renal e risco de toxicidade coexistem; na indisponibilidade de Nefecon, a KDIGO sugere esquema reduzido com profilaxia e seleção individual.

Advogado do Recurso: A2 substitui o distrator universal por falsa comparação de doses: o TESTING não randomizou dose plena contra reduzida. Esquema menor não substitui profilaxia; ausência de benefício também contradiz o ensaio. A dose histórica citada está completa em unidade/intervalo, sem prescrever o caso pelo texto isolado. Eliminatórios: nenhum. Fontes: TESTING2022 Methods/Intervention/Table2/AdverseEvents;KDIGO2025Rec1.4.3.2ePP1.4.3.2–3.

Mantidos OP, competência, conceito correto e raciocínio central reconhecível. Mudanças de fonte/redação/distrator/dificuldade preservamqid/FSRS conformeHandbook18.5.

Patch editorial sugerido (exato):

~~~json
{
  "t": "IgAN — TESTING e Corticoide Sistêmico",
  "qid": "d81defbb",
  "q": "Pessoa com nefropatia por imunoglobulina A (IgA) primária em risco de progressão, com nefroproteção otimizada, não tem acesso a Nefecon. Ao discutir metilprednisolona sistêmica segundo a KDIGO 2025, qual síntese é mais adequada?",
  "refs": [
    "testing_study",
    "kdigo_igan_igav_2025"
  ],
  "opts": [
    "Benefício renal com risco de toxicidade; considerar esquema reduzido, profilaxia e seleção individual",
    "Benefício renal maior com dose plena; preferi-la porque superou o esquema reduzido no TESTING",
    "Ausência de benefício em função renal; evitar corticoide mesmo após seleção criteriosa de risco",
    "Benefício renal com risco infeccioso; usar dose reduzida em substituição à profilaxia"
  ],
  "ans": 0,
  "exp": "O TESTING demonstrou benefício no composto de perda de função renal, falência renal ou morte por doença renal, com maior incidência de eventos adversos graves, sobretudo no protocolo de dose plena. As coortes de dose plena e reduzida não foram comparadas diretamente por randomização para estabelecer superioridade entre as doses. Quando Nefecon não está disponível, a KDIGO 2025 sugere esquema sistêmico reduzido com profilaxia e avaliação individual de benefício e toxicidade. A fase de protocolo reduzido usou dose inicial de metilprednisolona de 0,4 mg/kg/dia, máximo 32 mg/dia, seguida de desmame. A profilaxia contra Pneumocystis jirovecii não é substituída pela dose menor. Função renal muito reduzida, diabetes ou prediabetes, obesidade e infecções, entre outros fatores, aumentam o risco; não há indicação automática para toda pessoa que ultrapasse um limiar de proteinúria.",
  "diff": "medium",
  "cat": "glomerular"
}
~~~

## f7107bc3

Veredito: aprovada. Confiança alta. Score19/20. OP: Relacionar a liberação ileal direcionada de budesonida ao curso estudado e à reavaliação após suspensão na IgAN.. Compreender/Sabe/medium. Integra mecanismo, formulação e limite temporal, porém sem caso complexo ou alternativa de linha terapêutica; hard não sustentado só por nome de fármaco. Evitar converter a revisão em ensaio novo ou terapia indefinida.

Formulação ileal específica e curso randomizado de nove meses não significam resposta permanente nem intercâmbio entre formulações.

Advogado do Recurso: B confunde manutenção posterior com o protocoloNefIgArd, que teve15meses sem estudo. C troca íleo por cólon;D extrapola bioequivalência/eficácia de outra formulação. São erros plausíveis de curso/formulação; não há farmacologia glomerular inventada. O comando delimita o ensaio, sem negar estudos posteriores de manutenção. Eliminatórios: nenhum. Fontes: NefIgArd2023Methods/Interpretation;KDIGO2025Rec1.4.3.1eConsiderationsforimplementation S41–42.

Mantidos OP, competência, conceito correto e raciocínio central reconhecível. Mudanças de fonte/redação/distrator/dificuldade preservamqid/FSRS conformeHandbook18.5.

Patch editorial sugerido (exato):

~~~json
{
  "t": "Nefecon — Eixo Intestino-Rim e Curso Limitado",
  "qid": "f7107bc3",
  "q": "Em adultos com nefropatia por imunoglobulina A (IgA) primária em risco de progressão, qual afirmação integra corretamente a finalidade da liberação direcionada e o curso de Nefecon estudado no NefIgArd?",
  "refs": [
    "nefigard_trial",
    "kdigo_igan_igav_2025"
  ],
  "opts": [
    "Liberação ileal para modular a imunidade de mucosa; curso de nove meses, sem garantia de resposta permanente",
    "Liberação ileal para induzir remissão; o protocolo prevê manutenção em dose menor após os nove meses",
    "Liberação no cólon para modular a imunidade de mucosa; curso de nove meses com reavaliação posterior",
    "Budesonida de outras formulações intestinais pode reproduzir o regime, com a mesma dose e duração"
  ],
  "ans": 0,
  "exp": "Nefecon é uma formulação específica de budesonida com liberação no íleo terminal, desenhada para atuar no tecido linfoide intestinal e modular a produção de formas patogênicas de IgA e imunocomplexos. O local-alvo é o íleo terminal, e não o cólon. O NefIgArd avaliou 16 mg/dia por nove meses, com suporte otimizado mantido e quinze meses adicionais sem o medicamento do estudo, não manutenção em dose menor no protocolo randomizado. Houve benefício médio frente a placebo, mas isso não significa cura ou manutenção de resposta em cada pessoa: após a suspensão, a proteinúria pode aumentar e a função renal pode voltar a cair. A continuidade do cuidado e a reavaliação são necessárias; o ensaio não valida intercâmbio automático com qualquer formulação de budesonida nem uso indefinido sem revisão.",
  "diff": "medium",
  "cat": "glomerular"
}
~~~

## ff676013

Veredito: aprovada. Confiança alta. Score19/20. OP: Reconhecer exposição sistêmica residual da budesonida direcionada e vigilância glicêmica/infecciosa em pessoa com prediabetes.. Aplicar/Sabe como/easy. Reavaliado o comando final em relação ao cego inicialmedium: uma orientação direta de vigilância de efeito sistêmico residual, sem conflito de tratamentos, permiteAplicar/easy. A dificuldade não deriva de prediabetes como palavra rara nem do comprimento da opção.

Exposição sistêmica residual justifica vigilância de glicemia e infecção na prediabetes; resposta renal não comprova ausência de toxicidade.

Advogado do Recurso: Não há contraindicação absoluta por prediabetes na orientação citada. A formulação não é exclusivamente tópica; quatro casos de diabetes nos prediabéticos são descritos noKDIGO. Não se promete segurança só por reduzir proteinúria. Eliminatórios: nenhum. Fontes: KDIGO2025S41Harms eConsiderationsforimplementation;NefIgArd2023segurança noresumo.

Mantidos OP, competência, conceito correto e raciocínio central reconhecível. Mudanças de fonte/redação/distrator/dificuldade preservamqid/FSRS conformeHandbook18.5.

Patch editorial sugerido (exato):

~~~json
{
  "t": "Nefecon — Exposição Sistêmica Residual",
  "qid": "ff676013",
  "q": "Pessoa com nefropatia por imunoglobulina A (IgA) primária e prediabetes iniciará Nefecon. Qual orientação de segurança é mais apropriada?",
  "opts": [
    "Manter vigilância glicêmica e avaliar riscos de infecção, pois há exposição sistêmica residual",
    "Dispensar vigilância glicêmica e infecciosa, pois a liberação ileal limita o efeito ao intestino",
    "Negar o tratamento por prediabetes, considerada contraindicação absoluta à formulação",
    "Substituir a vigilância clínica pela queda da proteinúria, que confirma ausência de toxicidade"
  ],
  "ans": 0,
  "exp": "A liberação no íleo não elimina a absorção sistêmica da budesonida nem seus possíveis efeitos de glicocorticoide. A KDIGO 2025 considera justificável vigilância glicêmica mais intensa na prediabetes e orienta avaliar infecções latentes, como hepatites virais e tuberculose, antes do tratamento. No NefIgArd, quatro participantes com prediabetes no início evoluíram para diabetes durante os nove meses de Nefecon. Isso exige avaliação individual e acompanhamento, sem tornar a prediabetes uma contraindicação absoluta para todas as pessoas. Queda de proteinúria indica resposta renal, mas não exclui toxicidade metabólica ou infecciosa.",
  "diff": "easy",
  "cat": "glomerular",
  "refs": [
    "nefigard_trial",
    "kdigo_igan_igav_2025"
  ]
}
~~~

