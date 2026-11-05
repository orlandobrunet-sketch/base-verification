# Câmara do Equilíbrio — revisão integral

## Escopo e ordem

Pedido autorizado: revisar os 20 pacientes e 100 atos, funcionamento, evidência clínica, referências, arte, popups, jogabilidade e movimento. Executar as melhorias e validá-las antes de publicar. Os dez pedidos de AFTER-CHAMBER-QUEUE.md aguardam a conclusão da Câmara. A versão 16.65 permanece no PR929 separado, sem autorização de merge inferida.

## Diagnóstico inicial

- Há identidade existente consistente: cenário, vinte retratos, azul profundo, ouro e ciano. Reutilizar essa direção; o problema não exige trocar o universo visual.
- O hub tem ilustração estática e um selo ornamental. Falta um elemento vivo com personalidade. Os atos devem continuar sendo superfícies tranquilas de leitura.
- O workspace desktop já preserva uma moldura estável e pagina textos; não remover conteúdo nem reduzir fontes para caber. Mobile e texto ampliado usam reflow nativo. Manter esses contratos.
- A inspeção de código confirmou que Mireth admite PaCO2 dentro da margem de compensação exibida, embora exija distúrbio misto. Os demais achados clínicos recebidos exigem conferência própria, não aprovação por transferência.
- As chamadas referências do resumo precisam ser distinguidas de explicações didáticas; inventariar links/DOIs reais e adicionar apenas fontes abertas e conferidas.
- Vídeos: investigação em produção concluída, 13 fluxos passaram. Seis MP4 decodificaram quadros e apresentaram sinal digital de áudio; não houve escuta acústica. Mobile usa apresentação nativa por política atual. A falha histórica de abertura não foi reproduzida em sessão nova; cache antigo não foi reproduzido.

## Direção e decisões de implementação

### P0 — validade clínica e funcionamento

1. Extrair o catálogo sem modificar o produto e registrar cada ato e gabarito. Enumerar os domínios discretos que determinam pH, compensação e diagnósticos; verificar limites dos termos contínuos arredondados. Não chamar amostragem aleatória de enumeração exaustiva.
2. Verificar as onze sinalizações clínicas recebidas, além de examinar os outros atos. Aplicar a skill canônica revisar-nefroquest, o Handbook e seu gate a cada versão materialmente alterada. Relatório antes das mudanças; nenhuma aprovação genérica dos outros atos.
3. Referências rastreáveis no registro existente, com links que sustentem a afirmação, mantendo explicações pedagógicas separadas. Não reescrever o banco principal fora do escopo.
4. Testar resposta certa/errada, numérica, cartas, orientações, referências, voltar/repetir, sair, progressão e isolamento de perfil. Reproduzir defeitos antes de corrigir e manter os testes existentes.

### P1 — personalidade com leitura tranquila

1. Transformar o selo do hub em uma pequena balança alquímica ilustrada em SVG: haste dourada, braço e pratos com oscilação lenta, um traço luminoso discreto. Elemento decorativo, sem números fisiológicos nem indicação falsa de progresso. Integrar ao espaço do próximo atendimento, sem cobrir texto/CTA.
2. Controle acessível “Pausar animação” / “Retomar animação”, operável por teclado e toque. Preferência persistida localmente somente para apresentação; nunca no progresso clínico. Reduced motion inicia estático e não executa animações decorativas. Interromper quando aba oculta e quando o hub estiver fora da viewport. Usar CSS transform/opacity, sem loop JS por quadro ou novas imagens pesadas.
3. Hierarquia: cabeçalho do paciente e contexto, exames agrupados, ato/pergunta, resposta e correção. Melhorar apenas onde o diagnóstico visual e geométrico indicar deficiência. Motion de feedback curto, sem flash, sem atrasar resposta/foco e desativado com redução de movimento.
4. Preservar a moldura desktop, a paginação com conservação de texto e o reflow de mobile/zoom. Não transformar o trabalho em nova arquitetura de navegação.

## Validação e critérios de conclusão

- Baseline e capturas desktop 1440×900, janela curta 1159×684, Pixel 7 e texto 200%; fechamento completo da introdução antes das capturas.
- Specs existentes 78/178/179 e testes novos sobre os defeitos efetivamente encontrados. Comportamento e persistência, não snapshots que apenas espelham HTML.
- Novos testes da animação: pausa/retomada, reduced motion, aba/visibilidade, desmontagem, navegação e nenhuma alteração do progresso. Texto e CTA sempre visíveis.
- Testes determinísticos dos geradores e relatório de domínios/limites. Evidência médica aberta e conferida, referências sem órfãos.
- Sintaxe, gates, versão/SW/cache-busters no mesmo commit dos assets, revisão de diff, CI completa. Não enfraquecer assertions, skips, retries ou cobertura para obter verde.
- Registrar limitações reais. Não declarar publicação sem verificar domínio e commit, nem presumir autorização de merge específica.

## Estado deste documento

Plano concretizado a partir da autorização “monte um plano e execute”. As decisões visuais acima são propostas de implementação do agente dentro desse escopo; não representam aprovação humana de um mockup ainda não mostrado. Diagnóstico integral e execução ainda em andamento.
