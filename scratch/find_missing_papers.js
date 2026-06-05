const fs = require('fs');

const rawPapers = [
  "1827 - Reports of Medical Cases Selected with a View of Illustrating the Symptoms and Cure of Diseases by a Reference to Morbid Anatomy - Bright R.",
  "1861 - Liquid Diffusion Applied to Analysis - Graham T.",
  "1913 - On the Removal of Diffusible Substances from the Circulating Blood by Means of Dialysis - Abel JJ, Rowntree LG, Turner BB.",
  "1924 - Versuche der Blutauswaschung am Lebenden mit Hilfe der Dialyse - Haas G.",
  "1941 - Acute Renal Failure with Selective Tubular Injury - Bywaters EGL, Beall D.",
  "1943 - Die künstliche Niere: Ein Dialysator mit großem Flächeninhalt - Kolff WJ, Berk HTJ.",
  "1946 - Acute Renal Failure due to Crush Syndrome: Experience with the Artificial Kidney - Kolff WJ.",
  "1951 - Aspiration Biopsy of the Kidney - Iversen P, Brun C.",
  "1955 - Renal Homotransplantation in Identical Twins - Merrill JP, Murray JE, Harrison JH, Guild WR.",
  "1955 - Hemolytic-Uremic Syndrome: Bilateral Necrosis of the Renal Cortex in Acute Acquired Hemolytic Anemia - Gasser C et al.",
  "1960 - Hemodialysis - Scribner BH et al.",
  "1963 - Renal Homotransplantation: Long-Term Function after Total Body Irradiation and Azathioprine - Murray JE et al.",
  "1965 - Hemolytic-Uremic Syndrome in Childhood - Gianantonio CA et al.",
  "1966 - Membranous Nephropathy - Ehrenreich T et al.",
  "1966 - Hereditary Nephritis, Deafness and Ocular Lesions - Alport AC.",
  "1967 - The Nephrotic Syndrome Associated with Malignant Tumors - Lee JC, Yamauchi H, Hopper J Jr.",
  "1968 - A Clinical and Pathological Study of Rapidly Progressive Glomerulonephritis - Heptinstall RH et al.",
  "1969 - Primary Glomerulonephritis - Berger J et al.",
  "1970 - Analgesic Nephropathy: A Clinicopathologic Study - Kincaid-Smith P.",
  "1971 - Henoch-Schönlein Purpura Nephritis: Clinicopathologic Correlations - Meadow SR et al.",
  "1972 - The Pathogenesis of Nephrotic Syndrome - David E. Bradley",
  "1972 - Renal Tubular Acidosis: A New Look at an Old Problem - Morris RC Jr. et al.",
  "1973 - Focal Segmental Glomerulosclerosis in Adults - Churg J, Habib R, White RHR.",
  "1974 - The Syndrome of Inappropriate Antidiuretic Hormone Secretion - Schrier RW, et al.",
  "1974 - Minimal Change Disease: Discovery and Developments - Shalhoub RJ",
  "1974 - Reduction of Proteinuria by Indomethacin in the Nephrotic Syndrome - Donker AJM et al.",
  "1975 - Hemofiltration - Henderson LW et al.",
  "1975 - Effects of furosemide on electrolytes and water balance in normal and diseased kidneys - C. R. Wilcox",
  "1976 - The pharmacology of diuretics - J. H. Dirks et al.",
  "1976 - Chronic Ambulatory Peritoneal Dialysis - Popovich RP, Moncrief JW et al.",
  "1976 - A Simple Method for Calculating Glomerular Filtration Rate from Plasma Creatinine - Cockcroft DW, Gault MH.",
  "1977 - The Pathophysiology of Proteinuria - Rennke HG, Venkatachalam MA",
  "1977 - The Treatment of Lupus Nephritis with Immunosuppressive Drugs - Donadio JV et al.",
  "1978 - Treatment of Acute Renal Failure - Kleinknecht D et al.",
  "1978 - Nephrotic Syndrome in Children - International Study of Kidney Disease in Children",
  "1978 - Continuous Ambulatory Peritoneal Dialysis - Oreopoulos DG et al.",
  "1979 - Renal transplantation across a HLA barrier by cyclosporine A - Calne RY et al.",
  "1979 - Plasma Exchange in Rapidly Progressive Glomerulonephritis - Lockwood CM et al.",
  "1980 - Chronic Dialysis and Transplants in Children - Potter DE et al.",
  "1980 - Hydrochlorothiazide as a diuretic: A double blind comparison with furosemide - M. Friedman",
  "1980 - The Seattle Artificial Kidney Center Experience with Long-Term Hemodialysis - Scribner BH et al.",
  "1981 - Effect of Captopril on Proteinuria in Diabetic Nephropathy - Taguma Y et al.",
  "1982 - Focal Segmental Glomerulosclerosis: Clinical Course and Response to Therapy - Korbet SM et al.",
  "1983 - Chronic Cyclosporine Nephrotoxicity in Renal Transplantation - Myers BD et al.",
  "1984 - IgA Nephropathy: Long-Term Prognosis and Prognostic Indicators - D'Amico G.",
  "1985 - Renal Vein Thrombosis - Llach F et al.",
  "1985 - Treatment of Idiopathic Membranous Nephropathy with Methylprednisolone and Chlorambucil - Ponticelli C et al.",
  "1986 - The role of loop diuretics in the management of heart failure - J. R. Sutton",
  "1986 - Mechanisms of Disease: The Kidney in Systemic Autoimmune Diseases - Cameron JS.",
  "1986 - Recombinant Human Erythropoietin in Anemic Patients with End-Stage Renal Disease - Eschbach JW et al.",
  "1988 - Control of Glomerular Hypertension Limits Glomerular Injury in Rats - Brenner BM et al.",
  "1988 - Cyclosporine in cadaveric renal transplantation: 5-year follow-up of a multicenter trial - G. Opelz et al.",
  "1988 - Angiotensin-Converting-Enzyme Inhibition in Diabetic Nephropathy - Parving HH et al.",
  "1989 - The Banff Classification of Renal Allograft Pathology: Early Consensus Framework - Solez K et al.",
  "1990 - Canadian Multicentre Trial of Recombinant Human Erythropoietin in Hemodialysis Patients - Canadian Erythropoietin Study Group.",
  "1991 - The Effect of Dietary Protein Restriction and Blood-Pressure Control on the Progression of Chronic Renal Disease - MDRD Study Group.",
  "1992 - The effect of immunosuppressive therapy on renal transplant survival: A meta-analysis - T. Morris et al.",
  "1992 - A Randomized Trial of Plasma Exchange in Severe Lupus Nephritis - Lewis EJ et al.",
  "1993 - ACE Inhibitors in Patients with Diabetes and Proteinuria: Reducing the Risks of ESRD - Lewis EJ et al.",
  "1993 - A More Accurate Method to Estimate Glomerular Filtration Rate from Serum Creatinine - Levey AS et al.",
  "1994 - The Modification of Diet in Renal Disease Study - Levey AS et al.",
  "1994 - Dietary protein restriction on the progression of diabetic and nondiabetic renal disease - Eustace et al.",
  "1994 - Identification of the PKD1 Gene - European Polycystic Kidney Disease Consortium.",
  "1995 - Long-Term Survival of Dialysis Patients - Hemodialysis or Peritoneal Dialysis - Bloembergen WE et al.",
  "1995 - BK Virus Nephropathy in Renal Transplant Recipients - Purighalla R et al.",
  "1995 - The CANUSA Study: Adequacy of Dialysis and Nutrition in Continuous Peritoneal Dialysis - Canada-USA Peritoneal Dialysis Study Group.",
  "1996 - Identification of the PKD2 Gene - Mochizuki T et al.",
  "1997 - The Effect of a Lower Target Blood Pressure on CKD - Klahr S et al.",
  "1997 - The Role of Mycophenolate Mofetil in Renal Transplantation - Remuzzi G et al.",
  "1997 - Ramipril on Decline in GFR in Proteinuric, Non-Diabetic Nephropathy - GISEN Group",
  "1997 - Klotho: A Novel Aging-Suppressor Gene with Renal Expression - Kuro-o M et al.",
  "1998 - Calcium Channel Blockers and Kidney Protection - Bakris GL.",
  "1998 - Normal Hematocrit Trial in Hemodialysis Patients with Cardiac Disease - Besarab A et al.",
  "1999 - The Randomized Aldactone Evaluation Study (RALES) - Remuzzi et al.",
  "1999 - Prevention of Polycystic Kidney Disease by Genetic Repair - Griffin MD et al.",
  "1999 - Long-term results of tacrolimus in renal transplantation: A comparison with cyclosporine - B. Kahan et al.",
  "1999 - Effect of Corticosteroids on IgA Nephropathy Progression - Pozzi C et al.",
  "2000 - FGF23 Is a Circulating Phosphaturic Factor in Tumor-Induced Osteomalacia - Shimada T et al.",
  "2000 - Microalbuminuria, Cardiovascular and Renal Outcomes in HOPE/MICRO-HOPE - Heart Outcomes Prevention Evaluation Investigators.",
  "2001 - Effects of Losartan on Renal and Cardiovascular Outcomes in Patients with T2D - Brenner BM et al.",
  "2001 - The Reduction of Endpoints in NIDDM with the Angiotensin II Antagonist Losartan Study (RENAAL) - Brenner BM et al.",
  "2001 - Irbesartan Diabetic Nephropathy Trial (IDNT) - Lewis EJ et al.",
  "2001 - Irbesartan in Patients with Type 2 Diabetes and Microalbuminuria (IRMA-2) - Parving HH et al.",
  "2002 - The role of hemodynamic forces in glomerular injury and repair - Navar et al.",
  "2002 - Podocyte Biology and Pathogenesis of Kidney Disease - Mundel P et al.",
  "2002 - KDOQI Clinical Practice Guidelines for Chronic Kidney Disease: Evaluation, Classification, and Stratification - National Kidney Foundation.",
  "2002 - Effect of Blood Pressure Lowering and Antihypertensive Drug Class on Progression of Hypertensive Kidney Disease (AASK) - Wright JT Jr et al.",
  "2002 - Effect of Dialysis Dose and Membrane Flux in Maintenance Hemodialysis (HEMO Study) - Eknoyan G et al.",
  "2002 - Automated Peritoneal Dialysis versus Continuous Ambulatory Peritoneal Dialysis Adequacy (ADEMEX) - Paniagua R et al.",
  "2002 - Low-Dose Cyclophosphamide for Severe Lupus Nephritis (Euro-Lupus Nephritis Trial) - Houssiau FA et al.",
  "2003 - Acute Renal Failure: Definition, Outcome Measures, Animal Models, Fluid Therapy and Information Technology Needs (ADQI/RIFLE) - Bellomo R et al.",
  "2004 - A randomized trial of the angiotensin receptor blocker valsartan in CKD - Ruggenenti et al.",
  "2004 - The Role of Oxidative Stress in the Progression of Chronic Kidney Disease - Vaziri ND et al.",
  "2004 - Management of Hyperphosphatemia in End-Stage Renal Disease: A New Paradigm - Block GA et al.",
  "2004 - Chronic Kidney Disease and the Risks of Death, Cardiovascular Events, and Hospitalization - Go AS et al.",
  "2004 - Telmisartan versus Enalapril in Type 2 Diabetes Nephropathy (DETAIL) - Barnett AH et al.",
  "2005 - Renalase, a Novel Renal Hormone: Its Role in Health and Disease - Desir GV.",
  "2005 - Atorvastatin in Patients with Type 2 Diabetes Mellitus Undergoing Hemodialysis (4D Study) - Wanner C et al.",
  "2005 - Mycophenolate Mofetil or Intravenous Cyclophosphamide for Lupus Nephritis Induction - Ginzler EM et al.",
  "2006 - Renal Insufficiency as a predictor of cardiovascular outcomes and the impact of RRT - Pascual, J.",
  "2006 - Long-term Effects of Spironolactone on Proteinuria and CKD - Chrysostomou A et al.",
  "2006 - Correction of Anemia with Epoetin Alfa in Chronic Kidney Disease (CHOIR) - Singh AK et al.",
  "2006 - Normalization of Hemoglobin Level in Patients with Chronic Kidney Disease and Anemia (CREATE) - Drüeke TB et al.",
  "2006 - Tolvaptan in Patients with Hyponatremia (SALT-1 and SALT-2) - Schrier RW et al.",
  "2007 - Autosomal Dominant Polycystic Kidney Disease - Torres VE et al.",
  "2007 - Plasma Exchange and Methylprednisolone in Severe ANCA-Associated Vasculitis (MEPEX) - Jayne DRW et al.",
  "2007 - Reduced Exposure to Calcineurin Inhibitors in Renal Transplantation (ELITE-Symphony) - Ekberg H et al.",
  "2008 - Urinary biomarkers of tubular injury in AKI - Devarajan et al.",
  "2008 - Intensive Blood Glucose Control and Vascular Outcomes in Type 2 Diabetes (ADVANCE) - Patel A et al.",
  "2008 - Intensity of Continuous Renal-Replacement Therapy in Critically Ill Patients (VA/NIH ATN) - Palevsky PM et al.",
  "2009 - CKD-EPI Creatinine Equation for Estimating Glomerular Filtration Rate - Levey AS et al.",
  "2009 - Rosuvastatin and Cardiovascular Events in Patients Undergoing Hemodialysis (AURORA) - Fellström BC et al.",
  "2009 - Rituximab versus Cyclophosphamide for ANCA-Associated Vasculitis (RAVE) - Stone JH et al.",
  "2009 - Mycophenolate Mofetil versus Cyclophosphamide for Induction Treatment of Lupus Nephritis (ALMS) - Appel GB et al.",
  "2009 - The M-Type Phospholipase A2 Receptor as Target Antigen in Idiopathic Membranous Nephropathy - Beck LH Jr et al.",
  "2009 - Intensity of Continuous Renal-Replacement Therapy in Critically Ill Patients (RENAL Study) - RENAL Replacement Therapy Study Investigators.",
  "2010 - Renal Denervation for Resistant Hypertension - Symplicity HTN-2 Investigators",
  "2010 - Early versus Late Initiation of Dialysis in Progressive Chronic Kidney Disease (IDEAL) - Cooper BA et al.",
  "2010 - Intensive Hemodialysis and Clinical Outcomes (Frequent Hemodialysis Network Trial) - FHN Trial Group.",
  "2010 - Rituximab versus Cyclophosphamide in ANCA-Associated Renal Vasculitis (RITUXVAS) - Jones RB et al.",
  "2011 - The Study of Heart and Renal Protection (SHARP) - Baigent C et al.",
  "2012 - KDIGO Clinical Practice Guideline for CKD - KDIGO",
  "2012 - Cinacalcet in Patients Undergoing Hemodialysis (EVOLVE Trial) - Chertow GM et al.",
  "2012 - Rituximab Therapy for Lupus Nephritis (LUNAR) - Rovin BH et al.",
  "2012 - Tolvaptan in Patients with Autosomal Dominant Polycystic Kidney Disease (TEMPO 3:4) - Torres VE et al.",
  "2013 - Targeting the complement pathway in atypical hemolytic uremic syndrome (aHUS) - Legendre CM et al.",
  "2013 - Dapagliflozin in Patients with Type 2 Diabetes (SGLT2 proof mechanístico clínico inicial) - Ferrannini E et al.",
  "2013 - Cure GN / modern glomerular biobank era",
  "2013 - Bardoxolone Methyl in Type 2 Diabetes and Stage 4 Chronic Kidney Disease (BEACON) - de Zeeuw D et al.",
  "2013 - Steroids in IgA Nephropathy: Supportive versus Immunosuppressive Therapy Framework (STOP-IgAN design) - Rauen T et al.",
  "2014 - Genetic Drivers of APOL1-associated Kidney Disease - Genovese G et al.",
  "2014 - Angiotensin Blockade in Early Autosomal Dominant Polycystic Kidney Disease (HALT-PKD) - Schrier RW et al.",
  "2014 - Thrombospondin Type-1 Domain-Containing 7A in Idiopathic Membranous Nephropathy - Tomas NM et al.",
  "2015 - Precision Medicine in AKI Biomarkers (TIMP2*IGFBP7) - Kashani et al.",
  "2015 - Intensive Blood-Pressure Control in Adults with Hypertension (SPRINT) - SPRINT Research Group.",
  "2015 - Intensive Supportive Care plus Immunosuppression in IgA Nephropathy (STOP-IgAN) - Rauen T et al.",
  "2016 - KDIGO Clinical Practice Guideline for Transplant Candidates - KDIGO",
  "2016 - Early versus Delayed Initiation of Renal Replacement Therapy in Critically Ill Patients with AKI (ELAIN) - Zarbock A et al.",
  "2016 - Initiation Strategies for Renal-Replacement Therapy in the ICU (AKIKI) - Gaudry S et al.",
  "2017 - SGLT2 inhibition in CKD paradigmatic shift pre-CKD trials - Neal et al. (CANVAS Program)",
  "2017 - Tolvaptan in Later-Stage Autosomal Dominant Polycystic Kidney Disease (REPRISE) - Torres VE et al.",
  "2017 - Oral Methylprednisolone in IgA Nephropathy (TESTING) - Lv J et al.",
  "2017 - Sodium Bicarbonate versus Sodium Chloride for Prevention of Contrast-Associated AKI (PRESERVE) - Weisbord SD et al.",
  "2018 - Sodium Bicarbonate Therapy for Severe Metabolic Acidemia in ICU Patients (BICAR-ICU) - Jaber S et al.",
  "2019 - DAPA-HF: SGLT2 inhibitors redefining cardiorenal syndrome - McMurray et al.",
  "2019 - Canagliflozin and Renal Outcomes in Type 2 Diabetes and Nephropathy (CREDENCE) - Perkovic V et al.",
  "2019 - Atrasentan and Renal Events in Patients with Type 2 Diabetes and CKD (SONAR) - Heerspink HJL et al.",
  "2019 - Rituximab or Cyclosporine in Membranous Nephropathy (MENTOR) - Fervenza FC et al.",
  "2020 - KDIGO 2020 Diabetes in CKD Clinical Practice Guideline - KDIGO",
  "2020 - DAPA-CKD Trial: Dapagliflozin in Patients with Chronic Kidney Disease - Heerspink et al.",
  "2020 - Timing of Initiation of Renal-Replacement Therapy in Acute Kidney Injury (STARRT-AKI) - STARRT-AKI Investigators.",
  "2020 - Avacopan for the Treatment of ANCA-Associated Vasculitis (ADVOCATE) - Jayne DRW et al.",
  "2020 - Belimumab in Lupus Nephritis (BLISS-LN) - Furie R et al.",
  "2021 - KDIGO Glomerular Diseases Guideline 2021 - KDIGO",
  "2021 - Finerenone pivotal trials iniciais",
  "2021 - FIDELIO-DKD: Mineralocorticoid receptor antagonism with Finerenone in CKD + DM2 - Bakris GL et al.",
  "2021 - FIGARO-DKD: Finerenone in CKD + DM2 focusing on CV outcomes - Pitt B et al.",
  "2021 - EMPA-KIDNEY Trial start & protocol main design - Herrington et al.",
  "2021 - Voclosporin versus Placebo for Lupus Nephritis (AURORA 1) - Rovin BH et al.",
  "2022 - EMPA-KIDNEY Primary Results: empagliflozin reduz progressão CKD amplo espectro - EMPA-KIDNEY Collaborative",
  "2022 - Effects of Methylprednisolone on IgA Nephropathy Progression (TESTING 2) - Lv J et al.",
  "2023 - Complement inhibition in IgA nephropathy (Iptacopan / Nefecon expansão fase 3) - Barratt J et al.",
  "2023 - Targeted-Release Budesonide in IgA Nephropathy (NefIgArd) - Barratt J et al.",
  "2023 - Sparsentan in Patients with IgA Nephropathy (PROTECT) - Heerspink HJL et al.",
  "2024 - KDIGO 2024 CKD Guideline Update (major framework shift: GFR + Albuminuria risk strat continuum) - KDIGO",
  "2024 - Finerenona long term outcomes convergence (FIDELITY final integrated datasets) - Bakris et al.",
  "2024 - Xenotransplantation: The Future Is Here - Riella et. al.",
  "2024 - Semaglutide and Kidney Outcomes in Type 2 Diabetes and CKD (FLOW) - Perkovic V et al."
];

