# Movimento nos testes — configuração e limites

## Estado da entrega

A produção permanece na **17.04**, publicada pelo [PR958](https://github.com/orlandobrunet-sketch/base-verification/pull/958), merge `ce39f6502ddd19a86a2f883faf77474db5f2414b`. CI1060: 15/15 jobs aprovados, 3.031 testes completos e 265 skips previstos, sem falhas, intermitências ou retries. Pages `43268841232` aprovado; seis arquivos públicos idênticos ao merge e quatro regressões públicas aprovadas.

Esta rodada, na branch `codex/reduced-motion-validation`, altera somente testes, seu guard de configuração, CI e documentação. Não muda o produto, o conteúdo médico ou a versão publicada; o bump check confirmou a manutenção da 17.04, sem assets alterados. **PR e CI desta rodada ainda pendentes neste checkpoint:** consultar o PR final antes de anunciar integração ou validação completa. A bateria relacionada de 52 cenários está em execução.

## Configuração corrigida

No Playwright 1.60 usado no projeto, 123 specs declaravam `reducedMotion` diretamente em `test.use`, sem aplicar a preferência ao contexto do navegador. Foram preservados os valores pretendidos — 112 `reduce` e 11 `no-preference` — dentro de `contextOptions`:

```ts
test.use({ contextOptions: { reducedMotion: 'reduce' } });
```

A comparação por AST da conversão, antes da ampliação da suíte 243, preservou **9.365 nós de asserção** e as demais opções. Isso não é a contagem final após acrescentar verificações explícitas de movimento à 243. Não foram removidas asserções nem alteradas regras do produto para obter aprovação.

O guard em `tests/browser-config/motion-options.cjs` rejeita declarações diretas inválidas; seus nove testes passaram. A CI o executa nos jobs de navegador antes das suítes. O guard analisa declarações diretas em specs/configuração, não garante detectar opções montadas dinamicamente. A preferência efetiva também precisa ser conferida no navegador quando fizer parte do contrato.

## Controle de rolagem: evidência separada

Os experimentos externos em `campaign-scroll-1705` usam um banco exclusivamente técnico e preservam os resultados distintos:

| Condição | Resultado | Evidência externa |
|---|---|---|
| Movimento mal declarado, com relógio JavaScript controlado | 2/2 falhas na exigência de `scrollY = 0` | `observed.json` |
| `reduce` aplicado corretamente ao contexto, com relógio controlado | 2/2 aprovações | `effective-reduce.json` |
| Movimento normal, com 1.200 ms de tempo real para acomodação | 2/2 aprovações | `normal-real-settle.json` |
| Movimento normal, somente avanço do relógio JavaScript controlado | 2/2 falhas; posição observada inclui 229 px | `normal-fake-only.json` |

Avançar ou pausar timers JavaScript não equivale a avançar o compositor nativo responsável pela rolagem animada. A declaração ignorada invalidava a premissa de que o primeiro controle rodava com movimento reduzido. Os resultados não justificaram alteração de CSS, foco ou rolagem do produto. A variante normal com somente relógio controlado continua reprovada como experimento; não foi convertida em aprovação nem usada para afirmar um defeito novo no aplicativo.

## Regressão ampliada e pendências

A suíte 243 passa a declarar os dois movimentos no contexto e conferir `matchMedia('(prefers-reduced-motion: reduce)')`. São **oito cenários: dois contratos × dois movimentos × dois perfis**, preservando o percurso de fim do deck, a visibilidade da correção e o retorno à carta da campanha. A ampliação concluiu **8/8 aprovações em 1,7 min, sem retry**. O guard passou 9/9; a bateria relacionada de 52 cenários e a CI completa continuam pendentes, sem aprovação presumida.

A suíte 191 já usava a configuração correta e não pertence à conversão. Sua intermitência histórica continua aberta: esta descoberta não reproduz nem explica aquele registro. As aprovações antigas demonstram o comportamento no contexto realmente criado; não comprovam movimento reduzido apenas porque ele estava declarado numa opção ignorada.

Banco técnico, navegador emulado, relógio JavaScript e tempo real são condições de teste distintas. Nenhuma delas certifica aparelhos físicos, conta ou serviços reais, conteúdo médico ou ausência geral de intermitências. O defeito de fim de deck corrigido na 17.04 permanece separado dessa correção de infraestrutura. Ver [causa e limites da 17.04](NQ_STUDY_SCROLL_1704.md).
