# Consolidação visual 16.39 — cinema, chefe, veneno e Câmara

Candidata montada em 29/10/2026 sobre a `main` publicada **16.28** (`5eba704`, PR905). Reúne em um único release o trabalho local posterior que nunca foi publicado:

`Cinema 16.31 + Câmara → 16.32 → banner/infra 16.33 → 20 retratos 16.34 → workspace paginado 16.35 → popup estável`.

Os números 16.29–16.36 só existiram em prévias locais, e 16.37–16.38 foram commits intermediários desta mesma candidata no PR906. Esta entrega usa **16.39** para não colidir com nenhum deles nem rebaixar a versão publicada.

## Composição

| Origem | Como entrou | O que traz |
|---|---|---|
| Pacote `consolidated-delivery-16.34` (89 arquivos) | `git apply --check` e aplicação contra `5eba704`, sem conflitos | Cinema 16.31 (prólogos/cartelas, câmera 04 da batalha, epílogo estático com faixa externa, música opt-in), seis estados do chefe, três venenos V2, Câmara ilustrada com banner e 20 retratos |
| Pasta `consolidated-local-16.35` | Delta conferido arquivo a arquivo contra a 16.34 | `js/chamber-workspace.js`, `styles/lumen/chamber-workspace.css`, quatro chamadas `NQChamberWorkspace?.mount` em `js/minigame-acidbase.js`, helper `tests/helpers/chamber.ts`, spec 179 e specs 78/176/178/chamber-art-manifest adaptados à paginação |
| Pedido do proprietário sobre o popup | Ajuste nesta candidata | Cartão da Câmara com altura mínima igual à janela fora do hub — ver abaixo |

Ficaram **fora** de propósito: `local-preview.html` e `chamber-preview.html` (portais de conveniência local), pastas de QA, perfis de navegador, ZIPs de referência e o protótipo **Boss TRIO A7** (alternativa preservada fora do repositório; define o mesmo `window.NQBossArena` e não pode ser carregado junto). `cinema-preview.html` permanece porque os specs 166–171 e 177 dependem dele; recebeu `noindex`.

## Popup estável entre História e Exames

Pedido: *"mantenha o tamanho do popup fixo — ele diminui quando clica em história e aumenta nos exames"*.

No workspace desktop (≥961px, ponteiro fino, altura ≥600px, fonte ≤20px) a Câmara inteira usa **uma única moldura**: hub (Visão geral e 20 pacientes), introdução, todos os atos e o resumo. A moldura ocupa a altura útil da janela até 760px e, em telas mais altas, fica centralizada — em 1920×1080 é um cartão de 1160×760 em vez de uma coluna quase vazia de 1058px. As leituras longas são paginadas para caber nessa moldura, não na janela, então largura, altura e posição não mudam entre abas nem entre telas.

O cartão usa `min-height` em vez da `height` do experimento: com conteúdo que cabe, o resultado é o mesmo; se algo exceder, o cartão cresce e continua envolvendo o texto em vez de deixá-lo vazar pela borda. Nada é ocultado e nenhuma fonte é reduzida. Texto ampliado, janelas baixas, touch e mobile continuam no reflow nativo, porque o workspace não é montado nesses casos.

## Procedência das imagens

Todas conferidas por SHA256 contra `IMAGENS-INVENTARIO.json` da auditoria de 29/10 (31/31 idênticas). Nenhuma imagem nova foi gerada nesta entrega.

| Conjunto | Arquivos | Origem |
|---|---|---|
| 20 retratos da Câmara | `assets/chamber/patients/<id>.webp`, 768×960 | ZIP `NefroQuest-Camara-20-Retratos-WebP.zip` fornecido pelo proprietário; derivados dos PNGs originais preservados na Biblioteca (`PORTRAIT-SOURCE-MANIFEST.json` da 16.34). Copiados sem conversão nem recorte. `js/chamber-art.js` liga cada ID ao próprio arquivo, `approved:true` |
| Banner da Câmara | `assets/scenes/chamber-balance-still.webp`, 1280×720 | Quadro extraído do filme existente da Câmara |
| Veneno V2 | `assets/poison-cinema/v2/*.webp`, 640×640 | Três PNGs aprovados do proprietário; apenas redimensionamento uniforme e codificação WebP |
| Chefe — seis estados | `assets/boss-cinema/v2/hit{1,2,4,5,6,7}.webp`, ~2172×724 | Seis PNGs do ZIP `NefroQuest-Boss-6-Estados`; dimensões originais preservadas. Somam-se às quatro âncoras já publicadas |
| Epílogo estático | `assets/victory-jornada.webp`, 1402×1122 | Imagem canônica já publicada, sem alteração |

