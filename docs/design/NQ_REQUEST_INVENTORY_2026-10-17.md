# Inventário consolidado dos pedidos do proprietário

Reconciliado em **17/10/2026**, com os pedidos recebidos até **21:04 UTC**. Incorpora os 44 grupos históricos, refinamentos posteriores, reaberturas e próximos marcos. A execução é acompanhada no [plano de continuidade](NQ_CONTINUITY_PLAN_2026-10-17.md).

**Pedido, implementação, teste e publicação são marcos diferentes.** Uma autorização como “siga” não certifica a estética de toda a aplicação. Nas linhas históricas, “registrado” significa evidência histórica indicada pela reconciliação, sem repetir agora toda a auditoria. A reabertura W2/W4 prevalece sobre a entrega anterior. Não atribuir queixas a cache sem evidência.

## Ordem de trabalho

1. Conferência pública da 16.15 concluída; seguir com os ajustes atuais da web. A revisão das questões permanece ativa, com entregas e verificações separadas da interface.
2. Concluir a etapa das questões: pistas nas alternativas, conteúdo, fontes, respostas/progresso preservados, publicação somente do que for elegível e ponto de continuidade no GitHub.
3. Depois das questões: Meus troféus, membros honorários e acesso vitalício por concluir toda a jornada Hardcore e vencer o boss.
4. Manter a adaptação dedicada para celular e a Câmara do Equilíbrio ilustrada no futuro. O proprietário não definiu a ordem relativa dessas duas frentes com as recompensas futuras; não antecipá-las sobre web/questões.

## Web atual

| ID | Pedido | Implementado | Testado | Publicado |
|---|---|---|---|---|
| W1 | Proporção da marca em todas as telas | Sim, incluindo Dashboard | Prova focal; captura final/CI pendentes | Pendente |
| W2 | Serrilhado das seis molduras, **reaberto** | Sim | Sete comparações locais; CI/pública pendentes | Pendente para a reabertura |
| W3 | Ler resumo em popup na pergunta e no Grimório | Sim | Leitor/teclado/foco/estado locais; E2E/CI pendentes | Pendente |
| W4 | Batalha final/demonstração: auditoria reaberta | Auditoria e correção dos rótulos | Vistas locais; E2E/CI pendentes | Design anterior publicado; novo parecer pendente |
| W5 | Narrativa das transições de capítulo com presença | Sim | Capturas locais; E2E/CI pendentes | Pendente |
| W6 | Pergaminho de recompensa mais largo no desktop | Sim | Capturas locais; E2E/CI pendentes | Pendente |
| W7 | Evolução concluída mais compacta | Sim | Capturas locais; E2E/CI pendentes | Pendente |
| W8 | Dr. Glomerulus inteiro em uma linha e alinhamento da Forja | Sim | CI e onze vistas públicas conferidas | **16.15**, PR 899 |

**W1.** Comparar a marca da home com os demais cabeçalhos; preservar a proporção relativa entre Nefro e Quest, legibilidade e responsividade. Não confundir com o favicon Q já publicado.

**W2.** As entregas 16.00/16.07 não encerram a queixa de 17/out. Conferir os seis slots reais em tamanho normal/ampliado, resolução/DPR, recorte/alpha e desenho da moldura. Corrigir a origem comprovada, sem cortar arte, duplicar borda ou alterar item, raridade e atributos. Comparar antes/depois; preservar preview por hover, foco e toque. O alvo inclui o card Estudante de Nefrologia, com contornos azul/dourado.

**W3.** Abrir o artigo correto em popup nos dois pontos, manter contexto da questão/Grimório, fechamento e retorno de foco, leitura confortável e conteúdo integral. Preservar referências, estado e progresso, inclusive as versões históricas.

**W4.** Há redesign publicado na versão 2.0; o pedido atual é verificar resíduos do layout antigo. Percorrer os estados relevantes da batalha e demonstração; registrar o que foi conferido. Corrigir resíduos concretos preservando regras, progresso, HP, áudio e controles. Não há defeito novo comprovado apenas pelo pedido.

