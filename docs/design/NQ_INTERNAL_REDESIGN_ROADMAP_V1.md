# NefroQuest — Roadmap de Redesign Interno v1

**Status:** reconciliado com o produto em 21/08/2026; execução visual pausada até o fechamento dos bloqueadores do [`ROADMAP.md`](../ROADMAP.md)
**Sistema visual de referência:** `docs/design/NQ_LUMEN_VISUAL_SYSTEM_V1.md`

## Objetivo

Levar a identidade Lúmen Vivo da landing para o produto interno sem transformar o jogo em uma coleção de telas visualmente semelhantes, mas desconectadas. Cada página deve traduzir a mesma lógica de precisão clínica, progressão, fantasia adulta, movimento intencional e evidência.

O trabalho será executado e aprovado **uma página por vez**. Nenhuma página seguinte entra em implementação antes da aprovação explícita da página ativa.

## Reconciliação com o produto atual

O plano original descrevia o caminho de migração, mas não registrava o que foi efetivamente publicado. Esta tabela é a fonte de status; a ordem futura é governada pelo roadmap ativo.

| Superfície | Estado em 21/08/2026 | Observação |
|---|---|---|
| Fundação/tokens | `PUBLICADO / CONTÍNUO` | `tokens.css` está no runtime; `components.css` e `motion.css` ficaram restritos ao laboratório depois de medição de 5,6% e 0% de uso |
| Página 1 — Portal de acesso | `PUBLICADO` | Fluxo Lúmen com estados de acesso e visitante |
| Página 2 — Átrio/Central da jornada | `PUBLICADO` | Continuidade, jornada ativa e rotas principais |
| Página 3A — Dificuldade | `PUBLICADO` | Calibração em fluxo próprio |
| Página 3B — Escolha de classe | `PUBLICADO` | Página Lúmen; falta fechar o contrato modal completo de foco |
| Página 3C — Ritual | `LEGADO FUNCIONAL` | Funciona; migração visual deve ser priorizada por uso/risco, não por numeração antiga |
| Página 4 — Pergunta/decisão | `PUBLICADO` | Câmara de Conduta Lúmen |
| Página 5 — Feedback/aprendizado | `PUBLICADO / CONSOLIDAR` | Gabarito, foco e toque melhoraram; deve entrar na validação ponta a ponta |
| Páginas 8, 9 e 11 — Mapa, Grimório e Ranking | `PUBLICADO NA CENTRAL` | Não recriar como páginas separadas sem evidência de necessidade |
| Página 10 — Progressão RPG | `PARCIAL` | Personagem, selos e conquistas avançaram; Forja/Inventário continuam como superfície legada |
| Demais páginas | `A MIGRAR` | Ordem revista: Estudo/Revisão → Oráculo → Forja/Inventário → Simulado → Conta/Paywall |

Antes da próxima página, a auditoria de 21/08 exige fechar stored XSS no admin, gate editorial cumulativo, isolamento/sync de conta, atualização PWA atômica e regressões críticas. Ver [`audits/CLAUDE_CODE_REVIEW_2026-08-21.md`](../audits/CLAUDE_CODE_REVIEW_2026-08-21.md).

## Decisões não negociáveis

1. Preservar IDs, `data-action`, persistência, autenticação, pagamentos e regras do jogo durante a migração visual.
2. Não copiar o CSS global da landing para o jogo.
3. Criar uma camada Lúmen isolada e escopada por tela.
4. Não redesenhar silenciosamente fluxos funcionais. Mudanças de UX precisam de decisão própria.
5. Desktop e mobile são entregas simultâneas da mesma página.
6. Uma página inclui todos os seus estados relevantes: inicial, hover, foco, loading, vazio, bloqueado, erro, sucesso, visitante e premium.
7. A página aprovada fica congelada; regressões posteriores são tratadas como correção, não como releitura visual informal.
8. Neste roadmap, “página” significa uma tela ou estado principal da SPA, mesmo quando não existe uma URL própria.
9. Eventos analíticos existentes devem ser preservados ou migrados de forma explícita e verificável.

