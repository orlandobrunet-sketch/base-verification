# Execução das 35 superfícies — candidata 17.14

13/11/2026. O proprietário autorizou implementar o relatório e delegou a ordem das prioridades. Este ledger conserva os 35 fluxos do inventário e distingue mudanças aplicadas de trabalho ainda necessário. Uma linha não equivale a uma melhoria entregue ou a uma página integralmente certificada.

Base publicada: 17.12, merge 06f27f1a6e77c58f8cbe5481d16a6adeae62bfaf. A candidata 17.13, HEAD 5026880926f16c68710326069e574390a42fb23a, não foi publicada após a CI1075 reprovada. Fase 1, fase 2 R1 e o reparo do Atualizar foram reunidos na árvore de trabalho da 17.14, no mesmo PR967. O bump técnico está aplicado; CI do novo HEAD e publicação continuam pendentes. A contraprova R3 do menu passou 6/6 localmente; o coordenador conferiu as capturas normal e mobile com fonte raiz de 32 px, e os arquivos foram integrados com conferência dos hashes.

Estados usados na tabela:

- **E17.11 parcial:** recorte publicado e conferido naquela versão; não certifica toda a superfície.
- **V17.14:** código aplicado à candidata, com provas delimitadas; permanece sujeito aos gates finais e não está publicado.
- **C:** conferir ou executar um próximo recorte; nenhuma nova alteração é declarada entregue por esta rodada.

