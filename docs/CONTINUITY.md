# Continuidade do NefroQuest

## Estado atual — 30/10/2026

**Publicado:** 16.46. A consolidação visual (PR906), a direção das aberturas (PR908), a vitrine (PR907), notebooks com toque (PR909), o retrato parado (PR910), o classificador (PR911) e o PR912 entraram em 30/10. O proprietário autorizou agir e publicar sem nova consulta; o gate editorial de `data/topics.js` continua valendo.

**Fluxo:** testes focais e gates locais, PR, merge e conferência do site. A `main` não exige CI, e o merge automático do GitHub não espera os testes sem essa regra. Quem criar a regra precisa fazê-lo no GitHub.

### Verificações de 30/10

- **Sentry:** nenhum erro aberto em 90 dias. Um evento de teste enviado de produção chegou ao painel, então o canal funciona.
- **Supabase:** API saudável, banco sem erros nos logs. Avisos restantes: proteção contra senhas vazadas desligada (ligar no painel Auth), `is_admin()` exposta por RPC (usada pelas regras de acesso, retorna só o próprio status) e `processed_payments` sem política (intencional, só o service role escreve).
- **Pagamentos:** nenhuma notificação ou pagamento registrado até hoje. Retorno ao jogo, assinatura e idempotência do webhook foram revisados por leitura. A correção para a falha transitória do Mercado Pago e o texto novo do checkout foram publicados em 30/10 (`mp-webhook` v13, `create-mp-preference` v2). O deploy de funções em produção é bloqueado no modo automático e é rodado pelo proprietário. O fluxo completo em teste continua sem execução.
- **Serrilhado dos equipamentos:** conferido em DPR 1, 1,25 e 2; resolvido no PR900.
- **CSP:** a produção é servida pelo GitHub Pages, sem cabeçalhos. Uma meta CSP exigiria `bypassCSP` nos testes, que usam `eval`, e ainda manteria `unsafe-inline`. Fica para quando os scripts embutidos saírem. A política da prévia na Vercel passou a permitir o bundle do Sentry.

### Pendências

| Quem | Itens |
|---|---|
| Proprietário: material | Trilha dos filmes de herói · arte final da vitória · raio do filme do chefe · referências das caixas de perguntas e do pergaminho |
| Proprietário: decisão | Boss TRIO A7 · 12 fundos de Conquistas · filmes e vitória no celular (depende do GA4) · versão mobile dedicada · regra de CI na `main` |
| Proprietário: conta | Pagamento real · envio pelo `/contato/` · leitor de tela · GA4 · senhas vazadas no Supabase |
| Editorial, com gate por item | Integrações por elegibilidade (índice A37: 741 disposições, não 741 aprovações) · 72 vínculos de competência congelados · mais de 1.000 questões · resumos genéricos |
| Futuro | Android · recompensas (troféus, honorários, vitalício Hardcore) · reparo manual do save histórico · remover scripts embutidos para permitir CSP |

Direção das aberturas e decisões abertas em [NQ_CINEMA_DIRECTION_16.42.md](design/NQ_CINEMA_DIRECTION_16.42.md).

## Estado em 29/10/2026

**Publicado:** 16.28, `main` `5eba704` (PR905, 26/10). Site conferido contra a `main` por hash em 29/10.

**Candidata visual em revisão:** 16.39, branch `claude/visual-consolidado-1637`, sobre `5eba704`. Consolida cinema 16.31, seis estados do chefe, três venenos V2, Câmara ilustrada com 20 retratos e Câmara paginada, mais o popup de tamanho fixo entre História e Exames. Composição, procedência das imagens e limites em [NQ_VISUAL_CONSOLIDATION_16.39.md](design/NQ_VISUAL_CONSOLIDATION_16.39.md). Merge e deploy dependem da aprovação do proprietário.

| Situação | Itens |
|---|---|
| Publicado | PR900/16.18 marca, equipamentos, leitores e modais · PR901/16.19 três questões clínicas · PR902/16.22 Gitelman, Simulado, recompensa V2 · PR903/16.23 Dashboard, Mapa, landing · PR904/16.25 Estudo, recompensas, Oráculo, demo · PR905/16.28 primeira integração do cinema · PR835 tag GA4 · PR831 canal `/contato/` · 15.85 trinta retratos das classes |
| Implementado, aguardando aprovação | Candidata 16.39 acima |
| Aguardando decisão do proprietário | Boss TRIO A7 (protótipo alternativo de 13 poses, fora do repositório; não carregar junto com a 16.39) · 12 fundos RGB de Conquistas (acabamento opcional) |
| Não iniciado | Caixas gerais de perguntas (sem referência visual localizada) · pergaminho no modo antigo (pedido de 24/10, referência ainda não examinada) |

