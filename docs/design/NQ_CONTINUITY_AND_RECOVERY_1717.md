# Continuidade e recuperação — candidata 17.17

Base: `125c73b41763c9c855d899bb696ea4298dbaeafa`, versão 17.16 publicada. Esta etapa executa a continuação autorizada das 35 superfícies. Conteúdo médico, respostas, referências, economia e geradores clínicos ficam fora do recorte.

## Comportamentos preparados

- **Estudo:** acompanhar o foco já existente na correção quando uma mudança de fonte ou geometria a tira da tela. A leitura com rolagem normal não deve provocar reposicionamento; o observador termina ao avançar ou sair.
- **Oráculo e diagnóstico:** manter a pergunta digitada após falha e separar o contador local por conta. O limite e a autorização continuam no servidor. O registro antigo sem titular não é atribuído a uma conta por suposição.
- **Reporte:** uma resposta ou um temporizador antigo só pode afetar seu próprio formulário e sua jornada. Trocar de conta ou aposentar a jornada invalida o formulário anterior; foco tardio não deve disputar um controle já escolhido.
- **Avaliações:** distinguir escolha local de envio confirmado. Falha mantém as duas notas e oferece nova tentativa explícita, inclusive após sair da aba e retornar. As escolhas ficam separadas por conta dentro da mesma chave de armazenamento, preservando a limpeza existente no logout/reset. Confirmações antigas não validam escolhas novas; não há reenvio automático de registros anteriores nem promessa de idempotência do servidor.
- **Julgamento Rápido:** impedir abertura duplicada e remover somente os efeitos pertencentes àquela execução ao avançar ou sair. O prazo continua baseado no relógio existente.
- **Convites da jornada:** aguardar a volta à campanha visível e liberada antes de apresentar um desafio. A fila conserva os marcos e o prazo original, sem consulta periódica. Uma retomada válida do mesmo piloto transfere somente os dados privados de convites pendentes para o novo contexto.
- **Retomada do piloto:** aguardar a liberação efetiva da própria proteção entre abas antes de readquiri-la. Outra aba continua impedindo acesso concorrente.
- **Home:** suspender movimento e demonstração fora da área visível ou com a página em segundo plano. A demonstração retoma seu tempo restante; movimento reduzido apresenta o conteúdo diretamente.
- **Chefe:** manter números do HUD inteiros e a narrativa legível com texto ampliado, preservando espaço, valores e leitura no tamanho habitual.
- **Equipamentos:** substituir uma imagem inicial que falhou pelo símbolo e nome do mesmo item, sem erro de JavaScript ou alteração de atributos. A codificação agora respeita tanto a string do evento quanto seu atributo HTML.
- **Conta:** manter o foco no aviso ao desabilitar Salvar e reenquadrar a mensagem de erro somente se o usuário ainda estiver aguardando nela.
- **Preparação de pagamento:** mostrar uma janela acessível, permitir voltar aos planos e encerrar uma espera local após 30 segundos. Nova tentativa conserva o plano. Resposta antiga, cancelada ou de outra conta não pode navegar nem remover a tentativa atual. Voltar aos planos não cancela uma compra no provedor.
- **404:** oferecer retorno explícito ao Átrio e à página inicial, com composição própria, texto ampliável e movimento reduzido.
- **Visão Geral:** apresentar somente uma ação de revisão quando já houver sessão pausada e revisões vencidas. Sem personagem, o texto ocupa a largura útil antes reservada à arte ausente; o calendário reflui com texto ampliado, preservando os rótulos, a ordem e os totais.
- **Administração:** encerrar os painéis da sessão aposentada e rejeitar resultados tardios de outra conta ou atualização. Ranking vazio não impede carregar as avaliações; ausência do cliente termina em erro legível. Ações e confirmações administrativas existentes permanecem.

## Evidência e limites

Cada defeito funcional tem um cenário de reprodução anterior à correção. As matrizes locais usam banco técnico ou fronteiras remotas controladas; não criam pagamentos, mensagens ou avaliações reais. Desktop e celular são navegadores emulados. As capturas de composição usam fontes reais e incluem 320 px com texto a 200%.