**W5.** Dar ao parágrafo narrativo central um fundo temático discreto, contraste e hierarquia; manter título, estatísticas e ação separados. Aplicar padrão coerente aos capítulos e movimento reduzido. No capítulo III, a direção é verde-petróleo/esmeralda translúcido com borda suave.

**W6.** Aproveitar a largura do desktop para reduzir a rolagem quando o conteúdo couber, mantendo linhas confortáveis. Não esconder/cortar conteúdo nem diminuir fonte para forçar encaixe. Textos excepcionalmente longos continuam acessíveis; mobile adaptável. Exemplo inspecionado: Pergaminho encontrado, Épico, AKIKI (2016); modal de aproximadamente 816 px em tela de 1912 px, Curiosidade parcialmente cortada antes do rodapé. Este modal é separado do popup W3.

**W7.** Alvo: Evolução concluída, Nível 3, O Analista dos Túbulos. Retrato de aproximadamente 216×264 px impõe altura; nível/título ficam isolados à direita e narrativa abaixo. Reduzir retrato para aproximadamente 150–170 px, reunir nível, título e narrativa à direita, usar altura natural e rodapé menor. Mobile empilhado; conferir textos curtos/longos e ampliados, sem comprimir imagem, atributos ou ação.

**W8 — atualização do último resultado consultado pelo inventário.** PR 899 integrado em 17/out, merge `adad2e4b9bc4259dbd630f0d89c04bbfcd494e9b`; Pages concluído. A conferência pública antes pendente **foi concluída**: treze arquivos completos HTTP 200 iguais aos blobs aprovados e onze vistas com inspeção visual, incluindo fonte alternativa e texto ampliado. Nome completo sem corte/colisão; ícone, rótulo, título, preço e descrição da Forja alinhados. Custos e regras preservados. [CI 939](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/38994541859): Quality 287, Smoke 126, Full 1.947 passes + 187 skips originais, zero falha/flaky/retry. Evidência local: `VISUAL-16.15-PUBLICATION-COMPLETE-A1.json`, SHA-256 `9636c6e7ee943aa1a2520ce7e24a201505861364c33481e43b7109414710bd74`.

## Pedidos adicionais de 12–13/out

| ID | Pedido | Implementado | Testado | Publicado |
|---|---|---|---|---|
| A1 | Bônus automáticos dos personagens, substituindo o piloto opt-in | Sim | Registrado | 16.07 |
| A2 | Moldura proporcional do modal Equipamento Encontrado | Sim | Registrado | 16.07; não encerra W2 |
| A3 | Maior destaque das conquistas adquiridas | Sim | Registrado | 16.07 |
| A4 | Redesenho de Erros da Jornada | Sim | Registrado | 16.07 |
| A5 | Ícones nas duas opções da Forja | Sim | Conferência pública registrada | 16.14; alinhamento W8 em 16.15 |

**A1.** Novas jornadas Fácil/Médio/Difícil recebem características automaticamente, sem opt-in; Hardcore não recebe esses novos bônus e mostra aviso antes de iniciar. Ranking normal preservado; saves antigos/piloto legado não recebem crédito retroativo. Aplicação/persistência sem duplicação. A implementação mantém a janela inicial de vinte respostas do escopo anterior; a mensagem que retirou o opt-in não reafirmou nem aboliu essa janela.

**A2.** Arte e moldura proporcionais, sem sobra vertical indevida nem corte. W2 reabre especificamente as molduras dos slots e exige nova prova visual.

**A3.** Fundo, moldura e indicador distinguem aquisição real; bloqueadas cinzentas, critérios visíveis e dimensões coerentes.

