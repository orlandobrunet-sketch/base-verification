# Diálise A3.1 — diligências concluídas, revisão autoral nova

Sem aplicação. A3 bloqueada permanece intocada. Novo gate dos bytes abaixo, sujeito a revisão independente.

## 3d81f74d

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada de §18.4 Regra 7. Revisão autoral.

**OP:** Interpretar comparações de modalidade sem confundir HEMODIAFE com SLED nem ausência de superioridade com equivalência universal. Bloom Compreender / Miller Sabe / dificuldade intermediária.

**Recurso:** A correta identifica a modalidade e o limite inferencial, sem afirmar que ensaios provam equivalência. O caso não manda tratar instabilidade com modalidade inadequada. O metadado de HEMODIAFE foi limitado ao abstract aberto; o card SLED é um documento diferente, não confundido com esse ensaio.

- A: Confundir HEMODIAFE com estudo de diálise estendida e atribuir vantagem de sobrevida inexistente.

- B: Síntese correta verificada, com limite de extrapolação explícito.

- C: Deduzir redução de mortalidade da modalidade contínua a partir de vantagem fisiológica presumida.

- D: Transformar ausência de diferença de sobrevida em equivalência universal das três modalidades.

**Eliminatórios:** nenhum dos dez disparou no novo AFTER. **Score:** 19/20; dimensões e aplicação individual no JSON.

```json
{
  "qid": "3d81f74d",
  "q": "Na lesão renal aguda crítica, qual síntese interpreta o HEMODIAFE e a evidência sobre diálise estendida versus terapia contínua?",
  "opts": [
    "O HEMODIAFE estudou diálise estendida; a maior sobrevida confirma sua vantagem sobre a terapia contínua.",
    "O HEMODIAFE estudou hemodiálise intermitente; os dados citados não estabelecem superioridade de sobrevida.",
    "O HEMODIAFE favoreceu a terapia contínua; a estabilidade hemodinâmica explica uma redução de mortalidade.",
    "A semelhança de sobrevida permite tratar diálise intermitente, estendida e contínua como equivalentes."
  ],
  "ans": 1,
  "exp": "O HEMODIAFE comparou hemodiálise intermitente com hemodiafiltração venovenosa contínua, sem testar diálise estendida. A sobrevida em 60 dias foi 32% e 33%, respectivamente, sob protocolos de tolerância e controle metabólico. Em separado, os ensaios randomizados reunidos na metanálise de diálise estendida versus terapia contínua não demonstraram diferença significativa de mortalidade. Isso não prova equivalência universal nem superioridade de uma modalidade para todo paciente; as condições fisiológicas e a entrega segura do tratamento continuam relevantes.",
  "refs": [
    "hemodiafe_2006",
    "sled_crrt_meta_2015"
  ],
  "cat": "dialise",
  "diff": "medium",
  "t": "LRA Crítica — HEMODIAFE, SLED e CRRT"
}
```

