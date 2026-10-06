# Personagens — coleção cinematográfica, outubro de 2026

A continuidade solicitada pelo proprietário após o ciclo de layout autoriza esta etapa visual. São 30 retratos: dez níveis para Dr. Glomerulus, Dra. Aquaria e Dr. Nephros. A coleção toma a arte do Nefromante com cajado renal da home como referência de acabamento, preservando a identidade dos retratos anteriores.

## Direção

- Rostos reconhecíveis, materiais naturais e luz dirigida; fundo de biblioteca/laboratório em desfoque, sem halos circulares ou explosões que escondam a expressão.
- Glomerulus conserva cabelo castanho e óculos: jaleco e microscópio evoluem para instrumentos e armadura cerimonial em marfim, safira e ouro.
- Aquaria conserva rosto e cabelo castanho: túnica azul e frasco evoluem para vestes e armadura prateada, água controlada e cajado renal.
- Nephros conserva identidade e envelhece gradualmente: linho e manuscrito evoluem para proteção dourada, cura renal e vestes cerimoniais com violeta nos últimos níveis.
- O nível é mostrado pela roupa, postura, instrumento e presença; cor não substitui os títulos e números do jogo. Os símbolos renais são elementos de fantasia, não diagramas clínicos.

## Arquivos e integração

`assets/classes-cinema/<classe>/nivel_01.webp` até `nivel_10.webp`: quadrados de 768 px, WebP com qualidade 88. Total da coleção: aproximadamente 4,12 MiB. Imagens são carregadas conforme usadas; não foram acrescentadas ao precache inicial. Os originais em `assets/classes/` permanecem para comparação e recuperação.

Caminhos atualizados na seleção, retomada, HUD, evolução, história, Dashboard, ranking, party, confronto e Galeria administrativa. A home mantém a arte já aprovada. Títulos, bônus, limites de nível, pontuação, narrativa, equipamentos e regras de progressão não foram modificados. `version.json`, `sw.js` e os arquivos que referenciam imagens integram a mesma entrega 15.85.

## Referências e conferência

As imagens originais dos níveis 1, 5 e 10 orientaram identidade e progressão. Primeiro foi gerado o retrato-base de cada personagem; ele foi utilizado como referência de identidade para os nove níveis seguintes. A arte `landing/assets/nefromancer-cajado-renal.jpg` orientou materiais, iluminação e acabamento. Os retratos foram gerados individualmente, sem cortar uma única imagem para simular níveis distintos.

Conferência dos 30 retratos em galeria comparativa e nos enquadramentos da interface. A spec 111 percorre os dez níveis das três classes, verifica decodificação dos 30 arquivos e a manutenção do retrato final acima do nível 10. A validação também cobre jornada, ranking sem rede, confronto, evolução, início e história do personagem. Resultado de publicação e CI é conferido na entrega; uma suíte remota ainda em execução não é declarada aprovada.
