# Carregamento e continuidade — etapa 17.16

Base: 17.15 publicada, merge `72ebebc88bbbaa08d5b2c113d9216e5d69552410`. O usuário autorizou resolver a pausa do carregamento e seguir pelas próximas prioridades das 35 superfícies, sem conteúdo médico. Este documento registra a escolha de implementação delegada ao agente; não declara publicação ou verificação concluída.

## 1. Preparação das questões

O diagnóstico da 17.15 localizou trabalho dominante em `createCatalog` e `digest`. Uma nova rodada de três percursos nativos da base reproduziu tarefas contínuas de 2.126, 2.210 e 2.189 ms após o banco terminar de carregar. O instante desse trabalho pode variar entre os gestos de visitante e escolha da dificuldade. Medir apenas o tempo depois do clique não cobre toda a pausa.

A primeira abordagem é eliminar cálculos SHA repetidos durante a mesma construção, reaproveitando somente resultados de strings canônicas exatamente iguais. A cópia e a validação completa de cada entrada continuam obrigatórias. O cache deve ser local, descartável e inacessível aos chamadores. Não pode confiar em ID, referência do objeto ou hash declarado no manifesto. O `digest` público e a inspeção posterior permanecem sem esse cache.

Se a comparação nativa mostrar que a tarefa continua longa, reduzir o trabalho repetido sozinho será insuficiente: a próxima opção é dividir a preparação em tarefas menores, mantendo o catálogo indisponível até a validação integral. Um worker introduziria transporte, ciclo de vida e tratamento de falha adicionais; não é a primeira escolha para este recorte.

Critérios: mesmos digests, perfis, referências, histórico, vínculos, ambiguidades e recusas; fontes mutáveis precisam continuar sendo verificadas; erro não deixa catálogo parcial ou cache reutilizável. Comparar três contextos novos da base com três do candidato, mesmos arquivos, fontes, gestos e guardas, sem profiler na medição final. Conservar a mesma pergunta, recursos e histórico ao retomar. Tempos locais não são percentis nem medições em aparelho físico.

### Resultado local da preparação

O cache isolado reduziu as tarefas de 2.126 / 2.210 / 2.189 ms para 1.016 / 969 / 987 ms; esse resultado foi preservado e considerado insuficiente. A implementação final usa o mesmo núcleo de validação em geradores privados, drenado de forma síncrona nas APIs antigas e em etapas cooperativas na nova `createCatalogAsync`. O snapshot completo é copiado antes da primeira pausa. A construção compartilha uma Promise no carregador do jogo; o catálogo global só recebe o resultado integral. Falha limpa a tarefa e permite nova tentativa. Estudo, Painel e Boss aguardam essa prontidão, mantendo as verificações de titularidade e o retorno booleano da retomada salva.

As três amostras cooperativas passaram sem repetição. A maior tarefa de todo o percurso foi de 134 / 126 / 123 ms; a primeira tarefa longa iniciada após o download do banco foi de 101 / 103 / 99 ms. São definições temporais distintas, sem nova atribuição por profiler. O intervalo cooperativo de aproximadamente 8 ms não é um limite rígido: cópia e hash de um registro continuam indivisíveis. Não se promete menor tempo total da entrada.

A mesma pergunta, recursos e histórico foram preservados ao retomar em cada amostra. Um teste independente da responsividade falhou na base com zero oportunidades de execução durante a preparação pendente e passou em computador e celular emulado com 197 e 200 oportunidades, respectivamente. O teste exige os quatro perfis completos e 741 entradas no banco e no manifesto. Isso não equivale a quadros de animação ou INP.

A comparação estrutural da API conservou 32.760 resultados completos para as 741 questões, 2.964 perfis atuais e 169 registros históricos/676 bindings. Os sete grupos de lógica totalizaram 484 aprovações nas rodadas finais de cada grupo. A tentativa inicial (474 aprovações e dez falhas) foi mantida: cinco falhas de permissão na criação de repositórios temporários e cinco preparos VM que não carregavam o novo helper real. As reexecuções específicas não alteraram asserções ou regras de produto. Os logs e a derivação das medições estão preservados nos artefatos da etapa; a CI final e a publicação continuam sendo verificações separadas.

