# Contrato de saída da skill criar-nefroquest

## 1. Questão única para copiar

Usar exatamente esta ordem:

# OP e classificação

**Objetivo Pedagógico (OP):** frase com verbo testável — "ser capaz de [verbo] [conceito] em [cenário], evitando [erro]".

**Competência primária:** diagnóstico | conduta | interpretação | estratificação | mecanismo.

**Nível cognitivo (Bloom/Miller):** Lembrar | Compreender | Aplicar | Analisar | Avaliar — Sabe | Sabe como | Mostra.

**Dificuldade intrínseca:** Básica | Intermediária | Avançada → `easy` | `medium` | `hard`.

# Base científica

**Evidência:** VERIFICADA | PARCIALMENTE VERIFICADA | NÃO VERIFICADA

Fonte principal e afirmação que sustenta o gabarito, em poucas linhas.

# Racional pedagógico

Competência testada e erros clínicos representados pelos distratores.

# Advogado do Recurso (teste leve)

Argumento(s) plausível(is) de anulação — ou "Nenhum argumento plausível de anulação." Se houver argumento plausível, corrigir antes de entregar a questão como pronta.

# Texto para o Antigravity

**ADICIONAR A QUESTÃO ABAIXO:**

## Título

Título curto, específico e sem entregar a resposta.

## Pergunta

Enunciado integral.

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

Conclusão, justificativa, análise útil dos distratores, implicação prática e ressalva de evidência.

## Categoria

Categoria real ou sugerida.

## Dificuldade

`easy` | `medium` | `hard` (mesmo valor de "Dificuldade intrínseca" em OP e classificação).

## Referências sugeridas

Um a quatro cards completos e verificados.

## Observação de implementação

Instrução objetiva sobre schema, ID, referência, categoria, versão e validação. Não inventar campo ou arquivo.

# Pendências de verificação

Somente quando existirem.

## 2. Questão baseada em estudo

Acrescentar em Base científica:

- PICO;
- desfecho primário;
- resultado decisivo;
- principal limitação;
- como isso se converte em pergunta clínica.

## 3. Lote

Começar com:

| # | Tema | OP | Bloom/Miller | Dificuldade (`easy`/`medium`/`hard`) | Formato | Fonte principal | Gabarito |
|---|---|---|---|---|---|---|---|

Depois entregar cada questão completa. Evitar repetir letra correta em padrão previsível.

## 4. Implementação direta

Quando a edição foi realizada, usar:

# Questão criada

Título, OP, categoria e dificuldade (`easy`/`medium`/`hard`).

# Arquivos alterados

Lista objetiva.

# Evidência utilizada

Fontes decisivas e limites.

# Validação

Comandos e resultados realmente executados.

# Diff científico

Resumo do que foi adicionado e por quê.

# Pendências

Somente problemas reais.

Não repetir “Texto para o Antigravity” após implementação concluída, salvo pedido expresso.

## 5. Card do NefroQuest

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

Usar `snake_case`, minúsculo, estável e descritivo. Pesquisar duplicidade no repositório.

### Taxonomia

| Fonte | badge | badgeColor | icon |
|---|---|---|---|
| Diretriz | `GUIDELINE` | `#6366f1` | `📋` |
| Ensaio clínico randomizado | `RCT` | `#10b981` | `🔬` |
| Metanálise | `META` | `#0ea5e9` | `🔬` |
| Revisão | `REVIEW` | `#8b5cf6` | `🔬` |
| Coorte | `COHORT` | `#f59e0b` | `🔬` |
| Livro-texto | `TEXTBOOK` | `#64748b` | `📚` |

Revisão sistemática sem síntese quantitativa usa REVIEW, não META.

### Campos

**label:** título curto e reconhecível, com acrônimo/ano quando útil.

**url:** link oficial confirmado.

**journal:** periódico ou organização real.

**ano:** inteiro.

**tipo:** desenho real da fonte.

**impacto:** frase curta e específica, preferencialmente até 90 caracteres.

**resumo:** factual e não genérico.

**conclusao:** implicação correta para a questão, sem extrapolação.

**curiosidade:** dado adicional útil e verificável; usar string vazia quando não houver.

## 6. Conteúdo do resumo

### Guideline

Organização/ano, população, recomendação, força/certeza ou practice point e ressalva.

### RCT

Nome/ano, n, população, intervenção/comparador, desfecho primário, resultado com IC95% e P quando disponíveis e limitação.

### Metanálise

Número de estudos/participantes, população, intervenção, desfecho, estimativa combinada, heterogeneidade e limitação.

### Coorte

Desenho, n, população, exposição, desfecho, associação ajustada e limite causal.

### Revisão

Escopo, método, síntese útil e razão para uso.

## 7. Estilo do resumo do card

Preferir o padrão compacto do NefroQuest:

`ACRÔNIMO ano (título): n=..., população..., intervenção versus comparador..., desfecho primário..., resultado... (HR/RR/OR ..., IC95% ...; P=...). Limitação: ...`

Não preencher campos ausentes nem criar precisão falsa.
