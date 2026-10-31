# Auditoria de jogo, tela por tela — 30/10/2026

Avaliação da versão 16.46 como faria uma agência de jogos. Foram abertas 79 telas, em 1366×768 e em celular, com dados de teste. As capturas estão em `Documents/Codex/2026-10-30/auditoria/`. Medições foram feitas no navegador e comparadas com o código; as demais recomendações são opinião de direção.

**Veredito:** a base visual é forte: retratos, Forja, Câmara e filmes estão acima do esperado. O problema é outro: **no computador o NefroQuest é um jogo; no celular é um questionário**. E mesmo no computador, responder uma questão quase não tem consequência visível. O maior ganho está em fazer cada resposta parecer uma jogada.

## Situação em 31/10/2026

Os itens **P1** foram concluídos na versão 16.47. A conferência no código corrigiu três afirmações desta auditoria:

- **Atalhos:** 1 a 4, A a D, Enter e Espaço já existiam. O que faltava era mostrá-los na tela.
- **"Próxima" no computador:** o botão do painel lateral já resolvia. O problema era só o painel sair da tela ao rolar; ele agora acompanha a rolagem.
- **Escolha de classe:** a 1366×768 os cards cabiam. Faltava só dizer como escolher, e o card ganhou "Escolher".

Vidas e sequência foram para uma faixa fixa acima da questão, em vez do card do herói, porque ela serve ao computador e ao celular. Ao corrigir a derrota, apareceu um defeito fora da auditoria: comprar a pergunta bônus zerava a jornada. Foi corrigido na mesma versão.

## Prioridade

| Etapa | O que entra | Efeito |
|---|---|---|
| 1. Atrito e correções | Itens marcados **P1** | Remove o que atrapalha toda partida |
| 2. Sensação de jogo | Itens marcados **P2** | Faz acertar e errar terem peso |
| 3. Acabamento | Itens marcados **P3** | Unifica o que ainda destoa |

## Tela principal de jogo

Onde o jogador passa quase todo o tempo, e por isso vale mais que qualquer outra tela.

| # | Prioridade | Problema | Sugestão |
|---|---|---|---|
| 1 | **P1** | **Celular:** depois de responder, "Próxima" fica em y=1879 de uma página de 2625 px. São cerca de 1.400 px de rolagem por questão. A barra inferior tem seis botões, nenhum é "Próxima". | Barra fixa com "Próxima questão" assim que a pessoa responde, no lugar da barra inferior |
| 2 | **P1** | **Celular:** vidas e sequência não aparecem na questão. A barra `mobile-status-bar` existe, mas não aparece no Lumen. | Faixa fina no topo com vidas, sequência e progresso |
| 3 | **P1** | **Computador:** em 720p as vidas ficam na borda inferior (y=698 de 720) e a sequência fica fora da tela (y=765). O que mais importa no jogo é o que menos se vê. | Subir vidas e sequência para o topo do card do herói |
| 4 | **P1** | O card mostra "15/741 questões", mas a meta do jogo são 100 acertos. A pessoa não vê quanto falta. | Trocar por "15/100 acertos" com o próximo selo marcado na barra |
| 5 | **P1** | A explicação começa no fim da tela (y=640 de 720) e continua para baixo. | Rolar suavemente até a explicação, ou dar a ela uma coluna própria |
| 6 | **P1** | Os atalhos de teclado existem, mas nada na tela os mostra. | Dizer as teclas ao lado da instrução |
| 7 | **P2** | Acertar não atinge nada. Não há inimigo, cena nem consequência no centro da tela. | **A maior melhoria do projeto:** um inimigo por capítulo, com barra de vida, retrato pequeno e reação ao acerto e ao erro |
| 8 | **P2** | O capítulo e o objetivo ficam abaixo da dobra. A história some durante o jogo. | Mostrar o capítulo atual no topo, com o nome do inimigo |
| 9 | **P2** | Sequência de acertos sem efeito visível. | Escala visual a partir de 3 acertos: brilho no retrato, som e contador que cresce |
| 10 | **P2** | Errar só muda cores. | Tremida curta, coração partindo e som grave, respeitando movimento reduzido |
| 11 | **P2** | No celular, o "+30 XP" flutua por cima do texto da explicação. | Mostrar o ganho na faixa do topo |
| 12 | **P3** | Cronômetro "00:00" com ícone de play no topo não explica para que serve. | Esconder fora de modos com tempo |
| 13 | **P3** | "EVIDÊNCIA DISPONÍVEL APÓS SUA DECISÃO" em letra técnica pequena polui a tela. | Remover ou trocar por um ícone discreto |

## Início da jornada

| Tela | Prioridade | Problema | Sugestão |
|---|---|---|---|
| Portal `/jogar/` | **P1** | Oferece 15 questões sem conta, e a página inicial e o paywall falam em 50. São regras diferentes (visitante e conta), mas a pessoa lê como contradição. | Dizer as duas juntas: "15 sem conta, 50 com conta grátis" |
| Portal | P2 | "Atlas clínico", "fluxo clínico" e "rota de entrada" soam como sistema hospitalar, não jogo. Nenhum herói aparece. | Colocar os três heróis ou o chefe nessa tela |
| Escolha de classe | **P1** | A 1366×768 os cards passam da tela e não há botão visível. No celular, o terceiro herói exige rolar. | Reduzir a arte e mostrar "Escolher" em cada card |
| Escolha de classe | P2 | Glomerulus mostra três vantagens, e os outros, duas. Parece desequilíbrio, mesmo que seja só apresentação. | Alinhar o formato em três linhas para todos |
| Confirmação | P3 | Capitular decorativa aplicada em "Bônus", um texto de regra. | Tirar a capitular desse bloco |
| Modos de jogo | — | Boa tela. | Manter |

