# Pedidos do proprietário — 03/11/2026

Base: 16.60 publicada. O proprietário pediu registrar os sete itens abaixo e autorizou seguir pela ordem técnica mais adequada. Referências visuais preservadas em `references/2026-11-03/`. Pedido, implementação, teste e publicação são marcos distintos.

| ID | Pedido | Critério de aceite | Estado da candidata 16.61 |
|---|---|---|---|
| NOV03-01 | Expandir TTKG na questão `6474ec20` | Inserir `TTKG (Gradiente Transtubular de Potássio)` no enunciado; preservar alternativa, gabarito e explicação; revisão formal e gate editorial antes da aplicação | Bloqueado pelo gate editorial; [triagem formal](../editorial/reviews/2026-11-03/6474ec20-ttkg-triagem.md) |
| NOV03-02 | Colunas da fase final | Mesmas larguras das colunas da jornada normal no mesmo viewport; conteúdo do chefe acomodado sem comprimir a questão | Implementado; gates finais/publicação pendentes |
| NOV03-03 | Vidas e sequência no card do herói | Redesenhar a faixa abaixo do retrato, eliminando o vazio marcado; valores reais legíveis, sem aumentar a altura desnecessariamente | Implementado, incluindo reflow a 200%; gates finais/publicação pendentes |
| NOV03-04 | Recompensa da Forja | Imagem do item maior, card proporcionado e composição de recompensa; evitar faixa horizontal vazia; preservar atributos, recibo e ação de nova forja | Implementado; gates finais/publicação pendentes |
| NOV03-05 | Opções e moldura da Forja | Botões alinhados inclusive com descrições/motivos de bloqueio diferentes; moldura nas quatro bordas do panorama | Implementado; gates finais/publicação pendentes |
| NOV03-06 | Átrio e Modos de jogo | Botões com acabamento integrado ao cenário; submenu dentro do painel, entrando da direita para a esquerda, com voltar, foco e Escape; fundo com movimento discreto e alternativa sem movimento | Implementado; gates finais/publicação pendentes |
| NOV03-07 | Biblioteca: 158 × 544 | Determinar se falta conteúdo ou se contadores usam universos diferentes; catálogo, filtros e contadores coerentes, sem liberar descobertas indevidas | Contador corrigido, 8 testes focais aprovados; gates finais/publicação pendentes |
| NOV03-08 | Fundo do card conforme raridade, recebido posteriormente | Hover lendário dourado, épico e demais pela paleta existente; foco equivalente, contraste e raridade reconhecível no touch. Identificar primeiro o card na captura oficial | Aguardando transferência/inspeção da referência Library `libfile_f4ee9926a0088191b5e9b07018383f5f`; nenhuma tela inferida |

## Referências

1. [Questão TTKG](references/2026-11-03/01-ttkg.png)
2. [Faixa do herói marcada](references/2026-11-03/02-heroi.png)
3. [Resultado da Forja](references/2026-11-03/03-recompensa-forja.png)
4. [Botões da Forja](references/2026-11-03/04-opcoes-forja.png)
5. [Átrio](references/2026-11-03/05-atrio.png)
6. [Contagem da Biblioteca](references/2026-11-03/06-biblioteca.png)

Pedido adicional: “quando estiver com o mouse sobre um item lendário o fundo do card deve fazer jus a categoria do item - ex. dourado - da mesma forma epico, etc”. A referência chegou via coordenação com um identificador Library, sem pixels ou caminho local. A descoberta das ferramentas deste executor não encontrou materialização de Library; a captura não foi inspecionada nem substituída por outra. O item continua pendente até que o fluxo oficial disponibilize a imagem ao consumidor local.

## Ordem de trabalho

Biblioteca → Forja → fase final e faixa do herói → Átrio. A expansão da sigla segue em trilha editorial própria e só será aplicada com gate compatível. Usar o sistema visual e a implementação vanilla existentes. Paleta: azul-noite `#0b1623`, aço `#263d50`, ciano `#9ad8e6`, ouro `#dfc280`, texto `#eee8d9`; Cinzel nos títulos e Philosopher na leitura. Movimento responde à navegação e não compete com o conteúdo.

## Evidências e entrega

- **Biblioteca:** todos os 544 objetos eram montados; a aba Todos mostrava a contagem de descobertas reais mesmo em prévia administrativa. O contador acompanha o universo selecionado, antes da busca. Descobertas/favoritos não são concedidos por abrir o catálogo. Teste reproduziu 0 no badge de uma prévia com 544 objetos, depois passou nos dois perfis; a captura do proprietário tinha 158 descobertas.
- **Forja:** a contenção de layout do card impedia o subgrid de compartilhar suas linhas. O container de consulta foi movido para um wrapper do cabeçalho, preservando o layout responsivo do cabeçalho e o container móvel. Uma revisão independente identificou o caso intermediário de 640px com fonte 32px; o teste reproduziu título reduzido a 56px, e passou depois do wrapper correto. Moldura nas quatro bordas e card final de até 760px com arte de 180px.
- **Jornada:** fase final usa os mesmos tracks e espaçamentos em 1440/1280/1100px. Vidas/sequência ficam próximas abaixo do retrato; fonte ampliada pode quebrar a faixa sem cortar conteúdo ou cobrir o nível.
- **Átrio:** o acesso durante a jornada mantém o diálogo existente; no Átrio, Modos substitui o conteúdo do próprio menu, com voltar/Escape/foco e acesso às rotas existentes. Entrada animada e luz de cenário finita; movimento reduzido mantém apresentação estática.
- **Validação local:** 325 testes de qualidade aprovados no código final. Rodada focal de 72 cenários: 66 aprovados, 5 skips de perfil e um corte de rótulo no dock do chefe a 1100px/fonte 32px. O corte foi corrigido por quebra de linha, e o mesmo teste passou depois, com as assertions intactas. Os dois timeouts anteriores de foco/Escape e jornada salva no perfil mobile também passaram isoladamente, sem mudança de timeout/assertions. Os 8 testes da Biblioteca passaram. Revisão independente de código concluída, com o reparo responsivo da Forja conferido. A CI do commit final continua necessária.
- **Cobertura da suíte completa:** 2.624 casos listados e atribuídos exatamente uma vez entre seis partes, zero omissões e duplicações.
- **CI992:** qualidade e 19 pagamentos aprovados; os 130 testes rápidos passaram em 8min, mas a instalação com cache frio deixou o job no limite de 10min, cancelado no pós-cache. Job de smoke ajustado para 15min para comportar preparação/limpeza; nenhum teste, worker, retry ou limite por caso foi alterado. Nova CI do HEAD final necessária.
- **Conteúdo:** `data/topics.js`, `data/refs.js` e `data/articles.js` intactos. O manifesto de revisão muda apenas a release; bindings das 741 questões preservados.
