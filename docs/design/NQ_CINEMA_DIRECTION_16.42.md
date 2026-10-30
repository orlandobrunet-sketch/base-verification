# Direção das aberturas e filmes — 16.42

Crítica feita em 30/10/2026 por três frentes (direção de jogo, de criação e de arte) sobre a 16.40 publicada, com medição dos vídeos, da linha do tempo real e leitura do código. Nota geral antes dos ajustes: 6,5/10. A arte estava boa; a montagem, não.

## Diagnóstico

- 54% da entrada do herói (10 s de 18,4 s) era tela preta e muda.
- O vilão nunca é visto caindo, e o golpe final era o único sem impacto.
- A tela de vitória tinha menos da metade da área do filme a 1366×768, parada.
- As legendas falavam de outra coisa que não a imagem, e o número 100 não aparecia em nenhuma tela.
- Pular exigia dois cliques, e sete controles ficavam fixos durante um filme de 8 s.
- Subir de nível no acerto 90 derrubava o filme do chefe.

## O que mudou na 16.42

| Área | Antes | Agora |
|---|---|---|
| Entrada do herói | 18,4 s, preto puro | 15,3 s, cartelas sobre o primeiro quadro escurecido, e a imagem sobe da escuridão em 900 ms |
| Abertura e fechamento | Cortina central de 420/340 ms, corte seco para o jogo | Fade de 760 ms; escurece com a imagem em movimento (fase `tail`) e dissolve no jogo em 240 ms |
| Legendas | Mancha sobre a imagem, fades de 180 e 300 ms | Faixa inferior com degradê, fade único de 420/320 ms com suavização |
| Controles | Fixos, dois sentidos de "pular" | Um clique pula tudo; somem após 1,8 s sem mexer o mouse; volume só com som ligado |
| Som | Esquecido a cada filme, música em -24,8 dB | Escolha lembrada no aparelho; música em cerca de -19,5 dB, no nível da Câmara |
| Golpe final | 350 ms e corte | HP escorre, clarão, fala do vilão, som de vitória, 1,8 s de pausa |
| Epílogo | Retrato parado de 597×478, 2 legendas, 10,5 s | Filme da queda do vilão (4,6 s) dissolve no retrato em 900 ms, tudo na moldura 16:9 de 1020×574; 3 legendas, 11,9 s. O vídeo é pré-carregado no golpe final; sem ele, o retrato segue sozinho |

### Textos

Cada cartela agora diz quem ameaça o reino, e cada filme diz qual é a meta. As legendas de herói são "Dr. Nephros, primeiro plantão." e "Cem acertos para salvar o reino."; Aquaria e Glomerulus seguem o mesmo molde. "Noventa batalhas depois." e "Três guardiões, dez acertos." substituem "Você não está sozinho.", que estava errado para quem joga com a Dra. Aquaria. O epílogo conta "O Arqui-Nefromante caiu.", "O reino volta a filtrar." e fecha em "OS RINS FORAM SALVOS!". A fala do chefe deixou de ser masculina. Nada em `data/topics.js` foi tocado.

### Bugs corrigidos

- Evolução no acerto 90 espera o filme do chefe terminar.
- Com movimento reduzido, o filme espera o Reproduzir em vez de tocar sozinho.
- O teclado não aciona mais o jogo por trás do epílogo.
- Clique em Avançar entre duas cartelas não se perde.
- O Service Worker deixou de baixar os 6,4 MB do filme do chefe a cada versão: o arquivo nunca era servido do cache.

## Decisões do proprietário

Tomada: mostrar a queda do vilão antes do retrato (pedido de 30/10/2026), o que revoga o epílogo só com imagem.

Em aberto:

1. **Refazer o filme do Glomerulus.** Entre 4,4 s e 6,4 s a mão some e o rosto muda. Pedir pelo menos 3 s de gesto, câmera fixa, usando o quadro de 4,2 s como referência.
2. **Som dos filmes de herói.** Quase mudos (-38 a -44 dB). Precisam de três faixas de 8 s, ou o botão de som deve sair deles.
3. **Celular.** Não vê nenhum filme, nem o epílogo, que pesaria só 1,25 MB. Notebooks com tela de toque também ficam de fora. Conferir no GA4 quantos concluem pelo celular.
4. **Arte final da vitória.** Tem outro acabamento em relação aos filmes. A 16.42 aplica só um ajuste leve de cor; na tela o retrato aparece recortado em 16:9, e o quadro inteiro segue nos resultados. No filme da queda quem lidera é o Dr. Glomerulus, e no filme do chefe, o Dr. Nephros.
5. **Raio do filme do chefe.** Nasce sem origem visível e o vilão não reage. Refazer ou abrir com `NefroQuest-intro-batalha-v6.mp4`, hoje sem uso.

## Limites

Avaliação por quadros e métricas. Escuta humana do áudio não foi feita. O ganho de 0,55 vem de cálculo sobre o volume medido dos arquivos.
