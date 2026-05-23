import sys
sys.stdout.reconfigure(encoding='utf-8')

path = 'data/refs.js'
with open(path, 'r', encoding='utf-8', newline='') as f:
    src = f.read()
src_lf = src.replace('\r\n', '\n')
original = src_lf
changes = []

def patch(label, old, new):
    global src_lf
    if old not in src_lf:
        print(f'  ❌ {label}: não encontrado')
        return
    if src_lf.count(old) > 1:
        print(f'  ⚠️  {label}: múltiplas ocorrências')
        return
    src_lf = src_lf.replace(old, new, 1)
    changes.append(label)
    print(f'  ✅ {label}')

# ── 1. kdigo_diabetes_in_ckd_guideline ───────────────────────────────────────
patch('kdigo_diabetes_in_ckd_guideline',
  'impacto:"Manejo integrado do diabetes e DRC — metas glicêmicas, nefroproteção e tratamento",\n    icon:"📋"\n  },',
  'impacto:"Manejo integrado do diabetes e DRC — metas glicêmicas, nefroproteção e tratamento",\n'
  '    icon:"📋",\n'
  '    resumo:"Diretriz KDIGO 2022 para manejo do diabetes na DRC. Recomenda controle glicêmico individualizado com alvo de HbA1c 6,5–8% conforme risco de hipoglicemia e expectativa de vida. Posiciona iSGLT2 como primeira adição ao metformim em DRC com TFGe ≥20 e ACR ≥200 mg/g ou IC; GLP-1 RA como segunda linha com benefício CV e renal demonstrado. Finerenona indicada em DRC diabética com TFGe ≥25 e ACR ≥300 mg/g para redução de risco cardiorrenal.",\n'
  '    conclusao:"A diretriz 2022 integrou o manejo glicêmico ao cardiorrenal — iSGLT2, GLP-1 RA e finerenona deixaram de ser apenas antidiabéticos para se tornarem a base da nefroproteção na DRC diabética.",\n'
  '    curiosidade:"A DRC é o principal fator de risco de hipoglicemia grave em DM2: a insulina e as sulfoniluréias acumulam em pacientes com TFGe reduzida. Essa é a razão pela qual o alvo de HbA1c é deliberadamente menos estrito (<8%) em DRC avançada — reduzir hipoglicemia pode ser mais importante que otimizar glicemia."\n'
  '  },'
)

# ── 2. c3g_servais ────────────────────────────────────────────────────────────
patch('c3g_servais',
  'impacto:"Anormalidades genéticas e adquiridas do complemento (anti-C3NeF, mutações CFH/CFI/CFB) em DDD e C3GN",icon:"📖"\n  },',
  'impacto:"Anormalidades genéticas e adquiridas do complemento (anti-C3NeF, mutações CFH/CFI/CFB) em DDD e C3GN",icon:"📖",\n'
  '    resumo:"Estudo clínico caracterizando as anormalidades do complemento em série de pacientes com C3 glomerulopatia. Identificou fator nefrítico C3 (C3NeF) como a alteração adquirida mais frequente, presente em ~50% dos casos de DDD e porção dos casos de C3GN. Mutações em genes do complemento (CFH, CFI, CFB, C3) detectadas em subgrupo relevante — com implicações para risco de recorrência pós-transplante e potencial resposta à terapia com inibidores de complemento.",\n'
  '    conclusao:"A investigação de anormalidades do complemento (C3NeF, anti-FH, mutações CFH/CFI/CFB) é parte essencial do diagnóstico de C3G — tanto para compreender a patogênese quanto para estimar risco de recorrência no transplante.",\n'
  '    curiosidade:"Pacientes com C3G por mutações de CFH têm risco particularmente elevado de recorrência pós-transplante renal (>80%) em comparação aos com C3NeF isolado — dado que influencia diretamente a indicação e o protocolo de transplante."\n'
  '  },'
)

