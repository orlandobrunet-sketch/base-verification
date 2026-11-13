# DP — membrana/permeabilidade A1, bloqueada

Cinco originais estão congelados em `dp-membrane-original-5.json`, SHA256 `a160c90b0ccc84cefcb8c4cdb60ebd5db75f0e8459f8fa9e77ee5453c5dfc400`. A classificação autoral foi feita antes dos candidatos no inventário dos34; seu recorte é `dp-membrane-author-classification-A1.json`.

Material proposto exato: `dp-membrane-candidates-A1.json`, SHA256 `55513c436d8ee1ea5e76b6770e8fae5ce7f317415a114ed0d8e901856ef2e7c4`. Os cinco registros estão **BLOQUEADOS**, aguardando revisão independente. Não há autoaprovação, alteração do aplicativo, troca de qid, histórico, resposta ou referência.

O subgrupo compartilha uma fonte: [Morelle/ISPD2021, artigo primário integral](https://journals.sagepub.com/doi/10.1177/0896860820982218). A [lista oficial atual](https://ispd.org/guidelines/) mantém esse documento como recomendação de avaliação da membrana. O card existente foi lido integralmente e não requer alteração no pacote.

As alternativas deixam de concentrar rastreio, mecanismo, exceções e decisão clínica na mesma correta longa. A informação continua no enunciado e na explicação. Os ajustes para transporte rápido e lento permanecem condicionais, sem escolher modalidade só pelo PET. cfa20f08 continua testando rastreio, sem transformar300mL em diagnóstico etiológico.

Há duas correções de precisão. Em5d9f1a59, baixa queda de sódio é tratada como marcador indireto: o transporte muito rápido de solutos pode interferir, e não se prova um defeito isolado de aquaporina. Em985e2d99, expansão vascular e fibrose deixam de ser apresentadas como o mesmo mecanismo; distingue-se absorção de glicose de resistência ao transporte de água. A decisão sobre modalidade permanece compartilhada e depende do controle de volume e dos objetivos.

A fonte contém valores discordantes para a razão de sodium sieving entre Tabela1 e Guideline4a/corpo. Essa razão não foi incluída em nenhuma pergunta nem consta do card existente. A queda absoluta de sódio≤5mmol/L é consistente e sustenta o item. O mapa `dp-membrane-author-sources-A1.json` documenta esse limite para impedir extrapolação futura.

As distinções de OP foram registradas para contraprova independente: prescrição rápida versus lenta; ajuste de prescrição versus mecanismo adquirido; rastreio de capacidade versus informação adicional de água livre na anúria. Não se usou reescrita para contornar duplicidade ou introduzir um conceito novo sob o mesmo qid.

Neste recorte, corretas únicas mais longas passam de5/5 para0/5, com um empate no maior comprimento. Os ranks são1/2/0/2, incluindo o empate no rank1. Isso não é gate nem demonstra resultado do banco inteiro. Nenhuma regra de tamanho foi imposta; os números podem ser recalculados a partir dos vetores armazenados.

Os outros11 itens realmente de DP continuam na fila, além dos dois fúngicos retidos por duplicidade e dos nove itens que o agrupamento automático colocou em DP apesar de outros OPs. Qualquer mudança posterior no material proposto exige outra versão e novos hashes antes da publicação.
