# Anexo C — Módulo Nefrologia *[Módulo: Nefrologia]*

> **Documento-pai:** `docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md` (o **“Handbook”**). Este anexo instancia, para a nefrologia, o corpo universal do Handbook. Consumido por Cap. 6 (distratores), 8 (Bloom), 9 (dificuldade), 11 (âncoras), 12–16 (revisão), 13 (referências).
> **Público:** revisor médico; skill `revisar-nefroquest`; skill `criar-nefroquest`; futuro módulo multilíngue.
> **Natureza do conteúdo:** rubricas, catálogos e checklists são **conceitos clínicos language-neutral** — a redação em português é ilustrativa; a norma é o conceito, reaproveitável em EN/ES.
> **Regra de fabricação (DEVE):** nenhuma dose, grau de recomendação, epônimo ou diretriz **DEVE** ser inventado. Onde faltar `id` em `refs.js`, marca-se **[sem card]**.
> **Regra dos exemplos (DEVE):** todo `qid` citado é **“exemplo atual do banco, sujeito a revisão”** — **NÃO DEVE** ser tratado como âncora normativa. A âncora é sempre o **OP + a rubrica + o exemplo clínico**.

---

## C.1 — Rubricas-âncora de Bloom / Miller

Altitude cognitiva **herdada do OP** (Handbook §8). Recall puro (“Lembrar”/“sabe”) é **sinal de alerta de trivia** (Handbook §3). A maioria das questões excelentes de nefrologia reside em **Aplicar / Analisar / Avaliar**.

| Bloom | Miller | O que a questão exige | Exemplo clínico-âncora (norma) | Exemplo atual no banco *(frágil, sujeito a revisão)* |
|---|---|---|---|---|
| **Lembrar** | Sabe | Recuperar um fato isolado | Reconhecer a tríade da síndrome nefrótica | `aca17286` |
| **Compreender** | Sabe | Explicar um mecanismo | Explicar a retenção de sódio no edema nefrótico (*overfill*/ENaC) | `ede008ca` |
| **Aplicar** | Sabe como | Aplicar uma recomendação a um caso | Indicar corticoide na NIgA por proteinúria residual após suporte otimizado | `20861302` |
| **Analisar** | Sabe como | Integrar 2–3 dados e excluir distrator plausível | Classificar a GNMP por padrão de imunofluorescência | `d2a32c19` |
| **Avaliar** | Sabe como / Mostra | Escolher entre condutas próximas ponderando risco/tempo/população | Decidir imunossupressão na membranosa de alto risco ponderando anti-PLA2R, albumina e TFGe | `2198d3ba` |

**Regra-âncora (DEVE):** se a questão de um OP declarado como **Avaliar** é respondível por **Lembrar** (recall de um número), há **falha de construto** (Handbook §10).

## C.2 — Rubricas-âncora de dificuldade intrínseca

Escala editorial semeada por `diff` (`easy`/`medium`/`hard` ≡ básica/intermediária/avançada). A dificuldade **DEVE** vir do raciocínio, **nunca** de omissão de dado ou trivia (Handbook §9).

| Nível (`diff`) | Definição operacional | Marcadores | Exemplo clínico-âncora (norma) | Exemplo atual *(frágil)* |
|---|---|---|---|---|
| **Básica** (`easy`) | Reconhecimento direto, sem dados concorrentes | 1 conceito; sem estágio/tempo; distratores distintos | Reconhecer o alvo antigênico da doença anti-MBG | `cd49b7a6` |
| **Intermediária** (`medium`) | Integrar 2–3 dados, excluir 1 distrator plausível, aplicar recomendação | classificação/estágio; 1 exclusão; conduta padronizada | Indicar suporte na GN pós-infecciosa autolimitada | `b1976a3f` |
| **Avançada** (`hard`) | Temporalidade, população específica, limitação de evidência ou escolha entre condutas próximas | perfil/gestação/transplante; segurança/interações; “melhor entre duas defensáveis” | Ponderar finerenona x hipercalemia e interação CYP3A4 em caso concreto | `65fcdeae` |

