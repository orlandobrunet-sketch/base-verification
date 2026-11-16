# Veredito

**aprovada**. Papel: AUTORAL. Confiança: moderada.
Evidência: VERIFICADA. Pendência: NENHUMA. Autorização de publicação: LIBERADA, derivada; implementação exige revisão independente.

# OP declarado e classificação

Selecionar redução pressórica inicial controlada na encefalopatia hipertensiva, sem aplicar metas de outras emergências.
Competência: Conduta inicial e segurança.
Antes: Aplicar/Sabe como; intrínseca medium; campo diff=medium.
Depois: Aplicar/Sabe como; intrínseca medium; diff=medium.

# Justificativa

Objetivo e conceito correto preservados; a forma e os vínculos precisam reparo antes de nova publicação.

# Problemas encontrados

1. MAIOR — Correta reúne via, titulabilidade, intensidade e tempo, enquanto distratores são muito mais curtos e incluem condutas caricatas.
2. MENOR — Referência2025formula algoritmoempressãosistólica; explicitar a métrica evita atribuir slide dePASaPAM.

# Advogado do Recurso

Original: nenhum argumento plausível de anulação.
Defender normalização imediata pela gravidade ignora risco de hipoperfusão. Defender observação24h confundiria emergência com hipertensão grave sem lesão aguda. Os cenários com meta específica foram excluídos.
# Eliminatórios

Original: nenhum eliminatório disparado.
Proposta: os10 critérios foram checados; nenhum disparado.

# NQ Editorial Score

Original: 14/20.
alinhamento ao OP: 2/2; validade de conteúdo: 2/2; validade de construto: 2/2; enunciado: 2/2; alternativas: 2/2; distratores: 1/2; explicação: 2/2; referências: 2/2; ausência de pistas formais: 2/2; valor pedagógico: 2/2
Total: 19/20.
19/20: aplicação segura de meta fornecida por diretriz. Distratores representam excesso de intensidade ou atraso, embora dois sejam extremos e limitem discriminação. Não há número de estudo para memorizar.
# Decisão (árvore §19)

OP clinicamente útil; gabarito único sustentado pelas fontes. Versão exata aprovada apenas na checagem autoral. Ciclo pretendido: publicado após revisão independente.

# Patch editorial sugerido

SUBSTITUIR A QUESTÃO POR:

## Pergunta

Adulto com pressão de 230/140 mmHg e encefalopatia hipertensiva é tratado em unidade de terapia intensiva com anti-hipertensivo intravenoso titulável. Foram excluídos acidente vascular cerebral, dissecção de aorta, crise de feocromocitoma e gestação. Segundo o algoritmo da American Heart Association/American College of Cardiology de 2025, qual estratégia de redução da pressão sistólica é mais segura?

## Alternativas

**A**  
Reduzir pelo menos 50% da pressão sistólica durante a primeira hora de tratamento.

**B**  
Normalizar a pressão para menos de 120/80 mmHg ainda nos primeiros 30 minutos.

**C**  
Limitar a queda sistólica a até 25% na primeira hora e depois reduzir gradualmente.

**D**  
Adiar a redução pressórica por 24 horas, mesmo com encefalopatia persistente.

## Resposta correta

C — Limitar a queda sistólica a até 25% na primeira hora e depois reduzir gradualmente.

## Explicação

Na emergência hipertensiva com encefalopatia, a redução deve ser controlada e monitorada. O algoritmo oficial de 2025 orienta reduzir a pressão sistólica em até cerca de 25% na primeira hora; se estável, prosseguir para menos de 160/100–110 mmHg nas horas seguintes e continuar gradualmente nas próximas 24–48 horas. Normalização imediata ou queda de 50% pode causar hipoperfusão, enquanto aguardar sem tratar mantém a lesão de órgão-alvo. Esta é uma meta para o contexto descrito: eventos cerebrovasculares específicos, dissecção, gestação e outras emergências exigem protocolos próprios.

## Referências sugeridas

```javascript
aha_acc_hypertension_2025: {
  "label": "AHA/ACC — High Blood Pressure Guideline 2025",
  "url": "https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001356",
  "journal": "Circulation. 2025",
  "ano": 2025,
  "tipo": "Diretriz",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Confirmar resistência; denervação é opção adjunta seletiva e de decisão compartilhada",
  "icon": "📋",
  "resumo": "Diretriz multissocietária AHA/ACC de 2025. Na hipertensão aparentemente resistente, confirmar medidas fora do consultório, adesão, fármacos interferentes e causas secundárias. Segundo o material clínico oficial, denervação renal pode ser considerada como adjunta a medicamentos e estilo de vida (classe 2b) em adultos selecionados com pressão sistólica de 140–180 mmHg, diastólica ≥90 mmHg e taxa de filtração glomerular estimada ≥40 mL/min/1,73 m², apesar de terapia otimizada ou intolerância a fármacos. Exige avaliação por equipe multidisciplinar e decisão compartilhada (classe 1).",
  "conclusao": "A recomendação é para redução da pressão em pacientes selecionados, mantendo tratamento clínico e avaliação especializada; não autoriza uso automático nem retirada de medicações.",
  "curiosidade": ""
}
```

## Observação de implementação

OP primário, competência e conceito correto continuam reconhecíveis; manter qid e histórico, sem transferência nem reset de FSRS.
Nenhum arquivo do repositório alterado. Originais/propostas e hashes canônicos estão no JSON do lote. ready=false até revisão independente.

## Verificação bibliográfica

- [aha](https://professional.heart.org/-/media/PHD-Files-2/Science-News/Clinical-Slide-Series/2025-High-Blood-Pressure-Guideline-Clinical-Slides.pptx?sc_lang=en): Apresentação clínica oficial primária da diretriz2025, baixada e lida, não resumo de terceiro. Slide9: excluir efeito do avental branco por medidas fora do consultório na resistência aparente.; Slide26: excluir pseudorresistência, revisar interferentes, rastrear causas secundárias e otimizar esquema antes da quarta droga.; Slide27: denervação adjunta classe2b, PA140–180/≥90 e TFGe≥40; equipe e decisão compartilhada classe1.; Slide29: emergência com lesão aguda, UTI; reduzir sistólica25% na primeira hora, depois<160/100–110 nas6horas seguintes e redução subsequente em24–48h.. As tentativas de abrir o corpo principal AHA e JACC retornaram403. Não atribuo ao corpo não aberto a leitura dos slides oficiais. Para evitar confundir métricas, a proposta2a pergunta explicitamente pressão sistólica, como no slide29. A recomendação deve ser individualizada pelo órgão-alvo e contexto; dissecção, gestação, feocromocitoma e evento cerebrovascular específico foram excluídos do cenário.