# ── 3. bestow_trial_2025 ──────────────────────────────────────────────────────
patch('bestow_trial_2025',
  'impacto:"Tegoprubart (anti-CD40L) não-inferior ao tacrolimus em rejeição aguda; menor DGF e preservação de TFGe em transplante renal",icon:"💊"\n  },',
  'impacto:"Tegoprubart (anti-CD40L) não-inferior ao tacrolimus em rejeição aguda; menor DGF e preservação de TFGe em transplante renal",icon:"💊",\n'
  '    resumo:"ECR fase II (BESTOW, n=~100) comparando tegoprubart (anticorpo anti-CD40L/CD154) vs tacrolimus como imunossupressor base em transplante renal. Tegoprubart foi não inferior ao tacrolimus em rejeição aguda e associou-se a menor incidência de atraso na função do enxerto (DGF) e melhor preservação de TFGe. Publicado no NEJM em 2024. Abre perspectiva de imunossupressão sem inibidor de calcineurina.",\n'
  '    conclusao:"BESTOW representa a evidência mais recente de que o bloqueio da co-estimulação CD40L pode substituir o tacrolimus no transplante renal — potencialmente evitando a nefrotoxicidade e a neurotoxicidade crônica dos inibidores de calcineurina.",\n'
  '    curiosidade:"O eixo CD40-CD40L é central na ativação de células T e B durante a rejeição — bloqueá-lo com anti-CD40L não apenas reduz a resposta imune imediata mas também pode prevenir a rejeição mediada por anticorpos a longo prazo, problema ainda não resolvido com tacrolimus."\n'
  '  },'
)

# ── 4. hypona ─────────────────────────────────────────────────────────────────
patch('hypona',
  'impacto:"Algoritmo diagnóstico e terapêutico da hiponatremia",\n    icon:"📋"\n  },',
  'impacto:"Algoritmo diagnóstico e terapêutico da hiponatremia",\n'
  '    icon:"📋",\n'
  '    resumo:"Diretriz europeia conjunta (ESE/ERA-EDTA 2014) para manejo da hiponatremia. Classifica a abordagem pela gravidade sintomática e velocidade de instalação — não apenas pelo nível sérico. Em hiponatremia sintomática grave: NaCl 3% 150 mL IV em 20 min, repetível até 2 vezes ou até elevação de ~5 mmol/L. Correção máxima: 10 mmol/L nas primeiras 24h e 8 mmol/L por cada 24h subsequente. Vaptanas contraindicadas em hipovolemia e hepatopatia.",\n'
  '    conclusao:"A abordagem guiada por sintomas e velocidade de instalação — não pelo sódio isolado — é o paradigma central desta diretriz, que permanece referência europeia para hiponatremia.",\n'
  '    curiosidade:"A síndrome de desmielinização osmótica (SDO) é mais frequente em pacientes com hiponatremia crônica que têm depleção de osmóis orgânicos cerebrais — K⁺, mioinositol, taurina. Correção rápida restaura osmolaridade plasmática mais rápido que o cérebro consegue reacumular esses osmóis, causando retração celular e desmielinização."\n'
  '  },'
)

# ── 5. canvas_program ─────────────────────────────────────────────────────────
patch('canvas_program',
  'impacto:"Canagliflozin ↓40% progressão de albuminúria e ↓40% desfechos renais em DM2 de alto risco CV",icon:"🔬"\n  },',
  'impacto:"Canagliflozin ↓40% progressão de albuminúria e ↓40% desfechos renais em DM2 de alto risco CV",icon:"🔬",\n'
  '    resumo:"Programa de dois ECRs (CANVAS e CANVAS-R, n=10.142 combinados), canagliflozina vs placebo em DM2 com alto risco CV ou DCV estabelecida. Reduziu MACE: HR 0,86. Reduziu progressão de albuminúria em 40% e desfechos renais compostos em 40%. Porém, associou-se a maior risco de amputação de membros inferiores (HR 1,97) — achado que gerou alertas regulatórios e comparações com CREDENCE.",\n'
  '    conclusao:"O CANVAS Program confirmou benefício cardiorrenal da canagliflozina mas identificou o sinal de amputação — que o CREDENCE (população de DRC diabética) não reproduziu na mesma magnitude, gerando debate sobre se é efeito de classe ou específico do CANVAS.",\n'
  '    curiosidade:"O sinal de amputação do CANVAS foi atribuído a possível depleção de volume mais acentuada com a dose de 300 mg usada no programa — o CREDENCE usou 100 mg. Essa diferença de dose pode explicar parte da discordância entre os trials da mesma molécula."\n'
  '  },'
)