**Regra-âncora (DEVE):** promover dificuldade **adicionando raciocínio** (população, tempo, contraindicação), **nunca** removendo um dado decisivo — isto último é ambiguidade (Handbook §14), não dificuldade.

## C.3 — Erros editoriais recorrentes em questões de nefrologia

Defeitos de **construção** (não clínicos) confirmados no banco. O revisor **DEVE** caçá-los; vários são eliminatórios (Handbook §17).

1. **Grau/classe de recomendação fabricado** (ex.: “Grau 2D” inexistente).
2. **Epônimo/diretriz inexistente ou mal-atribuído** (ex.: “estadiamento de Beck”, “KDIGO de hiponatremia”).
3. **Gabarito que responde metade** — pergunta “dx **e** conduta”, mas a correta só dá o dx.
4. **Conduta insegura embutida no gabarito** (ex.: afirmar que “ciclosporina não é inibidor de CYP3A4”).
5. **Dado decisivo ausente que o gabarito assume** (ex.: idade gestacional numa síndrome hipertensiva da gestação).
6. **Hipótese fisiopatológica apresentada como fato** (mecanismo experimental tratado como demonstrado).
7. **Referência errada/órfã ou fora de tema** (ex.: `id` de um ensaio de ADPKD numa questão de SHU atípica).
8. **Duplicata** — mesmo OP/perfil/língua sem variação útil (Handbook §15).

## C.4 — Erros clínicos clássicos por subárea *(matéria-prima de distratores)*

Cada erro abaixo é um **distrator plausível** (Handbook §6): representa um equívoco real, não um absurdo. **NÃO DEVE** virar gabarito.

**Lesão renal aguda (LRA)**
- Indicar terapia renal substitutiva (TRS) por ureia/creatinina isoladas (e não por hipercalemia/acidose/uremia/congestão refratárias).
- Interpretar “resposta à furosemida” como LRA leve ou bom prognóstico.
- Rotular como pré-renal sem avaliar resposta a volume, sedimento e contexto.
- Iniciar diálise “precoce indiscriminada” tratando-a como sinônimo de emergência dialítica.
- Atribuir a LRA ao contraste sem cronologia compatível.

**Doença renal crônica (DRC)**
- Suspender IECA/BRA ou iSGLT2 pela queda hemodinâmica **esperada** e reversível da TFGe (confundida com progressão).
- Equiparar “planejar TRS” a “iniciar diálise”.
- Suspender nefroprotetor por hipercalemia leve em vez de otimizar dieta/quelante.
- Definir meta de PA/albuminúria sem considerar a categoria de albuminúria (A1–A3).

**Hemodiálise**
- Confundir Kt/V, URR e recirculação; tratar “adequação” como melhora clínica.
- Coletar ureia pós-diálise em timing incorreto.
- Confundir disfunção de acesso (estenose × trombose × infecção × síndrome do roubo).
- Prescrever ultrafiltração sem avaliar volemia/tolerância hemodinâmica.
- Invocar síndrome de desequilíbrio fora do contexto (1ª sessão, azotemia acentuada, sintomas neurológicos).

**Diálise peritoneal**
- Diagnosticar peritonite só pelo efluente turvo, sem celularidade/diferencial e cultura.
- Confundir contaminação × infecção de orifício/túnel × peritonite × recidiva/recorrência/refratária.
- Ignorar o tempo de permanência exigido para o antibiótico intraperitoneal.
- Confundir falha de ultrafiltração, transporte rápido no PET e falha de membrana.
- Ignorar a interferência da icodextrina em glicemia capilar.

