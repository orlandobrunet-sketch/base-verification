# ANCA — material final de autoria A2 para revisão independente

`anca-candidates-A2.json` está congelado, SHA256 `32a31020010367f512adc6a41c468e8ad1189e62483cf76a088fc01ebc5db89f`. Todos os registros continuam BLOQUEADOS; a autoria não emite veredito ou gate. A1 fica preservado como versão anterior.

As únicas diferenças entre A1 e A2 são cinco campos `diff` e a última frase da explicação de `91cfbe6c`:

| Questão | Dificuldade A2 | Reconciliação com a revisão independente |
|---|---|---|
|1fd6a5cf|medium|Interpretar regime combinado e limite de atribuição não exige escolha terapêutica individual complexa.|
|91355bed|medium|Separar validade do ensaio de plausibilidade e ineficácia universal, sem decisão clínica individual.|
|ae0f4fef|medium|Distinguir farmacologia e comprovação clínica; não selecionar tratamento sob riscos concorrentes.|
|ebd066db|medium|Dados apresentados já afastam o principal mimetizador e permitem aplicar a sequência padrão tratar/biópsia.|
|91cfbe6c|easy|Reconhecimento de medidas padronizadas, sem dose, contraindicação ou interação individual.|

A revisão dos distratores de91cfbe6c agora é específica: profilaxia primária não aguarda pneumonia prévia, sua duração não se define apenas pela negativação do ANCA e hemograma não substitui imunoglobulina G. A orientação de seis meses após indução com rituximabe e extensão selecionada permanece conforme a [KDIGO2024, S96](https://kdigo.org/wp-content/uploads/2024/05/KDIGO-2024-ANCA-Vasculitis-Guideline-Update.pdf).

Os OPs e a classificação autoral inicial estão preservados; a justificativa da reconciliação consta em `anca-author-classification-A2.json`. Os hashes individuais foram recalculados. Não houve outra alteração em enunciado, opções, resposta, referência ou explicação. O mapa de fontes atualizado está em `anca-author-sources-A2.json` e mantém explicitamente os limites de acesso a RITUXVAS2010, nota NEJM e editorial KDIGO de setembro2026.

As métricas de alternativas são as mesmas da A1:12/13 corretas únicas mais longas nos originais e4/13 nos candidatos; ranks4/3/2/4, sem empate. O item EGPA04cb2429 segue integralmente mantido. Não há resultado de aprovação implícito nessas métricas.

Há um pacote separado `rave-card-candidate-C1.json` para correção do card compartilhado, com único consumidor89af997c e seu estado atual/proposto A2. Esse card exige gate próprio. Nenhuma liberação dele concede automaticamente gate à questão, nem o contrário. Não houve edição do aplicativo.
