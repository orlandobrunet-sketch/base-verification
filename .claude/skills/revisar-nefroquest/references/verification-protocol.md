# Protocolo VERIFICAÇÃO NECESSÁRIA e matriz de status de evidência

> Componente **operacional** da skill `revisar-nefroquest` (o *como verificar*), skill-side por ser processo. A regra editorial correspondente (o *quê*) vive em `docs/editorial/` (Handbook §13, §17; Model §8). Invocado no passo 3 do fluxo de revisão.

## 1. Bloqueio de evidência

Não finalize como fato verificável aquilo que não foi confirmado.

**Quando houver acesso à fonte:**

1. Pesquise a diretriz ou artigo primário.
2. Abra a fonte.
3. Confirme população, intervenção, comparador, desfecho, resultado e data.
4. Confirme que o URL leva à fonte citada.
5. Compare com a atualização mais recente quando houver versões concorrentes.

**Quando NÃO houver acesso à fonte necessária:**

- Não invente; não estime números; não gere URL, DOI ou card completo.
- Marque **VERIFICAÇÃO NECESSÁRIA**.
- Reescreva sem o detalhe não confirmado quando isso preservar a validade.
- Explique objetivamente o que falta verificar e por que bloqueia (ou não) a publicação.

## 2. Matriz de status de evidência

- **VERIFICADA** — todas as afirmações decisivas e referências foram abertas e conferidas.
- **PARCIALMENTE VERIFICADA** — o gabarito está sustentado, mas algum detalhe secundário, número ou card ainda requer confirmação.
- **NÃO VERIFICADA** — falta acesso à fonte decisiva ou há conflito não resolvido. Não apresentar a versão como pronta para produção.

O status escolhido entra no **campo de status de evidência do contrato de saída**.

## 3. Situações que bloqueiam publicação

Bloqueie quando houver: dose/unidade não confirmada; mais de uma resposta correta; guideline citado que não contém a recomendação; URL não confirmado; número de estudo divergente; extrapolação para população excluída; recomendação potencialmente perigosa; conflito protocolo local × diretriz sem explicitação; referência inexistente ou não localizada.

> Vários desses itens são **critérios eliminatórios** no Handbook §17 (ex.: “referência não sustenta o gabarito”, “desatualização relevante”, “mais de uma resposta defensável”, “conduta insegura”). Ao bloquear, roteie na **árvore de decisão** (Handbook §19).

## 4. Identificação bibliográfica e canal open-access

- **Registre PubMed/PMID/DOI quando disponíveis.** Eles fortalecem a rastreabilidade, mas **não são obrigatórios** quando a fonte adequada é uma **diretriz em PDF**, um **guideline institucional de sociedade** ou uma **URL oficial** — nesses casos, registre a identificação disponível (organização, título, ano, URL oficial) sem exigir DOI.
- Nunca fabrique PMID, DOI ou URL para “completar” a identificação (ver §1).
- **Nota operacional:** diretrizes (kdigo.org PDF, kidney-international, medscape) costumam bloquear WebFetch (403/402). Use o canal open-access de texto integral em PMC (PubMed) para confirmar população/intervenção/desfecho/resultado/data; ao usá-lo, registre PubMed/PMID/DOI quando disponíveis.
