"""
Patch lote 8 — refs.js
9 refs revisadas e aprovadas pelo usuario.
CRLF-safe.
"""

import sys

path = r"data/refs.js"

with open(path, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

src = src.replace('\r\n', '\n')

# Conteudo identico para fidelio e fidelio_dkd (mesmo trial, entradas duplicadas)
_fidelio_resumo = (
    'resumo:"ECR fase III, duplo-cego, placebo-controlado (FIDELIO-DKD, n=5.734), em DM2 com DRC albuminurica, potassio controlado e uso de IECA ou BRA em dose maxima tolerada. Finerenona 10–20 mg/dia reduziu o desfecho renal primario composto — queda sustentada de TFGe ≥40%, DRCT ou morte renal — com HR 0,82 (IC 95% 0,73–0,93; P=0,001). O desfecho cardiovascular secundario tambem foi reduzido: HR 0,86 (IC 95% 0,75–0,99; P=0,03). Descontinuacao por hipercalemia foi mais frequente com finerenona: 2,3% vs 0,9%."'
)
_fidelio_conclusao = (
    'conclusao:"FIDELIO-DKD estabeleceu a finerenona como terapia nefroprotetora e cardioprotetora adicional ao bloqueio do SRAA em DRC diabetica albuminurica, com necessidade de selecao por potassio e monitorizacao laboratorial."'
)
_fidelio_curiosidade = (
    'curiosidade:"A finerenona e um antagonista nao esteroidal do receptor mineralocorticoide. Diferencia-se dos MRAs esteroidais por estrutura, distribuicao tecidual e ausencia de atividade androgenica/progestagenica relevante, mas nao elimina o principal cuidado clinico da classe: hipercalemia."'
)

patches = {

  # fidelio — formato multi-linha (impacto e icon em linhas separadas)
  'fidelio': (
    '    impacto:"↓18% desfecho renal · ↓14% eventos CV · Finerenona como 3º pilar nefroprotetor",\n    icon:"\U0001f48a"\n  },',
    '    impacto:"↓18% desfecho renal · ↓14% eventos CV · Finerenona como 3º pilar nefroprotetor",\n    icon:"\U0001f48a",\n'
    '    ' + _fidelio_resumo + ',\n'
    '    ' + _fidelio_conclusao + ',\n'
    '    ' + _fidelio_curiosidade + '\n'
    '  },'
  ),

  # fidelio_dkd — formato inline
  'fidelio_dkd': (
    '    impacto:"Finerenona ↓18% desfecho renal composto · ↓14% eventos CV · Antagonista não-esteroidal do receptor mineralocorticoide",icon:"\U0001f48a"\n  },',
    '    impacto:"Finerenona ↓18% desfecho renal composto · ↓14% eventos CV · Antagonista não-esteroidal do receptor mineralocorticoide",icon:"\U0001f48a",\n'
    '    ' + _fidelio_resumo + ',\n'
    '    ' + _fidelio_conclusao + ',\n'
    '    ' + _fidelio_curiosidade + '\n'
    '  },'
  ),

  'akiki_trial': (
    '    impacto:"Início precoce de TRS não reduziu mortalidade vs estratégia expectante — muitos pacientes do grupo tardio recuperaram sem TRS",icon:"\U0001f52c"\n  },',
    '    impacto:"Início precoce de TRS não reduziu mortalidade vs estratégia expectante — muitos pacientes do grupo tardio recuperaram sem TRS",icon:"\U0001f52c",\n'
    '    resumo:"ECR multicêntrico francês (AKIKI, n=620), em pacientes críticos com LRA estágio 3 KDIGO, em ventilação mecânica e/ou uso de vasopressor, sem indicação emergencial imediata de TRS. Comparou estratégia precoce — início imediato de TRS após randomização — vs estratégia tardia, iniciando TRS apenas diante de critérios como hipercalemia grave, acidose metabólica grave, edema pulmonar/sobrecarga volêmica, ureia elevada ou oliguria/anúria persistente. Mortalidade em 60 dias não diferiu: 48,5% vs 49,7% (P=0,79). No grupo tardio, 49% não recebeu TRS.",\n'
    '    conclusao:"AKIKI demonstrou que início imediato rotineiro de TRS em LRA grave de UTI, na ausência de indicação emergencial, não reduz mortalidade e pode expor pacientes a procedimento desnecessário.",\n'
    '    curiosidade:"O dado mais prático do AKIKI é que quase metade dos pacientes no braço tardio recuperou sem TRS. LRA KDIGO 3 aumenta risco, mas não equivale automaticamente a necessidade imediata de diálise."\n'
    '  },'
  ),

  'elain_trial': (
    '    impacto:"Único RCT favorecendo início PRECOCE de TRS: ↓28 dias de mortalidade em população cirúrgica selecionada — critérios KDIGO NGAL",icon:"\U0001f52c"\n  },',
    '    impacto:"Único RCT favorecendo início PRECOCE de TRS: ↓28 dias de mortalidade em população cirúrgica selecionada — critérios KDIGO NGAL",icon:"\U0001f52c",\n'
    '    resumo:"ECR unicêntrico alemão (ELAIN, n=231), em pacientes críticos majoritariamente cirúrgicos, muitos após cirurgia cardíaca, com LRA estágio 2 KDIGO e NGAL plasmático elevado. Comparou início precoce de TRS em até 8h após estágio 2 vs início tardio após progressão para estágio 3 ou indicação clínica. Mortalidade em 90 dias foi menor no grupo precoce: 39,3% vs 54,7% (HR 0,66; IC 95% 0,45–0,97; P=0,03). Houve menor duração de TRS e maior recuperação renal no grupo precoce.",\n'
    '    conclusao:"ELAIN foi o principal trial favorável ao início precoce de TRS, mas sua generalização é limitada por ser unicêntrico, pequeno, com população cirúrgica selecionada e uso de biomarcador como critério de inclusão.",\n'
    '    curiosidade:"A discrepância entre ELAIN e trials maiores como AKIKI, IDEAL-ICU e STARRT-AKI provavelmente reflete diferenças de população, gravidade, critérios de inclusão e definição operacional de \'precoce\' e \'tardio\'."\n'
    '  },'
  ),

  'ideal_icu_trial': (
    '    impacto:"TRS precoce vs tardio em LRA+sepse: sem diferença em mortalidade — consistente com AKIKI e STARRT-AKI",icon:"\U0001f52c"\n  },',
    '    impacto:"TRS precoce vs tardio em LRA+sepse: sem diferença em mortalidade — consistente com AKIKI e STARRT-AKI",icon:"\U0001f52c",\n'
    '    resumo:"ECR multicêntrico francês (IDEAL-ICU, n=488), em pacientes com choque séptico e LRA grave, comparando início precoce de TRS em até 12h após diagnóstico vs estratégia tardia, aguardando até 48h se não houvesse recuperação ou surgisse indicação emergencial. O estudo foi interrompido precocemente por futilidade. Mortalidade em 90 dias não diferiu: 58% no precoce vs 54% no tardio (P=0,38). No braço tardio, 38% dos pacientes não recebeu TRS.",\n'
    '    conclusao:"IDEAL-ICU mostrou que, em LRA grave associada a choque séptico, o início precoce rotineiro de TRS não reduz mortalidade quando comparado a uma estratégia de espera monitorizada.",\n'
    '    curiosidade:"IDEAL-ICU é importante porque testou uma população séptica, na qual muitos clínicos tendem a antecipar TRS por gravidade sistêmica. Mesmo nesse cenário, aguardar recuperação ou indicação formal poupou TRS em parcela relevante."\n'
    '  },'
  ),

  'evolve_trial': (
    '    impacto:"Cinacalcet não reduziu significativamente mortalidade ou eventos CV no HPT2 em diálise (resultado neutro com ajuste estatístico)",icon:"\U0001f52c"\n  },',
    '    impacto:"Cinacalcet não reduziu significativamente mortalidade ou eventos CV no HPT2 em diálise (resultado neutro com ajuste estatístico)",icon:"\U0001f52c",\n'
    '    resumo:"ECR multicêntrico (EVOLVE, n=3.883), em pacientes em hemodiálise com hiperparatireoidismo secundário moderado a grave, comparando cinacalcet titulado até 180 mg/dia vs placebo, sobre tratamento usual. O desfecho primário composto — morte por qualquer causa ou primeiro evento cardiovascular não fatal, incluindo IM, hospitalização por angina instável, insuficiência cardíaca ou evento vascular periférico — não foi reduzido de forma estatisticamente significativa na análise primária por intenção de tratar: HR 0,93 (IC 95% 0,85–1,02; P=0,11). Análises ajustadas e de sensibilidade sugeriram possível benefício, mas não substituem o resultado primário neutro.",\n'
    '    conclusao:"EVOLVE mostrou que cinacalcet melhora controle bioquímico do HPT2, mas não comprovou redução significativa de mortalidade ou eventos cardiovasculares maiores na análise primária.",\n'
    '    curiosidade:"O EVOLVE é um exemplo clássico de dissociação entre controle laboratorial e desfecho duro: reduzir PTH, cálcio e fósforo é clinicamente útil, mas isso não se traduziu claramente em menor mortalidade cardiovascular no trial."\n'
    '  },'
  ),

  # kdigo_cardiorenal_consensus — formato multi-linha
  'kdigo_cardiorenal_consensus': (
    '    impacto:"Classificação e manejo da síndrome cardiorrenal em 5 tipos",\n    icon:"\U0001f4cb"\n  },',
    '    impacto:"Classificação e manejo da síndrome cardiorrenal em 5 tipos",\n    icon:"\U0001f4cb",\n'
    '    resumo:"Classificação clínica da síndrome cardiorrenal proposta por Ronco/ADQI, organizando a interação coração-rim em 5 tipos conforme órgão inicial, temporalidade e contexto sistêmico: tipo 1, disfunção cardíaca aguda levando a LRA; tipo 2, disfunção cardíaca crônica levando a DRC; tipo 3, LRA levando a disfunção cardíaca aguda; tipo 4, DRC contribuindo para disfunção cardíaca crônica; tipo 5, doença sistêmica causando disfunção cardíaca e renal simultânea, como sepse, amiloidose ou vasculite.",\n'
    '    conclusao:"A classificação em 5 tipos oferece linguagem comum entre nefrologia, cardiologia e terapia intensiva, mas não substitui a avaliação hemodinâmica, congestiva, inflamatória e medicamentosa individual.",\n'
    '    curiosidade:"O tipo 3 é frequentemente negligenciado: LRA pode precipitar disfunção cardíaca por hipercalemia, acidose, sobrecarga volêmica, inflamação, toxinas urêmicas e alterações neuro-hormonais, mesmo sem cardiopatia estrutural prévia evidente."\n'
    '  },'
  ),

  'dose_trial': (
    '    impacto:"Altas doses de furosemida (2,5× dose oral) superiores em alívio dos sintomas vs baixas doses; bolus e infusão contínua equivalentes",icon:"\U0001f52c"\n  },',
    '    impacto:"Altas doses de furosemida (2,5× dose oral) superiores em alívio dos sintomas vs baixas doses; bolus e infusão contínua equivalentes",icon:"\U0001f52c",\n'
    '    resumo:"ECR multicêntrico, duplo-cego, fatorial 2×2 (DOSE, n=308), em insuficiência cardíaca aguda descompensada, comparando furosemida IV em bolus a cada 12h vs infusão contínua e estratégia de baixa dose vs alta dose (2,5 vezes a dose oral diária prévia). Não houve diferença significativa entre bolus e infusão contínua nos desfechos primários de sintomas ou mudança da creatinina em 72h. Alta dose não foi superior nos desfechos primários, mas produziu maior diurese e perda ponderal em desfechos secundários, com maior frequência de piora transitória da função renal.",\n'
    '    conclusao:"DOSE mostrou que bolus e infusão contínua de furosemida são estratégias equivalentes em IC aguda, e que doses mais altas podem acelerar descongestão, mas exigem monitorizacao de creatinina, eletrólitos, pressão arterial e resposta clínica.",\n'
    '    curiosidade:"O estudo ajudou a relativizar a creatinina durante descongestão: elevação transitória pode acompanhar diurese efetiva e não necessariamente indicar lesão tubular irreversível. A interpretação deve integrar congestão residual, perfusão, diurese e evolução clínica."\n'
    '  },'
  ),

  'confirm_trial': (
    '    impacto:"Terlipressina + albumina ↑reversão da SHR-1 vs placebo — confirmou terlipressina como tratamento padrão no ocidente",icon:"\U0001f52c"\n  },',
    '    impacto:"Terlipressina + albumina ↑reversão da SHR-1 vs placebo — confirmou terlipressina como tratamento padrão no ocidente",icon:"\U0001f52c",\n'
    '    resumo:"ECR multicêntrico, duplo-cego, placebo-controlado (CONFIRM, n=300), em cirrose avançada com SHR tipo 1/SHR-AKI, comparando terlipressina IV intermitente associada à albumina vs placebo + albumina. A reversão verificada da SHR foi maior com terlipressina: 32% vs 17% (P=0,006). Não houve melhora significativa de sobrevida em 90 dias. Terlipressina aumentou eventos adversos graves, especialmente insuficiência respiratória, exigindo seleção cuidadosa e monitorização de hipóxia, congestão e gravidade hepática.",\n'
    '    conclusao:"CONFIRM fundamentou a aprovação da terlipressina para SHR-AKI por aumentar reversão bioquímica da síndrome, mas não demonstrou benefício claro de sobrevida e revelou risco respiratório clinicamente relevante.",\n'
    '    curiosidade:"A SHR-AKI é uma falência circulatória funcional sobre cirrose avançada: vasodilatação esplâncnica reduz volume arterial efetivo, ativa vasoconstritores endógenos e causa vasoconstrição renal intensa. Terlipressina corrige parte da hemodinâmica, mas não modifica a doença hepática terminal que determina o prognóstico."\n'
    '  },'
  ),

  'sacubitril_valsartan_hf': (
    '    impacto:"Sacubitril/valsartan: efeitos renais benéficos em IC, redução de albuminúria e potencial nefroproteção via BNP/neprilisina",icon:"\U0001f52c"\n  },',
    '    impacto:"Sacubitril/valsartan: efeitos renais benéficos em IC, redução de albuminúria e potencial nefroproteção via BNP/neprilisina",icon:"\U0001f52c",\n'
    '    resumo:"Análise renal do PARADIGM-HF (Damman et al., JACC Heart Failure 2018), em pacientes com ICFEr randomizados para sacubitril/valsartan vs enalapril. O declínio anual da TFGe foi menor com sacubitril/valsartan: −1,61 vs −2,04 ml/min/1,73m²/ano (P<0,001). Apesar disso, houve maior aumento de UACR com sacubitril/valsartan, em magnitude pequena, mostrando que preservação de TFGe e albuminúria podem se comportar de forma dissociada nessa intervenção.",\n'
    '    conclusao:"A análise renal do PARADIGM-HF sugere que sacubitril/valsartan desacelera o declínio da TFGe em ICFEr quando comparado ao enalapril, mas não deve ser apresentado como terapia antiproteinúrica.",\n'
    '    curiosidade:"O achado é fisiologicamente interessante porque a inibição da neprilisina aumenta peptídeos natriuréticos e sinalização por cGMP, com efeitos hemodinâmicos renais complexos. A mensagem didática é que nem toda nefroproteção se manifesta como redução de albuminúria."\n'
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
