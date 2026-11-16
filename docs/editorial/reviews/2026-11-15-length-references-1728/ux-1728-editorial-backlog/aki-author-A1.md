# Lesão renal aguda —13candidatos formais

Revisão autoral, não independente. Questões e cards propostos têm veredito aprovada, evidência VERIFICADA, pendência clínica NENHUMA, publicação LIBERADA autoral; aguardam revisão independente dos bytes exatos. O formato legado do card ADQI foi preservado até adjudicação.

| QID | Objetivo |
|---|---|

|31619574|Interpretar biomarcador de dano como complemento de risco, sem confundir com diagnóstico etiológico ou estágio funcional.|

|e6ac4417|Interpretar resposta ao teste de furosemida como prognóstico, preservando limites e segurança.|

|b9a4c86b|Rejeitar dopamina em dose renal para prevenção ou tratamento de lesão renal aguda.|

|aef8aed3|Aplicar a recomendação ACR de metformina no contraste iodado intravenoso com filtração estável e sem lesão aguda.|

|c8fe26fb|Planejar profilaxia individualizada em angiografia coronária de paciente de alto risco renal.|

|8d14de2e|Interpretar segurança renal e eventos adversos do alvo pressórico intensivo sem transformar poucos eventos em equivalência.|

|1fd0fd0d|Aplicar ferramenta de volume/depuração no planejamento de contraste em intervenção coronária.|

|9299c585|Distinguir dose prescrita, entregue e remoção líquida na terapia renal substitutiva contínua.|

|54f94df4|Planejar tomografia intravenosa necessária em alto risco renal, preservando profilaxia e qualidade diagnóstica.|

|028f2492|Interpretar índices urinários sob diurético sem substituir avaliação etiológica e volêmica.|

|e6e7a604|Planejar vigilância e reposição individualizada na recuperação incompleta após lesão renal aguda.|

|ab2ba313|Interpretar o resultado da acetilcisteína no PRESERVE sem inventar benefício em componente ou interação.|

|95c81f1d|Usar a relação BUN/creatinina como apoio à triagem, respeitando sensibilidade e especificidade.|

## 31619574