**Fontes:** [H](https://pubmed.ncbi.nlm.nih.gov/16876666/) — OPENED_PRIMARY_ABSTRACT_NLM_EFETCH; Abstract integral efetivamente lido; não corpo completo. Retiradas recuperação renal, dialisato frio e conexão isovolêmica, que este abstract não verifica.

[S](https://pubmed.ncbi.nlm.nih.gov/25843704/) — OPENED_PRIMARY_FULL_ABSTRACT_PUBMED; Abstract primário integral aberto, suficiente para todas as afirmações mantidas no card e candidato.

**Hash canônico:** AFTER `sha256:866155c3b4f4c307295c3c7082796da1be4c703406477afbe6010f85b5442018`; pacote `sha256:8408041eb70daa5ffded2db15237911e2a62e617183f2413059c9700f236183a`.

**Comprimento:** 82/205/123/123 → 104/106/105/102; razão 1.667 → 1.010.

## fe3a5b91

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada de §18.4 Regra 7. Revisão autoral.

**OP:** Ponderar ganho ureico e consumo de dialisato sem extrapolar melhora do marcador a benefício clínico. Bloom Compreender / Miller Sabe / dificuldade intermediária.

**Recurso:** Recurso à antiga opção sobre sessões curtas foi acolhido: a discussão admite limitações ao tempo e individualização, portanto ela foi substituída. O AFTER não proíbe elevar Qd, não presume futilidade e não estabelece sequência universal de ajustes. A opção C agora testa a inferência linear errada: 60% de aumento de fluxo não corresponde a 60% de aumento de Kt/V.

- A: Síntese correta verificada, com limite de extrapolação explícito.

- B: Preferir maior intensidade automaticamente pela melhora de um marcador.

- C: Supor relação proporcional simples entre fluxo de dialisato, depuração e dose entregue.

- D: Converter falta de benefício clínico demonstrado em prova de ineficácia.

**Eliminatórios:** nenhum dos dez disparou no novo AFTER. **Score:** 19/20; dimensões e aplicação individual no JSON.

```json
{
  "t": "Fluxo de Dialisato — Ganho de Adequação e Custo Hídrico",
  "qid": "fe3a5b91",
  "q": "Paciente em hemodiálise convencional já atinge a meta de dose entregue com fluxo do dialisato (Qd) de 500 mL/min. Como interpretar a elevação rotineira do Qd para 800 mL/min?",
  "refs": [
    "dialysate_flow_meta_2024"
  ],
  "opts": [
    "Pode elevar índices ureicos, sem benefício clínico demonstrado e com maior consumo de dialisato.",
    "Melhora os índices ureicos e, por isso, é a opção preferida mesmo quando a dose entregue já é adequada.",
    "O fluxo 60% maior implica aumento proporcional de 60% na depuração de ureia e na dose entregue.",
    "Produz ganho pequeno de índices ureicos, o que demonstra que seu uso é clinicamente ineficaz."
  ],
  "ans": 0,
  "exp": "A metanálise encontrou ganho modesto de Kt/V e da redução percentual da ureia ao elevar o fluxo de 500 para 800 mL/min, mas faltavam resultados clínicos importantes e havia risco de viés. O ganho de depuração não é proporcional ao aumento de 60% do fluxo. Em quatro horas, o aumento consome 72 L adicionais de dialisato; isso não representa toda a água do sistema. O fluxo do dialisato é um componente da prescrição individualizada, junto de tempo, fluxo de sangue, acesso e necessidades do paciente. A estratégia pode ser útil, sem benefício clínico universal demonstrado ou prova de ineficácia.",
  "diff": "medium",
  "cat": "dialise"
}
```

**Fontes:** [Q](https://pmc.ncbi.nlm.nih.gov/articles/PMC11229034/) — OPENED_FULL_TEXT_PRIMARY_PMC_XML; Corpo integral de PMC aberto; discussão efetivamente lida. Qd pode integrar a individualização, inclusive diante de limites ao tempo; o item não proíbe a estratégia nem a trata como compensação universal.

**Hash canônico:** AFTER `sha256:dd7f3582f5fc3d978db8299574d70228e71cfdf0c88ea1c2f5c8cf03afbe3e69`; pacote `sha256:000ed0d552fb8803b869840aea1f0945e7d9d73387d5b6b2d638df17bb50af20`.

**Comprimento:** 147/87/80/90 → 96/103/95/93; razão 1.633 → 0.932.

## Card corrigido integral

```json
{
  "label": "HEMODIAFE — CVVHDF versus Hemodiálise Intermitente",
  "url": "https://pubmed.ncbi.nlm.nih.gov/16876666/",
  "journal": "Lancet. 2006;368(9533):379-385",
  "ano": 2006,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "Ensaio multicêntrico francês sobre modalidade dialítica na LRA com disfunção de múltiplos órgãos",
  "icon": "🔬",
  "resumo": "Ensaio multicêntrico randomizado em 360 pacientes críticos com lesão renal aguda e disfunção de múltiplos órgãos. Comparou hemodiálise intermitente protocolada com hemodiafiltração venovenosa contínua; não estudou diálise estendida. A sobrevida em 60 dias foi 32% com modalidade intermitente e 33% com contínua, sem diferença estatisticamente demonstrada.",
  "conclusao": "Quando ambas são aplicadas com protocolos de tolerância e controle metabólico, CVVHDF e hemodiálise intermitente não demonstraram diferença de sobrevida no HEMODIAFE.",
  "curiosidade": "Os dois grupos usaram a mesma membrana polimérica e tampão com bicarbonato; o ensaio forneceu orientações para tolerância hemodinâmica e remoção de solutos."
}
```

**SHA256 dos BYTES do JSON via crypto.update(Buffer):** `53eaa9e50193fa0e5f565ade280222b9efd4ae8a3a16eeffc8775fd1cfb9539f`.
