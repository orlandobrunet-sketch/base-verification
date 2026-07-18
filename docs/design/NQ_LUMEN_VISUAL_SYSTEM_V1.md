# NefroQuest — Sistema Visual Lúmen Vivo v1

## Propósito

O Lúmen Vivo é a linguagem visual que conecta a landing ao jogo. Ele representa o aprendizado como um fluxo clínico em transformação: o usuário encontra um desafio, interpreta a decisão, retém o conhecimento e consolida domínio.

Este documento complementa `docs/VISUAL_STYLEGUIDE.md`. O guia anterior preserva o universo RPG médico premium; o Lúmen Vivo define como esse universo passa a funcionar como produto, movimento e interface.

## Ideia-mestra

Uma única linha viva percorre toda a experiência.

- Antes da interação, ela é uma rota pontilhada e incompleta.
- Durante o raciocínio, ela se acende em ciano.
- Quando o conhecimento se consolida, ela chega ao dourado.
- Diante de ameaça, conflito ou erro crítico, ela sofre uma corrupção violeta.
- Cada avanço deixa uma marca: runa, partícula, nó ou brasão de maestria.

O traço não é ornamento. Sempre deve comunicar estado, percurso ou consequência.

## Assinatura

### Wordmark Cauda Lúmen

A assinatura principal não usa um emblema adjacente. O gesto de marca nasce do próprio `Q` itálico de `Quest`: uma cauda capilar fina percorre a base da palavra sem tocar as letras e se organiza, depois do `t`, em um pequeno tufo glomerular.

1. `Nefro` permanece em parchment;
2. `Quest` e a cauda permanecem em dourado;
3. uma corrente ciano atravessa brevemente o capilar no hover ou foco, como sinal de fluxo vivo.

A cauda deve permanecer abaixo da linha de base, preservar o espaço interno das letras e concentrar sua complexidade no tufo terminal. Ela precisa funcionar em uma cor e não usa ponto, círculo ou emblema destacado. No hover ou foco, apenas uma corrente curta percorre o gesto. Não há movimento contínuo na marca. Quando necessário, a versão compacta deriva da própria cauda, sem criar um segundo símbolo. As letras NQ não devem ser usadas como monograma decorativo.

## Semântica visual

| Estado | Cor | Comportamento | Significado |
|---|---|---|---|
| Inexplorado | `rgba(145, 223, 227, .16)` | pontilhado, baixa emissão | rota ainda não percorrida |
| Raciocínio | `#91dfe3` | corrente contínua, magnetismo suave | decisão em andamento |
| Maestria | `#f1cf7a` | pulso contido, partícula estável | conhecimento consolidado |
| Corrupção | `#9b65c5` | desvio, ruído e quebra controlada | desafio, chefe ou risco |
| Base | `#070a13` | campo profundo, não preto puro | foco e imersão |
| Texto principal | `#efe6d2` | alto contraste sem branco puro | leitura editorial |

O violeta é uma exceção narrativa. Não deve competir com o ciano e o dourado em telas comuns.

## Tipografia

- `Alegreya`: títulos, decisões e momentos narrativos.
- `Source Sans 3`: explicações, perguntas, respostas e leitura longa.
- `IBM Plex Mono`: estado do sistema, mecanismo, etapa, evidência e metadado.

A hierarquia combina uma voz editorial humana com uma camada instrumental precisa. Texto de aprendizagem nunca deve ser sacrificado para caber dentro de uma ilustração.

## Primitivas de interface

### `flow-shell`

Campo que contém uma experiência de percurso. Pode receber anatomia, mapa de competências, trilha da questão ou confronto.

### `lumen-conduit`

Traçado anatômico em camadas: parede tubular, leito luminal, progresso e corrente interna compartilham a mesma geometria. Partículas nunca abandonam esse envelope; informações externas pertencem a uma legenda fixa ou a um `flow-deck`.

### `flow-node`

Ponto selecionável do percurso. Possui estados passivo, disponível, ativo, concluído e corrompido.

### `flow-deck`

Painel fixo de explicação associado ao nó ativo. O texto permanece estável; o fluxo reage ao cursor. Nunca posicionar parágrafos diretamente sobre linhas complexas.