# ── 6. mpgn_fervenza ──────────────────────────────────────────────────────────
patch('mpgn_fervenza',
  'impacto:"Nova classificação da GNMP: por etiologia (imuno-complexos vs complemento) e não pelo padrão histológico isolado",icon:"📖"\n  },',
  'impacto:"Nova classificação da GNMP: por etiologia (imuno-complexos vs complemento) e não pelo padrão histológico isolado",icon:"📖",\n'
  '    resumo:"Revisão seminal que propôs reclassificar a glomerulonefrite membranoproliferativa (GNMP) com base na etiologia, não no padrão histológico. O padrão GNMP pode resultar de: (1) depósito de imunocomplexos (infecção, doença autoimune, gamopatia) → imunofluorescência com Ig + C3; ou (2) disregulação do complemento (C3G) → IF com C3 predominante sem Ig. A classificação etiológica orienta investigação e tratamento de forma radicalmente diferente.",\n'
  '    conclusao:"A reclassificação de Sethi & Fervenza foi o marco conceitual que permitiu distinguir C3G de GNMP mediada por imunocomplexos — transformando diagnóstico e abordagem terapêutica de um padrão histológico genérico em doenças com patogêneses específicas.",\n'
  '    curiosidade:"Antes dessa reclassificação, \'GNMP\' era tratada como diagnóstico único com esquemas imunossupressores empíricos. A distinção etiológica revelou que tratar C3G com imunossupressão convencional (dirigida a Ig) é equivocado — o alvo correto é o complemento."\n'
  '  },'
)

# ── 7. anticoag_mn ────────────────────────────────────────────────────────────
patch('anticoag_mn',
  'impacto:"Anticoagulação em NM com síndrome nefrótica: albumina <2,5g/dL e proteinúria >8g/dia como limiares para profilaxia de TEV",icon:"📖"\n  },',
  'impacto:"Anticoagulação em NM com síndrome nefrótica: albumina <2,5g/dL e proteinúria >8g/dia como limiares para profilaxia de TEV",icon:"📖",\n'
  '    resumo:"Análise de coorte avaliando risco de TEV em nefropatia membranosa com síndrome nefrótica. Albumina sérica <2,5 g/dL e proteinúria >8 g/dia identificados como limiares de risco elevado para tromboembolismo venoso — em especial trombose de veia renal. Nesses pacientes, o benefício da anticoagulação profilática supera o risco hemorrágico na maioria dos cenários clínicos.",\n'
  '    conclusao:"Na nefropatia membranosa com síndrome nefrótica grave (albumina <2,5 g/dL e/ou proteinúria >8 g/dia), anticoagulação profilática deve ser considerada — a membranosa é a glomerulopatia com maior risco de trombose de veia renal.",\n'
  '    curiosidade:"A trombose de veia renal em NM frequentemente é assintomática e detectada incidentalmente — o que significa que o risco trombótico real é maior que o clinicamente aparente. A hipoalbuminemia reduz os níveis de antitrombina III na proporção da perda urinária, explicando o limiar de albumina <2,5 g/dL como preditor de risco."\n'
  '  },'
)

