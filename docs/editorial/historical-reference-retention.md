# Referências preservadas para revisões históricas

Este é um contrato técnico do validador. Ele não emite aprovação médica nem altera as regras do Handbook.

Um card existente que perdeu seus consumidores atuais pode permanecer no catálogo para favoritos e provas antigas. O lote declara `historical_reference_retention` com `version: 1` e um objeto `references`. Cada ID aponta:

```json
{
  "qid": "11111111",
  "release": "17.27",
  "record_sha256": "sha256:...",
  "reference_sha256": "sha256:...",
  "current_sha256": "sha256:..."
}
```

O validador lê manifesto e histórico do commit-base e histórico do commit-head, sem executar seus wrappers JavaScript. O consumidor arquivado deve corresponder a uma revisão publicada na base: autor literal, cards completos, recordRevision e os quatro perfis. Um registro inventado no head, ainda que tenha hashes coerentes, não autentica publicação anterior. A referência deve existir tanto na base quanto no head.

Se o card atual difere do arquivado, são obrigatórios `author_review` e `independent_review`, com o mesmo contrato integral de referências já usado por `reference_only`: eixos editoriais, `report_path`, hash dos bytes `report_sha256`, `version_pointer` e `gate_pointer`. Cada relatório vincula os doze campos exatos, a versão ordenada/canônica e seu revisor; os revisores precisam ser distintos. Uma aprovação de questão não substitui o parecer do card inteiro.

Um recibo de transporte pode normalizar o envelope de um parecer congelado, sem produzir novo juízo. Seu campo `transport` contém caminho/hash do relatório original e os JSON Pointers `record_pointer`, `card_pointer` e `gate_pointer`. O registro original deve identificar o mesmo card, e os ponteiros do corpo e gate devem permanecer dentro desse registro. O validador confere o literal e os eixos originais, inclusive evidência parcial e limites de escopo. O ponteiro vazio identifica a raiz de um relatório dedicado ao card. Relatórios em lote podem usar índices de arrays. O recibo não eleva evidência parcial a verificada nem pode buscar o gate de uma questão vizinha.

Qualquer falha numa retenção declarada impede todas as exceções históricas desse lote; `ORPHAN_REFERENCE` continua visível. As regras de consumidores atuais, referências realmente novas, Câmara e lotes somente de referências continuam aplicáveis. A prova não concede leitura, favorito, desbloqueio, crédito ou transferência de FSRS. O trabalho adicional ocorre apenas no validador da CI.
