# Experiência e estabilidade — candidata 17.06

Escopo autorizado em 12/11/2026: acabamento solicitado nas capturas, novo painel de Competências e nova apresentação de toda a Câmara do Equilíbrio. Conteúdo médico, referências, respostas, regras de progressão, pagamentos e backend ficam preservados.

## Apresentação

- Dificuldade: quatro opções em grade quando houver espaço, com nome, vidas e proporção organizados; leitura natural em telas estreitas e texto ampliado.
- Personagem: o eixo horizontal do retrato coincide com o ponto médio dos dez indicadores de evolução.
- Questões: o ganho de XP/ouro ocupa o intervalo entre vidas e nível, sem deslocar ou cobrir a barra. Outros efeitos de combate conservam sua apresentação.
- Grimório: cena panorâmica própria na altura compacta existente, frase usando a largura disponível e filtros secundários sob demanda. No filtro Bloqueados, o resumo de itens não descobertos fica desabilitado com cadeado, inclusive na prévia administrativa. A leitura revalida esse filtro antes de abrir. A prévia administrativa geral e os favoritos mantêm suas regras anteriores.
- Revisão: explicação em linguagem direta sobre a próxima data, erros, acertos, revisões vencidas e calendário. A fórmula e o histórico não mudam.
- Competências: atlas SVG com sete áreas selecionáveis, perfil observado, amostra e ação de estudar os temas correspondentes. Nenhuma tendência ou evolução histórica é inventada. Áreas com menos de cinco respostas não recebem percentual; perfil visual exige três áreas com amostra. Lacunas ficam abertas. Movimento reduzido, foco e encerramento dos ouvintes participam do ciclo da página.
- Câmara: a apresentação passa por catálogo, introdução, atos e resultado, reutilizando as cenas e retratos aprovados. A introdução usa a cena panorâmica; atos, decisões e resultado têm transições e estados próprios. No celular e no texto ampliado, história e exames ficam consultáveis em um acordeão após a introdução, preservando os próprios nós e valores. Animações param conforme preferência, sistema ou aba oculta. A validação integrada está em andamento neste checkpoint.

## Estudo: mecanismo reproduzido e limite histórico

A regra global de movimento reduzido aplica transições de `.01 ms` a todos os elementos. Quando ampliar o texto e responder acontecem no mesmo quadro, a geometria da questão pode continuar mudando depois de `scrollIntoView`: a correção mantém foco, mas sai da janela. O experimento usa textos técnicos extensos e os controladores reais; não substitui funções do produto.

O controle com fonte já aparentemente assentada era insuficiente: aguardava animações somente da superfície, deixando de fora ancestrais que alteravam fonte e altura. A intervenção que exclui propriedades geométricas das transições na página de Estudo e nos ancestrais imediatos estabilizou o mesmo experimento. A regressão 244 falhou antes da alteração em dois perfis e passou nas oito combinações de movimento/entrada/perfil depois dela.

A correção limita `transition-property` à cor, fundo, borda, sombra e opacidade, com movimento reduzido e página de Estudo presente. Não acrescenta rolagens atrasadas, temporizadores ou correções de foco posteriores.

**Limite:** os dois registros históricos da primeira resposta em 191 continuam sem causa retrospectiva comprovada. Os quatro replays nativos específicos desta rodada passaram. O mecanismo determinístico novo não prova que causou aqueles eventos antigos. O reparo do fim do baralho, publicado na 17.04, também permanece distinto.

## Preparações e proteção de regressões

- 148 (Oráculo): a preparação isolada misturava identidade fictícia e callback inicial real de logout do SDK. O controlador removia a jornada da identidade anterior; retomar abria a seleção de dificuldade. A preparação agora bloqueia o SDK real para essa identidade sintética. Asserções preservadas.
- 148 (Grimório administrativo): duas capturas de contagem e geometria começavam com o Dashboard ainda carregando. A preparação passa a aguardar o estado pronto antes de ler o catálogo, sem alterar as verificações.
- 217 (Forja): entrada explícita como visitante antes de injetar a jornada. Asserções preservadas.
- HUD em 191: cada largura e tamanho de fonte ganha uma execução independente. Os limites por cenário, configurações dos aparelhos, proporções e asserções não aumentaram.
- Debounce: oito contratos adicionais exercitam o Proxy e o salvamento reais em relógio controlado, incluindo cancelamento, coalescência, troca de proprietário e sandbox. As mutações experimentais de prazo e cancelamento fazem os testes falharem. A bateria de progressão passou 15/15 localmente.