### `mastery-rail`

Trilho de progresso que converte acertos e retenção em avanço perceptível. Deve mostrar origem, posição atual e próximo marco.

### `evidence-spine`

Espinha de evidência para diretrizes, referências e artigos. Usa linhas alinhadas, números tabulares e benefício explícito, sem cards de alturas diferentes.

### `evidence-library`

Arquivo cinético que comunica a escala das fontes antes de explicar o método. Capas editoriais autorais representam diretrizes reais do acervo sem reproduzir capas oficiais. A posição horizontal do cursor conduz a coleção, sem autoplay; toque usa rolagem nativa e teclado centraliza cada volume em sequência.

### `challenge-field`

Ambiente narrativo para chefes e provas de domínio. Personagem, chão, corrente e interface pertencem à mesma perspectiva; evitar retratos soltos dentro de um retângulo.

## Movimento

O movimento deve ser prazeroso, legível e orientado pela intenção.

- O cursor influencia o fluxo por proximidade, sem arrastar a interface inteira.
- O Atlas permanece fixo durante a exploração; o cursor conduz apenas a sonda, a corrente e o estado das câmaras, preservando orientação espacial.
- Conteúdo textual troca em pontos discretos e previsíveis.
- Partículas percorrem o próprio lúmen e eletrólitos aparecem como anotações laboratoriais estáveis junto ao túbulo; nenhum elemento é ejetado do trajeto.
- Câmaras mudam cor e estado localmente, sem explodir, girar ou crescer para fora da anatomia.
- Animações de ambiente pausam fora da tela.
- Não iniciar tours automáticos que disputem atenção com leitura.
- `prefers-reduced-motion` preserva todo o significado sem deslocamento contínuo.
- Interações por teclado oferecem o mesmo estado que hover e ponteiro.

## Tradução para as telas internas

### Página de perguntas

- Enunciado ocupa o `flow-deck` principal, com prioridade absoluta de leitura.
- Alternativas são ramos de um mesmo fluxo, não uma pilha de botões genéricos.
- Ao selecionar, o ramo escolhido acende; após confirmar, o caminho correto converge ao dourado.
- Um erro não usa apenas vermelho: revela o ponto de desvio e oferece retorno ao raciocínio.
- O Oráculo abre no contexto do nó decisivo, sem retirar o usuário da questão.
- A `mastery-rail` mostra impacto em proficiência, retenção e progressão RPG.

### Mapa de competências

- Cada tema é um território conectado por correntes.
- Domínio é densidade luminosa, não apenas porcentagem.
- Lacunas são caminhos interrompidos e priorizados pelo motor adaptativo.

### Revisão espaçada

- Conteúdos retornam como partículas que reencontram o fluxo.
- O intervalo deve ser compreendido visualmente sem expor complexidade matemática desnecessária.

### Personagem e equipamentos

- A evolução do personagem é consequência do domínio, nunca uma camada paralela sem relação com o estudo.
- Runas, equipamentos e classe devem carregar sinais dos temas realmente dominados.

### Chefes e provas

- Corrupção violeta aumenta conforme o risco.
- A vitória restaura a corrente para ciano e dourado.
- O chefe ocupa um ambiente, não um card ilustrado.

## Regras de composição

1. Uma cena deve ter um foco narrativo e um foco de ação claramente distintos.
2. Anatomia e fantasia compartilham geometria; nenhum elemento medieval é aplicado apenas como adesivo.
3. Evidência científica aparece como parte da interface, não como nota de rodapé decorativa.
4. Superfícies evitam excesso de cartões. Divisores, espaço e corrente estruturam o conteúdo.
5. O mobile preserva a experiência, reorganizando-a em sequência: cena, explicação, escolha.
6. Todo brilho precisa indicar ação, progresso ou estado.

## Critério de consistência

Uma nova tela pertence ao NefroQuest quando, mesmo sem logotipo, comunica simultaneamente:

- precisão clínica;
- progressão de conhecimento;
- fantasia adulta e contida;
- movimento com propósito;
- evidência como fonte de confiança.

Se um componente parecer um dashboard SaaS, um card medieval genérico ou um efeito sem função, ele ainda não pertence ao sistema Lúmen Vivo.