### Frentes ativas — no máximo três

1. **Publicar a candidata visual 16.39** após revisão do proprietário e CI do SHA final.
2. **PR834 — classificador por palavra inteira e negação.** A correção ainda não está na `main`. Reaplicar só o delta sobre a base vigente, preservando `nqCompProgressStorage`, com bump próprio; não reutilizar o arquivo antigo nem o número 15.38.
3. **Integrações editoriais por elegibilidade.** O índice A37 registra 741 disposições autorais e 741 independentes, incluindo bloqueadas, fusões e holds — não são 741 aprovações. Os 72 vínculos curados de competência continuam congelados. Cada objeto exige gate, skill e autorização próprios.

### Registrados, sem bloquear a entrega visual

Versão mobile dedicada (aguarda proposta) · pagamentos mensal/vitalício ponta a ponta · Android · recompensas futuras (troféus, honorários, vitalício Hardcore) · leitor de tela real · verificações autenticadas (GA4 no console, Supabase, Sentry) · envio real pelo `/contato/` · CSP (depende de remover handlers inline) · reparo manual do save histórico (origem não inferível; não automatizar).

---

## Histórico — checkpoint editorial de 14/10/2026

Preservado como registro. As contagens abaixo (448/741, PR897, 16.13) foram superadas pelo índice A37 e pelas publicações 16.18–16.28.


A etapa autorizada é revisar as 741 questões principais, obter revisão independente e integrar propostas liberadas preservando IDs, gabaritos, históricos e versões. Recompensas Hardcore, membros honorários e Meus troféus ficam depois das questões. A revisão integral continua em andamento.

