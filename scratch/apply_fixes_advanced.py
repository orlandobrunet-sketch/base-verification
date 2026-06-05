import re
import os

filepath = "data/topics.js"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    # 1. Doença de Fabry e Triagem Renal
    (
        '''    "qid": "0f7d97f3",
    "q": "Em qual cenário clínico a triagem para Doença de Fabry deve ser fortemente considerada no setor de nefrologia?",
    "refs": [
      "kdigo_gn",
      "alport_syndrome_review"
    ],''',
        '''    "qid": "0f7d97f3",
    "q": "Em qual cenário clínico a triagem para Doença de Fabry deve ser fortemente considerada no setor de nefrologia?",
    "refs": [
      "kdigo_gn"
    ],'''
    ),
    
    # 2. Nefrite Lúpica — Classificação e Tratamento
    (
        '''    "exp": "Para nefrite lúpica classe III/IV, KDIGO 2021, ACR 2020 e EULAR/ERA-EDTA recomendam: Indução — micofenolato mofetil (MMF) 2-3 g/dia OU ciclofosfamida (protocolo NIH ou Euro-Lupus) + corticoide (pulsoterapia 500-1000 mg IV × 3d, depois prednisona 0,5 mg/kg/dia com retirada em 6 meses). O MMF é preferido por equivalência de eficácia e melhor tolerabilidade. Voclosporina (AURORA) ou belimumabe (BLISS-LN) podem ser adicionados ao MMF para maior resposta renal. Manutenção: MMF 1,5-2 g/dia por ≥3 anos. Classe IV com crescentes: considerar pulsoterapia de CF. Resposta completa: proteinúria <0,5 g/dia + estabilidade da TFG.",
    "cat": "glomerular",
    "diff": "hard",
    "refs": [
      "kdigo_gn",
      "vte_nephrotic_lim"
    ],''',
        '''    "exp": "Para nefrite lúpica classe III/IV, KDIGO 2024, ACR 2020 e EULAR/ERA-EDTA recomendam: Indução — micofenolato mofetil (MMF) 2-3 g/dia OU ciclofosfamida (protocolo NIH ou Euro-Lupus) + corticoide (pulsoterapia 500-1000 mg IV × 3d, depois prednisona 0,5 mg/kg/dia com retirada em 6 meses). O MMF é preferido por equivalência de eficácia e melhor tolerabilidade. Voclosporina (AURORA) ou belimumabe (BLISS-LN) podem ser adicionados ao MMF para maior resposta renal. Manutenção: MMF 1,5-2 g/dia por ≥3 anos. Classe IV com crescentes: considerar pulsoterapia de CF. Resposta completa: proteinúria <0,5 g/dia + estabilidade da TFG.",
    "cat": "glomerular",
    "diff": "hard",
    "refs": [
      "kdigo_lupus_nephritis_guideline_2024",
      "vte_nephrotic_lim"
    ],'''
    ),
    
    # 3. Holly™ — Sistema de Diálise Implantável
    (
        '''    "qid": "c7abfaf3",
    "q": "Qual é a designação regulatória concedida pelo FDA ao sistema de diálise implantável contínua Holly™ (Nephrodite)?",
    "opts": [
      "Aprovação plena para uso comercial",
      "Designação de Dispositivo Inovador (Breakthrough Device Designation)",
      "Autorização de uso emergencial",
      "Designação de dispositivo humanitário"
    ],
    "ans": 1,
    "exp": "A alternativa 'Designação de Dispositivo Inovador (Breakthrough Device Desi...' é a melhor resposta porque Breakthrough Device Designation é um programa regulatório real do FDA para dispositivos destinados a doenças graves ou irreversivelmente debilitantes com potencial de oferecer benefício clínico relevante, acelerando a interação com a agência e a revisão regulatória, sem significar autorização comercial imediata. A alternativa 'Aprovação plena para uso comercial' está errada porque aprovação plena para uso comercial exigiria uma via específica de autorização ou aprovação e não se confunde com uma designação de desenvolvimento. A alternativa 'Autorização de uso emergencial' está errada porque autorização de uso emergencial é reservada a cenários excepcionais de emergência em saúde pública e não corresponde ao caminho regulatório usual de um sistema implantável para terapia renal substitutiva crônica. A alternativa 'Designação de dispositivo humanitário' está errada porque a designação humanitária é outra categoria regulatória, aplicada a condições raras em contexto distinto, não sendo equivalente à Breakthrough Device Designation. O problema da versão original estava na explicação, que tratava 'Dispositivo Inovador' como se não correspondesse à própria designação oficial citada in inglês na alternativa 'Designação de Dispositivo Inovador (Breakthrough Device Desi...' e ainda discutia distratores que não estavam listados.",
    "diff": "medium",
    "cat": "dialise",
    "refs": [
      "kdigo_gn"
    ]''',
        '''    "qid": "c7abfaf3",
    "q": "Qual é a designação regulatória concedida pelo FDA ao sistema de diálise implantável contínua Holly™ (Nephrodite)?",
    "opts": [
      "Aprovação plena para uso comercial",
      "Designação de Dispositivo Inovador (Breakthrough Device Designation)",
      "Autorização de uso emergencial",
      "Designação de dispositivo humanitário"
    ],
    "ans": 1,
    "exp": "A alternativa 'Designação de Dispositivo Inovador (Breakthrough Device Desi...' é a melhor resposta porque Breakthrough Device Designation é um programa regulatório real do FDA para dispositivos destinados a doenças graves ou irreversivelmente debilitantes com potencial de oferecer benefício clínico relevante, acelerando a interação com a agência e a revisão regulatória, sem significar autorização comercial imediata. A alternativa 'Aprovação plena para uso comercial' está errada porque aprovação plena para uso comercial exigiria uma via específica de autorização ou aprovação e não se confunde com uma designação de desenvolvimento. A alternativa 'Autorização de uso emergencial' está errada porque autorização de uso emergencial é reservada a cenários excepcionais de emergência em saúde pública e não corresponde ao caminho regulatório usual de um sistema implantável para terapia renal substitutiva crônica. A alternativa 'Designação de dispositivo humanitário' está errada porque a designação humanitária é outra categoria regulatória, aplicada a condições raras em contexto distinto, não sendo equivalente à Breakthrough Device Designation. O problema da versão original estava na explicação, que tratava 'Dispositivo Inovador' como se não correspondesse à própria designação oficial citada em inglês na alternativa 'Designação de Dispositivo Inovador (Breakthrough Device Desi...' e ainda discutia distratores que não estavam listados.",
    "diff": "medium",
    "cat": "dialise",
    "refs": [
      "kdigo_dialise"
    ]'''
    ),
    
    # 4. Holly™ — Ensaios Clínicos Planejados -> iSGLT2
    (
        '''    "t": "Holly™ — Ensaios Clínicos Planejados",
    "qid": "da0fa458",
    "q": "Qual é o principal benefício dos inibidores do SGLT2 em pacientes com doença renal crônica e diabetes tipo 2?",
    "opts": [
      "Redução da progressão da DRC, eventos cardiovasculares maiores e hospitalização por IC, com benefício demonstrado em pacientes com e sem diabetes",
      "Apenas controle glicêmico sem impacto renal ou cardiovascular adicional",
      "Benefício renal exclusivo em albuminúria nefrótica (> 3,5 g/dia)",
      "Apenas nefroproteção sem benefício cardiovascular demonstrado"
    ],
    "ans": 0,
    "exp": "A alternativa 'Redução da progressão da DRC, eventos cardiovasculares maior...' é a melhor resposta. Os inibidores do SGLT2 reduzem a progressão da DRC e eventos cardiovasculares, com benefício demonstrado em pacientes com e sem diabetes (DAPA-CKD, EMPA-KIDNEY, CREDENCE). Esse efeito ocorre em parte pela redução da pressão intraglomerular (restauração do feedback túbulo-glomerular), além de efeitos anti-inflamatórios e metabólicos. A alternativa 'Apenas controle glicêmico sem impacto renal ou cardiovascula...' está errada: o benefício vai muito além do controle glicêmico. A alternativa 'Benefício renal exclusivo em albuminúria nefrótica (> 3,5 g/...' está errada: o benefício é demonstrado em ampla faixa de albuminúria, não apenas nefrótica. A alternativa 'Apenas nefroproteção sem benefício cardiovascular demonstrad...' está errada: há benefício CV consistente, incluindo redução de hospitalização por IC.",
    "diff": "easy",
    "cat": "dialise",
    "refs": [
      "kdigo_gn"
    ]''',
        '''    "t": "Benefício dos iSGLT2 na DRC e DM2",
    "qid": "da0fa458",
    "q": "Qual é o principal benefício dos inibidores do SGLT2 em pacientes com doença renal crônica e diabetes tipo 2?",
    "opts": [
      "Redução da progressão da DRC, eventos cardiovasculares maiores e hospitalização por IC, com benefício demonstrado em pacientes com e sem diabetes",
      "Apenas controle glicêmico sem impacto renal ou cardiovascular adicional",
      "Benefício renal exclusivo em albuminúria nefrótica (> 3,5 g/dia)",
      "Apenas nefroproteção sem benefício cardiovascular demonstrado"
    ],
    "ans": 0,
    "exp": "A alternativa 'Redução da progressão da DRC, eventos cardiovasculares maior...' é a melhor resposta. Os inibidores do SGLT2 reduzem a progressão da DRC e eventos cardiovasculares, com benefício demonstrado em pacientes com e sem diabetes (DAPA-CKD, EMPA-KIDNEY, CREDENCE). Esse efeito ocorre em parte pela redução da pressão intraglomerular (restauração do feedback túbulo-glomerular), além de efeitos anti-inflamatórios e metabólicos. A alternativa 'Apenas controle glicêmico sem impacto renal ou cardiovascula...' está errada: o benefício vai muito além do controle glicêmico. A alternativa 'Benefício renal exclusivo em albuminúria nefrótica (> 3,5 g/...' está errada: o benefício é demonstrado em ampla faixa de albuminúria, não apenas nefrótica. A alternativa 'Apenas nefroproteção sem benefício cardiovascular demonstrad...' está errada: há benefício CV consistente, incluindo redução de hospitalização por IC.",
    "diff": "easy",
    "cat": "drc",
    "refs": [
      "kdigo_ckd"
    ]'''
    ),
    
    # 5. ADTKD-MUC1 — Desafios Diagnósticos
    (
        '''    "qid": "f4034105",
    "q": "Por que a doença renal cística autossômica dominante (ADTKD) causada por mutações no gene MUC1 é de difícil diagnóstico por sequenciamento de nova geração (NGS)?",
    "opts": [
      "O gene é extremamente longo",
      "Presença de inserção de citosina única em região de repetições VNTR",
      "Mutações são somáticas",
      "Penetrância incompleta"
    ],
    "ans": 1,
    "exp": "A alternativa correta é B, porque na ADTKD-MUC1, cuja denominação correta é doença renal tubulointersticial autossômica dominante e não doença renal cística, a alteração patogênica clássica ocorre em uma região VNTR do MUC1, com inserção/duplicação de uma citosina que gera frameshift em um segmento altamente repetitivo e tecnicamente difícil para amplificação, alinhamento e detecção por NGS convencional de leituras curtas, muitas vezes exigindo métodos dirigidos ou sequenciamento de leitura longa. A alternativa 'O gene é extremamente longo' está errada porque o principal problema não é o comprimento do gene, mas a arquitetura repetitiva da região mutada; a alternativa 'Mutações são somáticas' está errada porque se trata de doença hereditária por variante germinativa, e não mutação somática; e a alternativa 'Penetrância incompleta' está errada porque penetrância clínica não é a razão da limitação analítica do método de sequenciamento.",
    "diff": "hard",
    "cat": "genetica",
    "refs": [
      "alport_syndrome_review",
      "kdigo_ckd"
    ]''',
        '''    "qid": "f4034105",
    "q": "Por que a doença renal cística autossômica dominante (ADTKD) causada por mutações no gene MUC1 é de difícil diagnóstico por sequenciamento de nova geração (NGS)?",
    "opts": [
      "O gene é extremamente longo",
      "Presença de inserção de citosina única em região de repetições VNTR",
      "Mutações são somáticas",
      "Penetrância incompleta"
    ],
    "ans": 1,
    "exp": "A alternativa correta é B, porque na ADTKD-MUC1, cuja denominação correta é doença renal tubulointersticial autossômica dominante e não doença renal cística, a alteração patogênica clássica ocorre em uma região VNTR do MUC1, com inserção/duplicação de uma citosina que gera frameshift em um segmento altamente repetitivo e tecnicamente difícil para amplificação, alinhamento e detecção por NGS convencional de leituras curtas, muitas vezes exigindo métodos dirigidos ou sequenciamento de leitura longa. A alternativa 'O gene é extremamente longo' está errada porque o principal problema não é o comprimento do gene, mas a arquitetura repetitiva da região mutada; a alternativa 'Mutações são somáticas' está errada porque se trata de doença hereditária por variante germinativa, e não mutação somática; e a alternativa 'Penetrância incompleta' está errada porque penetrância clínica não é a razão da limitação analítica do método de sequenciamento.",
    "diff": "hard",
    "cat": "genetica",
    "refs": [
      "kdigo_ckd"
    ]'''
    ),
    
    # 6. Cistinose — Tratamento com Cisteamina
    (
        '''    "qid": "56a4a372",
    "q": "Qual o mecanismo de ação da cisteamina no tratamento da cistinose?",
    "opts": [
      "Inibição da produção de cistina",
      "Converte cistina em cisteína + cisteína-mista, facilitando saída do lisossomo",
      "Bloqueio do transportador CTNS",
      "Redução da reabsorção tubular proximal"
    ],
    "ans": 1,
    "exp": "Na cistinose, o defeito no gene CTNS compromete a cistinosina e leva ao acúmulo lisossomal de cistina; a cisteamina atua entrando no lisossomo e reagindo com a cistina para formar cisteína e um dissulfeto misto cisteína-cisteamina, produtos que conseguem sair do lisossomo por transportadores alternativos, reduzindo a sobrecarga intracelular de cistina e a lesão celular progressiva. Por isso, a alternativa 'Converte cistina em cisteína + cisteína-mista, facilitando s...' é a correta. A alternativa 'Inibição da produção de cistina' está errada porque a cisteamina não inibe a síntese ou a produção de cistina, apenas reduz o conteúdo lisossomal acumulado. A alternativa 'Bloqueio do transportador CTNS' está errada porque a droga não bloqueia o transportador CTNS; ao contrário, ela contorna a deficiência da cistinosina ao gerar moléculas exportáveis por outras vias. A alternativa 'Redução da reabsorção tubular proximal' está errada porque seu mecanismo terapêutico não depende de diminuir reabsorção tubular proximal, embora o tratamento possa atenuar a progressão da tubulopatia ao reduzir o acúmulo de cistina nos tecidos.",
    "diff": "hard",
    "cat": "genetica",
    "refs": [
      "alport_syndrome_review",
      "kdigo_ckd"
    ]''',
        '''    "qid": "56a4a372",
    "q": "Qual o mecanismo de ação da cisteamina no tratamento da cistinose?",
    "opts": [
      "Inibição da produção de cistina",
      "Converte cistina em cisteína + cisteína-mista, facilitando saída do lisossomo",
      "Bloqueio do transportador CTNS",
      "Redução da reabsorção tubular proximal"
    ],
    "ans": 1,
    "exp": "Na cistinose, o defeito no gene CTNS compromete a cistinosina e leva ao acúmulo lisossomal de cistina; a cisteamina atua entrando no lisossomo e reagindo com a cistina para formar cisteína e um dissulfeto misto cisteína-cisteamina, produtos que conseguem sair do lisossomo por transportadores alternativos, reduzindo a sobrecarga intracelular de cistina e a lesão celular progressiva. Por isso, a alternativa 'Converte cistina em cisteína + cisteína-mista, facilitando s...' é a correta. A alternativa 'Inibição da produção de cistina' está errada porque a cisteamina não inibe a síntese ou a produção de cistina, apenas reduz o conteúdo lisossomal acumulado. A alternativa 'Bloqueio do transportador CTNS' está errada porque a droga não bloqueia o transportador CTNS; ao contrário, ela contorna a deficiência da cistinosina ao gerar moléculas exportáveis por outras vias. A alternativa 'Redução da reabsorção tubular proximal' está errada porque seu mecanismo terapêutico não depende de diminuir reabsorção tubular proximal, embora o tratamento possa atenuar a progressão da tubulopatia ao reduzir o acúmulo de cistina nos tecidos.",
    "diff": "hard",
    "cat": "genetica",
    "refs": [
      "kdigo_ckd"
    ]'''
    ),
    
    # 7. Transfusão de Hemácias na DRC — KDIGO 2026 (year update)
    (
        '''    "t": "Transfusão de Hemácias na DRC — KDIGO 2026",
    "qid": "12121893",
    "q": "De acordo com as diretrizes KDIGO 2012, qual é o limiar de hemoglobina recomendado para considerar a transfusão de hemácias em adultos hospitalizados com doença renal crônica (DRC) que estão hemodinamicamente estáveis?",
    "opts": [
      "Hb <9 g/dL",
      "Hb <8 g/dL",
      "Hb <10 g/dL",
      "Hb <7 g/dL"
    ],
    "ans": 3,
    "exp": "As diretrizes KDIGO 2012 recomendam considerar a transfusão de hemácias em pacientes adultos hospitalizados com DRC que estão hemodinamicamente estáveis quando a hemoglobina está abaixo de 7 g/dL. Este limiar é baseado em evidências que indicam que transfusões em níveis mais altos de hemoglobina não melhoram os desfechos e podem aumentar o risco de eventos adversos, como sobrecarga de volume e reações transfusionais. As outras opções, como 8 g/dL, 9 g/dL e 10 g/dL, são limiares mais altos que não são recomendados para pacientes estáveis, pois podem expor os pacientes a riscos desnecessários sem benefícios comprovados.",''',
        '''    "t": "Transfusão de Hemácias na DRC — KDIGO 2026",
    "qid": "12121893",
    "q": "De acordo com as diretrizes KDIGO 2026, qual é o limiar de hemoglobina recomendado para considerar a transfusão de hemácias em adultos hospitalizados com doença renal crônica (DRC) que estão hemodinamicamente estáveis?",
    "opts": [
      "Hb <9 g/dL",
      "Hb <8 g/dL",
      "Hb <10 g/dL",
      "Hb <7 g/dL"
    ],
    "ans": 3,
    "exp": "As diretrizes KDIGO 2026 recomendam considerar a transfusão de hemácias em pacientes adultos hospitalizados com DRC que estão hemodinamicamente estáveis quando a hemoglobina está abaixo de 7 g/dL. Este limiar é baseado em evidências que indicam que transfusões em níveis mais altos de hemoglobina não melhoram os desfechos e podem aumentar o risco de eventos adversos, como sobrecarga de volume e reações transfusionais. As outras opções, como 8 g/dL, 9 g/dL e 10 g/dL, são limiares mais altos que não são recomendados para pacientes estáveis, pois podem expor os pacientes a riscos desnecessários sem benefícios comprovados.",'''
    )
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print("Successfully replaced a block.")
    else:
        old_normalized = old.replace('\r\n', '\n').replace('\n', '\r\n')
        if old_normalized in content:
            content = content.replace(old_normalized, new.replace('\n', '\r\n'))
            print("Successfully replaced normalized block.")
        else:
            print(f"Warning: could not find exact block!")

# Let's do regex replacements for the specific kdigo_tx to kdigo_transplant updates
target_qids = ["cf7c57e2", "304703c3", "94c1ae3d", "7dbc02ce", "4afc0858", "81216c60", "3fbc1a5a"]

for qid in target_qids:
    pattern = r'(\{\s*(?:[^{}]*?"qid"\s*:\s*"' + qid + r'"[^{}]*?)\})'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        block = match.group(1)
        if '"kdigo_tx"' in block:
            new_block = block.replace('"kdigo_tx"', '"kdigo_transplant"')
            content = content.replace(block, new_block)
            print(f"Successfully updated references to kdigo_transplant for QID {qid}.")
        else:
            print(f"QID {qid} block found but does not contain 'kdigo_tx'.")
    else:
        print(f"Could not find block for QID {qid}.")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Finished applying updates.")
