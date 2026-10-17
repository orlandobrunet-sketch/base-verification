# Continuidade do NefroQuest — 17/10/2026

Este plano acompanha os pedidos do proprietário e distingue execução de entrega. A base publicada conferida é **16.15**, merge `adad2e4b9bc4259dbd630f0d89c04bbfcd494e9b`. Os registros de setembro no ROADMAP são históricos. Este documento não libera conteúdo médico nem antecipa itens adiados.

## Critérios de estado

Cada pedido tem quatro marcos independentes: **pedido**, **implementado**, **testado** e **publicado**. Código escrito ou CI verde não bastam para marcar publicação. Para a interface, a conclusão exige inspeção da renderização e conferência pública após deploy. Para conteúdo clínico, também exige parecer formal da versão literal proposta, liberação editorial e reconciliação dos consumidores da referência.

`Pendente` significa que o marco ainda não foi demonstrado; `em execução` identifica trabalho atual; `sim` aponta uma evidência concluída. Pedidos reabertos permanecem pendentes até nova conferência. O [inventário consolidado](NQ_REQUEST_INVENTORY_2026-10-17.md) incorpora integralmente os 44 grupos históricos, W1–W8, A1–A5, Q1–Q4, R1–R5, correções funcionais e a pendência técnica Python/DLL, com os pedidos recebidos até 21:04 UTC. As linhas V16-01 a V16-07 abaixo correspondem a W1 a W7.

## Lote visual atual

| ID | Pedido e alvo confirmado | Implementado | Testado | Publicado | Critério de aceitação |
|---|---|---|---|---|---|
| V16-01 | Proporção do logo em todas as telas: usar a entrada como referência para o **Quest** dourado e itálico, inclusive no cabeçalho Jornada | Em execução | Pendente | Pendente | Comparação renderizada entre entrada e cabeçalhos; proporção relativa consistente, sem corte |
| V16-02 | **Reaberto:** serrilhado nos seis slots de equipamento em volta do retrato de Glomerulus e no card Estudante de Nefrologia; contornos azul/dourado | Em diagnóstico | Pendente | Pendente | Examinar geometria do frame, bordas, resolução dos assets e renderização em DPR 1/2; não confundir com recompensa |
| V16-03 | Restaurar **Ler resumo** como popup de artigo na questão e no Grimório | Em execução | Pendente | Pendente | Abrir artigo correto, ler e fechar por teclado/botão, retornar foco; preservar literalmente fontes e referências históricas |
| V16-04 | Auditar a batalha final e determinar se ainda há layout legado | Em diagnóstico | Pendente | Pendente | Captura real e parecer sobre os estados examinados; nenhuma conclusão por memória ou apenas pelo código |
| V16-05 | Dar contraste à narrativa central na transição de capítulo | Em execução | Pendente | Pendente | No capítulo III, card verde-petróleo/esmeralda translúcido, contraste legível e borda suave; padrão temático por capítulo; título, stats e botão fora |
| V16-06 | Alargar no desktop a recompensa **Pergaminho encontrado**, exemplificada pelo AKIKI (2016) épico | Em execução | Pendente | Pendente | Usar largura disponível com limite legível, medir altura real, preservar fonte e mobile; texto longo continua acessível por rolagem |
| V16-07 | Compactar **Evolução concluída — Nível 3 — O Analista dos Túbulos** | Em execução | Pendente | Pendente | Retrato aproximadamente 150–170 px; nível, título e narrativa na coluna direita; altura natural e rodapé menor; mobile empilhado |

Referências do proprietário: V16-01 `libfile_725c81648a088191aa4fee6bb6da9101` e `libfile_5558ababf61c81919515ff5c5187181a`; V16-02 `libfile_60ced4f81b44819186e90b1bcc3f99d4`; V16-03 `libfile_a628eb7f58848191acb777dac4f7df40`; V16-05 `libfile_bc51bf6e8c48819192a7378bc65d5801`; V16-06 `libfile_baa785af275c8191b8ffd808c6701210`; V16-07 `libfile_171543a13af481919f7a1b8020cc80e4`. Os alvos dessas imagens foram identificados na conversa; esses identificadores não são arquivos do site.

As alterações preservam conteúdo médico, IDs, gabaritos, histórico, FSRS e estado de usuário. O lote usa checkout próprio a partir da 16.15. Versão e cache serão atualizados junto aos assets antes do PR. A publicação depende de revisão independente do HEAD exato, CI completa e conferência pública.

