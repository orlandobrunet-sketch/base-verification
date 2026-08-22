# NefroQuest — Checklist de qualidade

Usar antes de considerar uma entrega pronta. A profundidade cresce com o risco, mas nenhum PR pode omitir segurança, fonte dos dados, acessibilidade, cache e escopo.

Para telas Lúmen, a referência visual canônica é [`design/NQ_LUMEN_VISUAL_SYSTEM_V1.md`](design/NQ_LUMEN_VISUAL_SYSTEM_V1.md).

## 1. Escopo e verdade do produto

- [ ] O problema e o usuário afetado estão explícitos.
- [ ] Resultado, baseline e critério de conclusão estão definidos.
- [ ] Escopo e não escopo estão registrados.
- [ ] Cada número, tendência, recomendação e progresso tem fonte real identificada.
- [ ] Ausência de dado aparece como ausência, nunca como 0%, domínio ou tendência simulada.
- [ ] Estados novo, rico, vazio, legado, corrompido, offline e erro foram considerados quando aplicáveis.
- [ ] Nenhuma regra funcional foi alterada silenciosamente durante uma mudança visual.

## 2. Segurança, privacidade e conta

- [ ] Todo dado externo/persistido renderizado em HTML usa DOM/`textContent` ou escape robusto.
- [ ] Payloads de stored/reflected XSS foram exercitados em campos livres e no painel admin.
- [ ] Constraints/allowlists do banco rejeitam valores fora do contrato.
- [ ] RLS, autorização e autenticação foram verificadas na fronteira correta; CORS não é tratado como controle de acesso.
- [ ] Logout remove todas as chaves por conta, inclusive dados pedagógicos, favoritos, votos e histórico.
- [ ] Duas contas no mesmo navegador não compartilham progresso ou perfil.
- [ ] Dois dispositivos concorrentes não sobrescrevem o melhor histórico sem merge explícito.
- [ ] Endpoints públicos têm rate-limit/antiabuso proporcional ao risco.
- [ ] Headers/CSP foram confirmados no host que realmente serve produção.
- [ ] Nenhum segredo privilegiado foi exposto no frontend, logs ou fixtures.

## 3. Conteúdo médico e operação editorial

- [ ] Alteração clínica tem autorização explícita do proprietário.
- [ ] A skill editorial apropriada foi executada integralmente.
- [ ] Veredito editorial, Evidência, Pendência e Publicação estão presentes e coerentes.
- [ ] `Autorização de publicação: LIBERADA` foi derivada pelo fluxo canônico.
- [ ] Pendência decisiva ou combinação inválida bloqueia a CI.
- [ ] Mudança material reabriu a revisão; aprovação antiga não foi reutilizada.
- [ ] QIDs, referências, versão, manifesto e lote batem com o diff real.
- [ ] Mudança apenas visual/técnica não alterou inadvertidamente `data/topics.js`.

## 4. Jornada funcional

- [ ] Portal, login Google, login por e-mail, visitante e logout funcionam.
- [ ] Nova jornada e retomada preservam classe, dificuldade, questão e progresso corretos.
- [ ] Save novo, legado e corrompido têm comportamento seguro.
- [ ] Questões carregam; alternativas, gabarito, explicação e referências permanecem íntegros.
- [ ] Pontuação, XP, nível, portão de acertos, streak, vidas, ouro e recompensas coincidem com a regra real.
- [ ] Fim de jornada → nova jornada não duplica contadores ou estados transitórios.
- [ ] Estado de boss/combate não atravessa restauração quando não pertence ao save.
- [ ] Central, Estudo/Revisão, Oráculo, Grimório, Ranking e Simulado abrem e devolvem o usuário ao contexto correto.
- [ ] Contratos cliente/Edge Function foram testados com sucesso e erro real, não apenas mock feliz.

## 5. Integridade pedagógica

- [ ] Competências mostradas correspondem à questão; substring, acento, limite de palavra e negação foram verificados.
- [ ] Fallback genérico e tamanho da amostra são visíveis quando limitam a confiança.
- [ ] Recomendações apontam para uma sessão realmente iniciável.
- [ ] FSRS conta apenas cards válidos/vistos e diferencia vencido, futuro e consolidado.
- [ ] Comparações temporais mostram as duas janelas e seus denominadores.
- [ ] Duas janelas não são apresentadas como curva, projeção ou tendência garantida.
- [ ] Conquistas não premiam pressa, madrugada, maratona ou volume sem benefício pedagógico.
- [ ] Personagem, selos e equipamentos avançam como consequência do aprendizado real.

