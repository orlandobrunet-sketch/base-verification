# Alternativas e referências — primeiro lote 17.10

## Escopo autorizado e resultado

O proprietário reabriu a revisão médica em 13/11/2026 para corrigir a pista de gabaritos sistematicamente mais longos, com precisão científica e revisão independente. Este lote altera 107 das 741 questões e mantém seus IDs e o conceito correto. Não é encerramento da revisão geral.

| Grupo | Questões alteradas | Revisão independente exata |
|---|---:|---|
| Doença renal policística autossômica dominante |17|[A4](adpkd-independent-gates-A4.json)|
| Nefrite lúpica |16|[A3](lupus-independent-gates-A3.json)|
| Anemia |21|[A2](anemia-independent-gates-A2.json)|
| Vasculites ANCA |12|[A2](anca-independent-gates-A2.json)|
| Finerenona |8|[A4](finerenone-independent-gates-A4.json)|
| Distúrbio mineral e ósseo |22|[A4](mbd-independent-gates-A4.json)|
| Membrana peritoneal |5|[A1](dp-membrane-independent-gates-A1.json)|
| Infecções em diálise peritoneal |6|[A2-root](dp-infection-independent-gates-A2-root.json)|

O texto não foi cortado por uma fórmula de tamanho. Cada versão recebeu classificação independente do objetivo pedagógico e dificuldade, verificação de afirmações decisivas, julgamento dos distratores, Advogado do Recurso, eliminatórios, dez dimensões de score e derivação dos três eixos. As revisões podem redistribuir informação relevante entre enunciado, opções e explicação, sem remover condições de segurança. Distratores devem representar erros plausíveis; não foram alongados apenas para empatar. Mudanças de dificuldade intrínseca têm reconciliação individual; não alteram o motor adaptativo ou votos empíricos.

## Medição, não meta clínica

Com espaços normalizados e caracteres Unicode, a correta era a única mais longa em 100 das 107 questões alteradas; passa a 21. Permanecer mais longa não reprova uma questão. No banco inteiro, o total cai de598 para 519 de 741; a regra mecânica “escolher a mais longa”, com divisão uniforme dos empates, cai de 81,47% para 71,26%. Continuam 194 questões com correta pelo menos 1,5 vezes o maior distrator. Estes números medem pistas de redação, não acertos de pessoas, e não aprovam conteúdo clínico. A discrepância global permanece aberta.

O [snapshot 107](snapshot-107.json) fixa os oito pacotes, hashes e medições. A [conferência da integração](integration-1710.json) compara a cópia com os gates e com o commit publicado17.09. As versões preliminares rejeitadas não foram aplicadas.

## Referências e preservação do histórico

Seis cards correntes recebem os objetos completos aprovados: anemia KDIGO, RAVE, FIGARO, bula DailyMed e dois de DMO-DRC (quelantes e EVOLVE). Três cards novos têm consumidores efetivos e aprovação integral. DCOR e FIDELITY perdem o último vínculo com a revisão dos objetivos dos respectivos itens; são aposentados apenas do catálogo corrente por [proposta R1](reference-retirement-overlay-R1.json) e [contraprova independente](reference-retirement-independent-gate-R1-root.json). A versão corrigida de DCOR continua documentada no gate, sem vínculo artificial para mantê-la na vitrine.

O NQ Editorial Score aplica-se à questão. O [adendo dos cards](mbd-card-score-applicability-addendum-R1.json) registra NÃO APLICÁVEL/null para os valores auxiliares indevidamente rotulados no gate MBD, sem mudar seus payloads clínicos. Uma aprovação de card não aprova os itens consumidores.

O histórico acrescenta 110 registros exatamente como publicados 17.09, incluindo os três consumidores de card que não foram reescritos:061c9bcb,1e6a4479 e22189222. Todos os 440 perfis (campanha, Prova, Estudo e offline) resolvem o texto, respostas, referências completas e política anterior de atualização explícita. Treze perfis com a mesma pergunta e cards diferentes ficam ambíguos sem binding; não se presume qual resumo foi visto. Os 16 registros históricos anteriores permanecem intactos. Os 2.964 digests correntes foram conferidos pelo apresentador real de alternativas. Avaliações antigas não se tornam avaliações da nova redação; o agendamento FSRS é preservado pela identidade pedagógica, conforme §18.5.

## Retidos, inalterados e limites

Revisados sem alteração:04cb2429,86949ab7,547a3dc2. Retidos para alteração/nova publicação:061c9bcb,1e6a4479,13e53210,5906012f,21e9cefb,22189222. Seus objetos permanecem idênticos; não se contam como107 novas aprovações. As destinações de fundir, redirecionar e aposentar exigem trabalho próprio; não se troca silenciosamente o objetivo sob o mesmo qid. Outros candidatos, inclusive gruposDP posteriores ao snapshot, ficam fora desta entrega.

Os relatórios registram acesso real e limitações por fonte. Não se declara leitura integral quando houve apenas resumo; referências secundárias não decisivas têm pendência explícita e derivação própria. Os dois casos de anemia PARCIALMENTE VERIFICADA/NÃO DECISIVA não foram renomeados VERIFICADA; os fatos decisivos foram conferidos nas fontes registradas. Demais pendências e a fila residual continuam nos relatórios de grupo.

A revisão adicional Greptile foi recusada pelo controle automático por transmitir código a SaaS externo sem autorização específica. Não houve envio nem tentativa indireta. O fallback foi revisão independente dos pacotes, contraprova da integração e verificações locais. A bateria automatizada e a conferência após publicação ficam registradas no PR desta entrega; até sua conclusão, 17.10 permanece candidata.

## Validação

Conferência determinística:87 arquivos do snapshot verificados; 107 objetos exatos, quatro alternativas, IDs e gabaritos preservados; todos os vínculos existentes; overlay de duas aposentadorias exato; 110 registros anteriores e 440 perfis conhecidos; 13 ambiguidades sem adivinhação; 2.964 apresentações correntes verificadas. Lógica e regras editoriais: 190 aprovações, sem falhas finais. Dezoito percursos relacionados passaram na primeira rodada; os seis cenários novos de consulta histórica/bloqueio passaram na rodada seguinte, e os dois de confirmação pendente passaram após corrigir o teste. A verificação inicial confundia a apresentação restaurada (com ordem aleatória e metadata) com o objeto autoral e depois omitia o clique nativo em “Ver resultado”; nenhum reparo do produto foi necessário. As cinco falhas iniciais de criação de Git temporário eram permissões do ambiente e passaram com a execução apropriada. Logs iniciais foram preservados. A contraprova independente da integração está no [relatório R1](integration-1710-independent-review-R1.json); o adendo R2 do teste final fica no PR, evitando ciclo de hashes de autorreferência. Os oito novos cenários usam Guest e saves sintéticos baseados no histórico publicado, sem substituir funções ou bancos do produto e com serviços externos bloqueados. Os relacionados incluem suas próprias falhas de fronteira deliberadas, descritas nas specs137/138. CI completa e publicação ainda pendentes. Aparelhos físicos e sessões reais de clientes ficam fora dessa evidência.

Os pareceres e originais deste pacote têm bytes preservados por regra específica em `.gitattributes`, inclusive quebras de linha e espaços originais. Os hashes raw do snapshot descrevem os arquivos de origem da autoria; o Git mantém sua normalização usual em `data/topics.js`/`data/refs.js`. Os objetos canônicos e gates não mudam com essa representação. A conferência de publicação compara os blobs efetivos do commit.
