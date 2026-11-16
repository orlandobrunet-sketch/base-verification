Revisão técnica final dos dados 17.28 — R3

Foram concluídas 6.575 verificações de integridade, sem achado. O snapshot permaneceu estável durante a leitura. Esta é uma revisão técnica dos bytes integrados e da rastreabilidade dos pareceres; não reaprova conteúdo médico de autoria própria.

- Banco atual: 725 identidades únicas; 406 referências ativas; 500 registros históricos.
- Perfis: 2.900 atuais e 2.000 históricos, com recálculo independente dos hashes de autor, referência, registro, fonte e vínculo.
- Ledger autoritativo: 175 entradas de questões, 137 cards, oito artigos, quatro recibos somente de vínculo, duas criações e 18 retiradas. Os payloads atuais correspondem aos respectivos literais e hashes liberados.
- As 18 retiradas e duas adições explicam exatamente a passagem de 741 para 725 questões. Os destinos estão ativos, os originais publicados estão arquivados e as posições não foram recicladas.
- O prefixo de 741 posições publicadas está preservado; somente os dois novos IDs foram acrescentados, totalizando 743 posições. Todos os 181 registros históricos anteriores permanecem exatos.
- A prova dos 353 IDs originais foi reconstruída a partir do commit publicado, sem depender das listas de testes ainda em atualização. Seu digest continua c35ba55bca3cec0ca1c51f2efffaee27ad86e8eaae1fa894030a38035ef99e56.
- A canônica 0e1a838d conserva todos os campos publicados exceto refs, agora somente Vallon. 96c0c85d e a5c73397 foram retiradas com hashes do registro publicado 17.27, preservando os originais.
- O reparo de KDIGO IgAN altera somente URL; os outros 11 campos estão exatos. A única referência retirada é a identidade CMV explicitamente adjudicada. O registro antigo permanece no histórico.

R3 JSON: SHA256 78d41d3b279fef0742c64c0f8ccdbc868bc33b69b25d316ac931ffd62ef7d615.

A nota de rastreabilidade do recibo IKMG foi resolvida em adendo separado, sem alterar R3: o recibo registra os hashes do autor e do card, e o hash de registro pode ser derivado deles. Os 12 controles de transporte passaram; o recibo não foi contado como novo gate integral. Adendo: SHA256 7eec6c5148866ff8ce1d47fbc79552255dd19902f80b2cc37c3ecee17514c2b5.

O comando bump-release --check --base HEAD concluiu com código zero. A suíte de service worker concluiu 35/35, sem repetição. Ela inclui a contraprova contra o worker publicado 17.27, URLs reais dos carregadores, cache canônico offline, atualização futura do gerador e preservação da sessão.

A cópia de ledger em docs ainda estava diferente do ART autoritativo durante R3. O empacotamento final pertence ao integrador e deve ocorrer depois dos últimos recibos. Os JavaScripts auxiliares foram pinados apenas como fotografia daquele instante; a recuperação da biblioteca continuava delegada. Os testes de navegador têm recibo próprio e não são inferidos desta análise de dados.