| # / Superfície | Estado atual | Recorte aplicado ou próximo passo delimitado |
|---|---|---|
| 1. Home pública | C | Atlas e CTA existentes. Conferir passagem para a demonstração e movimento normal antes de acrescentar efeito; sem nova mídia nesta candidata. |
| 2. Portal / cadastro, login e recuperação | V17.14 — 265 e Auth | Fade somente do formulário selecionado, com foco e erro nativos. Guard da sessão inicial anônima reaplica o Portal após preparação do owner; Guest e epoch preservados. Serviços reais não certificados. |
| 3. Átrio | V17.14 — 265 | Orientação conservadora de primeiro acesso junto ao CTA; histórico, tombstone e registro de outro owner não viram primeiro acesso. Menu e luz existentes preservados. |
| 4. Seleção de personagem | V17.14 — 259 | Retrato e bônus precedem a história no celular; dez estágios, seleção rápida, teclado, imagem lenta e confirmação nativa cobertos no recorte. Não inicia jornada pela prévia. |
| 5. Dificuldade | C | Conferir continuidade das barras, vidas e rodapé. Preservar a seleção existente; nenhuma nova regra de dificuldade. |
| 6. Jornada / perguntas | V17.14 — 261, 112 e 182 | Texto alinhado à esquerda até 768 px, alternativas imóveis e correção por fade de 200 ms. Classe de erro, perda de vida, progresso e atalhos preservados. |
| 7. Fase final / chefe | C | Comparar largura com a campanha e conferir feedback de dano real; não presumir necessidade de nova animação nem reencenar recompensas. |
| 8. Encerramento / vitória e derrota | C | Conferir hierarquia das ações e celebração única. Handoff e crédito nativos preservados; a revisão visual de todos os encerramentos segue delimitada. |
| 9. Painel / Visão Geral | E17.11 parcial + C | Ícones publicados. Conferir continuidade e foco dos destinos existentes, sem novos contadores. |
| 10. Competências | E17.11 parcial + V17.14 — 263 | Título único publicado. Nova transição só no detalhe selecionado; números, gráfico, instâncias da entrada, teclado e CTA permanecem estáveis. |
| 11. Mapa clínico | V17.14 — 263 | Quantidade real da categoria e sessão limitada a 20 junto da ação. Agrupamento, busca, filtros e seleção nativa preservados. Sem mudança de classificação clínica. |
| 12. Como você erra | V17.14 — 263 | Contagens cumulativas intactas; details mostra até três horários válidos dos últimos 30 dias e abre o seletor geral de área. Não reconstrói questão ou alternativa histórica por índice. |
| 13. Estudo e Revisão | V17.14 — 258 | Agendadas vencidas separadas de inéditas; eixos, Estudo Livre, sessão pausada e FSRS preservados. Datas inválidas e agendas órfãs não inventam revisão. |
| 14. Questão do Estudo | V17.14 parcial — 261 | Leitura móvel e correção estável. A entrada da próxima questão e a intermitência histórica 191 não são declaradas resolvidas por este recorte. |
| 15. Prova | V17.14 — 260 e 70 | Faixa única de questão/tempo, sticky e foco visível após reflow; prazo absoluto, respostas e retomada nativos. Contraste mede o h1 efetivamente visível no layout estreito. |
| 16. Ritual de Iniciação | C; preparo 76 corrigido | O teste entra como Guest antes do Ritual, em vez de ocultar o Portal. Isso corrige o preparo intermitente; não declara nova melhoria visual nem mudança da recomendação. |
| 17. Julgamento Rápido | C | Conferir relógio, feedback e fim do pulso ao responder ou sair. Nenhum prazo, cálculo ou prêmio alterado. |
| 18. Câmara / catálogo de casos | E17.11 parcial + C | Abertura ambiental publicada. Conferir continuidade da seleção para a cena em movimento normal, sem novo palco ou pausa local nesta candidata. |
| 19. Câmara / atos e resultado | E17.11 parcial + C | Oito exames verticais publicados. Conferir atos, laudo estável, resultado e próximo caso; valores e geração permanecem intactos. |
| 20. Grimório / lista, resumo e referências | E17.11 parcial + C | Arte proporcional publicada. Conferir realce temático, resumo e restauração de busca, filtro e posição. |
| 21. Forja | C — revelação ainda não conferida | Entrada observada; item comprado, comparação e decisão pendente ainda pedem percurso local dedicado. Nenhuma alteração de economia. |
| 22. Inventário / equipamentos | C — estado vazio observado | Conferir equipamento ocupado e comparação; compactar o vazio somente se a prova visual justificar. |
| 23. Recompensas / baús e evolução | C | Conferir baú, pergaminho e evolução com ganhos nativos e crédito único. As provas de handoff não certificam todas as apresentações visuais. |
| 24. Conquistas / objetivos | C — vitrine observada | Vitrine recolhível continua futura; próxima meta e critérios permanecem visíveis e reais. |
| 25. Classificação | V17.14 — 262 e 126 | Retry no erro, filtro e modo preservados, respostas antigas rejeitadas. Atualizar focado conserva sua âncora com busy/aria-disabled e deduplicação; teste 126 original mantido. Serviço remoto não certificado. |
| 26. Oráculo | C | Conferir âncora e chegada da resposta sem perder leitura, somente com fronteira local controlada; preservar cota e contexto. |
| 27. Avaliação e reporte de questão | C | Conferir estrelas, retorno e texto após falha com envio simulado; nenhuma avaliação do conteúdo médico. |
| 28. Conta e plano | C — futuro recorte de apresentação | Melhorias de consulta, edição e foco continuam no inventário; titularidade, acesso e exclusão preservados. Sem operações reais nesta candidata. |
| 29. Preços, checkout e confirmação de pagamento | C — futuro recorte de apresentação | Conferir plano, espera, cancelamento e erro com mocks. Confirmação depende do servidor; regras de pagamento intactas. |
| 30. Preferências | V17.14 — 265; R3 aprovado localmente | Estado aplicado e prévia no mesmo menu, usando preferências existentes. R3 passou 6/6, incluindo geometria em 320 px/fonte 32 px; capturas conferidas pelo coordenador. CI final e publicação ainda pendentes. |
| 31. Histórico, ajuda e novidades | V17.14 parcial — 264 + C | Novidades ganha índice e retorno no próprio leitor, sem alterar notas históricas ou URL da SPA. Ajuda e demais leitores ainda exigem conferência específica. |
| 32. Estudo Offline | V17.14 — 264 | Estado local da conexão em espaço reservado e retorno explícito ao jogo; sem navegação automática ou promessa de sincronização. Os dois scripts originais de sessão/histórico permanecem byte a byte. |
| 33. Contato e privacidade | V17.14 — 264 | Erro associado ao campo, texto preservado após falha e confirmação junto da ação; índice da política com retorno. Envio só simulado e oito seções legais intactas. |
| 34. Administração / acesso, analytics, campanhas e galeria | C — futuro recorte de apresentação | Uniformizar consulta, carga e erro primeiro. Permissões, confirmações e operações administrativas preservadas; nenhum serviço real exercitado. |
| 35. Página não encontrada e recuperação de atualização | V17.14 parcial — 262 + C | Atualização oferece retry e só confirma após limpeza verificada, preservando destino e progresso. A 404 continua no inventário para conferência visual própria. |

