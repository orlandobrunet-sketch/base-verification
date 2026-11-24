# OP e classificação

**OP:** Ser capaz de interpretar o alcance do composto renal e do HR fornecidos no FIDELIO-DKD ao comunicar benefício, evitando confusão com redução absoluta, efeito de componentes isolados ou benefício individual fixo.
**Competência primária:** interpretação.
**Bloom/Miller:** Analisar / Sabe como.
**Dificuldade intrínseca:** Intermediária → `medium`.

# Base científica

**Evidência:** VERIFICADA. **Pendência:** NENHUMA.
**Autorização de publicação:** BLOQUEADA — motivo: aguardando revisão editorial formal pela revisar-nefroquest.

[FIDELIO-DKD primário integral](https://diposit.ub.edu/bitstreams/d83771e6-4737-4c37-8e49-21196b8cf338/download). PICO, resultados, limites e locatores completos no JSON. O composto foi analisado por tempo até evento; seus componentes não recebem automaticamente o mesmo efeito.

# Racional pedagógico

Comunicar benefício sem equiparar resultado composto a prevenção comprovada de diálise/morte para cada indivíduo.
- A: Confundir redução relativa de hazard com pontos percentuais absolutos.
- C: Transportar HR do composto para componentes isolados.
- D: Interpretar porcentagem relativa como proporção de indivíduos que tiveram evento evitado.

# Advogado do Recurso (teste leve)

Nenhum argumento plausível de anulação identificado na autochecagem leve, depois de fornecer números e definir o composto.

# Texto para o Antigravity

**ADICIONAR A QUESTÃO ABAIXO APÓS REVISÃO FORMAL:**

## Título

FIDELIO-DKD — Interpretação do benefício renal

## Pergunta

Ao discutir nefroproteção, você revisa o FIDELIO-DKD: adultos com diabetes tipo 2 e doença renal crônica albuminúrica receberam finerenona ou placebo, além de bloqueio do sistema renina-angiotensina. O composto primário incluiu falência renal, queda sustentada ≥40% da taxa de filtração glomerular estimada ou morte renal. Em mediana de 2,6 anos, houve eventos em 17,8% versus 21,1%, com razão de riscos instantâneos (hazard ratio, HR) de 0,82 e intervalo de confiança de 95% de 0,73–0,93. Qual interpretação é adequada para comunicar esse benefício?

## Alternativas

**A**  
Representa queda de 18 pontos percentuais na chance de falência renal durante o seguimento.

**B**  
Favorece a finerenona no composto, sem demonstrar o mesmo benefício em cada componente.

**C**  
Demonstra redução de 18% da mortalidade renal isolada e da necessidade de diálise.

**D**  
Mostra que 18% dos pacientes tratados evitaram um evento renal graças à finerenona.

## Resposta correta

**B — Favorece a finerenona no composto, sem demonstrar o mesmo benefício em cada componente.**

## Explicação

A estimativa favorece a finerenona para o composto renal primário. O HR compara os riscos instantâneos até o primeiro evento durante o seguimento; não equivale a 18 pontos percentuais de redução absoluta nem à proporção de pessoas que individualmente se beneficiaram. O resultado global do composto também não demonstra, por si só, a mesma redução em falência renal, diálise e morte renal isoladamente: cada componente tem sua estimativa e incerteza. As proporções observadas diferem em 3,3 pontos percentuais, mas essa diferença bruta não deve ser confundida com estimativa de risco em um horizonte fixo. Na prática, comunique o benefício no desfecho estudado e seus limites, sem prometer proteção individual de magnitude fixa.

## Categoria

nefropatia_diabetica

## Dificuldade

`medium`

## Referências sugeridas

```javascript
fidelio_dkd: {
  "label": "FIDELIO-DKD — Finerenona e desfechos renais",
  "url": "https://pubmed.ncbi.nlm.nih.gov/33264825/",
  "journal": "N Engl J Med 2020;383(23):2219–2229",
  "ano": 2020,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "Menos eventos do composto renal com finerenona na doença renal diabética albuminúrica",
  "icon": "🔬",
  "resumo": "FIDELIO-DKD 2020: ensaio fase 3, duplo-cego, de finerenona 10–20 mg/dia versus placebo em adultos com diabetes tipo 2 e doença renal crônica albuminúrica, sob inibidor da enzima conversora de angiotensina ou bloqueador do receptor de angiotensina na maior dose tolerada. Foram 5.734 randomizados e 5.674 analisados após exclusões prospectivas por violações críticas de boas práticas. Em mediana de 2,6 anos, o composto primário de falência renal, queda sustentada ≥40% da taxa de filtração glomerular estimada ou morte renal ocorreu em 17,8% versus 21,1%: razão de riscos instantâneos (HR) 0,82; intervalo de confiança de 95%: 0,73–0,93; P=0,001. O composto cardiovascular secundário teve HR 0,86 (intervalo de confiança de 95%: 0,75–0,99; P=0,03). Interrupção por hipercalemia: 2,3% versus 0,9%. Limite: população selecionada e efeito do composto não equivalente a igual benefício em cada componente.",
  "conclusao": "A finerenona acrescentou proteção cardiorrenal na população estudada, com seleção e vigilância do potássio. Interpretar o desfecho composto, o tempo até evento e a incerteza antes de comunicar a magnitude do benefício.",
  "curiosidade": ""
}
```

## Observação de implementação

Novo qid 40c5f770, único no banco observado. Aposentar13e53210 somente após adjudicação independente. Não transferir FSRS, crédito ou domínio. Nenhum arquivo do repositório alterado.