Vídeo da câmera 04 e as duas músicas opt-in também conferem com os hashes de `victory-reframed-20261028/MEDIA-HASHES.json`.

## Reconciliações com a main encontradas pela CI completa

O E2E completo do PR906 apontou duas diferenças de comportamento vindas do pacote 16.31 que os specs da main ainda cobriam:

- **Retrato do personagem no desktop.** O acabamento da batalha deixou o retrato parado e escondeu o botão de pausar a animação no desktop inteiro, embora o handoff pedisse "retrato estático" só na batalha. A regra agora vale só durante o chefe e no retrato de veneno V2; na jornada normal a animação e o botão de pausa voltam a funcionar como na 16.28 (specs 19 e 139).
- **Encerrar jornada.** O resultado redesenhado trocou "Encerrar jornada" por "Voltar à tela inicial", e com isso a vitória deixava de contar a partida nas estatísticas e de enviar a pontuação ao ranking. O botão "Encerrar jornada" voltou, abaixo das outras duas ações; fechar, reabrir os resultados e voltar à tela inicial sem encerrar continuam disponíveis. Os specs 75 e 92 foram ajustados ao resultado novo (a janela só abre para uma vitória real, e o selo de Campeão só aparece quando a conquista foi concedida) sem perder nenhuma verificação de foco, contraste, toque ou texto ampliado.

## O que não muda

Banco de questões, referências, histórico de revisões, gabaritos, IDs, FSRS, progresso, recompensas e isolamento de conta/piloto/demo. `data/question-revision-manifest.js` só troca o campo `release` (regenerado pela ferramenta oficial; os 741 registros são idênticos aos da `main`).

## Validação executada nesta candidata (29/10/2026)

Provas novas, sobre os arquivos desta branch; não somadas às suítes históricas 16.32–16.35.

- **Geometria do popup:** os 20 casos percorridos do primeiro ato ao resumo, todas as abas de cada tela, em 1280×720, 1159×684, 1857×721, 1440×900, 1920×1080 e 1024×768. Sem a regra: 200 telas mudam de tamanho em 1280×720. Com a moldura única: um só retângulo por tamanho de tela em hub, introdução e todos os atos dos 20 casos (9.984 medições), sem vazamento do cartão, sem página maior que a janela e sem perda de texto nas leituras paginadas.
- **Spec 179** ganhou dois testes permanentes: "card keeps its size between História and Exames" (três tamanhos, após responder e no redimensionamento; falha sem a regra com saltos de 93–105 px) e "hub and acts share one frame" (1159×684 e 1920×1080, moldura limitada e centralizada).
- **Specs da Câmara após a moldura única** (78, 176, 177, 178, 179, chamber-art-manifest), desktop e mobile: 55 aprovados, 0 falhas, 39 skips por perfil.
- **Specs focais** (10, 22, 31, 60, 78, 101, 131, 134, 136, 152, 164–179 e chamber-art-manifest), desktop e mobile: 331 aprovados, 0 falhas, 0 instáveis, 59 skips por perfil.
- **Gates Node da CI:** editorial 67, service worker 29, cinema 7, piloto 118, respostas 104 — 325 aprovados, 0 falhas. Sintaxe, versão/Sentry, tamanho, segredos, XSS e `bump-release --check` sem acusações.
- **Imagens:** 31/31 iguais ao inventário; 20 entradas de retrato com o próprio ID.

`scripts/bump-release.mjs` passou a reconhecer CSS do Lumen com hífen no nome (`chamber-desktop.css`, `chamber-workspace.css`); antes esses dois ficavam fora do cache-buster automático e do `ASSET_VERSIONS` do Service Worker.

## Limites conhecidos

- Escuta humana do áudio não foi feita; os testes medem volume e envelope, não percepção.
- O botão legado de bônus segue oculto no desktop; a continuação foi testada pela função nativa.
- Caixas gerais de perguntas e o pergaminho do modo antigo não fazem parte desta entrega.
