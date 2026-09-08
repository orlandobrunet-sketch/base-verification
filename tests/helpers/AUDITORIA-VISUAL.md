# Instrumento de auditoria visual

Para novas auditorias, use `page.evaluate(auditarVisual, seletor)` importando
`auditarVisual` de `auditoria-visual.ts`. A função é autocontida para ser
serializada pelo Playwright. Aguarde carregamento, fontes e posição final das
animações antes da chamada; exija a superfície aberta e no estado desejado.

## Interpretação do resultado

- `falhou`: há ao menos uma falha das medidas implementadas. O relatório pode
  também conter pontos inconclusivos; não descarte essa lista.
- `inconclusivo`: nenhuma falha confirmada pelo modelo, mas existe conteúdo
  não avaliado ou sobreposição que exige inspeção. Nunca equivale a aprovação.
- `aprovado`: os textos/controles mensuráveis passaram nos critérios abaixo,
  sem pendência identificada. Não significa conformidade WCAG da página.

`medidos` conta elementos, não pixels ou testes de acessibilidade. `ignorados`
inclui conteúdo oculto, decoração, texto para leitor de tela e isenções de
contraste de controles desabilitados. Raiz ausente, múltipla, invisível ou sem
texto/controle mensurável é inconclusiva. O texto da própria raiz é incluído.

## O que é medido

- Corte horizontal e vertical por caixas `hidden`/`clip`, usando as linhas
  reais de texto (`Range`) e as caixas dos controles.
- Conteúdo fixo fora da viewport sem região de rolagem acessível. Conteúdo
  abaixo da dobra em fluxo normal não vira defeito vertical.
- Sobreposição entre retângulos de linhas de texto é registrada como
  **inconclusiva**: as caixas não provam colisão dos pixels dos glifos nem
  conhecem a intenção visual. Pai e filho não são tratados como duas caixas
  de texto inteiras.
- Contraste de texto sRGB sobre fundos sólidos, incluindo transparência da
  cor e camadas de `background-color`. Não arredonda antes de comparar o
  limite. `color(srgb ...)` usa escala fracionária; outros espaços de cor
  são inconclusivos.

Imagens, degradês, opacidade de grupo, filtros, pseudo-elementos e pintura
especial do texto produzem contraste inconclusivo. Uma cor preta encoberta
por degradê branco não oferece aprovação. O filete de 1px também permanece
inconclusivo, sem virar falso defeito: o instrumento não resolve a área
pintada de cada camada de imagem. Um fundo sólido opaco pode encobrir a
imagem ancestral; efeitos de composição dos ancestrais ainda são considerados.

## Limites e uso no produto

`elementsFromPoint` ajuda a sinalizar camadas irmãs nos centros das linhas,
mas não inspeciona cada pixel nem enxerga toda pintura com `pointer-events:
none`. Sobreposição entre textos, sombras, ícones, imagens, máscaras, zoom,
teclado virtual, leitores de tela e tamanho de alvo com suas exceções não são
certificados. A medição de contraste fora do recorte visível é inconclusiva:
role até o conteúdo e meça novamente. Capture a **viewport**, não apenas uma
imagem `fullPage`, e teste o clique/teclado que a pessoa precisa usar.

Os helpers `medirContraste` e `medirGeometria` permanecem para regressões
históricas. Agora recusam raiz ausente/invisível e incluem a própria raiz.
Seus arrays vazios indicam ausência de alertas do modelo antigo, **não**
aprovação. O contraste legado escolhe a parada mais favorável do degradê;
não use esse resultado para aprovar uma composição complexa. Novos casos
devem guardar o relatório completo de `auditarVisual`, inclusive pendências.

A spec 55 contém controles sintéticos positivos/negativos, sem rede. A spec
54 aplica o relatório ao Oráculo e anexa o JSON de cada estado: falhas
geométricas bloqueiam a regressão e fundos inconclusivos ficam registrados.
