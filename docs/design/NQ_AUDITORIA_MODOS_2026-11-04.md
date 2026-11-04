# Revisão complementar de modos e transições — 04/11/2026

A rodada começou após conferir a 16.64 publicada: PR928, merge 1099f12, CI997 com 2.386 aprovações e 258 skips previstos, sem falhas, flaky ou retentativas. Os 14 arquivos públicos conferidos coincidiram com o merge. O worktree estava limpo; a candidata 16.65 está na branch codex/pente-fino-modos-1665 e ainda não foi publicada.

## Cobertura complementar

Foram usadas seis configurações: 1440×900/fonte 16 px, 768×1024/fonte 32 px, 320×740/fonte 32 px, 390×844/fonte 16 px, 320×740/fonte 16 px e 844×390/fonte 32 px, com movimento normal ou reduzido. A matriz percorreu:

- Estudo: escolha, temas, pergunta, correção, próxima e pausa.
- Simulado: introdução, correção, próxima, confirmação de saída/cancelamento e pausa.
- Julgamento: pergunta, correção e saída.
- Ritual: introdução, pergunta e saída.
- Câmara: hub, caso, ato, correção e saída.

São 22 estados por configuração: 132 antes e 132 após os ajustes. Os seis fluxos terminaram sem exceções JavaScript ou alteração indevida da jornada. Um sétimo teste após os fixes capturou o HUD ampliado. Requisições externas e WebSockets ficaram bloqueados na exploração.

## Defeitos reproduzidos e corrigidos

| Achado | Evidência anterior | Correção e contrato |
|---|---|---|
| Ctrl+A responde a prova | O Simulado tratava A mesmo com Ctrl/Alt/Meta. Ctrl+A registrou uma resposta nas seis configurações | O teclado ignora modificadores e mantém o isolamento da jornada. A regressão verifica Ctrl+A/Alt+A/Meta+A com foco no título e no body, sem resposta, e confirma A simples funcionando |
| Estudo perde foco ao corrigir | Desabilitar as alternativas deixava o foco no body. Clique correto e resposta errada por teclado reproduziram a perda | A correção recebe foco e fica visível após uma nova resposta. Renderizar uma resposta histórica preserva o foco anterior. O teste segue por Tab, próxima e pausa, com contagem única e jornada preservada |
| HUD invade colunas vizinhas a 200% | A grade desktop fixa em quatro colunas não acomodava o texto: 2500 ultrapassou sua coluna em 1100 px; a captura em 844 px mostrou legendas colidindo | A grade desktop usa auto-fit com mínimo de 4rem por coluna. Mantém quatro quando cabem e reflui com texto ampliado. O contrato mede texto real dentro da própria coluna em 1440/1100/844/390/320 px, fontes de 16/32 px, incluindo drawer mobile aberto, nos dois perfis |

## Validação

- Nova spec191: cinco contratos nos dois projetos, dez aprovações, sem skips, falhas ou retries. Um worker e 20 segundos por teste.
- Antes dos fixes, quatro regressões de teclado/foco falharam pelas causas esperadas; o teste geométrico falhou no valor 2500 a 200%. O primeiro arranjo de foco do Simulado precisou aguardar load/fontes e estabelecer o foco antes do gesto; a reprodução controlada continuou falhando por Ctrl+A. Os logs originais foram preservados.
- Bateria relacionada (66/70/118/141/147-study/189/191): 85 aprovações e cinco skips previstos, sem falhas ou retentativas.
- Cinema (164/166/167/169/171/177): 28 aprovações e 24 skips previstos, sem falhas ou retentativas. Os skips mantêm os contratos de desktop separados das apresentações nativas de toque.
- As duas baterias disjuntas somam 113 aprovações e 29 skips previstos. Os dez casos novos já estão incluídos nesse total.
- Qualidade: 325 aprovações. Sintaxe dos dois scripts aprovada. Comparação profunda confirmou os 741 bindings editoriais idênticos, alterando somente a release 16.64→16.65. Conteúdo médico intacto.
- Listagem: 2.654 casos atribuídos exatamente uma vez entre seis partes, sem omissões ou duplicações; os dez casos de raridade permanecem na suíte.
- Nenhuma assertion existente, timeout, worker ou política de retries foi relaxada. Versão, SW e cache-busters acompanham o commit dos assets. A CI do novo HEAD ainda precisa concluir.

## Vídeos e limites da revisão

A prioridade adicional de conferir os vídeos foi executada no jogo publicado: [verificação dos vídeos e transições](NQ_VERIFICACAO_VIDEOS_2026-11-04.md). Nenhum arquivo do player ou de mídia foi alterado, pois a falha de abertura não foi reproduzida nos contextos testados.

Os relatórios completos de auditarVisual preservam suas inconclusões. Alertas na jornada restaurada sobre o drawer fechado e os controles Vidas/Sequência ancorados fora da caixa original do HUD são estados já conhecidos que o instrumento não compreende. A colisão das quatro métricas foi confirmada separadamente por captura e medida dos textos dentro de suas colunas. Não foi concedida aprovação global de contraste a degradês nem certificação integral de acessibilidade. Esta rodada não fez revisão médica, não alterou alternativas/referências e não substitui teste manual com leitor de tela.

Evidências no workspace: audit2-explore.log, audit2-explore-after.log, audit2-*.json/png, audit2-regression-red-controlled.log, audit2-hud-red.log, audit2-regression-green-final.log, audit2-related.log, audit2-cinema-regression.log, audit2-quality.log, shard-coverage-1665.json e publication-verification-1664-current.json. A publicação da 16.65 depende da validação do HEAD e de autorização própria para integração.