# ── 8. tempo_34_trial ─────────────────────────────────────────────────────────
patch('tempo_34_trial',
  'impacto:"Tolvaptan ↓18% crescimento de volume renal total em DRPAD — primeiro ensaio de modificação da doença",icon:"🔬"\n  },',
  'impacto:"Tolvaptan ↓18% crescimento de volume renal total em DRPAD — primeiro ensaio de modificação da doença",icon:"🔬",\n'
  '    resumo:"ECR fase III (TEMPO 3:4, n=1.445), tolvaptan vs placebo em DRPAD com TFGe ≥60 e volume renal total aumentado. Reduziu a taxa de crescimento do volume renal total em 2,8% ao ano vs 5,5% ao ano no placebo — diferença de 18% relativa. Também retardou o declínio de TFGe e reduziu episódios de dor renal. Primeiro ensaio a demonstrar modificação da progressão em DRPAD.",\n'
  '    conclusao:"TEMPO 3:4 foi o trial que estabeleceu tolvaptan como terapia modificadora de doença na DRPAD, levando às aprovações regulatórias e ao desenvolvimento dos critérios de seleção (Mayo 1C–1E) usados nas diretrizes.",\n'
  '    curiosidade:"O volume renal total medido por ressonância magnética tornou-se o biomarcador-padrão de progressão na DRPAD — mais sensível que a TFGe nos estágios iniciais, quando a hiperfiltração dos néfrons remanescentes mascara o declínio funcional real."\n'
  '  },'
)

# ── 9. daugirdas_handbook_of_dialysis ─────────────────────────────────────────
patch('daugirdas_handbook_of_dialysis',
  'impacto:"Referência técnica completa para prescrição e adequação de diálise",\n    icon:"📚"\n  },',
  'impacto:"Referência técnica completa para prescrição e adequação de diálise",\n'
  '    icon:"📚",\n'
  '    resumo:"Manual de referência para prescrição e adequação de diálise, cobrindo hemodiálise (cálculo de Kt/V, adequação, acesso vascular), diálise peritoneal (PET, dose, complicações), nutrição em diálise, anemia, metabolismo mineral e manejo de complicações agudas. A 5ª edição (2015) incorpora atualizações sobre modalidades de HD de alta frequência e membranas de alto fluxo.",\n'
  '    conclusao:"Referência técnica insubstituível para prescrição de diálise — combina fisiologia, fórmulas e protocolo clínico numa linguagem prática para a rotina de nefrologia.",\n'
  '    curiosidade:"John Daugirdas desenvolveu a fórmula simplificada do Kt/V (Daugirdas 2ª geração) que corrige o efeito da geração de ureia durante a sessão — mais precisa que a fórmula linear de Gotch e padrão atual para monitorização da dose dialítica."\n'
  '  },'
)

# ── 10. reprise_trial ─────────────────────────────────────────────────────────
patch('reprise_trial',
  'impacto:"Tolvaptan confirmou benefício em DRPAD em estágio mais tardio (TFG 25-65) — base para aprovação ampliada",icon:"🔬"\n  },',
  'impacto:"Tolvaptan confirmou benefício em DRPAD em estágio mais tardio (TFG 25-65) — base para aprovação ampliada",icon:"🔬",\n'
  '    resumo:"ECR fase III (REPRISE, n=1.370), tolvaptan vs placebo em DRPAD com TFGe 25–65 ml/min/1,73m². Confirmou redução do declínio de TFGe em população com doença mais avançada que o TEMPO 3:4. O desfecho primário (slope de TFGe em 12 meses) foi significativamente melhor com tolvaptan. Hepatotoxicidade reversível observada em ~5%, exigindo monitorização hepática mensal.",\n'
  '    conclusao:"REPRISE complementou o TEMPO 3:4 ao confirmar benefício do tolvaptan em pacientes com DRC mais avançada (TFGe 25–65), expandindo a janela terapêutica e embasando a aprovação regulatória em estágios intermediários da DRPAD.",\n'
  '    curiosidade:"A hepatotoxicidade do tolvaptan (observada em ambos TEMPO e REPRISE) é o principal limitante do uso — resulta de lesão hepatocelular idiossincrásica e exigiu programa de monitorização hepática mensal como condição das aprovações regulatórias na maioria dos países."\n'
  '  },'
)

print(f'\n{len(changes)}/10 OK: {", ".join(changes)}')
if src_lf == original:
    print('ERRO: nenhuma alteração.'); import sys; sys.exit(1)

out = src_lf.replace('\n', '\r\n')
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(out)
print('Gravado.')