```json
{
  "t": "NGAL na Estratificação de LRA",
  "qid": "31619574",
  "q": "Em paciente hospitalizado de alto risco, a lipocalina associada à gelatinase de neutrófilos (NGAL) urinária se eleva antes de ocorrer aumento diagnóstico da creatinina. Como interpretar o achado?",
  "refs": [
    "aki_biomarker_meta_2022",
    "kdigo_aki"
  ],
  "opts": [
    "Tratar como comprovação de necrose tubular, atribuindo a elevação à causa predominante do caso.",
    "Usar como sinal complementar de risco, integrado à creatinina, diurese e avaliação clínica.",
    "Usar como critério suficiente para estadiar a lesão renal, mesmo com função e diurese preservadas.",
    "Interpretar a elevação como medida direta da queda da filtração, equivalente à creatinina."
  ],
  "ans": 1,
  "exp": "A NGAL pode contribuir para estratificação precoce do risco de lesão renal aguda, mas seu desempenho varia conforme população e cenário. A metanálise não sustenta um ponto de corte universal nem a definição isolada de etiologia ou necrose tubular. Predição de dano e redução da filtração são conceitos diferentes. Os critérios funcionais de creatinina e diurese, a evolução e a avaliação clínica continuam necessários; uma biomarcador positivo não fornece sozinho um estágio funcional.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: A expressão sinal complementar conserva utilidade, sem superestimar especificidade. O comando não pede a etiologia ou um diagnóstico impossível com os dados. A ausência de aumento de creatinina não torna o biomarcador inútil, mas também não basta para o estágio.

Vínculo `sha256:801358fe11f89aad358f6938819496fb3a8d2d079ce81ebd0c96b27a395cabc3`.

## e6ac4417

```json
{
  "t": "Furosemide Stress Test na LRA",
  "qid": "e6ac4417",
  "q": "Paciente euvolêmico com lesão renal aguda inicial, sem obstrução, realiza teste de estresse com furosemida em dose protocolada, com monitorização e reposição de perdas conforme o contexto. Elimina120 mL nas primeiras duas horas. Como interpretar a resposta?",
  "opts": [
    "Maior risco de progressão para estágio3, exigindo vigilância e avaliação clínica da necessidade de diálise.",
    "Predomínio de hipoperfusão reversível, dispensando rever outras causas antes de repetir expansão.",
    "Necessidade de aumentar a dose até superar200 mL, para demonstrar recuperação e reduzir a progressão.",
    "Indicação de iniciar diálise pelo resultado do teste, antes de avaliar alterações clínicas e laboratoriais."
  ],
  "ans": 0,
  "exp": "No estudo piloto original,77 pacientes com lesão renal inicial foram avaliados; diurese abaixo de 200 mL em duas horas discriminou maior risco de progressão para estágio3. Esse achado é prognóstico, não uma indicação isolada de diálise ou confirmação de causa pré-renal. A dose dependia da exposição prévia a diurético de alça. O teste requer volemia adequada, monitorização e prevenção de depleção; repetir diurético até ultrapassar um volume-alvo não demonstrou modificar o curso da lesão. A necessidade de diálise continua baseada em complicações e contexto, não no teste isolado.",
  "diff": "medium",
  "cat": "lra",
  "refs": [
    "furosemide_stress_test",
    "kdigo_aki"
  ]
}
```

Recurso: A ausência de obstrução e a volemia adequada já estão fornecidas, assim como dose protocolada. A opção correta requer vigilância e avaliação; não usa a expressão estágio3 para impor diálise. O relato primário foi corrigido de CJASN/prospectivo isolado para CriticalCare e duas coortes.

Vínculo `sha256:cfbcc6b546a6a3d5c07d1b8e74ab868e54eb7170209c71bda22bdbed2a284168`.

## b9a4c86b

```json
{
  "t": "Dopamina em Dose Renal",
  "qid": "b9a4c86b",
  "q": "Paciente crítico com LRA oligúrica está hemodinamicamente estável. A equipe considera dopamina em baixa dose apenas para aumentar a diurese e proteger os rins. Qual avaliação é correta?",
  "refs": [
    "anzics_dopamine_2000",
    "kdigo_aki"
  ],
  "opts": [
    "Usar infusão de baixa dose como prevenção da necessidade de diálise enquanto persistir oligúria.",
    "Evitar a estratégia de dose renal: aumentar urina não demonstrou proteção renal clínica.",
    "Usar baixa dose para reduzir o pico de creatinina, benefício primário demonstrado no ANZICS.",
    "Usar a resposta diurética inicial para selecionar quem obterá benefício de sobrevida com a infusão."
  ],
  "ans": 1,
  "exp": "O ANZICS comparou dopamina intravenosa em baixa dose com placebo e não demonstrou redução do pico de creatinina, da necessidade de terapia renal substitutiva ou de mortalidade. A eventual mudança da diurese não prova proteção renal. A KDIGO recomenda não usar dopamina em baixa dose para prevenir ou tratar lesão renal aguda. O caso descreve estabilidade hemodinâmica e uma intenção exclusiva de nefroproteção; a escolha de vasopressor para choque é outra decisão.",
  "diff": "easy",
  "cat": "lra"
}
```

Recurso: A estabilidade afasta necessidade de vasopressor. O item não afirma que dopamina jamais possa ter outra indicação: rejeita somente a intenção renal proposta. Os erros foram substituídos por interpretações clínicas plausíveis do mesmo estudo, sem comparação absurda com noradrenalina em qualquer dose.

Vínculo `sha256:4dc82e71e74465ef9c8d480eb68722ff557b2f7e4fb65b11d2f7706474d5c473`.

## aef8aed3

```json
{
  "t": "Metformina e Contraste Iodado Intravenoso",
  "qid": "aef8aed3",
  "q": "Paciente em uso de metformina tem taxa de filtração glomerular estimada estável de 40 mL/min/1,73 m² e não apresenta lesão renal aguda. Fará tomografia com contraste iodado intravenoso. Segundo o American College of Radiology (ACR), qual conduta é adequada?",
  "refs": [
    "acr_manual_iodinated_2026"
  ],
  "opts": [
    "Manter metformina, sem controle obrigatório da creatinina motivado apenas por essa exposição.",
    "Suspender por 48 horas e retomar somente após creatinina, mesmo sem mudança clínica ou renal.",
    "Manter até o exame, mas suspender obrigatoriamente por 48 horas depois, independentemente da evolução.",
    "Condicionar a manutenção da metformina à troca do contraste intravenoso por outro tipo de contraste."
  ],
  "ans": 0,
  "exp": "Na categoriaI do ACR, sem lesão renal aguda e com filtração estimada de pelo menos 30 mL/min/1,73 m², não é necessário suspender metformina para contraste iodado intravenoso nem repetir obrigatoriamente a função renal apenas por essa exposição. A preocupação é o acúmulo do medicamento se houver disfunção renal aguda, não uma interação química direta com o contraste. A categoriaII inclui lesão renal aguda, filtração abaixo de 30 e certos cateterismos arteriais com risco de embolização renal; nesses casos a suspensão e reavaliação são necessárias. A pergunta especifica o ACR porque bulas e políticas locais podem ser mais conservadoras.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: O comando fixa a fonte e a via intravenosa. Um protocolo mais conservador não compete como segunda resposta correta, pois não é a recomendação solicitada. A correta preserva reavaliação se houver mudança clínica, em vez de dispensar todo acompanhamento.

Vínculo `sha256:bcfcbaccab8b027b167d172390b767be3c93bc1865d978485d0c4e4a5c7c3b9e`.

## c8fe26fb

```json
{
  "t": "Injúria Renal Aguda",
  "qid": "c8fe26fb",
  "q": "Homem de 68 anos com doença renal crônica, filtração estimada estável de 24 mL/min/1,73 m² e sem congestão será submetido a angiografia coronária necessária. Qual plano preventivo tem melhor respaldo?",
  "refs": [
    "scai_ciaki_qi_2025",
    "preserve_study",
    "acr_manual_iodinated_2026"
  ],
  "opts": [
    "Acrescentar acetilcisteína oral à hidratação por benefício clínico demonstrado no PRESERVE.",
    "Preferir bicarbonato intravenoso à salina por redução comprovada de morte ou diálise.",
    "Individualizar salina isotônica e reduzir contraste e exposições nefrotóxicas evitáveis.",
    "Usar furosemida profilática em vez de hidratação, para aumentar eliminação do contraste."
  ],
  "ans": 2,
  "exp": "Na angiografia coronária de alto risco, recomendações da SCAI priorizam expansão com solução isotônica ajustada à volemia, controle do volume de contraste e correção de fatores modificáveis. A ausência de congestão permite considerar salina, mas o regime deve ser individualizado. O PRESERVE não demonstrou benefício clínico de bicarbonato sobre salina nem de acetilcisteína sobre placebo. Diurese forçada isoladamente não substitui essa avaliação. A via intra-arterial tem riscos e técnicas próprias; não se deve transportar sem crítica uma regra elaborada para tomografia intravenosa. Uma elevação posterior de creatinina seria associação temporal e exigiria investigar outras causas.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: O risco basal e a ausência de congestão agora são explícitos; o antes/depois retrospectivo não força causalidade. A utilidade da variação frente a54f94df4 está em angiografia intra-arterial versus tomografia intravenosa, cujos consensos não são intercambiáveis. Mesma decisão central: o revisor deve decidir se a variação de contexto é útil pelas quatro dimensões do§15, em vez de inventar outroOP.

Vínculo `sha256:19dd8b7f2e3c3d0fa5af238e8dc293075de4462a07e8bf09324d050263a9f3e5`.

## 8d14de2e

```json
{
  "t": "Segurança Renal no BPROAD",
  "qid": "8d14de2e",
  "q": "No BPROAD, pessoas com diabetes tipo 2 e risco cardiovascular aumentado foram randomizadas para pressão sistólica alvo abaixo de 120 ou 140 mmHg. Como interpretar os eventos adversos?",
  "refs": [
    "bproad"
  ],
  "opts": [
    "A meta intensiva aumentou significativamente insuficiência renal aguda, acompanhando mais hipercalemia.",
    "Eventos renais agudos foram raros; houve mais alertas de potássio alto e hipotensão sintomática no intensivo.",
    "A semelhança dos eventos graves demonstra equivalência renal e dispensa monitorização adicional.",
    "A ausência de diferença renal elimina preocupação com hipotensão, ainda que a pressão caia rapidamente."
  ],
  "ans": 1,
  "exp": "Na tabela3 do BPROAD, insuficiência renal aguda ocorreu em quatro versus cinco participantes; o intervalo de confiança foi amplo e não demonstra equivalência ou ausência de dano. Eventos graves globais foram semelhantes. Hipotensão sintomática foi numericamente mais frequente, oito versus um caso, e potássio acima de 5,5 mmol/L ocorreu em 177 versus 125 participantes. Portanto, o benefício cardiovascular do alvo intensivo exige vigilância, e não autoriza afirmar aumento comprovado de lesão renal aguda ou dispensar monitorização pela raridade observada.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: A correta descreve frequência, sem dizer que oito versus um prova aumento com precisão. A expressão eventos renais agudos remete à condição de interesse insuficiência renal aguda da tabela, não a todos os desfechos renais secundários. A frase raro não é sinônimo de seguro para todo paciente.

Vínculo `sha256:fee4ee5f845c3efbf63349f816842a02c8bea4d7ef9305797cf2f88bcf347c96`.

## 1fd0fd0d

```json
{
  "t": "Angiografia Coronária — Planejamento do Volume de Contraste",
  "qid": "1fd0fd0d",
  "q": "Paciente com doença renal crônica será submetido a intervenção coronária percutânea. Segundo a SCAI, como usar a função renal para planejar o volume de contraste?",
  "refs": [
    "scai_ciaki_qi_2025"
  ],
  "opts": [
    "Usar razão volume/depuração de creatinina abaixo de 3, idealmente abaixo de 2, preservando imagens essenciais.",
    "Usar razão volume/depuração abaixo de 10 quando a expansão isotônica estiver programada.",
    "Aplicar o mesmo limite volume/filtração a toda tomografia intravenosa, sem considerar a via.",
    "Substituir o limite de volume pela escolha de contraste de baixa osmolalidade, sem controle do total."
  ],
  "ans": 0,
  "exp": "A SCAI propõe, no laboratório de hemodinâmica, razão volume de contraste/depuração calculada de creatinina abaixo de 3 e, idealmente, abaixo de 2. É uma ferramenta de planejamento e alerta, não garantia individual de risco zero. Técnicas de economia de contraste devem preservar informação diagnóstica indispensável. Hidratação e escolha do meio não tornam o volume irrelevante. A recomendação não estabelece limite causal universal para qualquer tomografia intravenosa.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: A fonte e o cenário estão explícitos. A razão de ultrabaixo contraste com filtração estimada citada separadamente na SCAI não torna correta uma regra universal para TC. Os distratores representam extrapolações e compensações indevidas, sem negar que a osmolalidade também importe.

Vínculo `sha256:6422af85bbfac9272807d7fa4f946d0e3532fb0f78c7398d2f7ab4dc373b10d0`.

## 9299c585

```json
{
  "t": "Terapia Renal Substitutiva Contínua — Dose Entregue",
  "qid": "9299c585",
  "q": "Paciente crítico com lesão renal aguda inicia terapia renal substitutiva contínua. Qual prescrição melhor favorece a dose de efluente efetivamente entregue recomendada pela KDIGO?",
  "refs": [
    "kdigo_aki"
  ],
  "opts": [
    "Prescrever acima da meta e auditar a entrega de 20–25 mL/kg/h, considerando interrupções.",
    "Prescrever20–25 mL/kg/h e considerar suficiente a programação, mesmo quando há pausas frequentes.",
    "Entregar40–50 mL/kg/h rotineiramente, esperando redução de mortalidade pela maior depuração.",
    "Usar a ultrafiltração líquida como medida da dose, ajustando efluente apenas se houver edema."
  ],
  "ans": 0,
  "exp": "A KDIGO recomenda entregar efluente de 20–25 mL/kg/h na terapia contínua para lesão renal aguda. Pausas e problemas do circuito podem reduzir a entrega; por isso, costuma ser necessário prescrever uma taxa maior e medir a dose efetiva. A intensificação rotineira não demonstrou benefício de sobrevida nos grandes ensaios discutidos pela diretriz. Ultrafiltração líquida é a remoção de volume do paciente; não equivale ao efluente usado para expressar a dose de depuração. A prescrição deve atender também às necessidades eletrolíticas, ácido-base e volêmicas individuais.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: Acima da meta refere-se à taxa programada necessária para entregar a meta, não a intensificar indefinidamente. A correta inclui auditoria. Necessidades excepcionais não são negadas, mas não sustentam40–50 de rotina.

Vínculo `sha256:57c705784f0e331e0dd3a1ba743af51ee763f2be534a499c55d37bd0f2326447`.

## 54f94df4

```json
{
  "t": "Contraste Iodado — Profilaxia em Alto Risco",
  "qid": "54f94df4",
  "q": "Paciente com taxa de filtração glomerular estimada estável de 24 mL/min/1,73 m², fora de diálise e sem insuficiência cardíaca descompensada, precisa de tomografia contrastada clinicamente necessária. Segundo o consenso ACR–NKF, qual plano é adequado?",
  "refs": [
    "acr_nkf_iodinated_2020"
  ],
  "opts": [
    "Individualizar salina intravenosa e manter dose de contraste suficiente para diagnóstico.",
    "Reduzir empiricamente o contraste abaixo da dose diagnóstica, priorizando o menor volume possível.",
    "Adiar o exame até a filtração ultrapassar30, mesmo quando a informação é necessária agora.",
    "Substituir salina por acetilcisteína oral, evitando expansão mesmo sem contraindicação volêmica."
  ],
  "ans": 0,
  "exp": "O consenso ACR–NKF sobre contraste intravenoso orienta profilaxia com salina isotônica em lesão renal aguda ou filtração estimada abaixo de 30 mL/min/1,73 m², fora de diálise de manutenção e na ausência de contraindicação à expansão. Regime e volume devem considerar urgência e congestão. Um exame necessário não é automaticamente proibido pela filtração baixa. Também não se deve reduzir a dose de contraste de forma improvisada abaixo de um limiar diagnóstico: um estudo não diagnóstico pode causar dano. O consenso distingue associação temporal de causalidade e não se aplica automaticamente à angiografia intra-arterial.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: Sem insuficiência cardíaca descompensada não significa que qualquer volume fixo seja seguro: a correta mantém individualização. A dose diagnóstica evita a interpretação de que o menor volume sempre é melhor. A variação frente ac8 é de via e aplicação da recomendação, sujeita a análise independente de utilidade pelo§15.

Vínculo `sha256:f312efadd31d83e0a88a9e24f74d28d669ea71e3db3543dcb3130a38aeb8e548`.

## 028f2492

```json
{
  "t": "FEureia sob Diurético",
  "qid": "028f2492",
  "q": "Paciente oligúrico em uso de furosemida apresenta lesão renal aguda, fração de excreção de sódio (FENa) de 1,8% e de ureia (FEureia) de 24%. A avaliação de volemia é incerta e o sedimento não foi revisado. Qual interpretação é mais adequada?",
  "refs": [
    "feurea_meta_2024",
    "fena_meta_2022"
  ],
  "opts": [
    "Priorizar expansão por hipoperfusão confirmada, usando FEureia abaixo de 35% como prova suficiente.",
    "Atribuir o quadro à lesão tubular pela FENa, mesmo com o efeito do diurético sobre o índice.",
    "Integrar os índices à avaliação de perfusão, congestão, sedimento e evolução antes de definir a causa.",
    "Desconsiderar o sedimento e usar a discordância dos índices para classificar o quadro como pós-renal."
  ],
  "ans": 2,
  "exp": "Diuréticos reduzem a especificidade da FENa, mas a FEureia também tem acurácia limitada. Na metanálise de 2024, em pacientes sob diurético ela teve menor sensibilidade e maior especificidade que a FENa, sem superioridade global. Portanto,24% não confirma hipoperfusão nem exclui lesão tubular. A avaliação precisa integrar volemia, perfusão e congestão, sedimento, medicamentos, imagem quando indicada e trajetória clínica. Não se deve impor expansão por um único índice quando o estado volêmico ainda é incerto.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: O caso não fornece congestão ou depleção confirmadas e o gabarito não escolhe tratamento antes da avaliação. A imagem é solicitada quando indicada; não se transforma ultrassom obrigatório em toda LRA.

Vínculo `sha256:b0d5f748a31352fc8bd6f0f80aa6bff6cf03ce9a4bcef66ef4e87179c6e7549a`.

## e6e7a604

```json
{
  "t": "Recuperação após LRA",
  "qid": "e6e7a604",
  "q": "Paciente no 10º dia após LRA grave passa a urinar 3,5 L/dia, mas mantém creatinina 3,1 mg/dL. Qual plano é mais seguro nesta fase?",
  "refs": [
    "kdigo_aki",
    "adqi_akd_2017"
  ],
  "opts": [
    "Usar o aumento da diurese como principal critério de recuperação e adiar exames até três meses.",
    "Repor sempre todo o volume urinário com salina, independentemente de ingestão e congestão.",
    "Acompanhar volume e eletrólitos, individualizar reposição e programar seguimento renal.",
    "Restringir líquidos de forma fixa para manter balanço negativo até a creatinina normalizar."
  ],
  "ans": 2,
  "exp": "Poliúria não demonstra recuperação completa da filtração ou do manejo tubular de água e eletrólitos. Com disfunção persistente no décimo dia, o quadro pertence à janela de doença renal aguda e requer acompanhamento da trajetória, da volemia e das complicações. Reposição deve considerar ingestão, perdas e congestão; nem reposição automática de toda a diurese nem restrição fixa são adequadas a todos. A recomendação de reavaliar em três meses não significa esperar esse prazo sem vigilância em quem permanece com disfunção. O ADQI propõe intensidade de seguimento proporcional à gravidade e ao risco.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: O caso não exige dar um volume numérico sem conhecer ingestão/volemia. O plano correto é monitorar e individualizar, enquanto os distratores representam os três erros frequentes de planejamento. Não se atribui ao ADQI um ensaio de comparação entre regimes de reposição.

Vínculo `sha256:f9ab8a2ff4e0d3f28b546fd28c12a60949f2859f265e2bf4a2aecb994721993a`.

## ab2ba313

```json
{
  "t": "PRESERVE — Acetilcisteína na Profilaxia",
  "qid": "ab2ba313",
  "q": "Segundo o PRESERVE, como interpretar acetilcisteína oral para prevenção de lesão renal associada ao contraste em pacientes de alto risco submetidos a angiografia?",
  "refs": [
    "preserve_study",
    "acr_manual_iodinated_2026"
  ],
  "opts": [
    "O ensaio não demonstrou benefício sobre placebo e não sustenta seu uso profilático rotineiro.",
    "O benefício ocorreu no composto de 90 dias, mas não na lesão renal aguda do período inicial.",
    "A acetilcisteína foi eficaz apenas com bicarbonato, pela interação favorável entre os dois braços.",
    "A redução da diálise foi o achado principal, mesmo sem diferença no composto clínico."
  ],
  "ans": 0,
  "exp": "No PRESERVE, o composto de morte, diálise ou elevação persistente da creatinina em 90 dias ocorreu em 4,6% com acetilcisteína e 4,5% com placebo (OR 1,02; IC95% 0,78–1,33; P=0,88). A lesão renal aguda associada ao contraste também não diferiu significativamente. Não houve interação significativa entre bicarbonato e acetilcisteína para o primário. Assim, o ensaio não sustenta acetilcisteína como profilaxia rotineira e não permite selecionar apenas um componente para anunciar benefício. O desenho e a população devem ser preservados ao aplicar a conclusão; não se trata de provar que qualquer estratégia de prevenção seja inútil.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: Os antigos números de dose arbitrária e recomendações universais foram substituídos por erros de interpretação do desenho e dos desfechos. O item interpreta umRCT, diferente da decisão clínica de plano preventivo do caso c8; se a sobreposição for considerada sem valor útil, consolidar é decisão legítima do revisor.

Vínculo `sha256:e8a9f145b8ed6a62bbec478cb7306af3bee17023776dc32d929a8e98dab6255f`.

## 95c81f1d

```json
{
  "t": "BUN/Creatinina na Hemorragia Digestiva",
  "qid": "95c81f1d",
  "q": "Paciente com melena e tontura apresenta nitrogênio ureico sanguíneo (BUN) de 32 mg/dL e creatinina de 1,0 mg/dL, sem hematêmese. Como usar a relação BUN/creatinina na avaliação?",
  "refs": [
    "bun_creatinine_gi_meta_2026"
  ],
  "opts": [
    "Como apoio à suspeita de origem alta, sem substituir estabilização e investigação indicada.",
    "Como teste suficientemente sensível para excluir origem alta quando a relação estiver abaixo de 30.",
    "Como confirmação de origem alta quando supera30, permitindo dispensar investigação da localização.",
    "Como critério de lesão tubular, atribuindo a elevação da relação à redução seletiva da filtração."
  ],
  "ans": 0,
  "exp": "A relação é32. Na metanálise de 17 estudos, valores acima de 30 tiveram especificidade de 89,3%, mas sensibilidade de 38,8% para hemorragia digestiva alta. Portanto, um valor elevado apoia a suspeita, sem confirmar a localização; um valor abaixo do corte não exclui origem alta. O teste é complementar, sua acurácia global é moderada e não substitui avaliação clínica, estabilização ou endoscopia indicada. O dado fornecido éBUN, não ureia total: as duas concentrações não podem ser usadas de forma intercambiável no mesmo corte.",
  "diff": "medium",
  "cat": "lra"
}
```

Recurso: Melena já levanta suspeita de origem alta; o teste não precisa ensinar um diagnóstico surpresa. A pergunta pede o uso incremental da relação, e não a escolha de uma endoscopia sem considerar estabilidade. Os distratores não usam cólon direito como associação absurda.

Vínculo `sha256:2c63ac200b2dfbc1a6e90f24bd2e38ec482c00e8d53b0fd6ad289b5aa64125e1`.

## Cards completos propostos

### kdigo_aki

```json
{
  "label": "KDIGO AKI 2012",
  "url": "https://kdigo.org/wp-content/uploads/2016/10/KDIGO-2012-AKI-Guideline-English.pdf",
  "journal": "Kidney International Supplements",
  "ano": 2012,
  "tipo": "Diretriz",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Diretriz que estabeleceu a definição e o estadiamento universais da lesão renal aguda",
  "icon": "📋",
  "resumo": "Define LRA por qualquer uma de três rotas: aumento da creatinina sérica ≥0,3 mg/dL em 48 horas; aumento para ≥1,5 vez o basal, conhecido ou presumido nos sete dias anteriores; ou diurese <0,5 mL/kg/h por seis horas. Estratifica a gravidade em três estágios pela creatinina e pela diurese. O estágio 3 inclui creatinina ≥3 vezes o basal, elevação da creatinina para ≥4,0 mg/dL, início de terapia renal substitutiva ou, em menores de 18 anos, taxa de filtração glomerular estimada (TFGe) <35 mL/min/1,73 m².",
  "conclusao": "Os critérios de creatinina e diurese da KDIGO 2012 devem ser aplicados de forma independente: basta uma rota diagnóstica, e o maior estágio atingido define a gravidade.",
  "curiosidade": "A classificação KDIGO harmonizou os sistemas RIFLE e AKIN, permitindo que estudos e serviços comparassem incidência e desfechos de LRA com uma linguagem comum."
}
```

Depois `sha256:75b0caab14c8159f158db97ba508c135ebc23a15c057ecefbd56df51534927cd`.

### furosemide_stress_test

```json
{
  "label": "Chawla et al. — Teste de estresse com furosemida (2013)",
  "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4057505/",
  "journal": "Crit Care. 2013;17(5):R207. DOI:10.1186/cc13015",
  "ano": 2013,
  "tipo": "Coorte",
  "badge": "COHORT",
  "badgeColor": "#f59e0b",
  "impacto": "Resposta urinária abaixo de 200 mL em duas horas associou-se a progressão para lesão renal aguda estágio3.",
  "icon": "🔬",
  "resumo": "Estudo piloto em 77 pacientes críticos com lesão renal aguda inicial, reunindo23 retrospectivos e 54 de coorte prospectiva. Usou furosemida intravenosa 1 mg/kg sem exposição prévia a diurético de alça e 1,5 mg/kg após exposição prévia. A progressão para estágio3 em 14 dias ocorreu em 25 pacientes. Diurese abaixo de 200 mL em duas horas apresentou área sob a curva de 0,87, sensibilidade 87,1% e especificidade 84,1%. O teste exigia volemia adequada, monitorização e reposição das perdas conforme o contexto.",
  "conclusao": "A resposta é prognóstica e não define sozinha etiologia ou indicação de diálise. O estudo piloto não demonstra que administrar furosemida modifique favoravelmente o curso da lesão renal.",
  "curiosidade": "O relato combina duas coortes; chamá-lo apenas de estudo prospectivo omite os23 pacientes retrospectivos. O limiar descrito foi menor que200 mL, não menor ou igual."
}
```

Depois `sha256:e238cd6cc869e0f812ce2c232c54935e96e175b612cef599fda7cece117e174e`.

### anzics_dopamine_2000

```json
{
  "label": "ANZICS — Dopamina em Baixa Dose na Disfunção Renal",
  "url": "https://pubmed.ncbi.nlm.nih.gov/11191541/",
  "journal": "Lancet. 2000;356(9248):2139-2143",
  "ano": 2000,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "Ensaio multicêntrico controlado por placebo que refutou proteção renal clínica pela dopamina em baixa dose",
  "icon": "🔬",
  "resumo": "Ensaio multicêntrico, randomizado, duplo-cego e controlado por placebo em 328 pacientes críticos com resposta inflamatória sistêmica e disfunção renal inicial; 324 foram analisados após quatro exclusões por violação importante do protocolo. Dopamina intravenosa contínua a2 µg/kg/min foi comparada a placebo. O primário, pico de creatinina durante a infusão, foi245 versus 249 µmol/L (P=0,93). Terapia renal substitutiva foi necessária em 35 versus 40 pacientes (P=0,55); houve69 versus 66 mortes. Não foi demonstrada proteção renal clínica.",
  "conclusao": "Aumentar diurese não deve ser confundido com reduzir lesão, diálise ou mortalidade. O resultado não sustenta a antiga estratégia de dopamina em dose baixa para proteção renal.",
  "curiosidade": "O primário era pico de creatinina, não diurese. A recomendação clínica de não usar dopamina em dose baixa para prevenir ou tratar lesão renal aguda consta também da KDIGO 2012."
}
```

Depois `sha256:a811b36c58453cbcc2fc1f1d3d189dd2af5821beac50c3ac8e97de4c1058266f`.

### preserve_study

```json
{
  "label": "PRESERVE Trial",
  "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa1710933",
  "journal": "New England Journal of Medicine",
  "ano": 2018,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "PRESERVE: bicarbonato não superou salina; acetilcisteína não superou placebo",
  "icon": "🔬",
  "resumo": "Ensaio randomizado internacional com desenho fatorial2 × 2 em 5.177 pacientes de alto risco submetidos a angiografia; 4.993 integraram a análise por intenção de tratar modificada. Comparou bicarbonato intravenoso 1,26% com cloreto de sódio 0,9%, e cinco dias de acetilcisteína oral com placebo. O primário foi morte, diálise ou aumento persistente da creatinina de pelo menos 50% aos90 dias. Ocorreu em 4,4% versus 4,7% com bicarbonato/salina (OR 0,93; IC95% 0,72–1,22; P=0,62) e 4,6% versus 4,5% com acetilcisteína/placebo (OR 1,02; IC95% 0,78–1,33; P=0,88). A lesão renal aguda associada ao contraste, desfecho secundário, também não diferiu significativamente.",
  "conclusao": "Nas estratégias e população estudadas, não houve benefício demonstrado do bicarbonato sobre a salina nem da acetilcisteína sobre placebo. O ensaio não sustenta uso rotineiro de acetilcisteína para essa profilaxia.",
  "curiosidade": "A interrupção ocorreu após análise interina pré-especificada. O desfecho clínico aos90 dias deve ser distinguido da lesão renal aguda associada ao contraste, que era secundária."
}
```

Depois `sha256:95768eccf0775fd1bb13a97a8949202b2d9d5e27bd50eaca6a5d1c2ad43a67cd`.

### bproad

```json
{
  "label": "BPROAD Trial",
  "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa2412006",
  "journal": "N Engl J Med 2025;392(12):1155-1167",
  "ano": 2025,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "Meta sistólica intensiva reduziu eventos cardiovasculares; os poucos eventos renais agudos não provam ausência de risco.",
  "icon": "🔬",
  "resumo": "Ensaio randomizado com 12.821 adultos de pelo menos 50 anos, diabetes tipo 2, pressão elevada e risco cardiovascular aumentado, em 145 centros chineses. Comparou pressão sistólica alvo abaixo de 120 ou 140 mmHg, com adjudicação de desfechos cega. Em mediana de 4,2 anos, o composto cardiovascular primário ocorreu em 393 versus 492 participantes (HR 0,79; IC95% 0,69–0,90; P<0,001). Eventos adversos graves ocorreram em 36,5% versus 36,3%; insuficiência renal aguda em 4 versus 5 (HR 0,79; IC95% 0,21–2,95). Hipotensão sintomática foi numericamente mais frequente,8 versus 1; potássio acima de 5,5 mmol/L ocorreu em 177 versus 125.",
  "conclusao": "O alvo intensivo reduziu o composto cardiovascular nessa população. A ausência de diferença detectada nos poucos eventos de insuficiência renal aguda não demonstra equivalência ou ausência de dano; requer vigilância de pressão, potássio e função renal.",
  "curiosidade": "O artigo saiu online em 16/11/2024 e no volume de 2025. A tabela3 separa eventos graves e condições que levaram à emergência dos alertas laboratoriais de segurança."
}
```

Depois `sha256:06f78e17292bc3ef8d7b4fd0203a2d4666081351c9ee0cf081220927dd183cde`.

### acr_nkf_iodinated_2020

```json
{
  "label": "ACR–NKF — Contraste iodado intravenoso na doença renal (2020)",
  "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7525144/",
  "journal": "Kidney Med. 2020;2(1):85–93. DOI:10.1016/j.xkme.2020.01.001",
  "ano": 2020,
  "tipo": "Consenso",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Distingue LRA associada de LRA induzida por contraste e restringe profilaxia rotineira a LRA ou TFGe <30",
  "icon": "📋",
  "resumo": "Declarações de consenso conjuntas do American College of Radiology e da National Kidney Foundation. Diferenciam LRA associada ao contraste, relação temporal sem atribuição causal, de LRA induzida por contraste, na qual o agente é considerado causa. O risco do contraste intravenoso moderno foi superestimado por estudos sem controles. Profilaxia com salina isotônica é indicada, na ausência de contraindicação, em LRA ou TFGe inferior a 30 mL/min/1,73 m² fora de diálise de manutenção; pode ser considerada individualmente em alto risco com TFGe de 30–44.",
  "conclusao": "Não se deve confundir temporalidade com causalidade nem cancelar automaticamente exame necessário. Quando profilaxia é indicada, salina isotônica é a estratégia preferida e o risco de congestão deve ser ponderado.",
  "curiosidade": "Uma das principais mudanças conceituais foi linguística: trocar 'nefropatia por contraste' por termos que separam associação de causalidade reduziu a impressão de que todo aumento de creatinina pós-TC foi provocado pelo exame."
}
```

Depois `sha256:7fa3b7a16674eeb3012c304889c57b99a5018824ce613b26cf2c13bc21c35bee`.

### aki_biomarker_meta_2022

```json
{
  "label": "Pan et al. — Biomarcadores para Predição de LRA",
  "url": "https://pubmed.ncbi.nlm.nih.gov/36371256/",
  "journal": "Critical Care. 2022;26:349",
  "ano": 2022,
  "tipo": "Metanálise",
  "badge": "META",
  "badgeColor": "#0ea5e9",
  "impacto": "110 estudos e 38.725 pacientes comparando NGAL, KIM-1, L-FABP, IL-18 e TIMP-2 × IGFBP7",
  "icon": "🔬",
  "resumo": "Metanálise de 110 estudos com 38.725 adultos hospitalizados sobre biomarcadores para predição de lesão renal aguda. Medidas contendo lipocalina associada à gelatinase de neutrófilos (NGAL) apresentaram o melhor desempenho global, mas a acurácia variou por população, contexto clínico e ajuste pela creatinina urinária. Em pacientes críticos, os marcadores avaliados tiveram desempenho semelhante. A análise de predição não demonstra etiologia ou benefício de substituir os critérios funcionais.",
  "conclusao": "NGAL pode complementar a identificação precoce de risco ou dano renal, mas não confirma sozinho etiologia, necrose tubular nem substitui creatinina, diurese e avaliação clínica.",
  "curiosidade": "O melhor marcador não foi uniforme: NGAL urinário se destacou em pacientes clínicos, enquanto a razão NGAL/creatinina teve desempenho mais favorável no subgrupo cirúrgico."
}
```

Depois `sha256:a83850b1451772b3605fda6c65e0c8ba0b295f16d6f5e8795dc5401207816bee`.

### feurea_meta_2024

```json
{
  "label": "FEureia na LRA — Meta-análise 2024",
  "url": "https://pubmed.ncbi.nlm.nih.gov/38768779/",
  "journal": "The American Journal of the Medical Sciences",
  "ano": 2024,
  "tipo": "Metanálise",
  "badge": "META",
  "badgeColor": "#0ea5e9",
  "impacto": "11 estudos e 1.108 pacientes; compara FEureia e FENa, inclusive sob uso de diuréticos",
  "icon": "🔬",
  "resumo": "Metanálise de 11 estudos com 1.108 hospitalizados sobre fração de excreção de ureia (FEureia) e de sódio (FENa). Em oito estudos,915 pacientes, FEureia acima de 35% para lesão renal aguda intrínseca teve sensibilidade 66% (IC95% 49–79) e especificidade 75% (IC95% 60–85). Em quatro estudos,244 usuários de diuréticos, a FEureia teve menor sensibilidade e maior especificidade que a FENa, sem superioridade diagnóstica global.",
  "conclusao": "A FEureia tem utilidade limitada e não deve ser tratada como substituta infalível da FENa em pacientes que receberam diuréticos; ambas precisam ser integradas ao contexto e ao sedimento urinário.",
  "curiosidade": "No subgrupo sob diuréticos, FEureia e FENa trocaram sensibilidade por especificidade, mostrando que nenhum dos dois índices resolve sozinho a etiologia da LRA."
}
```

Depois `sha256:1e5259e833251ee7a446927aeed5ad52fb27c81a29b1f19a449e2d29e8b37c07`.

### fena_meta_2022

```json
{
  "label": "FENa na LRA — Meta-análise 2022",
  "url": "https://pubmed.ncbi.nlm.nih.gov/35545442/",
  "journal": "Clinical Journal of the American Society of Nephrology",
  "ano": 2022,
  "tipo": "Metanálise",
  "badge": "META",
  "badgeColor": "#0ea5e9",
  "impacto": "19 estudos e 1.287 pacientes; quantifica quando a FENa ajuda e quando perde acurácia na diferenciação da LRA",
  "icon": "🔬",
  "resumo": "Metanálise de 19 estudos com 1.287 pacientes sobre fração de excreção de sódio (FENa). Nos15 estudos,872 pacientes, com limiar de 1%, sensibilidade e especificidade agrupadas foram 90% e 82%. Em seis estudos com doença renal crônica ou uso de diurético, foram 83% e 66%; em cinco estudos só de usuários de diurético,80% e 54%. No subgrupo de oligúria sem doença renal crônica nem diurético, foram 95% e 91%.",
  "conclusao": "A FENa é um dado de apoio, mais útil na oligúria sem DRC nem diurético; isoladamente, não confirma hipoperfusão nem exclui lesão tubular.",
  "curiosidade": "O desempenho muito diferente entre os subgrupos explica por que o mesmo corte de 1% pode ser informativo em um paciente e enganoso em outro."
}
```

Depois `sha256:83f1fb1bb23f234718ecba8ac5578d480e04c98bf8e5e01006b4be56b119ccbd`.

### bun_creatinine_gi_meta_2026

```json
{
  "label": "Relação BUN/creatinina na hemorragia digestiva — Meta-análise 2026",
  "url": "https://pubmed.ncbi.nlm.nih.gov/41555211/",
  "journal": "Journal of Gastroenterology and Hepatology",
  "ano": 2026,
  "tipo": "Metanálise",
  "badge": "META",
  "badgeColor": "#0ea5e9",
  "impacto": "17 estudos; avalia a relação BUN/creatinina para distinguir sangramento digestivo alto de baixo",
  "icon": "🔬",
  "resumo": "Metanálise de 17 estudos sobre a relação entre nitrogênio ureico sanguíneo (BUN) e creatinina para distinguir hemorragia digestiva alta e baixa. Acima de 30, a relação teve sensibilidade 38,8% (IC95% 28,1–50,8) e especificidade 89,3% (IC95% 81,0–94,2). No corte estimado de 22, sensibilidade 66,2%, especificidade 71,0% e área sob a curva 0,740. Esses cortes foram estimados nos estudos e não localizam sozinhos o sangramento.",
  "conclusao": "Relação BUN/creatinina elevada favorece fonte digestiva alta, sobretudo em valores mais altos, mas a acurácia é apenas moderada e o resultado não localiza o sangramento de forma confirmatória.",
  "curiosidade": "Elevar o corte de 22 para mais de 30 aumenta a especificidade, mas perde grande parte da sensibilidade — uma ilustração clínica do custo de exigir um teste mais convincente."
}
```

Depois `sha256:bd0be95e025281bb373580e76fb706c6987fed4f8202783a588bfb32bd2d3780`.

## Utilidade e duplicidade

c8/54 compartilham plano central, mas via/cenário podem ser variação útil: ACR–NKFIVexplicitamente excluiIA. A adjudicação independente deve aplicar as quatro dimensões do§15; não se inventouOPnovo para manter a contagem. NACab2interpretaRCTemvez de selecionarplano clínico.

## Fontes e limites

- K: [https://kdigo.org/wp-content/uploads/2016/10/KDIGO-2012-AKI-Guideline-English.pdf](https://kdigo.org/wp-content/uploads/2016/10/KDIGO-2012-AKI-Guideline-English.pdf) — Guideline original completo efetivamente aberto; seções pertinentes lidas. O PDF Cass2014 anteriormente vinculado é uma apresentação e não é tratado como corpo do guideline. §2.1.1–2;§2.3.4;§3.5.1;§5.1.1–2;§5.8.4 e discussão de dose entregue

- N: [https://pubmed.ncbi.nlm.nih.gov/36371256/](https://pubmed.ncbi.nlm.nih.gov/36371256/) — Abstract primário integral NLM lido, não alegado corpo completo. N110/38725, desempenho dos marcadores e heterogeneidade. PMID36371256 Methods/Results/Conclusions

- F: [https://pmc.ncbi.nlm.nih.gov/articles/PMC4057505/](https://pmc.ncbi.nlm.nih.gov/articles/PMC4057505/) — Corpo primário completo aberto e seções de métodos/resultados/segurança lidas; não usado resumo de revisão posterior com números conflitantes. Design:23 retrospectivos+54 prospectivos; dose; volume; cutoff<200/2h; segurança

- D: [https://pubmed.ncbi.nlm.nih.gov/11191541/](https://pubmed.ncbi.nlm.nih.gov/11191541/) — Abstract primário integral do ANZICS efetivamente lido; não alegado corpo Lancet completo. N328/324; primário creatinina; terapia renal substitutiva e mortes

- A: [https://edge.sitecorecloud.io/americancoldf5f-acrorgf92a-productioncb02-3650/media/ACR/Files/Clinical/Contrast-Manual/ACR-Manual-on-Contrast-Media.pdf](https://edge.sitecorecloud.io/americancoldf5f-acrorgf92a-productioncb02-3650/media/ACR/Files/Clinical/Contrast-Manual/ACR-Manual-on-Contrast-Media.pdf) — Manual oficial completo ACR com capa2026 efetivamente aberto; capítulos contraste/lesão renal e metformina lidos. pp43–44: profilaxia/NAC/diuréticos; pp48–49: categoriasI/II e notaFDA

- P: [https://pubmed.ncbi.nlm.nih.gov/29130810/](https://pubmed.ncbi.nlm.nih.gov/29130810/) — Abstract primário integral PRESERVE efetivamente lido. PDF editorial e reprintCDU403; não alegado corpo nem mantida dose exata deNAC que não consta no abstract. Desenho2×2;N5177/4993; primário90dias; OR/IC/P; CA-AKIsecundário

- B: [https://mediacenteratypon.nejmgroup-production.org/NEJMoa2412006.pdf](https://mediacenteratypon.nejmgroup-production.org/NEJMoa2412006.pdf) — Artigo primário integral efetivamente aberto no servidor editorial; corpo e tabela3 lidos. Ano2025 é o volume final; publicação online16/11/2024 está distinguida. Abstract; Methods; Adverse Events; Table3 p11

- S: [https://www.scai.org/quality-improvement-tools/qi-tips/quality-initiatives-prevention-contrast-induced-acute-kidney-0](https://www.scai.org/quality-improvement-tools/qi-tips/quality-initiatives-prevention-contrast-induced-acute-kidney-0) — Recomendação original profissional SCAI de23/01/2025 aberta integralmente; não descrita como ensaio randomizado. Quality measures:hydration; Limit contrast volume; CV/CCC; correctmodifiablefactors; PRESERVE

- C: [https://pmc.ncbi.nlm.nih.gov/articles/PMC7525144/](https://pmc.ncbi.nlm.nih.gov/articles/PMC7525144/) — Consenso original ACR–NKF efetivamente aberto em co-publicação KidneyMedicine. A identificação do card foi alinhada ao URL, sem fabricar publicação nova. Indications for prophylaxis; No ad hoc dose reduction; applicabilityIVnotIA; Table1

- U: [https://pubmed.ncbi.nlm.nih.gov/38768779/](https://pubmed.ncbi.nlm.nih.gov/38768779/) — Abstract primário integral NLM da metanálise FEureia lido. Não alegado corpo completo. 11estudos1108;8/915 FEureia>35;subgrupo4/244comdiurético

- E: [https://pubmed.ncbi.nlm.nih.gov/35545442/](https://pubmed.ncbi.nlm.nih.gov/35545442/) — Abstract primário integral NLM da metanálise FENa lido. Não alegado corpo completo. 19/1287;15/872limiar1%;subgruposDRC/diuréticos/oligúria

- Q: [https://backoffice.biblio.ugent.be/download/8516228/8516231](https://backoffice.biblio.ugent.be/download/8516228/8516231) — Corpo original ADQI16 completo aberto no repositório institucional do coautor; DOI/citação verificados na primeira página. Seções definição/seguimento/medicamentos lidas. Figura4:7–90dias; pp249–250:seguimento conforme risco;Box1:volemia/perfusão/complicações

- G: [https://pubmed.ncbi.nlm.nih.gov/41555211/](https://pubmed.ncbi.nlm.nih.gov/41555211/) — Abstract primário integral NLM da metanálise2026 lido. Não alegado corpo completo. 17estudos;limiar>30:38,8/89,3;limiar22:66,2/71,0/AUC.740

Nenhum reset, cópia de histórico ou mudança de produção. Os consumidores legados dos cards são listados noJSONsem aprovação automática.

SHA256 dos BYTES JSON `111fdcd945a03aeb943a44bfe80b644ce48223cfd5e41df226cd438e3accec38`.