**A4.** Cabeçalho compacto; pergunta, alternativas e explicação separados. Mostrar resposta correta e resposta dada somente quando o dado existe. Uma área de rolagem clara e fechamento acessível, inclusive com texto ampliado.

**A5.** Ícones decorativos de 64/56 px nas opções aleatória/lendária; sorteio, custos e persistência preservados.

## Questões, fontes e continuidade

| ID | Pedido | Implementado | Testado | Publicado |
|---|---|---|---|---|
| Q1 | Corrigir pista da posição da alternativa correta | Sim | Registrado; compatibilidade preservada | 16.09 |
| Q2 | Revisar as 741 questões e pista da resposta mais longa | Em andamento | Pareceres e checkpoints parciais | Dez questões na 16.13; três adicionais só locais |
| Q3 | Preparar continuidade em outro computador e avisar quando etapa atual resolvida | Pendente da conclusão | Pendente | Pendente |
| Q4 | Preservar plano editorial original, sem duplicar lotes entregues | Lotes anteriores entregues; expansão futura | Evidências dos lotes anteriores | PRs 882/884 registrados |

**Q1.** Permutação de múltipla escolha com identidade autoral preservada nos modos cobertos. Exceções dependentes de letras/ordem conservam a ordem autoral; V/F e respostas numéricas têm contratos próprios. Letra exibida, índice autoral, gabarito, explicação, histórico, retomada, revisão de erros e save continuam associados. Embaralhar não corrige comprimento.

**Q2.** Universo atual: 741. O inventário recebido preservava A7 com 648 disposições autorais e 624 independentes. A consolidação posterior **A9 foi concluída e validada**: 664 autorais e 624 independentes, faltando 77/117, base + 14 deltas, sem duplicação por eixo. Foram 704 verificações técnicas e 256 no segundo readback, zero falhas. SHA-256 do índice A9: `d8b8ecaeead16ddb06cd4266de1f6686b6f50c793d420ce9e56ff49459cedfe1`. Os totais incluem bloqueios, fusões e propostas não publicáveis. Finais ainda não incorporados não são somados sem consolidação. A última publicação clínica comprovada é de dez questões na 16.13; três questões/três cards adicionais estão aplicados somente localmente. O registro histórico de 61 lacunas de fonte precisa de reconciliação com avanços posteriores antes de ser usado como total atual.

**Snapshot posterior da preparação da PR, 17/10 às 21:41 UTC:** A13 validado, **678 autorais / 640 independentes**, faltando 63/101, base + 18 deltas e zero duplicidade por eixo. Índice SHA-256 `0b1fa4697c0cf1164d3e7464fe173d9d3d0daecebfd00c0e0c51acb8d11fb4d8`. A025 independente tem FINAL ainda não contado nesse snapshot. B028 acrescentou seis QIDs próprios; o ID `fe54f9b1`, citado na fusão, não foi recontado. Continuam dez publicados e três apenas locais.

Aceite: distratores plausíveis e equilibrados sem enchimento, uma melhor resposta defensável, fontes científicas e revisão independente. Publicar somente textos exatos liberados, com pendências explícitas; preservar IDs, respostas, progresso e históricos. A revisão completa não pode ser anunciada por uma release intermediária.

**Q3.** Trabalho testado, publicado quando elegível e enviado ao GitHub; branch, commit completo, versão, instruções de retomada, testes e pendências no repositório. Não depender apenas de arquivos locais. O proprietário informou que começará no outro computador quando a etapa atual estiver resolvida.

**Q4.** Os onze textos terapêuticos da PR 882 e o lote subsequente da PR 884 têm registros de publicação e não são lotes pendentes a repetir. A expansão para pelo menos 1.001 questões aprovadas/publicadas e continuidade dos pergaminhos permanece horizonte, subordinada à revisão atual e demais marcos. Revalidar inventário antes de escolher lote; a meta não comprova expansão executada.

## Depois das questões / finalização web

