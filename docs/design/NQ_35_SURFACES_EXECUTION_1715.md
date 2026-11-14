# Execução das 35 superfícies — candidata 17.15

13/11/2026. O proprietário autorizou implementar o relatório e delegou a ordem das prioridades. Este ledger conserva os 35 fluxos do inventário e distingue mudanças aplicadas de trabalho ainda necessário. Uma linha não equivale a uma melhoria entregue ou a uma página integralmente certificada.

Base publicada: 17.12, merge 06f27f1a6e77c58f8cbe5481d16a6adeae62bfaf. A candidata 17.13 não foi publicada após a CI1075. Os dois primeiros lotes foram reunidos na 17.14, HEAD bc2eec760e72e3e50b25ba13a182a647b20ecaca; sua CI1076 concluiu RED com duas falhas do seletor antigo109, quatro flaky e 265 skips. A publicação da 17.14 foi segurada pelo overflow real do rótulo Acertos na Derrota em 320 px/fonte raiz de 32 px. A continuidade passa à candidata 17.15 no mesmo PR967, ainda sem publicação. O CSS mínimo foi integrado após 2/2 percursos completos, com bump 17.15 aplicado; os gates do HEAD final permanecem pendentes. As seis provas anteriores do menu R3 continuam válidas apenas para seu recorte e condições registrados.

Estados usados na tabela:

- **E17.11 parcial:** recorte publicado e conferido naquela versão; não certifica toda a superfície.
- **V17.15:** código acumulado dos lotes para a candidata, com provas delimitadas; permanece sujeito aos gates finais e não está publicado.
- **C:** conferir ou executar um próximo recorte; nenhuma nova alteração é declarada entregue por esta rodada.