## Arquitetura de migração

Camada vigente:

```text
styles/lumen/tokens.css
styles/lumen/portal.css
styles/lumen/atrium.css
styles/lumen/difficulty.css
styles/lumen/game.css
styles/lumen/dashboard.css
styles/lumen/charselect.css
design-system/lumen-foundation/  # laboratório; não é dependência global do app
```

Cada página migrada recebe um escopo explícito, por exemplo `data-nq-ui="lumen"`. Componentes novos usam prefixo próprio, evitando colisões com `.btn`, `.panel`, `.hero` e outras classes globais legadas.

`components.css` e `motion.css` não devem voltar ao runtime por antecipação. Um padrão compartilhado só é promovido depois de funcionar em duas superfícies reais e ter cobertura mensurável.

Regras técnicas da camada nova:

- 100% das cores novas vêm de tokens;
- zero novo `!important`, salvo exceção documentada;
- zero novo estilo inline;
- tipografia Lúmen carregada apenas no escopo migrado;
- componentes compartilhados só são promovidos à biblioteca depois de funcionarem em pelo menos duas páginas;
- componentes da Fundação 0 são provisórios até serem validados em duas páginas reais;
- telas ainda não migradas permanecem visual e funcionalmente intactas.

## Ciclo de aprovação de cada página

### Gate 1 — Inventário funcional

- estados, ações, permissões e dependências mapeados;
- seletores e contratos JavaScript identificados;
- riscos e itens fora de escopo registrados.

### Gate 2 — Wireframe estrutural

- hierarquia e fluxo aprovados sem decoração;
- foco narrativo e foco de ação claramente separados;
- comportamento desktop/mobile definido.

### Gate 3 — Direção de arte

- composição em 1440 px e 390 px;
- tipografia, superfícies, iconografia e densidade validadas;
- uma única assinatura visual memorável para a página.

### Gate 4 — Movimento e interação

- hover, foco, teclado, toque e feedback demonstrados;
- movimento com função e versão `prefers-reduced-motion`;
- nenhuma informação depende apenas de animação ou cor.

### Gate 5 — Implementação

- página funcional em preview;
- comparação antes/depois;
- contratos existentes preservados.

### Gate 6 — QA e aprovação formal

- testes funcionais e visuais aprovados;
- acessibilidade e responsividade aprovadas;
- baseline visual e contratos funcionais comparados com a versão anterior;
- telemetria, versão do Service Worker e plano de reversão verificados;
- usuário declara a página **APROVADA**;
- só então a próxima página é iniciada.

## Critérios globais de aprovação

- Desktop 1440 px, tablet 768 px, mobile 390 px e 320 px.
- Zero overflow horizontal.
- Alvos de toque de no mínimo 44 px.
- Contraste WCAG AA e foco visível.
- Navegação completa por teclado.
- Zero erro crítico ou sério de acessibilidade.
- Zoom de navegador a 200% sem perda de conteúdo ou ação.
- `prefers-reduced-motion` mantém toda a informação.
- Estados de conteúdo longo, vazio, loading e erro não quebram o layout.
- Nenhum texto sobre linha anatômica complexa.
- Todo brilho comunica ação, progresso ou estado.
- Violeta reservado a corrupção, risco e chefes.
- Nenhum emoji como ícone principal da camada nova.
- Nenhuma regressão em autenticação, progresso, pontuação, premium ou pagamentos.
- Nenhuma regressão nos eventos analíticos definidos para a tela.
- Orçamento de desempenho definido no Gate 1 e validado no Gate 6.

### Placar de qualidade

Cada página recebe até 100 pontos:

- hierarquia e legibilidade: 20;
- semântica Lúmen Vivo: 20;
- interação e movimento: 20;
- acessibilidade: 20;
- robustez funcional e responsiva: 20.

