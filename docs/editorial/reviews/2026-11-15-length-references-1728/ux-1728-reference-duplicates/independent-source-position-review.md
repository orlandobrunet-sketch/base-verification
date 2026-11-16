# Posições estáveis das questões — revisão independente

**Resultado: aprovado, com dependência de carregamento documentada.** Nenhum achado bloqueador no caminho normal.

Snapshot de 732 questões. Os 741 IDs originais de 17.27 aparecem na ordem exata; a questão nova 40c5f770 ocupa somente a posição acrescentada ao final. Não há IDs duplicados ou atuais sem posição registrada.

A função nativa `buildDeck` foi executada em ambiente isolado e comparada, questão por questão, com o construtor do manifesto. Os quatro perfis correspondem ao manifesto atual. Nas questões sem mudança autoral, o dano continua igual ao de 17.27. Quatro projeções com remoções e reordenação mantêm o mesmo conteúdo de cada ID.

O catálogo real foi criado com os 732 itens e aceitou o conjunto. Na contraprova sem o registro de posições, quatro conteúdos de Jornada/Prova divergiram e o catálogo real rejeitou o conjunto com `TypeError: Runtime source differs from published manifest.` A dependência falha de forma fechada; um aviso de carregamento mais específico seria apenas melhoria de diagnóstico.

A ordem dos arquivos da página e a inclusão no cache foram conferidas. Os arquivos do snapshot permaneceram inalterados durante a execução. O JSON registra seus hashes e os quatro IDs da contraprova.

Não houve execução de cenários de navegador nesta revisão, conforme orientação do coordenador enquanto os dados médicos mudavam. Não houve escrita de código de produção pelo revisor. Esta conclusão é técnica e não substitui aprovação médica das questões.

Prova reproduzível: `review-source-positions.cjs`. Relatório congelado: `independent-source-position-review.json`, SHA-256 de bytes `c3cabf0c58943d9a76fa7da947e22f8b9f71566e50cc4a4d0a5e7dfdf88ae439`.
