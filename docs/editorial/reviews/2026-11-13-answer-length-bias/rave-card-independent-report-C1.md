# RAVE C1: card integral aprovado

Veredito:aprovada. Evidência:VERIFICADA. Pendência:NENHUMA. Publicação:LIBERADA.

{
  "schema": 1,
  "reviewer": "/root/medical_answer_bias (independente do autor)",
  "reviewDate": "2026-11-13",
  "norms": {
    ".claude/skills/revisar-nefroquest/SKILL.md": "6027e111ff75ff8798aad8d4ef10daf231fefeca65317d53de9a2fc6a891aeef",
    ".claude/skills/revisar-nefroquest/references/output-contract.md": "4a20348ac71a07836b4611d574496d97960b27a2bbfdcf1f1ed318396f0edcb8",
    ".claude/skills/revisar-nefroquest/references/verification-protocol.md": "ba8d2ebfb23be11e7d7ee2cb312717f1cb6a3b38e03b77d4f97d5160b16810dc",
    "docs/editorial/NQ_KNOWLEDGE_MODEL_v1.md": "4091dc76cadf6299e5da46333c23cf47abf79274612c9c47a1e181832347f913",
    "docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md": "1b71d58a80811fd0cdcc04551f50f2f110cda4b1b7c518e6166779cb540bf9df",
    "docs/editorial/annex-c-nefrologia.md": "d38f8df3102b2967de442902d6f81627ac28c1a733b831e186153a49de1972fe"
  },
  "cardId": "rave_study",
  "candidateFile": "rave-card-candidate-C1.json",
  "candidateFileHash": "b39713ae5995631d84a034b2f5a12280b6b60bb5e8d37e3ead620cbadbb27b07",
  "originalHash": "8a7a0594d0d03f8855dd11f27524c9b04ce2e928ae27388e271480b11a46d00b",
  "candidateHash": "e861f65f088c34f6016832ab37de64216c64494870c14cb68a70603cef068769",
  "candidate": {
    "label": "Stone JH et al. — RAVE Trial (NEJM 2010)",
    "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa0909905",
    "journal": "N Engl J Med 2010;363(3):221-232",
    "ano": 2010,
    "tipo": "Ensaio Clínico RCT",
    "badge": "RCT",
    "badgeColor": "#10b981",
    "impacto": "Rituximabe não inferior à ciclofosfamida para indução na vasculite ANCA grave e superior na recidiva",
    "icon": "🔬",
    "resumo": "ECR duplo-cego de não inferioridade multicêntrico (RAVE, n = 197), comparando rituximabe (375 mg/m² uma vez por semana por quatro semanas) com ciclofosfamida oral (2 mg/kg/dia, ajustada à função renal, seguida de azatioprina após remissão); ambos os grupos receberam glicocorticoide. O desfecho primário foi remissão completa sem prednisona aos seis meses. Rituximabe foi não inferior à ciclofosfamida (64% vs 53%; P < 0,001 para não inferioridade). No subgrupo predefinido com doença recidivante, atingiram o desfecho 67% vs 42%.",
    "conclusao": "O RAVE sustenta rituximabe com glicocorticoide como alternativa à ciclofosfamida com glicocorticoide para indução de remissão na população estudada, com benefício observado no subgrupo recidivante. Não houve diferença significativa global nas taxas de eventos adversos em seis meses; o ensaio não demonstrou redução da toxicidade gonadal cumulativa.",
    "curiosidade": "O estudo excluiu creatinina acima de 4 mg/dL e hemorragia alveolar que exigia suporte ventilatório. A comparação entre os regimes permanece incerta nesses grupos; a ausência de diferença global de eventos adversos em seis meses tampouco resolve todos os riscos cumulativos tardios."
  },
  "verdict": "aprovada",
  "confidence": "alta",
  "evidence": "VERIFICADA",
  "pending": "NENHUMA",
  "publication": "LIBERADA",
  "scope": "Card integral, não somente correção bibliográfica. Todo campo final foi confrontado ao manuscrito primário; só1consumidor atual eA2, ambos compatíveis.",
  "claimAudit": [
    {
      "fields": [
        "label",
        "journal"
      ],
      "finding": "Metadados primários mostram Stone JH, não Jones RB, e221–232, não221–230."
    },
    {
      "fields": [
        "resumo"
      ],
      "finding": "Métodos confirmam375mg/m² semanal×4,2mg/kg/diaCYCajustada,AZAapósremissão,GCemambos;resultadosconfirmamN197,6meses64/53%,NIp<0,001,subgrupopredefinidorecidiva67/42%. Não transforma subgrupo em superioridade para todos."
    },
    {
      "fields": [
        "conclusao"
      ],
      "finding": "Resultados e discussão não mostram redução global de eventos adversos. A própria discussão observa que6meses podem ser curtos para detectar infertilidade, de modo que minimizar gonadotoxicidade não deve ser atribuído como achado deste ensaio."
    },
    {
      "fields": [
        "curiosidade"
      ],
      "finding": "Discussão excluiSCr>4,0mg/dLesuporteventilatório;comparaçãoincerta nessesgrupos. Remove relato histórico1997não pertinente e simplificação causal de células B produtoras de anticorpos como prova de mecanismo clínico."
    }
  ],
  "sources": {
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/3137658/",
    "doi": "10.1056/NEJMoa0909905",
    "access": "Alias público abriu manuscrito primário integral621linhas após URLprefixado desafiar acesso e XML500. Métodos265–268, resultados e discussão482–490 lidos. Stone,221–232;GCemambos;CYCajustada;exclusões e limitação infertilidade confirmadas."
  },
  "consumerCount": 1,
  "consumers": [
    {
      "qid": "89af997c",
      "title": "Vasculite ANCA Renal Grave — Indução com Função Muito Reduzida",
      "currentHash": "77247ee52792a5ad51904be3cd99bf3d5b9d30de91a67c104d40395df3b14d23",
      "currentQuestion": {
        "t": "Vasculite ANCA Renal Grave — Indução com Função Muito Reduzida",
        "qid": "89af997c",
        "q": "Paciente com glomerulonefrite pauci-imune associada a PR3-ANCA apresenta creatinina de 4,8 mg/dL em rápida elevação, sem hemorragia alveolar. Qual estrutura de indução é mais alinhada à KDIGO 2024?",
        "refs": [
          "kdigo_anca_2024",
          "rituxvas_study",
          "rave_study",
          "pexivas_trial"
        ],
        "opts": [
          "Glicocorticoide em regime reduzido associado a ciclofosfamida, ou combinação de rituximabe com pulsos de ciclofosfamida; considerar troca plasmática separadamente pelo risco renal",
          "Rituximabe isolado, sem glicocorticoide nem ciclofosfamida, porque PR3-ANCA torna a disfunção renal irrelevante",
          "Micofenolato isolado, pois tem eficácia equivalente na glomerulonefrite grave com creatinina acima de 4 mg/dL",
          "Troca plasmática como tratamento exclusivo, substituindo a indução imunossupressora"
        ],
        "ans": 0,
        "exp": "Na vasculite associada ao ANCA de início recente, a indução combina glicocorticoide com rituximabe ou ciclofosfamida. Quando a creatinina está acima de 4 mg/dL ou a filtração cai rapidamente, porém, os dados para rituximabe associado apenas a glicocorticoide são limitados: o RAVE excluiu esse grau de disfunção renal. A KDIGO 2024 orienta considerar ciclofosfamida com glicocorticoide ou rituximabe combinado a pulsos de ciclofosfamida. O regime reduzido de glicocorticoide é preferível por menor toxicidade. Troca plasmática é uma decisão adicional em risco renal extremo, necessidade de diálise, creatinina rapidamente crescente ou hemorragia alveolar com hipoxemia; não substitui a imunossupressão.",
        "diff": "hard",
        "cat": "glomerular"
      },
      "plannedHash": "36a3db783e599e4464ed2eb0d508572dea08e5eed6169895d6412b665d74494b",
      "plannedQuestion": {
        "t": "Vasculite ANCA Renal Grave — Indução com Função Muito Reduzida",
        "qid": "89af997c",
        "q": "Paciente com glomerulonefrite pauci-imune e anticorpos anticitoplasma de neutrófilos (ANCA) contra proteinase 3 (PR3) apresenta creatinina de 4,8 mg/dL em rápida elevação, sem hemorragia alveolar. Qual estrutura de indução é mais alinhada à KDIGO 2024?",
        "refs": [
          "kdigo_anca_2024",
          "rituxvas_study",
          "rave_study",
          "pexivas_trial"
        ],
        "opts": [
          "Glicocorticoide com ciclofosfamida; considerar rituximabe combinado a pulsos de ciclofosfamida",
          "Glicocorticoide com rituximabe, preferido pela equivalência comprovada no RAVE nessa faixa de creatinina",
          "Glicocorticoide com micofenolato, pela equivalência demonstrada na doença renal muito grave",
          "Glicocorticoide com azatioprina, por ser o tratamento de indução mais seguro nessa apresentação"
        ],
        "ans": 0,
        "exp": "Na vasculite associada ao ANCA de início recente, a indução combina glicocorticoide com rituximabe ou ciclofosfamida. Quando a creatinina está acima de 4 mg/dL ou a filtração cai rapidamente, porém, os dados para rituximabe associado apenas a glicocorticoide são limitados: o RAVE excluiu esse grau de disfunção renal. A KDIGO 2024 orienta considerar ciclofosfamida com glicocorticoide ou rituximabe combinado a pulsos de ciclofosfamida. O regime reduzido de glicocorticoide é preferível por menor toxicidade. Troca plasmática é uma decisão adicional em risco renal extremo, necessidade de diálise, creatinina rapidamente crescente ou hemorragia alveolar com hipoxemia; não substitui a imunossupressão.",
        "diff": "hard",
        "cat": "glomerular"
      },
      "questionPublication": "BLOQUEADA; eventual gate de card não libera questão"
    }
  ],
  "consumerCompatibility": "89af997c atual eA2 usam exclusãoCr>4como limite de generalização. Card novo confirma, não contradiz; não é gate automático da questão.",
  "historyRequirement": "Arquivar registro anterior do único consumidor e card na integração, mesmo se questão não fosse editada. Nenhum reset deqid.",
  "derivation": "Card integral verificado;sem pendência;veredito aprovação;LIBERADA. Não herda gate de outra versão."
}