**Transplante renal**
- Confundir profilaxia × terapia preemptiva × tratamento de CMV.
- Tratar virúria de BK como nefropatia por BK (sem DNAemia/biópsia).
- Reduzir imunossupressão sem contexto (tempo pós-Tx, função basal, nível sérico).
- Ignorar interação CYP3A/P-gp de tacrolimo/ciclosporina.
- Confundir rejeição celular × mediada por anticorpo (critérios Banff).

**Glomerulopatias**
- Confundir terapia de **indução** com **manutenção**.
- Usar proteinúria isolada como prova de atividade histológica.
- Indicar imunossupressão por anti-PLA2R isolado, sem o risco global de progressão.
- Aplicar o mecanismo *underfill* ao edema com hipoalbuminemia apenas discreta (é *overfill*).
- Indicar ciclofosfamida na NIgA fora da forma crescêntica rapidamente progressiva.
- Confundir remissão clínica com remissão histológica.

**Eletrólitos**
- Corrigir o sódio rápido demais (risco de mielinólise) ou não diferenciar hipo/hipernatremia aguda × crônica.
- Tratar hipercalemia sem considerar ECG, tendência, causa e possibilidade de remoção.
- Usar cálcio total sem correção por albumina/pH.
- Confundir tonicidade × natremia; não corrigir o sódio pela glicemia.
- Confundir sobrecorreção, meta desejada e limite máximo.

**Ácido-base**
- Aplicar fórmula de compensação fora do distúrbio a que se aplica.
- Calcular ânion gap sem correção pela albumina.
- Confundir acidemia/alcalemia com acidose/alcalose.
- Inferir de gasometria venosa o que exige arterial.
- Deixar de identificar distúrbio misto; interpretar pH/ânion gap urinário isoladamente na ATR.

**Nefrolitíase**
- Prevenção genérica em vez de dirigida ao fenótipo (urina de 24 h).
- Prescrever citrato de potássio sem considerar o tipo de cálculo e o pH.
- Ignorar a composição do cálculo na conduta.
- Tratar a litotripsia extracorpórea (LECO) como solução universal, independentemente de tamanho/localização.

**HAS / nefroproteção**
- Tratar aumento isolado de creatinina como falha terapêutica sem contexto hemodinâmico.
- Confundir HAS resistente × pseudorresistência × causa secundária.
- Indicar ultrafiltração/diurético sem avaliar perfusão e resposta diurética.
- Confundir nefroproteção (efeito sobre o *slope* da TFGe) com desfecho renal duro.

**Síndrome hepatorrenal / cardiorrenal** *(quando aplicável)*
- **Hepatorrenal:** tratar como pré-renal simples; não expandir com albumina e suspender diuréticos antes de firmar o diagnóstico; confundir SHR-LRA com necrose tubular aguda; usar vasoconstritor sem albumina.
- **Cardiorrenal:** interpretar a piora de creatinina durante descongestão eficaz como lesão renal; indicar ultrafiltração sem avaliar congestão/resposta diurética; confundir os tipos de síndrome cardiorrenal.

## C.5 — Armadilhas cognitivas típicas da nefrologia

Vieses que fazem errar **mesmo sabendo o conteúdo**. Servem para desenhar a *armadilha projetada* do OP (Model §3.2) e cruzar com as razões de erro relatadas (PED-1). Cada uma mapeia um termo do vocabulário PED-1 (`anchoring`, `confusion`, `between_two`, `misread`).

