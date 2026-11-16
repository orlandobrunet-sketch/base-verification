# Diálise A1 — sete candidatos autorais, sem aplicação

Revisão formal autoral, sem independência. Todos os objetos e os cards de 12campos permanecem em ART. A autorização abaixo é editorial do candidato exato e exige conferência independente pelo pai antes de integração.

| Questão | OP | Evidência | Pendência | Veredito | Score | Eliminatório | Autorização | Legado | Ação |
|---|---|---|---|---|---|---|---|---|
| e4ef7329 | Individualizar ataque e manutenção de vancomicina durante CRRT variável. | VERIFICADA | NENHUMA | aprovada |18/20| não | LIBERADA | MANTER | AFTER exato para revisão independente |
| a5165833 | Interpretar hipoalbuminemia em diálise como marcador multifatorial, sem diagnóstico nutricional ou alvo causal isolados. | VERIFICADA | NENHUMA | aprovada |18/20| não | LIBERADA | MANTER | AFTER exato para revisão independente |
| 994ee93c | Ponderar benefício e custo de frequência dialítica a partir dos desfechos e limites do FHN Daily. | VERIFICADA | NENHUMA | aprovada |18/20| não | LIBERADA | MANTER | AFTER exato para revisão independente |
| 31926895 | Distinguir associação proteômica e discriminação prognóstica de causalidade e utilidade para guiar tratamento. | VERIFICADA | NENHUMA | aprovada |18/20| não | LIBERADA | MANTER | AFTER exato para revisão independente |
| 4a72b9b7 | Interpretar WAK como prova de conceito de curto prazo, reconhecendo limitações técnicas e de generalização. | VERIFICADA | NENHUMA | aprovada |18/20| não | LIBERADA | MANTER | AFTER exato para revisão independente |
| ed78156f | Reconhecer alcalemia pós-hemodiálise relacionada ao gradiente de bicarbonato e individualizar a prescrição sem induzir acidose pré-diálise. | VERIFICADA | NENHUMA | aprovada |18/20| não | LIBERADA | MANTER | AFTER exato para revisão independente |
| 9344c1f1 | Apresentar o papel do tiossulfato na calcifilaxia com incerteza de eficácia e sem substituir o cuidado multimodal. | VERIFICADA | NENHUMA | aprovada |18/20| não | LIBERADA | MANTER | AFTER exato para revisão independente |

## e4ef7329 — Vancomicina na CRRT — Dose Individualizada

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada §18.4 Regra 7.

**OP e classificação:** Individualizar ataque e manutenção de vancomicina durante CRRT variável. Aplicar / Sabe como / medium. Integra infecção grave, depuração extracorpórea variável, função residual e monitorização; intermediária, sem cálculo farmacocinético ou regime numérico complexo.

**Justificativa:** preserva conceito/decisão; retira extensão seletiva e deixa a fundamentação na explicação. Retirar apenas a atribuição vancomycin_monitoring_ashp deste qid: seu URL não pôde ser confirmado. Não apagar ou editar o card compartilhado. O card2026 e a fonte primáriaASHP foram reabertos.

**Problemas encontrados:** correta original seletivamente longa; nenhum problema substantivo remanescente no candidato, com limitações de distratores/anti-IA pontuadas no JSON.

**Advogado do Recurso:** Não há dose universal escondida; o alvo numérico fica na explicação comMIC1, enquantoCresponde ao princípio solicitado. Nenhum argumento plausível restante.

**Eliminatórios:** nenhum dos 10disparado; oJSONlista os 10. **Score:**18/20 — Excelente; as10 dimensões estão pontuadas no JSON. **Árvore:** 0:VERIFICADA/NENHUMA permiteavaliar;1:nenhum eliminatório;2:nenhum recurso plausível restante;3:18/20→aprovada. Ciclo proposto:publicado após revisão independente e implementação autorizada.