Uma página é candidata à aprovação com **90 pontos ou mais** e nenhuma falha crítica.

## Ordem de execução

### Fundação 0 — Kit Lúmen Vivo

Tokens, tipografia, app shell, botões, painéis, campos, foco, estados, iconografia e regras de movimento. Esta fundação recebe uma aprovação própria antes de qualquer tela interna.

**Execução:** laboratório candidato em `design-system/lumen-foundation/`; aguarda aprovação visual e funcional antes da Página 1.

### Página 1 — Portal de acesso

`#landingScreen`, login, cadastro, recuperação de senha, Google, visitante e Turnstile. É a primeira continuidade natural da landing comercial.

### Página 2 — Central da jornada

`#welcomeScreen`, save, estatísticas, continuidade, nova jornada e modos principais.

### Página 3A — Escolha de dificuldade

Consequências de cada modo, recomendação e confirmação.

### Página 3B — Desenvolvimento do personagem

Seleção de classe, estágios visuais, vínculo entre domínio e evolução.

### Página 3C — Ritual de iniciação

Diagnóstico inicial, progressão do ritual e recomendação de dificuldade.

### Página 4 — Pergunta: decisão

Enunciado, alternativas, HUD essencial, personagem e trilho de maestria. Esta é a principal tela do produto.

### Página 5 — Pergunta: aprendizado

Acerto, erro, ponto de desvio, explicação, evidências, referências, avaliação e próximo passo.

As Páginas 4 e 5 têm aprovações separadas, mas compartilham a mesma arquitetura. O inventário funcional das duas será realizado em conjunto antes do wireframe da Página 4.

### Página 6 — Oráculo dos Néfrons

Conversa contextual ligada à questão, limites de uso e estados de IA.

### Página 7 — Estudo e revisão

Seleção temática, sessão, revisão espaçada, diagnóstico e resumo.

### Página 8 — Mapa de domínio

Competências, lacunas, proficiência e prioridades adaptativas.

### Página 9 — Grimório de evidências

Diretrizes, artigos, resumos, busca, filtros e favoritos.

### Página 10 — Personagem e progressão RPG

Equipamentos, forja, runas, baús, conquistas e evolução.

### Página 11 — Ranking

Competição, constância, busca e estados sem posição.

### Página 12 — Prova simulada

Início, questão, cronômetro, retomada e resultado.

### Página 13A — Julgamento rápido

Introdução, rodada e resultado.

### Página 13B — Câmara do Equilíbrio

Hub, caso, atos, feedback e resumo.

### Página 14 — Confronto final

Boss, corrupção violeta, restauração do fluxo e vitória.

### Página 15 — Conta, planos e pagamento

Perfil, assinatura, paywall, checkout e estados de pagamento.

### Página 16 — Administração

Dashboard administrativo, analytics, push e ferramentas internas.

## Entregáveis por página

1. inventário de estados e riscos;
2. wireframe desktop/mobile;
3. direção visual desktop/mobile;
4. protótipo de interação ou vídeo curto de movimento;
5. preview funcional;
6. relatório de QA e placar;
7. decisão registrada: ajustes solicitados ou **APROVADA**.

## Próximo ciclo autorizado pelo roadmap

O redesign fica pausado durante os bloqueadores de segurança, editorial, conta/sync, PWA e integridade pedagógica. Depois deles:

1. validar ponta a ponta as superfícies Lúmen já publicadas;
2. inventariar cada superfície como `Lúmen`, `legado aceitável` ou `a migrar`;
3. fechar inconsistências comprovadas sem reler visualmente páginas aprovadas;
4. migrar **Estudo e Revisão** como a próxima página de maior valor pedagógico;
5. seguir com Oráculo, Forja/Inventário, Simulado e Conta/Paywall, uma entrega por vez.

Cada ciclo continua obrigado aos seis gates e ao placar de qualidade deste documento.