## Recompensas e momentos de pico

| Tela | Prioridade | Problema | Sugestão |
|---|---|---|---|
| Fim de jogo | **P1** | Ao perder, a primeira coisa é um formulário "Registrar Pontuação", com o termo "leaderboard" e botões do visual antigo. Não há tela de derrota. | Tela de derrota: acertos, tema que mais falhou, "Tentar de novo" e depois o ranking |
| Baú | P2 | A recompensa parece um resumo de artigo, sem revelação. | Baú abrindo, raridade revelada e só então o texto |
| Evolução | P2 | Trocar de arte é o maior prêmio do jogo e aparece em um popup pequeno. | Tela cheia com antes e depois, título novo e som |
| Pedra do Julgamento | P2 | Parece formulário: sem moldura, sem arte, botões V e F pequenos e cronômetro discreto. | Cenário, botões grandes, contagem forte e teclas V e F |
| Vida extra | P3 | Coração simples, sem celebração. | Animação curta e som |
| Narrativa | P3 | "740 cartas restantes" não explica o que são cartas. | Trocar por acertos até o próximo capítulo |
| Forja | P3 | Tela boa, mas o item aparece sem preparo. | Martelada curta antes da revelação |
| Resultados | P3 | Três saídas parecidas, e "Compartilhar" é o menor botão da tela. | Destacar uma ação e gerar imagem pronta para compartilhar |

## Chefe

| Prioridade | Problema | Sugestão |
|---|---|---|
| **P1** | A 1366×768 a arte ocupa um terço da tela e as alternativas C e D ficam abaixo da dobra, no momento mais tenso do jogo. | Arte mais baixa durante a pergunta, voltando a crescer no golpe |
| P2 | O herói é o retrato pequeno da lateral; o duelo não parece um confronto. | Herói e vilão frente a frente na mesma cena |

Filmes, golpe final e epílogo foram tratados em [NQ_CINEMA_DIRECTION_16.42.md](NQ_CINEMA_DIRECTION_16.42.md).

## Painel, Câmara, Estudo e conta

| Tela | Prioridade | Problema | Sugestão |
|---|---|---|---|
| Painel | P2 | "Visão geral" é só texto no início e não tem herói. "Jogador local" é frio. | Retrato, nome escolhido e próximo objetivo no topo |
| Painel no celular | P3 | Duas linhas de abas ocupam cerca de 90 px fixos. | Uma linha com rolagem lateral |
| Grimório | P3 | Três filtros grandes aparecem mesmo com zero itens. | Só mostrar com itens descobertos |
| Câmara | — | Melhor tela do projeto. | Manter |
| Câmara: hub | P3 | Metade inferior vazia em telas altas. | Mostrar os próximos casos |
| Câmara e Julgamento | P3 | O título recebe um retângulo de foco visível em alguns acessos por teclado. | Tirar o contorno do título, mantendo o foco |
| Estudo: temas | P2 | Lista em estilo antigo, com "— acerto" em cada linha. | Passar para o visual do Mapa clínico |
| Conta | P3 | Pede telefone, cidade e especialidade na mesma tela. | Separar o essencial do opcional |
| Login | — | Boa tela. | Manter |
| Oráculo | P3 | Aviso em roxo destoa do restante. | Trazer para o padrão dos diálogos |

## Venda e textos

| Tela | Prioridade | Problema | Sugestão |
|---|---|---|---|
| Preços | **P1** | Quem usa navegador em inglês vê US$ 14,90 e US$ 199, mas o checkout cobra R$ 14,90 e R$ 199. | Mostrar sempre R$, ou converter de verdade |
| Preços | **P1** | O mensal diz "cancele quando quiser" e "Assinar", mas é um pagamento único de 32 dias, sem renovação. | Corrigir para "32 dias de acesso, sem renovação automática" |
| Paywall | P3 | Emojis de castelo e raio destoam da arte. | Usar os ícones do jogo |
| Página inicial | P2 | A primeira tela parece software, sem herói nem chefe. | Trazer personagem e cena do jogo para o topo |
| Página inicial | P2 | "1.313 questões e desafios" convive com 741 questões e "Mais de 700". | Separar em questões e desafios |
| Termos | P2 | "Classe" e "personagem", "Dashboard" e "Painel", "Leaderboard" e "Ranking", "cartas" e "questões" se alternam. | Fixar um termo para cada conceito |

## Consistência geral

- **Dois visuais convivem.** O Lumen, nas telas novas, e o dourado antigo, em Registrar Pontuação, Estudo e Julgamento. **P2**
- **Emojis e ícones desenhados se misturam.** Paywall, preços, 404 e vida extra usam emoji. **P3**
- **Falta linguagem sonora.** Cada ação principal deveria ter som próprio, com volume único. **P2**
- **Letra técnica miúda em excesso.** Rótulos em maiúsculas e fonte de máquina competem com o conteúdo. **P3**

## Não avaliado

Dificuldade, Ritual de Iniciação, Prova Simulada em andamento, sessão de Estudo e seus resultados, diagnóstico por IA, conversa com o Oráculo, administração, offline e privacidade. A lista de pacientes da Câmara no celular falhou na captura. O ranking apareceu vazio porque a captura rodou sem rede. Som não foi escutado.
