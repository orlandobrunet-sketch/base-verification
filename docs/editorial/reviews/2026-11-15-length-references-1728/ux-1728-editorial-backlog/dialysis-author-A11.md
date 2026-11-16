# Diálise A1.1 — reapreciação formal dos distratores

Revisão autoral, sem independência e sem aplicação. A1 permanece congelado e não é candidato de integração. A nova edição reavalia as quatro opções, o recurso, os dez eliminatórios e os vínculos de fontes/cards; não se limita a encurtar o gabarito.

| Questão | OP | Evidência | Pendência | Veredito | Score | Eliminatório | Autorização | Ação |
|---|---|---|---|---|---:|---|---|---|
| e4ef7329 | Individualizar ataque e manutenção de vancomicina durante CRRT variável. | VERIFICADA | NENHUMA | aprovada | 19/20 | não | LIBERADA | Nova revisão independente dos literais A1.1 |
| a5165833 | Interpretar hipoalbuminemia em diálise como marcador multifatorial, sem diagnóstico nutricional ou alvo causal isolados. | VERIFICADA | NENHUMA | aprovada | 19/20 | não | LIBERADA | Nova revisão independente dos literais A1.1 |
| 994ee93c | Ponderar benefício e custo de frequência dialítica a partir dos desfechos e limites do FHN Daily. | VERIFICADA | NENHUMA | aprovada | 18/20 | não | LIBERADA | Nova revisão independente dos literais A1.1 |
| 31926895 | Distinguir associação proteômica e discriminação prognóstica de causalidade e utilidade para guiar tratamento. | VERIFICADA | NENHUMA | aprovada | 19/20 | não | LIBERADA | Nova revisão independente dos literais A1.1 |
| 4a72b9b7 | Interpretar WAK como prova de conceito de curto prazo, reconhecendo limitações técnicas e de generalização. | VERIFICADA | NENHUMA | aprovada | 18/20 | não | LIBERADA | Nova revisão independente dos literais A1.1 |
| ed78156f | Reconhecer alcalemia pós-hemodiálise relacionada ao gradiente de bicarbonato e individualizar a prescrição sem induzir acidose pré-diálise. | VERIFICADA | NENHUMA | aprovada | 19/20 | não | LIBERADA | Nova revisão independente dos literais A1.1 |
| 9344c1f1 | Apresentar o papel do tiossulfato na calcifilaxia com incerteza de eficácia e sem substituir o cuidado multimodal. | VERIFICADA | NENHUMA | aprovada | 19/20 | não | LIBERADA | Nova revisão independente dos literais A1.1 |

## e4ef7329

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada desta edição pelo §18.4 Regra 7.

**OP e classificação:** Individualizar ataque e manutenção de vancomicina durante CRRT variável. Aplicar / Sabe como / medium. Integra infecção grave, depuração extracorpórea variável, função residual e monitorização; intermediária, sem cálculo farmacocinético ou regime numérico complexo.

**Justificativa e problemas encontrados:** o recurso de A1 foi acolhido; agora as alternativas apresentam erros nomeados, sem propriedade farmacológica aleatória ou negação fisiológica caricata. Nenhum problema substantivo restante identificado na avaliação autoral.

**Advogado do Recurso:** A tarefa pede um princípio, não uma dose. Ataque depende principalmente do volume de distribuição/peso; a manutenção precisa acompanhar depuração e níveis. Os três distratores contêm raciocínios farmacocinéticos aplicáveis em parte, mas usam o determinante no momento errado ou adiam monitorização.

- A: Confundir determinantes de dose de ataque e manutenção.

- B: Considerar suficiente o efluente prescrito e adiar monitorização necessária durante variabilidade.

- C: Única inferência/conduta sustentada pelo caso e fonte.

- D: Reduzir ataque por depuração baixa e tratar CRRT ativa como condição farmacocinética estável.