Todos os itens abaixo têm pedido registrado, implementação/testes/publicação **pendentes**. R4/R5 ficam para a sequência, sem ordem relativa definida entre essas duas frentes e as recompensas futuras.

| ID | Pedido e aceite | Ordem |
|---|---|---|
| R1 | **Meus troféus:** área em Conquistas para escolher quais troféus realmente adquiridos exibir; escolha persistente, sem concessão fictícia | Depois das questões |
| R2 | **Membros honorários no Ranking:** seção com identidade e qualificação verificáveis por conclusão Hardcore; nome provisório | Depois das questões |
| R3 | **Acesso vitalício gratuito ao NefroQuest completo:** concluir a jornada Hardcore inteira e derrotar o boss final; titularidade/conclusão confiáveis, concessão durável/idempotente e proteção contra fraude. Não liberar acesso pago por sinal manipulável no cliente; decisões de implementação, termos e permissões sensíveis antes da ativação | Depois das questões |
| R4 | **Versão celular dedicada:** texto, controles, toque, navegação, modais, cards, hierarquia e orientação adequados ao uso real; validar fluxos principais, não só overflow. Redução de fonte pedida para desktop não aprova o celular atual | Depois da web |
| R5 | **Câmara do Equilíbrio ilustrada e revisada:** apresentação/experiência de cada caso, imagens coerentes com cenas/histórias, rigor clínico, acessibilidade e desempenho. Detalhar cenas, linguagem visual e escopo clínico nessa etapa | Futuro; não iniciar agora |

## Os 44 grupos históricos

