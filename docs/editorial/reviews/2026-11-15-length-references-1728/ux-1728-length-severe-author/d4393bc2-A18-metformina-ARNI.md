# Veredito

**aprovada**. Papel: AUTORAL. Confiança: moderada.
Evidência: VERIFICADA. Pendência: NENHUMA. Autorização de publicação: LIBERADA, derivada; implementação exige revisão independente.

# OP declarado e classificação

Aplicar intervalo de segurança entre lisinopril e sacubitril/valsartana durante transição em paciente com função renal reduzida.
Competência: Explicar toxicidade metabólica de fármaco ou aplicar segurança da farmacoterapia cardiorrenal.
Antes: Aplicar/Sabe como; intrínseca medium; campo diff=hard.
Depois: Aplicar/Sabe como; intrínseca medium; diff=medium.

# Justificativa

Objetivo e conceito correto preservados; a forma e os vínculos precisam reparo antes de nova publicação.

# Problemas encontrados

1. MAIOR — Corretaintegra todasascondutas, enquanto os distratores negam segurança explicitamente.
2. MAIOR — Referência HFpEF misturada com outro ensaio não sustenta segurança na função renal abaixo de30; bula precisa versão oficial identificada.

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
19/20. Segurança da transição preservada; os demais cuidados foram explicitados como condições do caso para avaliar uma decisão principal, sem cortar qualificadores de segurança.
# Decisão (árvore §19)

OP clinicamente útil; gabarito único sustentado pelas fontes. Versão exata aprovada apenas na checagem autoral. Ciclo pretendido: publicado após revisão independente.

# Patch editorial sugerido

SUBSTITUIR A QUESTÃO POR:

## Pergunta

Adulto com insuficiência cardíaca e fração de ejeção reduzida usa lisinopril e tem taxa de filtração glomerular estimada de 28 mL/min/1,73 m². Foi indicada a troca por sacubitril/valsartana, com dose inicial reduzida e acompanhamento da pressão, creatinina e potássio. Como realizar a transição?

## Alternativas

**A**  
Suspender lisinopril e aguardar pelo menos 36 horas antes da primeira dose.

**B**  
Suspender lisinopril e iniciar sacubitril/valsartana na próxima tomada, após 12 horas.

**C**  
Suspender lisinopril e aguardar 24 horas antes da primeira dose.

**D**  
Reduzir lisinopril gradualmente, sobrepondo os dois fármacos no primeiro dia.

## Resposta correta

A — Suspender lisinopril e aguardar pelo menos 36 horas antes da primeira dose.

## Explicação

A associação com inibidor da enzima conversora de angiotensina é contraindicada pelo risco de angioedema. A bula exige pelo menos 36 horas entre a última dose de lisinopril e o início de sacubitril/valsartana; a regra também vale na troca inversa. Função renal abaixo de 30 mL/min/1,73 m² exige metade da dose inicial adulta usual, com pressão, função renal e potássio acompanhados. Essa redução de função renal, isoladamente, não torna o tratamento absolutamente contraindicado.

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
