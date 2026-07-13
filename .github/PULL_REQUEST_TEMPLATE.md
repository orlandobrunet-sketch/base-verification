## Resumo

Descreva a mudança e o resultado esperado.

## Lote editorial (obrigatório para `data/topics.js` ou `data/refs.js`)

- **Lote:**
- **Manifesto JSON:**
- **Tipo:** `medical_editorial` / `technical_only`
- **Qids e ações exatas:**
- **Contagem esperada:** questões · qids únicos · cards · referências órfãs

### Gate médico-editorial

- [ ] Autorização explícita do proprietário foi registrada para este escopo.
- [ ] A revisão formal foi realizada por `revisar-nefroquest`.
- [ ] Evidência, Pendência, Veredito e Autorização de publicação foram registrados separadamente.
- [ ] Toda questão publicada tem `Autorização de publicação: LIBERADA` derivada conforme o Handbook §18.4.
- [ ] Não existe pendência decisiva nem combinação inválida entre Evidência e Pendência.
- [ ] Mudanças materiais foram reavaliadas; nenhuma liberação anterior foi herdada silenciosamente.
- [ ] A decisão de preservar/remover o `qid` e preservar/descartar FSRS está declarada por item.

### Escopo e versão

- [ ] Apenas os arquivos declarados no manifesto foram alterados.
- [ ] Apenas os qids declarados no manifesto foram alterados.
- [ ] `data/refs.js` respeita `refs_policy` e não há referências inexistentes ou órfãs.
- [ ] `version.json`, cache do `sw.js` e release Sentry no `index.html` estão sincronizados.
- [ ] ZIPs, arquivos scratch e artefatos de testes não fazem parte do PR.

### Revisão externa e merge

- [ ] Greptile executou a revisão e todos os comentários/threads foram inspecionados.
- [ ] Greptile indisponível: o manifesto nomeia um revisor substituto e sua revisão foi inspecionada.
- [ ] Todas as checks obrigatórias passaram no head SHA final.
- [ ] Todos os threads foram novamente inspecionados imediatamente antes do merge.

> **Atenção:** zero threads não comprova que o Greptile executou uma revisão. Confirme o estado do serviço e a existência de uma revisão real.

## Como testar

Liste os comandos executados e os resultados observados.
