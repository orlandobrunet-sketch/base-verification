# End, foco e Ritual — preparação da 17.24

A candidata 17.23 não foi publicada. A conferência completa revelou duas intermitências adicionais; esta revisão reúne seus reparos às correções de End e foco da Câmara. Conteúdo médico, respostas, referências, economia e regras de progressão permanecem preservados.

## Comportamento corrigido

- **End após ampliar o texto:** a fonte termina de mudar antes da tecla, mesmo com movimento reduzido. O leitor conserva a rolagem nativa; não há interceptador de End ou espera adicionada aos testes antigos.
- **Câmara:** os callbacks de foco de 30 ms respeitam um controle ou leitor escolhido pelo usuário nesse intervalo.
- **Ritual:** os botões mantêm sua posição quando o mouse encosta na borda. A cor e a borda continuam respondendo à interação. O ajuste é uma declaração em `styles/lumen/ritual.css`.
- **Preparo do teste de XP:** somente o cenário de quatro acertos da spec 216 passa pela entrada nativa como visitante. Seus 45 segundos, quatro respostas, evolução, valores, barras, saldo e demais asserções permanecem iguais. O helper compartilhado não mudou.

## Causas e provas preservadas

A [investigação da 17.23](NQ_END_AND_INTERMITTENCIES_1723.md) contém os REDs de fonte/foco, as contraprovas e os limites históricos. End passou 32 cenários locais; a Câmara passou 20 na fonte combinada. Não são reexecuções da 17.24, cujos dois arquivos funcionais correspondentes continuam iguais.

**CI1094**, fonte `85b53d47c4962bc65f77bc20d31679ed882fb232`, run `43729727169`: 3.566 aprovações diretas, 268 skips previstos e nenhuma repetição/falha na bateria completa; smoke 130. O workflow foi reprovado pelo coletor focal, embora seus quatro casos Linux passassem: três IDs de transporte fizeram a captura terminar incompleta.

**CI1095**, fonte `84db8cb2ddad30eaff12faacce666cf292ec2a26`, run `43730767626`: 16 grupos aprovados; 3.564 aprovações diretas, duas após repetição e 268 skips previstos, sem falha final. Smoke 130. O coletor focal passou quatro casos sem retry, com 278 registros projetados, três respostas reservadas de fechamento e nenhum contador de perda, parse ou identificador inválido. Isso confirma a nova fronteira; os IDs omitidos da CI1094 não foram recuperados retrospectivamente.

As duas repetições da CI1095 foram investigadas antes da publicação:

1. **199, Ritual em 390 px:** o trace conserva a última posição do mouse em `(195, 718.21)`. O botão estava junto dessa borda e o clique permaneceu esperando estabilidade durante 20 segundos. Dois cenários técnicos novos, em 390 e 1280 px, reproduziram **dois REDs**: a geometria alternava exatamente um pixel e `:hover` alternava a cada frame. A causa é o deslocamento herdado de `.btn:hover`; não é preciso atribuir a falha a lentidão ou aumentar o prazo.
2. **216, XP:** o log e o trace mostram o Portal interceptando a alternativa durante o preparo anônimo, antes da conclusão das quatro respostas. O cenário ainda usava somente a ocultação manual do Portal. A opção já existente `asGuest:true` conclui a entrada nativa e persiste a intenção de visitante. Nenhuma mudança no cálculo de XP foi necessária.

## Validação desta candidata

A seleção local de 199, 216 e 292 passou **52/52**, sem retry, skip ou erro do runner, em 268,4 segundos. Os quatro casos novos da 292 têm auditorias reais limpas: nenhum erro de página, método não GET ou WebSocket; a amplitude vertical ficou em zero nos quatro, e o clique nativo avançou à segunda questão. Os dois REDs anteriores não são somados a esses 52. A nova 292 usa somente questões técnicas, ações nativas, amostras em frames e auditoria de rede. A posição do ponteiro é a fronteira reproduzida; não há clique forçado, remoção de overlay ou aumento de timeout.

Após atualizar a versão/cache, os **549/549 contratos Node** passaram, sem falha ou skip. A suíte completa coleta **3.838 casos em 276 arquivos**; isso é inventário, não resultado da CI desta candidata. Sintaxe, coerência de cache-busters e diff foram conferidos. Os callbacks da Câmara e a regra de End continuam idênticos aos reparos anteriores; o novo commit altera apenas o estilo do Ritual, o preparo indicado, o teste de borda, os registros e os metadados de publicação.

A versão, o cache, Sentry e os cache-busters devem acompanhar os três assets funcionais no mesmo commit. O manifesto de questões muda apenas no identificador do release. CI do HEAD consolidado, Pages, bytes públicos e percursos públicos continuam sendo gates próprios; as execuções anteriores não os substituem.

## Limites mantidos

As ocorrências históricas 96/97/98/191/193/226/279 sem atribuição exclusiva continuam registradas. A captura focal ajuda a distinguir protocolo e navegação; aprovações posteriores não provam a causa de um evento antigo. O coletor de pilha rejeitado não foi integrado à 193.

Celulares são emulados. Não houve verificação em aparelho físico nem operação real de conta, pagamento, IA ou envio de relato. Os arquivos e recibos externos ficam na pasta de evidências da sessão, com prefixos `ux-1723-ci1094`, `ux-1723-ci1095` e `ux-1724`.
