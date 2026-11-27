# Preparação da 17.26 — hipercalemia e preparo do teste 103

Base publicada: 17.25, [PR974](https://github.com/orlandobrunet-sketch/base-verification/pull/974), fonte `845baee59bfa6fd285bd2f5814312b14322d97f8` e merge `33b203ddccc125c04b2c740c2316ae5c0ea362a0`. A autorização do usuário para continuar incluindo a parte médica, de 15/11/2026, permanece vigente.

A candidata aplica localmente as três versões de questões de hipercalemia aprovadas formalmente, identificadas pelos QIDs `ebea50d5`, `e0853fac` e `b35be598`. O card existente `ukka_hyperkalemia_2026` não muda. A autorização para continuar o projeto não substitui os gates editoriais de cada item: revisão formal, veredito de aprovação, publicação LIBERADA e ausência de pendência decisiva ou combinação inválida entre Evidência e Pendência.

O lote preserva os QIDs, a identidade das questões e os agendamentos FSRS. As três versões efetivamente publicadas na 17.25 foram acrescentadas ao histórico, preservando os 177 registros anteriores: são 180 registros e 720 vínculos, com 741 questões atuais e 372 referências. As outras 738 questões e todas as referências permanecem iguais. A [conferência independente da aplicação](../editorial/reviews/2026-11-15-hyperkalemia/application-independent-review-R2.md) confirmou esses limites, os literais aprovados e o transporte do histórico a partir da base publicada.

A única mudança técnica ajusta a preparação do teste 103 para usar o helper existente com `{ asGuest: true }`. Na CI1097, o Portal interceptou a entrada inicial desse teste; ele passou após uma repetição. A ocorrência original permanece registrada, e a 17.25 foi publicada sem esse reparo. A candidata não altera o código do produto. O ajuste mantém as asserções, os prazos e as regras de repetição do teste.

## Conferências realizadas e pendentes

Os testes de lógica e configuração passaram: **552 aprovações**, sendo 543 de lógica e nove de configuração de navegador, sem falha ou skip. Os testes de configuração não substituem a execução dos percursos no navegador.

As tentativas iniciais dos testes 103 e 269 não produziram validação de navegador: os impedimentos de ambiente ocorreram antes da navegação, incluindo a recusa do endereço de loopback pelo guard, a restrição de rede em `localhost` e a indisponibilidade do servidor. Esses registros são preservados separadamente. Depois do restabelecimento da prévia, os 12 cenários originais dos testes 103 e 269 passaram diretamente, sem repetição ou skip; asserções, prazos e guards foram mantidos.

Continuam pendentes:

- Percursos médicos de navegador pertinentes ao lote e ao histórico/FSRS.
- CI completa da candidata exata, registrando separadamente aprovações diretas, repetições, skips e falhas finais.
- Integração, Pages no merge exato, comparação dos arquivos públicos e percursos nativos no domínio.

Versão/cache e identificação 17.26 acompanham os dados no mesmo commit. Este documento de preparação não substitui os recibos da aplicação, dos testes ou do fechamento da publicação e não declara a 17.26 publicada.

## Limites e pendências mantidos

O item TTKG `6474ec20` permanece em revisão por conflito decisivo de evidência; não foi desabilitado nem reescrito no produto. A disposição formal dos dois itens de mecanismo de vaptanos continua pendente; nenhum deles foi fundido ou desabilitado. O restante da revisão médica global e da análise de viés de comprimento também permanece aberto.

As ocorrências históricas 96/97/98/191/193/226/279 continuam sem atribuição retrospectiva exclusiva. Aprovações posteriores e o ajuste de preparo do teste 103 não explicam essas ocorrências antigas. Aparelhos físicos e contas, pagamentos ou outros serviços reais não estão certificados por esta preparação.

A publicação 17.25 já está encerrada: CI1097 com 16 grupos aprovados, 3.575 aprovações diretas, uma após repetição no teste 103, 268 skips e nenhuma falha final em 3.844 casos; smoke 130. Pages `43754551592`, oito arquivos públicos idênticos e 26 percursos nativos públicos com 26 auditorias passaram sem repetição ou skip. Esses resultados pertencem à 17.25 e não certificam a candidata 17.26.
