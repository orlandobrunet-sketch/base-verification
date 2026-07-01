# Contrato obrigatório de saída

## 1. Questão isolada — revisão sem edição direta

Use exatamente esta ordem:

# Veredito

**aprovada | aprovada com pequenos ajustes | revisão maior | reprovada | fundir | redirecionar | aposentar**

*(Handbook §19 — um dos 7 vereditos como veredito principal.)*

**Equivalente legado (auxiliar):** MANTER | REESCREVER | DELETAR — campo auxiliar de continuidade, **não** o veredito principal. Mapeamento: MANTER ≈ aprovada; REESCREVER ≈ aprovada com pequenos ajustes / revisão maior; DELETAR ≈ reprovada / aposentar. (fundir e redirecionar não têm equivalente legado.)

**Confiança:** alta | moderada | baixa

**Evidência:** VERIFICADA | PARCIALMENTE VERIFICADA | NÃO VERIFICADA

# OP declarado e classificação

Descreva, em prosa, o Objetivo Pedagógico que a questão mede (sem pressupor `loid` físico). Informe competência primária, nível Bloom/Miller e dificuldade intrínseca.

# Justificativa

Explique em poucas linhas por que o item recebeu esse veredito. Priorize validade científica, unicidade do gabarito e valor clínico.

# Problemas encontrados

Numere apenas problemas reais e classifique cada um:

1. **CRÍTICO — ...**
2. **MAIOR — ...**
3. **MENOR — ...**

Se não houver problemas substantivos, escreva: “Nenhum problema substantivo identificado.”

# Advogado do Recurso

Liste os argumentos plausíveis de anulação (Handbook §16) — ou escreva: “Nenhum argumento plausível de anulação.” Se houver argumento plausível, a questão **não pode ser aprovada sem correção**.

# Eliminatórios

Liste os critérios de reprovação automática disparados (Handbook §17) — ou “Nenhum eliminatório disparado.” Qualquer eliminatório **anula o NQ Editorial Score**.

# NQ Editorial Score

Se nenhum eliminatório disparou: pontue as 10 dimensões (0–2) e informe o total (0–20) e a banda (Handbook §18). Se houver eliminatório: escreva “Score anulado por eliminatório.”

# Decisão (árvore §19)

Registre o caminho na árvore de decisão que levou ao veredito e o status de ciclo de vida resultante (publicado / em_revisão / em_reparo / aposentado).

# Patch editorial sugerido

Use uma destas chamadas, conforme o veredito:

**APLICAR APENAS OS AJUSTES ABAIXO:** *(aprovada com pequenos ajustes)*

ou

**SUBSTITUIR A QUESTÃO POR:** *(revisão maior / reescrita)*

ou

**REPROVAR / APOSENTAR A QUESTÃO:** *(reprovada / aposentar)*

ou

**FUNDIR COM A QUESTÃO `<qid>`:** *(fundir — manter a melhor)*

ou

**REDIRECIONAR PARA O OP `<descrição do objetivo>`:** *(redirecionar)*

Quando houver questão pronta a entregar, forneça:

## Pergunta

Texto integral do enunciado, sem depender de contexto externo.

## Alternativas

**A**  
Texto

**B**  
Texto

**C**  
Texto

**D**  
Texto

## Resposta correta

**X — texto integral da alternativa correta**

## Explicação

Conclusão primeiro. Em seguida, raciocínio clínico, análise útil dos distratores, implicação prática e ressalva de evidência.

## Referências sugeridas

Inclua de um a quatro cards completos e verificados. Se nenhuma referência estiver verificada, escreva: “Não gerar cards até concluir a verificação bibliográfica.”

## Observação de implementação

Diga exatamente o que preservar, substituir, remover, adicionar ou conferir no código. Não invente nome de arquivo, ID ou campo sem inspecionar o repositório.

# Pendências de verificação

Inclua somente quando existirem. Liste a afirmação, a fonte necessária e por que ela bloqueia ou não bloqueia publicação.

## 2. Criação de questão inédita

Antes do Patch editorial sugerido, acrescente:

# Objetivo de aprendizagem

Uma frase com a decisão ou competência testada (o OP).

# Nível

Básico | intermediário | avançado (dificuldade intrínseca) + nível Bloom/Miller.

# Racional pedagógico

Explique por que a questão exige raciocínio útil e quais erros clínicos os distratores representam.

## 3. Implementação direta no repositório

Não entregue o “Patch editorial sugerido” quando o usuário pediu edição direta e a alteração foi realizada.

Use:

# Veredito científico

# Alterações realizadas

Liste arquivos e mudanças relevantes.

# Validação

Informe testes, lint, typecheck ou checagens executadas e seus resultados.

# Decisões de evidência

Resuma fontes e mudanças de conteúdo.

# Pendências

Somente problemas reais não resolvidos.

Nunca afirme que teste passou se não foi executado.

## 4. Revisão em lote

Comece com a tabela-resumo (a coluna **Legado** é auxiliar, não o veredito principal):

