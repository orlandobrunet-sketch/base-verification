# Método de revisão — interface 16.17

## Problema e escopo

O proprietário reabriu a proporção da marca, as bordas dos seis equipamentos e a auditoria da batalha, pediu leitura de artigos em popup e refinou os modais de capítulo, pergaminho e evolução. O escopo e os critérios estão no [plano de continuidade](../../design/NQ_CONTINUITY_PLAN_2026-10-17.md), com o [inventário completo](../../design/NQ_REQUEST_INVENTORY_2026-10-17.md).

Esta entrega altera apresentação e os pontos de entrada do leitor. Preserva textos e objetos médicos, IDs, gabaritos, histórico e FSRS. O manifesto de revisões muda somente o identificador técnico da release; os perfis e versões de referências não mudam. A movimentação da narrativa de evolução preserva seu texto literal. Nenhum pacote clínico local é aplicado por este lote.

## Revisão independente

A revisão técnica será emitida por agente que não escreveu o código desta entrega. Deve ler o diff completo contra o merge publicado `adad2e4b9bc4259dbd630f0d89c04bbfcd494e9b`, verificar os arquivos protegidos e os dados literais, examinar as evidências visuais e declarar o **HEAD completo e a árvore** a que o parecer se aplica. Um parecer sobre fonte anterior não libera uma mudança posterior.

A substituição independente já autorizada pelo proprietário permanece aplicável caso o serviço externo de revisão não execute por limite de avaliação. Na entrega anterior, Greptile informou avaliação encerrada; isso não é aprovação de código. O estado real da revisão externa desta PR será registrado depois da abertura. Não adquirir créditos, trocar ambiente ou chamar outro serviço para contornar esse limite.

## Evidências exigidas

- Capturas de antes/depois dos alvos reais, com dimensões, fonte, DPR e limitações declaradas. O diagnóstico de equipamento distingue discretização de curvas da resolução dos assets; não prova a causa do print por mera semelhança.
- Popup da questão e do Grimório, referência histórica correta, conteúdo integral, fechamento, foco e preservação do contexto. Manter classificação e cor quando presentes nos metadados existentes.
- Acesso ao fim dos textos longos, inclusive fonte ampliada em tela estreita. Fonte raiz de 32 px não é zoom nativo; declarar essa diferença.
- Batalha/demonstração nos estados efetivamente percorridos. Captura de uma transição sintética não equivale a teste de toda a progressão; regras, HP, áudio e estado têm verificações próprias.
- Testes locais pertinentes e **CI completa do HEAD exato**, com falhas, retries, flakies, skips e casos não executados separados. Mudanças intencionais nos testes de leitura devem ser explicadas, preservando os controles de identidade e histórico.
- Antes do merge: remoto fresco, base/HEAD corretos, checks concluídos, parecer independente FINAL e ausência de achado material pendente. Depois: merge/tree verificados, deploy concluído e conferência dos arquivos e vistas públicas.

## Limites

Os dados locais são sintéticos e os navegadores são temporários. Não há validação com conta pessoal, backend de produção, pagamento ou concessão de benefícios. As conferências focais não certificam toda a aplicação nem a futura adaptação móvel. Um gate técnico não concede autorização editorial para mudar conteúdo clínico.

## Candidata anterior preservada

A candidata 16.16 da PR 900 foi bloqueada por overflow real do dock de desktop em 1100 px com fonte raiz32. A correção 16.17 mantém os alvos solicitados e altera somente a quebra de rótulos e a altura natural dos botões de desktop, além de metadados/cache/documentação. Pareceres e CI do HEAD anterior não liberam este novo HEAD. A execução local incompleta e seus artefatos permanecem preservados.