1. **Ancoragem em creatinina isolada** — decidir por um único valor, ignorando diurese, tendência e contexto. *(anchoring)*
2. **Ancoragem em ureia isolada** — indicar diálise ou gravidade por ureia. *(anchoring)*
3. **Confundir marcador de risco com indicação terapêutica** — tratar por anti-PLA2R/ácido úrico/albuminúria isolados. *(confusion)*
4. **Confundir associação com causalidade** — inferir causa de um dado observacional/temporal. *(confusion)*
5. **Confundir “investigar” com “tratar”** — a resposta correta era pedir exame, não iniciar terapia (ou vice-versa). *(between_two)*
6. **Confundir protocolo local com diretriz universal** — generalizar prática institucional. *(confusion)*
7. **Ignorar temporalidade** — agudo × crônico; janela de correção; tempo pós-transplante. *(misread)*
8. **Ignorar contexto hemodinâmico** — piora de creatinina hemodinâmica lida como lesão. *(anchoring)*
9. **Ignorar albumina/pH/unidades na interpretação laboratorial** — cálcio, ânion gap, gasometria. *(misread)*
10. **Confundir atividade com cronicidade em glomerulopatias** — imunossuprimir lesão crônica/cicatricial. *(confusion)*
11. **Confundir colonização/viremia/doença em transplante** — virúria × DNAemia × nefropatia (BK); mesma lógica para CMV. *(confusion)*
12. **Confundir adequação dialítica com melhora clínica isolada** — Kt/V “ok” interpretado como paciente “bem”. *(confusion)*

**Uso (DEVERIA):** ao criar um distrator, nomear qual armadilha ele explora; ao revisar, checar se a *razão de erro relatada* pelos usuários bate com a *armadilha projetada* (Handbook §10, validade de resposta).

## C.6 — Checklist de segurança por subárea

Pontos que o revisor **DEVE** confirmar **antes de aprovar**, focados em **segurança clínica** e **risco de gabarito errado**.

**LRA** — [ ] estágio por creatinina **e** diurese **e** janela; [ ] indicação de TRS não repousa em ureia/creatinina isoladas; [ ] volemia/K/acidose/uremia/intoxicação explícitos quando mudam a conduta.

**DRC** — [ ] categoria G e A corretas; [ ] queda esperada da TFGe não confundida com progressão; [ ] limiares e contraindicações de IECA/BRA, iSGLT2 e AMR não esteroidal corretos; [ ] K considerado.

**Hemodiálise** — [ ] métrica de adequação correta (Kt/V × URR); [ ] timing de coleta pós-ureia; [ ] tipo de disfunção de acesso bem definido; [ ] UF ponderada por volemia.

**Diálise peritoneal** — [ ] critério de peritonite completo (clínica + celularidade/diferencial + cultura); [ ] entidade infecciosa nomeada corretamente; [ ] via/tempo do antibiótico coerentes.

**Transplante** — [ ] tempo pós-Tx, indução/manutenção e nível sérico presentes quando decisivos; [ ] CMV/BK: fase correta (colonização/viremia/doença); [ ] interações CYP3A/P-gp; [ ] Banff atual para rejeição.

**Glomerulopatias** — [ ] indução × manutenção não confundidas; [ ] atividade × cronicidade distinguidas; [ ] decisão de imunossupressão pelo risco global, não por 1 marcador; [ ] se a pergunta é “dx e conduta”, o gabarito traz a conduta.

**Eletrólitos** — [ ] agudo × crônico e sintomas graves definidos; [ ] limites/metas/sobrecorreção vindos de diretriz, não inventados; [ ] hipercalemia com ECG/tendência/causa; [ ] cálcio corrigido.

**Ácido-base** — [ ] arterial × venosa correta; [ ] distúrbio primário + compensação esperada + misto; [ ] ânion gap com correção por albumina; [ ] fórmula certa para o distúrbio.

**Nefrolitíase** — [ ] conduta dirigida ao fenótipo (urina 24 h/composição); [ ] citrato de potássio coerente com tipo de cálculo/pH; [ ] indicação de intervenção coerente com tamanho/localização.

**HAS/nefroproteção** — [ ] método de medida/meta/população; [ ] aumento de creatinina interpretado no contexto hemodinâmico; [ ] resposta diurética/perfusão avaliadas antes de UF; [ ] nefroproteção não confundida com desfecho duro.