**AFTER exato:** `sha256:28461cd6ebdb60a6f5d882d5f1c3e4070859d701ca7a4110306f63a3bb8af987`. **Pacote com cards completos:** `sha256:9761ba7b18221b24a0470596db73a5399a10ed6129ab1d61b95a5cbd9fe17994`.

```json
{
  "qid": "e4ef7329",
  "q": "Adulto crítico com infecção grave por Staphylococcus aureus resistente à meticilina (MRSA) inicia vancomicina enquanto recebe terapia renal substitutiva contínua (CRRT). A intensidade do efluente e a função renal residual podem variar nas próximas horas. Qual princípio de prescrição é mais seguro?",
  "opts": [
    "Adiar a dose de ataque até obter o primeiro nível, porque a CRRT impede estimar o volume de distribuição",
    "Usar 1 g a cada 24 horas em todos os pacientes, independentemente do peso, do efluente e da diurese residual",
    "Dar ataque pelo peso e individualizar a manutenção com efluente, função residual e níveis séricos.",
    "Aplicar o esquema de paciente anúrico sem diálise, pois a vancomicina não é removida pela CRRT"
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

**Referências verificadas:** [V](https://www.mdpi.com/1999-4923/18/3/322) — Abstract, Methods/Results/Conclusions; Discussion and Box1; Table4 (OPENED_FULL_TEXT) · [VA](https://www.ashp.org/-/media/assets/policy-guidelines/docs/therapeutic-guidelines/therapeutic-guidelines-monitoring-vancomycin-ASHP-IDSA-PIDS.ashx?hash=71C20A6FEF3CFB7135A30A2D3BA67E1E975CD69A&la=en) — PDF p14: Continuous renal replacement therapies; recommendation16; Table2 (OPENED_FULL_TEXT)

**Card(s):** vancomycin_crrt_pk_review_2026 `sha256:cd6ccf0446a1353a501dffc9e6de7e3b1d90cf0093721b63950b8c2091656a06` (12 campos, inalterado). Integrais no JSON.

**Identidade/implementação:** preserva o próprio qid e FSRS. 9200dc0a aborda vancomicina naHDintermitente de altofluxo; a modalidade/dados e a decisão de prescrição são distintos.

**Comprimento:** 104/108/211/94→104/108/98/94; razão 1.954→0.907. Sinal estrutural, sem validação psicométrica.

## a5165833 — Albumina Baixa na Diálise — Marcador, não Alvo Isolado

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada §18.4 Regra 7.

**OP e classificação:** Interpretar hipoalbuminemia em diálise como marcador multifatorial, sem diagnóstico nutricional ou alvo causal isolados. Aplicar / Sabe como / medium. Cruza albumina e inflamação num cenário simples e distingue associação de causalidade; intermediária, sem solução de conflito diagnóstico avançado.

**Justificativa:** preserva conceito/decisão; retira extensão seletiva e deixa a fundamentação na explicação. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Problemas encontrados:** correta original seletivamente longa; nenhum problema substantivo remanescente no candidato, com limitações de distratores/anti-IA pontuadas no JSON.

**Advogado do Recurso:** Aéinterdependência clínico-nutricional;Kt/Vfornecido não faz albumina medir apenas dose ou ingestão. Nenhuma indicação de infusão é criada. Nenhum argumento plausível restante.

**Eliminatórios:** nenhum dos 10disparado; oJSONlista os 10. **Score:**18/20 — Excelente; as10 dimensões estão pontuadas no JSON. **Árvore:** 0:VERIFICADA/NENHUMA permiteavaliar;1:nenhum eliminatório;2:nenhum recurso plausível restante;3:18/20→aprovada. Ciclo proposto:publicado após revisão independente e implementação autorizada.

**AFTER exato:** `sha256:bfce8246b6d6463e5563617f8061a02defe20bce25dfdbc1b4ad97429fd826da`. **Pacote com cards completos:** `sha256:c491c6f848b7391078c0dfd5d5aaab4861bcd169708d1c04258cc326db1f9b55`.

```json
{
  "t": "Albumina Baixa na Diálise — Marcador, não Alvo Isolado",
  "qid": "a5165833",
  "q": "Paciente em hemodiálise tem Kt/V 1,45, albumina de 2,9 g/dL e proteína C-reativa elevada. Qual interpretação da albumina é mais apropriada?",
  "refs": [
    "de_mutsert_albumin_2009"
  ],
  "opts": [
    "É marcador de risco influenciado por inflamação e nutrição, não diagnóstico nutricional isolado.",
    "Comprova subdiálise apesar do Kt/V e obriga aumentar horas sem outra avaliação",
    "Mede exclusivamente ingestão proteica das últimas 24 horas",
    "É causal por si só, portanto elevar a concentração com albumina intravenosa comprovadamente reduz mortalidade"
  ],
  "ans": 0,
  "exp": "Albumina baixa é marcador de risco, mas não mede isoladamente nutrição nem demonstra causalidade. Na coorte de de Mutsert, a inflamação explicou parte importante da associação com mortalidade. O achado do caso pede avaliação clínica e nutricional conjunta; não permite atribuir tudo à ingestão ou à dose de diálise.",
  "diff": "medium",
  "cat": "dialise"
}
```

**Referências verificadas:** [A](https://pubmed.ncbi.nlm.nih.gov/19218039/) — Abstract: Design and patients; Results; Conclusion (OPENED_PRIMARY_ABSTRACT)

**Card(s):** de_mutsert_albumin_2009 `sha256:88db5982fedd90e52c1f5c0f9e89c1913dff59d9600bc5c9776650ac52a4862d` (12 campos, inalterado). Integrais no JSON.

**Identidade/implementação:** preserva o próprio qid e FSRS. Nenhum parceiro idêntico encontrado na busca dirigida.

**Comprimento:** 192/78/58/109→96/78/58/109; razão 1.761→0.881. Sinal estrutural, sem validação psicométrica.

## 994ee93c — FHN Daily — Benefício e Custo da Hemodiálise Frequente

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada §18.4 Regra 7.

**OP e classificação:** Ponderar benefício e custo de frequência dialítica a partir dos desfechos e limites do FHN Daily. Compreender / Sabe / medium. Exige reconhecer interpretação de compostos, acesso e limite de mortalidade, sem cálculo ou extrapolação para prescrição individual.

**Justificativa:** preserva conceito/decisão; retira extensão seletiva e deixa a fundamentação na explicação. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Problemas encontrados:** correta original seletivamente longa; nenhum problema substantivo remanescente no candidato, com limitações de distratores/anti-IA pontuadas no JSON.

**Advogado do Recurso:** Mortalidade isolada inconclusiva não equivale a ausência de benefício nos compostos; a resposta discrimina os dois planos. Nenhum argumento plausível restante.

**Eliminatórios:** nenhum dos 10disparado; oJSONlista os 10. **Score:**18/20 — Excelente; as10 dimensões estão pontuadas no JSON. **Árvore:** 0:VERIFICADA/NENHUMA permiteavaliar;1:nenhum eliminatório;2:nenhum recurso plausível restante;3:18/20→aprovada. Ciclo proposto:publicado após revisão independente e implementação autorizada.

**AFTER exato:** `sha256:7a435bd69b57b40df48f2ded7b42a391c78ea2b2b9a5ef9c9605ac27536824c3`. **Pacote com cards completos:** `sha256:b8172ea7767a9c18a72300fb04841ba0c39d6d5802f892d5f468d8e108f3357a`.

```json
{
  "t": "FHN Daily — Benefício e Custo da Hemodiálise Frequente",
  "qid": "994ee93c",
  "q": "No FHN Daily Trial, qual balanço descreve melhor a hemodiálise em centro seis vezes por semana comparada a três vezes por semana durante 12 meses?",
  "refs": [
    "fhn_daily_2010"
  ],
  "opts": [
    "Melhorou ambos os compostos coprimários, com mais intervenções no acesso e mortalidade isolada inconclusiva.",
    "Reduziu mortalidade isolada de forma conclusiva e diminuiu intervenções no acesso vascular",
    "Não alterou massa ventricular, pressão, fósforo nem qualidade de vida",
    "Piorou os dois desfechos coprimários porque sessões mais frequentes aumentaram a instabilidade hemodinâmica"
  ],
  "ans": 0,
  "exp": "O FHN Daily randomizou 245 pacientes para hemodiálise seis ou três vezes por semana. A estratégia frequente melhorou os dois desfechos coprimários compostos — morte ou mudança da massa ventricular esquerda e morte ou mudança do componente físico de qualidade de vida — além de pressão e fósforo. O seguimento de 12 meses e o número de eventos não estabeleceram benefício de mortalidade isolada. Houve mais intervenções relacionadas ao acesso, um custo clínico importante da maior frequência de canulação.",
  "diff": "medium",
  "cat": "dialise"
}
```

**Referências verificadas:** [F](https://pmc.ncbi.nlm.nih.gov/articles/PMC3042140/) — Abstract: Methods/Results; Outcomes; Discussion: limitations (OPENED_FULL_TEXT)

**Card(s):** fhn_daily_2010 `sha256:cc91a653f61498dc43223159ef9078a8aeddfb32e4a0d25e0e7904e0a9f0edcf` (12 campos, inalterado). Integrais no JSON.

**Identidade/implementação:** preserva o próprio qid e FSRS. Nenhum parceiro idêntico encontrado na busca dirigida.

**Comprimento:** 179/90/69/107→108/90/69/107; razão 1.673→1.009. Sinal estrutural, sem validação psicométrica.

## 31926895 — Proteômica CRIC/PACE — Associação não é Alvo Terapêutico

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada §18.4 Regra 7.

**OP e classificação:** Distinguir associação proteômica e discriminação prognóstica de causalidade e utilidade para guiar tratamento. Compreender / Sabe / easy. Aplicação direta do limite entre associação e causalidade, sem interpretar magnitude, validação estatística ou modelo complexo; vocabulário sofisticado não eleva dificuldade.

**Justificativa:** preserva conceito/decisão; retira extensão seletiva e deixa a fundamentação na explicação. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Problemas encontrados:** correta original seletivamente longa; nenhum problema substantivo remanescente no candidato, com limitações de distratores/anti-IA pontuadas no JSON.

**Advogado do Recurso:** Atransferência parcialCRIC→PACE não prova utilidade externa prospectiva nem causalidade; o candidato não nega a replicação existente. Nenhum argumento plausível restante.

**Eliminatórios:** nenhum dos 10disparado; oJSONlista os 10. **Score:**18/20 — Excelente; as10 dimensões estão pontuadas no JSON. **Árvore:** 0:VERIFICADA/NENHUMA permiteavaliar;1:nenhum eliminatório;2:nenhum recurso plausível restante;3:18/20→aprovada. Ciclo proposto:publicado após revisão independente e implementação autorizada.

**AFTER exato:** `sha256:980e840a25e4da3b8bd4f07fd99961ba4cd19f9614617e20570d0deea06de272`. **Pacote com cards completos:** `sha256:98554c6d83b880a9b7b14f1984ba117e28290cae9ce3687e1f372f506b58ef99`.

```json
{
  "t": "Proteômica CRIC/PACE — Associação não é Alvo Terapêutico",
  "qid": "31926895",
  "q": "Estudo nas coortes CRIC e PACE quantificou 6.287 proteínas por plataforma de afinidade com aptâmeros e identificou um painel associado à mortalidade em hemodiálise. Qual é a interpretação mais segura?",
  "refs": [
    "cric_pace_proteomics_2025"
  ],
  "opts": [
    "É achado prognóstico exploratório, sem demonstrar causalidade ou utilidade para guiar tratamento.",
    "Cada proteína associada passa a ser automaticamente um alvo terapêutico validado",
    "A melhor discriminação interna torna desnecessária validação em outras populações",
    "O estudo demonstra que fatores clínicos tradicionais deixaram de ter valor prognóstico"
  ],
  "ans": 0,
  "exp": "O estudo descreve associações entre proteínas e mortalidade e desempenho prognóstico nas amostras analisadas. Isso não testa se modificar proteínas melhora desfechos nem se usar o painel orienta tratamentos. Os próprios autores pedem validação futura e esclarecimento de possíveis mediadores; melhor discriminação interna não substitui essa etapa.",
  "diff": "easy",
  "cat": "dialise"
}
```

**Referências verificadas:** [P](https://www.nature.com/articles/s41467-025-66763-z) — Abstract; Methods: SomaScan V4.1; Discussion (OPENED_FULL_TEXT)

**Card(s):** cric_pace_proteomics_2025 `sha256:705de532686c00f8b8e66b2fc7d56024a3ca5834986235eb1cbb8f0c46a14026` (12 campos, inalterado). Integrais no JSON.

**Identidade/implementação:** preserva o próprio qid e FSRS. Nenhum parceiro idêntico encontrado na busca dirigida.

**Comprimento:** 143/80/81/86→97/80/81/86; razão 1.663→1.128. Sinal estrutural, sem validação psicométrica.

## 4a72b9b7 — WAK — Prova de Conceito e Limitações Técnicas

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada §18.4 Regra 7.

**OP e classificação:** Interpretar WAK como prova de conceito de curto prazo, reconhecendo limitações técnicas e de generalização. Compreender / Sabe / easy. Distingue viabilidade exploratória de equivalência e disponibilidade, sem cálculo, decisão terapêutica ou síntese clínica avançada.

**Justificativa:** preserva conceito/decisão; retira extensão seletiva e deixa a fundamentação na explicação. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Problemas encontrados:** correta original seletivamente longa; nenhum problema substantivo remanescente no candidato, com limitações de distratores/anti-IA pontuadas no JSON.

**Advogado do Recurso:** Aprévia autorizaçãoFDAera do ensaio exploratório; o texto não a transforma em aprovação comercial. Não há inferência de segurança ampla a partir de7pessoas. Nenhum argumento plausível restante.

**Eliminatórios:** nenhum dos 10disparado; oJSONlista os 10. **Score:**18/20 — Excelente; as10 dimensões estão pontuadas no JSON. **Árvore:** 0:VERIFICADA/NENHUMA permiteavaliar;1:nenhum eliminatório;2:nenhum recurso plausível restante;3:18/20→aprovada. Ciclo proposto:publicado após revisão independente e implementação autorizada.

**AFTER exato:** `sha256:275dc39925872cb6f330a7214afd3e6dc51eebde497c7f247c4cbe1a2621ff3a`. **Pacote com cards completos:** `sha256:7639907eac33fd2cd869c51a9a1a0ad509f05ee8b48e0b6352cd1c5b4dd79464`.

```json
{
  "t": "WAK — Prova de Conceito e Limitações Técnicas",
  "qid": "4a72b9b7",
  "q": "No estudo humano exploratório de 24 horas do wearable artificial kidney (WAK), qual conclusão é mais apropriada?",
  "refs": [
    "wak_gura_2016"
  ],
  "opts": [
    "Demonstrou viabilidade inicial, mas limitações técnicas impediram completar o protocolo em todos.",
    "O dispositivo demonstrou equivalência de longo prazo e já substitui hemodiálise convencional",
    "O protótipo eliminou a necessidade de acesso vascular e de monitorização",
    "O estudo comprovou menor mortalidade, menor custo e ausência de eventos técnicos"
  ],
  "ans": 0,
  "exp": "O estudo incluiu sete participantes; cinco completaram as 24 horas planejadas. Durante o uso, eletrólitos e volume permaneceram controlados e não houve evento adverso grave, apoiando viabilidade inicial. Porém, o ensaio foi interrompido após problemas como bolhas de dióxido de carbono e fluxos variáveis. Assim, o WAK oferece uma prova de conceito experimental de terapia prolongada e portátil, não evidência de segurança duradoura, equivalência clínica, redução de mortalidade, custo inferior ou disponibilidade assistencial.",
  "diff": "easy",
  "cat": "dialise"
}
```

**Referências verificadas:** [W](https://insight.jci.org/articles/view/86397) — Abstract; Results: Device performance and technical complications; Discussion (OPENED_FULL_TEXT)

**Card(s):** wak_gura_2016 `sha256:4c48625648f18a418d7f63679407287f2fa94ba9860d8405d0cd6bed859051f5` (12 campos, inalterado). Integrais no JSON.

**Identidade/implementação:** preserva o próprio qid e FSRS. Nenhum parceiro idêntico encontrado na busca dirigida.

**Comprimento:** 146/92/72/80→97/92/72/80; razão 1.587→1.054. Sinal estrutural, sem validação psicométrica.

## ed78156f — Hemodiálise — Alcalemia Pós-Diálise e Bicarbonato

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada §18.4 Regra 7.

**OP e classificação:** Reconhecer alcalemia pós-hemodiálise relacionada ao gradiente de bicarbonato e individualizar a prescrição sem induzir acidose pré-diálise. Aplicar / Sabe como / medium. Integra valores pré/pós e concentração do banho, com decisão de reavaliação individual; intermediária, sem distúrbio misto ou cálculo avançado.

**Justificativa:** preserva conceito/decisão; retira extensão seletiva e deixa a fundamentação na explicação. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Problemas encontrados:** correta original seletivamente longa; nenhum problema substantivo remanescente no candidato, com limitações de distratores/anti-IA pontuadas no JSON.

**Advogado do Recurso:** Aresposta não atribui causalidade exclusiva ao banho nem prescreve dose fixa; mantém confirmação e acompanhamento antes/depois. Nenhum argumento plausível restante.

**Eliminatórios:** nenhum dos 10disparado; oJSONlista os 10. **Score:**18/20 — Excelente; as10 dimensões estão pontuadas no JSON. **Árvore:** 0:VERIFICADA/NENHUMA permiteavaliar;1:nenhum eliminatório;2:nenhum recurso plausível restante;3:18/20→aprovada. Ciclo proposto:publicado após revisão independente e implementação autorizada.

**AFTER exato:** `sha256:33d4e10572c7e8f4db85d483059ed241238d35a18ed5fb016ca18eb3ce09a86b`. **Pacote com cards completos:** `sha256:e714cd35ff9d4718722e593280f89120c78c1e9e581e88a9347c339078244ba8`.

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
    "A hemodiálise não altera o equilíbrio ácido-base, portanto o resultado confirma erro laboratorial",
    "A concentração do dialisato deve ser aumentada para corrigir a elevação do pH",
    "Toda pessoa com alcalemia pós-diálise deve receber o menor bicarbonato disponível, independentemente do valor pré-diálise"
  ],
  "ans": 0,
  "exp": "O gradiente entre dialisato e sangue transfere bicarbonato durante a sessão. Park et al. observaram alcalemia com 37 mEq/L; com banhos baixos, houve perda de bicarbonato ou maior acidemia pré-diálise. Assim, o achado é compatível com a prescrição, mas exige confirmar a amostra e individualizar o ajuste, acompanhando também os valores antes da sessão.",
  "diff": "medium",
  "cat": "dialise"
}
```

