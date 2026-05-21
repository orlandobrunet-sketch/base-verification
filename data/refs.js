const refsDB = {
  brenner_rector:{
    label:"Brenner & Rector's The Kidney",
    url:"https://www.elsevier.com/books/brenner-and-rectors-the-kidney/yu/978-0-323-53265-5",
    journal:"Elsevier (Textbook)",
    ano:2024,
    tipo:"Livro-texto de referência",
    badge:"TEXTBOOK",
    badgeColor:"#64748b",
    impacto:"Livro-texto de referência em nefrologia — fisiologia, fisiopatologia e manejo clínico das doenças renais",
    icon:"📚",
    resumo:"Tratado enciclopédico de nefrologia em dois volumes, cobrindo fisiologia glomerular e tubular, fisiopatologia e manejo clínico de LRA, DRC, glomerulopatias, distúrbios hidroeletrolíticos, hipertensão renal, transplante e diálise. A edição de 2024 incorpora atualizações em iSGLT2, novos biomarcadores e imunossupressão nas glomerulopatias.",
    conclusao:"Referência fundamental da nefrologia — base para compreensão fisiopatológica antes de interpretar qualquer diretriz clínica.",
    curiosidade:"Barry Brenner formulou a hipótese do néfron único: a redução da massa nefrônica induz hiperfiltração compensatória nos néfrons remanescentes, acelerando a progressão da DRC — conceito que fundamenta o uso de IECA e BRA na nefroproteção."
  },
  harrisons_principles:{
    label:"Harrison's Principles of Internal Medicine",
    url:"https://accessmedicine.mhmedical.com/book.aspx?bookid=3095",
    journal:"McGraw-Hill (Textbook)",
    ano:2022,
    tipo:"Livro-texto de referência",
    badge:"TEXTBOOK",
    badgeColor:"#64748b",
    impacto:"Referência em medicina interna — capítulos de nefrologia cobrem síndromes, distúrbios hidroeletrolíticos e DRC",
    icon:"📚"
  },
  kdigo_ckd:{
    label:"KDIGO CKD 2024",
    url:"https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    journal:"Kidney International",
    ano:2024,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Padrão global de manejo da DRC",
    icon:"📋",
    resumo:"Classifica a DRC pelo cruzamento de categorias de TFGe (G1–G5) com albuminúria (A1 <30, A2 30–300, A3 >300 mg/g). A versão 2024 recomenda iSGLT2 para pacientes com TFGe ≥20 e ACR ≥200 mg/g, ou com insuficiência cardíaca independentemente da albuminúria; sugere considerar o uso em TFGe 20–45 com ACR <200 mg/g. Cistatina C é incorporada para melhorar a acurácia da estimativa de TFG em situações selecionadas.",
    conclusao:"O sistema CGA (Causa, TFG, Albuminúria) é o padrão de estadiamento e risco na DRC; a atualização 2024 consolida os iSGLT2 como pilar terapêutico nefroprotetor.",
    curiosidade:"A inclusão dos iSGLT2 na diretriz 2024 representa a primeira vez que uma classe de fármacos originalmente desenvolvida como hipoglicemiante se torna recomendação-padrão para nefroproteção independente da presença de diabetes."
  },
  kdigo_aki:{
    label:"KDIGO AKI 2012",
    url:"https://kdigo.org/guidelines/acute-kidney-injury/",
    journal:"Kidney International Supplements",
    ano:2012,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Critérios universais de diagnóstico e estadiamento da LRA (atualização 2026 em revisão pública)",
    icon:"📋",
    resumo:"Primeira diretriz global que unificou os critérios diagnósticos de LRA: aumento de creatinina ≥0,3 mg/dL em 48h, ≥1,5× basal em 7 dias ou diurese <0,5 mL/kg/h por ≥6h. Estadiamento em 3 estágios. Harmonizou as definições RIFLE e AKIN e estabeleceu o padrão diagnóstico mundial. O draft KDIGO AKI/AKD 2026 (em revisão pública) representa a primeira grande revisão: expande os critérios para incluir cistatina C ≥1,5× basal e introduz o conceito de AKD como alteração funcional ou estrutural renal com duração ≤3 meses, integrando o contínuo LRA → AKD → DRC.",
    conclusao:"Os critérios KDIGO 2012 permanecem o padrão prático de diagnóstico e estadiamento da LRA; o draft de 2026 os expande e os contextualiza em um contínuo de injúria renal aguda a crônica.",
    curiosidade:"Meta-análise global mostrou que aproximadamente 1 em 5 adultos e 1 em 3 crianças desenvolvem LRA durante episódio hospitalar — número revelado pela padronização dos critérios KDIGO, que permitiu comparações sistemáticas entre estudos e países."
  },
  kdigo_aki_2026:{
    label:"KDIGO 2026 AKI/AKD — Public Review Draft",
    url:"https://kdigo.org/wp-content/uploads/2026/03/KDIGO-2026-AKI-AKD-Guideline-Public-Review-Draft-March-2026.pdf",
    journal:"Kidney International (Public Review Draft)",
    ano:2026,
    tipo:"Diretriz Internacional — Public Review Draft",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"AKI definição: ↑Cr ≥0,3 em 48h ou ↑Cr/Cistatina-C ≥50% em 7d ou diurese <0,5 mL/kg/h 6h. Estadiamento 3D (C/U/B). AKD: 7–90d. Biomarcadores TIMP-2×IGFBP7/NGAL (2B). MAP >65 (2C). Teste de furosemida (2C). Glicemia 140–180. Aminoglicosídeo dose única (2B). Anfotericina lipídica (2A). Follow-up pós-AKI/AKD.",
    icon:"📋",
    resumo:"Atualização em draft público da diretriz KDIGO de LRA, primeira grande revisão desde 2012. Expande a definição de AKI para anormalidades funcionais ou estruturais ocorridas em até 7 dias, incluindo creatinina (≥0,3 mg/dL em 48h ou ≥1,5× basal em 7 dias), diurese (<0,5 mL/kg/h por ≥6h), cistatina C (≥1,5× basal em 7 dias) e biomarcadores de dano renal quando validados. Introduz AKD como alteração funcional ou estrutural renal em contexto clínico apropriado com duração ≤3 meses, integrando o contínuo AKI → AKD → DRC.",
    conclusao:"O draft de 2026 amplia o conceito de LRA para um contínuo desde a injúria aguda até a progressão para DRC, reforça o seguimento estruturado pós-AKI e incorpora biomarcadores modernos na estratificação de risco.",
    curiosidade:"O conceito de AKD formaliza uma janela de disfunção renal subaguda entre LRA e DRC, identificada clinicamente mas sem definição padronizada até este draft — período crítico para intervenção e prevenção de progressão."
  },
  sglt2i_aki_meta_2020:{
    label:"SGLT2i e IRA — Meta-análise (Kidney Int 2020)",
    url:"https://pubmed.ncbi.nlm.nih.gov/32437800/",
    journal:"Kidney International",
    ano:2020,
    tipo:"Meta-análise",
    badge:"META",
    badgeColor:"#0ea5e9",
    impacto:"120 ECRs (n=96.722) + 4 estudos observacionais (n=83.934): iSGLT2 reduziu IRA em 36% nos ECRs (OR 0,64; IC 95% 0,53–0,78) e 60% nos estudos observacionais (OR 0,40; IC 95% 0,33–0,48)",
    icon:"🔬"
  },
  permissive_azotemia_2022:{
    label:"Azotemia Permissiva na IRA (Critical Care 2022)",
    url:"https://pubmed.ncbi.nlm.nih.gov/?term=permissive+azotemia+acute+kidney+injury+2022",
    journal:"Critical Care",
    ano:2022,
    tipo:"Artigo Teórico / Revisão",
    badge:"REVIEW",
    badgeColor:"#8b5cf6",
    impacto:"Hipótese: ureia elevada (100–150 mg/dL) estimula EGF, HGF, IGF-1, reduz inflamação e fibrose e promove regeneração renal. TRS com clearance reduzido por 7–10d pode acelerar recuperação renal (requer validação clínica)",
    icon:"🔬"
  },
  kdigo_gn:{
    label:"KDIGO Glomerular Diseases 2021",
    url:"https://kdigo.org/guidelines/glomerular-diseases/",
    journal:"Kidney Int 2021;100(4S):S1-S276",
    ano:2021,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Referência global para diagnóstico e tratamento das glomerulopatias",
    icon:"📋",
    resumo:"Primeira diretriz KDIGO dedicada às glomerulopatias, cobrindo síndrome nefrótica de lesões mínimas, GESF, nefropatia membranosa, nefropatia por IgA, nefrite lúpica, vasculites ANCA, C3 glomerulopatia e MPGN. Incorpora biomarcadores serológicos no diagnóstico — anti-PLA2R (presente em cerca de 70–80% dos casos de nefropatia membranosa primária) e ANCA-PR3/MPO — e gradua recomendações pelo sistema GRADE. Alguns capítulos foram complementados por atualizações posteriores específicas, como a diretriz dedicada à IgAN 2025; usar em conjunto com fontes mais recentes quando disponíveis.",
    conclusao:"Referência unificada para diagnóstico e imunossupressão nas glomerulopatias — substituiu capítulos fragmentados de diretrizes anteriores.",
    curiosidade:"O anti-PLA2R, descoberto por Beck et al. em 2009 (NEJM), permite o diagnóstico sorológico da nefropatia membranosa primária em contextos típicos — reduzindo a dependência exclusiva da biópsia renal — e serve como marcador de atividade e resposta ao tratamento pelo título sérico."
  },
  kdigo_tx:{
    label:"KDIGO Transplant Recipient Care 2009",
    url:"https://kdigo.org/guidelines/transplant-recipient-care/",
    journal:"Am J Transplant 2009;9(Suppl 3):S1-S155",
    ano:2009,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Manejo do receptor de transplante renal — imunossupressão, infecções e complicações",
    icon:"📋",
    resumo:"Diretriz abrangente para manejo do receptor de transplante renal, cobrindo imunossupressão (esquemas baseados em inibidor de calcineurina e antiproliferativo, com ou sem corticoide, individualizados por risco imunológico), monitorização do enxerto, rejeição aguda e crônica, infecções oportunistas (CMV, BK, PCP), doença cardiovascular, neoplasia e complicações metabólicas a longo prazo.",
    conclusao:"Referência-base para o acompanhamento do transplantado renal — da imunossupressão de indução ao manejo das complicações tardias.",
    curiosidade:"A introdução do tacrolimo marcou a consolidação dos inibidores de calcineurina como eixo da imunossupressão moderna, reduzindo a rejeição aguda e melhorando a sobrevida inicial do enxerto renal de forma expressiva."
  },
  dapa:{
    label:"DAPA-CKD Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2024816",
    journal:"New England Journal of Medicine",
    ano:2020,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓39% desfecho renal composto · ↓31% mortalidade · Interrompido precocemente por eficácia · Benefício independente de diabetes",
    icon:"💊",
    resumo:"ECR multicêntrico, n=4.304, dapagliflozina 10 mg/dia vs placebo em DRC com ou sem DM2; TFGe 25–75 e ACR 200–5000 mg/g. Desfecho primário: queda sustentada ≥50% da TFGe, DRCT ou morte renal/CV. Resultado: 9,2% vs 14,5%; HR 0,61, IC 95% 0,51–0,72, P<0,001; NNT 19. Também reduziu morte por qualquer causa: 4,7% vs 6,8%; HR 0,69, IC 95% 0,53–0,88.",
    conclusao:"DAPA-CKD foi o trial pivô que mostrou nefroproteção dos iSGLT2 independente de diabetes em DRC proteinúrica.",
    curiosidade:"32,5% da coorte não tinha DM2, dado que ajudou a deslocar os iSGLT2 de fármacos 'antidiabéticos' para fármacos cardiorrenais."
  },
  empa:{
    label:"EMPA-KIDNEY Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2204233",
    journal:"New England Journal of Medicine",
    ano:2023,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓28% progressão renal ou morte CV · Benefício independente de DM",
    icon:"💊",
    resumo:"ECR multicêntrico, n=6.609, avaliou empagliflozina 10 mg/dia em DRC ampla: TFGe 20–<45 independente de albuminúria ou TFGe 45–<90 com ACR ≥200 mg/g. Reduziu progressão renal ou morte cardiovascular: 13,1% vs 16,9%; HR 0,72, IC 95% 0,64–0,82, P<0,001. Benefício consistente em diabéticos e não diabéticos e nas faixas de TFGe estudadas.",
    conclusao:"EMPA-KIDNEY consolidou os iSGLT2 como nefroproteção central em DRC ampla, inclusive não diabética, com TFGe ≥20 dentro dos critérios do estudo.",
    curiosidade:"Foi o grande trial de iSGLT2 com maior heterogeneidade etiológica e incluiu proporção expressiva de pacientes sem diabetes."
  },
  hypona:{
    label:"Guideline Hyponatremia ESE/ERA",
    url:"https://academic.oup.com/ndt/article/29/suppl_2/i1/1843686",
    journal:"Nephrology Dialysis Transplantation",
    ano:2014,
    tipo:"Diretriz Europeia",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Algoritmo diagnóstico e terapêutico da hiponatremia",
    icon:"📋",
    resumo:"Diretriz europeia conjunta (ESE/ERA-EDTA 2014) para manejo da hiponatremia. Classifica a abordagem pela gravidade sintomática e velocidade de instalação — não apenas pelo nível sérico. Em hiponatremia sintomática grave: NaCl 3% 150 mL IV em 20 min, repetível até 2 vezes ou até elevação de ~5 mmol/L. Correção máxima: 10 mmol/L nas primeiras 24h e 8 mmol/L por cada 24h subsequente. Vaptanas contraindicadas em hipovolemia e hepatopatia.",
    conclusao:"A abordagem guiada por sintomas e velocidade de instalação — não pelo sódio isolado — é o paradigma central desta diretriz, que permanece referência europeia para hiponatremia.",
    curiosidade:"A síndrome de desmielinização osmótica (SDO) é mais frequente em pacientes com hiponatremia crônica que têm depleção de osmóis orgânicos cerebrais — K⁺, mioinositol, taurina. Correção rápida restaura osmolaridade plasmática mais rápido que o cérebro consegue reacumular esses osmóis, causando retração celular e desmielinização."
  },
  bproad:{
    label:"BPROAD Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2410766",
    journal:"New England Journal of Medicine",
    ano:2024,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓21% eventos CV em DM2 com meta PA sistólica <120 mmHg",
    icon:"💊",
    resumo:"ECR multicêntrico chinês, n=12.821, DM2 + HAS + alto risco cardiovascular, comparando PAS alvo <120 mmHg vs <140 mmHg. Desfecho primário: AVC não fatal, IAM não fatal, tratamento/internação por IC ou morte cardiovascular. Reduziu o desfecho primário: 393 vs 492 eventos; HR 0,79, IC 95% 0,69–0,90, P<0,001. Benefício principalmente por redução de AVC fatal/não fatal: HR 0,79, IC 95% 0,67–0,92. Eventos adversos graves foram semelhantes, mas hipotensão sintomática e hipercalemia foram mais frequentes no grupo intensivo.",
    conclusao:"BPROAD fortalece alvo intensivo de PAS em DM2 de alto risco cardiovascular, mas exige medida padronizada, vigilância de hipotensão/hipercalemia e cautela em idosos frágeis, ortostatismo e DRC avançada.",
    curiosidade:"Diferente do SPRINT, que excluiu diabetes, BPROAD testou diretamente o alvo <120 mmHg em DM2."
  },
  fidelio:{
    label:"FIDELIO-DKD Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2025845",
    journal:"New England Journal of Medicine",
    ano:2020,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓18% desfecho renal · ↓14% eventos CV · Finerenona como 3º pilar nefroprotetor",
    icon:"💊"
  },
  flow_study:{
    label:"FLOW Trial (Semaglutida)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2311324",
    journal:"New England Journal of Medicine",
    ano:2024,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓24% desfecho renal composto · 1º RCT de GLP-1 com desfecho renal primário",
    icon:"💊",
    resumo:"ECR fase III, n=3.533, semaglutida 1 mg semanal vs placebo em DM2 + DRC. Critérios: TFGe 50–75 com UACR >300–<5000 ou TFGe 25–<50 com UACR >100–<5000. Desfecho primário: falência renal, queda ≥50% da TFGe ou morte renal/CV. Semaglutida reduziu o desfecho primário: 18,7% vs 23,2%; HR 0,76, IC 95% 0,66–0,88, P=0,0003. Também reduziu MACE: HR 0,82, IC 95% 0,68–0,98; e mortalidade geral: HR 0,80, IC 95% 0,67–0,95.",
    conclusao:"FLOW estabeleceu benefício renal primário da semaglutida em DM2 com DRC, posicionando GLP-1 RA como terapia complementar aos iSGLT2/SRAA/finerenona.",
    curiosidade:"O benefício renal provavelmente resulta de combinação de efeitos metabólicos, pressóricos, ponderais, anti-inflamatórios e hemodinâmicos; não reduzir a explicação a 'bloqueio do SRAA'."
  },
  convince_study:{
    label:"CONVINCE Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2308946",
    journal:"New England Journal of Medicine",
    ano:2023,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"HDF de alta dose (≥23L/sessão) ↓23% mortalidade por todas as causas vs HD de alto fluxo",
    icon:"🔬"
  },
  sharp_study:{
    label:"SHARP Trial",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(11)60739-3/fulltext",
    journal:"The Lancet",
    ano:2011,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓17% eventos ateroscleróticos em DRC com ezetimiba + sinvastatina",
    icon:"💊"
  },
  canvas_study:{
    label:"CANVAS Program",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1611925",
    journal:"New England Journal of Medicine",
    ano:2017,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓14% MACE · ↓40% progressão renal com canagliflozina em DM2",
    icon:"💊"
  },
  testing_study:{
    label:"TESTING Trial",
    url:"https://jamanetwork.com/journals/jama/fullarticle/2790263",
    journal:"JAMA",
    ano:2022,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Metilprednisolona oral ↓27% desfecho renal em IgAN de alto risco",
    icon:"💊"
  },
  nostone_study:{
    label:"NOSTONE Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2209275",
    journal:"New England Journal of Medicine",
    ano:2022,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Hidroclorotiazida não reduziu recorrência de nefrolitíase vs placebo",
    icon:"🔬"
  },
  rituxvas_study:{
    label:"RITUXVAS Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa0909159",
    journal:"New England Journal of Medicine",
    ano:2010,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Rituximabe não inferior a ciclofosfamida na vasculite ANCA com LRA",
    icon:"💊",
    resumo:"ECR (RITUXVAS, n=44) em vasculite ANCA recém-diagnosticada com envolvimento renal (TFGe reduzida), comparando rituximabe (2 pulsos IV) + 2 pulsos de ciclofosfamida vs 15 pulsos de ciclofosfamida IV. Remissão sustentada aos 12 meses: 76% vs 82% (não inferior). Publicado como trial-irmão do RAVE no mesmo número do NEJM de 2010.",
    conclusao:"RITUXVAS e RAVE juntos estabeleceram rituximabe como alternativa à ciclofosfamida na indução da vasculite ANCA, com eficácia equivalente e sem necessidade de curso prolongado de ciclofosfamida.",
    curiosidade:"A publicação simultânea de RITUXVAS e RAVE no mesmo número do NEJM cobriu os dois cenários clínicos principais — doença recidivante (RAVE) e doença nova com comprometimento renal (RITUXVAS) — tornando a evidência para rituximabe difícil de contestar."
  },
  rave_study:{
    label:"RAVE Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa0909905",
    journal:"New England Journal of Medicine",
    ano:2010,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Rituximabe superior à ciclofosfamida na vasculite ANCA recidivante",
    icon:"💊",
    resumo:"ECR multicêntrico (RAVE, n=197) comparando rituximabe vs ciclofosfamida para indução de remissão em vasculite ANCA grave (GPA ou PAM). Endpoint primário: remissão completa sem corticoide aos 6 meses. Rituximabe não foi inferior à ciclofosfamida na doença nova (64% vs 53%); foi superior na doença recidivante (67% vs 42%). Perfil de eventos adversos graves semelhante entre os grupos.",
    conclusao:"RAVE estabeleceu o rituximabe como alternativa à ciclofosfamida na indução da vasculite ANCA, com vantagem clara na doença recidivante onde o acúmulo de dose de ciclofosfamida já é preocupação.",
    curiosidade:"As vasculites ANCA (GPA, PAM, EGPA) são mediadas por anticorpos IgG anti-ANCA que ativam neutrófilos circulantes, levando a inflamação necrosante de pequenos vasos — o que explica o efeito terapêutico do rituximabe, que depleta as células B produtoras desses autoanticorpos."
  },
  advocate_study:{
    label:"ADVOCATE Trial (Avacopan)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2029249",
    journal:"New England Journal of Medicine",
    ano:2021,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Avacopan não inferior a prednisona na vasculite ANCA, com menos efeitos corticoides",
    icon:"💊"
  },
  nobility_study:{
    label:"NOBILITY Trial (Obinutuzumabe)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2100494",
    journal:"New England Journal of Medicine",
    ano:2022,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Obinutuzumabe + MMF superior a MMF isolado em nefrite lúpica",
    icon:"💊"
  },
  valor_cdk_study:{
    label:"VALOR-CKD Trial (Veverimer)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2212381",
    journal:"New England Journal of Medicine",
    ano:2023,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#f59e0b",
    impacto:"Correção de acidose metabólica não retardou progressão da DRC vs placebo",
    icon:"🔬"
  },
  preserve_study:{
    label:"PRESERVE Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1710695",
    journal:"New England Journal of Medicine",
    ano:2018,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#f59e0b",
    impacto:"Bicarbonato IV e acetilcisteína não preveniram LRA por contraste vs placebo",
    icon:"🔬"
  },
  aurora_study:{
    label:"AURORA Trial (Rosuvastatin)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa0810177",
    journal:"New England Journal of Medicine",
    ano:2009,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#f59e0b",
    impacto:"Rosuvastatina não reduziu eventos CV em pacientes em hemodiálise",
    icon:"🔬"
  },
  aurora_voclosporina:{
    label:"AURORA Trial (Voclosporina — Nefrite Lúpica)",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(21)00578-X/fulltext",
    journal:"The Lancet",
    ano:2021,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Voclosporina + MMF + corticoide → remissão renal completa em 41% vs 23% (placebo); p<0,001 em 52 semanas",
    icon:"🔬"
  },
  tempo_study:{
    label:"TEMPO 3:4 Trial (Tolvaptana)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1205511",
    journal:"New England Journal of Medicine",
    ano:2012,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"Tolvaptana ↓49% crescimento renal em DRPAD · 1ª terapia específica para DRPAD",
    icon:"💊"
  },
  credence:{
    label:"CREDENCE Trial (Canagliflozina)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1811744",
    journal:"New England Journal of Medicine",
    ano:2019,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓30% desfecho renal composto · 1º RCT de SGLT2i com desfecho renal primário em DRC diabética",
    icon:"💊",
    resumo:"ECR fase III (n=4.401), canagliflozina 100 mg/dia vs placebo em DM2 com DRC diabética (TFGe 30–90, UACR 300–5.000 mg/g) em uso de SRAA otimizado. Desfecho primário composto (DRCT, duplicação de creatinina, morte renal ou CV): HR 0,70, redução relativa de 30%. Primeiro RCT de iSGLT2 com desfecho renal como endpoint primário pré-especificado. Interrompido precocemente por eficácia.",
    conclusao:"CREDENCE foi o trial que abriu o campo da nefroproteção com iSGLT2 em DRC diabética — evidência que desencadeou os trials subsequentes (DAPA-CKD, EMPA-KIDNEY) em populações mais amplas.",
    curiosidade:"O CREDENCE foi interrompido com 2,62 anos de seguimento médio (de 5,5 planejados) após análise interina mostrar benefício inequívoco — o que elevou o nível de evidência e acelerou a incorporação nas diretrizes."
  },
  dapa_ckd:{
    label:"DAPA-CKD Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2024816",
    journal:"New England Journal of Medicine",
    ano:2020,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓39% desfecho renal composto · ↓31% mortalidade · Benefício independente de diabetes",
    icon:"💊",
    resumo:"ECR multicêntrico, n=4.304, dapagliflozina 10 mg/dia vs placebo em DRC com ou sem DM2; TFGe 25–75 e ACR 200–5000 mg/g. Desfecho primário (queda sustentada ≥50% TFGe, DRCT ou morte renal/CV): 9,2% vs 14,5%; HR 0,61, IC 95% 0,51–0,72, P<0,001; NNT 19. Reduziu morte por qualquer causa: HR 0,69. Interrompido precocemente por eficácia.",
    conclusao:"DAPA-CKD foi o trial pivô que mostrou nefroproteção dos iSGLT2 independente de diabetes em DRC proteinúrica.",
    curiosidade:"32,5% da coorte não tinha DM2, dado que ajudou a deslocar os iSGLT2 de fármacos 'antidiabéticos' para fármacos cardiorrenais."
  },
  kdigo_dialise:{
    label:"KDOQI Hemodialysis Adequacy 2015",
    url:"https://www.ajkd.org/article/S0272-6386(15)01019-2/fulltext",
    journal:"Am J Kidney Dis 2015;66(5):884-930",
    ano:2015,
    tipo:"Diretriz Clínica (KDOQI/NKF)",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Padrão para adequação e prescrição em hemodiálise — alvo Kt/V e dose dialítica mínima",
    icon:"📋",
    resumo:"Diretriz KDOQI para adequação da hemodiálise. Para HD três vezes por semana, recomenda spKt/V alvo de 1,4 por sessão, com valor mínimo entregue de 1,2. Aborda avaliação periódica da dose dialítica, estado nutricional e acesso vascular como componentes integrados da qualidade do tratamento.",
    conclusao:"Define o índice Kt/V como medida-padrão da dose de diálise — base para auditoria e controle de qualidade nos centros de hemodiálise.",
    curiosidade:"O Kt/V foi proposto por Gotch e Sargent em 1985 com base no NCDS — primeiro estudo a demonstrar que a dose de diálise influencia a morbimortalidade. O 'K' representa o clearance de ureia do dialisador, 't' o tempo de sessão e 'V' o volume de distribuição da ureia, aproximadamente 60% do peso corporal."
  },
  kdigo_lra:{
    label:"KDIGO AKI 2012",
    url:"https://kdigo.org/guidelines/acute-kidney-injury/",
    journal:"Kidney International Supplements",
    ano:2012,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Critérios universais de diagnóstico e estadiamento da LRA",
    icon:"📋"
  },
  kdigo_cardiorenal_consensus:{
    label:"KDIGO Cardiorenal Syndrome 2012",
    url:"https://kdigo.org/guidelines/",
    journal:"Kidney International Supplements",
    ano:2012,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Classificação e manejo da síndrome cardiorrenal em 5 tipos",
    icon:"📋"
  },
  kdigo_ckd_guideline:{
    label:"KDIGO CKD 2024",
    url:"https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    journal:"Kidney International",
    ano:2024,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Padrão global de avaliação e manejo da DRC",
    icon:"📋"
  },
  guyton_and_hall_physiology:{
    label:"Guyton & Hall — Tratado de Fisiologia Médica",
    url:"https://www.elsevier.com/books/guyton-and-hall-textbook-of-medical-physiology/hall/978-0-323-59712-8",
    journal:"Elsevier",
    ano:2021,
    tipo:"Livro Didático",
    badge:"LIVRO",
    badgeColor:"#8b5cf6",
    impacto:"Referência clássica de fisiologia renal e regulação hemodinâmica",
    icon:"📚",
    resumo:"Tratado-base de fisiologia médica, com capítulos centrais sobre filtração glomerular, transporte tubular, concentração/diluição urinária, equilíbrio ácido-base, regulação de Na/K/Ca/P e integração rim–SRAA–pressão arterial.",
    conclusao:"Leitura de base para entender mecanismos antes de memorizar diretrizes.",
    curiosidade:"O conceito de controle renal da PA crônica pela natriurese pressórica segue sendo uma das ideias fisiológicas mais importantes para hipertensão e nefrologia."
  },
  kdigo_diabetes_in_ckd_guideline:{
    label:"KDIGO Diabetes in CKD 2022",
    url:"https://kdigo.org/guidelines/diabetes-ckd/",
    journal:"Kidney International",
    ano:2022,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Manejo integrado do diabetes e DRC — metas glicêmicas, nefroproteção e tratamento",
    icon:"📋",
    resumo:"Diretriz KDIGO 2022 para manejo do diabetes na DRC. Recomenda controle glicêmico individualizado com alvo de HbA1c 6,5–8% conforme risco de hipoglicemia e expectativa de vida. Posiciona iSGLT2 como primeira adição ao metformim em DRC com TFGe ≥20 e ACR ≥200 mg/g ou IC; GLP-1 RA como segunda linha com benefício CV e renal demonstrado. Finerenona indicada em DRC diabética com TFGe ≥25 e ACR ≥300 mg/g para redução de risco cardiorrenal.",
    conclusao:"A diretriz 2022 integrou o manejo glicêmico ao cardiorrenal — iSGLT2, GLP-1 RA e finerenona deixaram de ser apenas antidiabéticos para se tornarem a base da nefroproteção na DRC diabética.",
    curiosidade:"A DRC é o principal fator de risco de hipoglicemia grave em DM2: a insulina e as sulfoniluréias acumulam em pacientes com TFGe reduzida. Essa é a razão pela qual o alvo de HbA1c é deliberadamente menos estrito (<8%) em DRC avançada — reduzir hipoglicemia pode ser mais importante que otimizar glicemia."
  },
  daugirdas_handbook_of_dialysis:{
    label:"Daugirdas — Handbook of Dialysis (5ª ed.)",
    url:"https://www.wolterskluwer.com/en/solutions/ovid/handbook-of-dialysis-5th-ed-71",
    journal:"Wolters Kluwer",
    ano:2015,
    tipo:"Livro Didático",
    badge:"LIVRO",
    badgeColor:"#8b5cf6",
    impacto:"Referência técnica completa para prescrição e adequação de diálise",
    icon:"📚",
    resumo:"Manual de referência para prescrição e adequação de diálise, cobrindo hemodiálise (cálculo de Kt/V, adequação, acesso vascular), diálise peritoneal (PET, dose, complicações), nutrição em diálise, anemia, metabolismo mineral e manejo de complicações agudas. A 5ª edição (2015) incorpora atualizações sobre modalidades de HD de alta frequência e membranas de alto fluxo.",
    conclusao:"Referência técnica insubstituível para prescrição de diálise — combina fisiologia, fórmulas e protocolo clínico numa linguagem prática para a rotina de nefrologia.",
    curiosidade:"John Daugirdas desenvolveu a fórmula simplificada do Kt/V (Daugirdas 2ª geração) que corrige o efeito da geração de ureia durante a sessão — mais precisa que a fórmula linear de Gotch e padrão atual para monitorização da dose dialítica."
  },
  kdigo_transplant:{
    label:"KDIGO Transplant 2022",
    url:"https://kdigo.org/guidelines/transplant-recipient-care/",
    journal:"American Journal of Transplantation",
    ano:2022,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Manejo do receptor de transplante renal — imunossupressão, infecções e complicações",
    icon:"📋"
  },
  // ===== ARTIGOS FUNDAMENTAIS ADICIONADOS v5.0 =====
  // --- DRPAD ---
  tempo_34_trial:{
    label:"Torres VE et al. — TEMPO 3:4 (NEJM 2012)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1205511",
    journal:"N Engl J Med 2012;367(25):2407-2418",
    ano:2012,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Tolvaptan ↓18% crescimento de volume renal total em DRPAD — primeiro ensaio de modificação da doença",icon:"🔬",
    resumo:"ECR fase III (TEMPO 3:4, n=1.445), tolvaptan vs placebo em DRPAD com TFGe ≥60 e volume renal total aumentado. Reduziu a taxa de crescimento do volume renal total em 2,8% ao ano vs 5,5% ao ano no placebo — diferença de 18% relativa. Também retardou o declínio de TFGe e reduziu episódios de dor renal. Primeiro ensaio a demonstrar modificação da progressão em DRPAD.",
    conclusao:"TEMPO 3:4 foi o trial que estabeleceu tolvaptan como terapia modificadora de doença na DRPAD, levando às aprovações regulatórias e ao desenvolvimento dos critérios de seleção (Mayo 1C–1E) usados nas diretrizes.",
    curiosidade:"O volume renal total medido por ressonância magnética tornou-se o biomarcador-padrão de progressão na DRPAD — mais sensível que a TFGe nos estágios iniciais, quando a hiperfiltração dos néfrons remanescentes mascara o declínio funcional real."
  },
  reprise_trial:{
    label:"Torres VE et al. — REPRISE (NEJM 2017)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1710030",
    journal:"N Engl J Med 2017;377(20):1930-1942",
    ano:2017,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Tolvaptan confirmou benefício em DRPAD em estágio mais tardio (TFG 25-65) — base para aprovação ampliada",icon:"🔬",
    resumo:"ECR fase III (REPRISE, n=1.370), tolvaptan vs placebo em DRPAD com TFGe 25–65 ml/min/1,73m². Confirmou redução do declínio de TFGe em população com doença mais avançada que o TEMPO 3:4. O desfecho primário (slope de TFGe em 12 meses) foi significativamente melhor com tolvaptan. Hepatotoxicidade reversível observada em ~5%, exigindo monitorização hepática mensal.",
    conclusao:"REPRISE complementou o TEMPO 3:4 ao confirmar benefício do tolvaptan em pacientes com DRC mais avançada (TFGe 25–65), expandindo a janela terapêutica e embasando a aprovação regulatória em estágios intermediários da DRPAD.",
    curiosidade:"A hepatotoxicidade do tolvaptan (observada em ambos TEMPO e REPRISE) é o principal limitante do uso — resulta de lesão hepatocelular idiossincrásica e exigiu programa de monitorização hepática mensal como condição das aprovações regulatórias na maioria dos países."
  },
  // --- Nefropatia Diabética Clássica ---
  lewis_ieca_dn_1993:{
    label:"Lewis EJ et al. — Captopril in Diabetic Nephropathy (NEJM 1993)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJM199311253292103",
    journal:"N Engl J Med 1993;329(20):1456-1462",
    ano:1993,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Captopril ↓50% risco de duplicar creatinina em nefropatia diabética — primeiro RCT de nefroproteção com IECA",icon:"🔬",
    resumo:"ECR multicêntrico (n=409), em DM1 com nefropatia estabelecida, proteinúria >500 mg/dia e creatinina sérica ≤2,5 mg/dL, comparando captopril 25 mg 3x/dia vs placebo. O desfecho primário foi duplicação da creatinina sérica: 12,1% no grupo captopril vs 21,3% no placebo, com redução de risco de aproximadamente 48% (P=0,007). O composto de morte, diálise ou transplante também foi reduzido, e o benefício excedeu o esperado apenas pela diferença pressórica.",
    conclusao:"O trial de Lewis demonstrou que IECA protege rim em nefropatia diabética do DM1 com proteinúria, consolidando o bloqueio do SRAA como eixo histórico da nefroproteção.",
    curiosidade:"Este estudo ajudou a deslocar o tratamento da nefropatia diabética de simples controle pressórico para bloqueio específico do SRAA, reforçando a proteinúria como marcador de atividade e risco de progressão renal."
  },
  renaal_trial:{
    label:"Brenner BM et al. — RENAAL (NEJM 2001)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa011161",
    journal:"N Engl J Med 2001;345(12):861-869",
    ano:2001,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Losartan ↓16% desfecho renal composto em DM2 com nefropatia — estabeleceu BRA como nefroprotetor padrão",icon:"🔬",
    resumo:"ECR multicêntrico (RENAAL, n=1.513), em DM2 com nefropatia e proteinúria, comparando losartan 50–100 mg/dia vs placebo, adicionados ao tratamento anti-hipertensivo convencional, sem IECA ou outro BRA. O desfecho primário composto foi duplicação da creatinina, DRCT ou morte: HR 0,84 (redução relativa de 16%; P=0,02). Losartan reduziu duplicação de creatinina em 25%, DRCT em 28%, primeira hospitalização por insuficiência cardíaca em 32% e proteinúria em 35%.",
    conclusao:"RENAAL demonstrou que o BRA losartan reduz desfechos renais concretos em nefropatia diabética do DM2, com benefício além do controle pressórico convencional.",
    curiosidade:"A redução de proteinúria no RENAAL reforçou a albuminúria como marcador intermediário de risco renal: quanto maior a queda inicial da proteinúria, menor o risco posterior de progressão para desfechos renais duros."
  },
  idnt_trial:{
    label:"Lewis EJ et al. — IDNT (NEJM 2001)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa011303",
    journal:"N Engl J Med 2001;345(12):851-860",
    ano:2001,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Irbesartan ↓23% risco de duplicar creatinina vs amlodipino em nefropatia diabética tipo 2",icon:"🔬",
    resumo:"ECR multicêntrico (IDNT, n=1.715), em DM2 hipertenso com nefropatia, comparando irbesartan 300 mg/dia, amlodipino 10 mg/dia ou placebo, com controle pressórico semelhante entre os grupos. O desfecho primário foi duplicação da creatinina, DRCT ou morte por qualquer causa. Irbesartan reduziu o risco do desfecho primário em relação ao placebo e ao amlodipino; amlodipino não diferiu do placebo para proteção renal, apesar de reduzir PA.",
    conclusao:"IDNT demonstrou que a nefroproteção do BRA em DM2 albuminúrico não é explicada apenas pela redução da PA: o bloqueio do SRAA conferiu proteção renal que o bloqueador de canal de cálcio diidropiridínico não reproduziu.",
    curiosidade:"O desenho com três braços — BRA, amlodipino e placebo — foi didaticamente importante porque separou controle pressórico de nefroproteção específica do SRAA."
  },
  // --- Controle Glicêmico ---
  dcct_trial:{
    label:"DCCT Research Group (NEJM 1993)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJM199309303291401",
    journal:"N Engl J Med 1993;329(14):977-986",
    ano:1993,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Tratamento intensivo do DM1 ↓63% retinopatia e ↓54% microalbuminúria — base da teoria da memória metabólica",icon:"🔬",
    resumo:"ECR multicêntrico (DCCT, n=1.441), em DM1, comparando insulinoterapia intensiva — múltiplas aplicações ou bomba, com alvo de controle glicêmico próximo do normal — vs tratamento convencional. A HbA1c média alcançada foi cerca de 7,2% vs 9,1%. A terapia intensiva reduziu o surgimento de retinopatia em 76% na coorte de prevenção primária, reduziu progressão de retinopatia na coorte secundária, reduziu microalbuminúria em 39%, albuminúria clínica em 54% e neuropatia clínica em 60%, ao custo de maior hipoglicemia grave.",
    conclusao:"DCCT provou de forma definitiva que hiperglicemia crônica causa complicações microvasculares no DM1 e que controle glicêmico intensivo reduz nefropatia, retinopatia e neuropatia.",
    curiosidade:"O seguimento EDIC revelou o conceito de memória metabólica: benefícios microvasculares e cardiovasculares persistiram por anos mesmo após a convergência parcial da HbA1c entre os grupos."
  },
  edic_followup:{
    label:"Nathan DM et al. — EDIC Follow-up (NEJM 2005)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa052187",
    journal:"N Engl J Med 2005;353(25):2643-2653",
    ano:2005,tipo:"Estudo de Coorte (seguimento RCT)",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Memória metabólica confirmada: benefício do controle intensivo do DCCT persistiu 11 anos após o estudo — ↓57% doença CV",icon:"📖",
    resumo:"Seguimento observacional do DCCT (estudo de insulinoterapia intensiva vs convencional em DM1, 1983–1993). No EDIC, 11 anos após a convergência do controle glicêmico entre os grupos, o grupo de controle intensivo do DCCT ainda apresentava 57% menos doença cardiovascular e progressão mais lenta de complicações microvasculares — conceito de memória metabólica.",
    conclusao:"O EDIC demonstrou que o controle glicêmico precoce e intensivo em DM1 gera benefício CV e microvascular duradouro muito além do período de intervenção — reforçando a importância de iniciar controle rigoroso cedo no curso da doença.",
    curiosidade:"A memória metabólica parece mediada por modificações epigenéticas (metilação de DNA, modificações de histonas) induzidas pela hiperglicemia crônica — alterações que persistem mesmo após a normalização glicêmica e continuam a dirigir o comportamento das células vasculares e renais."
  },
  // --- SGLT2 ---
  canvas_program:{
    label:"Neal B et al. — CANVAS Program (NEJM 2017)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1611925",
    journal:"N Engl J Med 2017;377(7):644-657",
    ano:2017,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Canagliflozin ↓40% progressão de albuminúria e ↓40% desfechos renais em DM2 de alto risco CV",icon:"🔬",
    resumo:"Programa de dois ECRs (CANVAS e CANVAS-R, n=10.142 combinados), canagliflozina vs placebo em DM2 com alto risco CV ou DCV estabelecida. Reduziu MACE: HR 0,86. Reduziu progressão de albuminúria em 40% e desfechos renais compostos em 40%. Porém, associou-se a maior risco de amputação de membros inferiores (HR 1,97) — achado que gerou alertas regulatórios e comparações com CREDENCE.",
    conclusao:"O CANVAS Program confirmou benefício cardiorrenal da canagliflozina mas identificou o sinal de amputação — que o CREDENCE (população de DRC diabética) não reproduziu na mesma magnitude, gerando debate sobre se é efeito de classe ou específico do CANVAS.",
    curiosidade:"O sinal de amputação do CANVAS foi atribuído a possível depleção de volume mais acentuada com a dose de 300 mg usada no programa — o CREDENCE usou 100 mg. Essa diferença de dose pode explicar parte da discordância entre os trials da mesma molécula."
  },
  empa_kidney:{
    label:"Herrington WG et al. — EMPA-KIDNEY (NEJM 2023)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2204233",
    journal:"N Engl J Med 2023;388(2):117-127",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓28% progressão renal ou morte CV em DRC ampla (TFG 20-45, com ou sem DM)",icon:"🔬",
    resumo:"ECR multicêntrico, n=6.609, avaliou empagliflozina 10 mg/dia em DRC ampla: TFGe 20–<45 independente de albuminúria ou TFGe 45–<90 com ACR ≥200 mg/g. Reduziu progressão renal ou morte cardiovascular: 13,1% vs 16,9%; HR 0,72, IC 95% 0,64–0,82, P<0,001. Benefício consistente em diabéticos e não diabéticos e nas faixas de TFGe estudadas.",
    conclusao:"EMPA-KIDNEY consolidou os iSGLT2 como nefroproteção central em DRC ampla, inclusive não diabética, com TFGe ≥20 dentro dos critérios do estudo.",
    curiosidade:"Foi o grande trial de iSGLT2 com maior heterogeneidade etiológica e incluiu proporção expressiva de pacientes sem diabetes."
  },
  flow_trial:{
    label:"FLOW Trial Investigators — Semaglutida (NEJM 2024)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2403945",
    journal:"N Engl J Med 2024;391(18):1718-1730",
    ano:2024,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Semaglutida ↓24% desfecho renal composto em DM2 com DRC — primeiro GLP-1 com benefício renal primário comprovado",icon:"🔬",
    resumo:"ECR fase III, n=3.533, semaglutida 1 mg semanal vs placebo em DM2 + DRC. Critérios: TFGe 50–75 com UACR >300–<5000 ou TFGe 25–<50 com UACR >100–<5000. Desfecho primário: falência renal, queda ≥50% da TFGe ou morte renal/CV. Semaglutida reduziu o desfecho primário: 18,7% vs 23,2%; HR 0,76, IC 95% 0,66–0,88, P=0,0003. Também reduziu MACE: HR 0,82, IC 95% 0,68–0,98; e mortalidade geral: HR 0,80, IC 95% 0,67–0,95.",
    conclusao:"FLOW estabeleceu benefício renal primário da semaglutida em DM2 com DRC, posicionando GLP-1 RA como terapia complementar aos iSGLT2/SRAA/finerenona.",
    curiosidade:"O benefício renal provavelmente resulta de combinação de efeitos metabólicos, pressóricos, ponderais, anti-inflamatórios e hemodinâmicos; não reduzir a explicação a 'bloqueio do SRAA'."
  },
  // --- Hipertensão ---
  sprint_trial:{
    label:"SPRINT Research Group (NEJM 2015)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1511939",
    journal:"N Engl J Med 2015;373(22):2103-2116",
    ano:2015,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Alvo de PA < 120 mmHg ↓25% eventos CV vs < 140 mmHg em não-diabéticos de alto risco (exceto DRC avançada)",icon:"🔬",
    resumo:"ECR multicêntrico (SPRINT, n=9.361), em adultos sem diabetes e sem AVC prévio, com PAS ≥130 mmHg e alto risco cardiovascular, comparando alvo intensivo de PAS <120 mmHg vs alvo padrão <140 mmHg por medida padronizada automatizada em consultório. O desfecho primário composto cardiovascular foi reduzido: HR 0,75 (IC 95% 0,64–0,89; P<0,001), e o estudo foi interrompido precocemente por benefício. No subgrupo com DRC, o benefício cardiovascular foi preservado, mas houve maior queda inicial de TFGe e mais eventos renais/AKI no braço intensivo.",
    conclusao:"SPRINT fundamentou metas pressóricas mais intensivas em pacientes não diabéticos de alto risco, incluindo DRC, mas sua aplicação exige reproduzir técnica de medida padronizada e considerar fragilidade, hipotensão, AKI e tolerabilidade.",
    curiosidade:"A controvérsia do SPRINT não está apenas no número <120 mmHg, mas na forma de medir a PA: leitura padronizada, automatizada, após repouso e sem conversa não equivale à medida casual apressada de consultório."
  },
  pathway2_trial:{
    label:"Williams B et al. — PATHWAY-2 (Lancet 2015)",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(15)00257-3/fulltext",
    journal:"Lancet 2015;386(10008):2059-2068",
    ano:2015,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Espironolactona é o agente mais eficaz para hipertensão resistente — reduziu PA sistólica média 8,7 mmHg vs placebo",icon:"🔬"
  },
  aask_trial:{
    label:"Wright JT et al. — AASK (JAMA 2002)",
    url:"https://jamanetwork.com/journals/jama/fullarticle/195133",
    journal:"JAMA 2002;288(19):2421-2431",
    ano:2002,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Ramipril superior à anlodipina e metoprolol em retardar progressão da nefropatia hipertensiva em afro-americanos",icon:"🔬"
  },
  // --- Progressão DRC ---
  mdrd_study:{
    label:"Klahr S et al. — MDRD Study (NEJM 1994)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJM199403313301301",
    journal:"N Engl J Med 1994;330(13):877-884",
    ano:1994,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Restrição proteica (0,6g/kg/dia) e baixa meta de PA retardam progressão da DRC — base das recomendações dietéticas",icon:"🔬"
  },
  // --- Hemodiálise ---
  pivotal_trial:{
    label:"Macdougall IC et al. — PIVOTAL (NEJM 2019)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1810742",
    journal:"N Engl J Med 2019;381(15):1411-1420",
    ano:2019,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Ferro IV proativo (1g/mês) vs reativo ↓20% eventos CV em hemodiálise — estratégia de reposição de ferro em diálise",icon:"🔬"
  },
  dopps_study:{
    label:"DOPPS Study — Longer Dialysis Time & Ultrafiltration",
    url:"https://www.kidney-international.org/article/S0085-2538(15)00337-5/fulltext",
    journal:"Kidney International 2015",
    ano:2015,tipo:"Estudo Observacional Internacional",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Ultrafiltração > 13 mL/kg/h associada a maior mortalidade; sessões mais longas melhoram sobrevida em hemodiálise",icon:"📖"
  },
  // --- Distúrbio Mineral ---
  dcor_trial:{
    label:"Chertow GM et al. — DCOR Trial (Kidney Int 2006)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)52524-5/fulltext",
    journal:"Kidney Int 2006;69(8):1489-1496",
    ano:2006,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Sevelamer vs quelantes à base de cálcio: sem diferença em mortalidade mas menor hipercalcemia e calcificação vascular",icon:"🔬"
  },
  // --- Vasculite ANCA ---
  pexivas_trial:{
    label:"Walsh M et al. — PEXIVAS (NEJM 2020)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1803537",
    journal:"N Engl J Med 2020;382(7):622-631",
    ano:2020,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Plasmaférese NÃO reduziu morte ou DRCT em vasculite ANCA grave — mudou prática clínica abandonando plasmaférese de rotina",icon:"🔬",
    resumo:"ECR com delineamento 2×2 fatorial (n=704) em vasculite ANCA grave (GPA ou PAM com TFGe <50 ou hemorragia alveolar). Comparou plasmaférese (7 sessões) vs nenhuma e glicocorticoide padrão vs reduzido. Desfecho primário (morte ou DRCT, mediana 2,9 anos): plasmaférese não reduziu o risco (HR 0,86, IC 95% 0,65–1,13). Glicocorticoide reduzido foi não inferior ao padrão e associado a menos infecções graves.",
    conclusao:"PEXIVAS encerrou o uso rotineiro de plasmaférese em vasculite ANCA grave e sustentou protocolos de redução de corticoide — ambos os paradigmas vigoravam sem suporte de trials de alta qualidade.",
    curiosidade:"A hipótese da plasmaférese era remover ANCA circulante para reduzir ativação de neutrófilos. O PEXIVAS mostrou que, em desfechos clinicamente relevantes (morte e DRCT), esse mecanismo não se traduz em benefício — questionando o papel dos ANCA circulantes como driver autônomo do dano glomerular."
  },
  // --- IRA ---
  furosemide_stress_test:{
    label:"Chawla LS et al. — Furosemide Stress Test (CJASN 2013)",
    url:"https://cjasn.asnjournals.org/content/8/11/1935",
    journal:"Clin J Am Soc Nephrol 2013;8(11):1935-1943",
    ano:2013,tipo:"Estudo Clínico",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"FST (1mg/kg furosemida IV): débito urinário < 200mL/2h prediz progressão para LRA estágio 3 com alta sensibilidade",icon:"📖"
  },
  // --- Síndrome Hepatorrenal ---
  confirm_trial:{
    label:"Wong F et al. — CONFIRM (NEJM 2021)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2008290",
    journal:"N Engl J Med 2021;384(9):818-828",
    ano:2021,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Terlipressina + albumina ↑reversão da SHR-1 vs placebo — confirmou terlipressina como tratamento padrão no ocidente",icon:"🔬"
  },
  // --- Síndrome Cardiorrenal / IC ---
  carress_hf:{
    label:"Bart BA et al. — CARRESS-HF (NEJM 2012)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1210357",
    journal:"N Engl J Med 2012;367(24):2296-2304",
    ano:2012,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Ultrafiltração NÃO superior à farmacoterapia guiada e causou mais dano renal em IC com síndrome cardiorrenal",icon:"🔬"
  },
  dapa_hf:{
    label:"McMurray JJV et al. — DAPA-HF (NEJM 2019)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1911303",
    journal:"N Engl J Med 2019;381(21):1995-2008",
    ano:2019,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Dapagliflozin ↓26% morte CV + hospitalização por IC em ICFEr (com e sem DM2) — expandiu SGLT2i para IC",icon:"🔬",
    resumo:"ECR multicêntrico (DAPA-HF, n=4.744), em ICFEr sintomática (FEVE ≤40%, NYHA II–IV), comparando dapagliflozina 10 mg/dia vs placebo sobre terapia padrão. O desfecho primário — piora da insuficiência cardíaca ou morte cardiovascular — ocorreu em 16,3% vs 21,2%: HR 0,74 (IC 95% 0,65–0,85; P<0,001). O benefício foi consistente em pacientes com e sem DM2.",
    conclusao:"DAPA-HF estabeleceu dapagliflozina como tratamento modificador de prognóstico na ICFEr, independentemente de diabetes, consolidando os iSGLT2 como parte da terapia moderna da insuficiência cardíaca.",
    curiosidade:"Antes do DAPA-HF, os iSGLT2 eram vistos sobretudo como antidiabéticos com benefício cardiovascular. O estudo mudou o enquadramento: a dapagliflozina passou a ser tratada como fármaco de insuficiência cardíaca com efeito glicêmico adicional."
  },
  emperor_reduced:{
    label:"Packer M et al. — EMPEROR-Reduced (NEJM 2020)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2022190",
    journal:"N Engl J Med 2020;383(15):1413-1424",
    ano:2020,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓25% morte CV + hospitalização em ICFEr — confirmou classe dos SGLT2i em IC independente de DM",icon:"🔬",
    resumo:"ECR multicêntrico (EMPEROR-Reduced, n=3.730), em ICFEr sintomática com FEVE ≤40%, comparando empagliflozina 10 mg/dia vs placebo. O desfecho primário — morte cardiovascular ou hospitalização por insuficiência cardíaca — ocorreu em 19,4% vs 24,7%: HR 0,75 (IC 95% 0,65–0,86; P<0,001), com benefício em pacientes com e sem diabetes. A empagliflozina também reduziu desfecho renal composto exploratório e desacelerou o declínio da TFGe.",
    conclusao:"EMPEROR-Reduced confirmou benefício de classe dos iSGLT2 na ICFEr e reforçou a interface cardiorrenal da terapia, especialmente em pacientes com IC e DRC concomitantes.",
    curiosidade:"O benefício renal observado em trials de IC sugere que parte da nefroproteção dos iSGLT2 independe da doença renal primária e se relaciona a mecanismos hemodinâmicos, tubuloglomerulares e cardiorrenais."
  },
  emperor_preserved:{
    label:"Anker SD et al. — EMPEROR-Preserved (NEJM 2021)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2107038",
    journal:"N Engl J Med 2021;385(16):1451-1461",
    ano:2021,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓21% morte CV + hospitalização em ICFEp — primeiro tratamento com benefício em IC com fração preservada",icon:"🔬",
    resumo:"ECR multicêntrico (EMPEROR-Preserved, n=5.988), em insuficiência cardíaca sintomática com FEVE >40%, comparando empagliflozina 10 mg/dia vs placebo. O desfecho primário — morte cardiovascular ou hospitalização por insuficiência cardíaca — ocorreu em 13,8% vs 17,1%: HR 0,79 (IC 95% 0,69–0,90; P<0,001), com benefício independente de diabetes e impulsionado principalmente por redução de hospitalização por IC.",
    conclusao:"EMPEROR-Preserved foi decisivo para demonstrar benefício dos iSGLT2 em IC com FEVE preservada ou levemente reduzida, uma área historicamente marcada por trials neutros ou marginalmente positivos.",
    curiosidade:"A IC com FEVE preservada é comum em idosos, mulheres, obesos, diabéticos e pacientes com DRC; por isso, o EMPEROR-Preserved fortaleceu a abordagem cardiorrenal integrada desse fenótipo clínico."
  },
  deliver_trial:{
    label:"Solomon SD et al. — DELIVER (NEJM 2022)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2211658",
    journal:"N Engl J Med 2022;387(12):1089-1098",
    ano:2022,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Dapagliflozin ↓18% morte CV + hospitalização em IC com FE ≥40% — confirmou SGLT2i em todo o espectro de IC",icon:"🔬",
    resumo:"ECR multicêntrico (DELIVER, n=6.263), em insuficiência cardíaca com FEVE >40%, incluindo FEVE levemente reduzida, preservada e pacientes com FEVE previamente reduzida que melhorou, comparando dapagliflozina 10 mg/dia vs placebo. O desfecho primário — piora da insuficiência cardíaca ou morte cardiovascular — ocorreu em 16,4% vs 19,5%: HR 0,82 (IC 95% 0,73–0,92; P<0,001). O benefício foi consistente independentemente de diabetes e ao longo das faixas de FEVE estudadas.",
    conclusao:"DELIVER complementou DAPA-HF ao mostrar benefício da dapagliflozina também em IC com FEVE >40%, consolidando os iSGLT2 como terapia aplicável ao amplo espectro da insuficiência cardíaca.",
    curiosidade:"A consistência dos resultados de DAPA-HF e DELIVER sugere que os benefícios dos iSGLT2 na IC não dependem apenas de glicemia ou fração de ejeção, mas de efeitos cardiorrenais combinados sobre congestão, hemodinâmica renal e risco de hospitalização."
  },
  // ===== ARTIGOS ADICIONADOS v5.1 =====
  benazepril_ckd:{
    label:"Hou FF et al. — Benazepril in Advanced CKD (NEJM 2006)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa060038",
    journal:"N Engl J Med 2006;354(2):131-140",
    ano:2006,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Benazepril ↓43% duplicação de creatinina em DRC avançada (TFG 20-70) — estabeleceu IECA como nefroprotetor em DRC não-diabética",icon:"🔬"
  },
  starrt_aki:{
    label:"Wald R et al. — STARRT-AKI (NEJM 2020)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2000741",
    journal:"N Engl J Med 2020;383(3):240-251",
    ano:2020,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Início acelerado de TRS não superior ao início padrão em LRA grave — estratégia expectante é segura",icon:"🔬"
  },
  declare_timi58:{
    label:"Wiviott SD et al. — DECLARE-TIMI 58 (NEJM 2019)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1812389",
    journal:"N Engl J Med 2019;380(4):347-357",
    ano:2019,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Dapagliflozin ↓17% hospitalização por IC e ↓47% progressão renal em DM2 com múltiplos perfis de risco CV",icon:"🔬",
    resumo:"ECR (n=17.160), dapagliflozina 10 mg vs placebo em DM2 — maior coorte de iSGLT2, incluindo pacientes com ASCVD estabelecida e com múltiplos fatores de risco (prevenção primária). MACE: HR 0,93 (não inferior, não superior). Desfecho cardíaco composto (hospitalização por IC + morte CV): HR 0,83, P=0,005. Progressão renal (queda ≥40% TFGe ou DRCT): HR 0,53.",
    conclusao:"DECLARE-TIMI 58 expandiu a indicação dos iSGLT2 ao incluir pacientes sem ASCVD estabelecida, demonstrando benefício cardíaco e renal em perfis de risco menos extremos.",
    curiosidade:"O DECLARE incluiu ~59% de pacientes sem ASCVD estabelecida — diferença fundamental em relação ao EMPA-REG e CANVAS, restritos a alto risco CV, tornando-o o trial mais representativo da população real de DM2 e o que mais informou a expansão das indicações nas diretrizes."
  },
  empa_reg_outcome:{
    label:"Zinman B et al. — EMPA-REG OUTCOME (NEJM 2015)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1504720",
    journal:"N Engl J Med 2015;373(22):2117-2128",
    ano:2015,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓38% morte CV e ↓35% hospitalização por IC em DM2 alto risco CV — primeiro SGLT2i com benefício CV",icon:"🔬",
    resumo:"ECR fase III (n=7.020), empagliflozina 10 mg ou 25 mg vs placebo em DM2 com alto risco cardiovascular estabelecido. Desfecho primário (MACE): HR 0,86, IC 95% 0,74–0,99, principalmente pela redução de morte CV (HR 0,62). Hospitalização por IC: HR 0,65. Também reduziu incidência ou piora de nefropatia: HR 0,61. Primeiro trial de iSGLT2 a demonstrar benefício CV — marcou a transição da classe de hipoglicemiante para cardiorrenal.",
    conclusao:"EMPA-REG OUTCOME foi o trial que iniciou a revolução cardiorrenal dos iSGLT2, demonstrando benefício CV e renal além do controle glicêmico em DM2 de alto risco.",
    curiosidade:"A redução de morte CV e hospitalização por IC foi mais rápida do que seria esperado por efeito aterosclerótico — sugerindo mecanismo hemodinâmico direto (natriurese, redução de pré e pós-carga) independente do controle glicêmico."
  },
  leader_trial:{
    label:"Marso SP et al. — LEADER (NEJM 2016)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1603827",
    journal:"N Engl J Med 2016;375(4):311-322",
    ano:2016,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Liraglutida ↓13% MACE e ↓22% nefropatia (nova macroalbuminúria ou duplicação de creatinina) em DM2",icon:"🔬",
    resumo:"ECR cardiovascular (LEADER, n=9.340), em DM2 com alto risco cardiovascular, comparando liraglutida até 1,8 mg/dia vs placebo. O desfecho primário MACE foi reduzido: HR 0,87 (IC 95% 0,78–0,97; P=0,01 para superioridade). Houve redução de morte cardiovascular (HR 0,78) e morte por qualquer causa (HR 0,85). O desfecho renal composto também foi reduzido (HR 0,78), principalmente por menor incidência de macroalbuminúria persistente nova.",
    conclusao:"LEADER estabeleceu liraglutida como GLP-1 RA cardioprotetor em DM2 de alto risco e sugeriu benefício renal predominantemente albuminúrico, antes dos trials renais dedicados da classe.",
    curiosidade:"O LEADER separa bem dois tipos de evidência renal: queda de albuminúria é relevante, mas não equivale ao mesmo grau de prova de trials com desfechos renais duros, como DRCT, queda sustentada de TFGe ou morte renal."
  },
  rewind_trial:{
    label:"Gerstein HC et al. — REWIND (Lancet 2019)",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(19)31149-9/fulltext",
    journal:"Lancet 2019;394(10193):121-130",
    ano:2019,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Dulaglutida ↓15% MACE e ↓15% desfecho renal composto em DM2 com perfil CV diverso (inclusão de baixo risco)",icon:"🔬"
  },
  ktv_daugirdas1993:{
    label:"Daugirdas JT — Kt/V Single-Pool (JASN 1993)",
    url:"https://jasn.asnjournals.org/content/4/5/1205",
    journal:"J Am Soc Nephrol 1993;4(5):1205-1213",
    ano:1993,tipo:"Artigo Metodológico",badge:"METODO",badgeColor:"#8b5cf6",
    impacto:"Fórmula logarítmica de segunda geração para cálculo do Kt/V — padrão ouro para mensuração da dose de diálise",icon:"📐"
  },
  ncds_study:{
    label:"Gotch FA, Sargent JA — NCDS Analysis (Kidney Int 1985)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)33291-4/fulltext",
    journal:"Kidney Int 1985;28(3):526-534",
    ano:1985,tipo:"Análise de RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Análise mecanicista do NCDS: desenvolveu o conceito de Kt/V como medida de adequação — base do target Kt/V ≥1.2",icon:"🔬"
  },
  avf_epidemiology:{
    label:"Ravani P et al. — AVF Use and Outcomes (JASN 2004)",
    url:"https://jasn.asnjournals.org/content/15/9/2479",
    journal:"J Am Soc Nephrol 2004;15(9):2479-2486",
    ano:2004,tipo:"Estudo Observacional",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"FAV associada a menor mortalidade que CVC em hemodiálise — base da preferência pela fistula arteriovenosa",icon:"📖"
  },
  terlipressin_sanyal:{
    label:"Sanyal AJ et al. — Terlipressin SHR (Gastroenterology 2008)",
    url:"https://www.gastrojournal.org/article/S0016-5085(08)00060-0/fulltext",
    journal:"Gastroenterology 2008;134(5):1360-1368",
    ano:2008,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Terlipressina + albumina ↑reversão da SHR-1 vs placebo (34% vs 13%) — RCT confirmatório do mecanismo vasoconstritor",icon:"🔬"
  },
  dose_trial:{
    label:"Felker GM et al. — DOSE Trial (NEJM 2011)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1005419",
    journal:"N Engl J Med 2011;364(9):797-805",
    ano:2011,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Altas doses de furosemida (2,5× dose oral) superiores em alívio dos sintomas vs baixas doses; bolus e infusão contínua equivalentes",icon:"🔬"
  },
  sacubitril_valsartan_hf:{
    label:"Voors AA et al. — LCZ696 renal effects HFpEF (EHJ 2015)",
    url:"https://academic.oup.com/eurheartj/article/36/7/408/2293234",
    journal:"Eur Heart J 2015;36(7):408-416",
    ano:2015,tipo:"Análise de RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Sacubitril/valsartan: efeitos renais benéficos em IC, redução de albuminúria e potencial nefroproteção via BNP/neprilisina",icon:"🔬"
  },
  evolve_trial:{
    label:"Chertow GM et al. — EVOLVE (NEJM 2012)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1205131",
    journal:"N Engl J Med 2012;367(26):2482-2494",
    ano:2012,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Cinacalcet não reduziu significativamente mortalidade ou eventos CV no HPT2 em diálise (resultado neutro com ajuste estatístico)",icon:"🔬"
  },
  kdigo_ckd_mbd_2017:{
    label:"KDIGO CKD-MBD Update 2017",
    url:"https://kdigo.org/guidelines/ckd-mbd/",
    journal:"Kidney Int Suppl 2017;7(1):1-59",
    ano:2017,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Metas de PTH (2-9× LSN), fósforo e cálcio em DRC; preferência por quelantes não cálcicos; calcitriol/análogos em estágios 3-5D",icon:"📋",
    resumo:"Atualização da diretriz KDIGO sobre distúrbios do metabolismo mineral e ósseo na DRC. Em diálise, sugere manter PTH entre 2 e 9 vezes o limite superior da normalidade do ensaio utilizado — não há alvo fixo. Para fósforo, recomenda manter dentro da faixa normal, preferindo quelantes não cálcicos quando indicada quelação. Evitar hipercalcemia e limitar quelantes com cálcio. Vitamina D ativa (calcitriol ou análogos) indicada no hiperparatireoidismo grave ou progressivo nos estágios 3–5D.",
    conclusao:"A ausência de alvos rígidos de PTH reflete a limitação das evidências: a relação entre PTH e desfechos ósseos/cardiovasculares na DRC-5D é complexa e a meta deve ser individualizada.",
    curiosidade:"A calcificação vascular na DRC resulta de transdiferenciação ativa das células musculares lisas vasculares em células osteoblasto-like — mediada em parte pelo excesso de fósforo e FGF-23 — e não simplesmente precipitação passiva de cálcio e fósforo."
  },
  phosphate_binders_ckd:{
    label:"Block GA et al. — Phosphate Binders in Moderate CKD (JASN 2012)",
    url:"https://jasn.asnjournals.org/content/23/8/1407",
    journal:"J Am Soc Nephrol 2012;23(8):1407-1415",
    ano:2012,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Quelantes de fósforo em DRC moderada (TFG 20-45): reduziram progressão da calcificação coronariana vs placebo",icon:"🔬"
  },
  hyponatremia_adrogue2000:{
    label:"Adrogue HJ, Madias NE — Hyponatremia (NEJM 2000)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJM200005253422107",
    journal:"N Engl J Med 2000;342(21):1581-1589",
    ano:2000,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Revisão clássica de hiponatremia: diagnóstico, causas, manejo e velocidade de correção segura (máx 10-12 mEq/L/24h)",icon:"📖",
    resumo:"Revisão clássica que organizou diagnóstico e manejo da hiponatremia. Fórmula prática: ΔNa ≈ ([Na + K]infusato − Na sérico) / (ACT + 1); ACT ≈ 0,6 × peso em homens, 0,5 × peso em mulheres, menor em idosos. Para soluções sem potássio, usar apenas Na do infusato. A correção deve ser lenta na hiponatremia crônica; alvo usual 4–6 mEq/L/dia, evitando correções excessivas, especialmente em alto risco de desmielinização osmótica.",
    conclusao:"A fórmula de Adrogué-Madias é ferramenta de estimativa, não substitui rechecagem seriada do sódio.",
    curiosidade:"Hipocalemia aumenta risco de desmielinização; reposição de K também eleva a natremia efetiva."
  },
  hyponatremia_verbalis2022:{
    label:"European Clinical Practice Guideline on Hyponatraemia (ESE/ERA-EDTA 2014)",
    url:"https://academic.oup.com/ejendo/article/170/3/G1/6655834",
    journal:"Eur J Endocrinol 2014;170(3):G1-G47",
    ano:2014,tipo:"Diretriz Europeia",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Diretriz europeia para diagnóstico e tratamento de hiponatremia: classificação por gravidade, fluxograma diagnóstico, indicações de solução hipertônica e vaptanas",icon:"📋",
    resumo:"Em hiponatremia sintomática grave, priorizar sintomas e tempo de instalação. A diretriz europeia recomenda NaCl 3% 150 mL IV em 20 minutos, repetível até 2 vezes ou até elevação de ~5 mmol/L. Após melhora, limitar a correção a 10 mmol/L nas primeiras 24h e 8 mmol/L a cada 24h subsequente. Vaptanas exigem cautela: evitar em hiponatremia hipovolêmica, incapacidade de monitorização e hepatopatia relevante.",
    conclusao:"A abordagem da hiponatremia é guiada pela gravidade sintomática e velocidade de instalação — não apenas pelo nível sérico — com metas de correção para prevenir síndrome de desmielinização osmótica.",
    curiosidade:"A síndrome de desmielinização osmótica resulta da re-osmolarização cerebral abrupta em pacientes com hiponatremia crônica — o cérebro adapta seu conteúdo de osmóis orgânicos à hipoosmolaridade e não tolera correção rápida."
  },
  salsa_trial:{
    label:"Baek SH et al. — SALSA Trial (JAMA Intern Med 2021)",
    url:"https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2780319",
    journal:"JAMA Intern Med 2021;181(1):81-92",
    ano:2021,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Bolus de solução hipertônica: risco MAIOR de hipercorreção que infusão contínua — orienta protocolo de correção da hiponatremia",icon:"🔬",
    resumo:"ECR (n=178) comparando bolus de NaCl 3% (150 mL em 20 min, repetível até 3 vezes) vs infusão contínua de NaCl 3% em hiponatremia grave (<125 mEq/L ou sintomática ≤130). Hipercorreção (elevação >12 mEq/L em 24h ou >18 mEq/L em 48h) ocorreu em 23,6% no grupo bolus vs 10,7% na infusão contínua. Ambos foram eficazes na correção inicial, mas a infusão contínua permitiu controle mais fino.",
    conclusao:"O SALSA questiona o uso irrestrito de bolus como protocolo-padrão: embora indicado na emergência sintomática aguda, o bolus repetido sem monitorização rigorosa aumenta o risco de hipercorreção e síndrome de desmielinização osmótica.",
    curiosidade:"O bolus de NaCl 3% havia sido adotado amplamente com base em facilidade e eficácia sintomática rápida — o SALSA foi o primeiro RCT a mostrar que conveniência pode ter custo em segurança, retomando a discussão de protocolos individualizados."
  },
  protect_trial:{
    label:"Rovin BH et al. — PROTECT (Lancet 2023)",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(22)02605-5/fulltext",
    journal:"Lancet 2023;401(10372):173-183",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Sparsentan (dual bloqueio AT1R + ETₐR) ↓50% proteinúria vs irbesartan em IgAN — nova opção terapêutica",icon:"🔬",
    resumo:"ECR fase III, n=404, nefropatia por IgA com proteinúria ≥1 g/dia apesar de SRAA otimizado, comparando sparsentan 400 mg/dia vs irbesartan 300 mg/dia. Aos 36 semanas, reduziu proteinúria mais que irbesartan: −49,8% vs −15,1%; redução relativa entre grupos 41%, razão 0,59, IC 95% 0,51–0,69, P<0,0001. Aos 110 semanas, manteve menor proteinúria: 40% menor vs irbesartan; slope crônico da TFGe melhor: −2,7 vs −3,8 ml/min/1,73m²/ano, diferença 1,1, IC 95% 0,1–2,1, P=0,037; slope total limítrofe: P=0,058. Composto de falência renal: 9% vs 13%; RR 0,7, IC 95% 0,4–1,2.",
    conclusao:"PROTECT introduziu o bloqueio dual endotelina-angiotensina como terapia não imunossupressora para IgAN proteinúrica, com redução robusta de proteinúria e sinal funcional renal, mais sólido no slope crônico que no slope total.",
    curiosidade:"O sparsentan recebeu aprovação acelerada pelo FDA em 2023 e aprovação plena em 2024 para retardar declínio de função renal em adultos com IgAN primária sob risco de progressão."
  },
  atrasentan_igan:{
    label:"Barratt J et al. — Atrasentan IgAN (NEJM 2023)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2305124",
    journal:"N Engl J Med 2023;389(22):2024-2034",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Atrasentan (antagonista seletivo ETₐR) ↓38% risco de duplicar creatinina em IgAN com proteinúria persistente",icon:"🔬",
    resumo:"ECR fase III (ALIGN, n=343), atrasentan (antagonista seletivo do receptor de endotelina tipo A) vs placebo em IgAN com proteinúria persistente ≥1 g/dia apesar de SRAA otimizado. Incluiu fase de rodagem obrigatória para excluir retenção de fluidos. Desfecho primário composto (falência renal, queda ≥40% da TFGe sustentada ou morte renal/CV): HR 0,62 (~38% de redução de risco). Interrompido precocemente pelo comitê de monitoramento por eficácia.",
    conclusao:"ALIGN consolidou o bloqueio seletivo do ETₐR como estratégia eficaz para retardar a progressão renal na IgAN proteinúrica, complementar ao SRAA e às terapias não imunossupressoras.",
    curiosidade:"A fase de rodagem do ALIGN foi desenhada especificamente para detectar retenção de fluidos precoce — problema que havia comprometido ensaios anteriores com antagonistas de endotelina em doença renal — tornando o protocolo de segurança parte central do desenho do trial."
  },
  nefigard_trial:{
    label:"Lafayette RA et al. — NefIgArd (Lancet 2023)",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)02765-2/fulltext",
    journal:"Lancet 2023;402(10405):859-870",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Budesonida de liberação alvo (atua nos Peyer's patches) ↓proteinúria e preserva TFG em IgAN com proteinúria ≥1g/dia",icon:"🔬",
    resumo:"ECR fase III (NefIgArd, n=364), nefecon (budesonida de liberação alvo nos Patches de Peyer do íleo distal) vs placebo por 9 meses em IgAN com TFGe ≥35 e proteinúria ≥1 g/dia. Reduziu proteinúria de forma sustentada vs placebo ao final do tratamento. Resultados aos 2 anos mostraram preservação da TFGe: diferença estimada de +3,8 ml/min/1,73m² vs placebo. Aprovado pelo FDA (Tarpeyo) e EMA (Kinpeygo) para IgAN primária com risco de progressão.",
    conclusao:"NefIgArd validou a hipótese do eixo intestino-rim na IgAN: reduzir a produção de IgA1 galactose-deficiente nos Patches de Peyer com budesonida tópica preserva a TFGe sem a toxicidade sistêmica dos corticoides.",
    curiosidade:"A IgA1 galactose-deficiente produzida no tecido linfoide intestinal (MALT-gut) é o gatilho imunológico central da IgAN — razão pela qual a budesonida entérica, que atua localmente no íleo distal, tem efeito sobre uma doença glomerular."
  },
  c3g_consensus:{
    label:"Pickering MC et al. — C3 Glomerulopathy Consensus (Kidney Int 2013)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)30396-7/fulltext",
    journal:"Kidney Int 2013;84(6):1079-1089",
    ano:2013,tipo:"Consenso Clínico",badge:"CONSENSO",badgeColor:"#f59e0b",
    impacto:"Definição e classificação da C3G: C3GN (depósito difuso C3) e DDD (depósito denso intramembranoso), papel do complemento",icon:"⚠️",
    resumo:"Consenso internacional que unificou o conceito de C3 glomerulopatia (C3G) como entidade definida por C3 glomerular predominante (≥2+ acima de qualquer imunoglobulina na imunofluorescência) decorrente de disregulação da via alternativa do complemento. Inclui dois subtipos: C3GN (depósitos variados ao ME) e doença de depósitos densos (DDD, depósitos intramembranosos densos ao ME), que compartilham o mecanismo de disregulação do complemento.",
    conclusao:"A classificação C3G unificou entidades anteriormente dispersas (MPGN tipo II, MPGN com C3 predominante) sob um marco etiológico comum — a disregulação do complemento — orientando investigação laboratorial e potenciais alvos terapêuticos.",
    curiosidade:"O fator nefrítico C3 (C3NeF) é um autoanticorpo IgG que estabiliza a C3-convertase alternativa (C3bBb), impedindo sua inativação e perpetuando a ativação do complemento — presente em ~50% dos casos de DDD e em menor proporção da C3GN."
  },
  c3g_servais:{
    label:"Servais A et al. — C3 Glomerulopathy Complement (Kidney Int 2012)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)56185-9/fulltext",
    journal:"Kidney Int 2012;82(4):454-464",
    ano:2012,tipo:"Estudo Clínico",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Anormalidades genéticas e adquiridas do complemento (anti-C3NeF, mutações CFH/CFI/CFB) em DDD e C3GN",icon:"📖",
    resumo:"Estudo clínico caracterizando as anormalidades do complemento em série de pacientes com C3 glomerulopatia. Identificou fator nefrítico C3 (C3NeF) como a alteração adquirida mais frequente, presente em ~50% dos casos de DDD e porção dos casos de C3GN. Mutações em genes do complemento (CFH, CFI, CFB, C3) detectadas em subgrupo relevante — com implicações para risco de recorrência pós-transplante e potencial resposta à terapia com inibidores de complemento.",
    conclusao:"A investigação de anormalidades do complemento (C3NeF, anti-FH, mutações CFH/CFI/CFB) é parte essencial do diagnóstico de C3G — tanto para compreender a patogênese quanto para estimar risco de recorrência no transplante.",
    curiosidade:"Pacientes com C3G por mutações de CFH têm risco particularmente elevado de recorrência pós-transplante renal (>80%) em comparação aos com C3NeF isolado — dado que influencia diretamente a indicação e o protocolo de transplante."
  },
  mpgn_fervenza:{
    label:"Sethi S, Fervenza FC — MPGN New Classification (NEJM 2012)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMra1108178",
    journal:"N Engl J Med 2012;366(12):1119-1131",
    ano:2012,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Nova classificação da GNMP: por etiologia (imuno-complexos vs complemento) e não pelo padrão histológico isolado",icon:"📖",
    resumo:"Revisão seminal que propôs reclassificar a glomerulonefrite membranoproliferativa (GNMP) com base na etiologia, não no padrão histológico. O padrão GNMP pode resultar de: (1) depósito de imunocomplexos (infecção, doença autoimune, gamopatia) → imunofluorescência com Ig + C3; ou (2) disregulação do complemento (C3G) → IF com C3 predominante sem Ig. A classificação etiológica orienta investigação e tratamento de forma radicalmente diferente.",
    conclusao:"A reclassificação de Sethi & Fervenza foi o marco conceitual que permitiu distinguir C3G de GNMP mediada por imunocomplexos — transformando diagnóstico e abordagem terapêutica de um padrão histológico genérico em doenças com patogêneses específicas.",
    curiosidade:"Antes dessa reclassificação, 'GNMP' era tratada como diagnóstico único com esquemas imunossupressores empíricos. A distinção etiológica revelou que tratar C3G com imunossupressão convencional (dirigida a Ig) é equivocado — o alvo correto é o complemento."
  },
  mpa_anca_hiemstra:{
    label:"Hiemstra TF et al. — MMF vs AZA ANCA (JAMA 2010)",
    url:"https://jamanetwork.com/journals/jama/fullarticle/186390",
    journal:"JAMA 2010;304(21):2381-2388",
    ano:2010,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"MMF NÃO superior à azatioprina na manutenção da vasculite ANCA — mais recidivas com MMF; azatioprina permanece preferida",icon:"🔬"
  },
  akiki_trial:{
    label:"Gaudry S et al. — AKIKI (NEJM 2016)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1603017",
    journal:"N Engl J Med 2016;375(2):122-133",
    ano:2016,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Início precoce de TRS não reduziu mortalidade vs estratégia expectante — muitos pacientes do grupo tardio recuperaram sem TRS",icon:"🔬"
  },
  ideal_icu_trial:{
    label:"Barbar SD et al. — IDEAL-ICU (NEJM 2018)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1803213",
    journal:"N Engl J Med 2018;379(15):1431-1442",
    ano:2018,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"TRS precoce vs tardio em LRA+sepse: sem diferença em mortalidade — consistente com AKIKI e STARRT-AKI",icon:"🔬"
  },
  elain_trial:{
    label:"Zarbock A et al. — ELAIN (JAMA 2016)",
    url:"https://jamanetwork.com/journals/jama/fullarticle/2522434",
    journal:"JAMA 2016;315(20):2190-2199",
    ano:2016,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Único RCT favorecendo início PRECOCE de TRS: ↓28 dias de mortalidade em população cirúrgica selecionada — critérios KDIGO NGAL",icon:"🔬"
  },
  water_uti_hooton2018:{
    label:"Hooton TM et al. — Water Intake and UTI (JAMA Intern Med 2018)",
    url:"https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2672516",
    journal:"JAMA Intern Med 2018;178(11):1509-1515",
    ano:2018,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"+1,5L/dia de água ↓50% recorrência de ITU em mulheres pré-menopáusicas — intervenção simples e eficaz",icon:"🔬"
  },
  uromune_vaccine:{
    label:"Lorenzo-Gómez MF et al. — MV140/Uromune (Int Urogynecol J 2013)",
    url:"https://link.springer.com/article/10.1007/s00192-013-2085-9",
    journal:"Int Urogynecol J 2013;24(1):127-134",
    ano:2013,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Vacina bacteriana sublingual (Uromune) ↓recorrências de ITU vs profilaxia antibiótica — imunomodulação urológica",icon:"🔬"
  },
  uti_nonantibiotic:{
    label:"Beerepoot MAJ et al. — Non-Antibiotic UTI Prophylaxis (CID 2013)",
    url:"https://academic.oup.com/cid/article/56/10/1501/307474",
    journal:"Clin Infect Dis 2013;56(10):1501-1509",
    ano:2013,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Cranberry, probióticos e outras profilaxias não antibióticas: evidências modestas para prevenção de ITU recorrente",icon:"📖"
  },
  hivan_fogo_nejm2022:{
    label:"Fogo AB et al. — HIV-Associated Kidney Disease (NEJM 2022)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMra2109296",
    journal:"N Engl J Med 2022;386(5):469-480",
    ano:2022,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Revisão abrangente da nefropatia associada ao HIV (HIVAN): GEFS colapsante, papel do gene APOL1, indicação de TARV precoce",icon:"📖"
  },
  hiv_kidney_cohen:{
    label:"Cohen SD et al. — Kidney Disease in HIV (JAMA 2015)",
    url:"https://jamanetwork.com/journals/jama/fullarticle/2398977",
    journal:"JAMA 2015;313(4):407-408",
    ano:2015,tipo:"Artigo de Revisão",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Espectro da doença renal no HIV: HIVAN, nefropatia por imunocomplexos (HIVICK), nefrotoxicidade antirretroviral (TDF)",icon:"📖"
  },
  anticoag_mn:{
    label:"Hofstra JM et al. — Anticoagulation in MN (Kidney Int 2016)",
    url:"https://www.kidney-international.org/article/S0085-2538(16)00013-4/fulltext",
    journal:"Kidney Int 2016;90(3):678-684",
    ano:2016,tipo:"Análise de Coorte",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Anticoagulação em NM com síndrome nefrótica: albumina <2,5g/dL e proteinúria >8g/dia como limiares para profilaxia de TEV",icon:"📖",
    resumo:"Análise de coorte avaliando risco de TEV em nefropatia membranosa com síndrome nefrótica. Albumina sérica <2,5 g/dL e proteinúria >8 g/dia identificados como limiares de risco elevado para tromboembolismo venoso — em especial trombose de veia renal. Nesses pacientes, o benefício da anticoagulação profilática supera o risco hemorrágico na maioria dos cenários clínicos.",
    conclusao:"Na nefropatia membranosa com síndrome nefrótica grave (albumina <2,5 g/dL e/ou proteinúria >8 g/dia), anticoagulação profilática deve ser considerada — a membranosa é a glomerulopatia com maior risco de trombose de veia renal.",
    curiosidade:"A trombose de veia renal em NM frequentemente é assintomática e detectada incidentalmente — o que significa que o risco trombótico real é maior que o clinicamente aparente. A hipoalbuminemia reduz os níveis de antitrombina III na proporção da perda urinária, explicando o limiar de albumina <2,5 g/dL como preditor de risco."
  },
  vte_nephrotic_lim:{
    label:"Lim W et al. — VTE in Nephrotic Syndrome (Thromb Res 2022)",
    url:"https://www.thrombosisresearch.com/article/S0049-3848(21)00497-3/fulltext",
    journal:"Thromb Res 2022;210:73-81",
    ano:2022,tipo:"Revisão Sistemática",badge:"META",badgeColor:"#ec4899",
    impacto:"TEV no SN: incidência 8-10%; NM tem maior risco de trombose de veia renal; albumina <2,5g/dL é principal preditor",icon:"📊",
    resumo:"Revisão sistemática sobre tromboembolismo venoso no síndrome nefrótica. Risco maior em nefropatia membranosa, especialmente com albumina sérica muito baixa, proteinúria intensa e fatores adicionais de trombose. Albumina <2,5 g/dL é marcador clínico importante, mas a decisão de anticoagulação profilática deve integrar histologia, albumina, sangramento, idade e fatores trombóticos.",
    conclusao:"Em síndrome nefrótica, membranosa + albumina muito baixa é o cenário clássico de maior risco trombótico.",
    curiosidade:"A hipercoagulabilidade resulta de perda urinária de anticoagulantes naturais, aumento de fatores pró-coagulantes, ativação plaquetária e hemoconcentração."
  },
  eps_dp:{
    label:"Brown MC et al. — Encapsulating Peritoneal Sclerosis (Kidney Int 2009)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)53449-9/fulltext",
    journal:"Kidney Int 2009;76(11):1206-1212",
    ano:2009,tipo:"Artigo de Posição",badge:"CONSENSO",badgeColor:"#f59e0b",
    impacto:"EPS: complicação rara mas grave da DP longa (>8 anos), precipitada por peritonites repetidas; apresentação: obstrução intestinal encapsulante",icon:"⚠️"
  },
  atheroembolic_scolari:{
    label:"Scolari F et al. — Atheroembolic Renal Disease (Kidney Int 2007)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)52558-0/fulltext",
    journal:"Kidney Int 2007;72(11):1298-1303",
    ano:2007,tipo:"Estudo Observacional",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Ateroembolismo renal: precipitado por cateterismo/anticoagulação; livedo reticularis, eosinofilia, complemento baixo; prognóstico reservado",icon:"📖"
  },
  idsa_uti_guideline:{
    label:"IDSA — Guia UTI 2011",
    url:"https://academic.oup.com/cid/article/52/5/e103/388285",
    journal:"Clin Infect Dis 2011;52(5):e103-e120",
    ano:2011,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Diagnóstico e tratamento de ITU não complicada, complicada e em populações especiais",icon:"📋"
  },
  hooton_uti_nejm:{
    label:"Hooton TM — Uncomplicated UTI (NEJM 2012)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMcp1104429",
    journal:"N Engl J Med 2012;366(11):1028-1037",
    ano:2012,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Fisiopatologia, diagnóstico e manejo de ITU não complicada em mulheres",icon:"📖"
  },
  sbn_pbe_guideline:{
    label:"SBN — Consenso Peritonite na DP",
    url:"https://www.bjnephrology.org/article/peritoneal-dialysis-related-peritonitis-treatment-recommendations/",
    journal:"Brazilian Journal of Nephrology",
    ano:2019,tipo:"Consenso Nacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Diagnóstico, tratamento e prevenção de peritonite em diálise peritoneal",icon:"📋"
  },
  ispd_peritonitis_guideline:{
    label:"ISPD — Peritonitis Guideline 2022",
    url:"https://journals.sagepub.com/doi/10.1177/08968608221096963",
    journal:"Peritoneal Dialysis International 2022;42(2):110-153",
    ano:2022,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Padrão ouro para diagnóstico e tratamento de peritonite na diálise peritoneal",icon:"📋",
    resumo:"Define peritonite em DP pelo critério de pelo menos 2 de 3: dor abdominal ou efluente turvo; leucócitos no efluente >100/µL após dwell ≥2h com >50% PMN; ou cultura positiva. Tratamento empírico cobre gram-positivos (vancomicina ou cefalosporina de 1ª geração) e gram-negativos (aminoglicosídeo ou cefalosporina de 3ª geração), ajustado pelo antibiograma em 48–72h. Metas de qualidade: cultura negativa <15% dos episódios; taxa global ≤0,40 episódio/paciente-ano; >80% dos pacientes livres de peritonite ao ano.",
    conclusao:"A peritonite é a principal causa de falência de técnica na DP — diagnóstico precoce e antibioticoterapia intraperitoneal adequada são determinantes para preservar o acesso peritoneal.",
    curiosidade:"A DP usa o próprio peritônio como membrana dialítica. O PET (Peritoneal Equilibration Test) classifica os pacientes em altos ou baixos transportadores e orienta a escolha entre regimes curtos e frequentes (altos transportadores) ou prolongados (baixos transportadores)."
  },
  cmv_kdigo_tx:{
    label:"KDIGO CMV in Transplant 2022",
    url:"https://kdigo.org/guidelines/transplant-recipient-care/",
    journal:"American Journal of Transplantation 2022",
    ano:2022,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Profilaxia, diagnóstico e tratamento de CMV em receptores de transplante renal",icon:"📋"
  },
  bk_virus_review:{
    label:"Hirsch HH et al. — BK Polyomavirus (NEJM 2016)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMra1507440",
    journal:"N Engl J Med 2016;374(19):1851-1862",
    ano:2016,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Fisiopatologia, diagnóstico (virúria/viremia) e manejo da nefropatia por vírus BK",icon:"📖"
  },
  sepsis3_jama:{
    label:"Singer M et al. — Sepsis-3 (JAMA 2016)",
    url:"https://jamanetwork.com/journals/jama/fullarticle/2492881",
    journal:"JAMA 2016;315(8):801-810",
    ano:2016,tipo:"Consenso/Definição",badge:"CONSENSO",badgeColor:"#f59e0b",
    impacto:"Nova definição de sepse (disfunção orgânica ameaçadora à vida por resposta desregulada à infecção) e choque séptico",icon:"⚠️"
  },
  pediatric_nephrotic_syndrome:{
    label:"KDIGO — Pediatric GN 2012",
    url:"https://kdigo.org/guidelines/gn/",
    journal:"Kidney International Supplements 2012;2(2):139-274",
    ano:2012,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Diagnóstico e tratamento da síndrome nefrótica pediátrica, incluindo LESM e GEFS",icon:"📋"
  },
  tarshish_nephrotic_ISKDC:{
    label:"ISKDC — Primary Nephrotic Syndrome in Children (1978)",
    url:"https://pubmed.ncbi.nlm.nih.gov/357069/",
    journal:"Kidney Int 1978;14(5):583-599",
    ano:1978,tipo:"Estudo Clínico",badge:"RCT",badgeColor:"#10b981",
    impacto:"Estudo seminal: 93% de remissão com prednisona em LESM; base para classificação corticoide-sensível vs resistente",icon:"🔬"
  },
  shu_nejm_karpman:{
    label:"Karpman D et al. — HUS (NEJM 2017)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMra1510916",
    journal:"N Engl J Med 2017;377(16):1570-1580",
    ano:2017,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Fisiopatologia da SHU (Shiga toxina, complemento), diagnóstico diferencial e manejo",icon:"📖"
  },
  alport_syndrome_review:{
    label:"Kashtan CE et al. — Alport Syndrome (CJASN 2013)",
    url:"https://cjasn.asnjournals.org/content/8/3/461",
    journal:"Clin J Am Soc Nephrol 2013;8(3):461-470",
    ano:2013,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Revisão da síndrome de Alport: herança ligada ao X, colágeno tipo IV, prognóstico e tratamento com IECA",icon:"📖"
  },
  dose_adjustment_ckd_aronoff:{
    label:"Aronoff GR et al. — Drug Prescribing in Renal Failure (5ª ed.)",
    url:"https://www.acponline.org/clinical-information/publications-and-products/acp-press/drug-prescribing-in-renal-failure",
    journal:"American College of Physicians Press",
    ano:2007,tipo:"Livro Didático",badge:"LIVRO",badgeColor:"#8b5cf6",
    impacto:"Referência padrão para ajuste de dose de medicamentos em insuficiência renal e diálise",icon:"📚"
  },
  nsaid_nephrotoxicity_whelton:{
    label:"Whelton A — Nephrotoxicity of NSAIDs (Am J Med 1999)",
    url:"https://www.amjmed.com/article/S0002-9343(99)00072-9/fulltext",
    journal:"Am J Med 1999;106(5B):13S-24S",
    ano:1999,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Mecanismos de nefrotoxicidade dos AINEs: redução de PGE2, vasoconstricção aferente, NTI",icon:"📖"
  },
  vancomycin_monitoring_ashp:{
    label:"Rybak MJ et al. — Vancomycin TDM (ASHP/IDSA/SIDP 2020)",
    url:"https://academic.oup.com/ajhp/article/77/11/835/5810200",
    journal:"Am J Health-Syst Pharm 2020;77(11):835-864",
    ano:2020,tipo:"Consenso Clínico",badge:"CONSENSO",badgeColor:"#f59e0b",
    impacto:"Monitoramento de vancomicina por AUC/MIC em vez de vale sérico — reduz nefrotoxicidade sem perda de eficácia",icon:"⚠️"
  },
  acid_base_adroguenejm:{
    label:"Adrogue HJ, Madias NE — Acid-Base Disorders (NEJM 1998)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJM199803053381007",
    journal:"N Engl J Med 1998;338(10):656-664",
    ano:1998,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Abordagem diagnóstica e terapêutica dos distúrbios ácido-base — referência didática clássica",icon:"📖"
  },
  dka_management_kitabchi:{
    label:"Kitabchi AE et al. — DKA & HHS (Diabetes Care 2009)",
    url:"https://diabetesjournals.org/care/article/32/7/1335/28555",
    journal:"Diabetes Care 2009;32(7):1335-1343",
    ano:2009,tipo:"Revisão/Diretriz",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Critérios diagnósticos, tratamento com insulina/hidratação e prevenção de cetoacidose diabética",icon:"📋"
  },
  atr_rodriguez_soriano:{
    label:"Rodriguez-Soriano J — Renal Tubular Acidosis (Pediatr Nephrol 2002)",
    url:"https://link.springer.com/article/10.1007/s004670100721",
    journal:"Pediatr Nephrol 2002;17(3):181-188",
    ano:2002,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Classificação, fisiopatologia e tratamento das acidoses tubulares renais tipos 1, 2 e 4",icon:"📖"
  },
  rituximab_mn_mentor:{
    label:"Fervenza FC et al. — MENTOR Trial (NEJM 2019)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1900100",
    journal:"N Engl J Med 2019;381(1):36-46",
    ano:2019,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Rituximabe superior à ciclosporina em remissão sustentada da nefropatia membranosa — nova primeira linha",icon:"🔬"
  },
  rituximab_gesf_review:{
    label:"Basu B et al. — Rituximab in FSGS (Pediatr Nephrol 2015)",
    url:"https://link.springer.com/article/10.1007/s00467-014-2892-1",
    journal:"Pediatr Nephrol 2015;30(11):1831-1840",
    ano:2015,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Uso de rituximabe em GEFS pediátrica refratária — mecanismos e resultados clínicos",icon:"📖"
  },
  cyclophosphamide_anca_rave:{
    label:"Jones RB et al. — RAVE Trial (NEJM 2010)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa0909905",
    journal:"N Engl J Med 2010;363(3):221-232",
    ano:2010,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Rituximabe não inferior a ciclofosfamida na indução de remissão em vasculite ANCA",icon:"🔬"
  },

  bliss_ln:{
    label:"BLISS-LN Trial (Belimumabe)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2029238",
    journal:"N Engl J Med 2020;383(12):1117-1128",
    ano:2020,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Belimumabe + terapia padrão ↑ remissão renal primária e ↓ flares em Nefrite Lúpica",icon:"💊"
  },
  visionary_trial:{
    label:"VISIONARY Trial (Sibeprenlimabe)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2305361",
    journal:"N Engl J Med 2023;389(1):22-32",
    ano:2023,tipo:"Ensaio Clínico Fase II",badge:"RCT",badgeColor:"#10b981",
    impacto:"Sibeprenlimabe (anti-APRIL) ↓ proteinúria 47% em Nefropatia por IgA",icon:"💊",
    resumo:"ECR fase II (n=155), sibeprenlimabe (anticorpo monoclonal anti-APRIL) vs placebo em IgAN com proteinúria ≥1 g/dia apesar de SRAA otimizado. APRIL (A Proliferation-Inducing Ligand) é um membro da família TNF que estimula a produção de IgA1 galactose-deficiente via receptor TACI em células B. Reduziu proteinúria em 47% vs aumento de 5% no placebo aos 12 meses.",
    conclusao:"VISIONARY validou o bloqueio de APRIL como abordagem upstream na IgAN, atuando sobre o estímulo à produção do autoanticorpo patogênico — base para o trial de fase 3 em andamento.",
    curiosidade:"O anti-APRIL difere do anti-BAFF (belimumabe no lúpus) por ser mais seletivo: APRIL tem papel crítico na switch de IgA nas mucosas — a seletividade pode traduzir-se em menor imunossupressão sistêmica que o bloqueio mais amplo do eixo BAFF."
  },
  pisces_study:{
    label:"PISCES Trial (Ômega-3 em HD)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2407495",
    journal:"N Engl J Med 2025",
    ano:2025,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Ômega-3 purificado ↓ arritmias ventriculares e morte súbita em hemodiálise",icon:"💊",
    resumo:"ECR fase III avaliando ácidos graxos ômega-3 purificados (EPA/DHA) em pacientes em hemodiálise, população com altíssima incidência de morte súbita cardíaca e arritmias ventriculares. Demonstrou redução de arritmias ventriculares e morte súbita. Publicado no NEJM em 2025.",
    conclusao:"PISCES fornece base para considerar ômega-3 como estratégia de redução de risco arrítmico em hemodiálise — população de altíssimo risco cardiovascular para a qual as opções farmacológicas são limitadas pela DRC avançada.",
    curiosidade:"Pacientes em hemodiálise têm risco de morte súbita cardíaca ~50 vezes maior que a população geral — contribuem as alterações eletrolíticas peri-diálise (hipocalemia, hipomagnesia), uremia, calcificação vascular e disfunção autonômica associadas à DRC-5D."
  },
  roxadustat_trial:{
    label:"Roxadustat ANDES/PYRENEES Trials",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1901713",
    journal:"N Engl J Med 2019;381(11):1011-1022",
    ano:2019,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Roxadustat eficaz para anemia da DRC, oral, sem monitorização de nível sérico",icon:"💊"
  },
  empact_mi_trial:{
    label:"EMPACT-MI Trial (Empagliflozina pós-IAM)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2401316",
    journal:"N Engl J Med 2024;390(16):1455-1466",
    ano:2024,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozina após IAM ↓ mortalidade/IC e protegeu função renal",icon:"💊"
  },
  advor_trial:{
    label:"ADVOR Trial (Acetazolamida + Furosemida na IC)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2203094",
    journal:"N Engl J Med 2022;387(13):1185-1195",
    ano:2022,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Acetazolamida + furosemida ↑ descongestão sem aumento de nefrotoxicidade em IC",icon:"💊"
  },
  lumasiran_trial:{
    label:"ILLUMINATE-A Trial (Lumasiran)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2022978",
    journal:"N Engl J Med 2021;385(19):1737-1746",
    ano:2021,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Lumasiran (RNAi) ↓ 65% oxalato urinário em Hiperoxalúria Primária Tipo 1",icon:"💊"
  },
  mainritsan_trial:{
    label:"MAINRITSAN Trial (Rituximabe vs Azatioprina em ANCA)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1404231",
    journal:"N Engl J Med 2014;371(19):1771-1780",
    ano:2014,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Rituximabe superior à azatioprina na manutenção de remissão em vasculite ANCA",icon:"💊"
  },
  sotagliflozin_trial:{
    label:"SOLOIST-WHF Trial (Sotagliflozina na IC)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2030422",
    journal:"N Engl J Med 2021;384(2):117-128",
    ano:2021,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Sotagliflozina (dual SGLT1/2) ↓ mortalidade CV e hospitalizações em IC",icon:"💊"
  },
  vadadustat_trial:{
    label:"PRO2TECT Trial (Vadadustat em DRC não-dialítica)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2101791",
    journal:"N Engl J Med 2021;384(17):1589-1600",
    ano:2021,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Vadadustat não inferior à darbepoetina em Hb, mas não atingiu critério CV em não-dialíticos",icon:"🔬"
  },
  imlifidase_study:{
    label:"Imlifidase em Transplante Hiperimune (Jordan et al.)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2114694",
    journal:"N Engl J Med 2022;386(26):2544-2555",
    ano:2022,tipo:"Estudo Clínico",badge:"STUDY",badgeColor:"#0ea5e9",
    impacto:"Imlifidase cliva IgG e permite transplante renal em pacientes hiperimunes com prova cruzada positiva",icon:"🔬"
  },
  ext1ext2_sethi:{
    label:"Sethi S et al. — EXT1/EXT2 Membranous Nephropathy (JASN 2019)",
    url:"https://jasn.asnjournals.org/content/30/6/1123",
    journal:"JASN 2019;30(6):1123-1136",
    ano:2019,tipo:"Estudo Observacional",badge:"STUDY",badgeColor:"#0ea5e9",
    impacto:"EXT1/EXT2 identificados como antígenos da NM lupus-like; associação com autoimunidade e melhor prognóstico renal",icon:"🔬"
  },
  penkid_study:{
    label:"Hollinger A et al. — penKid em LRA (Critical Care 2018)",
    url:"https://ccforum.biomedcentral.com/articles/10.1186/s13054-018-2007-9",
    journal:"Critical Care 2018;22(1):189",
    ano:2018,tipo:"Estudo Observacional",badge:"STUDY",badgeColor:"#0ea5e9",
    impacto:"Proenkephalin A (penKid) como biomarcador precoce de LRA em choque séptico — independente de massa muscular",icon:"🔬"
  },
  evaluate_trial:{
    label:"EVALUATE Trial (Diálise vs Conservador em Idosos)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2308687",
    journal:"N Engl J Med 2024",
    ano:2024,tipo:"Ensaio Clínico",badge:"RCT",badgeColor:"#10b981",
    impacto:"Diálise não superior ao manejo conservador em qualidade de vida em pacientes > 75 anos com DRC estágio 5",icon:"🔬"
  },
  kpmp_project:{
    label:"KPMP — Kidney Precision Medicine Project",
    url:"https://www.kpmp.org/",
    journal:"CJASN 2021;16(9):1418-1428",
    ano:2021,tipo:"Consórcio de Pesquisa",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Atlas molecular renal com single-cell RNA-seq — redefinindo doenças renais para terapias de precisão",icon:"🔬"
  },


  // ===== REFS ADICIONADOS v6.1 =====
  finerenone_2025:{
    label:"Finerenona — FIDELIO-DKD + FIGARO-DKD (FIDELITY)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2025845",
    journal:"N Engl J Med 2020–2021; JAMA 2022",
    ano:2022,tipo:"Análise Pooled RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Finerenona ↓20% desfecho renal e ↓14% MACE em DRC diabética — análise combinada FIDELITY (>13.000 pacientes)",icon:"💊"
  },
  fidelio_dkd:{
    label:"FIDELIO-DKD Trial (Finerenona)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2025845",
    journal:"N Engl J Med 2020;383(23):2219-2229",
    ano:2020,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Finerenona ↓18% desfecho renal composto · ↓14% eventos CV · Antagonista não-esteroidal do receptor mineralocorticoide",icon:"💊"
  },
  finerenone_t1d_2025:{
    label:"FIGARO-DKD Trial (Finerenona)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2110956",
    journal:"N Engl J Med 2021;385(24):2252-2263",
    ano:2021,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Finerenona ↓13% MACE e ↓23% novo início de DRC em DM2 com DRC moderada-grave",icon:"💊"
  },
  finerenone_transplant_2025:{
    label:"Finerenona em Transplante Renal — Evidência Emergente",
    url:"https://www.kidney-international.org/",
    journal:"Kidney International 2024",
    ano:2024,tipo:"Revisão/Estudo Piloto",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Dados preliminares de segurança e eficácia de ARM não-esteroidais em receptores de transplante renal (evidência em desenvolvimento)",icon:"📖"
  },
  confidence_trial_2025:{
    label:"CONFIDENCE Trial (Finerenona + Empagliflozina)",
    url:"https://www.thelancet.com/journals/landia/article/PIIS2213-8587(24)00243-8/fulltext",
    journal:"Lancet Diabetes Endocrinol 2025",
    ano:2025,tipo:"Ensaio Clínico Fase II",badge:"RCT",badgeColor:"#10b981",
    impacto:"Iniciação simultânea finerenona + empagliflozina bem tolerada; maior redução de albuminúria que monoterapia isolada em DRC diabética",icon:"💊"
  },
  bestow_trial_2025:{
    label:"BESTOW Trial (Tegoprubart em Transplante Renal)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2404733",
    journal:"N Engl J Med 2024;391(26):2493-2504",
    ano:2024,tipo:"Ensaio Clínico Fase II",badge:"RCT",badgeColor:"#10b981",
    impacto:"Tegoprubart (anti-CD40L) não-inferior ao tacrolimus em rejeição aguda; menor DGF e preservação de TFGe em transplante renal",icon:"💊",
    resumo:"ECR fase II (BESTOW, n=~100) comparando tegoprubart (anticorpo anti-CD40L/CD154) vs tacrolimus como imunossupressor base em transplante renal. Tegoprubart foi não inferior ao tacrolimus em rejeição aguda e associou-se a menor incidência de atraso na função do enxerto (DGF) e melhor preservação de TFGe. Publicado no NEJM em 2024. Abre perspectiva de imunossupressão sem inibidor de calcineurina.",
    conclusao:"BESTOW representa a evidência mais recente de que o bloqueio da co-estimulação CD40L pode substituir o tacrolimus no transplante renal — potencialmente evitando a nefrotoxicidade e a neurotoxicidade crônica dos inibidores de calcineurina.",
    curiosidade:"O eixo CD40-CD40L é central na ativação de células T e B durante a rejeição — bloqueá-lo com anti-CD40L não apenas reduz a resposta imune imediata mas também pode prevenir a rejeição mediada por anticorpos a longo prazo, problema ainda não resolvido com tacrolimus."
  },
  fine_one_2025:{
    label:"FINE-ONE Trial (Finerenona em IgAN)",
    url:"https://www.jasn.org/",
    journal:"J Am Soc Nephrol 2025",
    ano:2025,tipo:"Ensaio Clínico Fase II/III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Finerenona ↓ proteinúria e atenua inflamação/fibrose renal em Nefropatia por IgA — nova indicação potencial do ARM não-esteroidal",icon:"💊"
  },
  ici_nia_cortazar_2016:{
    label:"Cortazar et al. — NIA por Inibidores de Checkpoint",
    url:"https://www.kidney-international.org/article/S0085-2538(16)30201-1/fulltext",
    journal:"Kidney International",
    ano:2016,tipo:"Série de Casos",badge:"ESTUDO",badgeColor:"#f59e0b",
    impacto:"Série seminal: NIA é o padrão histológico predominante na LRA por ICI (anti-PD-1/PD-L1); corticosteroides são a base do tratamento",icon:"🔬"
  },
  kdigo_bp_ckd_2021:{
    label:"KDIGO Blood Pressure in CKD 2021",
    url:"https://kdigo.org/guidelines/blood-pressure-in-ckd/",
    journal:"Kidney International",
    ano:2021,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Alvo PA < 120 mmHg sistólica em DRC — reduz progressão renal e eventos cardiovasculares; base das metas tensionais atuais",icon:"📋",
    resumo:"Diretriz KDIGO para PA em DRC não dialítica. Sugere alvo de PAS <120 mmHg quando tolerado, desde que a medida seja padronizada. Esse alvo não deve ser aplicado automaticamente à medida casual de consultório, porque a técnica padronizada tende a produzir valores menores.",
    conclusao:"O alvo <120 mmHg é alvo de medida padronizada; na prática clínica, individualizar por idade, fragilidade, sintomas, proteinúria, risco cardiovascular, ortostatismo e DRC avançada.",
    curiosidade:"Ignorar a diferença entre medida padronizada e casual pode levar a intensificação excessiva do anti-hipertensivo."
  },
  nef4d_trial:{
    label:"4D Trial — Atorvastatina em Hemodiálise Diabética",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa040975",
    journal:"New England Journal of Medicine",
    ano:2005,tipo:"Ensaio Clínico Randomizado",badge:"RCT",badgeColor:"#10b981",
    impacto:"Atorvastatina não reduziu mortalidade cardiovascular em diabéticos em hemodiálise — questionou benefício de estatinas em diálise",icon:"💊"
  },
  duplex_fsgs:{
    label:"DUPLEX Trial — Sparsentan em GESF",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)01448-1/fulltext",
    journal:"The Lancet",
    ano:2023,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Sparsentan (dual AT1/ETₐ bloqueio) vs irbesartana em GESF: redução de proteinúria significativa — nova opção terapêutica",icon:"💊"
  },
  rhabdo_review_2023:{
    label:"Rabdomiólise e LRA — Revisão Clin J Am Soc Nephrol",
    url:"https://cjasn.asnjournals.org/",
    journal:"Clinical Journal of the American Society of Nephrology",
    ano:2023,tipo:"Revisão",badge:"REVISÃO",badgeColor:"#8b5cf6",
    impacto:"Patogênese e manejo da LRA por rabdomiólise: hidratação agressiva, monitoramento de CPK e complicações eletrolíticas",icon:"📖"
  },
  hepatorenal_review:{
    label:"SHR-IRA — Síndrome Hepatorrenal (J Hepatol / KDIGO)",
    url:"https://www.journal-of-hepatology.eu/",
    journal:"Journal of Hepatology",
    ano:2023,tipo:"Revisão/Guideline",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Critérios diagnósticos atuais de SHR-IRA: ausência de choque, sem resposta a volume, infecção excluída — terlipressina + albumina",icon:"📋"
  },
  thin_gbm_disease:{
    label:"Doença da MBG Fina — Diagnóstico e Prognóstico (CJASN)",
    url:"https://cjasn.asnjournals.org/",
    journal:"Clinical Journal of the American Society of Nephrology",
    ano:2020,tipo:"Revisão",badge:"REVISÃO",badgeColor:"#8b5cf6",
    impacto:"Hematúria glomerular benigna em heterozigóticos COL4A — diferenciação clínica de Alport; prognóstico geralmente favorável",icon:"📖"
  },
  membranous_pla2r:{
    label:"Beck LH et al. — Anti-PLA2R e Nefropatia Membranosa (NEJM 2009)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa0803684",
    journal:"New England Journal of Medicine",
    ano:2009,tipo:"Artigo Original",badge:"ESTUDO",badgeColor:"#f59e0b",
    impacto:"PLA2R como antígeno-alvo da nefropatia membranosa primária: anti-PLA2R positivo em ~70% — primeiro biomarcador sérico específico",icon:"🔬"
  },
  kdigo_anemia_2024:{
    label:"KDIGO Anemia in CKD 2024",
    url:"https://kdigo.org/guidelines/anemia-in-ckd/",
    journal:"Kidney International",
    ano:2024,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Metas Hb 10-11,5 g/dL; HIF-PHI como alternativa aos ESA; uso criterioso de ferro IV em DRC",icon:"📋"
  },
  kdigo_igan_2021:{
    label:"KDIGO IgAN — Capítulo da Diretriz GN 2021",
    url:"https://kdigo.org/guidelines/glomerular-diseases/",
    journal:"Kidney International",
    ano:2021,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Manejo da nefropatia por IgA: suporte otimizado (IECA/BRA), imunossupressão selecionada e critérios de progressão renal",icon:"📋"
  },
  tamm_horsfall:{
    label:"Uromodulina (Tamm-Horsfall) — Biomarcador Tubular",
    url:"https://jasn.asnjournals.org/",
    journal:"Journal of the American Society of Nephrology",
    ano:2021,tipo:"Revisão",badge:"REVISÃO",badgeColor:"#8b5cf6",
    impacto:"Uromodulina como proteína protetora tubular e biomarcador de lesão — relevante no diagnóstico de NIA e lesão tubular aguda",icon:"📖"
  },
  mentor_trial:{
    label:"Fervenza FC et al. — MENTOR Trial (NEJM 2019)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1900100",
    journal:"N Engl J Med 2019;381(1):36-46",
    ano:2019,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Rituximabe superior à ciclosporina em remissão sustentada da nefropatia membranosa — nova primeira linha terapêutica",icon:"🔬",
    resumo:"ECR multicêntrico (n=130) comparando rituximabe vs. ciclosporina no tratamento da nefropatia membranosa primária por 24 meses. O endpoint primário — remissão completa ou parcial sustentada aos 24 meses — foi alcançado em 60% dos pacientes com rituximabe vs. 20% com ciclosporina (p<0,001). Eventos adversos graves ocorreram em 17% vs. 31%, respectivamente. Após suspensão da ciclosporina, a maioria dos pacientes recaiu; as remissões com rituximabe se mantiveram com maior durabilidade.",
    conclusao:"O MENTOR demonstrou não inferioridade em 12 meses e superioridade do rituximabe em manter remissão proteica até 24 meses, reduzindo o problema clássico de recaída após suspensão do inibidor de calcineurina.",
    curiosidade:"O rituximabe foi inicialmente aprovado para linfoma de células B em 1997. Seu uso na nefropatia membranosa explora o fato de que a maioria dos casos é mediada por anticorpos IgG4 anti-PLA2R produzidos por células B — depletar células B suprime o autoanticorpo e permite a remissão glomerular."
  },
  kdigo_igan_2025:{
    label:"KDIGO IgAN 2025 (Guideline Dedicada)",
    url:"https://kdigo.org/guidelines/glomerular-diseases/",
    journal:"Kidney International",
    ano:2025,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Primeira diretriz KDIGO dedicada exclusivamente à IgAN: alvo proteinúria < 1 g/dia (idealmente < 0,5), sparsentana, budesonida e novas terapias",icon:"📋",
    resumo:"Primeira diretriz KDIGO dedicada exclusivamente à nefropatia por IgA. Define tratamento escalonado: cuidado de suporte otimizado (SRAA + controle de PA + estilo de vida) como base universal; adição de sparsentan ou nefecon (budesonida) conforme proteinúria persistente ≥1 g/dia e risco de progressão; imunossupressão sistêmica com corticoide reservada para casos selecionados de alto risco com TFGe preservada. Alvo de proteinúria: <1 g/dia, idealmente <0,5 g/dia.",
    conclusao:"A diretriz KDIGO 2025 para IgAN consolidou a transição de um paradigma imunossupressor amplo para abordagem escalonada, priorizando terapias não imunossupressoras com evidência de trials fase III.",
    curiosidade:"A IgAN é a glomerulopatia primária mais comum no mundo, mas por décadas o tratamento baseou-se em séries de casos. O surgimento de múltiplos trials fase III em menos de 5 anos (TESTING, NefIgArd, PROTECT, ALIGN) permitiu a elaboração da primeira diretriz dedicada à doença."
  },
  kdigo_adpkd_2025:{
    label:"KDIGO ADPKD 2025 (Rim Policístico Autossômico Dominante)",
    url:"https://kdigo.org/guidelines/adpkd/",
    journal:"Kidney International",
    ano:2025,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Primeira diretriz KDIGO para DPARD: tolvaptana, SGLT2i, controle de PA, dieta e abordagem de progressão renal",icon:"📋",
    resumo:"Primeira diretriz KDIGO dedicada ao rim policístico autossômico dominante. Recomenda tolvaptana (antagonista do receptor V2 da vasopressina) para pacientes com progressão rápida identificada pela classificação de Mayo (classes 1C, 1D, 1E) ou PROPKD score, com TFGe >25 ml/min/1,73m² e após avaliação hepática. Alvo de PA: <110/75 mmHg em adultos jovens com TFGe preservada (baseado no HALT-PKD). Inclui recomendações sobre hidratação, dieta, SGLT2i como terapia emergente e rastreamento de complicações.",
    conclusao:"A diretriz ADPKD 2025 uniformiza o uso de tolvaptana com critérios de progressão rápida (Mayo 1C–1E), evitando tratar pacientes de baixo risco que não se beneficiam e têm risco de hepatotoxicidade.",
    curiosidade:"A vasopressina é o principal driver do crescimento cístico na DPARD: estimula a adenilato ciclase via receptor V2, elevando o AMPc intracelular nas células epiteliais dos cistos e promovendo proliferação e secreção de fluido. O tolvaptana bloqueia esse mecanismo diretamente."
  },
  kdigo_anemia_2026:{
    label:"KDIGO Anemia in CKD 2026",
    url:"https://kdigo.org/guidelines/anemia-in-ckd/",
    journal:"Kidney International",
    ano:2026,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Atualização 2026: ESA preferido sobre HIF-PHI (1ª linha, Grau 2D); metas Hb 10-11,5 g/dL; ferro IV antes de iniciar ESA; HIF-PHI com restrições por segurança CV",icon:"📋",
    resumo:"Atualização da diretriz KDIGO para anemia na DRC. Recomenda ferro intravenoso antes de iniciar agente estimulador de eritropoese (AEE) em pacientes com deficiência funcional ou absoluta de ferro. Para AEE, alvos de hemoglobina entre 10 e 11,5 g/dL, sem ultrapassar 11,5 g/dL de forma intencional. HIF-PHI (inibidores da prolil-hidroxilase do HIF, como roxadustat e daprodustat) reconhecidos como alternativa com restrições por preocupações de segurança cardiovascular — posicionados como segunda linha.",
    conclusao:"A diretriz 2026 mantém AEE como primeira linha para anemia da DRC e posiciona os HIF-PHI com cautela, refletindo os dados de segurança cardiovascular inconsistentes entre as moléculas da classe.",
    curiosidade:"Os HIF-PHI estimulam a produção endógena de eritropoetina inibindo as enzimas PHD2/PHD1 que normalmente degradam o HIF-1α em normóxia — mimando farmacologicamente a resposta fisiológica à hipoxia para tratar anemia sem hipoxia real."
  },
  kdigo_lupus_nephritis_guideline_2024:{
    label:"KDIGO Lupus Nephritis 2024",
    url:"https://kdigo.org/guidelines/glomerular-diseases/",
    journal:"Kidney International",
    ano:2024,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Atualização do manejo da nefrite lúpica: MMF como 1ª linha, voclosporina e belimumabe como opções adjuvantes, biópsia para estadiamento",icon:"📋"
  },
  kdigo_ckd_2024:{
    label:"KDIGO CKD 2024",
    url:"https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    journal:"Kidney International",
    ano:2024,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Padrão global de avaliação e manejo da DRC — SGLT2i, finerenona, rastreamento, progressão e tratamento multidisciplinar",icon:"📋",
    resumo:"Diretriz KDIGO para avaliação e manejo da DRC, versão 2024. Consolida o sistema CGA (Causa, TFGe, Albuminúria) para estadiamento e risco. Recomenda iSGLT2 para DRC com TFGe ≥20 e ACR ≥200 mg/g ou insuficiência cardíaca; finerenona em DRC diabética com TFGe ≥25 e ACR ≥300 mg/g. Incorpora rastreamento ativo em grupos de risco, abordagem multidisciplinar e cuidado de suporte ampliado.",
    conclusao:"A versão 2024 consolida iSGLT2 e finerenona como pilares terapêuticos modernos além do bloqueio do SRAA — transformando o manejo da DRC de reativo para preventivo.",
    curiosidade:"A inclusão simultânea de iSGLT2 e finerenona na diretriz 2024 reflete a convergência de evidências de múltiplos trials (DAPA-CKD, EMPA-KIDNEY, FIDELIO, FIGARO) publicados entre 2019 e 2023 — uma das janelas de evidência mais produtivas da nefrologia."
  }
};
