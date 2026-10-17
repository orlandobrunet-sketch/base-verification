# Método de revisão — interface 16.18

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

## Candidatas anteriores preservadas

A candidata 16.16 da PR 900 ficou bloqueada por overflow horizontal do dock de desktop em 1100 px com fonte raiz de 32 px. A candidata 16.17 corrigiu esse overflow e passou 24 testes, mas a imagem revelou sobreposição vertical decorrente da altura fixa de 26 px herdada pelo rótulo. Nenhuma foi publicada; seus pareceres e execuções permanecem preservados.

A 16.18 usa coluna desktop com largura intrínseca e rótulos/botões de altura natural, preservando o mobile. O mesmo teste recebe verificações de contenção e separação entre texto e ícone, sem alterar títulos ou contagens da CI. A cópia local pinada amplia somente os parâmetros de largura: 24 casos originais mais oito focais em 769/1440 px, 32 passes e 72 comparações geométricas. Ela não é confundida com a coleção da CI. O token do manifesto e os demais cache-busters alterados foram alinhados à release final.

O novo HEAD precisa de parecer independente FINAL, CI completa própria, merge e deploy verificados e inspeção pública. Resultados sobre um HEAD anterior não o liberam.