## 6. Acessibilidade, entrada e movimento

- [ ] Todas as ações funcionam por teclado, ponteiro e toque.
- [ ] Foco inicial, contenção, Escape e retorno de foco funcionam em cada modal/tela sobreposta.
- [ ] Desabilitar o controle ativo não joga o foco no `body` sem destino útil.
- [ ] Enter/Espaço repetidos não pulam feedback ou explicação.
- [ ] Foco visível e ordem de Tab acompanham a hierarquia visual.
- [ ] Gabarito, erro, risco e progresso não dependem apenas de cor, posição ou animação.
- [ ] `prefers-reduced-motion` preserva toda a informação e remove movimento contínuo desnecessário.
- [ ] Não há animação infinita distrativa, autoplay ou tour que dispute atenção com leitura.
- [ ] Hover/foco/toque usam `transform`/`opacity` quando animados e não provocam layout shift.
- [ ] Alvos de toque visíveis têm no mínimo 44×44 px.
- [ ] Zoom a 200% e leitor de tela não perdem conteúdo ou ação.
- [ ] Axe não encontra violações sérias/críticas; semântica manual também foi revisada.

## 7. Layout e sistema Lúmen

- [ ] 1366×768, 1440×900, 768 px, 390×844 e 320×568 foram verificados conforme a superfície.
- [ ] Não há overflow horizontal nem controles cortados na primeira dobra crítica.
- [ ] Conteúdo longo, loading, erro e estado vazio não quebram a composição.
- [ ] `Source Sans 3` atende leitura longa, `Alegreya` a voz editorial e `IBM Plex Mono` a metadados nas superfícies Lúmen.
- [ ] Ciano significa raciocínio/leitura, ouro maestria/recompensa e violeta corrupção/risco.
- [ ] Navegação equivalente não recebe uma cor de identidade por item.
- [ ] Todo brilho, linha, pulso e partícula comunica ação, progresso ou estado.
- [ ] Personagens e fantasia adulta permanecem presentes sem virar adesivo decorativo.
- [ ] Componente só foi promovido a compartilhado depois de funcionar em pelo menos duas superfícies.
- [ ] A antiga paleta roxo/dourado do roadmap legado não foi reintroduzida como sistema “definitivo”.

## 8. Desempenho, carregamento e PWA

- [ ] CSS/JS/dados carregados pela rota foram medidos em bytes transferidos, parse e long task; não apenas o HTML.
- [ ] Tela não crítica usa lazy/idle load com erro, retry e fallback offline seguros.
- [ ] Nenhum consumidor lê um módulo lazy antes de aguardar/validar sua disponibilidade.
- [ ] Imagens usam prioridade alta somente quando aparecem no caminho crítico imediato.
- [ ] Fontes de terceiros não bloqueiam a primeira interação sem justificativa.
- [ ] Service Worker foi testado em instalação limpa, offline e transição vN → vN+1.
- [ ] HTML, JS, CSS e dados de uma mesma abertura pertencem à mesma release.
- [ ] Assets não são baixados em URLs/versionamentos duplicados.
- [ ] Budget de precache e armazenamento mobile foi verificado.

## 9. Testes, CI e observabilidade

- [ ] Teste novo falha ao reverter o conserto que pretende guardar.
- [ ] Suite crítica é bloqueante; `continue-on-error`, retry e quarentena têm justificativa explícita.
- [ ] Flake é reportado e classificado, nunca escondido com `|| echo`.
- [ ] JS parseia; Edge Functions passam typecheck; migrations/validators passam seus testes.
- [ ] Smoke local usa servidor concorrente e fixture canônico quando aplicável.
- [ ] Smoke de produção registra data, versão, viewport e resultado.
- [ ] Sentry/GA4 recebem a release/evento esperado sem dados sensíveis.
- [ ] Rollback e recuperação de save foram definidos para mudança de alto risco.

## 10. Versão, cache e PR

- [ ] Se qualquer asset estático mudou, `version.json` e `sw.js` foram incrementados no mesmo commit.
- [ ] Release Sentry, labels e cache-busters acompanham a mesma versão.
- [ ] `node scripts/bump-release.mjs --check` passa contra a base correta.
- [ ] O PR altera apenas arquivos necessários e preserva mudanças do usuário.
- [ ] Título, resumo, risco, arquivos e instruções de teste estão descritos.
- [ ] Evidências antes/depois foram anexadas quando a mudança é visual ou de desempenho.
- [ ] O proprietário aprovou a superfície quando o roadmap exige aprovação explícita.