Os pergaminhos AKIKI e PRESERVE foram conferidos somente na apresentação já publicada: os quatro conjuntos de seções couberam sem rolagem interna nas duas larguras de desktop observadas. Não foi necessário editar os artigos nem se comprovou entrega de recompensa nessa inspeção.

A intermitência histórica da primeira resposta do Estudo permanece sem atribuição retrospectiva exclusiva. A correção nova trata especificamente a mudança de geometria após ampliar o texto; não transforma uma hipótese histórica em causa comprovada.

O guard de movimento detectou uma opção de teste ignorada em duas novas matrizes. As declarações foram corrigidas; as rodadas anteriores ficam preservadas e não provam a preferência de movimento solicitada. Também foram conservadas falhas anteriores ao exercício causadas por recusas de arquivos no preview, sem atribuição automática ao produto.

Esta candidata ainda exige fechamento das matrizes finais, conferência do conjunto exato de arquivos, CI, integração, publicação e verificação no domínio oficial. Durante a preparação, `version.json` identifica a árvore candidata; a publicação precisa ser reconhecida pelo merge, Pages e arquivos do domínio, sem antecipar esse estado.

## Arquivos e conferência

O recorte funcional se concentra em `js/game.js`, `study-mode.js`, `minigame.js`, `pilot.js`, `account.js`, `paywall.js`, `admin.js`, `auth.js` e `dashboard.js`. A apresentação usa `landing/script.js`, `landing/styles.css`, `styles/lumen/game.css`, `styles/lumen/dashboard.css`, `styles/lumen/bossfinishing.css` e `404.html`. Versão, cache, referências de assets nos dois HTML e o campo técnico de release do manifesto precisam acompanhar o mesmo commit; os demais bytes clínicos permanecem iguais à base.

As novas regressões ficam nas specs 268–283. As preparações legadas 04/11/13/35/61/67/68/81/84/227 são atualizadas para as fronteiras atuais de visitante, titularidade, quota, endereço de avaliação, painel administrativo real e resposta pendente controlada, preservando os critérios de comportamento e segurança. O percurso longo 276 resolve a comparação e a recompensa pelos controles nativos antes de voltar ao Átrio. O VM de identidade ganha somente o método de ancestral ausente no DOM destacado; geometria continua testada no navegador.

Na bateria local de lógica, os oito grupos passaram 493 testes, sem falhas ou drift durante a execução. A matriz adicional de desafios, titularidade, avaliações e foco passou 75 de 78 casos, com dois skips móveis previstos e uma falha do preparo longo por uma comparação de equipamento ainda aberta. Essa rodada não é declarada limpa nem descartada. Uma outra rodada de avaliação/reporte passou 35 de 36 casos; a falha de contexto durante o reload do preparo não teve causa exclusiva atribuída, mesmo após seis percursos focais aprovados. As correções de preparação e suas contraprovas ficam separadas das correções do produto; a CI do HEAD final continua obrigatória.

O preparo do percurso longo foi corrigido pelos botões nativos, sem alterar o sorteio ou os recursos fora dos handlers reais. Seis percursos focais passaram com o mesmo limite de 20 segundos; dois deles produziram três decisões de comparação, efetivamente resolvidas. Os outros quatro não comprovam essa ramificação. A geometria final de Visão Geral passou 18 controles e os campos de Conta/checkout foram conferidos em quatro perfis, incluindo texto ampliado; não são medições de desempenho nem testes em aparelho físico.

Os dois controles representativos de geometria passaram depois da consolidação da spec 282. Uma captura ampliada anterior deslocou programaticamente o contêiner externo durante o enquadramento; a conferência nativa por roda e teclado manteve `scrollTop` externo em zero, o foco e os hit-tests dentro do Painel. A imagem ambígua permanece preservada e não é declarada defeito de camada; navegação e cabeçalho não foram redesenhados.

Conferência interativa do recorte: responder e ampliar a correção no Estudo; revisitar uma avaliação pendente e retornar à página; retomar o piloto uma vez depois do Átrio; voltar aos planos durante a preparação; repetir o salvamento da Conta após falha. Administração e pagamentos são exercitados com serviços controlados nos testes, sem realizar operações administrativas ou compras reais.
