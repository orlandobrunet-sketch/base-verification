# Adendo independente — qualidade do diff de testes 17.25

**Resultado: sem achados bloqueantes no diff examinado.** A revisão foi de código e fontes, sem repetir execuções. O recibo operacional anterior permanece intacto, SHA-256 24f3fbda58bf71129ae38e5585a0877a092e2e177eb8bd47f67b5c76502977f8. Este adendo não amplia aquela autorização nem emite parecer clínico.

## Asserções preservadas

O ajuste 169→177 registros e 676→708 perfis corresponde ao histórico real, preservando 741 questões e 2964 fontes correntes. No teste de construção do catálogo, só os totais mudaram; as comparações integrais entre os caminhos síncrono e assíncrono continuam.

Na spec 136, os hashes congelados das 16 versões iniciais e 110 versões 17.09 não foram recalculados. O hash do conjunto legado de 353 IDs também permanece. A referência hyponatremia_verbalis2013 é adicionada explicitamente e exigida separadamente; excluí-la da classificação de IDs legados permite manter o mesmo contrato legado, sem ocultar substituição arbitrária. O total de referências é 372. A nova coorte exige os oito qids exatos e 32 vínculos conhecidos/históricos com fonte, autor, cards, binding, revisão atual separada e política histórica corretos. As coortes anteriores conservam seus controles.

Na spec 257, só o total global passou a 177; o recorte 17.11 continua exigindo 43 registros, os 42 reescritos mais o consumidor de card, e 172 vínculos. Nenhum recorte foi ampliado para aceitar resultados divergentes.

Na spec 255, o parâmetro release mantém 17.09 como default e os casos anteriores conservam seus IDs, fluxo e asserções. Os novos casos usam os dois SUSTAIN da versão 17.24 e a pendência de a4c85d32. Conferi nas fontes reais que os dois enunciados e cards antigos diferem dos atuais e que a dificuldade de a4c85d32 passou de hard para medium. Portanto os novos fixtures exercitam uma diferença real.

O fluxo respondido exige o enunciado antigo, perguntas e respostas idênticas ao save, objeto completo das referências anteriores, estado histórico, nota de 100% e raw final intacto. O fluxo pendente mantém botões bloqueados e raw intacto até confirmação explícita; depois exige fonte corrente integral, binding atual e referências correntes. Nenhuma asserção antiga foi suavizada, nenhum prazo ou retry foi aumentado e nenhum skip/fixme/soft foi introduzido.

## Gravações e limites de interpretação

Os guards de rede e Guest permanecem intactos: os testes usam localStorage sintético no contexto de navegador de teste, fecham WebSockets e abortam métodos diferentes de GET. As mudanças não abrem escrita em Supabase nem usam uma conta autenticada. Também não substituem o banco ou funções de produto.

Não há falha confirmada que exija alteração deste diff. Há três limites a preservar no relato dos resultados:

- Os novos casos SUSTAIN verificam o objeto completo de referências na revisionView e o raw ao final; não inspecionam cada campo visual do card nem contam toda chamada setItem/removeItem ou toda chave global de progresso. Os contratos gerais existentes nas specs 136/257 complementam o controle de gravação e crédito repetido.
- O novo caso pendente compara a fonte corrente integral à fonte real, mas não fixa isoladamente hard/medium em uma asserção literal. A mudança de dificuldade está vinculada pelos gates e foi conferida na fonte; o teste de navegador não deve ser chamado de avaliação editorial de dificuldade.
- Paridade síncrona/assíncrona e comparação do catálogo com os próprios snapshots não substituem a comparação dos bytes históricos com a base publicada. Essa prova pertence ao plano operacional e à conferência da aplicação; os hashes congelados 16/110 continuam fornecendo proteção imutável específica.

Esses limites não reduzem o valor de regressão dos novos casos e não justificam testes adicionais que apenas copiem a implementação.

## Evidência de execução consultada

Li os encerramentos dos logs existentes: 542 testes de lógica e 9 de configuração passaram, total 551, sem falhas, skips ou cancelamentos. O log de coleta contém 108 cenários nas três specs, em computador e celular. Na última leitura, a execução nativa ainda estava em andamento e o JSON tinha 0 bytes; 108 coletados não foram contados como 108 aprovados. Nenhum teste foi executado por este revisor.

O diff está adequado ao escopo para revisão do PR. Registrar o resultado nativo final e a CI continua sendo etapa de fechamento, sem necessidade de repetir as execuções nesta auditoria. Os hashes dos cinco arquivos e do diff estão no JSON deste adendo.