## Validação

Conferência visual inicial: personagem centralizado com diferença inferior a 0,01 px em 1440 e 390 px, e exata em 320 px com texto ampliado; cabeçalho do Grimório mantém 160 px no desktop; seleção do atlas sincronizada; ausência de estouro horizontal em 320 px/200%. Imagens foram aguardadas até decodificação. Fontes externas permaneceram bloqueadas nessa conferência, portanto ela não certifica fontes remotas nem aparelhos físicos.

A rodada local inicial cobriu 156 cenários: 145 aprovações e 11 falhas em preparações ou expectativas antigas. Os 12 cenários correspondentes passaram após corrigir contagens lidas durante loading, a antiga expectativa de leitura no filtro Bloqueados e uma fixture de referências incoerente com o manifesto. Outros 52 cenários de Competências/revisão e quatro medições do ganho de XP/ouro passaram sem repetição.

A Câmara refinada passou 26 cenários dedicados, além da conferência visual do encerramento. A captura carregou as fontes reais Alegreya, Source Sans 3 e IBM Plex Mono, sem overflow ou erros de página.

### Primeira CI completa e reparos

A CI 1063 no primeiro HEAD teve 3.070 aprovações diretas, 21 falhas finais, quatro aprovações após repetição e 265 skips previstos. Quality Gates, PostgreSQL e smoke passaram. Os vermelhos não foram tratados em bloco como problemas de teste:

- **Corte real no Atlas:** em 390 px e texto 32 px, título e cobertura excediam os 266 px disponíveis; a cobertura alcançava 433 px. `flex-wrap: wrap` corrige o cabeçalho. O 74 original falhou antes e passou depois; a cobertura adicional do 246 preserva 320/390 px sem trocar o preparo Guest.
- **Quadro real da Câmara:** em 1159×684 px, a coluna clínica media 601,97 px e aumentava a página para 710 px. A cena decorativa de 104 px, apenas em desktop com altura até 740 px, reduz a coluna a 561,97 px e restaura a página a 684 px. Os 20 casos passaram nas duas resoluções originais, sem cortar texto nem alterar os limites do 179.
- **Contraste real:** o texto dourado da CTA sobre fundo dourado falhava no 78. A cor escura restaura a leitura; os estados nativos mais específicos continuam preservados. Os testes originais de contraste em 320/390 px com texto 200% passaram.
- **Composição aprovada e testes:** retrato à direita, contexto recolhido e arte mobile exigem checagens compatíveis com o novo fluxo. As verificações de texto usam seus retângulos reais nos quatro sentidos; o fold abre por teclado e conserva o conteúdo; carregamentos só são aceitos para imagens aprovadas e visíveis. Fonte, pixels, decode, identidade, motion, progresso e limites de frame permanecem exigidos. O quadro 4:5 usa `contain`.
- **Rolagem da dificuldade:** o 20 comparava coordenadas da viewport antes e depois de rolar 39 px para revelar Hardcore. Larguras, alturas e posições no conteúdo não mudaram. As duas capturas compensam o scroll somente nos descendentes do conteúdo; o rodapé mantém coordenadas da viewport. A igualdade exata e os dados mecânicos foram mantidos. Nenhuma alteração adicional no CSS da dificuldade.
- **Fallback do Grimório:** o 214 bloqueava a URL da arte antiga. A rota passou a bloquear o banner atual; todas as verificações de fallback foram preservadas.
- **Três preparos intermitentes:** o portal interceptava cliques em 02/03 e no resultado expirado do 11 antes das verificações funcionais. A entrada nativa Guest passa a ser opt-in somente nessas fixtures. O caminho padrão e as fixtures autenticadas não mudam. A intercepção está comprovada; a ordem exata do callback inicial continua limitada pelos logs. As três suítes passaram 26 casos locais após o opt-in, sem repetição.

Os reparos de quadro, retrato e contraste passaram 21 cenários locais; as demais verificações de arte/resize passaram 20, com oito skips de plataforma já existentes. Dificuldade e fallback passaram quatro casos; o Atlas passou o 74 original e os quatro casos por largura/perfil do 246. A validação do HEAD final, a publicação e a conferência pública são registradas no [PR 960](https://github.com/orlandobrunet-sketch/base-verification/pull/960). Não usar uma aprovação local como prova de publicação.
