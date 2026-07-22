# Fundação 0 — Kit Lúmen Vivo

**Status:** candidata à aprovação
**Direção:** Atlas Operativo
**Assinatura:** Junção Hilar

Este laboratório valida a futura camada visual interna do NefroQuest sem carregar ou alterar a interface funcional do jogo.

## Endereço local

`/design-system/lumen-foundation/`

## Arquitetura

- `styles/lumen/tokens.css` — tokens cromáticos, tipográficos, espaciais e de movimento;
- `styles/lumen/components.css` — componentes provisórios sob `[data-nq-ui="lumen"]` e prefixo `.nql-*`;
- `styles/lumen/motion.css` — coreografia, pausa e equivalentes de movimento reduzido;
- `design-system/lumen-foundation/lab.js` — interação do laboratório, sem contratos do jogo;
- `tests/specs/16-lumen-foundation.spec.ts` — critérios automatizados de aprovação.

O laboratório não importa `style.css`, `landing/styles.css` ou scripts da SPA. Os componentes continuam provisórios até funcionarem em pelo menos duas telas reais.

## Decisões visuais

- a corrente ciano representa raciocínio em andamento;
- o dourado aparece apenas para avanço e maestria;
- o violeta permanece restrito a risco, corrupção e chefes;
- `#8050A6` permanece como matéria violeta; `#BD91DA` é seu primeiro plano acessível para rótulos e estados sobre superfícies escuras;
- a Junção Hilar cria uma abertura assimétrica na moldura para a entrada da corrente;
- superfícies são organizadas por linha, espaço e fluxo, evitando excesso de cartões;
- texto clínico nunca fica sobre anatomia ou movimento complexo.

## Gate de aprovação

- 1440, 768, 390 e 320 px sem overflow;
- alvos interativos mínimos de 44 × 44 px;
- teclado, foco, Escape e retorno de foco no diálogo;
- WCAG 2.2 AA, sem falhas sérias ou críticas no axe;
- movimento reduzido e cores forçadas sem perda de informação;
- aprovação explícita antes de iniciar o Portal de acesso.
