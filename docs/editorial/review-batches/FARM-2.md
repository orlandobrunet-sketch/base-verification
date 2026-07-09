# Lote de revisão — FARM-2

## Identificação

- **Lote:** FARM-2
- **Domínio:** farmacologia / nefrotoxicidade e meios de contraste
- **Estado:** ENCERRADO
- **Versão inicial:** 12.59
- **Versão final:** 12.62
- **Contagem final:** 987 questões · 987 qids únicos · 174 cards · 0 referências órfãs

Tema: nefrotoxicidade por agentes oncológicos e radiológicos — inibidores de checkpoint imunológico (ICI), cisplatina, contraste iodado e gadolínio. Duas duplas de duplicidade foram investigadas e fundidas.

## Itens

| qid        | tema             | decisão                    | publicação    | PR   |
| ---------- | ---------------- | -------------------------- | ------------- | ---- |
| `2acaa158` | ICI/NIA          | preservado e reconstruído  | LIBERADA      | #572 |
| `5542579b` | ICI/NIA          | aposentado por duplicidade | não aplicável | #572 |
| `9545bb60` | cisplatina       | reconstruído               | LIBERADA      | #573 |
| `b9e26e47` | contraste iodado | preservado e reconstruído  | LIBERADA      | #574 |
| `9c831bdc` | contraste iodado | aposentado por duplicidade | não aplicável | #574 |
| `03b3db65` | gadolínio/FSN    | reconstruído               | LIBERADA      | #574 |

## Pacotes liberados (gate editorial)

Os objetos integrais já estão implementados no `main`; não são copiados aqui. Registro do gate por qid publicado:

### `2acaa158` — Nefrite intersticial aguda (NIA) por inibidores de checkpoint
- Evidência: VERIFICADA · Pendência: NENHUMA · NQ Editorial Score: 18/20
- Veredito: aprovada (par de fusão — sobrevivente) · Publicação: LIBERADA
- Competência preservada: reconhecimento e manejo da LRA/NIA por ICI (suspender o ICI + glicocorticoide; retirar outras causas de NIA; rechallenge individualizado).
- Decisão qid/FSRS: **preservar** (mesmo objetivo pedagógico e conceito correto).

### `9545bb60` — Prevenção da nefrotoxicidade por cisplatina
- Evidência: VERIFICADA · Pendência: NENHUMA · NQ Editorial Score: 18/20
- Veredito: aprovada · Publicação: LIBERADA
- Competência preservada: pedra angular da prevenção (hidratação IV com salina isotônica; magnésio/manitol como adjuntos, com linguagem proporcional à evidência).
- Decisão qid/FSRS: **preservar**.

### `b9e26e47` — Prevenção de LRA associada a contraste iodado
- Evidência: VERIFICADA · Pendência: NENHUMA · NQ Editorial Score: 18/20
- Veredito: FUNDIR/aprovada (par de fusão — sobrevivente) · Publicação: LIBERADA
- Competência preservada: prevenção de LRA associada a contraste em paciente de alto risco (expansão volêmica IV com salina isotônica; NAC/bicarbonato/diálise profilática refutados).
- Decisão qid/FSRS: **preservar**.

### `03b3db65` — Gadolínio e fibrose sistêmica nefrogênica (FSN)
- Evidência: VERIFICADA · Pendência: NENHUMA · NQ Editorial Score: 18/20
- Veredito: aprovada · Publicação: LIBERADA
- Competência preservada: principal risco do gadolínio na DRC avançada e estratificação de segurança dos agentes (FSN; preferência pelo Grupo II; sem iniciar/alterar diálise nem sessão extra pelo exame).
- Decisão qid/FSRS: **preservar**.

### Itens aposentados
- `5542579b` (ICI/NIA) e `9c831bdc` (contraste): aposentados por duplicidade nas quatro dimensões; publicação não aplicável (removidos do banco). Referências que não sustentavam o gabarito (`kdigo_ckd` em ambos).

## Cards adicionados

| id | fonte | tipo |
| --- | --- | --- |
| `ici_aki_cortazar_multicenter_2020` | Cortazar et al., J Am Soc Nephrol 2020;31:435-446 (DOI 10.1681/ASN.2019070676) | Coorte multicêntrica (n=138) |
| `ason_ici_nephrotoxicity_2025` | Herrmann et al. (ASON), Kidney Int 2025;107:21-32 (DOI 10.1016/j.kint.2024.09.017) | Consenso |
| `cisplatina_hidratacao_sikking_2024` | Sikking et al., The Oncologist 2024;29(2):e173-e186 (DOI 10.1093/oncolo/oyad297) | Revisão sistemática |
| `cisplatina_magnesio_meta_li_2023` | Li et al., Clin Exp Nephrol 2023;28(1):1-12 (DOI 10.1007/s10157-023-02386-2) | Metanálise |
| `contraste_esur_pcaki_2018` | van der Molen et al. (ESUR), Eur Radiol 2018 (DOI 10.1007/s00330-017-5247-4) | Diretriz |
| `gadolinio_acr_manual_2026` | ACR Manual on Contrast Media 2026 (cap. FSN / Tabela 1) | Diretriz |

Card existente corrigido: `ici_nia_cortazar_2016` — o `n` fabricado ("137", conflação com o estudo de 2020) foi corrigido para o valor real da série seminal de 2016 (n=13).

## PRs e commits finais

| PR | tema | merge commit |
| --- | --- | --- |
| #572 | ICI | `668914b91ac39f8257508cb9d08a3e9c55e1868e` (v12.60) |
| #573 | cisplatina | `990bda694e57e23d26e8d541392dabc44ab2c9c5` (v12.61) |
| #574 | meios de contraste | `84cdcfa15bb8febb579d9feaad6c775dc79ddb20` (v12.62) |

## Achados fora do lote (registrados, não corrigidos)

Exigem lote próprio:

- **`0408b280`** — questão de NIA por hipersensibilidade a antibiótico (amoxicilina-clavulanato) que cita indevidamente o card ICI-específico `ici_nia_cortazar_2016`. Atribuição inadequada (o card não sustenta NIA medicamentosa por antibiótico); deve passar a citar fonte de NIA medicamentosa geral. A correção do card ICI (n=13) não altera o risco editorial dessa atribuição.
- **`preserve_study`** (card compartilhado, PRESERVE trial) — URL com DOI incorreto (`NEJMoa1710695`; verificado: `10.1056/NEJMoa1710933`) e valor de P da N-acetilcisteína incorreto no resumo (registra P=0,83; verificado P=0,88). Possui **quatro consumidores** em `data/topics.js`; correção exige revisão dos itens consumidores, portanto lote específico.

## Política de identidade do qid

Ver **NQ Editorial Handbook §18.5** (regra canônica). Resumo: o `qid` identifica a identidade pedagógica estável (objetivo pedagógico, competência, conceito correto), não os bytes da redação. Todos os itens reconstruídos deste lote preservaram identidade pedagógica → `qid` e estado FSRS preservados; nenhum reset de maestria foi necessário.