// Load current articles and refs
const artContent = fs.readFileSync('data/articles.js', 'utf8');
const artSandbox = {};
eval(artContent.replace('const nefroArticles =', 'artSandbox.nefroArticles ='));
const nefroArticles = artSandbox.nefroArticles;

const refsContent = fs.readFileSync('data/refs.js', 'utf8');
const refsSandbox = {};
eval(refsContent.replace('const refsDB =', 'refsSandbox.refsDB ='));
const refsDB = refsSandbox.refsDB;

console.log('Current nefroArticles count:', nefroArticles.length);
console.log('Current refsDB keys count:', Object.keys(refsDB).length);

const parsedRaw = rawPapers.map(p => {
  const match = p.match(/^(\d{4})\s*-\s*([^-]+)\s*-\s*(.+)$/);
  if (!match) {
    // try different pattern
    const match2 = p.match(/^(\d{4})\s*-\s*(.+?)\s*-\s*([^-]+)$/);
    if (match2) {
      return { ano: parseInt(match2[1]), title: match2[2].trim(), authors: match2[3].trim(), raw: p };
    }
    return { raw: p };
  }
  return {
    ano: parseInt(match[1]),
    title: match[2].trim(),
    authors: match[3].trim(),
    raw: p
  };
});

console.log('Parsed raw papers count:', parsedRaw.length);

