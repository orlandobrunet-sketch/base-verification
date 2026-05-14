# NefroQuest — Padrões de Conteúdo Médico

## Princípio fundamental

Precisão científica é inegociável. O NefroQuest é usado por médicos, residentes e estudantes de medicina avançados. O público conhece a literatura — erros de conteúdo destroem credibilidade e podem influenciar decisões clínicas reais.

**Não inventar dados, doses, referências, valores de corte ou recomendações.**

---

## Autorização para alterar conteúdo médico

Questões, explicações e referências em `data/topics.js`, `data/articles.js` e `data/refs.js` **não podem ser alteradas** sem autorização explícita do responsável pelo conteúdo médico do projeto.

Se uma questão parecer incorreta: reportar, não corrigir unilateralmente. A revisão de conteúdo médico envolve validação por especialista.

---

## Fontes preferidas

Por ordem de preferência para referências nas questões:

1. **Guidelines internacionais:** KDIGO, KDOQI
2. **Guidelines nacionais:** SBN (Sociedade Brasileira de Nefrologia)
3. **Periódicos de alta evidência:** NEJM, Lancet, JAMA
4. **Periódicos específicos de nefrologia:** Kidney International, JASN (Journal of the American Society of Nephrology), CJASN (Clinical Journal of the American Society of Nephrology)
5. **Bulas e monografias:** usar quando o foco é posologia, interação ou contraindicação específica

---

## Formato de referência

### Referência curta (inline nas explicações)
```
(Autor et al., Periódico Ano)
```
Exemplos:
- `(Levey et al., AJKD 2011)`
- `(KDIGO 2012 AKI Guidelines)`
- `(SBN, Diretrizes 2017)`

### Estudo clínico com dados
Quando citar um RCT ou estudo observacional relevante, incluir:
- Nome do trial (quando houver)
- Ano de publicação
- N (tamanho amostral)
- População estudada
- Intervenção vs. controle
- Desfecho primário
- Efeito numérico com IC 95% e valor de P quando disponíveis

Exemplo:
> CREDENCE (2019, n=4.401, DM2 + DRC com albuminúria). Canagliflozin vs placebo. Desfecho: composto renal/CV. RR 0,70 (IC95% 0,59–0,82), p=0,00001.

---

## Estrutura de explicação de questão

Seguir esta ordem para maximizar aprendizado:

1. **Conclusão primeiro:** resposta direta e objetiva ao que era perguntado
2. **Raciocínio:** por que essa é a resposta correta — fisiopatologia ou evidência que sustenta
3. **Conduta clínica:** o que fazer na prática (quando aplicável)
4. **Referência:** fonte que embase

Não começar pela fisiopatologia teórica se o aluno está esperando saber se acertou. Conclusão primeiro.

---

## Ajuste renal

Sempre que a questão envolver medicamentos, doses ou condutas clínicas, considerar:
- **TFG** — ajuste de dose por estágio de DRC
- **Diálise** — hemodiálise vs. diálise peritoneal têm implicações diferentes
- **Transplante** — imunossupressão, infecções oportunistas, interações medicamentosas

Não omitir ajuste renal em questões onde ele é clinicamente relevante.

---

## Tom e linguagem

- O usuário é médico ou estudante de medicina avançado — não usar linguagem simplificada demais
- Não adicionar disclaimers genéricos do tipo "consulte seu médico" — são desnecessários e condescendentes para este público
- Usar terminologia clínica correta: TFG (não "filtração"), proteinúria (não "proteína na urina"), etc.
- Nomes de medicamentos: usar DCI (denominação comum internacional) como nome principal, com nome comercial entre parênteses quando útil
- Valores laboratoriais: usar unidades SI com conversão quando relevante (ex: creatinina em mg/dL e μmol/L)

---

## O que nunca fazer

- Inventar ou extrapolar dados de estudos que não existem
- Citar guidelines sem verificar a versão e o ano
- Generalizar recomendações de uma população para outra sem ressalva
- Alterar valores de corte estabelecidos (ex: TFG < 60 mL/min/1,73m² para definição de DRC)
- Confundir estadiamento de DRC (G1–G5) com estadiamento de proteinúria (A1–A3)
- Misturar recomendações de guidelines conflitantes sem explicitar o conflito