| # / Superfície | Estado atual | Recorte aplicado ou próximo passo delimitado |
|---|---|---|
| 1. Home pública | C | Atlas e CTA existentes. Conferir passagem para a demonstração e movimento normal antes de acrescentar efeito; sem nova mídia nesta candidata. |
| 2. Portal / cadastro, login e recuperação | V17.15 — 265 e Auth | Fade somente do formulário selecionado, com foco e erro nativos. Guard da sessão inicial anônima reaplica o Portal após preparação do owner; Guest e epoch preservados. Serviços reais não certificados. |
| 3. Átrio | V17.15 — 265 | Orientação conservadora de primeiro acesso junto ao CTA; histórico, tombstone e registro de outro owner não viram primeiro acesso. Menu e luz existentes preservados. |
| 4. Seleção de personagem | V17.15 — 259 | Retrato e bônus precedem a história no celular; dez estágios, seleção rápida, teclado, imagem lenta e confirmação nativa cobertos no recorte. Não inicia jornada pela prévia. |
| 5. Dificuldade | C | Conferir continuidade das barras, vidas e rodapé. Preservar a seleção existente; nenhuma nova regra de dificuldade. |
| 6. Jornada / perguntas | V17.15 — 261, 112 e 182 | Texto alinhado à esquerda até 768 px, alternativas imóveis e correção por fade de 200 ms. Classe de erro, perda de vida, progresso e atalhos preservados. |
| 7. Fase final / chefe | C | Comparar largura com a campanha e conferir feedback de dano real; não presumir necessidade de nova animação nem reencenar recompensas. |
| 8. Encerramento / vitória e derrota | V17.15 — reflow da derrota | Até 480 px, estatísticas em pares rótulo/valor por linha. Corrige o excesso do dt Acertos em 320 px/fonte 32 px. Contraprova completa 2/2 com mesmas asserções, crédito único e nova tentativa; observação adicional 1/1 e capturas 390/16 e 320/32 conferidas, com controles alcançáveis. Desktop preservado; demais encerramentos não ficam integralmente certificados. |
| 9. Painel / Visão Geral | E17.11 parcial + C | Ícones publicados. Conferir continuidade e foco dos destinos existentes, sem novos contadores. |
| 10. Competências | E17.11 parcial + V17.15 — 263 | Título único publicado. Nova transição só no detalhe selecionado; números, gráfico, instâncias da entrada, teclado e CTA permanecem estáveis. |
| 11. Mapa clínico | V17.15 — 263 | Quantidade real da categoria e sessão limitada a 20 junto da ação. Agrupamento, busca, filtros e seleção nativa preservados. Sem mudança de classificação clínica. |
| 12. Como você erra | V17.15 — 263 | Contagens cumulativas intactas; details mostra até três horários válidos dos últimos 30 dias e abre o seletor geral de área. Não reconstrói questão ou alternativa histórica por índice. |
| 13. Estudo e Revisão | V17.15 — 258 | Agendadas vencidas separadas de inéditas; eixos, Estudo Livre, sessão pausada e FSRS preservados. Datas inválidas e agendas órfãs não inventam revisão. |
| 14. Questão do Estudo | V17.15 parcial — 261 | Leitura móvel e correção estável. A entrada da próxima questão e a intermitência histórica 191 não são declaradas resolvidas por este recorte. |
| 15. Prova | V17.15 — 260 e 70 | Faixa única de questão/tempo, sticky e foco visível após reflow; prazo absoluto, respostas e retomada nativos. Contraste mede o h1 efetivamente visível no layout estreito. |
| 16. Ritual de Iniciação | C; preparo 76 corrigido | O teste entra como Guest antes do Ritual, em vez de ocultar o Portal. Isso corrige o preparo intermitente; não declara nova melhoria visual nem mudança da recomendação. |
| 17. Julgamento Rápido | C | Conferir relógio, feedback e fim do pulso ao responder ou sair. Nenhum prazo, cálculo ou prêmio alterado. |
| 18. Câmara / catálogo de casos | E17.11 parcial + C | Abertura ambiental publicada. Conferir continuidade da seleção para a cena em movimento normal, sem novo palco ou pausa local nesta candidata. |
| 19. Câmara / atos e resultado | E17.11 parcial + C | Oito exames verticais publicados. Conferir atos, laudo estável, resultado e próximo caso; valores e geração permanecem intactos. |
| 20. Grimório / lista, resumo e referências | E17.11 parcial + C | Arte proporcional publicada. Conferir realce temático, resumo e restauração de busca, filtro e posição. |
| 21. Forja | Conferência nativa delimitada, sem novo código | Compra real por ouro local, comparação com seis espaços ocupados, decisão única, venda e retorno passaram em computador/celular. Capturas conferidas no recorte. Recursos persistidos e catálogo reais; não certifica todos os sorteios ou serviços. |
| 22. Inventário / equipamentos | Conferência nativa delimitada, sem novo código | Seis equipamentos reais, inspeção por teclado e grade cheia passaram em computador/celular sem consumo. Não cria uma página autônoma de inventário nem certifica toda combinação. |
| 23. Recompensas / baús e evolução | Conferência nativa delimitada, sem novo código | Original 5/10; R1 focal 3/4, sendo a falha o reflow da derrota, reparado em contraprova separada. Baú/evolução passaram nos dois perfis; RNG preservado, somente o ramo sorteado observado. Não equivale a 10/10 em uma única rodada nem certifica todos os pergaminhos. |
| 24. Conquistas / objetivos | Conferência nativa delimitada, sem novo código | Vitrine histórica cheia/filtros/detalhe passaram em desktop e na R2 mobile 1/1. O timeout anterior ocorreu no helper de decode de imagens fora do quadro; a R2 exige imagens efetivamente vistas prontas, preservando métricas e gestos. Vitrine recolhível continua futura; critérios reais preservados. |
| 25. Classificação | V17.15 — 262 e 126 | Retry no erro, filtro e modo preservados, respostas antigas rejeitadas. Atualizar focado conserva sua âncora com busy/aria-disabled e deduplicação; teste 126 original mantido. Serviço remoto não certificado. |
| 26. Oráculo | C | Conferir âncora e chegada da resposta sem perder leitura, somente com fronteira local controlada; preservar cota e contexto. |
| 27. Avaliação e reporte de questão | C | Conferir estrelas, retorno e texto após falha com envio simulado; nenhuma avaliação do conteúdo médico. |
| 28. Conta e plano | C — futuro recorte de apresentação | Melhorias de consulta, edição e foco continuam no inventário; titularidade, acesso e exclusão preservados. Sem operações reais nesta candidata. |
| 29. Preços, checkout e confirmação de pagamento | C — futuro recorte de apresentação | Conferir plano, espera, cancelamento e erro com mocks. Confirmação depende do servidor; regras de pagamento intactas. |
| 30. Preferências | V17.15 — 265; R3 aprovado localmente | Estado aplicado e prévia no mesmo menu, usando preferências existentes. R3 passou 6/6, incluindo geometria em 320 px/fonte 32 px; capturas conferidas pelo coordenador. CI final e publicação ainda pendentes. |
| 31. Histórico, ajuda e novidades | V17.15 parcial — 264 + C | Novidades ganha índice e retorno no próprio leitor, sem alterar notas históricas ou URL da SPA. Ajuda e demais leitores ainda exigem conferência específica. |
| 32. Estudo Offline | V17.15 — 264 | Estado local da conexão em espaço reservado e retorno explícito ao jogo; sem navegação automática ou promessa de sincronização. Os dois scripts originais de sessão/histórico permanecem byte a byte. |
| 33. Contato e privacidade | V17.15 — 264 | Erro associado ao campo, texto preservado após falha e confirmação junto da ação; índice da política com retorno. Envio só simulado e oito seções legais intactas. |
| 34. Administração / acesso, analytics, campanhas e galeria | C — futuro recorte de apresentação | Uniformizar consulta, carga e erro primeiro. Permissões, confirmações e operações administrativas preservadas; nenhum serviço real exercitado. |
| 35. Página não encontrada e recuperação de atualização | V17.15 parcial — 262 + C | Atualização oferece retry e só confirma após limpeza verificada, preservando destino e progresso. A 404 continua no inventário para conferência visual própria. |

