# Veredito

**revisão maior** — triagem da alteração literal solicitada em NOV03-01.

**Equivalente legado (auxiliar):** REESCREVER.

**Confiança:** moderada.

**Evidência:** NÃO VERIFICADA.

**Pendência:** DECISIVA.

**Autorização de publicação:** BLOQUEADA, derivada do Handbook §18.4, Regra 7(a)/(c). Este registro não altera o banco nem substitui pareceres anteriores.

# OP declarado e classificação

OP da versão atual: interpretar um TTKG baixo na hipercalemia como resposta distal inadequada de secreção de potássio, sob as condições de validade assumidas pelo enunciado. Competência: interpretação de índices urinários na avaliação da hipercalemia. Bloom: compreender; Miller: sabe. Dificuldade intrínseca estimada: média; o campo vigente `hard` não foi alterado.

# Justificativa

O proprietário pediu apenas explicitar `TTKG (Gradiente Transtubular de Potássio)`. A expansão terminológica é compatível com o nome do índice e não exige trocar a resposta. Entretanto, a versão atual possui uma pendência científica/identitária anterior que não pode ser encerrada por uma alteração de sigla.

O arquivo `../2026-10-12/independent-a009-A6-disposition-binding.json` contém o BEFORE literal do item `6474ec20` e um AFTER voltado à limitação fisiológica do TTKG. A disposição desse AFTER é **redirecionar / VERIFICADA / NENHUMA / BLOQUEADA**, por mudar o OP vinculado ao qid. Não herdar a verificação do AFTER para o texto atual nem aplicar a proposta bloqueada.

# Achados priorizados

1. **MAIOR — Evidência decisiva ainda não reconciliada para o texto atual.** O parecer anterior questiona a premissa de validade do índice. A referência vigente é `brenner_rector`; o trecho específico que sustenta o gabarito não foi aberto nesta triagem. A busca pública localizou Kamel/Halperin 2021, mas a abertura do texto integral no PMC retornou verificação de navegador. Snippets de busca não foram tratados como leitura integral.
2. **MAIOR — Identidade/FSRS.** A alternativa de reescrita preservada nos pareceres altera o objetivo; a disposição anterior bloqueia sua aplicação com o mesmo qid. Não resolver por substituição silenciosa.
3. **MENOR — Sigla sem expansão no enunciado.** Pedido registrado para a futura versão liberada: inserir exatamente `TTKG (Gradiente Transtubular de Potássio)`.

# Advogado do Recurso

Há argumento plausível ainda não resolvido: a condição “quando as condições de validade do cálculo estão atendidas” precisa ser conciliada com a crítica fisiológica documentada no parecer anterior. Não aprovar esta versão apenas porque a expansão terminológica é pontual. Handbook §16: “a questão NÃO PODE ser aprovada sem correção”.

# Eliminatórios

Não emitir conclusão científica definitiva sem a reconciliação da fonte decisiva. O teto de evidência do §18.4 já impede aprovação. A proposta alternativa existente possui eliminatório 3 (deriva do OP) no seu próprio parecer; ele não é transferido automaticamente ao texto literal atual.

# NQ Editorial Score

Não pontuado nesta triagem: a verificação decisiva não foi concluída. Nenhum score substitui o teto de evidência ou representa liberação do item.

# Decisão (árvore §19)

Passo 0: fonte decisiva e conflito não reconciliados → teto de revisão maior → ciclo de vida `em_revisão` → publicação BLOQUEADA. Não aplicar nem a expansão isolada nem o AFTER anterior ao banco nesta entrega.

# Patch editorial sugerido

**SUBSTITUIR A QUESTÃO POR:** proposta ainda não liberada; nenhuma versão substituta pronta é emitida nesta triagem. O pedido literal de terminologia fica preservado para a versão editorialmente elegível. Não trocar gabarito, referências, qid ou histórico por iniciativa técnica.

# Referências verificadas e alcance

- Parecer interno citado: objeto BEFORE, proposta AFTER, classificação e disposição lidos diretamente; publicação do AFTER permanece BLOQUEADA.
- Kamel KS, Halperin ML. *Use of Urine Electrolytes and Urine Osmolality in the Clinical Diagnosis of Fluid, Electrolytes, and Acid-Base Disorders*. 2021. [PubMed PMID 34013099](https://pubmed.ncbi.nlm.nih.gov/34013099/), [PMC8116912](https://pmc.ncbi.nlm.nih.gov/articles/PMC8116912/). Identificação e snippets localizados em 03/11/2026; tentativa de abrir PMC retornou desafio de navegador. Corpo não confirmado nesta triagem; nenhum card criado ou alterado.
- `brenner_rector`: referência vigente do item; trecho decisivo não relido nesta triagem.

# Observação de implementação

Autorização do proprietário para a expansão existe, mas o gate cumulativo não está satisfeito. `data/topics.js` permanece intacto. Esta pendência não impede os seis ajustes técnicos/visuais da mesma lista.

# Pendências de verificação

Recuperar o gate final aplicável à versão atual, conferir as fontes decisivas e resolver a identidade do OP antes de propor alteração clínica. A recuperação do pacote A37 pode atualizar a disposição; esta triagem não afirma ser o último parecer de toda a revisão histórica.