Fontes: **A** = [PR 883](https://github.com/orlandobrunet-sketch/base-verification/pull/883), 15.93; **B** = [PR 885](https://github.com/orlandobrunet-sketch/base-verification/pull/885), versão pública 2.0; **C** = [PR 887](https://github.com/orlandobrunet-sketch/base-verification/pull/887), 15.98; **D** = [PR 888](https://github.com/orlandobrunet-sketch/base-verification/pull/888), 16.00; **E** = [PR 890](https://github.com/orlandobrunet-sketch/base-verification/pull/890), 16.01. [Checklist 2.0 preservado](https://github.com/orlandobrunet-sketch/base-verification/blob/3ccf4d5b1d9570bcc71f33a1dce641b7ce8bcaf0/docs/design/NEFROQUEST-2.0-VISUAL-CHECKLIST.md).

Todos os grupos têm **pedido registrado**. `Histórico` em Testado mantém o registro da entrega indicada, sem alegar nova inspeção universal nesta reconciliação. Sem reabertura específica, preservar entrega e verificar regressões nos componentes alterados; não refazer toda a interface automaticamente.

| Grupo | Pedido e critério preservado | Implementado | Testado | Publicado |
|---|---|---|---|---|
| 01 | Forja: identidade, menus claros, equipamento novo/atual e efeitos nos atributos compreensíveis | Sim | Histórico | A; A5/W8 refinam ícones/alinhamento |
| 02 | Pergunta e explicação justificadas sem prejudicar leitura | Sim | Histórico | A |
| 03 | Registro da Jornada cresce com conteúdo, sem rolagem interna desnecessária | Sim | Histórico | A |
| 04 | Tooltips de atributos coerentes, alcançáveis por mouse, teclado e toque | Sim | Histórico e focais posteriores registrados | A |
| 05 | Card central da pergunta discretamente delimitado por fundo/borda/espaçamento | Sim | Histórico | A |
| 06 | Música/SFX e volume sem sobreposição de controles | Sim | Histórico | A |
| 07 | Menu da conta organizado e coerente, funções preservadas | Sim | Histórico | A |
| 08 | Modos modernizados, rotas/controles preservados | Sim | Histórico | A/C |
| 09 | Favicon Q moderno em entrypoints, manifest/fallbacks; separado de W1 | Sim | Histórico | A |
| 10 | Miniaturas, resolução, preenchimento, molduras e preview de equipamentos | Entregas anteriores; **W2 reaberto** | Nova prova W2 pendente | A/B parciais, D específica; A2 modal |
| 11 | Fontes de perguntas/respostas menores na web, ampliação preservada; celular futuro R4 | Sim | Histórico | A/E |
| 12 | Retrato da Forja centralizado e card vermelho translúcido | Sim | Histórico | B; guardiã móvel 16.02; opções W8 |
| 13 | Orientação do Grimório: pedido de centralização substituído por **remoção**; não recolocar | Sim, remoção | Histórico | C |
| 14 | Seu ritmo: resumo à esquerda, comparação dinâmica à direita | Sim | Histórico | B |
| 15 | Estudo e revisão: coluna direita inteira com fundo um pouco mais claro | Sim | Histórico | B |
| 16 | Mais espaço acima de Visão geral | Sim | Histórico | B |
| 17 | Voltar à direita do cabeçalho lateral | Sim | Histórico | B |
| 18 | Evolução: forma atual, próxima, silhueta seguinte, requisitos reais e detalhes acessíveis | Sim | Histórico; equivalência com imagem original tem limitação de referência, sem defeito atual comprovado | B |
| 19 | Radar fechado/contínuo; valores preservados; Glomérulo/DHE/TX/Diálise/IRA/DRC/Geral; lista/legenda com mesmas cores; orientação dispensada removida | Sim | Histórico | B/C |
| 20 | Descrições Mapa/Grimório usam largura desktop sem quebra prematura/nowrap global | Sim | Histórico; dois prints originais têm limitação de comparação | B |
| 21 | Conquistas/badges compactos, distintos e policromáticos, inclusive adquiridos | Sim | Histórico | B; A3 destaque; R1 seleção futura |
| 22 | Fase final/demonstração inteira no novo estilo | Design anterior; **W4 auditoria reaberta** | Nova auditoria pendente | B |
| 23 | Menu direito do Átrio colorido por função; ícones substituem números em home/Modos | Sim | Histórico | B/C |
| 24 | Ritual modernizado, preservando oito perguntas e diagnóstico; flaky histórico não é falha atual nem foi apagado | Sim | Histórico | B |
| 25 | Ranking harmonizado, popup/estrutura/fechamento/foco preservados | Sim | Histórico e focal posterior registrado | B; R2 futuro |
| 26 | Decidir/Reter/Dominar no primeiro viewport desktop, Jornada compacta e rolagem natural | Sim | Histórico | B/C; seis cortes 16.02; nome W8 |
| 27 | Desafio da landing com outra cor translúcida | Sim | Histórico | B |
| 28 | Cards/evoluções das três classes na landing com nove retratos canônicos | Sim | Histórico | B |
| 29 | Arqui-Nefromante deslocado à esquerda sem cortar elementos essenciais | Sim | Histórico | B |
| 30 | Ícone Google oficial multicolorido sem alteração OAuth | Sim | Histórico | B |
| 31 | Novidades fiéis, versão pública 2.0, histórico e numeração técnica/cache coerentes | Sim; manutenção contínua | Histórico | B; manter nas próximas entregas |
| 32 | Dificuldades: cores hover/seleção; Hardcore vermelho translúcido e seleção perceptível além de cor | Sim | Histórico | B |
| 33 | Motor adaptativo: **Ativo**, não Ativa | Sim | Histórico | B |
| 34 | Conquistas menores, iguais dentro do filtro, critérios sempre visíveis, sem Como conquistar/rolagem interna; leitura integral mesmo com página longa | Sim | Histórico | C/E; mobile 16.04 |
| 35 | Filtros Todas/Conquistadas; Objetivos removido; bloqueadas cinzentas inclusive Caminho/Clube100/Próximo selo por aquisição real | Sim | Histórico | C |
| 36 | Pedido de mostrar mais rins substituído por cenário arcano petróleo, textura/luz discreta, sem rins literais | Sim, direção substituta | Histórico | E; não restaurar pedido supersedido |
| 37 | Tópicos do Mapa clínico coloridos por área | Sim | Histórico | E |
| 38 | Título da aba: NefroQuest: Ascension | Sim | Histórico | E |
| 39 | Divisória do Átrio centralizada entre card/menus, responsiva | Sim | Histórico | E; largura/empilhamento 16.02 preservam duas colunas |
| 40 | Jornada/cronômetro mais próximos do topo, espaços menores e leitura preservada | Sim | Histórico | E |
| 41 | Cor de raridade nos artigos, preservando borda esquerda por tipo | Sim; conservar no popup W3 | Histórico | E |
| 42 | Marca-d’água/emblema por personagem após escolha, sutil sem competir | Sim | Histórico; quinze combinações focais registradas | E e 16.04 |
| 43 | Atlas: card direito coerente e esquerdo vidro escuro, fallback sem blur | Sim | Histórico; suspeita de sobreposição associada ao enquadramento da captura, sem defeito atual comprovado | E |
| 44 | Começar nova jornada destacado após derrota/retorno ao início, foco/hover/fluxo preservados | Sim | Histórico; alvo esclarecido por texto, print original não materializado | E |

## Correções funcionais preservadas

- **Iniciar no Difícil:** hotfix 15.99 publicado e confirmado pelo proprietário.
- **Herói sobre alternativas no celular:** duplicidade corrigida na 16.03; acesso pelo dock preservado.
- **Estudo/retomada, respostas autorais e históricos:** compatibilidade publicada na 16.09/16.13.
- **Lotes visuais:** preservar progresso, saves, conquistas, recursos, referências e conteúdo clínico.

## Pendência técnica local: Python/DLL

**Pedido registrado; mitigação aplicada; resolução global não comprovada.** Separada de defeitos do site. Um interpretador selecionado pelo ambiente local apresenta DLL ausente e causa popup; as chamadas desta tarefa usam outro executável já verificado. Diagnóstico local: `verification-drafts/PYTHON-DLL-CALLER-TRACE-20261010.json`. Não declarar o problema de sistema resolvido só porque essas chamadas funcionam. As instruções específicas da máquina e os caminhos de executáveis permanecem no AGENTS.md do workspace, fora da publicação do produto. Nenhuma alteração global de instalação ou PATH foi feita para resolver a tarefa.

O materializador oficial Library permanece bloqueado por ausência de `os.setxattr` no Windows. Preservar metadados e fluxo oficial; não contornar. A instrução operacional completa está no AGENTS.md local, que não integra a publicação do produto.

## Evidências e limites da reconciliação

Além de A–E, preservar [PR 891](https://github.com/orlandobrunet-sketch/base-verification/pull/891), [892](https://github.com/orlandobrunet-sketch/base-verification/pull/892), [893](https://github.com/orlandobrunet-sketch/base-verification/pull/893), [895](https://github.com/orlandobrunet-sketch/base-verification/pull/895), [896](https://github.com/orlandobrunet-sketch/base-verification/pull/896), [897](https://github.com/orlandobrunet-sketch/base-verification/pull/897), [898](https://github.com/orlandobrunet-sketch/base-verification/pull/898) e [899](https://github.com/orlandobrunet-sketch/base-verification/pull/899). Os lotes editoriais anteriores constam nas [PRs 882](https://github.com/orlandobrunet-sketch/base-verification/pull/882) e [884](https://github.com/orlandobrunet-sketch/base-verification/pull/884).

O inventário histórico foi uma passagem documental das mensagens até 21:04, não nova inspeção de pixels ou operação de navegador. A atualização W8 incorpora a conferência pública efetivamente concluída pelo trabalho de execução. Publicação, testes e aprovação estética continuam distintos. Os identificadores de referências visuais e os alvos precisos estão no plano vinculado; o simples registro de um pedido não comprova implementação.