## Evidência preservada e limites

O [plano original](NQ_INTERNAL_PAGES_PLAN_2026-11-13.md) e o [plano técnico](../superpowers/plans/2026-11-13-ux-priorities-1713.md) dão contexto ao inventário. O [relatório atual da candidata 17.15](NQ_USABILITY_PRIORITIES_1715.md) registra a retenção da 17.14 e as condições adicionais. O [relatório](NQ_USABILITY_PRIORITIES_1714.md) e o [ledger da 17.14](NQ_35_SURFACES_EXECUTION_1714.md) permanecem históricos intactos.

A CI1075 da candidata não publicada terminou com 15 jobs, sete verdes e oito reprovados: 3.238 PASS diretos, 16 falhas, uma intermitência e 265 skips em 3.520 casos. Nenhum job foi cancelado ou repetido para substituir esse registro. Os reparos distinguem expectativas antigas, preparo de teste e defeitos reais; logs e artefatos oficiais permanecem preservados.

A fase 2 R1 passou 40 de 42 cenários; seus dois REDs do menu estreito permanecem no histórico. R3 passou os seis cenários locais, com capturas normal/mobile ampliada conferidas pelo coordenador; CSS e diagnóstico da 265 foram integrados após guard da origem R1 e igualdade com R3. O snapshot final de 29 assets foi preservado com manifesto próprio. As contraprovas de leitura por largura e de seis contratos de Ranking passaram 12/12 cada, sem flaky ou skip. Os unitários de respostas/cinema/Auth passaram 133/133 após completar DOM/eventos do harness, conservando os scripts reais e as asserções. A bateria de lógica passou 449/449 com Git normal; a execução anterior com cinco erros de permissão de Git no ambiente isolado permanece registrada, sem alterar asserções para obter o resultado posterior. Esses resultados não substituem a CI completa do novo HEAD.

Os cinco recortes E17.11 têm publicação comprovada no PR965/merge e63cbb85fc20fd926f29e28c8132eb7bbaafba14, Pages 43472577933, 17 hashes e percursos públicos delimitados. A evidência de personagem 16/32 px cobre somente as capturas registradas; a prévia preta no visualizador não é declarada defeito de produto. Inventário ocupado, compras, serviços reais e movimento normal de todas as superfícies não foram certificados por essas capturas.

A CI1076 do HEAD17.14 concluiu RED (3.301 diretos, duas falhas109, quatro flaky e 265 skips); mesmo uma aprovação não publicaria automaticamente essa candidata, segurada pelo defeito de reflow encontrado depois. As provas de recompensas ficaram em 5/10 na rodada original e 3/4 na R1 focal, com um overflow ainda aberto. O timeout de preparo/decodificação de Conquistas permanece em diagnóstico. A contraprova do CSS passou 2/2; Conquistas mobile passou 1/1 após ajuste somente no helper de imagens efetivamente visíveis. A 17.15 ainda exige seus próprios gates finais e a observação complementar 1/1, aprovada e conferida nas duas capturas.

## Condições restantes da candidata

- Conservar o snapshot final e a evidência R3 durante a regressão integrada, com fontes reais, teclado, movimento reduzido e conservação do contexto.
- Manter assets e bump 17.15 no mesmo commit, com versão/SW, Sentry, cache-busters, mapa de assets e release técnico do manifesto coerentes.
- Revisar o HEAD final e concluir nova CI completa; manter a CI1075 RED visível no histórico.
- Após integração autorizada, conferir Pages, hashes do merge publicado e percursos públicos somente leitura.
- Continuar os recortes C sem reduzir silenciosamente as 35 superfícies aos lotes já aplicados. Publicar a 17.15 não encerra as linhas pendentes deste ledger.

Conteúdo médico, referências, identidades, histórico, FSRS, economia e regras de pagamento permanecem fora desta revisão. A intermitência 191 segue aberta. Celular emulado, leitor de tela falado, aparelhos físicos, sincronização entre aparelhos reais e serviços reais têm limites próprios; não há declaração de perfeição ou certificação integral do site.

Atualização de regressão:70/78 tiveram 30 aprovações e dois skips previstos;64/109 passaram 4/4 após Guest explícito e título exato. O quarto flaky181 teve Portal comprovado no frame dentro da medição; a entrada Guest nativa passou4/4 na contraprova. A R3 de Conquistas passou1/1 e confirmou90/90 pontos cobertos, scroll externo zero e capturas conferidas: o problema era o enquadramento artificial do helper, corrigido sem alterar produto. Ver o relatório17.15 para o fechamento das candidatas.

Preparação final:65/112 optam por navegação única no helper, preservando defaultreload/seed/owner/Guest/asserções/prazo20s. Os quatro casos passaram em11,4–15,3s após os timeouts locais de preparo preservados. As intermitências97/198 da CI1077 permanecem sem causa atribuída; todos os resultados das candidatas e seus artefatos serão mantidos.
