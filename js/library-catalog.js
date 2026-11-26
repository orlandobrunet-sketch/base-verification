// NefroQuest — publication identity and stable scroll aliases.
// Presentation only: differing medical payloads keep their own key and access.
// The two aliases were checked across all 8 non-title fields; no array is edited.
(function (root) {
  'use strict';
  const WORKS = [
  {
    "id": "dapa_ckd",
    "pmid": "32970396",
    "source": "https://pubmed.ncbi.nlm.nih.gov/32970396/",
    "members": [
      {
        "key": "dapa",
        "title": "DAPA-CKD Trial",
        "source": "New England Journal of Medicine",
        "year": 2020
      },
      {
        "key": "__art_14",
        "title": "DAPA-CKD",
        "source": "N Engl J Med 2020;383(15):1436-1446. DOI: 10.1056/NEJMoa2024816",
        "year": 2020
      },
      {
        "key": "__art_22",
        "title": "DAPA-CKD Trial",
        "source": "N Engl J Med 2020;383(15):1436-1446. DOI: 10.1056/NEJMoa2024816",
        "year": 2020
      }
    ]
  },
  {
    "id": "bproad",
    "pmid": "39555827",
    "source": "https://pubmed.ncbi.nlm.nih.gov/39555827/",
    "members": [
      {
        "key": "bproad",
        "title": "BPROAD Trial",
        "source": "N Engl J Med 2025;392(12):1155-1167",
        "year": 2025
      },
      {
        "key": "__art_31",
        "title": "BPROAD Trial",
        "source": "N Engl J Med. 2025;392:1155–1167. Publicação online: 16 nov 2024. DOI: 10.1056/NEJMoa2412006",
        "year": 2024
      }
    ]
  },
  {
    "id": "flow",
    "pmid": "38785209",
    "source": "https://pubmed.ncbi.nlm.nih.gov/38785209/",
    "members": [
      {
        "key": "flow_study",
        "title": "FLOW Trial — Semaglutida (NEJM 2024)",
        "source": "N Engl J Med 2024;391(2):109-121",
        "year": 2024
      },
      {
        "key": "__art_30",
        "title": "FLOW Trial",
        "source": "N Engl J Med 2024;391(2):109-121. DOI: 10.1056/NEJMoa2403347",
        "year": 2024
      }
    ]
  },
  {
    "id": "nostone",
    "pmid": "36856614",
    "source": "https://pubmed.ncbi.nlm.nih.gov/36856614/",
    "members": [
      {
        "key": "nostone_study",
        "title": "NOSTONE Trial",
        "source": "New England Journal of Medicine",
        "year": 2022
      },
      {
        "key": "__art_33",
        "title": "NOSTONE Trial",
        "source": "N Engl J Med 2023;388(9):781-791. DOI: 10.1056/NEJMoa2209275",
        "year": 2023
      }
    ]
  },
  {
    "id": "rituxvas",
    "pmid": "20647198",
    "source": "https://pubmed.ncbi.nlm.nih.gov/20647198/",
    "members": [
      {
        "key": "rituxvas_study",
        "title": "Jones et al. — RITUXVAS (NEJM 2010)",
        "source": "N Engl J Med. 2010;363(3):211-220",
        "year": 2010
      },
      {
        "key": "__art_39",
        "title": "RITUXVAS Trial",
        "source": "N Engl J Med 2010;363(3):211-220. DOI: 10.1056/NEJMoa0909169",
        "year": 2010
      }
    ]
  },
  {
    "id": "rave",
    "pmid": "20647199",
    "source": "https://pubmed.ncbi.nlm.nih.gov/20647199/",
    "members": [
      {
        "key": "rave_study",
        "title": "Stone JH et al. — RAVE Trial (NEJM 2010)",
        "source": "N Engl J Med 2010;363(3):221-232",
        "year": 2010
      },
      {
        "key": "__art_25",
        "title": "RAVE Trial",
        "source": "N Engl J Med 2010;363(3):221-232. DOI: 10.1056/NEJMoa0909905",
        "year": 2010
      }
    ]
  },
  {
    "id": "advocate_original_article",
    "pmid": "33596356",
    "source": "https://pubmed.ncbi.nlm.nih.gov/33596356/",
    "members": [
      {
        "key": "advocate_study",
        "title": "ADVOCATE — Artigo Retratado (2021/2026)",
        "source": "N Engl J Med. 2021;384:599-609 — RETRATADO",
        "year": 2021
      },
      {
        "key": "__art_35",
        "title": "Avacopan em Vasculite ANCA",
        "source": "N Engl J Med. 2021;384(7):599–609. DOI: 10.1056/NEJMoa2023386. ARTIGO RETRATADO: 29 jun 2026, DOI: 10.1056/NEJMe2608684",
        "year": 2021
      }
    ]
  },
  {
    "id": "credence",
    "pmid": "30990260",
    "source": "https://pubmed.ncbi.nlm.nih.gov/30990260/",
    "members": [
      {
        "key": "credence",
        "title": "CREDENCE Trial (Canagliflozina)",
        "source": "New England Journal of Medicine",
        "year": 2019
      },
      {
        "key": "__art_21",
        "title": "CREDENCE Trial",
        "source": "N Engl J Med 2019;380(24):2295-2306. DOI: 10.1056/NEJMoa1811744",
        "year": 2019
      }
    ]
  },
  {
    "id": "renaal",
    "pmid": "11565518",
    "source": "https://pubmed.ncbi.nlm.nih.gov/11565518/",
    "members": [
      {
        "key": "renaal_trial",
        "title": "Brenner BM et al. — RENAAL (NEJM 2001)",
        "source": "N Engl J Med 2001;345(12):861-869",
        "year": 2001
      },
      {
        "key": "__art_9",
        "title": "RENAAL - Losartana na Nefropatia Diabética",
        "source": "N Engl J Med 2001;345(12):861-869. DOI: 10.1056/NEJMoa011161",
        "year": 2001
      },
      {
        "key": "__art_40",
        "title": "Estudo RENAAL",
        "source": "N Engl J Med 2001;345(12):861-869. DOI: 10.1056/NEJMoa011161",
        "year": 2001
      }
    ]
  },
  {
    "id": "idnt",
    "pmid": "11565517",
    "source": "https://pubmed.ncbi.nlm.nih.gov/11565517/",
    "members": [
      {
        "key": "idnt_trial",
        "title": "Lewis EJ et al. — IDNT (NEJM 2001)",
        "source": "N Engl J Med 2001;345(12):851-860",
        "year": 2001
      },
      {
        "key": "__art_41",
        "title": "Estudo IDNT",
        "source": "N Engl J Med 2001;345(12):851-860. DOI: 10.1056/NEJMoa011303",
        "year": 2001
      }
    ]
  },
  {
    "id": "canvas_program",
    "pmid": "28605608",
    "source": "https://pubmed.ncbi.nlm.nih.gov/28605608/",
    "members": [
      {
        "key": "canvas_program",
        "title": "Neal B et al. — CANVAS Program (NEJM 2017)",
        "source": "N Engl J Med 2017;377(7):644-657",
        "year": 2017
      },
      {
        "key": "__art_12",
        "title": "CANVAS - Canagliflozina",
        "source": "N Engl J Med 2017;377(7):644-657. DOI: 10.1056/NEJMoa1611925",
        "year": 2017
      }
    ]
  },
  {
    "id": "empa_kidney",
    "pmid": "36331190",
    "source": "https://pubmed.ncbi.nlm.nih.gov/36331190/",
    "members": [
      {
        "key": "empa_kidney",
        "title": "Herrington WG et al. — EMPA-KIDNEY (NEJM 2023)",
        "source": "N Engl J Med 2023;388(2):117-127",
        "year": 2023
      },
      {
        "key": "__art_16",
        "title": "EMPA-KIDNEY",
        "source": "N Engl J Med 2023;388(2):117-127. DOI: 10.1056/NEJMoa2204233",
        "year": 2023
      }
    ]
  },
  {
    "id": "dapa_hf",
    "pmid": "31535829",
    "source": "https://pubmed.ncbi.nlm.nih.gov/31535829/",
    "members": [
      {
        "key": "dapa_hf",
        "title": "McMurray JJV et al. — DAPA-HF (NEJM 2019)",
        "source": "N Engl J Med 2019;381(21):1995-2008",
        "year": 2019
      },
      {
        "key": "__art_13",
        "title": "DAPA-HF - Dapagliflozina na IC",
        "source": "N Engl J Med 2019;381(21):1995-2008. DOI: 10.1056/NEJMoa1911303",
        "year": 2019
      }
    ]
  },
  {
    "id": "fidelio_dkd",
    "pmid": "33264825",
    "source": "https://pubmed.ncbi.nlm.nih.gov/33264825/",
    "members": [
      {
        "key": "fidelio_dkd",
        "title": "FIDELIO-DKD — Finerenona e desfechos renais",
        "source": "N Engl J Med 2020;383(23):2219–2229",
        "year": 2020
      },
      {
        "key": "__art_15",
        "title": "FIDELIO-DKD - Finerenona",
        "source": "N Engl J Med 2020;383(23):2219-2229. DOI: 10.1056/NEJMoa2025845",
        "year": 2020
      },
      {
        "key": "__art_23",
        "title": "FIDELIO-DKD Trial",
        "source": "N Engl J Med 2020;383(23):2219-2229. DOI: 10.1056/NEJMoa2025845",
        "year": 2020
      }
    ]
  },
  {
    "id": "figaro_dkd",
    "pmid": "34449181",
    "source": "https://pubmed.ncbi.nlm.nih.gov/34449181/",
    "members": [
      {
        "key": "figaro_dkd",
        "title": "FIGARO-DKD Trial (Finerenona)",
        "source": "N Engl J Med 2021;385(24):2252-2263",
        "year": 2021
      },
      {
        "key": "__art_24",
        "title": "FIGARO-DKD Trial",
        "source": "N Engl J Med 2021;385(24):2252-2263. DOI: 10.1056/NEJMoa2110956",
        "year": 2021
      }
    ]
  },
  {
    "id": "kdigo_gn_2021",
    "pmid": "34556256",
    "source": "https://kdigo.org/citations/?amp=1",
    "members": [
      {
        "key": "kdigo_gn",
        "title": "KDIGO Glomerular Diseases 2021",
        "source": "Kidney Int 2021;100(4S):S1-S276",
        "year": 2021
      },
      {
        "key": "__art_51",
        "title": "KDIGO Glomerulonefrites 2021",
        "source": "Kidney Int 2021;100(4S):S1-S276",
        "year": 2021
      },
      {
        "key": "__art_190",
        "title": "KDIGO Glomerular Diseases Guideline 2021",
        "source": "Kidney Int 2021;100(4S):S1-S276",
        "year": 2021
      }
    ]
  },
  {
    "id": "convince_2023",
    "pmid": "37326323",
    "source": "https://pubmed.ncbi.nlm.nih.gov/37326323/",
    "members": [
      {
        "key": "convince_study",
        "title": "Blankestijn PJ et al. — CONVINCE (NEJM 2023)",
        "source": "N Engl J Med 2023;389(8):700-709",
        "year": 2023
      },
      {
        "key": "__art_29",
        "title": "CONVINCE Trial",
        "source": "N Engl J Med 2023;389(8):700-709",
        "year": 2023
      }
    ]
  },
  {
    "id": "testing_2022",
    "pmid": "35579642",
    "source": "https://pubmed.ncbi.nlm.nih.gov/35579642/",
    "members": [
      {
        "key": "testing_study",
        "title": "Lv et al. — TESTING: metilprednisolona na nefropatia por IgA (2022)",
        "source": "JAMA. 2022;327(19):1888–1898",
        "year": 2022
      },
      {
        "key": "__art_32",
        "title": "TESTING Trial",
        "source": "JAMA. 2022;327(19):1888–1898. DOI: 10.1001/jama.2022.5368",
        "year": 2022
      }
    ]
  },
  {
    "id": "aurora1_2021",
    "pmid": "33971155",
    "source": "https://pubmed.ncbi.nlm.nih.gov/33971155/",
    "members": [
      {
        "key": "aurora_voclosporina",
        "title": "Rovin et al. — AURORA 1 (Lancet 2021)",
        "source": "Lancet 2021;397(10289):2070-2080",
        "year": 2021
      },
      {
        "key": "__art_49",
        "title": "Nefrite Lúpica e Voclosporina (AURORA)",
        "source": "Lancet 2021;397(10289):2070-2080. DOI: 10.1016/S0140-6736(21)00578-X",
        "year": 2021
      }
    ]
  },
  {
    "id": "fhn_daily_2010",
    "pmid": "21091062",
    "source": "https://pubmed.ncbi.nlm.nih.gov/21091062/",
    "members": [
      {
        "key": "fhn_daily_2010",
        "title": "FHN Daily Trial — Hemodialysis Six versus Three Times Weekly (2010)",
        "source": "New England Journal of Medicine 2010;363(24):2287-2300",
        "year": 2010
      },
      {
        "key": "__art_173",
        "title": "Intensive Hemodialysis and Clinical Outcomes (FHN Trial)",
        "source": "N Engl J Med 2010;363(24):2287-2300",
        "year": 2010
      }
    ]
  },
  {
    "id": "ckdepi_2021",
    "pmid": "34554658",
    "source": "https://pubmed.ncbi.nlm.nih.gov/34554658/",
    "members": [
      {
        "key": "inker_ckdepi_2021",
        "title": "Inker LA et al. — CKD-EPI 2021 sem Raça",
        "source": "N Engl J Med 2021;385(19):1737-1749",
        "year": 2021
      },
      {
        "key": "__art_44",
        "title": "CKD-EPI 2021",
        "source": "N Engl J Med 2021;385(19):1737-1749",
        "year": 2021
      }
    ]
  },
  {
    "id": "starrt_aki_2020",
    "pmid": "32668114",
    "source": "https://pubmed.ncbi.nlm.nih.gov/32668114/",
    "members": [
      {
        "key": "starrt_aki",
        "title": "Wald R et al. — STARRT-AKI (NEJM 2020)",
        "source": "N Engl J Med 2020;383(3):240-251",
        "year": 2020
      },
      {
        "key": "__art_58",
        "title": "TRS em LRA — Estudo STARRT-AKI",
        "source": "N Engl J Med 2020;383(3):240-251",
        "year": 2020
      }
    ]
  },
  {
    "id": "nefigard_2023",
    "pmid": "37591292",
    "source": "https://pubmed.ncbi.nlm.nih.gov/37591292/",
    "members": [
      {
        "key": "nefigard_trial",
        "title": "Lafayette et al. — NefIgArd: resultados de 2 anos (2023)",
        "source": "Lancet. 2023;402(10405):859–870",
        "year": 2023
      },
      {
        "key": "__art_38",
        "title": "Nefecon (Budesonida Entérica) em IgAN",
        "source": "Lancet 2023;402(10405):859-870. DOI: 10.1016/S0140-6736(23)01554-4",
        "year": 2023
      }
    ]
  },
  {
    "id": "akiki_2016",
    "pmid": "27181456",
    "source": "https://pubmed.ncbi.nlm.nih.gov/27181456/",
    "members": [
      {
        "key": "akiki_trial",
        "title": "Gaudry S et al. — AKIKI (NEJM 2016)",
        "source": "N Engl J Med 2016;375(2):122-133",
        "year": 2016
      },
      {
        "key": "__art_57",
        "title": "TRS em LRA Grave — Estudo AKIKI",
        "source": "N Engl J Med 2016;375(2):122-133",
        "year": 2016
      }
    ]
  },
  {
    "id": "elain_2016",
    "pmid": "27209269",
    "source": "https://pubmed.ncbi.nlm.nih.gov/27209269/",
    "members": [
      {
        "key": "elain_trial",
        "title": "Zarbock A et al. — ELAIN (JAMA 2016)",
        "source": "JAMA 2016;315(20):2190-2199",
        "year": 2016
      },
      {
        "key": "__art_185",
        "title": "Early versus Delayed Initiation of RRT in AKI (ELAIN)",
        "source": "JAMA 2016;315(20):2190-2199",
        "year": 2016
      }
    ]
  },
  {
    "id": "bliss_ln_2020",
    "pmid": "32937045",
    "source": "https://pubmed.ncbi.nlm.nih.gov/32937045/",
    "members": [
      {
        "key": "bliss_ln",
        "title": "Furie et al. — BLISS-LN (NEJM 2020)",
        "source": "N Engl J Med 2020;383(12):1117-1128",
        "year": 2020
      },
      {
        "key": "__art_50",
        "title": "Nefrite Lúpica e Belimumabe (BLISS-LN)",
        "source": "N Engl J Med 2020;383(12):1117-1128. DOI: 10.1056/NEJMoa2001180",
        "year": 2020
      }
    ]
  },
  {
    "id": "andromeda_2021",
    "pmid": "34192431",
    "source": "https://pubmed.ncbi.nlm.nih.gov/34192431/",
    "members": [
      {
        "key": "andromeda_kastritis_2021",
        "title": "ANDROMEDA — Daratumumabe na amiloidose de cadeias leves (AL)",
        "source": "N Engl J Med 2021;385(1):46–58",
        "year": 2021
      },
      {
        "key": "__art_55",
        "title": "Amiloidose AL e Daratumumabe (ANDROMEDA)",
        "source": "N Engl J Med 2021;385(1):46-58",
        "year": 2021
      }
    ]
  },
  {
    "id": "mentor_2019",
    "pmid": "31269364",
    "source": "https://pubmed.ncbi.nlm.nih.gov/31269364/",
    "members": [
      {
        "key": "mentor_trial",
        "title": "Fervenza FC et al. — MENTOR Trial (NEJM 2019)",
        "source": "N Engl J Med 2019;381(1):36-46",
        "year": 2019
      },
      {
        "key": "__art_48",
        "title": "Nefropatia Membranosa e Rituximabe (MENTOR)",
        "source": "N Engl J Med 2019;381(1):36-46. DOI: 10.1056/NEJMoa1814427",
        "year": 2019
      }
    ]
  },
  {
    "id": "kdigo_ckd_2024",
    "pmid": "38490803",
    "source": "https://kdigo.org/citations/?amp=1",
    "members": [
      {
        "key": "kdigo_ckd_2024",
        "title": "KDIGO — Clinical Practice Guideline for CKD 2024",
        "source": "Kidney Int. 2024;105(Suppl 4S):S117-S314",
        "year": 2024
      },
      {
        "key": "kdigo_ckd",
        "title": "KDIGO CKD 2024",
        "source": "Kidney International",
        "year": 2024
      },
      {
        "key": "__art_18",
        "title": "KDIGO 2024 CKD Update",
        "source": "Kidney Int 2024;105(4S):S117-S314",
        "year": 2024
      }
    ]
  },
  {
    "id": "sharp_2011",
    "pmid": "21663949",
    "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3145073/",
    "members": [
      {
        "key": "sharp_study",
        "title": "SHARP — Sinvastatina/ezetimiba na DRC (2011)",
        "source": "Lancet. 2011;377:2181–2192",
        "year": 2011
      },
      {
        "key": "__art_26",
        "title": "SHARP Trial",
        "source": "Lancet 2011;377(9784):2181-2192. DOI: 10.1016/S0140-6736(11)60739-3",
        "year": 2011
      }
    ]
  },
  {
    "id": "captopril_diabetic_nephropathy_1993",
    "pmid": "8413456",
    "source": "https://pubmed.ncbi.nlm.nih.gov/8413456/",
    "members": [
      {
        "key": "lewis_ieca_dn_1993",
        "title": "Lewis EJ et al. — Captopril in Diabetic Nephropathy (NEJM 1993)",
        "source": "N Engl J Med 1993;329(20):1456-1462",
        "year": 1993
      },
      {
        "key": "__art_6",
        "title": "Captopril na Nefropatia Diabética Tipo 1",
        "source": "N Engl J Med 1993;329(20):1456-1462. DOI: 10.1056/NEJM199311113292004",
        "year": 1993
      }
    ]
  },
  {
    "id": "mdrd_intervention_1994",
    "pmid": "8114857",
    "source": "https://pubmed.ncbi.nlm.nih.gov/8114857/",
    "members": [
      {
        "key": "__art_7",
        "title": "MDRD Study",
        "source": "N Engl J Med 1994;330(13):877-884. DOI: 10.1056/NEJM199403313301301",
        "year": 1994
      },
      {
        "key": "__art_122",
        "title": "MDRD — Restrição proteica e controle da pressão (1994)",
        "source": "N Engl J Med. 1994;330(13):877–884. DOI: 10.1056/NEJM199403313301301",
        "year": 1994
      },
      {
        "key": "__art_132",
        "title": "MDRD — Restrição proteica e controle da pressão (1994)",
        "source": "N Engl J Med. 1994;330(13):877–884. DOI: 10.1056/NEJM199403313301301",
        "year": 1994
      }
    ]
  },
  {
    "id": "mdrd_equation_1999",
    "pmid": "10075613",
    "source": "https://pubmed.ncbi.nlm.nih.gov/10075613/",
    "members": [
      {
        "key": "__art_43",
        "title": "Estudo MDRD",
        "source": "Ann Intern Med 1999;130(6):461-470. DOI: 10.7326/0003-4819-130-6-199903160-00002",
        "year": 1999
      },
      {
        "key": "__art_125",
        "title": "MDRD — Desenvolvimento da equação de estimativa da TFG (1999)",
        "source": "Ann Intern Med. 1999;130(6):461–470. DOI: 10.7326/0003-4819-130-6-199903160-00002",
        "year": 1999
      }
    ]
  }
];

  const PAIRS = [[14, 22], [15, 23]];
  const FIELDS = ['autores', 'jornal', 'resumo', 'conclusao', 'curiosidade', 'ano', 'impacto', 'raridade'];
  const indexOf = value => {
    const number = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
  };
  const validIndex = (value, articles) => {
    const index = indexOf(value);
    return index !== null && (!Array.isArray(articles) || (index < articles.length && !!articles[index])) ? index : null;
  };
  function activePair(index, articles) {
    if (!Array.isArray(articles)) return null;
    const pair = PAIRS.find(pair => pair.includes(index));
    if (!pair || !pair.every(i => !!articles[i])) return null;
    const [a, b] = pair.map(i => articles[i]);
    return FIELDS.every(field => Object.hasOwn(a, field) && Object.hasOwn(b, field) && a[field] === b[field]) ? pair : null;
  }
  function articleCanonicalIndex(value, articles) {
    const index = validIndex(value, articles);
    if (index === null) return null;
    return activePair(index, articles)?.[0] ?? index;
  }
  function articleAliases(value, articles) {
    const index = validIndex(value, articles);
    return index === null ? [] : [...(activePair(index, articles) || [index])];
  }
  function storedArticleIndices(articles, values) {
    const set = new Set();
    if (!Array.isArray(values) && !(values instanceof Set)) return set;
    for (const value of values) {
      const index = validIndex(value, articles);
      if (index !== null) set.add(index);
    }
    return set;
  }
  function articleUnlocked(value, articles, values) {
    const stored = storedArticleIndices(articles, values);
    return articleAliases(value, articles).some(index => stored.has(index));
  }
  function availableArticleIndices(articles, values) {
    if (!Array.isArray(articles)) return [];
    const stored = new Set([...storedArticleIndices(articles, values)].map(i => articleCanonicalIndex(i, articles)));
    const available = new Set();
    articles.forEach((article, index) => {
      if (!article) return;
      const canonical = articleCanonicalIndex(index, articles);
      if (!stored.has(canonical)) available.add(canonical);
    });
    return [...available];
  }
  const articleCount = articles => availableArticleIndices(articles, []).length;
  const unlockedArticleCount = (articles, values) => articleCount(articles) - availableArticleIndices(articles, values).length;
  // Retirement metadata only: never retain the invalid clinical body here or
  // alias this identity to a different, newly reviewed publication.
  const RETIRED_REFERENCES = Object.freeze([Object.freeze({
    id: 'cmv_kdigo_tx', title: 'KDIGO CMV in Transplant 2022 (registro retirado)',
    reason: 'A identificação desta referência não pôde ser confirmada. O registro anterior foi preservado no histórico; o resumo foi retirado.'
  })]);
  const isRetiredReference = key => RETIRED_REFERENCES.some(item => item.id === key);
  function historicalReferenceItems(options = {}) {
    const owned = new Set(options.unlockedRefs || []), favorites = new Set(options.favorites || []);
    return RETIRED_REFERENCES.filter(item => owned.has(item.id) || favorites.has(item.id)).map(item => ({
      key: item.id, _bibKey: item.id, kind: 'retired', kindLabel: 'Referência retirada', type: 'Histórico', tipo: 'HISTÓRICO',
      retired: true, historicalOwned: owned.has(item.id), unlocked: false, locked: true, discovered: false,
      title: item.title, label: item.title, _catalogueTitle: item.title, source: '', _catalogueSource: '', year: '', _catalogueYear: '',
      authors: '', autores: '', jornal: '', ano: '', rarity: '', raridade: '', badge: '', badgeColor: '', tipoColor: '#64748b',
      icon: '🔒', themes: [], summary: '', resumo: '', conclusion: '', conclusao: '', impact: '', impacto: '', curiosity: '', curiosidade: '', url: '',
      unlockHint: item.reason + (owned.has(item.id) ? ' Sua descoberta anterior continua registrada.' : ''),
      _lockType: 'retired', favorite: favorites.has(item.id)
    }));
  }
  function libraryAliases(key, articles) {
    const match = /^__art_(\d+)$/.exec(String(key));
    return match ? articleAliases(match[1], articles).map(i => '__art_' + i) : [key];
  }
  const canonicalLibraryKey = (key, articles) => libraryAliases(key, articles)[0] || key;
  const itemKey = item => item.key || item._bibKey;
  const unlocked = item => typeof item.unlocked === 'boolean' ? item.unlocked : !item.locked;
  // Display metadata is pinned to the selected content record, not to its
  // publication group or any other variant. The authored identity stays intact.
  const BIBLIOGRAPHIC_TITLES = new Map([
    ['__art_27', {
      kind: 'scroll', title: 'SPRINT Trial e DRC', year: 2015, url: '',
      source: 'N Engl J Med 2015;373(22):2103-2116. DOI: 10.1056/NEJMoa1511939',
      displayTitle: 'Ensaio SPRINT — Controle intensivo versus padrão da pressão arterial',
      originalTitle: 'A Randomized Trial of Intensive versus Standard Blood-Pressure Control',
      publicationUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1511939',
    }],
    ['__art_10', {
      kind: 'scroll', title: 'KDIGO CKD Classification 2012', year: 2012, url: '',
      source: 'Kidney Int Suppl 2013;3(1):1-150',
      displayTitle: 'KDIGO 2012 — Avaliação e manejo da doença renal crônica',
      originalTitle: 'KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease',
      publicationUrl: 'https://kdigo.org/wp-content/uploads/2017/02/KDIGO_2012_CKD_GL.pdf',
    }],
    ['hypernatremia_yun_2023', {
      kind: 'source', title: 'Yun G, Baek SH, Kim S — Evaluation and Management of Hypernatremia in Adults (2023)',
      year: 2023, url: 'https://pubmed.ncbi.nlm.nih.gov/36578134/',
      source: 'Korean J Intern Med 2023;38(3):290-302',
      authors: 'Yun G, Baek SH, Kim S',
      displayTitle: 'Hipernatremia em adultos — Avaliação e manejo',
      originalTitle: 'Evaluation and management of hypernatremia in adults: clinical perspectives',
      publicationUrl: 'https://www.kjim.org/journal/view.php?number=170760',
    }],
  ]);
  function titlePresentation(item) {
    const record = BIBLIOGRAPHIC_TITLES.get(itemKey(item));
    if (!record || item.retired || item.kind !== record.kind ||
        (item._catalogueTitle ?? item.title ?? item.label) !== record.title ||
        (item._catalogueSource ?? item.source ?? item.jornal) !== record.source ||
        String(item._catalogueYear ?? item.year ?? item.ano) !== String(record.year) ||
        (item._catalogueUrl ?? item.url ?? '') !== record.url) return {};
    return {
      displayTitle: record.displayTitle, originalTitle: record.originalTitle, publicationUrl: record.publicationUrl,
      ...(record.authors ? { bibliographicAuthors: record.authors } : {}),
    };
  }
  function favoriteFor(key, favorites, articles) {
    const set = favorites instanceof Set ? favorites : new Set(Array.isArray(favorites) ? favorites : []);
    return libraryAliases(key, articles).some(alias => set.has(alias));
  }
  function toggleFavorite(key, favorites, articles) {
    const next = new Set(favorites instanceof Set ? favorites : Array.isArray(favorites) ? favorites : []);
    const aliases = libraryAliases(key, articles), wasFavorite = aliases.some(alias => next.has(alias));
    if (isRetiredReference(key) && !wasFavorite) return next;
    if (wasFavorite) aliases.forEach(alias => next.delete(alias));
    else next.add(canonicalLibraryKey(key, articles));
    return next;
  }
  function collapseLibraryItems(items, options) {
    const articles = options?.articles, favorites = options?.favorites;
    const grouped = new Map();
    for (const item of items || []) {
      if (isRetiredReference(itemKey(item)) && !item.retired) continue;
      const key = canonicalLibraryKey(itemKey(item), articles);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return [...grouped].map(([key, aliases]) => {
      // With old storage only the second alias may be open. Its exact medical
      // payload is the same; retain its already available display metadata.
      const original = aliases.find(unlocked) || aliases.find(item => itemKey(item) === key) || aliases[0];
      const result = { ...original, ...titlePresentation(original), key, _bibKey: key, aliases: libraryAliases(key, articles),
        unlocked: aliases.some(unlocked), locked: !aliases.some(unlocked),
        discovered: aliases.some(item => typeof item.discovered === 'boolean' ? item.discovered : unlocked(item)),
        aliasTitles: [...new Set(aliases.map(item => item._catalogueTitle || item.title || item.label).filter(Boolean))] };
      // A historical favorite is a bookmark, not permission to read its body.
      result.favorite = favorites !== undefined ? favoriteFor(key, favorites, articles) : aliases.some(item => item.favorite);
      if (isRetiredReference(key)) return historicalReferenceItems({ unlockedRefs: original.historicalOwned ? [key] : [],
        favorites: result.favorite ? [key] : [] })[0] || null;
      return result;
    }).filter(Boolean);
  }
  function workKey(item) {
    const key = itemKey(item);
    const title = item._catalogueTitle || item.title || item.label || '';
    const source = item._catalogueSource || item.source || item.jornal || '';
    const year = item._catalogueYear ?? item.year ?? item.ano ?? '';
    for (const work of WORKS) {
      const member = work.members.find(member => member.key === key || (item.aliases || []).includes(member.key));
      // Fail closed when a future edit changes the declared publication identity.
      if (member && member.title === title && member.source === source && String(member.year) === String(year)) return 'work:' + work.id;
      if (member && (item.aliasTitles || []).includes(member.title) && member.source === source && String(member.year) === String(year)) return 'work:' + work.id;
    }
    return 'content:' + key;
  }
  function groupLibraryItems(items) {
    const groups = new Map();
    for (const item of items || []) {
      const key = workKey(item);
      if (!groups.has(key)) groups.set(key, { key, variants: [] });
      groups.get(key).variants.push(item);
    }
    return [...groups.values()];
  }
  WORKS.forEach(work => { work.members.forEach(Object.freeze); Object.freeze(work.members); Object.freeze(work); });
  Object.freeze(WORKS);
  const api = Object.freeze({ articleCanonicalIndex, articleAliases, articleUnlocked, availableArticleIndices,
    articleCount, unlockedArticleCount, libraryAliases, canonicalLibraryKey, favoriteFor, toggleFavorite,
    collapseLibraryItems, workKey, groupLibraryItems, works: WORKS, isRetiredReference, historicalReferenceItems, retiredReferences: RETIRED_REFERENCES });
  root.NQLibraryCatalog = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