**Eliminatórios:** nenhum dos dez após nova avaliação. **Score:** 19/20, Excelente, com as dez dimensões no JSON. **Decisão:** 0: VERIFICADA/NENHUMA permite avaliar; 1: nenhum eliminatório após reavaliação; 2: recurso dos distratores endereçado e novamente testado; 3: 19/20 → aprovada. Implementação depende de revisão independente da edição A1.1.

```json
{
  "qid": "e4ef7329",
  "q": "Adulto crítico com infecção grave por Staphylococcus aureus resistente à meticilina (MRSA) inicia vancomicina enquanto recebe terapia renal substitutiva contínua (CRRT). A intensidade do efluente e a função renal residual podem variar nas próximas horas. Qual princípio de prescrição é mais seguro?",
  "opts": [
    "Estimar o ataque pela depuração do filtro e ajustar a manutenção apenas ao peso.",
    "Fixar a manutenção pelo efluente prescrito e medir níveis após estabilização renal.",
    "Dar ataque pelo peso e ajustar a manutenção ao efluente, à função residual e aos níveis séricos.",
    "Reduzir o ataque pela lesão renal e conservar a manutenção enquanto a CRRT estiver ativa."
  ],
  "ans": 2,
  "exp": "A CRRT remove vancomicina; a manutenção deve acompanhar as condições da terapia e do paciente, com monitorização precoce e repetida. O ataque baseado no peso evita atraso de exposição. Em infecções invasivas por MRSA, a referência usual para área sob a curva em 24 h/concentração inibitória mínima (AUC24/MIC) é 400–600, assumindo MIC de 1 mg/L. Esse alvo não torna adequado um esquema fixo.",
  "refs": [
    "vancomycin_crrt_pk_review_2026"
  ],
  "cat": "dialise",
  "diff": "medium",
  "t": "Vancomicina na CRRT — Dose Individualizada"
}
```

