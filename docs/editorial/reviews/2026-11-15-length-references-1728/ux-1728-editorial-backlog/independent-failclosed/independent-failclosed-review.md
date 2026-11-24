| Achado | Prioridade | Estado final |
|---|---|---|
| FC-1: Catálogo desaparece depois do clique e antes de terminar a animação do baú. | P1 | Corrigido e reverificado |
| FC-2: Baú automático e resultados finais com módulo obrigatório ausente. | P1 | Corrigido e reverificado |
| FC-3: Tentar novamente após falha inicial do script obrigatório ou após uma promessa completa já resolvida. | P2 | Corrigido e reverificado |

Os doisP1 e oP2 foram identificados por esta revisão e corrigidos peloREFagent. Nenhuma alteração de produção feita por mim.

FC-1: Callback consumia entry/receipt e removia popup antes de claimChestReward bloquear por módulo ausente. Prêmio poderia desaparecer sem entrega. Callback revalida antes de mutar, retira somente popup/temporizador e mantém a mesma oportunidade. Recuperação entrega uma única recompensa.

C:/Users/orlan/.codex/worktrees/nq-pagamento-atomico/base-verification/js/game.js:7119 — function _animateAndClaimChest(trigger)
C:/Users/orlan/.codex/worktrees/nq-pagamento-atomico/base-verification/js/game.js:7008 — function _withdrawChestReward(entry)

FC-2: Popup só oferecia Abrir, guard retornava e Escape/Tab eram capturados por nqDialogo sem botão de saída. Barreira de prêmio pendente também podia adiar resultados indefinidamente. trigger não cria popup sem catálogo; flush e ação retiram popup indisponível. hasPendingChestReward não barra vitória enquanto módulo falta, mas a fila continua intacta. Restauração permite o mesmo prêmio sem repetir resultados.

C:/Users/orlan/.codex/worktrees/nq-pagamento-atomico/base-verification/js/game.js:6954 — function hasPendingChestReward()
C:/Users/orlan/.codex/worktrees/nq-pagamento-atomico/base-verification/js/game.js:7023 — function _flushChestRewards()
C:/Users/orlan/.codex/worktrees/nq-pagamento-atomico/base-verification/js/game.js:7087 — function triggerChestRewardPopup(entry = null)

FC-3: Loader só conferia refs/articles, e promessa resolvida era reutilizada sem validar módulo. A tentativa não recuperava o catálogo faltante. Caminho completo reutiliza src estáticoHTML do módulo, revalida promessa completa e cache individual; refsOnly continua apenas bibliografia. Teste bloqueia rede e depois permite recuperar o módulo sem recarregar a página.

C:/Users/orlan/.codex/worktrees/nq-pagamento-atomico/base-verification/js/utils.js:1123 — function carregarDadosGrimorio(options = {})

Contraprova própria:45unidades passaram; cenário306 de ausência/recuperação noChromium passou1/1, retries0, zero pageerrors. Arquivos-fonte não mudaram durante as duas execuções.

CorpoCMV inválido e leitor histórico: Sem catálogo, somente status de indisponibilidade; nenhum corpo/link/leitor registrado é publicado. Com catálogo, chaveCMV retirada é notice histórico sem URL/corpo, inclusive snapshot antigo e admin.
Acervo/cache/favoritos: Guard antecede cache antigo. Aba indisponível preservaID/tabpanel e saída; leitores e favoritos recusam ação sem mutação. Registros retirados não são promovidos a obras descobertas.
Conquista e unlocks: Condição não concede conquista sem catálogo; progresso declara Dados indisponíveis/completefalse. Chave retirada não ganha crédito nem é trocada silenciosamente por outra obra.
Baú comprado e claim direto: Ausência é verificada antes do débito de ouro, sorteio, unlock, score ou incremento de baús. Testes preservam recursos e registros.
Baú automático/última resposta/vitória: Janela assíncrona revalidada, popup suspenso sem consumir receipt, vitória não fica presa e recuperação não duplica resultado/prêmio.
Questões/navegação/recuperação: Falha na biblioteca não impede a questão, alternativas ouNext. Caminho full da biblioteca permite recuperar a dependência; refsOnly não recebe a dependência nova.

Sem achado acionável remanescente no escopo dos bytes pinados. Limites: uma contraprova independente desktop; mobile consta na rodada do implementador. Não é gate médico nem promessa de persistência após encerrar o processo.

JSON RAW 5a18fde7249d33edf284622b9d905e59361d4ab8f64ef63eea88674925be8e45.
