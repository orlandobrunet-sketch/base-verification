# Manifests de lote editorial

Cada PR que toca `data/topics.js` ou `data/refs.js` declara **exatamente um**
manifest nesta pasta. O validador (`scripts/editorial-batch-validator.mjs`) lê o
manifest alterado no PR e trava o merge se o contrato não fechar.

Manifests antigos **não** são revalidados — o portão vale para o lote que o PR
altera. Os 132 lotes anteriores a 22/08/2026 não declaram os eixos editoriais e
seguem válidos como registro histórico.

## Contrato

```jsonc
{
  "batch": "FARM-20A",
  "change_type": "medical_editorial",     // ou "technical_only"
  "expected_version": "14.77",
  "allowed_files": ["data/topics.js", "version.json", "sw.js", "index.html",
                    "docs/editorial/review-batches/FARM-20A.json"],
  "expected_question_delta": 0,
  "refs_policy": "unchanged",              // ou "declared" (exige "references")
  "external_review": { "greptile": "required", "fallback_reviewer": null },
  "questions": {
    "5bfb77d2": {
      "action": "rebuild",                 // rebuild | refs_only | add | retire | technical_only | reviewed_unchanged
      "preserve_fsrs": true,

      // Os três eixos do Handbook §18.4 — obrigatórios quando
      // change_type é medical_editorial e a ação é rebuild, refs_only,
      // add ou reviewed_unchanged.
      "evidencia": "VERIFICADA",           // VERIFICADA | PARCIALMENTE VERIFICADA | NÃO VERIFICADA
      "pendencia": "NENHUMA",              // NENHUMA | NÃO DECISIVA | DECISIVA
      "veredito": "aprovada",              // um dos sete do Cap. 19
      "publicacao": "LIBERADA"             // derivado — ver abaixo
    }
  }
}
```

Acentos e caixa são normalizados: `"nao verificada"` e `"NÃO VERIFICADA"` são o
mesmo valor. O vocabulário aceito não muda.

## `publicacao` é conferido, não escolhido

O campo existe no manifest para ficar legível na revisão, mas **não é uma
escolha**. O validador deriva o valor pela Regra 7 e recusa o lote se o
declarado divergir. Das 63 combinações possíveis dos três eixos, exatamente
quatro produzem `LIBERADA`:

| Evidência | Pendência | Veredito | Publicação |
|---|---|---|---|
| VERIFICADA | NENHUMA | aprovada | **LIBERADA** |
| VERIFICADA | NENHUMA | aprovada com pequenos ajustes | **LIBERADA** |
| PARCIALMENTE VERIFICADA | NÃO DECISIVA | aprovada | **LIBERADA** |
| PARCIALMENTE VERIFICADA | NÃO DECISIVA | aprovada com pequenos ajustes | **LIBERADA** |
| *todo o resto* | | | **BLOQUEADA** |

## O que trava o merge

- **Combinação inválida entre eixos** (Regra 6) — `VERIFICADA` só admite
  `NENHUMA`; `PARCIALMENTE VERIFICADA` nunca admite `NENHUMA`.
- **Teto de veredito** (Regra 5) — evidência `NÃO VERIFICADA`, ou
  `PARCIALMENTE VERIFICADA` + `DECISIVA`, não pode receber veredito de
  aprovação, qualquer que seja o score.
- **Publicação divergente da derivada** (Regra 10).
- **Item com publicação BLOQUEADA escrito em `data/topics.js`** por `rebuild`,
  `refs_only` ou `add` (Regra 11).
- Qualquer campo dos quatro ausente.

## O que o portão não faz

Não emite veredito, não avalia evidência e não aprova questão. Ele confere que
a revisão editorial declarou os quatro campos e que a autorização de publicação
é a que a Regra 7 deriva daqueles valores. Aprovação clínica sai da skill
`revisar-nefroquest`, nunca daqui — um gate técnico que "aprovasse" sozinho
pareceria revisão sem ser.

A fonte da verdade é o [Handbook §18.4](../NQ_EDITORIAL_HANDBOOK_v1.md). Se ele
e o código divergirem, o Handbook vence.