**Fontes primárias reabertas:** [V](https://www.mdpi.com/1999-4923/18/3/322) — Abstract, Methods/Results/Conclusions; Discussion and Box1; Table4 (OPENED_FULL_TEXT) · [VA](https://www.ashp.org/-/media/assets/policy-guidelines/docs/therapeutic-guidelines/therapeutic-guidelines-monitoring-vancomycin-ASHP-IDSA-PIDS.ashx?hash=71C20A6FEF3CFB7135A30A2D3BA67E1E975CD69A&la=en) — PDF p14: Continuous renal replacement therapies; recommendation16; Table2 (OPENED_FULL_TEXT)

**Vínculos:** AFTER `sha256:e09abbdf0168f3435d93184245bfe45c27f646c7f45cf1ec04d45bf1e2b87069`; pacote com cards `sha256:9b0dcf0168b14a60e14c9f64be565124ccad90a9ca15ea718c679fcf02eb4cd4`. Cards integrais e seus hashes de 12 campos no JSON.

**Implementação:** preservar qid, gabarito, categoria e FSRS do próprio item. Mudanças somente no AFTER exato; não reaplicar o A1. Retirar apenas a atribuição vancomycin_monitoring_ashp deste qid: seu URL não pôde ser confirmado. Não apagar ou editar o card compartilhado. O card2026 e a fonte primáriaASHP foram reabertos.

**Pendência operacional:** revisão independente do pai, sem herdar a versão anterior. Nenhuma pendência decisiva de fonte foi identificada neste candidato.

## a5165833

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada desta edição pelo §18.4 Regra 7.

**OP e classificação:** Interpretar hipoalbuminemia em diálise como marcador multifatorial, sem diagnóstico nutricional ou alvo causal isolados. Aplicar / Sabe como / medium. Cruza albumina e inflamação num cenário simples e distingue associação de causalidade; intermediária, sem solução de conflito diagnóstico avançado.

**Justificativa e problemas encontrados:** o recurso de A1 foi acolhido; agora as alternativas apresentam erros nomeados, sem propriedade farmacológica aleatória ou negação fisiológica caricata. Nenhum problema substantivo restante identificado na avaliação autoral.

**Advogado do Recurso:** A interpretação conjunta é sustentada pela coorte. A pergunta não exige um diagnóstico etiológico definitivo nem uma indicação de infusão. D não é apenas uma frase absoluta: representa a inferência causal indevida que transforma concentração baixa em reposição como prioridade.

- A: Única inferência/conduta sustentada pelo caso e fonte.

- B: Tratar o marcador como medida direta de ingestão, ignorando a inflamação.

- C: Usar albumina como marcador específico da depuração dialítica.

- D: Tratar um marcador prognóstico como deficiência a corrigir antes de esclarecer a causa.

**Eliminatórios:** nenhum dos dez após nova avaliação. **Score:** 19/20, Excelente, com as dez dimensões no JSON. **Decisão:** 0: VERIFICADA/NENHUMA permite avaliar; 1: nenhum eliminatório após reavaliação; 2: recurso dos distratores endereçado e novamente testado; 3: 19/20 → aprovada. Implementação depende de revisão independente da edição A1.1.

```json
{
  "t": "Albumina Baixa na Diálise — Marcador, não Alvo Isolado",
  "qid": "a5165833",
  "q": "Paciente em hemodiálise tem Kt/V 1,45, albumina de 2,9 g/dL e proteína C-reativa elevada. Qual interpretação da albumina é mais apropriada?",
  "refs": [
    "de_mutsert_albumin_2009"
  ],
  "opts": [
    "É marcador de risco influenciado por inflamação e nutrição; requer avaliação conjunta.",
    "É medida direta da ingestão proteica, sendo a inflamação um achado secundário no caso.",
    "É indicador de depuração insuficiente, mesmo quando a dose ureica entregue está adequada.",
    "É evidência de deficiência de albumina, favorecendo reposição antes de investigar nutrição."
  ],
  "ans": 0,
  "exp": "Albumina baixa é marcador de risco, mas não mede isoladamente nutrição nem demonstra causalidade. Na coorte de de Mutsert, a inflamação explicou parte importante da associação com mortalidade. O achado do caso pede avaliação clínica e nutricional conjunta; não permite atribuir tudo à ingestão ou à dose de diálise.",
  "diff": "medium",
  "cat": "dialise"
}
```

**Fontes primárias reabertas:** [A](https://pubmed.ncbi.nlm.nih.gov/19218039/) — Abstract: Design and patients; Results; Conclusion (OPENED_PRIMARY_ABSTRACT)

**Vínculos:** AFTER `sha256:bce60a9eb86a47cc4d209c14a1993acde82c09c7bcf7ba6c4941de5b1068e027`; pacote com cards `sha256:30f27af74439e7fbc3fe2cff4b0bfb4a48ee209893859543bf71a629cfccb77c`. Cards integrais e seus hashes de 12 campos no JSON.

**Implementação:** preservar qid, gabarito, categoria e FSRS do próprio item. Mudanças somente no AFTER exato; não reaplicar o A1. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Pendência operacional:** revisão independente do pai, sem herdar a versão anterior. Nenhuma pendência decisiva de fonte foi identificada neste candidato.

## 994ee93c

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada desta edição pelo §18.4 Regra 7.

**OP e classificação:** Ponderar benefício e custo de frequência dialítica a partir dos desfechos e limites do FHN Daily. Compreender / Sabe / medium. Exige reconhecer interpretação de compostos, acesso e limite de mortalidade, sem cálculo ou extrapolação para prescrição individual.

**Justificativa e problemas encontrados:** o recurso de A1 foi acolhido; agora as alternativas apresentam erros nomeados, sem propriedade farmacológica aleatória ou negação fisiológica caricata. Nenhum problema substantivo restante identificado na avaliação autoral.

**Advogado do Recurso:** A e D diferem na direção do evento relacionado ao acesso, um custo clínico relevante documentado. B confunde desfecho composto com mortalidade isolada; C omite o resultado favorável do outro coprimário. Nenhum distrator atribui resultado impossível ou usa uma modalidade não estudada.

- A: Única inferência/conduta sustentada pelo caso e fonte.

- B: Trocar o composto por prova de mortalidade e negar um dos compostos favoráveis.

- C: Ler apenas um dos dois desfechos coprimários como positivo.

- D: Interpretar o maior número de sessões como redução das intervenções no acesso.

**Eliminatórios:** nenhum dos dez após nova avaliação. **Score:** 18/20, Excelente, com as dez dimensões no JSON. **Decisão:** 0: VERIFICADA/NENHUMA permite avaliar; 1: nenhum eliminatório após reavaliação; 2: recurso dos distratores endereçado e novamente testado; 3: 18/20 → aprovada. Implementação depende de revisão independente da edição A1.1.

```json
{
  "t": "FHN Daily — Benefício e Custo da Hemodiálise Frequente",
  "qid": "994ee93c",
  "q": "No ensaio Frequent Hemodialysis Network (FHN) Daily, a hemodiálise em centro seis vezes por semana foi comparada a três vezes por semana durante 12 meses. Qual balanço resume os resultados?",
  "refs": [
    "fhn_daily_2010"
  ],
  "opts": [
    "Favoreceu os dois compostos coprimários, com mais intervenções no acesso e mortalidade isolada inconclusiva.",
    "Favoreceu mortalidade isolada e saúde física, mas não o composto ligado à massa ventricular.",
    "Favoreceu o composto ligado à massa ventricular, sem melhora do composto de saúde física.",
    "Favoreceu os dois compostos coprimários, com menos intervenções no acesso e mortalidade isolada inconclusiva."
  ],
  "ans": 0,
  "exp": "O FHN Daily randomizou 245 pacientes para hemodiálise seis ou três vezes por semana. A estratégia frequente melhorou os dois desfechos coprimários compostos — morte ou mudança da massa ventricular esquerda e morte ou mudança do componente físico de qualidade de vida — além de pressão e fósforo. O seguimento de 12 meses e o número de eventos não estabeleceram benefício de mortalidade isolada. Houve mais intervenções relacionadas ao acesso, um custo clínico importante da maior frequência de canulação.",
  "diff": "medium",
  "cat": "dialise"
}
```

**Fontes primárias reabertas:** [F](https://pmc.ncbi.nlm.nih.gov/articles/PMC3042140/) — Abstract: Methods/Results; Outcomes; Discussion: limitations (OPENED_FULL_TEXT)

**Vínculos:** AFTER `sha256:14c25a6e3e52056bc0e45733c6497037c01ecaf5f7049c244b7822858555f95c`; pacote com cards `sha256:a6c04d703b0572982d0083632b42553f4a73186310334bd73df913651e7347f3`. Cards integrais e seus hashes de 12 campos no JSON.

**Implementação:** preservar qid, gabarito, categoria e FSRS do próprio item. Mudanças somente no AFTER exato; não reaplicar o A1. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Pendência operacional:** revisão independente do pai, sem herdar a versão anterior. Nenhuma pendência decisiva de fonte foi identificada neste candidato.

## 31926895

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada desta edição pelo §18.4 Regra 7.

**OP e classificação:** Distinguir associação proteômica e discriminação prognóstica de causalidade e utilidade para guiar tratamento. Compreender / Sabe / easy. Aplicação direta do limite entre associação e causalidade, sem interpretar magnitude, validação estatística ou modelo complexo; vocabulário sofisticado não eleva dificuldade.

**Justificativa e problemas encontrados:** o recurso de A1 foi acolhido; agora as alternativas apresentam erros nomeados, sem propriedade farmacológica aleatória ou negação fisiológica caricata. Nenhum problema substantivo restante identificado na avaliação autoral.

**Advogado do Recurso:** O texto não nega a validação realizada em PACE. Distingue essa replicação da demonstração de utilidade terapêutica e de validação futura em contextos externos. Os três erros são etapas reais de extrapolação de biomarcadores, sem dizer que fatores clínicos perderam todo valor.

- A: Única inferência/conduta sustentada pelo caso e fonte.

- B: Confundir melhor discriminação prognóstica com benefício na escolha terapêutica.

- C: Confundir replicação interna entre coortes do estudo com transporte para outras populações.

- D: Converter associação de biomarcador em causalidade e alvo de intervenção.

**Eliminatórios:** nenhum dos dez após nova avaliação. **Score:** 19/20, Excelente, com as dez dimensões no JSON. **Decisão:** 0: VERIFICADA/NENHUMA permite avaliar; 1: nenhum eliminatório após reavaliação; 2: recurso dos distratores endereçado e novamente testado; 3: 19/20 → aprovada. Implementação depende de revisão independente da edição A1.1.

```json
{
  "t": "Proteômica CRIC/PACE — Associação não é Alvo Terapêutico",
  "qid": "31926895",
  "q": "Um estudo proteômico em duas coortes de pessoas em hemodiálise quantificou 6.287 proteínas por plataforma de aptâmeros e identificou um painel associado à mortalidade. Qual é a interpretação mais segura?",
  "refs": [
    "cric_pace_proteomics_2025"
  ],
  "opts": [
    "O painel identifica candidatos prognósticos, com utilidade terapêutica ainda a demonstrar.",
    "O melhor desempenho do painel já permite substituir o modelo clínico na escolha terapêutica.",
    "A replicação entre duas coortes permite usar o painel em outras populações sem nova validação.",
    "As proteínas associadas são mediadores causais, indicando quais alvos priorizar no tratamento."
  ],
  "ans": 0,
  "exp": "O estudo descreve associações entre proteínas e mortalidade e desempenho prognóstico nas amostras analisadas. Isso não testa se modificar proteínas melhora desfechos nem se usar o painel orienta tratamentos. Os próprios autores pedem validação futura e esclarecimento de possíveis mediadores; melhor discriminação interna não substitui essa etapa.",
  "diff": "easy",
  "cat": "dialise"
}
```

**Fontes primárias reabertas:** [P](https://www.nature.com/articles/s41467-025-66763-z) — Abstract; Methods: SomaScan V4.1; Discussion (OPENED_FULL_TEXT)

**Vínculos:** AFTER `sha256:5f276f3b84fcbc5487acc9215786c2caf8588fc060f9a63c22773a40b1d53dd0`; pacote com cards `sha256:3a46f9af7bd6a57f498feceb85014f66bd5665c0db02b9c49523b427fcda22ff`. Cards integrais e seus hashes de 12 campos no JSON.

**Implementação:** preservar qid, gabarito, categoria e FSRS do próprio item. Mudanças somente no AFTER exato; não reaplicar o A1. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Pendência operacional:** revisão independente do pai, sem herdar a versão anterior. Nenhuma pendência decisiva de fonte foi identificada neste candidato.

## 4a72b9b7

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada desta edição pelo §18.4 Regra 7.

**OP e classificação:** Interpretar WAK como prova de conceito de curto prazo, reconhecendo limitações técnicas e de generalização. Compreender / Sabe / easy. Distingue viabilidade exploratória de equivalência e disponibilidade, sem cálculo, decisão terapêutica ou síntese clínica avançada.

**Justificativa e problemas encontrados:** o recurso de A1 foi acolhido; agora as alternativas apresentam erros nomeados, sem propriedade farmacológica aleatória ou negação fisiológica caricata. Nenhum problema substantivo restante identificado na avaliação autoral.

**Advogado do Recurso:** A interpretação usa os dados fornecidos, sem exigir memorização do acrônimo. B exigiria comparação apropriada; C extrapola cenário, tempo e poder para segurança; D trata a correção técnica como garantia de tolerância populacional. O protocolo não fornece essas inferências. A mantém a conclusão de prova de conceito do original.

- A: Única inferência/conduta sustentada pelo caso e fonte.

- B: Inferir equivalência comparativa a partir de estudo exploratório não controlado.

- C: Inferir segurança domiciliar de longo prazo a partir da ausência de evento grave em amostra pequena.

- D: Generalizar tolerância populacional futura e duradoura a partir de sete participantes e falhas ainda abertas.

**Eliminatórios:** nenhum dos dez após nova avaliação. **Score:** 18/20, Excelente, com as dez dimensões no JSON. **Decisão:** 0: VERIFICADA/NENHUMA permite avaliar; 1: nenhum eliminatório após reavaliação; 2: recurso dos distratores endereçado e novamente testado; 3: 18/20 → aprovada. Implementação depende de revisão independente da edição A1.1.

```json
{
  "t": "WAK — Prova de Conceito e Limitações Técnicas",
  "qid": "4a72b9b7",
  "q": "Em um estudo exploratório não randomizado de um rim artificial vestível, sete pessoas em hemodiálise foram acompanhadas por até 24 horas. Cinco completaram o protocolo; houve controle de solutos e volume, mas problemas técnicos levaram à interrupção do estudo. Como interpretar esses resultados?",
  "refs": [
    "wak_gura_2016"
  ],
  "opts": [
    "Sustentam viabilidade inicial, com necessidade de aperfeiçoamento e avaliação clínica posterior.",
    "Permitem concluir eficácia semelhante à hemodiálise convencional, pela depuração observada.",
    "Sustentam segurança clínica para uso domiciliar, por não terem ocorrido eventos adversos graves.",
    "Permitem estimar tolerância ao uso contínuo na maioria dos usuários após corrigir as falhas técnicas."
  ],
  "ans": 0,
  "exp": "O estudo incluiu sete participantes; cinco completaram as 24 horas planejadas. Durante o uso, eletrólitos e volume permaneceram controlados e não houve evento adverso grave, apoiando viabilidade inicial. Porém, o ensaio foi interrompido após problemas como bolhas de dióxido de carbono e fluxos variáveis. Assim, o WAK oferece uma prova de conceito experimental de terapia prolongada e portátil, não evidência de segurança duradoura, equivalência clínica, redução de mortalidade, custo inferior ou disponibilidade assistencial.",
  "diff": "easy",
  "cat": "dialise"
}
```

**Fontes primárias reabertas:** [W](https://insight.jci.org/articles/view/86397) — Abstract; Results: Device performance and technical complications; Discussion (OPENED_FULL_TEXT)

**Vínculos:** AFTER `sha256:b42ab42b5f5bd4ef82079d2769182295d6d7df9c8b3a03a55d9b8dfd92fd477c`; pacote com cards `sha256:0c51c18af816e774324498602a6ed37bac9531dd3674a65a053b817529605b25`. Cards integrais e seus hashes de 12 campos no JSON.

**Implementação:** preservar qid, gabarito, categoria e FSRS do próprio item. Mudanças somente no AFTER exato; não reaplicar o A1. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Pendência operacional:** revisão independente do pai, sem herdar a versão anterior. Nenhuma pendência decisiva de fonte foi identificada neste candidato.

## ed78156f

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada desta edição pelo §18.4 Regra 7.

**OP e classificação:** Reconhecer alcalemia pós-hemodiálise relacionada ao gradiente de bicarbonato e individualizar a prescrição sem induzir acidose pré-diálise. Aplicar / Sabe como / medium. Integra valores pré/pós e concentração do banho, com decisão de reavaliação individual; intermediária, sem distúrbio misto ou cálculo avançado.

**Justificativa e problemas encontrados:** o recurso de A1 foi acolhido; agora as alternativas apresentam erros nomeados, sem propriedade farmacológica aleatória ou negação fisiológica caricata. Nenhum problema substantivo restante identificado na avaliação autoral.

**Advogado do Recurso:** B considera um resultado real, mas o transforma em alvo único de uma redução padronizada; C considera o resultado prévio e ignora o posterior; D reduz a exposição ao álcali por meio que compromete a entrega de diálise. São decisões clínicas plausíveis, distintas da negação absurda de que diálise altere ácido-base. A não fixa concentração universal.

- A: Única inferência/conduta sustentada pelo caso e fonte.

- B: Mirar apenas o pH final com ajuste padronizado, sem ponderar o estado pré-diálise.

- C: Usar adequação pré-diálise para desconsiderar a alcalemia pós-diálise.

- D: Reduzir exposição ao álcali sacrificando o tempo de tratamento sem ajustar o banho.

**Eliminatórios:** nenhum dos dez após nova avaliação. **Score:** 19/20, Excelente, com as dez dimensões no JSON. **Decisão:** 0: VERIFICADA/NENHUMA permite avaliar; 1: nenhum eliminatório após reavaliação; 2: recurso dos distratores endereçado e novamente testado; 3: 19/20 → aprovada. Implementação depende de revisão independente da edição A1.1.

```json
{
  "t": "Hemodiálise — Alcalemia Pós-Diálise e Bicarbonato",
  "qid": "ed78156f",
  "q": "Paciente em hemodiálise tem bicarbonato pré-diálise de 24 mEq/L e usa dialisato com bicarbonato de 37 mEq/L. Ao final da sessão, apresenta pH 7,51 e bicarbonato de 30 mEq/L, sem vômitos ou ingestão de álcali. Qual interpretação é mais apropriada?",
  "refs": [
    "park_dialysate_bicarbonate_2020"
  ],
  "opts": [
    "O banho pode explicar a alcalemia; confirmar os dados e individualizar o bicarbonato prescrito.",
    "Usar o valor pós-diálise para orientar redução padronizada do banho até normalizar o pH final.",
    "Manter o banho pelo bicarbonato pré-diálise adequado, pois a alcalemia ao final é efeito esperado.",
    "Manter o bicarbonato do banho e encurtar a sessão para reduzir a exposição ao álcali."
  ],
  "ans": 0,
  "exp": "O gradiente entre dialisato e sangue transfere bicarbonato durante a sessão. Park et al. observaram alcalemia com 37 mEq/L; com banhos baixos, houve perda de bicarbonato ou maior acidemia pré-diálise. O achado é compatível com a prescrição, mas exige confirmar a amostra e individualizar o banho, acompanhando os valores antes e depois da sessão. Mirar somente um desses momentos ou encurtar a diálise não resolve adequadamente o problema da prescrição.",
  "diff": "medium",
  "cat": "dialise"
}
```

**Fontes primárias reabertas:** [B](https://pmc.ncbi.nlm.nih.gov/articles/PMC7311706/) — Abstract; Results study1: acid-base status; Results study2: acid-base status (OPENED_FULL_TEXT)

**Vínculos:** AFTER `sha256:af193c90a10f976f11817d7e39524add12e28f34ddc6a610732cdb519455297b`; pacote com cards `sha256:cde447953470a23a529f229a96ae0724d5cd5d95ba8fdb0bedbc2919a7f8799c`. Cards integrais e seus hashes de 12 campos no JSON.

**Implementação:** preservar qid, gabarito, categoria e FSRS do próprio item. Mudanças somente no AFTER exato; não reaplicar o A1. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Pendência operacional:** revisão independente do pai, sem herdar a versão anterior. Nenhuma pendência decisiva de fonte foi identificada neste candidato.

## 9344c1f1

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada desta edição pelo §18.4 Regra 7.

**OP e classificação:** Apresentar o papel do tiossulfato na calcifilaxia com incerteza de eficácia e sem substituir o cuidado multimodal. Compreender / Sabe / easy. Diagnóstico dado e pergunta sobre papel/força da evidência de um fármaco, sem dose ou decisão em paciente complexo; básica.

**Justificativa e problemas encontrados:** o recurso de A1 foi acolhido; agora as alternativas apresentam erros nomeados, sem propriedade farmacológica aleatória ou negação fisiológica caricata. Nenhum problema substantivo restante identificado na avaliação autoral.

**Advogado do Recurso:** Os distratores agora são erros de leitura da evidência comparativa, sem mecanismo aleatório, antibiótico ou dispensa de cuidados básicos. A incerteza da correta é necessária: a metanálise não demonstrou melhora das lesões, benefício de sobrevida nem aumento significativo da mortalidade.

- A: Única inferência/conduta sustentada pelo caso e fonte.

- B: Ler um resultado não significativo de mortalidade como benefício demonstrado.

- C: Ler um resultado não significativo de cicatrização como benefício demonstrado.

- D: Transformar ausência de benefício demonstrado em prova de dano.

**Eliminatórios:** nenhum dos dez após nova avaliação. **Score:** 19/20, Excelente, com as dez dimensões no JSON. **Decisão:** 0: VERIFICADA/NENHUMA permite avaliar; 1: nenhum eliminatório após reavaliação; 2: recurso dos distratores endereçado e novamente testado; 3: 19/20 → aprovada. Implementação depende de revisão independente da edição A1.1.

```json
{
  "t": "Calcifilaxia — Papel do Tiossulfato de Sódio",
  "qid": "9344c1f1",
  "q": "Paciente em hemodiálise tem calcifilaxia confirmada. Como deve ser apresentado o papel do tiossulfato de sódio?",
  "refs": [
    "calciphylaxis_sts_meta_2023"
  ],
  "opts": [
    "É opção off-label do manejo multimodal, com benefício clínico ainda não estabelecido.",
    "É opção com benefício de sobrevida demonstrado, mas sem efeito estabelecido na cicatrização.",
    "É opção com benefício de cicatrização demonstrado, mas sem efeito estabelecido na sobrevida.",
    "É opção desaconselhada pelas coortes, que demonstraram aumento da mortalidade com seu uso."
  ],
  "ans": 0,
  "exp": "O tiossulfato é usado off-label, mas a metanálise de coortes não demonstrou melhora comparativa de cicatrização ou sobrevida. A evidência observacional tem limitações e não equivale a ensaio randomizado conclusivo. Seu uso, quando escolhido, é individualizado e acompanha o cuidado dos demais fatores da calcifilaxia; não substitui o manejo multimodal.",
  "diff": "easy",
  "cat": "dialise"
}
```

**Fontes primárias reabertas:** [S](https://pmc.ncbi.nlm.nih.gov/articles/PMC10134003/) — KeyPoints; Abstract: Results; Introduction; Discussion (OPENED_FULL_TEXT)

**Vínculos:** AFTER `sha256:db54520191e0f23a3d7ac6b3fae1131b5bfe4b36b6a862975f2743dd42812ee6`; pacote com cards `sha256:ef2d9e76990224c9a205353470a4a0a7b8f76801e211b089d362ebac0dc9b487`. Cards integrais e seus hashes de 12 campos no JSON.

**Implementação:** preservar qid, gabarito, categoria e FSRS do próprio item. Mudanças somente no AFTER exato; não reaplicar o A1. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Pendência operacional:** revisão independente do pai, sem herdar a versão anterior. Nenhuma pendência decisiva de fonte foi identificada neste candidato.

**SHA256 dos bytes do JSON A1.1 (crypto.update(Buffer)):** `66c9eb3a7f068d45ebf9d8a601a7c4f7c7fa3038b0fb118918e3e1cd798f5531`.