| Questão | OP | Veredito | Score | Eliminatório | Legado | Ação |
|---|---|---|---|---|---|---|

- **Veredito** — um dos 7 (Handbook §19).
- **Score** — total 0–20 ou “anulado”.
- **Eliminatório** — sim/não (Handbook §17).
- **Legado** — MANTER/REESCREVER/DELETAR (compatibilidade com o fluxo antigo; opcional).

Depois forneça bloco completo apenas para vereditos que exijam mudança (pequenos ajustes / revisão maior / reprovada / fundir / redirecionar / aposentar), salvo pedido de revisão integral. Questões **aprovadas** podem receber justificativa abreviada.

## 5. Schema do card do NefroQuest

Entregue como objeto JavaScript/TypeScript copiável:

```javascript
id_sugerido: {
  label: "",
  url: "",
  journal: "",
  ano: 2026,
  tipo: "",
  badge: "",
  badgeColor: "",
  impacto: "",
  icon: "",
  resumo: "",
  conclusao: "",
  curiosidade: ""
}
```

### ID

Use `snake_case`, minúsculo, estável e descritivo.

Preferência: `estudo_ano`, `organizacao_tema_ano` ou `primeiro_autor_tema_ano`.

Não reutilize ID existente. Quando houver acesso ao repositório, pesquise antes.

### Campos

**label** — título curto e reconhecível. Inclua acrônimo e ano quando úteis.

**url** — link oficial confirmado. Nunca inventar.

**journal** — periódico ou organização publicadora real.

**ano** — número inteiro.

**tipo** — “Diretriz”, “Ensaio clínico randomizado”, “Metanálise”, “Revisão sistemática”, “Coorte”, “Revisão” ou “Livro-texto”.

**badge** — usar somente a taxonomia abaixo.

**badgeColor** — usar a cor correspondente.

**impacto** — uma linha curta, específica e clinicamente relevante, idealmente até 90 caracteres.

**icon** — conforme taxonomia.

**resumo** — síntese factual e não genérica.

**conclusao** — implicação correta para a questão, sem extrapolação.

**curiosidade** — informação adicional útil e verificável; usar string vazia se não houver.

## 6. Taxonomia dos cards

| Fonte | badge | badgeColor | icon |
|---|---|---|---|
| Diretriz | `GUIDELINE` | `#6366f1` | `📋` |
| Ensaio clínico randomizado | `RCT` | `#10b981` | `🔬` |
| Metanálise/revisão sistemática quantitativa | `META` | `#0ea5e9` | `🔬` |
| Revisão | `REVIEW` | `#8b5cf6` | `🔬` |
| Coorte | `COHORT` | `#f59e0b` | `🔬` |
| Livro-texto | `TEXTBOOK` | `#64748b` | `📚` |

Não classifique guideline como REVIEW nem revisão sistemática sem metanálise como META; nesse caso use REVIEW e esclareça o desenho.

## 7. Conteúdo mínimo do resumo do card

### Diretriz

- organização e ano;
- população/escopo;
- recomendação que sustenta a questão;
- força/certeza ou practice point, quando disponível;
- ressalva essencial.

### RCT

- nome/acrônimo e ano;
- n randomizado;
- população;
- intervenção e comparador;
- desfecho primário;
- resultado numérico com IC95% e P, quando disponíveis;
- limitação relevante.

### Metanálise

- número de estudos e participantes, quando disponível;
- população e intervenção;
- desfecho;
- estimativa combinada e heterogeneidade, quando relevantes;
- certeza/limitação.

### Coorte

- desenho, n e população;
- exposição e desfecho;
- associação ajustada;
- limitação de causalidade/confundimento.

### Revisão

- escopo;
- tipo de revisão;
- síntese útil;
- por que foi necessária apesar da ausência de fonte superior.

## 8. Exemplo de card válido

Use apenas como estrutura; não reutilize os dados sem verificação:

```javascript
estudo_exemplo_2026: {
  label: "ESTUDO-EXEMPLO 2026",
  url: "URL OFICIAL CONFIRMADA",
  journal: "Periódico",
  ano: 2026,
  tipo: "Ensaio clínico randomizado",
  badge: "RCT",
  badgeColor: "#10b981",
  impacto: "Definiu a estratégia para a população estudada",
  icon: "🔬",
  resumo: "ESTUDO-EXEMPLO 2026: n=..., população..., intervenção... versus..., desfecho primário..., resultado... (HR/RR ..., IC95% ...; P=...). Limitação: ...",
  conclusao: "Na população estudada, ...; não extrapolar para ...",
  curiosidade: ""
}
```

## 9. Regras de formatação

- Não envolver toda a resposta em bloco de código.
- Usar bloco de código apenas para os objetos dos cards ou trechos de implementação.
- Não usar citações bibliográficas vagas como “KDIGO atual”.
- Não apresentar card incompleto como pronto.
- Não usar placeholders em versão declarada pronta para produção.
- Se houver placeholder por falta de verificação, rotular explicitamente como rascunho bloqueado.
