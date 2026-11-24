# Veredito

**aprovada**. Papel: AUTORAL. Confiança: moderada.
Evidência: VERIFICADA. Pendência: NENHUMA. Autorização de publicação: LIBERADA, derivada; implementação exige revisão independente.

# OP declarado e classificação

Identificar o mecanismo farmacológico duplo de sacubitril/valsartana.
Competência: Explicar toxicidade metabólica de fármaco ou aplicar segurança da farmacoterapia cardiorrenal.
Antes: Compreender/Sabe; intrínseca easy; campo diff=medium.
Depois: Compreender/Sabe; intrínseca easy; diff=easy.

# Justificativa

Objetivo e conceito correto preservados; a forma e os vínculos precisam reparo antes de nova publicação.

# Problemas encontrados

1. MAIOR — Pergunta agregava mecanismo e interação; três combinações de erros pouco plausíveis entregavam a correta.
2. MAIOR — Fonte de análise renal HFpEF não é a referência adequada para esse objetivo farmacológico.

# Advogado do Recurso

Original: nenhum argumento plausível de anulação.
Nenhum argumento plausível de anulação identificado na avaliação autoral.
# Eliminatórios

Original: nenhum eliminatório disparado.
Proposta: os10 critérios foram checados; nenhum disparado.

# NQ Editorial Score

Original: 14/20.
alinhamento ao OP: 2/2; validade de conteúdo: 2/2; validade de construto: 2/2; enunciado: 2/2; alternativas: 2/2; distratores: 1/2; explicação: 2/2; referências: 2/2; ausência de pistas formais: 2/2; valor pedagógico: 2/2
Total: 19/20.
19/20. Um OP farmacológico, sem carga artificial de uma segunda associação para preservar medium. A interação permanece na explicação, não como segundo gabarito.
# Decisão (árvore §19)

OP clinicamente útil; gabarito único sustentado pelas fontes. Versão exata aprovada apenas na checagem autoral. Ciclo pretendido: publicado após revisão independente.

# Patch editorial sugerido

SUBSTITUIR A QUESTÃO POR:

## Pergunta

Qual combinação descreve o mecanismo farmacológico de sacubitril/valsartana?

## Alternativas

**A**  
Inibição da neprilisina e bloqueio do receptor AT1 da angiotensina II.

**B**  
Inibição da enzima conversora e bloqueio do receptor AT1 da angiotensina II.

**C**  
Inibição da neprilisina e inibição da enzima conversora de angiotensina.

**D**  
Inibição direta da renina e antagonismo do receptor mineralocorticoide.

## Resposta correta

A — Inibição da neprilisina e bloqueio do receptor AT1 da angiotensina II.

## Explicação

Sacubitril é convertido em um metabólito ativo que inibe a neprilisina, aumentando a disponibilidade de peptídeos como os natriuréticos. Valsartana bloqueia o receptor AT1 da angiotensina II. A formulação não contém inibidor da enzima conversora nem inibidor direto da renina. Associá-la a inibidor da enzima conversora é contraindicado pelo risco de angioedema; por isso, a troca exige intervalo mínimo de36 horas.

## Referências sugeridas

```javascript
sacubitril_valsartan_label_fda_2021: {
  "label": "Entresto — Bula Oficial no DailyMed (atualização 2026)",
  "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?lang=en&setid=000dc81d-ab91-450c-8eae-8eb74e72296f",
  "journal": "Novartis Pharmaceuticals Corporation / DailyMed; página atualizada em 06/07/2026; revisão da bula 04/2024",
  "ano": 2026,
  "tipo": "Bula",
  "badge": "BULA",
  "badgeColor": "#64748b",
  "impacto": "Transição segura do inibidor da enzima conversora de angiotensina, ajuste renal e monitorização.",
  "icon": "📋",
  "resumo": "Sacubitril/valsartana é contraindicado junto a inibidor da enzima conversora de angiotensina (IECA), pelo risco de angioedema; a troca em qualquer direção exige pelo menos 36 horas de intervalo. Em adultos com taxa de filtração glomerular estimada abaixo de 30 mL/min/1,73 m², a dose inicial é metade da usual: 24/26 mg por via oral, duas vezes ao dia. Monitorar pressão arterial, creatinina e potássio; reduzir dose ou interromper conforme hipotensão, deterioração renal clinicamente significativa ou hipercalemia.",
  "conclusao": "Função renal reduzida exige dose e vigilância apropriadas. Não associar a IECA nem a outro bloqueador do receptor da angiotensina, pois a formulação já contém valsartana.",
  "curiosidade": "Sacubitril é um pró-fármaco: seu metabólito ativo inibe a neprilisina. A valsartana bloqueia o receptor AT1 da angiotensina II."
}
```

## Observação de implementação

OP primário, competência e conceito correto continuam reconhecíveis; manter qid e histórico, sem transferência nem reset de FSRS.
Nenhum arquivo do repositório alterado. Originais/propostas e hashes canônicos estão no JSON do lote. ready=false até revisão independente.

## Verificação bibliográfica

- [label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?lang=en&setid=000dc81d-ab91-450c-8eae-8eb74e72296f): Informação oficial de prescrição integral do fabricante Novartis no DailyMed. Página atualizada em 06/07/2026; texto informa Revised 04/2024. Ambos os marcos são distinguidos no card. Corpo HTML baixado e lido.. §2.1 e §4: contraindicado com inibidor da enzima conversora de angiotensina; intervalo de36 horas ao trocar em qualquer direção.; §2.2/2.7 e §3: dose inicial usual adulta49/51mg por via oral duas vezes ao dia; insuficiência renal grave TFGe<30 requer metade, apresentação24/26mg; não é contraindicação absoluta por TFGe isolada.; §5.3/5.4/5.5: corrigir fatores de hipotensão, monitorar creatinina e potássio, tratar hipercalemia; reduzir dose ou interromper quando necessário.; §7.1 e §12.1: sacubitril via metabólito LBQ657 inibe neprilisina; valsartana bloqueia receptor AT1. Contraindicação com IECA pelo risco de angioedema; evitar outro bloqueador do receptor por já conter valsartana.. Atualização regulatória do mesmo produto no ID legado, adjudicada pelo root; não é troca por outro ensaio ou diretriz. Bula exige individualização e não fornece um limiar universal de suspensão definitiva em todo paciente com potássio5,8.
