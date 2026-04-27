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
    icon:"📚"
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
    icon:"📋"
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
    icon:"📋"
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
    icon:"📋"
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
    journal:"Kidney International",
    ano:2021,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Referência global para diagnóstico e tratamento das glomerulopatias",
    icon:"📋"
  },
  kdigo_tx:{
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
  dapa:{
    label:"DAPA-CKD Trial",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2024816",
    journal:"New England Journal of Medicine",
    ano:2020,
    tipo:"Ensaio Clínico Fase III",
    badge:"RCT",
    badgeColor:"#10b981",
    impacto:"↓39% desfecho renal composto · ↓31% mortalidade · Interrompido precocemente por eficácia · Benefício independente de diabetes",
    icon:"💊"
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
    icon:"💊"
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
    icon:"📋"
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
    icon:"💊"
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
    icon:"💊"
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
    icon:"💊"
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
    icon:"💊"
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
    icon:"💊"
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
    icon:"💊"
  },
  kdigo_dialise:{
    label:"KDIGO Dialysis 2012",
    url:"https://kdigo.org/guidelines/hemodialysis/",
    journal:"Kidney International Supplements",
    ano:2012,
    tipo:"Diretriz Internacional",
    badge:"GUIDELINE",
    badgeColor:"#6366f1",
    impacto:"Padrão global para adequação e prescrição em hemodiálise e diálise peritoneal",
    icon:"📋"
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
    icon:"📚"
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
    icon:"📋"
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
    icon:"📚"
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
    impacto:"Tolvaptan ↓18% crescimento de volume renal total em DRPAD — primeiro ensaio de modificação da doença",icon:"🔬"
  },
  reprise_trial:{
    label:"Torres VE et al. — REPRISE (NEJM 2017)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1710030",
    journal:"N Engl J Med 2017;377(20):1930-1942",
    ano:2017,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Tolvaptan confirmou benefício em DRPAD em estágio mais tardio (TFG 25-65) — base para aprovação ampliada",icon:"🔬"
  },
  // --- Nefropatia Diabética Clássica ---
  lewis_ieca_dn_1993:{
    label:"Lewis EJ et al. — Captopril in Diabetic Nephropathy (NEJM 1993)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJM199311253292103",
    journal:"N Engl J Med 1993;329(20):1456-1462",
    ano:1993,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Captopril ↓50% risco de duplicar creatinina em nefropatia diabética — primeiro RCT de nefroproteção com IECA",icon:"🔬"
  },
  renaal_trial:{
    label:"Brenner BM et al. — RENAAL (NEJM 2001)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa011161",
    journal:"N Engl J Med 2001;345(12):861-869",
    ano:2001,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Losartan ↓16% desfecho renal composto em DM2 com nefropatia — estabeleceu BRA como nefroprotetor padrão",icon:"🔬"
  },
  idnt_trial:{
    label:"Lewis EJ et al. — IDNT (NEJM 2001)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa011303",
    journal:"N Engl J Med 2001;345(12):851-860",
    ano:2001,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Irbesartan ↓23% risco de duplicar creatinina vs amlodipino em nefropatia diabética tipo 2",icon:"🔬"
  },
  // --- Controle Glicêmico ---
  dcct_trial:{
    label:"DCCT Research Group (NEJM 1993)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJM199309303291401",
    journal:"N Engl J Med 1993;329(14):977-986",
    ano:1993,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Tratamento intensivo do DM1 ↓63% retinopatia e ↓54% microalbuminúria — base da teoria da memória metabólica",icon:"🔬"
  },
  edic_followup:{
    label:"Nathan DM et al. — EDIC Follow-up (NEJM 2005)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa052187",
    journal:"N Engl J Med 2005;353(25):2643-2653",
    ano:2005,tipo:"Estudo de Coorte (seguimento RCT)",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Memória metabólica confirmada: benefício do controle intensivo do DCCT persistiu 11 anos após o estudo — ↓57% doença CV",icon:"📖"
  },
  // --- SGLT2 ---
  canvas_program:{
    label:"Neal B et al. — CANVAS Program (NEJM 2017)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1611925",
    journal:"N Engl J Med 2017;377(7):644-657",
    ano:2017,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Canagliflozin ↓40% progressão de albuminúria e ↓40% desfechos renais em DM2 de alto risco CV",icon:"🔬"
  },
  empa_kidney:{
    label:"Herrington WG et al. — EMPA-KIDNEY (NEJM 2023)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2204233",
    journal:"N Engl J Med 2023;388(2):117-127",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓28% progressão renal ou morte CV em DRC ampla (TFG 20-45, com ou sem DM)",icon:"🔬"
  },
  flow_trial:{
    label:"FLOW Trial Investigators — Semaglutida (NEJM 2024)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2403945",
    journal:"N Engl J Med 2024;391(18):1718-1730",
    ano:2024,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Semaglutida ↓24% desfecho renal composto em DM2 com DRC — primeiro GLP-1 com benefício renal primário comprovado",icon:"🔬"
  },
  // --- Hipertensão ---
  sprint_trial:{
    label:"SPRINT Research Group (NEJM 2015)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1511939",
    journal:"N Engl J Med 2015;373(22):2103-2116",
    ano:2015,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Alvo de PA < 120 mmHg ↓25% eventos CV vs < 140 mmHg em não-diabéticos de alto risco (exceto DRC avançada)",icon:"🔬"
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
    impacto:"Plasmaférese NÃO reduziu morte ou DRCT em vasculite ANCA grave — mudou prática clínica abandonando plasmaférese de rotina",icon:"🔬"
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
    impacto:"Dapagliflozin ↓26% morte CV + hospitalização por IC em ICFEr (com e sem DM2) — expandiu SGLT2i para IC",icon:"🔬"
  },
  emperor_reduced:{
    label:"Packer M et al. — EMPEROR-Reduced (NEJM 2020)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2022190",
    journal:"N Engl J Med 2020;383(15):1413-1424",
    ano:2020,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓25% morte CV + hospitalização em ICFEr — confirmou classe dos SGLT2i em IC independente de DM",icon:"🔬"
  },
  emperor_preserved:{
    label:"Anker SD et al. — EMPEROR-Preserved (NEJM 2021)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2107038",
    journal:"N Engl J Med 2021;385(16):1451-1461",
    ano:2021,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓21% morte CV + hospitalização em ICFEp — primeiro tratamento com benefício em IC com fração preservada",icon:"🔬"
  },
  deliver_trial:{
    label:"Solomon SD et al. — DELIVER (NEJM 2022)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2211658",
    journal:"N Engl J Med 2022;387(12):1089-1098",
    ano:2022,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Dapagliflozin ↓18% morte CV + hospitalização em IC com FE ≥40% — confirmou SGLT2i em todo o espectro de IC",icon:"🔬"
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
    impacto:"Dapagliflozin ↓17% hospitalização por IC e ↓47% progressão renal em DM2 com múltiplos perfis de risco CV",icon:"🔬"
  },
  empa_reg_outcome:{
    label:"Zinman B et al. — EMPA-REG OUTCOME (NEJM 2015)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1504720",
    journal:"N Engl J Med 2015;373(22):2117-2128",
    ano:2015,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Empagliflozin ↓38% morte CV e ↓35% hospitalização por IC em DM2 alto risco CV — primeiro SGLT2i com benefício CV",icon:"🔬"
  },
  leader_trial:{
    label:"Marso SP et al. — LEADER (NEJM 2016)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa1603827",
    journal:"N Engl J Med 2016;375(4):311-322",
    ano:2016,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Liraglutida ↓13% MACE e ↓22% nefropatia (nova macroalbuminúria ou duplicação de creatinina) em DM2",icon:"🔬"
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
    impacto:"Metas de PTH (2-9× LSN), fósforo e cálcio em DRC; preferência por quelantes não cálcicos; calcitriol/análogos em estágios 3-5D",icon:"📋"
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
    impacto:"Revisão clássica de hiponatremia: diagnóstico, causas, manejo e velocidade de correção segura (máx 10-12 mEq/L/24h)",icon:"📖"
  },
  hyponatremia_verbalis2022:{
    label:"Verbalis JG et al. — Hyponatremia Guidelines 2022 (Kidney Int)",
    url:"https://www.kidney-international.org/article/S0085-2538(22)00329-1/fulltext",
    journal:"Kidney Int 2022;102(5):900-927",
    ano:2022,tipo:"Diretriz/Consenso",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Atualização 2022 do manejo de hiponatremia: fluxograma diagnóstico, indicações de solução hipertônica, tolvaptan",icon:"📋"
  },
  salsa_trial:{
    label:"Baek SH et al. — SALSA Trial (JAMA Intern Med 2021)",
    url:"https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2780319",
    journal:"JAMA Intern Med 2021;181(1):81-92",
    ano:2021,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Bolus de solução hipertônica: risco MAIOR de hipercorreção que infusão contínua — orienta protocolo de correção da hiponatremia",icon:"🔬"
  },
  protect_trial:{
    label:"Rovin BH et al. — PROTECT (Lancet 2023)",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(22)02605-5/fulltext",
    journal:"Lancet 2023;401(10372):173-183",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Sparsentan (dual bloqueio AT1R + ETₐR) ↓50% proteinúria vs irbesartan em IgAN — nova opção terapêutica",icon:"🔬"
  },
  atrasentan_igan:{
    label:"Barratt J et al. — Atrasentan IgAN (NEJM 2023)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2305124",
    journal:"N Engl J Med 2023;389(22):2024-2034",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Atrasentan (antagonista seletivo ETₐR) ↓38% risco de duplicar creatinina em IgAN com proteinúria persistente",icon:"🔬"
  },
  nefigard_trial:{
    label:"Lafayette RA et al. — NefIgArd (Lancet 2023)",
    url:"https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)02765-2/fulltext",
    journal:"Lancet 2023;402(10405):859-870",
    ano:2023,tipo:"Ensaio Clínico RCT",badge:"RCT",badgeColor:"#10b981",
    impacto:"Budesonida de liberação alvo (atua nos Peyer's patches) ↓proteinúria e preserva TFG em IgAN com proteinúria ≥1g/dia",icon:"🔬"
  },
  c3g_consensus:{
    label:"Pickering MC et al. — C3 Glomerulopathy Consensus (Kidney Int 2013)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)30396-7/fulltext",
    journal:"Kidney Int 2013;84(6):1079-1089",
    ano:2013,tipo:"Consenso Clínico",badge:"CONSENSO",badgeColor:"#f59e0b",
    impacto:"Definição e classificação da C3G: C3GN (depósito difuso C3) e DDD (depósito denso intramembranoso), papel do complemento",icon:"⚠️"
  },
  c3g_servais:{
    label:"Servais A et al. — C3 Glomerulopathy Complement (Kidney Int 2012)",
    url:"https://www.kidney-international.org/article/S0085-2538(15)56185-9/fulltext",
    journal:"Kidney Int 2012;82(4):454-464",
    ano:2012,tipo:"Estudo Clínico",badge:"COORTE",badgeColor:"#0ea5e9",
    impacto:"Anormalidades genéticas e adquiridas do complemento (anti-C3NeF, mutações CFH/CFI/CFB) em DDD e C3GN",icon:"📖"
  },
  mpgn_fervenza:{
    label:"Sethi S, Fervenza FC — MPGN New Classification (NEJM 2012)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMra1108178",
    journal:"N Engl J Med 2012;366(12):1119-1131",
    ano:2012,tipo:"Revisão Clínica",badge:"REVIEW",badgeColor:"#0ea5e9",
    impacto:"Nova classificação da GNMP: por etiologia (imuno-complexos vs complemento) e não pelo padrão histológico isolado",icon:"📖"
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
    impacto:"Anticoagulação em NM com síndrome nefrótica: albumina <2,5g/dL e proteinúria >8g/dia como limiares para profilaxia de TEV",icon:"📖"
  },
  vte_nephrotic_lim:{
    label:"Lim W et al. — VTE in Nephrotic Syndrome (Thromb Res 2022)",
    url:"https://www.thrombosisresearch.com/article/S0049-3848(21)00497-3/fulltext",
    journal:"Thromb Res 2022;210:73-81",
    ano:2022,tipo:"Revisão Sistemática",badge:"META",badgeColor:"#ec4899",
    impacto:"TEV no SN: incidência 8-10%; NM tem maior risco de trombose de veia renal; albumina <2,5g/dL é principal preditor",icon:"📊"
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
    impacto:"Padrão ouro para diagnóstico e tratamento de peritonite na diálise peritoneal",icon:"📋"
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
    impacto:"Sibeprenlimabe (anti-APRIL) ↓ proteinúria 47% em Nefropatia por IgA",icon:"💊"
  },
  pisces_study:{
    label:"PISCES Trial (Ômega-3 em HD)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2407495",
    journal:"N Engl J Med 2025",
    ano:2025,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Ômega-3 purificado ↓ arritmias ventriculares e morte súbita em hemodiálise",icon:"💊"
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
    impacto:"Sibeprenlimabe (anti-APRIL) ↓ proteinúria 47% em Nefropatia por IgA",icon:"💊"
  },
  pisces_study:{
    label:"PISCES Trial (Ômega-3 em HD)",
    url:"https://www.nejm.org/doi/full/10.1056/NEJMoa2407495",
    journal:"N Engl J Med 2025",
    ano:2025,tipo:"Ensaio Clínico Fase III",badge:"RCT",badgeColor:"#10b981",
    impacto:"Ômega-3 purificado ↓ arritmias ventriculares e morte súbita em hemodiálise",icon:"💊"
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
    impacto:"Tegoprubart (anti-CD40L) não-inferior ao tacrolimus em rejeição aguda; menor DGF e preservação de TFGe em transplante renal",icon:"💊"
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
    impacto:"Alvo PA < 120 mmHg sistólica em DRC — reduz progressão renal e eventos cardiovasculares; base das metas tensionais atuais",icon:"📋"
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
    impacto:"Rituximabe superior à ciclosporina em remissão sustentada da nefropatia membranosa — nova primeira linha terapêutica",icon:"🔬"
  },
  kdigo_igan_2025:{
    label:"KDIGO IgAN 2025 (Guideline Dedicada)",
    url:"https://kdigo.org/guidelines/glomerular-diseases/",
    journal:"Kidney International",
    ano:2025,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Primeira diretriz KDIGO dedicada exclusivamente à IgAN: alvo proteinúria < 1 g/dia (idealmente < 0,5), sparsentana, budesonida e novas terapias",icon:"📋"
  },
  kdigo_adpkd_2025:{
    label:"KDIGO ADPKD 2025 (Rim Policístico Autossômico Dominante)",
    url:"https://kdigo.org/guidelines/adpkd/",
    journal:"Kidney International",
    ano:2025,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Primeira diretriz KDIGO para DPARD: tolvaptana, SGLT2i, controle de PA, dieta e abordagem de progressão renal",icon:"📋"
  },
  kdigo_anemia_2026:{
    label:"KDIGO Anemia in CKD 2026",
    url:"https://kdigo.org/guidelines/anemia-in-ckd/",
    journal:"Kidney International",
    ano:2026,tipo:"Diretriz Internacional",badge:"GUIDELINE",badgeColor:"#6366f1",
    impacto:"Atualização 2026: ESA preferido sobre HIF-PHI (1ª linha, Grau 2D); metas Hb 10-11,5 g/dL; ferro IV antes de iniciar ESA; HIF-PHI com restrições por segurança CV",icon:"📋"
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
    impacto:"Padrão global de avaliação e manejo da DRC — SGLT2i, finerenona, rastreamento, progressão e tratamento multidisciplinar",icon:"📋"
  }
};