## Entregas recentes verificadas

| Pedido | Implementado | Testado | Publicado | Evidência e limite |
|---|---|---|---|---|
| Ícones dos cards da Forja | Sim | Sim | 16.14 | [PR 898](https://github.com/orlandobrunet-sketch/base-verification/pull/898); conferência pública preservada. Não encerra o serrilhado dos slots, reaberto em V16-02 |
| Nome completo Dr. Glomerulus no card Jornada e alinhamento dos cards da Forja | Sim | Sim | 16.15 | [PR 899](https://github.com/orlandobrunet-sketch/base-verification/pull/899), [CI 939](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/38994541859), [Pages](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/39068989040). Quality 287, Smoke 126, Full 1.947 passes + 187 skips originais; zero falhas/flaky/retries. Treze arquivos públicos exatos e onze vistas inspecionadas |

A ampliação de texto dessa conferência usa fonte raiz de 32 px, não zoom nativo do navegador. As capturas móveis de altura ampliada mostram os cards completos; não certificam toda a experiência móvel futura. Navegador utilizado: Chromium temporário, sem conta ou perfil pessoal.

## Continuidade clínica separada

| Frente solicitada | Implementado | Testado | Publicado | Próximo passo |
|---|---|---|---|---|
| Revisão formal das 741 questões, com revisão independente em fonte original | Relatórios em execução | Checkpoint portátil A9: 664 disposições autorais e 624 independentes; faltam 77/117 | Dez questões publicadas | Completar relatórios e reconciliar liberações literais. Os totais incluem bloqueios e fusões; não equivalem a aprovações |
| Três pacotes adicionais já liberados, QIDs `312ab0c7`, `d8fd9889`, `9895f375` | Aplicados somente em checkout local | Evidências preservadas; reconciliação sobre nova base pendente | Pendente | Retarget técnico único contra a base realmente publicada, com backup e gates vigentes; não executar os drafts antigos de 14→15 |
| Portabilidade dos pareceres C032 A2 e A025 | A8/A9 concluídos | 704 verificações técnicas + 256 no segundo readback, zero falhas | Não se aplica: artefatos de revisão | +16 disposições autorais incorporadas uma vez; base + 14 deltas preservados, sem alterar o banco |
| B027 autor e C029 independente | Em execução | FINAL pendente | Pendente | Concluir com originais já locais; fontes decisivas ausentes mantêm bloqueio |

O materializador oficial Library continua bloqueado no Windows por ausência de `os.setxattr`; não omitir metadados nem contornar o fluxo. Bloqueios de fontes existentes permanecem válidos. Uma mudança clínica material exige nova revisão da proposta literal. As três questões locais não são parte do lote visual.

## Compromissos futuros preservados

| Pedido | Ordem autorizada | Implementado | Testado | Publicado |
|---|---|---|---|---|
| Adaptação móvel dedicada: texto e controles maiores, usabilidade própria | Depois de concluir a web; não iniciar agora | Pendente | Pendente | Pendente |
| Revisão completa da Câmara do Equilíbrio e ilustração narrativa de cada caso clínico | Etapa futura; não iniciar agora | Pendente | Pendente | Pendente |
| Troféus e membros honorários | Depois das questões, conforme compromisso anterior | Pendente | Pendente | Pendente |
| Acesso vitalício gratuito por concluir toda a jornada Hardcore e vencer o boss final | Depois das questões; qualificação, titularidade e concessão durável/idempotente antes da ativação | Pendente | Pendente | Pendente |

O backlog histórico de produto permanece no [ROADMAP](../ROADMAP.md), e o inventário visual anterior em [Conferência do ciclo de layout](NQ_LAYOUT_REFINEMENT_2026-10.md). Registrar aqui um pedido não autoriza executar outros itens históricos automaticamente.

A ordem relativa entre mobile, Câmara e recompensas futuras não foi definida pelo proprietário. A expansão para pelo menos 1.001 questões aprovadas/publicadas e a continuidade dos pergaminhos permanecem horizonte posterior; os lotes das PRs 882/884 não serão duplicados. O ponto de continuidade para outro computador só será anunciado como completo após a conclusão da etapa atual, com branch, commit, testes e pendências no GitHub.