**Hepatorrenal/cardiorrenal** — [ ] critérios diagnósticos e sequência (expansão com albumina/suspensão de diuréticos) corretos; [ ] piora de creatinina na descongestão não lida como lesão; [ ] vasoconstritor sempre com albumina na SHR.

## C.7 — Base de diretrizes e referências

Regras de atribuição de fonte (complementam Handbook §13):

- **Atribuição específica exige card específico (DEVE):** se o gabarito atribui a recomendação **especificamente** a **Banff, AASLD, ADA, ESC, ACC ou AHA**, **DEVE** existir card correspondente em `refs.js`; caso não exista, o card **DEVE** ser criado **antes** da aprovação.
- **Não criar card por completude (DEVERIA):** se o gabarito é **adequadamente sustentado** por **KDIGO, KDOQI, ISPD** ou por um **ensaio pivotal já presente** em `refs.js`, **NÃO é necessário** criar card de outra sociedade apenas por simetria/completude.
- **Nunca fabricar `id` (DEVE):** **NÃO DEVE** apontar para `id` inexistente.
- **Nunca citar sociedade sem card (DEVE):** **NÃO DEVE** atribuir a recomendação a uma sociedade se não houver card correspondente — reformular para a fonte que existe, ou criar o card.

**Situação atual em `refs.js`** (honesta):

| Família / uso | Cards presentes | Situação |
|---|---|---|
| **KDIGO** (LRA, DRC, GN, Tx, diálise, MBD, PA, diabetes-em-DRC, lúpus, IgAN, ADPKD, anemia, cardiorrenal) | `kdigo_aki`, `kdigo_aki_2026`, `kdigo_gn`, `kdigo_tx`, `kdigo_transplant`, `kdigo_dialise`, `kdigo_ckd_mbd_2017`, `kdigo_bp_ckd_2021`, `kdigo_diabetes_in_ckd_guideline`, `kdigo_lupus_nephritis_guideline_2024`, `kdigo_igan_2021`, `kdigo_igan_2025`, `kdigo_adpkd_2025`, `kdigo_anemia_2024`, `kdigo_cardiorenal_consensus` | ✅ Ampla |
| **KDOQI** (adequação HD; acesso vascular) | `lok_kdoqi_2020` + card “KDOQI Hemodialysis Adequacy 2015” | ✅ Presente |
| **ISPD** (peritonite/DP) | `ispd_peritonitis_guideline` | ✅ Presente |
| **SBN** (biópsia renal) | `sbn_pbe_guideline` | ✅ Presente |
| **Banff** (patologia do Tx) | — | ⚠️ **[sem card]** — só criar se um gabarito atribuir **especificamente** a Banff |
| **AASLD** (síndrome hepatorrenal) | evidência: `hepatorenal_review`, `terlipressin_sanyal` | ⚠️ Sustentação existe; **card AASLD só se o gabarito citar a diretriz AASLD** |
| **ADA** (nefropatia diabética) | análogo/evidência: `kdigo_diabetes_in_ckd_guideline`, `renaal_trial`, `idnt_trial`, `credence`, `flow_study` | ⚠️ **Card ADA só se atribuído a ADA**; senão usar KDIGO/ensaios |
| **ESC / ACC / AHA** (cardiorrenal/HAS) | análogos/evidência: `kdigo_bp_ckd_2021`, `kdigo_cardiorenal_consensus`, `sprint_trial`, `bproad` | ⚠️ **Card da sociedade só se atribuído a ela**; senão usar KDIGO/ensaios |

---

*Fim do Anexo C — Módulo Nefrologia (rascunho para revisão humana). Instancia o corpo universal do Handbook para a nefrologia; conteúdo language-neutral, reaproveitável em EN/ES. Pendências herdadas do Model/Handbook: vocabulários controlados de competência/conceito/erro (§C.3–C.5 se beneficiam quando fechados); decisão EPA vs CanMEDS.*