Checkout `nefroquest-clinical-13`, branch `codex/clinical-review-2026-10-12`, base publicada `135899077669af6dcf564717833227828ba03fe5` (16.09). O [PR897](https://github.com/orlandobrunet-sketch/base-verification/pull/897) ainda aguarda os gates do novo HEAD. O último HEAD remoto confirmado antes deste checkpoint é `80eeb2163ddeaeb8412f5ad5c932412ff07ef1c5`. A candidata é **16.13**, com SW, Sentry, assets e cache-busters coerentes. A 16.09 permanece publicada; não repetir sua auditoria de produto.

Checkpoint A20 congelado: **448/741 revisadas**, 293 pendentes, 387 propostas autorais liberadas e 61 bloqueadas; 424 questões com parecer independente e 362 AFTERs exatos aceitos. Há 186 relatórios portáteis em `docs/editorial/reviews/2026-10-12/`, com hashes no índice e disposições na fila, e 13 propostas autorais liberadas com hold explícito. Todos os 159 relatórios do HEAD anterior ficaram byte a byte. A exportação registrou 7.277 comparações de objetos clínicos, incluindo verificações repetidas dos relatórios preservados. Lotes em execução e pareceres posteriores ao corte não entram nas contagens. Revisão concluída não significa aplicação nem liberação global.

A arbitragem C018 substitui somente três gates e mantém os outros cinco; duas questões continuam FUNDIR/BLOQUEADA e 911fdbb4 tem aprovação científica com holds downstream. O novo parecer B012 substitui somente dois gates e conserva os outros seis. Os reparos pontuais anteriores mantêm seus outros sete itens. Suportes de bibliografia, arbitragem e binding não contam novamente. EAU tem uma publicação com quatro escopos; IKMG C021 tem adendo CONSENSUS e gate exato. Nenhum alvo de fusão ou consumidor externo é aprovado por associação.

O delta aplicado permanece em dez questões, cinco cards ADD e três REPLACE, no manifesto `CLINICAL-2026-10-12-10.json`. Banco SHA256 LF `276419bc508199d63fd889057fd17d63e256917246f0821c3d03be5cd0943e1a`; CRLF `45c283a5a9634fe72e166762bd2461158ebc1647f5b5a026b7ae1ea68f6ee130`. Há 350 cards. Os 731 bindings fora do lote, dez BEFOREs e 40 perfis históricos foram preservados. O manifesto 16.12 mantém os 741 registros correntes da 16.11. Não resetar FSRS nem apagar IDs em fusões. Nenhuma questão ou card novo foi aplicado por este checkpoint.

A [CI933](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/38441423478), HEAD 80eeb216, terminou com 1.935 PASS, 187 SKIP e quatro falhas persistentes em 2.126 casos, zero flaky. Qualidade 287 e smoke 126 passaram. Todos os 2.116 casos anteriores e os mesmos 187 skips foram preservados; os dez novos casos são guards do teste21. Sessenta das 64 falhas anteriores passaram. Restaram os dois cenários de retomada offline136 nos dois perfis, esperando quatro alternativas e encontrando zero, inclusive em oito retentativas adicionais.

A prova HTTP e o cenário original sob `serve@14.2.4` confirmaram 301 de `/offline.html` para `/offline`, com HTML idêntico. Os dois predicados antigos da fixture eram falsos nesse caminho, servindo banco de 741 questões e manifesto de uma; o catálogo real recusou a divergência. A reprodução RED preservou storage. A correção altera somente esses dois predicados para aceitar ambos os caminhos. Os quatro cenários originais passaram nos dois perfis e a suite136 completa passou 74/74 sob esse servidor, sem retry/fail/flaky/skip, com assertions e timeout efetivo 90s intactos. As capturas e os processos temporários foram conferidos pelo responsável antes do handoff. A instalação da CI não fixa versão; não atribuir a ela a versão local do pacote sem prova. CI completa no novo HEAD continua necessária.

As correções anteriores de 134/135 usam as APIs reais para gerar banco, manifesto e histórico coerentes. O histórico de 135 é independente do boot. A retomada pública de estudo captura binding somente quando nulo, recusa contexto antigo e preserva a origem serializada; a segunda leitura precisa corresponder à primeira antes de UI/gravação. Os cinco guards cobrem proprietário, geração, legado, falha de gravação e troca adversarial de sessão. FSRS, estatísticas e domínio previamente preenchidos ficaram byte a byte. O guard e readback não constituem CAS atômico universal entre abas. As demais provas focais anteriores conservam seus próprios pins e limites de interpretação.

CASE_CONTROL, SERIES e CONSENSUS foram acrescentados aos contratos de criação/revisão, preservando os sete gêneros antigos, hierarquia e gates. A manutenção não libera itens automaticamente. Os gates novos B012/B014/B015 vinculam objetos exatos; EXPERIMENTAL/COMPARATIVE continuam em hold. Os três consensos legados mantêm holds por card e consumidor. Duplicidade, fontes insuficientes, rascunhos e variantes de cards compartilhados continuam registrados por item na fila.

Fontes primárias públicas são consultadas por autores e revisores, registrando acesso, abstract versus corpo e alcance efetivamente lido. B016-A7 foi negado antes da execução, inclusive após a repetição única com autorização autenticada. Até o corte A20, B018-A2 havia sido negado na primeira tentativa, cujo contexto já continha aquela autorização, e não foi repetido. Zero arquivos de fontes foram criados pelas ações negadas; nenhum canal alternativo foi usado. B018 e demais lotes posteriores não integram este corte. Relatórios portáteis preservam objetos clínicos e URLs públicas; caminhos privados e fontes brutas, PNGs, traces e logs completos ficam fora do Git.

Próximos passos: validar o commit real, auditar blobs e destino, sincronizar a branch sem force e atualizar o PR. Executar CI completa no novo HEAD e obter revisão externa antes de publicar. Continuar as questões autorais restantes, peers FIFO, conciliação de cards e integrações posteriores. Nenhum BLOQUEADA entra no banco; mudança material exige novo gate formal e revisão independente exata. Não anunciar pronto com revisão parcial.

Atualização técnica de 14/10/2026: a CI934 no HEAD a5b3fcbd passou com 1.939 PASS e 187 SKIP em 2.126 casos, zero fail/retry/flaky; qualidade 287 e smoke 126 passaram. A revisão independente encontrou um P2: os callers de Study/offline atribuíam progresso antes de respeitar a recusa do save. A candidata 16.13 confirma o save da resposta e dos contadores antes de FSRS/estatísticas; na recusa desfaz somente os incrementos em memória, conserva o raw concorrente e pede recarga. A exceção Greptile foi autorizada e [registrada](editorial/external-review/PR897-GREPTILE-EXCEPTION-20261014.md). CI completa e aprovação independente do novo HEAD continuam necessárias. O corte A20, 186 relatórios e dez aplicações clínicas não foram ampliados.