## 2. Continuidade da Câmara

A introdução agora oferece “Voltar à Câmara” antes do primeiro ato. O retorno conserva a origem: Visão geral e seu CTA, ou coleção, página e caso selecionado. A memória pertence ao overlay e não grava progresso ou considera o caso concluído. O resultado reutiliza o mesmo caminho e confere a conclusão real atualizada. Um controle de overlay fechado não pode reabrir ou substituir outra tela.

Usar os controles, fontes, espaçamento e cores existentes. A ação principal continua sendo iniciar o diagnóstico; o retorno é secundário, legível e acessível por teclado. No desktop, a coleção deve abrir na mesma página; no celular ou após mudança de largura, o caso de origem precisa ficar visível sem deslocamento horizontal. Movimento reduzido continua respeitado. Nenhum valor, alternativa, alvo, fórmula ou regra de desbloqueio entra neste recorte.

A perda da cena foi reproduzida na base: desktop preservava o nó, mas uma resposta no celular deixava o mesmo nó desconectado. O desfazer tardio da apresentação recolocava a cena na árvore antiga. A desmontagem agora acontece antes da extração e do reúso da cena; os oito valores, texto, fonte da imagem e progresso continuam sendo comparados de forma opaca.

A revisão encontrou ainda dois recortes de foco. Remapear uma aba ou paginador focado para o layout móvel e voltar ao desktop podia deixar o foco no corpo da página; o fallback agora prefere a aba selecionada visível. No layout móvel, uma mudança de fonte sem mudança de elegibilidade deixava o cartão cortado. Um reveal coalescido após o layout mantém o mesmo controle visível, com guardas de proprietário, conexão e foco. Uma margem de rolagem de 12 px preserva o contorno diante do arredondamento subpixel. As asserções de visibilidade integral não foram reduzidas.

## 3. Grimório e demais superfícies

O código já mantém busca, filtros, ordem, posição e foco no caminho normal de resumo e retorno. Os quatro contratos existentes selecionados passaram nos dois projetos, sem falhas ou repetição. Não foi necessário redesenho adicional. A aparência aprovada na 17.15 permanece a referência.

As demais linhas do relatório continuam no inventário. Não há promessa de concluir integralmente 35 páginas neste lote. Pagamentos, conta, sincronização remota e conteúdo médico não serão modificados para produzir efeitos visuais.

## Evidências e publicação

Os 48 cenários de Estudo, personagem, Prova e leitura passaram sem falhas ou repetição. A Câmara possui uma matriz própria de 14 casos; um deles examina controles gerados exclusivos do desktop e tem skip móvel previsto. Os REDs da cena, foco da aba/pager e reflow permanecem preservados. A conclusão de Liora é testada como caso novo: nona conclusão, Borius liberado e Isolde ainda bloqueada, sem interpretar respostas médicas.

Na rodada R2 da Câmara, 11 casos passaram, dois recortes de reenquadramento móvel falharam e um skip previsto foi mantido. Os dois defeitos residuais foram reparados sem reduzir a exigência de visibilidade integral: o corte de 11,45 px foi seguido por uma sobra de arredondamento de 0,45 px, eliminada pela margem de rolagem. A contraprova focal final passou 2/2 em movimento normal e reduzido. São rodadas separadas; não se declara uma rodada local única de 13/13. A matriz integral volta a ser verificada na CI e na publicação. Os 105 testes focais de Câmara e integração piloto também passaram.

Resultados devem registrar a revisão exata, separar falhas de preparo das falhas do produto e manter tentativas anteriores. Os assets, `version.json`, `sw.js`, cache-busters e releases correspondentes acompanham o mesmo commit. Este documento descreve o recorte e as provas locais; CI, integração, Pages e verificações públicas têm registro posterior no PR da etapa. Nenhuma aprovação local antecipa esses resultados.
