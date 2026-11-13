# Revisão independente de seis cards integrais

{
  "schema": 1,
  "reviewer": "/root/medical_answer_bias (independente deautoriaanemia_authoring)",
  "reviewDate": "2026-11-13",
  "norms": {
    ".claude/skills/revisar-nefroquest/SKILL.md": "6027e111ff75ff8798aad8d4ef10daf231fefeca65317d53de9a2fc6a891aeef",
    ".claude/skills/revisar-nefroquest/references/output-contract.md": "4a20348ac71a07836b4611d574496d97960b27a2bbfdcf1f1ed318396f0edcb8",
    ".claude/skills/revisar-nefroquest/references/verification-protocol.md": "ba8d2ebfb23be11e7d7ee2cb312717f1cb6a3b38e03b77d4f97d5160b16810dc",
    "docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md": "4091dc76cadf6299e5da46333c23cf47abf79274612c9c47a1e181832347f913",
    "docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md": "1b71d58a80811fd0cdcc04551f50f2f110cda4b1b7c518e6166779cb540bf9df",
    "docs/editorial/annex-c-nefrologia.md": "d38f8df3102b2967de442902d6f81627ac28c1a733b831e186153a49de1972fe"
  },
  "candidateFiles": {
    "mbd-candidates-A4.json": "ab258bef68c02a36ee18b40e3a4a2ec5a3fc9487e683ee78ed393bc2a05db77f",
    "mbd-card-proposals-A2.json": "eed97f2a1768301712a6a277508129fbc2b0c871fd382fe765f1d82d865b2412",
    "mbd-physiology-reference-A3.json": "0906425bea8a9fbe65976f7efabc101b0a2eed80bb0911008335b16757098326"
  },
  "independentSourceVerification": {
    "MBD2017": {
      "url": "https://kdigo.org/wp-content/uploads/2017/02/2017-KDIGO-CKD-MBD-GL-Update.pdf",
      "access": "PDFoficial60p aberto; recomendações3.2.2–3.2.3,4.1.1–4.1.6,4.2.1–4.2.5e discussão foram lidas independentemente. Nenhuma diretriz2026foi inventada por dataupload."
    },
    "MBD2009": {
      "url": "https://kdigo.org/wp-content/uploads/2017/02/KDIGO-2009-CKD-MBD-Guideline-English.pdf",
      "access": "PDFoficialintegral aberto;S34histologia/TMV,S45célulasvasculares e fundamentos consultados; não importar terapias antigas contra2017."
    },
    "KDIGO2025_REPORT": {
      "url": "https://kdigo.org/wp-content/uploads/2025/02/KDIGO-2025-CKD-MBD-Controversies-Conference-Report_Final.pdf",
      "access": "Relatório oficial integral19p aberto, distinção conferência/diretriz e manutenção geral das recomendações2017verificadas; pós-transplante após1ano requer individualização."
    },
    "GOHIL2019": {
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7040960/",
      "access": "Texto integral aberto noPMC; seçõesFGF23/PTH/NaPi/vitaminaD lidas, sem alegar ensaio clínico de benefício naDRC."
    },
    "MECHANISM_ABSTRACTS": {
      "url": "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:15040831%20OR%20EXT_ID:9465116%20OR%20EXT_ID:10330054%20OR%20EXT_ID:21726676%20OR%20EXT_ID:21389978&format=xml&resultType=core",
      "sha256": "873a493ee7cb7ef0274874acf6b08c932ec8a677bf553124ecc2263a0a23e20b",
      "access": "Cinco resumos primários completos lidos independentemente; modelos animais/celulares e análise transversal mantêm limites de causalidade/aplicação humana."
    },
    "JONO": {
      "url": "https://pubmed.ncbi.nlm.nih.gov/11009570/",
      "doi": "10.1161/01.res.87.7.e10",
      "responseSha256": "27c8c60ce40ec0515284809b893bcaf61559df2d6aed94e01a7dde50adc7ae38",
      "access": "Resumo primário completo viaEuropePMC lido; células aórticas humanas in vitro, marcadores osteogênicos e mineralização, sem inferência de desfecho clínico."
    },
    "BLOCK2012": {
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3402292/",
      "access": "Artigo primário integral aberto e lidoMethods/Results/Discussion:148,9meses,primáriofósforo,CTsubamostra,FGF23agrupado,22%urinário e direção de calcificação conferidos."
    },
    "RCT_ABSTRACTS": {
      "url": "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:17728707%20OR%20EXT_ID:23121374%20OR%20EXT_ID:28097356&format=xml&resultType=core",
      "sha256": "3f98d0771783d34ccce228e019f98dd22893022efb8d0cf3aa9cc8800ece840b",
      "access": "Três resumos primários integraisDCOR/EVOLVE/etelcalcetida lidos independentemente; não se alega fulltextNEJM/JAMA não aberto."
    },
    "EVOLVE_DOSE": {
      "url": "https://clinicaltrials.gov/api/v2/studies/NCT00345839",
      "sha256": "9eb86a0b0942ed0e5c648f8ad050b2f7d33fa1d64a0e6e45e22417018b09a632",
      "access": "Registro primário público lido; titulação30/60/90/120/180mgQD, máximo180confirmado."
    },
    "CRUZADO": {
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4978046/",
      "doi": "10.1681/ASN.2015060622",
      "responseSha256": "16e975bd8ddaba0c8e40cf62f09202164ff17faeea3fa2e7b5b335ffde3e0578",
      "access": "Resumo primário completoPMID26647424lido viaEuropePMC:30,≥6meses,eGFR>30,12mesesnormocalcemia15/15vs10/15P.04,colo/fosfato/hipocalcemia. PMCdireto não abriu; não declarar fulltext. Nenhum candidato depende de detalhe ausente do resumo."
    }
  },
  "cards": [
    {
      "id": "phosphate_binders_ckd",
      "unitType": "reference_card",
      "version": "A2",
      "candidate": {
        "label": "Block GA et al. — Phosphate Binders in Moderate CKD (JASN 2012)",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3402292/",
        "journal": "J Am Soc Nephrol. 2012;23(8):1407–1415",
        "ano": 2012,
        "tipo": "Ensaio clínico randomizado",
        "badge": "RCT",
        "badgeColor": "#10b981",
        "impacto": "Quelantes reduziram modestamente o fósforo, mas aumentaram calcificação no ensaio",
        "icon": "🔬",
        "resumo": "Ensaio piloto de 9 meses com 148 pessoas com doença renal crônica (DRC) não dialítica, taxa de filtração glomerular estimada (TFGe) 20–45 mL/min/1,73 m² e fósforo normal ou quase normal. Comparou acetato de cálcio, carbonato de lantânio ou carbonato de sevelamer com placebo. O desfecho primário foi a mudança do fósforo sérico: de 4,2 para 3,9 mg/dL com tratamento ativo e para 4,1 mg/dL com placebo (P=0,03). O paratormônio (PTH) permaneceu estável com tratamento ativo, mas o fator de crescimento de fibroblastos 23 (FGF23) não se reduziu na comparação agrupada. Na subamostra com tomografia, houve maior progressão de calcificação coronariana e de aorta abdominal com tratamento ativo, mais pronunciada com acetato de cálcio. Não avaliou benefício em mortalidade.",
        "conclusao": "O ensaio não sustenta iniciar quelantes rotineiramente na DRC não dialítica com fósforo normal nem afirma redução de calcificação vascular.",
        "curiosidade": "Na análise agrupada, o tratamento reduziu o fósforo urinário em 22%, embora o efeito sobre fósforo sérico tenha sido modesto. Desfechos de subamostras e de cada quelante exigem cautela."
      },
      "candidateHash": "d5bfbbbda7ee09dbaa3ca79b568cc5f9f99ccf4fc4b9450cbeb8c9bad994ca06",
      "originalHash": "8016c79db5be6302cf2c51728a2a6953e9914246dc0ff52b1ed61862ddcfe43d",
      "verdict": "aprovada",
      "confidence": "alta",
      "evidence": "VERIFICADA",
      "pending": "NENHUMA",
      "publication": "LIBERADA",
      "eliminators": [],
      "score": 20,
      "scope": "Card integral conferido, não apenas campos alterados. Desenho,população,números,resultados,limites e identidade bibliográfica verificados.",
      "currentConsumers": [
        {
          "qid": "efba1640",
          "t": "DRC-MBD — FGF23 Precoce",
          "hash": "13d2727d48f1b7d22c2e70a2efd0c5387f929378741c9f443e8ea29511235a76",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "phosphate_binders_ckd"
          ],
          "insideMbd24": true
        },
        {
          "qid": "1366b930",
          "t": "DRC-MBD — Hiperparatireoidismo Secundário Inicial",
          "hash": "8ed6cc39dd58f8ac5cf8865249f7fae9fbf40f5bc7fc1c0877802a2dad6fda09",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "phosphate_binders_ckd"
          ],
          "insideMbd24": true
        },
        {
          "qid": "d4b2aa68",
          "t": "Quelantes de Fósforo na DRC — Comparação",
          "hash": "1a2abf194c1fecbf4e1e5b556ff0c416438f16bb52121d927dbf3621a37586bf",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "phosphate_binders_ckd"
          ],
          "insideMbd24": true
        },
        {
          "qid": "8ba55c24",
          "t": "DMO-DRC — FGF23 e fosfatúria",
          "hash": "64257ec83a05a39b80d83413514b5d1df45b2e557b9f9719f8d6f76a7be99a9e",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "phosphate_binders_ckd"
          ],
          "insideMbd24": true
        },
        {
          "qid": "ffee06f0",
          "t": "DMO-DRC — FGF23 e calcitriol",
          "hash": "8d475944798a1131b7e1d709a6218d4468f86ab7545d6b5546f341666502f2d9",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "phosphate_binders_ckd"
          ],
          "insideMbd24": true
        },
        {
          "qid": "22189222",
          "t": "DMO-DRC — sequência FGF23-calcitriol-PTH",
          "hash": "948e5431d9e49064fb4efe623512d2fa3dcdc44b955b9a65929ae29ea8ae89b4",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "phosphate_binders_ckd"
          ],
          "insideMbd24": true
        }
      ],
      "plannedConsumers": [],
      "unchangedCurrentConsumers": [
        {
          "qid": "22189222",
          "t": "DMO-DRC — sequência FGF23-calcitriol-PTH",
          "hash": "948e5431d9e49064fb4efe623512d2fa3dcdc44b955b9a65929ae29ea8ae89b4",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "phosphate_binders_ckd"
          ],
          "insideMbd24": true
        }
      ],
      "consumerCompatibility": "Cinco consumidores em reescrita removem esta referência clínica inadequada ao mecanismo e usam revisão fisiológica/documentobase.221permanece intacto/bloqueado por duplicidade: o cardRCTcorrigido não contradiz o seu gabarito, sustentado independentemente porKDIGO2017. A correção de resultado invertido do card não depende de reaprovar a duplicata.",
      "historyRequirement": "Arquivar card antigo e versão anterior de todos consumidores atuais, inclusive221semreescrita/retido. IDsnovos só após verificar inexistência/duplicidade. Card não libera questão.",
      "verifiedSource": "BLOCK2012",
      "newCard": false
    },
    {
      "id": "dcor_trial",
      "unitType": "reference_card",
      "version": "A2",
      "candidate": {
        "label": "Suki WN et al. — DCOR (Kidney Int 2007)",
        "url": "https://doi.org/10.1038/sj.ki.5002466",
        "journal": "Kidney Int. 2007;72(9):1130–1137",
        "ano": 2007,
        "tipo": "Ensaio clínico randomizado",
        "badge": "RCT",
        "badgeColor": "#10b981",
        "impacto": "Sevelamer não demonstrou menor mortalidade geral que quelantes cálcicos no DCOR",
        "icon": "🔬",
        "resumo": "Ensaio multicêntrico, randomizado e aberto com 2103 pessoas em hemodiálise, comparando sevelamer a quelantes à base de cálcio. Avaliou mortalidade geral e por causas específicas; não encontrou diferença estatisticamente significativa na população total. Houve interação com idade e sinal favorável de mortalidade geral em pessoas acima de 65 anos, sem comprovação de menor mortalidade cardiovascular nesse subgrupo. Apenas 1068 participantes completaram o estudo. Esses achados de subgrupo não substituem o resultado principal neutro.",
        "conclusao": "O DCOR não comprovou superioridade de sobrevida geral do sevelamer. Resultados de outros estudos sobre calcificação ou hipercalcemia não devem ser apresentados como desfechos demonstrados pelo DCOR.",
        "curiosidade": "O ensaio foi desenhado para mortalidade; a descrição de menor progressão de calcificação coronariana não pertence aos resultados principais deste estudo."
      },
      "candidateHash": "1302b89b030b51fe7031180355810bf23f6b4539764b48184ae01467786cbb64",
      "originalHash": "c5b640cd24f8c10c3ed19e854e48c42a81ca0455f6fb3101ba34ecbfaf68f604",
      "verdict": "aprovada",
      "confidence": "alta",
      "evidence": "VERIFICADA",
      "pending": "NENHUMA",
      "publication": "LIBERADA",
      "eliminators": [],
      "score": 20,
      "scope": "Card integral conferido, não apenas campos alterados. Desenho,população,números,resultados,limites e identidade bibliográfica verificados.",
      "currentConsumers": [
        {
          "qid": "67035e0e",
          "t": "Quelantes de Fosfato — Sevelamer vs Quelantes com Cálcio",
          "hash": "260fa56f52858050aee1fcdc1150d0ebf507c544be90582bea097da688055063",
          "refs": [
            "kdigo_ckd_mbd_2017",
            "dcor_trial"
          ],
          "insideMbd24": true
        }
      ],
      "plannedConsumers": [],
      "unchangedCurrentConsumers": [],
      "consumerCompatibility": "Consumidor670substitui fonteRCTde mortalidade por fundamento específico de composição/segurança, sem prometer sobrevida. Cardcorrigido preserva estudo e não cria contradição.",
      "historyRequirement": "Arquivar card antigo e versão anterior de todos consumidores atuais, inclusive221semreescrita/retido. IDsnovos só após verificar inexistência/duplicidade. Card não libera questão.",
      "verifiedSource": "DCOR2007",
      "newCard": false
    },
    {
      "id": "evolve_trial",
      "unitType": "reference_card",
      "version": "A2",
      "candidate": {
        "label": "Chertow GM et al. — EVOLVE (NEJM 2012)",
        "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa1205624",
        "journal": "N Engl J Med 2012;367(26):2482-2494",
        "ano": 2012,
        "tipo": "Ensaio Clínico RCT",
        "badge": "RCT",
        "badgeColor": "#10b981",
        "impacto": "Cinacalcete não reduziu o composto primário na análise não ajustada por intenção de tratar",
        "icon": "🔬",
        "resumo": "Ensaio clínico randomizado multicêntrico (EVOLVE, n=3.883), em pacientes em hemodiálise com hiperparatireoidismo secundário moderado a grave, comparando cinacalcet titulado até 180 mg/dia vs placebo, sobre tratamento usual. O desfecho primário composto — morte por qualquer causa ou primeiro evento cardiovascular não fatal, incluindo infarto do miocárdio, hospitalização por angina instável, insuficiência cardíaca ou evento vascular periférico — não foi reduzido de forma estatisticamente significativa na análise primária por intenção de tratar: razão de riscos (HR) 0,93 (intervalo de confiança [IC] 95% 0,85–1,02; P=0,11). Análises ajustadas e de sensibilidade sugeriram possível benefício, mas não substituem o resultado primário neutro.",
        "conclusao": "EVOLVE mostrou que cinacalcet melhora controle bioquímico do hiperparatireoidismo secundário, mas não comprovou redução significativa de mortalidade ou eventos cardiovasculares maiores na análise primária.",
        "curiosidade": "O EVOLVE é um exemplo clássico de dissociação entre controle laboratorial e desfecho duro: reduzir paratormônio (PTH), cálcio e fósforo é clinicamente útil, mas isso não se traduziu claramente em menor mortalidade cardiovascular no trial."
      },
      "candidateHash": "dc3da1fd6a67fbd206f82d2b6ba63fcd70142910ea3cff9022b1d86eee88b458",
      "originalHash": "e82214dea1d9de241b3bab61f5db8c8e0cb498e53eec5cb783c44484a7bf10f8",
      "verdict": "aprovada",
      "confidence": "alta",
      "evidence": "VERIFICADA",
      "pending": "NENHUMA",
      "publication": "LIBERADA",
      "eliminators": [],
      "score": 20,
      "scope": "Card integral conferido, não apenas campos alterados. Desenho,população,números,resultados,limites e identidade bibliográfica verificados.",
      "currentConsumers": [
        {
          "qid": "0f739fb4",
          "t": "Distúrbio Mineral Ósseo na DRC",
          "hash": "99c73e1b0b3920a2201f5a92cd176138bef3489d315f5388ef939c865db7c47d"
        },
        {
          "qid": "666e748d",
          "t": "DMO-DRC — Calcimimético no Hiperparatireoidismo Secundário",
          "hash": "8ca3437ab509c1e8770152eed2653c37f97467c14e9cb082dca5bad275b31fb3"
        }
      ],
      "plannedConsumers": [
        {
          "qid": "666e748d",
          "candidateHash": "4c612cb089832e6f52c6567ef5f78e04a2aef4e9d55a2a88ff9be10afc70560c"
        }
      ],
      "unchangedCurrentConsumers": [],
      "consumerCompatibility": "0fremove referência desnecessária para fisiologia;666continua e explicita análise primária não ajustada neutra. Osdois históricos devem ser preservados.",
      "historyRequirement": "Arquivar card antigo e versão anterior de todos consumidores atuais, inclusive221semreescrita/retido. IDsnovos só após verificar inexistência/duplicidade. Card não libera questão.",
      "verifiedSource": "EVOLVE2012+registroNCT00345839",
      "newCard": false
    },
    {
      "id": "gohil_imel_fgf23_phosphate_2019",
      "unitType": "reference_card",
      "version": "NEW-A3",
      "candidate": {
        "label": "Gohil & Imel — FGF23 e regulação de fosfato (2019)",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7040960/",
        "journal": "Pediatr Endocrinol Rev. 2019;17(1):17–34",
        "ano": 2019,
        "tipo": "Revisão narrativa fisiológica e clínica",
        "badge": "REVIEW",
        "badgeColor": "#8b5cf6",
        "impacto": "Hormônios regulam a reabsorção renal de fosfato e a ativação da vitamina D",
        "icon": "🔬",
        "resumo": "Revisão sobre a biologia do fator de crescimento de fibroblastos 23 (FGF23) e doenças de perda renal de fosfato. Descreve menor expressão apical dos cotransportadores sódio-fosfato NaPi-IIa/IIc com FGF23 e paratormônio (PTH), reduzindo reabsorção proximal de fosfato. FGF23 reduz CYP27B1/1α-hidroxilase e aumenta CYP24A1/24-hidroxilase, diminuindo calcitriol. A interação entre PTH, FGF23, cálcio e vitamina D é complexa; experimentos e estudos humanos não sustentam uma negação universal de regulação PTH–FGF23. Usada como referência de mecanismo básico, conferida contra trabalhos experimentais originais; não como diretriz terapêutica da doença renal crônica (DRC).",
        "conclusao": "Sustenta os mecanismos renais de fosfato e vitamina D; não demonstra benefício clínico de manipular FGF23 em pessoas com DRC.",
        "curiosidade": "A revisão distingue evidência experimental de resultados humanos, que podem variar conforme o tempo de exposição ao PTH."
      },
      "candidateHash": "d875c9444358d38f0306e96ff027c54f7335de1651c744c20f243d6a0ac21ef1",
      "originalHash": null,
      "verdict": "aprovada",
      "confidence": "alta",
      "evidence": "VERIFICADA",
      "pending": "NENHUMA",
      "publication": "LIBERADA",
      "eliminators": [],
      "score": 20,
      "scope": "Card integral conferido, não apenas campos alterados. Desenho,população,números,resultados,limites e identidade bibliográfica verificados.",
      "currentConsumers": [],
      "plannedConsumers": [
        {
          "qid": "efba1640",
          "candidateHash": "d81a309452c0f91b2e710cc016d50cdfeba894ff8215e026f1b0613342fb5dee"
        },
        {
          "qid": "38c82254",
          "candidateHash": "3e2e5d809e918178e5ed5f93df8e52806f8b5c1cec65e70f2002db4f03207a77"
        },
        {
          "qid": "1366b930",
          "candidateHash": "0446505b28b21552a487ef95d4d935cb0b33fccfbb8be298e81dd22d856bc937"
        },
        {
          "qid": "8ba55c24",
          "candidateHash": "fe95b2a66dbb5860a5009f702971beed46b8d73ee5f5bab40db875ff7a8e516f"
        },
        {
          "qid": "ffee06f0",
          "candidateHash": "548e28c46a37164656df1cb9b79e3fb4675802d7dd7a231547efdb2d51110a26"
        },
        {
          "qid": "50d30738",
          "candidateHash": "2e753cf30b5827ec075947ef52a950d7f71d97e6480212bdac83a344f3726c73"
        },
        {
          "qid": "0792a38e",
          "candidateHash": "2afcc572969214a1d608d9fa0c85b6b546db304e57f6b1db68c7bb8764086c0b"
        }
      ],
      "unchangedCurrentConsumers": [],
      "consumerCompatibility": "Todos novos vínculos correspondem aos fundamentos/ensaio descritos, sem extrapolação terapêutica; nenhuma referênciaIsakovafoi inserida.",
      "historyRequirement": "Arquivar card antigo e versão anterior de todos consumidores atuais, inclusive221semreescrita/retido. IDsnovos só após verificar inexistência/duplicidade. Card não libera questão.",
      "verifiedSource": "GOHIL2019+experimentosprimários",
      "newCard": true
    },
    {
      "id": "kdigo_ckd_mbd_2009",
      "unitType": "reference_card",
      "version": "NEW-A3",
      "candidate": {
        "label": "KDIGO CKD-MBD 2009 — documento-base",
        "url": "https://kdigo.org/wp-content/uploads/2017/02/KDIGO-2009-CKD-MBD-Guideline-English.pdf",
        "journal": "Kidney Int. 2009;76(Suppl113):S1–S130",
        "ano": 2009,
        "tipo": "Diretriz internacional — documento-base histórico",
        "badge": "GUIDELINE",
        "badgeColor": "#6366f1",
        "impacto": "Histologia e mecanismos do distúrbio mineral e ósseo na doença renal crônica; condutas seguem a atualização de 2017",
        "icon": "📋",
        "resumo": "Documento-base KDIGO de distúrbio mineral e ósseo na doença renal crônica (DMO-DRC), complementado e seletivamente atualizado em 2017. Explica a classificação da osteodistrofia por turnover, mineralização e volume: osteomalácia envolve osteoide aumentado e atraso de mineralização; doença adinâmica tem formação muito baixa sem esse padrão. Descreve a transformação osteogênica de células musculares lisas na calcificação vascular. Neste acervo, é usado para esses fundamentos histológicos e fisiopatológicos. Recomendações terapêuticas devem ser lidas junto à atualização de 2017, não reaplicadas como se não tivessem sido revistas.",
        "conclusao": "Sustenta a interpretação histológica e os mecanismos básicos; a atualização de 2017 orienta as recomendações clínicas atuais.",
        "curiosidade": ""
      },
      "candidateHash": "f8420ccc518cf2ae2d7a5eae626589c5ea76dc7e5c81d7f40de6fcc18c1e9e2f",
      "originalHash": null,
      "verdict": "aprovada",
      "confidence": "alta",
      "evidence": "VERIFICADA",
      "pending": "NENHUMA",
      "publication": "LIBERADA",
      "eliminators": [],
      "score": 20,
      "scope": "Card integral conferido, não apenas campos alterados. Desenho,população,números,resultados,limites e identidade bibliográfica verificados.",
      "currentConsumers": [],
      "plannedConsumers": [
        {
          "qid": "67035e0e",
          "candidateHash": "e5c26f21b33f751415819d05558040cdf68851f486c9884bc39b2342f9f0529e"
        },
        {
          "qid": "0f739fb4",
          "candidateHash": "dc7b33b16c7c6a411526828603ab619f924db6fdcec6758ec98198d3c01b05c0"
        },
        {
          "qid": "d4b2aa68",
          "candidateHash": "32799021efab6a51aa33020123b47c05a4d1b5f5f8cf08e3af598667f92b7a51"
        },
        {
          "qid": "c9da6fdf",
          "candidateHash": "17d2d29bb3c726bbbe31746f1bec1879b06dc4a7ed181ab64b899f68732da508"
        },
        {
          "qid": "2f2cdd55",
          "candidateHash": "10309746954b22f68f2f7f378709e3314f1b947db929474bf4cc7b81940befad"
        }
      ],
      "unchangedCurrentConsumers": [],
      "consumerCompatibility": "Todos novos vínculos correspondem aos fundamentos/ensaio descritos, sem extrapolação terapêutica; nenhuma referênciaIsakovafoi inserida.",
      "historyRequirement": "Arquivar card antigo e versão anterior de todos consumidores atuais, inclusive221semreescrita/retido. IDsnovos só após verificar inexistência/duplicidade. Card não libera questão.",
      "verifiedSource": "MBD2009",
      "newCard": true
    },
    {
      "id": "cruzado_post_tx_parathyroidectomy_2016",
      "unitType": "reference_card",
      "version": "NEW-A3",
      "candidate": {
        "label": "Cruzado et al. — Paratireoidectomia versus cinacalcete após transplante (2016)",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4978046/",
        "journal": "J Am Soc Nephrol. 2016;27(8):2487–2494",
        "ano": 2016,
        "tipo": "Ensaio clínico randomizado",
        "badge": "RCT",
        "badgeColor": "#10b981",
        "impacto": "Cirurgia controlou melhor a hipercalcemia em pequeno ensaio pós-transplante",
        "icon": "🔬",
        "resumo": "Ensaio aberto, multicêntrico e randomizado com 30 receptores de transplante há pelo menos 6 meses, hipercalcemia, paratormônio (PTH) elevado e taxa de filtração glomerular estimada (TFGe) >30 mL/min/1,73 m². Comparou cinacalcete (n=15) com paratireoidectomia subtotal (n=15). O desfecho primário foi normocalcemia em 12 meses: 10/15 versus 15/15 (P=0,04), favorável à cirurgia. Houve maior redução de PTH e aumento de densidade mineral no colo femoral no grupo cirúrgico. Hipocalcemia foi evento frequente após cirurgia; intolerância digestiva, com cinacalcete. O tamanho e o seguimento não permitem concluir benefício sobre fratura, mortalidade ou sobrevida do enxerto.",
        "conclusao": "Sustenta considerar avaliação cirúrgica em hiperparatireoidismo hipercalcêmico persistente após transplante, com decisão individual e planejamento de hipocalcemia pós-operatória.",
        "curiosidade": ""
      },
      "candidateHash": "5d22424a1134fc023f813b7622d57ffab100b4a627a79790e668a6ff72cae5b8",
      "originalHash": null,
      "verdict": "aprovada",
      "confidence": "alta",
      "evidence": "VERIFICADA",
      "pending": "NENHUMA",
      "publication": "LIBERADA",
      "eliminators": [],
      "score": 20,
      "scope": "Card integral conferido, não apenas campos alterados. Desenho,população,números,resultados,limites e identidade bibliográfica verificados.",
      "currentConsumers": [],
      "plannedConsumers": [
        {
          "qid": "891b3e02",
          "candidateHash": "f6a4801ff01fa5410077cbd279b18aad7b8a1cae2f7ea4a58479680cad1b9f8c"
        }
      ],
      "unchangedCurrentConsumers": [],
      "consumerCompatibility": "Todos novos vínculos correspondem aos fundamentos/ensaio descritos, sem extrapolação terapêutica; nenhuma referênciaIsakovafoi inserida.",
      "historyRequirement": "Arquivar card antigo e versão anterior de todos consumidores atuais, inclusive221semreescrita/retido. IDsnovos só após verificar inexistência/duplicidade. Card não libera questão.",
      "verifiedSource": "CRUZADO2016",
      "newCard": true
    }
  ],
  "heldCard": {
    "id": "isakova_cric_fgf23_2011",
    "evidence": "VERIFICADA",
    "pending": "DECISIVA",
    "verdict": "redirecionar",
    "publication": "BLOQUEADA",
    "reason": "Análise transversal não deve receberCOHORTporconveniênciada taxonomia fechada. Fonte primária pode apoiar verificação sem inserircardinadequado;nenhum vínculo novo."
  },
  "questionGateNotAutomatic": true
}
