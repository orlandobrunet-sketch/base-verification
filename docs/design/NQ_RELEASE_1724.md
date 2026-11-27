# Publicação 17.24 — fechamento técnico

Publicada e conferida em 15/11/2026, sem alteração de conteúdo médico. A revisão médica autorizada depois deste fechamento pertence à etapa seguinte.

- [PR973](https://github.com/orlandobrunet-sketch/base-verification/pull/973), fonte `16a6776be17ab2fac1d38cc2b76fbd4dc2f44554`, merge `ca1184916b53cddfc7581df17ed75ff3a029c14f` e árvore idêntica `eb87119fa481c157c75fd37be30343b05a77feae`.
- [CI1096](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/43735147542): 16 grupos aprovados, 3.569 aprovações diretas, uma após repetição na 279 e 268 skips previstos, em 3.838 casos, sem falha final. Smoke: 130 aprovações; captura focal Linux: quatro casos aprovados.
- [Pages](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/43738008600) concluído no merge exato. Oito arquivos públicos idênticos à revisão aprovada.
- No domínio publicado: 32 percursos aprovados sem retry/skip. Há 30 auditorias reais limpas; os dois percursos de XP usam guards de rede, mas não gravam contadores. Não se atribuem auditorias ou contagens ausentes a esses dois casos.

## Comportamento entregue

Ao ampliar o texto com movimento reduzido, a geometria dos leitores termina de mudar antes da tecla End; a rolagem continua nativa. Na Câmara, os callbacks de foco de 30 ms respeitam um controle ou leitor escolhido nesse intervalo, inclusive ao sair ou trocar de ato.

Os botões do Ritual mantêm a área clicável imóvel quando o ponteiro encosta na borda, preservando a resposta visual de cor/borda. O cenário de quatro acertos da spec 216 passa pela entrada nativa como visitante; cálculo de XP, prazo e asserções permanecem iguais. O helper compartilhado não mudou.

## Provas e rodadas anteriores

Após o bump, 549 contratos Node locais passaram. A seleção Ritual/XP passou 52 casos sem repetição, após dois REDs causais da oscilação de borda. Os 32 cenários locais de End e os 20 da Câmara foram reaproveitados por identidade de fonte; não são novas reexecuções da 17.24 nem se somam aos 52 locais ou aos 32 públicos.

A candidata 17.23 não foi publicada. CI1094 (`43729727169`) permanece reprovada pelo coletor focal, apesar de a bateria principal ter 3.566 aprovações diretas e 268 skips, sem falhas ou repetições. CI1095 (`43730767626`) conserva 3.564 aprovações diretas, duas após repetição e 268 skips, sem falha final. As specs 199 (Ritual) e 216 (XP) receberam contraprovas e reparos delimitados antes da publicação. [Investigação de End e foco](NQ_END_AND_INTERMITTENCIES_1723.md), [Ritual e preparo de XP](NQ_END_AND_RITUAL_1724.md).

Na CI1096, a primeira tentativa da 279 falhou durante `continueGame`, antes das asserções dos equipamentos, e passou na repetição configurada. O diagnóstico não capturou o erro original de protocolo; a causa não foi declarada resolvida. A coleta focal de transporte e as aprovações posteriores não autorizam atribuição retrospectiva.

## Escopo seguinte e limites

Após esta publicação, o proprietário autorizou continuar o projeto incluindo a parte médica. O trabalho editorial segue as skills correspondentes, o [guia operacional](../../AGENTS.md) e o [Handbook, §18.4](../editorial/NQ_EDITORIAL_HANDBOOK_v1.md). Implementar conteúdo exige cumulativamente autorização explícita, revisão formal, veredito de aprovação, `Autorização de publicação: LIBERADA` e ausência de pendência decisiva ou combinação inválida. A liberação é derivada dos eixos editoriais; itens bloqueados não podem entrar no banco e mudanças materiais exigem reavaliação. Nenhuma questão é liberada por este documento.

As ocorrências históricas 96/97/98/191/193/226/279 continuam sem atribuição exclusiva. A captura tardia de pilha não foi garantida no limite técnico e não foi integrada à spec 193 nem pré-habilitada no fluxo normal. O reparo de foco da Câmara é um defeito comprovado separado do evaluate histórico bloqueado.

Celulares foram emulados. Aparelhos físicos, sincronização real de conta e operações reais de IA, pagamento ou envio não foram exercitados. A prévia própria da porta 5513 foi encerrada. As restrições médicas nos checkpoints anteriores descrevem aquelas rodadas e não substituem a autorização atual.

O recibo externo `NQ_PUBLICATION_1724_RECEIPT.json` tem SHA256 `35b9338d539638130120995afc465f609a9362881a29619056e6987f8c07bf13`; o relatório `NQ_PUBLICATION_1724_REPORT.md`, SHA256 `879c245b3e78f9d3563fa33871488e1794d3467f41ac72848d12171a380886b9`. Ambos estão na pasta de evidências da sessão e preservam os hashes das provas, rodadas e limites. [Continuidade](../CONTINUITY.md) e [roadmap](../ROADMAP.md) registram o escopo vigente.
