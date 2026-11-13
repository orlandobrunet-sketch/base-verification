# Conservação da sessão de Estudo entre abas — 17.07

O proprietário autorizou continuar a revisão técnica após a publicação da 17.06. Esta entrega corrige perda de sessão entre abas e a preparação intermitente de um teste do Ranking. Conteúdo médico, backend, pagamentos e regras de progressão permanecem preservados.

## Causa e comportamento

Uma aba A conclui uma sessão. A aba B inicia outro Estudo e salva uma resposta. Ao sair da correção ou do resultado em A, `_clearStudyState` removia a chave sem conferir qual sessão estava armazenada. Recomeçar ou treinar pontos fracos em A também removia essa chave e substituía a sessão de B.

A limpeza passa a comparar os bytes que a aba carregou ou salvou, além do vínculo de progresso. Só atualiza sua referência após confirmar a remoção. A retomada legada concluída fornece explicitamente os bytes lidos. Recomeço e reforço respeitam uma recusa antes de substituir questões ou contadores e orientam a conferir o estudo mais recente.

## Evidência

A regressão 248 usa questões exclusivamente técnicas e duas páginas do mesmo contexto, compartilhando o armazenamento da origem. A sessão B já possui uma resposta e precisa conservar seus bytes e continuar respondendo após a ação de A. Há quatro percursos com conflito e três controles normais, nos dois perfis.

- A primeira tentativa foi interrompida por erro de preparação: a segunda aba já recuperava o modo visitante, mas o teste tentava clicar no portal oculto. Esse registro não prova o defeito do produto. O preparo passou a respeitar o visitante persistido, sem alterar as verificações funcionais.
- Antes do reparo: oito falhas nas verificações de conservação e seis controles aprovados, sem repetição.
- Depois do reparo: quatorze cenários aprovados, sem repetição, em computador e celular emulado.
- Compatibilidade: 32 cenários relacionados de retomada, revisão histórica, recusa de gravação, foco e piloto passaram sem repetição; 167 testes Node de progressão e piloto também passaram.
- O reforço disponibiliza seu botão pelo renderer real com um resultado exclusivamente técnico. A área fraca resulta de uma resposta errada nativa. Essa preparação não valida autenticação nem o serviço de IA.

A validação relacionada e os resultados finais da CI, integração e conferência pública constam no PR desta entrega. Aprovação local não comprova publicação.

## Preparo do Ranking

O primeiro caso da spec 07 passa a entrar explicitamente como visitante pela opção existente do helper. Asserção, prazo, repetições, caminho padrão do helper e demais testes foram preservados.

Um experimento de dois braços retém o carregamento real de `topics.js` durante a retomada e emite uma vez o handler nativo `INITIAL_SESSION/null`. O controle reabre o portal e intercepta a alternativa; com a entrada Guest, o portal permanece oculto e o corpo original do teste passa. Isso comprova o mecanismo e a proteção do preparo; não identifica retrospectivamente o emissor exato do evento na CI anterior.

## Limites

A comparação de fonte e a conferência após a operação não constituem uma transação atômica entre processos. Os testes usam abas isoladas de visitante e não certificam aparelhos físicos ou serviços reais. A intermitência histórica da correção do Estudo fora da janela continua sem causa comprovada; esta correção de conservação não a encerra. Nenhuma rolagem, temporizador ou regra médica foi alterada.