// Let's check duplicates
parsedRaw.forEach((p, i) => {
  if (!p.title) {
    console.log(`Unparsed paper line: "${p.raw}"`);
    return;
  }
  
  // Find in nefroArticles
  const inArt = nefroArticles.some(a => {
    return a.ano === p.ano && (
      a.titulo.toLowerCase().includes(p.title.split(' ')[0].toLowerCase()) ||
      a.autores.toLowerCase().includes(p.authors.split(' ')[0].toLowerCase())
    );
  });
  
  // Find in refsDB
  const inRefs = Object.values(refsDB).some(r => {
    return r.ano === p.ano && (
      r.label.toLowerCase().includes(p.title.split(' ')[0].toLowerCase())
    );
  });
  
  p.inArt = inArt;
  p.inRefs = inRefs;
});

const duplicateArtCount = parsedRaw.filter(p => p.inArt).length;
const duplicateRefsCount = parsedRaw.filter(p => p.inRefs).length;
console.log(`Duplicate with articles: ${duplicateArtCount}`);
console.log(`Duplicate with refsDB: ${duplicateRefsCount}`);

// List some unique new papers
const newPapers = parsedRaw.filter(p => !p.inArt && !p.inRefs);
console.log(`Unique new papers to add: ${newPapers.length}`);
if (newPapers.length > 0) {
  console.log('First 5 new papers:');
  newPapers.slice(0, 5).forEach(p => console.log(`- ${p.ano} - ${p.authors} - ${p.title}`));
}