## Evidência preservada e limites

O [plano original](NQ_INTERNAL_PAGES_PLAN_2026-11-13.md) e o [plano técnico](../superpowers/plans/2026-11-13-ux-priorities-1713.md) dão contexto ao inventário. O [relatório da candidata 17.14](NQ_USABILITY_PRIORITIES_1714.md) concentra causas, decisões e resultados para evitar duplicar a investigação em cada linha.

A CI1075 da candidata não publicada terminou com 15 jobs, sete verdes e oito reprovados: 3.238 PASS diretos, 16 falhas, uma intermitência e 265 skips em 3.520 casos. Nenhum job foi cancelado ou repetido para substituir esse registro. Os reparos distinguem expectativas antigas, preparo de teste e defeitos reais; logs e artefatos oficiais permanecem preservados.

A fase 2 R1 passou 40 de 42 cenários; seus dois REDs do menu estreito permanecem no histórico. R3 passou os seis cenários locais, com capturas normal/mobile ampliada conferidas pelo coordenador; CSS e diagnóstico da 265 foram integrados após guard da origem R1 e igualdade com R3. O snapshot final de 29 assets foi preservado com manifesto próprio. As contraprovas de leitura por largura e de seis contratos de Ranking passaram 12/12 cada, sem flaky ou skip. Os unitários de respostas/cinema/Auth passaram 133/133 após completar DOM/eventos do harness, conservando os scripts reais e as asserções. A bateria de lógica passou 449/449 com Git normal; a execução anterior com cinco erros de permissão de Git no ambiente isolado permanece registrada, sem alterar asserções para obter o resultado posterior. Esses resultados não substituem a CI completa do novo HEAD.

Os cinco recortes E17.11 têm publicação comprovada no PR965/merge e63cbb85fc20fd926f29e28c8132eb7bbaafba14, Pages 43472577933, 17 hashes e percursos públicos delimitados. A evidência de personagem 16/32 px cobre somente as capturas registradas; a prévia preta no visualizador não é declarada defeito de produto. Inventário ocupado, compras, serviços reais e movimento normal de todas as superfícies não foram certificados por essas capturas.

## Condições restantes da candidata

- Conservar o snapshot final e a evidência R3 durante a regressão integrada, com fontes reais, teclado, movimento reduzido e conservação do contexto.
- Manter assets e bump 17.14 no mesmo commit, com versão/SW, Sentry, cache-busters, mapa de assets e release técnico do manifesto coerentes.
- Revisar o HEAD final e concluir nova CI completa; manter a CI1075 RED visível no histórico.
- Após integração autorizada, conferir Pages, hashes do merge publicado e percursos públicos somente leitura.
- Continuar os recortes C sem reduzir silenciosamente as 35 superfícies aos lotes já aplicados. Publicar a 17.14 não encerra as linhas pendentes deste ledger.

Conteúdo médico, referências, identidades, histórico, FSRS, economia e regras de pagamento permanecem fora desta revisão. A intermitência 191 segue aberta. Celular emulado, leitor de tela falado, aparelhos físicos, sincronização entre aparelhos reais e serviços reais têm limites próprios; não há declaração de perfeição ou certificação integral do site.
