"""
Patch lote 6 — refs.js
Adiciona resumo/conclusao/curiosidade em 10 refs.
Textos revisados e aprovados pelo usuário.
CRLF-safe: abre com newline='', normaliza LF internamente, grava CRLF.
"""

import re, sys

path = r"data/refs.js"

with open(path, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

src = src.replace('\r\n', '\n')

patches = {

  'lewis_ieca_dn_1993': (
    'impacto:"Captopril ↓50% risco de duplicar creatinina em nefropatia diabética — primeiro RCT de nefroproteção com IECA",icon:"🔬"\n  },',
    'impacto:"Captopril ↓50% risco de duplicar creatinina em nefropatia diabética — primeiro RCT de nefroproteção com IECA",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (n=409), em DM1 com nefropatia estabelecida, proteinúria >500 mg/dia e creatinina sérica ≤2,5 mg/dL, comparando captopril 25 mg 3x/dia vs placebo. O desfecho primário foi duplicação da creatinina sérica: 12,1% no grupo captopril vs 21,3% no placebo, com redução de risco de aproximadamente 48% (P=0,007). O composto de morte, diálise ou transplante também foi reduzido, e o benefício excedeu o esperado apenas pela diferença pressórica.",\n'
    '    conclusao:"O trial de Lewis demonstrou que IECA protege rim em nefropatia diabética do DM1 com proteinúria, consolidando o bloqueio do SRAA como eixo histórico da nefroproteção.",\n'
    '    curiosidade:"Este estudo ajudou a deslocar o tratamento da nefropatia diabética de simples controle pressórico para bloqueio específico do SRAA, reforçando a proteinúria como marcador de atividade e risco de progressão renal."\n'
    '  },'
  ),

  'renaal_trial': (
    'impacto:"Losartan ↓16% desfecho renal composto em DM2 com nefropatia — estabeleceu BRA como nefroprotetor padrão",icon:"🔬"\n  },',
    'impacto:"Losartan ↓16% desfecho renal composto em DM2 com nefropatia — estabeleceu BRA como nefroprotetor padrão",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (RENAAL, n=1.513), em DM2 com nefropatia e proteinúria, comparando losartan 50–100 mg/dia vs placebo, adicionados ao tratamento anti-hipertensivo convencional, sem IECA ou outro BRA. O desfecho primário composto foi duplicação da creatinina, DRCT ou morte: HR 0,84 (redução relativa de 16%; P=0,02). Losartan reduziu duplicação de creatinina em 25%, DRCT em 28%, primeira hospitalização por insuficiência cardíaca em 32% e proteinúria em 35%.",\n'
    '    conclusao:"RENAAL demonstrou que o BRA losartan reduz desfechos renais concretos em nefropatia diabética do DM2, com benefício além do controle pressórico convencional.",\n'
    '    curiosidade:"A redução de proteinúria no RENAAL reforçou a albuminúria como marcador intermediário de risco renal: quanto maior a queda inicial da proteinúria, menor o risco posterior de progressão para desfechos renais duros."\n'
    '  },'
  ),

  'idnt_trial': (
    'impacto:"Irbesartan ↓23% risco de duplicar creatinina vs amlodipino em nefropatia diabética tipo 2",icon:"🔬"\n  },',
    'impacto:"Irbesartan ↓23% risco de duplicar creatinina vs amlodipino em nefropatia diabética tipo 2",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (IDNT, n=1.715), em DM2 hipertenso com nefropatia, comparando irbesartan 300 mg/dia, amlodipino 10 mg/dia ou placebo, com controle pressórico semelhante entre os grupos. O desfecho primário foi duplicação da creatinina, DRCT ou morte por qualquer causa. Irbesartan reduziu o risco do desfecho primário em relação ao placebo e ao amlodipino; amlodipino não diferiu do placebo para proteção renal, apesar de reduzir PA.",\n'
    '    conclusao:"IDNT demonstrou que a nefroproteção do BRA em DM2 albuminúrico não é explicada apenas pela redução da PA: o bloqueio do SRAA conferiu proteção renal que o bloqueador de canal de cálcio diidropiridínico não reproduziu.",\n'
    '    curiosidade:"O desenho com três braços — BRA, amlodipino e placebo — foi didaticamente importante porque separou controle pressórico de nefroproteção específica do SRAA."\n'
    '  },'
  ),

  'dcct_trial': (
    'impacto:"Tratamento intensivo do DM1 ↓63% retinopatia e ↓54% microalbuminúria — base da teoria da memória metabólica",icon:"🔬"\n  },',
    'impacto:"Tratamento intensivo do DM1 ↓63% retinopatia e ↓54% microalbuminúria — base da teoria da memória metabólica",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (DCCT, n=1.441), em DM1, comparando insulinoterapia intensiva — múltiplas aplicações ou bomba, com alvo de controle glicêmico próximo do normal — vs tratamento convencional. A HbA1c média alcançada foi cerca de 7,2% vs 9,1%. A terapia intensiva reduziu o surgimento de retinopatia em 76% na coorte de prevenção primária, reduziu progressão de retinopatia na coorte secundária, reduziu microalbuminúria em 39%, albuminúria clínica em 54% e neuropatia clínica em 60%, ao custo de maior hipoglicemia grave.",\n'
    '    conclusao:"DCCT provou de forma definitiva que hiperglicemia crônica causa complicações microvasculares no DM1 e que controle glicêmico intensivo reduz nefropatia, retinopatia e neuropatia.",\n'
    '    curiosidade:"O seguimento EDIC revelou o conceito de memória metabólica: benefícios microvasculares e cardiovasculares persistiram por anos mesmo após a convergência parcial da HbA1c entre os grupos."\n'
    '  },'
  ),

  'sprint_trial': (
    'impacto:"Alvo de PA < 120 mmHg ↓25% eventos CV vs < 140 mmHg em não-diabéticos de alto risco (exceto DRC avançada)",icon:"🔬"\n  },',
    'impacto:"Alvo de PA < 120 mmHg ↓25% eventos CV vs < 140 mmHg em não-diabéticos de alto risco (exceto DRC avançada)",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (SPRINT, n=9.361), em adultos sem diabetes e sem AVC prévio, com PAS ≥130 mmHg e alto risco cardiovascular, comparando alvo intensivo de PAS <120 mmHg vs alvo padrão <140 mmHg por medida padronizada automatizada em consultório. O desfecho primário composto cardiovascular foi reduzido: HR 0,75 (IC 95% 0,64–0,89; P<0,001), e o estudo foi interrompido precocemente por benefício. No subgrupo com DRC, o benefício cardiovascular foi preservado, mas houve maior queda inicial de TFGe e mais eventos renais/AKI no braço intensivo.",\n'
    '    conclusao:"SPRINT fundamentou metas pressóricas mais intensivas em pacientes não diabéticos de alto risco, incluindo DRC, mas sua aplicação exige reproduzir técnica de medida padronizada e considerar fragilidade, hipotensão, AKI e tolerabilidade.",\n'
    '    curiosidade:"A controvérsia do SPRINT não está apenas no número <120 mmHg, mas na forma de medir a PA: leitura padronizada, automatizada, após repouso e sem conversa não equivale à medida casual apressada de consultório."\n'
    '  },'
  ),

  'leader_trial': (
    'impacto:"Liraglutida ↓13% MACE e ↓22% nefropatia (nova macroalbuminúria ou duplicação de creatinina) em DM2",icon:"🔬"\n  },',
    'impacto:"Liraglutida ↓13% MACE e ↓22% nefropatia (nova macroalbuminúria ou duplicação de creatinina) em DM2",icon:"🔬",\n'
    '    resumo:"ECR cardiovascular (LEADER, n=9.340), em DM2 com alto risco cardiovascular, comparando liraglutida até 1,8 mg/dia vs placebo. O desfecho primário MACE foi reduzido: HR 0,87 (IC 95% 0,78–0,97; P=0,01 para superioridade). Houve redução de morte cardiovascular (HR 0,78) e morte por qualquer causa (HR 0,85). O desfecho renal composto também foi reduzido (HR 0,78), principalmente por menor incidência de macroalbuminúria persistente nova.",\n'
    '    conclusao:"LEADER estabeleceu liraglutida como GLP-1 RA cardioprotetor em DM2 de alto risco e sugeriu benefício renal predominantemente albuminúrico, antes dos trials renais dedicados da classe.",\n'
    '    curiosidade:"O LEADER separa bem dois tipos de evidência renal: queda de albuminúria é relevante, mas não equivale ao mesmo grau de prova de trials com desfechos renais duros, como DRCT, queda sustentada de TFGe ou morte renal."\n'
    '  },'
  ),

  'dapa_hf': (
    'impacto:"Dapagliflozin ↓26% morte CV + hospitalização por IC em ICFEr (com e sem DM2) — expandiu SGLT2i para IC",icon:"🔬"\n  },',
    'impacto:"Dapagliflozin ↓26% morte CV + hospitalização por IC em ICFEr (com e sem DM2) — expandiu SGLT2i para IC",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (DAPA-HF, n=4.744), em ICFEr sintomática (FEVE ≤40%, NYHA II–IV), comparando dapagliflozina 10 mg/dia vs placebo sobre terapia padrão. O desfecho primário — piora da insuficiência cardíaca ou morte cardiovascular — ocorreu em 16,3% vs 21,2%: HR 0,74 (IC 95% 0,65–0,85; P<0,001). O benefício foi consistente em pacientes com e sem DM2.",\n'
    '    conclusao:"DAPA-HF estabeleceu dapagliflozina como tratamento modificador de prognóstico na ICFEr, independentemente de diabetes, consolidando os iSGLT2 como parte da terapia moderna da insuficiência cardíaca.",\n'
    '    curiosidade:"Antes do DAPA-HF, os iSGLT2 eram vistos sobretudo como antidiabéticos com benefício cardiovascular. O estudo mudou o enquadramento: a dapagliflozina passou a ser tratada como fármaco de insuficiência cardíaca com efeito glicêmico adicional."\n'
    '  },'
  ),

  'emperor_reduced': (
    'impacto:"Empagliflozin ↓25% morte CV + hospitalização em ICFEr — confirmou classe dos SGLT2i em IC independente de DM",icon:"🔬"\n  },',
    'impacto:"Empagliflozin ↓25% morte CV + hospitalização em ICFEr — confirmou classe dos SGLT2i em IC independente de DM",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (EMPEROR-Reduced, n=3.730), em ICFEr sintomática com FEVE ≤40%, comparando empagliflozina 10 mg/dia vs placebo. O desfecho primário — morte cardiovascular ou hospitalização por insuficiência cardíaca — ocorreu em 19,4% vs 24,7%: HR 0,75 (IC 95% 0,65–0,86; P<0,001), com benefício em pacientes com e sem diabetes. A empagliflozina também reduziu desfecho renal composto exploratório e desacelerou o declínio da TFGe.",\n'
    '    conclusao:"EMPEROR-Reduced confirmou benefício de classe dos iSGLT2 na ICFEr e reforçou a interface cardiorrenal da terapia, especialmente em pacientes com IC e DRC concomitantes.",\n'
    '    curiosidade:"O benefício renal observado em trials de IC sugere que parte da nefroproteção dos iSGLT2 independe da doença renal primária e se relaciona a mecanismos hemodinâmicos, tubuloglomerulares e cardiorrenais."\n'
    '  },'
  ),

  'emperor_preserved': (
    'impacto:"Empagliflozin ↓21% morte CV + hospitalização em ICFEp — primeiro tratamento com benefício em IC com fração preservada",icon:"🔬"\n  },',
    'impacto:"Empagliflozin ↓21% morte CV + hospitalização em ICFEp — primeiro tratamento com benefício em IC com fração preservada",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (EMPEROR-Preserved, n=5.988), em insuficiência cardíaca sintomática com FEVE >40%, comparando empagliflozina 10 mg/dia vs placebo. O desfecho primário — morte cardiovascular ou hospitalização por insuficiência cardíaca — ocorreu em 13,8% vs 17,1%: HR 0,79 (IC 95% 0,69–0,90; P<0,001), com benefício independente de diabetes e impulsionado principalmente por redução de hospitalização por IC.",\n'
    '    conclusao:"EMPEROR-Preserved foi decisivo para demonstrar benefício dos iSGLT2 em IC com FEVE preservada ou levemente reduzida, uma área historicamente marcada por trials neutros ou marginalmente positivos.",\n'
    '    curiosidade:"A IC com FEVE preservada é comum em idosos, mulheres, obesos, diabéticos e pacientes com DRC; por isso, o EMPEROR-Preserved fortaleceu a abordagem cardiorrenal integrada desse fenótipo clínico."\n'
    '  },'
  ),

  'deliver_trial': (
    'impacto:"Dapagliflozin ↓18% morte CV + hospitalização em IC com FE ≥40% — confirmou SGLT2i em todo o espectro de IC",icon:"🔬"\n  },',
    'impacto:"Dapagliflozin ↓18% morte CV + hospitalização em IC com FE ≥40% — confirmou SGLT2i em todo o espectro de IC",icon:"🔬",\n'
    '    resumo:"ECR multicêntrico (DELIVER, n=6.263), em insuficiência cardíaca com FEVE >40%, incluindo FEVE levemente reduzida, preservada e pacientes com FEVE previamente reduzida que melhorou, comparando dapagliflozina 10 mg/dia vs placebo. O desfecho primário — piora da insuficiência cardíaca ou morte cardiovascular — ocorreu em 16,4% vs 19,5%: HR 0,82 (IC 95% 0,73–0,92; P<0,001). O benefício foi consistente independentemente de diabetes e ao longo das faixas de FEVE estudadas.",\n'
    '    conclusao:"DELIVER complementou DAPA-HF ao mostrar benefício da dapagliflozina também em IC com FEVE >40%, consolidando os iSGLT2 como terapia aplicável ao amplo espectro da insuficiência cardíaca.",\n'
    '    curiosidade:"A consistência dos resultados de DAPA-HF e DELIVER sugere que os benefícios dos iSGLT2 na IC não dependem apenas de glicemia ou fração de ejeção, mas de efeitos cardiorrenais combinados sobre congestão, hemodinâmica renal e risco de hospitalização."\n'
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
    print(f"❌ NÃO ENCONTRADO: {fail}")
    sys.exit(1)

out = src.replace('\n', '\r\n')
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(out)

print(f"✅ {len(ok)}/10 OK: {', '.join(ok)}")
print("Gravado.")
