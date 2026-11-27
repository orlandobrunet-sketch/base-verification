# Sedimento — três candidatos e comparação de redundância

Revisão formal autoral, não independente. Fonte EFLM original aberta integralmente pela web; não foi inventado hash para download local vazio. Nenhuma mudança em produção.

## c11c9a7d

```json
{
  "t": "Cilindros Hemáticos — Local de Formação",
  "qid": "c11c9a7d",
  "q": "Para interpretar a origem de uma hematúria, é importante distinguir o local do sangramento e o local de formação do cilindro hemático. Após as hemácias entrarem no néfron, onde se forma esse cilindro?",
  "refs": [
    "eflm_urinalysis_guideline_2024"
  ],
  "opts": [
    "No néfron distal e ducto coletor, com incorporação das hemácias à matriz de uromodulina.",
    "No espaço de Bowman, por coagulação das hemácias em fibrina antes de atingir os túbulos.",
    "No túbulo proximal, pela agregação das hemácias em uma matriz produzida apenas por albumina.",
    "Na pelve renal, onde o muco do urotélio aprisiona hemácias e molda o cilindro verdadeiro."
  ],
  "ans": 0,
  "exp": "Cilindros verdadeiros se formam em túbulos distais e ductos coletores por agregação e transformação em gel da uromodulina, incorporando partículas presentes no lúmen. A matriz é produzida por células da alça ascendente de Henle; sua produção não deve ser confundida com o local predominante de formação do cilindro. Um cilindro hemático exige hemácias no sistema tubular e favorece origem renal do sangramento. A forma cilíndrica não é um coágulo produzido em Bowman ou moldado pelo urotélio da pelve.",
  "diff": "easy",
  "cat": "glomerular"
}
```

Recurso: O comando distingue produção da matriz, origem da hemácia e local de formação. A descrição não afirma que toda hemácia seja glomerular nem que qualquer agregado com hemácias seja cilindro verdadeiro. A utilidade incremental frente aaeb58919 ainda deve ser julgada independentemente; se a anatomia já estiver suficientemente coberta, consolidar é válido.

## aeb58919

```json
{
  "t": "Cilindros Hemáticos — Origem da Lesão",
  "qid": "aeb58919",
  "q": "Paciente com hematúria tem cilindros hemáticos verdadeiros identificados no sedimento. Qual conclusão é mais adequada?",
  "refs": [
    "eflm_urinalysis_guideline_2024"
  ],
  "opts": [
    "O sangramento é intrarrenal; o cilindro não determina sozinho a etiologia da lesão.",
    "A origem é exclusivamente glomerular, permitindo definir a causa sem outros dados.",
    "A origem é vesical, pois hemácias livres se transformam em cilindros quando ficam na bexiga.",
    "O sangramento ocorreu necessariamente no local distal em que a matriz do cilindro se formou."
  ],
  "ans": 0,
  "exp": "Hemácias incorporadas a um cilindro tubular indicam sangramento do parênquima renal. A formação da matriz ocorre no néfron distal, mas isso não demonstra que o ponto de sangramento também seja distal. O achado não determina sozinho uma etiologia glomerular específica e precisa ser integrado aos demais elementos do sedimento, à função renal e ao contexto. Hematúria isolada de bexiga ou ureter não produz cilindros tubulares verdadeiros.",
  "diff": "medium",
  "cat": "glomerular"
}
```

Recurso: A identificação de cilindro verdadeiro é fornecida; não se pede distinguir artefato sem imagem. O dado permite uma inferência anatômica renal, não uma doença específica. A correta conserva esse limite e evita ensinar que todo cilindro hemático prove glomerulonefrite.

## 022e7562

```json
{
  "t": "Síndrome Nefrótica — Lipidúria",
  "qid": "022e7562",
  "q": "No sedimento urinário de paciente com síndrome nefrótica, qual achado corresponde à lipidúria?",
  "refs": [
    "eflm_urinalysis_guideline_2024"
  ],
  "opts": [
    "Corpos ovais gordurosos e cilindros contendo gotículas de lipídios.",
    "Cilindros com hemácias e células vermelhas de contornos dismórficos.",
    "Cilindros com leucócitos e agrupamentos de células inflamatórias.",
    "Cilindros granulares pigmentados por hemoglobina ou mioglobina."
  ],
  "ans": 0,
  "exp": "Na proteinúria intensa, lipoproteínas podem atravessar a barreira glomerular e aparecer na urina como gotículas, corpos ovais gordurosos e cilindros gordurosos. As células carregadas de lipídios podem ser epiteliais tubulares ou macrófagos. A luz polarizada pode revelar o aspecto de cruz de Malta. Hemácias, leucócitos e pigmentos heme descrevem outros componentes do sedimento e não correspondem, por si, à lipidúria.",
  "diff": "easy",
  "cat": "glomerular"
}
```

Recurso: O caso já tem síndrome nefrótica, e a tarefa é reconhecer o tipo de sedimento, não adivinhar a causa da síndrome. A resposta não exige cruz de Malta em todo lipídio ou toda amostra. Os distratores são achados urinários reais, em vez de combinações artificiais de cristais e cilindros.

## Fonte específica —12campos

```json
{
  "label": "EFLM — Diretriz Europeia de Urinálise 2023 (publicada em 2024)",
  "url": "https://www.degruyterbrill.com/document/doi/10.1515/cclm-2024-0070/pdf",
  "journal": "Clin Chem Lab Med. 2024;62(9):1653–1786. DOI:10.1515/cclm-2024-0070",
  "ano": 2024,
  "tipo": "Diretriz",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Padroniza coleta, análise e interpretação de partículas urinárias, incluindo cilindros e lipidúria.",
  "icon": "📋",
  "resumo": "Diretriz da European Federation of Clinical Chemistry and Laboratory Medicine sobre urinálise e cultura. Cilindros se formam em túbulos distais e ductos coletores, com matriz de uromodulina que pode incorporar células e outras partículas. Cilindros com hemácias indicam sangramento do parênquima renal. Na proteinúria intensa, lipídios aparecem como gotículas, células carregadas de gordura e cilindros gordurosos; a luz polarizada pode revelar cruzes de Malta. A análise das partículas complementa o contexto clínico e não estabelece sozinha a etiologia.",
  "conclusao": "Distinguir células livres, cilindros verdadeiros, lipídios e artefatos contribui para interpretar a origem renal e o padrão do sedimento. Os achados precisam ser integrados à avaliação clínica e laboratorial.",
  "curiosidade": "O título traz 2023, mas a publicação bibliográfica é de 2024. A diretriz separa níveis básico e avançado de identificação de partículas, conforme a necessidade clínica."
}
```

## Possível consolidação

c11 explica a montagem e aeb aplica o significado anatômico; a decisão de manter variação útil ou consolidar em aeb depende da revisão independente pelas quatro dimensões. Não há aposentadoria aplicada.

SHA256 dos BYTES JSON `ef7232043c110d5b39bafeb190e1459b09d064390ddaa8b0e3eee642c0a61153`.
