# Protocolo operacional de verificação de evidência

> Componente **operacional** da skill `criar-nefroquest` (o *como verificar*), skill-side por ser processo. A regra editorial correspondente (o *quê*) vive em `docs/editorial/` (Handbook §13, §17; Model §3.6, §8.1). Aplicado nas Etapas 3 e 12 do fluxo de criação (ver [SKILL.md](../SKILL.md)).

## 1. Registro de afirmações verificáveis

Antes de redigir o gabarito, liste internamente tudo que exige conferência na fonte aberta:

- dose e unidade;
- via e intervalo;
- ajuste por TFGe ou modalidade dialítica;
- ponto de corte ou critério diagnóstico;
- indicação/contraindicação;
- recomendação e força/certeza;
- efeito terapêutico (magnitude e desfecho);
- incidência ou prognóstico;
- n, HR, RR, OR, IC95% e P;
- nome, ano, periódico, DOI, PMID e URL.

Não finalizar a questão com lacuna decisiva não verificada.

## 2. Checklist de ensaio clínico randomizado (RCT)

Antes de usar um RCT como âncora do gabarito, confirmar:

- randomização;
- mascaramento;
- população e critérios de exclusão;
- intervenção e comparador;
- desfecho primário;
- tempo de seguimento;
- análise principal (intenção de tratar vs. per protocol);
- segurança;
- interrupção precoce;
- aplicabilidade ao cenário da questão.

Não usar desfecho secundário ou de subgrupo como se fosse o desfecho principal, sem declarar essa condição.

## 3. Checklist de metanálise / revisão sistemática

Confirmar: PICO, desenhos incluídos, heterogeneidade, risco de viés, consistência e certeza da evidência agregada.

Metanálise de estudos frágeis não se torna evidência forte apenas por agregar n.

## 4. Matriz de status de evidência

- **VERIFICADA** — todas as afirmações decisivas e referências foram abertas e conferidas.
- **PARCIALMENTE VERIFICADA** — o gabarito está sustentado, mas algum detalhe secundário, número ou card ainda requer confirmação.
- **NÃO VERIFICADA** — falta acesso à fonte decisiva ou há conflito não resolvido. Não apresentar a versão como pronta para produção.

O status escolhido entra no campo "Base científica" do contrato de saída ([output-contract.md](output-contract.md)).

## 4.1 Classificação obrigatória da pendência

Regra editorial canônica completa: Handbook §18.4. Resumo operacional para esta skill:

- Sempre que o status não for VERIFICADA, classifique a pendência como **NÃO DECISIVA** (detalhe secundário, não muda gabarito nem segurança) ou **DECISIVA** (pode mudar qual alternativa é a correta, a segurança ou a validade do item).
- **NENHUMA** só é valor válido quando o status for VERIFICADA. **NÃO DEVE** ser usado com PARCIALMENTE VERIFICADA nem com NÃO VERIFICADA — nesses dois casos, existe por definição algo pendente, e a classificação real (NÃO DECISIVA ou DECISIVA) é obrigatória.
- Não escreva "não aplicável" no campo de pendência — não é um valor do eixo (Handbook §18.4).

## 4.2 Autorização de publicação desta skill

Esta skill **NÃO** emite veredito editorial e **NUNCA** deriva autorização LIBERADA — essa competência é exclusiva de `revisar-nefroquest` (ver [../INTEGRACAO-COM-REVISOR.md](../INTEGRACAO-COM-REVISOR.md)). Todo item criado aqui sai com **Autorização de publicação: BLOQUEADA — motivo: aguardando revisão editorial formal pela revisar-nefroquest**, independentemente do status de evidência ou da natureza da pendência.

## 5. Regra de bloqueio de publicação

Bloquear a entrega como "pronta para copiar/implementar" quando houver:

- dose/unidade não confirmada;
- mais de uma resposta correta;
- guideline citado que não contém a recomendação;
- URL não confirmado;
- número de estudo divergente da fonte aberta;
- extrapolação para população excluída do estudo;
- recomendação potencialmente perigosa;
- protocolo local apresentado como regra universal;
- referência inexistente ou não localizada.

Quando bloquear: não inventar o dado; marcar **NÃO VERIFICADA**; reescrever sem o detalhe não confirmado quando isso preservar a validade da questão; registrar em "Pendências de verificação".

> Vários destes itens são também **critérios eliminatórios** de revisão (Handbook §17) — uma questão criada já bloqueada aqui não deve chegar a `revisar-nefroquest` como se estivesse pronta para publicação.
