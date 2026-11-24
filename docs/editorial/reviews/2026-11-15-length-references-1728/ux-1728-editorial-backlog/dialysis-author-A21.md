# Diálise A2.1 — quatro cards corrigidos, oito questões preservadas

A2.1: oito questões idênticas byte a byte ao AFTER do A2; quatro cards reparados, correção prévia de ano FDA/água e IFU preservados. O A2 anterior permanece intocado.

Revisão formal autoral nova: aprovada, confiança alta, VERIFICADA / NENHUMA / LIBERADA derivada de §18.4 Regra 7. Nenhuma aplicação. A revisão independente do root continua necessária.

## kdigo_dialise

Retira a atribuição histórica não conferida a NCDS/morbimortalidade/primeiro estudo e a aproximação universal de 60% do peso. Usa somente recomendações 3.1–3.2. Mantém correção do PII final 2→7.

**Fonte:** [Am J Kidney Dis. 2015;66(5):884–930, documento final](https://www.giovambattistavirga.com/wp-content/uploads/2020/04/KDOQI-Hemodialysis-Guidelines-2015.pdf); PDF p11, recomendações 3.1 e 3.2.

```json
{
  "label": "KDOQI Hemodialysis Adequacy 2015",
  "url": "https://www.ajkd.org/article/S0272-6386(15)01019-7/fulltext",
  "journal": "Am J Kidney Dis 2015;66(5):884-930",
  "ano": 2015,
  "tipo": "Diretriz Clínica (KDOQI/NKF)",
  "badge": "GUIDELINE",
  "badgeColor": "#6366f1",
  "impacto": "Padrão para adequação e prescrição em hemodiálise — alvo Kt/V e dose dialítica mínima",
  "icon": "📋",
  "resumo": "Diretriz KDOQI para adequação da hemodiálise. Para HD três vezes por semana, recomenda spKt/V alvo de 1,4 por sessão, com valor mínimo entregue de 1,2. Aborda avaliação periódica da dose dialítica, estado nutricional e acesso vascular como componentes integrados da qualidade do tratamento.",
  "conclusao": "Define o índice Kt/V como medida-padrão da dose de diálise — base para auditoria e controle de qualidade nos centros de hemodiálise.",
  "curiosidade": "Na hemodiálise três vezes por semana, o alvo de spKt/V é 1,4 e o mínimo entregue é 1,2. Função renal residual significativa pode permitir redução da dose, desde que seja medida periodicamente."
}
```

Antes `sha256:c26f2a6619b28e968fbe811be64a73f9bdc71b65734d5847b1029a4d7f239a9a`; depois `sha256:f94df6a974879e55b35546e2ad2041fa93f0142781cd30933ea0ff09d9f7627e`.

## saha_hd_emergencies_2017

Retira da revisão Saha a orientação de não devolver o sangue, ausente na seção VAE. A medida permanece corretamente atribuída ao IFU Hemoflow F3/F4 no caso delimitado; não foi retirada da segurança do candidato.

**Fonte:** [CJASN 2017;12(2):357–369](https://pmc.ncbi.nlm.nih.gov/articles/PMC5293333/); Venous Air Embolism, tratamento e posição.

```json
{
  "label": "Saha M, Allon M — Hemodialysis Emergencies (CJASN 2017)",
  "url": "https://pubmed.ncbi.nlm.nih.gov/27831511/",
  "journal": "Clinical Journal of the American Society of Nephrology 2017;12(2):357-369",
  "ano": 2017,
  "tipo": "Revisão",
  "badge": "REVIEW",
  "badgeColor": "#8b5cf6",
  "impacto": "Reconhecimento, tratamento e prevenção das emergências relacionadas à hemodiálise",
  "icon": "🔬",
  "resumo": "Revisão clínica das principais emergências da hemodiálise, incluindo síndrome de desequilíbrio e embolia gasosa. O desequilíbrio decorre de gradiente osmótico com edema cerebral após depuração rápida em pacientes de alto risco e deve ser prevenido com início menos eficiente. Na embolia gasosa, a prioridade é interromper a entrada de ar, administrar oxigênio e sustentar a hemodinâmica; posição supina é favorecida para suporte, reservando decúbito lateral esquerdo quando se tenta aspirar ar por cateter já existente.",
  "conclusao": "Sintomas neurológicos no início da diálise e colapso respiratório após alarme de ar exigem respostas distintas, rápidas e protocolizadas, além de investigação de outras causas e análise da origem do evento.",
  "curiosidade": "Com detectores modernos, embolia gasosa sintomática tornou-se muito rara; episódios descritos costumam envolver falha de conexão, priming inadequado ou ausência de clampeamento."
}
```

Antes `sha256:0f5f54e80d3be64f93dbf9194ed640369bf4da5828da6aeaad0b8c4125d48ce6`; depois `sha256:8c2a7832e16e9be3675207560d0c3f806886f909ac535ba213ddc8b42cd5d6a1`.

## pisces_study

Corrige a formulação: 4 g de óleo de peixe não são 4 g de ácidos graxos n−3. Expande EPA/DHA na primeira ocorrência. Doses conferidas no documento primário integral do editor.

**Fonte:** [Publicado 07/11/2025 e atualizado 25/11/2025; edição 2026;394(2):128–137](https://mediacenteratypon.nejmgroup-production.org/NEJMoa2513032.pdf); p1–2, Methods/intervention.

```json
{
  "label": "Lok et al. — PISCES",
  "url": "https://pubmed.ncbi.nlm.nih.gov/41201837/",
  "journal": "N Engl J Med. 2026;394(2):128-137",
  "ano": 2026,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "1.228 participantes em hemodiálise; óleo de peixe reduziu a taxa total de eventos cardiovasculares graves (HR 0,57)",
  "icon": "🔬",
  "resumo": "Ensaio randomizado, duplo-cego e controlado por placebo realizado em 26 centros do Canadá e da Austrália. Foram incluídos 1.228 adultos em hemodiálise de manutenção, que receberam diariamente 4 g de óleo de peixe, fornecendo 1,6 g de ácido eicosapentaenoico (EPA) e 0,8 g de ácido docosa-hexaenoico (DHA), ou placebo de óleo de milho. Em 3,5 anos, a taxa total de eventos cardiovasculares graves foi 0,31 versus 0,61 por 1.000 pacientes-dia (HR 0,57; IC 95% 0,47–0,70). O composto incluiu morte cardíaca, infarto fatal ou não fatal, AVC fatal ou não fatal e doença vascular periférica com amputação. Sangramento grave ocorreu em 4,8% versus 7,6%, sem sinal de excesso no grupo intervenção.",
  "conclusao": "Na população e formulação estudadas, o PISCES demonstrou menor carga de eventos cardiovasculares graves com óleo de peixe; o resultado não deve ser extrapolado automaticamente a qualquer suplemento, dose ou população.",
  "curiosidade": "O artigo foi publicado on-line em novembro de 2025 e na edição impressa de janeiro de 2026. O desfecho principal contou eventos recorrentes, capturando a carga cardiovascular total em vez de apenas o primeiro evento."
}
```

Antes `sha256:836d10b4aab744ea326218e28490bab7d5064a6ae7e6c1b078a0f85a6914a6f8`; depois `sha256:a7dfdca79947e3f3eb8bf71facda7bbdda929cb034632aa32c20ae98d1250bc7`.

## fda_breakthrough_devices_2026

Retira estatísticas de março/2026 não localizadas e as substitui por um fato operacional expresso no documento oficial, sem criar contagem nova.

**Fonte:** [Página oficial consultada 15/11/2026](https://www.fda.gov/medical-devices/how-study-and-market-your-device/breakthrough-devices-program); When do I request a Breakthrough Device designation? Parágrafo: before sending your marketing submission.

```json
{
  "label": "FDA — Breakthrough Devices Program (2026)",
  "url": "https://www.fda.gov/medical-devices/how-study-and-market-your-device/breakthrough-devices-program",
  "journal": "U.S. Food and Drug Administration",
  "ano": 2026,
  "tipo": "Documento regulatório oficial",
  "badge": "REG",
  "badgeColor": "#2563eb",
  "impacto": "Significado, critérios e limites da Breakthrough Device Designation",
  "icon": "📋",
  "resumo": "O programa voluntário acelera desenvolvimento, avaliação e revisão de dispositivos destinados a doenças graves ou irreversivelmente debilitantes. A designação oferece interação adicional com o FDA e revisão priorizada de submissões futuras, preservando os padrões legais aplicáveis a PMA, 510(k) ou De Novo.",
  "conclusao": "Breakthrough Device Designation é um mecanismo de desenvolvimento e revisão; o dispositivo ainda precisa obter a autorização de mercado apropriada antes de ser comercializado.",
  "curiosidade": "O pedido de designação pode ser apresentado antes de enviar a submissão para autorização de mercado, conforme a etapa de desenvolvimento do dispositivo."
}
```

Antes `sha256:807bc4814bbc9ba1f111b43386256836a9d887aa4fa33f334a00edb86c84ae56`; depois `sha256:79c14f121ff0222ab1247e51f5a770ec327eec4641a660ef8fe3772da40af4a0`.

## Vínculos das oito questões

- f5e0666b: AFTER inalterado `sha256:eea1653836f4dfc774744b3671f09911f8ded00c9e03bdf56c09d67cdd1d7dcd`; pacote novo `sha256:dc8c837e15f9aa156a504a37e5c8cfdd557d2f1a970891efa80078609590ebc0`.

- 6ffa0ff0: AFTER inalterado `sha256:be38def0cbaa0e953ee58e74e6cffe2fc99d45e44af13890adc0d5a00c74f44d`; pacote novo `sha256:299111a72fac423581688333dbd5cccb7cefe3779fc937a7037ecc2257283ec9`.

- 4ea80768: AFTER inalterado `sha256:a5be1af3e386523694f71e36d63a9a22c99c32da8c1ffcc159e1373006b7ec02`; pacote novo `sha256:c769096c41e2ba42f82e76710f2cced2ddd0440069b25836291fef8a3281406d`.

- ff4c8b9e: AFTER inalterado `sha256:fbafba584c0db753c045bbab70ba7f7c17096399f26e445310c6965561f37300`; pacote novo `sha256:247b46fe893969d800dc8f63b95d6dde7229938d738e81e1a8ed8256e5bb742a`.

- c7abfaf3: AFTER inalterado `sha256:74d4417b49b090bfedb04da2d5ae0e8d392eace992a5d371cb6f17f0cd0f83b7`; pacote novo `sha256:7d38c89157ea0ec830933699e5df5f0a73f1327a6d4a0c4f7f3cb48c4ff2a821`.

- ef4e119e: AFTER inalterado `sha256:72336c58e9dd3332c1dda771fa3b8e63f359af8108b52022721fa89ba3e3fb82`; pacote novo `sha256:4414df9c59350d7f0c50bf34121092208fbabae4a5bca5e2cda6674917546572`.

- f77abde0: AFTER inalterado `sha256:e611372e05725b9a9f1cb037344d18a1807764219b36708a26d88d49fa30ae53`; pacote novo `sha256:26bdf0ed27e0092e18c6bd54cf6626a93aed42e59895d4809e6ba6cb299b2b76`.

- cbfdb00a: AFTER inalterado `sha256:8807e1f279e1c51da1542d8e0935ef77a449d4d2c8cd9a6aed1548f6e6401a76`; pacote novo `sha256:bbd821ed54fd6c626b4b9361595d34caa645263d76f3d8b7f431be7da4c9c2ca`.

Os 12 campos do card de água corrigido e do IFU também constam do JSON. A3.1 contém os dois candidatos que antes estavam bloqueados; o registro do A2 não os libera por herança.

SHA256 dos BYTES JSON via crypto.update(Buffer): `f71076fcdf160b0719d1a6d25ef77ba9525ff377fafc8c4022f33344eb7534cc`.
