"""
Patch lote 7 — refs.js
Textos revisados e aprovados pelo usuário.
CRLF-safe.
"""

import sys

path = r"data/refs.js"

with open(path, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

src = src.replace('\r\n', '\n')

patches = {

  'harrisons_principles': (
    '    impacto:"Referência em medicina interna — capítulos de nefrologia cobrem síndromes, distúrbios hidroeletrolíticos e DRC",\n    icon:"📚"\n  },',
    '    impacto:"Referência em medicina interna — capítulos de nefrologia cobrem síndromes, distúrbios hidroeletrolíticos e DRC",\n    icon:"📚",\n'
    '    resumo:"Livro-texto clássico de medicina interna, usado como referência ampla para raciocínio clínico. Nos capítulos de nefrologia, organiza diagnóstico diferencial das síndromes renais — LRA, DRC, síndrome nefrótica, síndrome nefrítica, distúrbios hidroeletrolíticos e ácido-base — além de glomerulopatias, doenças tubulointersticiais, hipertensão renal e acometimento renal de doenças sistêmicas como diabetes, LES, vasculites e gamopatias.",\n'
    '    conclusao:"Harrison\'s é útil como ponto de entrada clínico e diagnóstico antes das diretrizes específicas; ajuda a construir raciocínio diferencial, mas não substitui guidelines nefrológicas com recomendações graduadas.",\n'
    '    curiosidade:"Os capítulos do Harrison\'s refletem síntese narrativa de especialistas, não recomendações formais com classe e nível de evidência. Por isso, funcionam melhor como mapa clínico geral do que como fonte final para decisão terapêutica específica."\n'
    '  },'
  ),

  'kdigo_lra': (
    '    impacto:"Critérios universais de diagnóstico e estadiamento da LRA",\n    icon:"📋"\n  },',
    '    impacto:"Critérios universais de diagnóstico e estadiamento da LRA",\n    icon:"📋",\n'
    '    resumo:"Draft de revisão pública KDIGO 2026 para AKI/AKD, primeira grande atualização desde a diretriz KDIGO AKI 2012. Define AKI como anormalidade funcional ou estrutural renal ocorrida, ou presumida, em até 7 dias no contexto clínico apropriado. Mantém creatinina e diurese como critérios centrais, mas incorpora cistatina C e biomarcadores validados de estresse/dano renal como critérios adicionais quando disponíveis. Também formaliza AKD como alteração funcional ou estrutural renal com duração de até 3 meses, integrando o contínuo AKI → AKD → CKD.",\n'
    '    conclusao:"O draft KDIGO 2026 desloca o conceito de LRA de uma definição baseada quase exclusivamente em creatinina/diurese para uma estrutura mais ampla, combinando função, dano renal, persistência da injúria e seguimento pós-LRA.",\n'
    '    curiosidade:"A KDIGO 2012 foi transformadora por unificar RIFLE e AKIN e padronizar a linguagem da LRA. O draft 2026 preserva esse legado, mas amplia a definição ao reconhecer que lesão renal estrutural, cistatina C e biomarcadores podem identificar injúria antes ou além da creatinina."\n'
    '  },'
  ),

  'pathway2_trial': (
    '    impacto:"Espironolactona é o agente mais eficaz para hipertensão resistente — reduziu PA sistólica média 8,7 mmHg vs placebo",icon:"🔬"\n  },',
    '    impacto:"Espironolactona é o agente mais eficaz para hipertensão resistente — reduziu PA sistólica média 8,7 mmHg vs placebo",icon:"🔬",\n'
    '    resumo:"ECR duplo-cego, cruzado, controlado por placebo (PATHWAY-2, n=314 analisados), em hipertensão resistente apesar de 3 anti-hipertensivos incluindo diurético. Comparou espironolactona 25–50 mg, bisoprolol 5–10 mg, doxazosina 4–8 mg e placebo em sequência crossover. A espironolactona reduziu a PAS domiciliar 8,7 mmHg a mais que placebo, 4,0 mmHg a mais que doxazosina e 4,5 mmHg a mais que bisoprolol, sendo a intervenção mais eficaz.",\n'
    '    conclusao:"PATHWAY-2 fundamentou espironolactona como quarta droga preferencial na hipertensão resistente, sugerindo que retenção de sódio/atividade mineralocorticoide é mecanismo dominante em muitos pacientes.",\n'
    '    curiosidade:"A resposta à espironolactona foi maior nos pacientes com renina basal mais baixa, perfil compatível com expansão volêmica ou aldosteronismo relativo. Em nefrologia, a aplicação exige checar TFGe e potássio, pois DRC avançada e hipercalemia limitam o uso seguro."\n'
    '  },'
  ),

  'aask_trial': (
    '    impacto:"Ramipril superior à anlodipina e metoprolol em retardar progressão da nefropatia hipertensiva em afro-americanos",icon:"🔬"\n  },',
    '    impacto:"Ramipril superior à anlodipina e metoprolol em retardar progressão da nefropatia hipertensiva em afro-americanos",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (AASK, n=1.094), em afro-americanos com DRC atribuída à nefroesclerose hipertensiva, comparando 3 estratégias iniciais de anti-hipertensivo — ramipril, metoprolol ou amlodipino — e 2 metas pressóricas. O desfecho primário foi declínio da TFG; o composto clínico secundário incluiu queda importante da TFG, DRCT ou morte. Ramipril foi superior ao amlodipino na proteção renal, sobretudo em pacientes com proteinúria. A meta pressórica mais baixa não reduziu progressão renal na coorte global.",\n'
    '    conclusao:"AASK mostrou que, na DRC hipertensiva com proteinúria, o IECA oferece proteção renal superior ao bloqueador de canal de cálcio diidropiridínico, e que intensificar PA sem considerar proteinúria não garante nefroproteção adicional.",\n'
    '    curiosidade:"O achado mais didático do AASK é a interação com proteinúria: quanto maior a proteinúria basal, mais relevante o bloqueio do SRAA. A escolha anti-hipertensiva em DRC deve considerar albuminúria/proteinúria, não apenas o valor da PA."\n'
    '  },'
  ),

  'mdrd_study': (
    '    impacto:"Restrição proteica (0,6g/kg/dia) e baixa meta de PA retardam progressão da DRC — base das recomendações dietéticas",icon:"🔬"\n  },',
    '    impacto:"Restrição proteica (0,6g/kg/dia) e baixa meta de PA retardam progressão da DRC — base das recomendações dietéticas",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (MDRD, n=840), em DRC não dialítica, dividido em duas coortes por nível de TFG medida. Avaliou restrição proteica e diferentes metas pressóricas sobre a progressão da DRC. A restrição proteica mostrou, no máximo, tendência modesta de menor declínio de TFG, sem prova definitiva de grande benefício clínico no desfecho primário. Posteriormente, os dados do estudo serviram de base para o desenvolvimento da equação MDRD de estimativa da TFG.",\n'
    '    conclusao:"O MDRD Study teve impacto duplo: não confirmou de forma robusta que restrição proteica isolada mudasse dramaticamente a progressão da DRC, mas influenciou recomendações nutricionais e originou uma das equações de TFGe mais usadas da história.",\n'
    '    curiosidade:"A equação MDRD acabou sendo mais influente para a prática nefrológica diária do que a própria intervenção dietética testada — exemplo clássico de subproduto metodológico superando o objetivo terapêutico inicial."\n'
    '  },'
  ),

  'benazepril_ckd': (
    '    impacto:"Benazepril ↓43% duplicação de creatinina em DRC avançada (TFG 20-70) — estabeleceu IECA como nefroprotetor em DRC não-diabética",icon:"🔬"\n  },',
    '    impacto:"Benazepril ↓43% duplicação de creatinina em DRC avançada (TFG 20-70) — estabeleceu IECA como nefroprotetor em DRC não-diabética",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico chinês (Hou et al., NEJM 2006; n=422), em DRC não diabética com proteinúria persistente. Após run-in, pacientes com creatinina 1,5–3,0 mg/dL receberam benazepril 20 mg/dia, enquanto pacientes com creatinina 3,1–5,0 mg/dL foram randomizados para benazepril 20 mg/dia vs placebo, além de tratamento anti-hipertensivo convencional. No grupo com DRC avançada, benazepril reduziu em 43% o risco do composto de duplicação da creatinina, DRCT ou morte, reduziu proteinúria em 52% e desacelerou o declínio da função renal.",\n'
    '    conclusao:"Hou et al. demonstrou que IECA pode manter benefício antiproteinúrico e nefroprotetor mesmo em DRC não diabética avançada selecionada, desde que usado com monitorização rigorosa de creatinina, potássio e tolerabilidade.",\n'
    '    curiosidade:"O estudo ajudou a combater a prática de suspender IECA automaticamente apenas por TFGe baixa. A decisão deve ser individualizada: hipercalemia, queda abrupta de TFG, hipotensão e estenose de artéria renal mudam a conduta; DRC avançada estável com proteinúria pode ainda se beneficiar."\n'
    '  },'
  ),

  'starrt_aki': (
    '    impacto:"Início acelerado de TRS não superior ao início padrão em LRA grave — estratégia expectante é segura",icon:"🔬"\n  },',
    '    impacto:"Início acelerado de TRS não superior ao início padrão em LRA grave — estratégia expectante é segura",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico internacional (STARRT-AKI, n=2.927), em pacientes críticos com LRA grave, comparando estratégia acelerada de TRS — início em até 12h após elegibilidade — vs estratégia padrão, com início apenas diante de indicação convencional ou persistência da LRA. Mortalidade em 90 dias foi semelhante: 43,9% vs 43,7% (RR 1,00; IC 95% 0,93–1,09). No braço padrão, mais de um terço dos pacientes não precisou receber TRS. A estratégia acelerada aumentou dependência de TRS entre sobreviventes e eventos adversos, incluindo hipotensão e hipofosfatemia.",\n'
    '    conclusao:"STARRT-AKI reforçou que início precoce rotineiro de TRS em LRA grave não reduz mortalidade. Em pacientes sem indicação emergencial, estratégia expectante é segura e evita TRS desnecessária em parcela relevante.",\n'
    '    curiosidade:"O dado mais prático do STARRT-AKI é que LRA grave não significa inevitabilidade de diálise. Mesmo em UTI, muitos pacientes recuperam função renal se não houver indicação clássica imediata, como hipercalemia refratária, acidose grave, sobrecarga volêmica intratável ou uremia complicada."\n'
    '  },'
  ),

  'rewind_trial': (
    '    impacto:"Dulaglutida ↓15% MACE e ↓15% desfecho renal composto em DM2 com perfil CV diverso (inclusão de baixo risco)",icon:"🔬"\n  },',
    '    impacto:"Dulaglutida ↓15% MACE e ↓15% desfecho renal composto em DM2 com perfil CV diverso (inclusão de baixo risco)",icon:"🔬",\n'
    '    resumo:"ECR cardiovascular (REWIND, n=9.901), em DM2 com DCV estabelecida ou múltiplos fatores de risco, comparando dulaglutida 1,5 mg semanal vs placebo, com seguimento mediano de 5,4 anos. Dulaglutida reduziu MACE: HR 0,88 (IC 95% 0,79–0,99; P=0,026). O desfecho renal exploratório também foi reduzido (HR 0,85), principalmente por menor incidência de macroalbuminúria nova. Cerca de 46% dos participantes não tinham DCV prévia.",\n'
    '    conclusao:"REWIND ampliou a evidência cardiovascular dos GLP-1 RA para população de DM2 com menor proporção de prevenção secundária, aproximando o trial do perfil ambulatorial comum.",\n'
    '    curiosidade:"O benefício renal do REWIND foi principalmente albuminúrico, como em outros CVOTs de GLP-1 RA. Isso é relevante, mas não equivale a um trial renal dedicado com DRCT, queda sustentada de TFGe ou morte renal como foco principal."\n'
    '  },'
  ),

  'pivotal_trial': (
    '    impacto:"Ferro IV proativo (1g/mês) vs reativo ↓20% eventos CV em hemodiálise — estratégia de reposição de ferro em diálise",icon:"🔬"\n  },',
    '    impacto:"Ferro IV proativo (1g/mês) vs reativo ↓20% eventos CV em hemodiálise — estratégia de reposição de ferro em diálise",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (PIVOTAL, n=2.141), em pacientes incidentes em hemodiálise de manutenção, comparando ferro IV proativo em alta dose — sacarato de ferro 400 mg/mês, enquanto ferritina ≤700 µg/L e TSAT <40% — vs estratégia reativa em baixa dose, administrada apenas se ferritina <200 µg/L ou TSAT <20%. O desfecho primário composto — morte, IM não fatal, AVC não fatal ou hospitalização por insuficiência cardíaca — foi menor com estratégia proativa: HR 0,85 (IC 95% 0,73–1,00; P=0,04). Também houve menor necessidade de AEE e transfusões.",\n'
    '    conclusao:"PIVOTAL mostrou que, em hemodiálise, reposição proativa de ferro IV dentro de limites de segurança definidos é eficaz e não aumenta eventos adversos maiores, reduzindo dose de AEE e transfusões.",\n'
    '    curiosidade:"O estudo não autoriza ferro irrestrito: o protocolo suspendia ferro quando ferritina ultrapassava 700 µg/L ou TSAT chegava a 40%. A mensagem correta é reposição proativa monitorizada, não liberalidade sem limite."\n'
    '  },'
  ),

  'furosemide_stress_test': (
    '    impacto:"FST (1mg/kg furosemida IV): débito urinário < 200mL/2h prediz progressão para LRA estágio 3 com alta sensibilidade",icon:"📖"\n  },',
    '    impacto:"FST (1mg/kg furosemida IV): débito urinário < 200mL/2h prediz progressão para LRA estágio 3 com alta sensibilidade",icon:"📖",\n'
    '    resumo:"Estudo prospectivo de coorte (Chawla et al., CJASN 2013; n=77), em pacientes críticos com LRA inicial após ressuscitação volêmica adequada. Administrou furosemida IV 1 mg/kg em pacientes sem exposição prévia a diurético de alça ou 1,5 mg/kg em usuários prévios, e mediu o débito urinário nas 2h seguintes. Débito urinário ≤200 mL em 2h previu progressão para LRA estágio 3 com AUC 0,87, sensibilidade de 87,1% e especificidade de 84,1%.",\n'
    '    conclusao:"O Furosemide Stress Test é uma ferramenta funcional de reserva tubular para estratificar risco de progressão da LRA e preparar vigilância/planejamento de TRS; não deve ser usado isoladamente para indicar diálise.",\n'
    '    curiosidade:"A lógica do FST é testar se o túbulo ainda consegue secretar e responder à furosemida. Uma resposta diurética ruim sugere baixa reserva tubular, mas isso não significa que furosemida trate a injúria renal — ela apenas revela a capacidade funcional residual."\n'
    '  },'
  ),

}

ok = []
fail = []
for key, (old, new) in patches.items():
    if old in src:
        src = src.replace(old, new, 1)
        ok.append(key)
    else:
        fail.append(key)

if fail:
    print(f"NAO ENCONTRADO: {fail}")
    sys.exit(1)

out = src.replace('\n', '\r\n')
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(out)

print(f"OK {len(ok)}/10: {', '.join(ok)}")
print("Gravado.")