**Referências verificadas:** [B](https://pmc.ncbi.nlm.nih.gov/articles/PMC7311706/) — Abstract; Results study1: acid-base status; Results study2: acid-base status (OPENED_FULL_TEXT)

**Card(s):** park_dialysate_bicarbonate_2020 `sha256:e6326f0cc7d0f9b64e8de13602569c5db535d168cac410aa005ff670caba1563` (12 campos, inalterado). Integrais no JSON.

**Identidade/implementação:** preserva o próprio qid e FSRS. Nenhum parceiro idêntico encontrado na busca dirigida.

**Comprimento:** 186/97/77/121→95/97/77/121; razão 1.537→0.785. Sinal estrutural, sem validação psicométrica.

## 9344c1f1 — Calcifilaxia — Papel do Tiossulfato de Sódio

**Veredito:** aprovada; confiança alta; Evidência VERIFICADA; Pendência NENHUMA; Autorização LIBERADA, derivada §18.4 Regra 7.

**OP e classificação:** Apresentar o papel do tiossulfato na calcifilaxia com incerteza de eficácia e sem substituir o cuidado multimodal. Compreender / Sabe / easy. Diagnóstico dado e pergunta sobre papel/força da evidência de um fármaco, sem dose ou decisão em paciente complexo; básica.

**Justificativa:** preserva conceito/decisão; retira extensão seletiva e deixa a fundamentação na explicação. Nenhum card modificado: vincular todos os12campos aos hashes presentes. Qualquer mudança de card/material exige nova avaliação.

**Problemas encontrados:** correta original seletivamente longa; nenhum problema substantivo remanescente no candidato, com limitações de distratores/anti-IA pontuadas no JSON.

**Advogado do Recurso:** Aincerteza é propriedade da evidência, não hedging para esconder resposta;Dvai além do desenho das coortes. O antigo distratorantibiótico foi substituído por erro de inferência plausível. Nenhum argumento plausível restante.

**Eliminatórios:** nenhum dos 10disparado; oJSONlista os 10. **Score:**18/20 — Excelente; as10 dimensões estão pontuadas no JSON. **Árvore:** 0:VERIFICADA/NENHUMA permiteavaliar;1:nenhum eliminatório;2:nenhum recurso plausível restante;3:18/20→aprovada. Ciclo proposto:publicado após revisão independente e implementação autorizada.

**AFTER exato:** `sha256:8b90066d3c8bf31a523c97ec637f1cb3457881eb7d01cc2dbd5c175e2fbc6612`. **Pacote com cards completos:** `sha256:cd500bbf801761cfe2f35b031a2b5883400330a8ddd1f062d0cc0d3571942303`.

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
    "É tratamento de primeira linha com benefício comprovado em cicatrização e sobrevida.",
    "Seu uso dispensa controlar cálcio e fósforo, pois resolve diretamente a calcificação vascular.",
    "A ausência de benefício nas coortes demonstra ineficácia em qualquer paciente."
  ],
  "ans": 0,
  "exp": "O tiossulfato é usado off-label, mas a metanálise de coortes não demonstrou melhora comparativa de cicatrização ou sobrevida. A evidência observacional tem limitações e não equivale a ensaio randomizado conclusivo. Seu uso, quando escolhido, é individualizado e acompanha o cuidado dos demais fatores da calcifilaxia; não substitui o manejo multimodal.",
  "diff": "easy",
  "cat": "dialise"
}
```

**Referências verificadas:** [S](https://pmc.ncbi.nlm.nih.gov/articles/PMC10134003/) — KeyPoints; Abstract: Results; Introduction; Discussion (OPENED_FULL_TEXT)

**Card(s):** calciphylaxis_sts_meta_2023 `sha256:1cdf0dbadd1a5a6fd592d996f37562d2ad22f4236e98e32dc150287bcdf38373` (12 campos, inalterado). Integrais no JSON.

**Identidade/implementação:** preserva o próprio qid e FSRS. db4ddc30 é reconhecimento clínico de calcifilaxia e manejo de risco; esteitemdiagnósticodado examina apenas o papel da terapia.

**Comprimento:** 139/87/70/77→85/84/94/78; razão 1.598→0.904. Sinal estrutural, sem validação psicométrica.

Nenhum arquivo de produção foi escrito. Não foram aplicados AFTERs históricos por antiguidade.
