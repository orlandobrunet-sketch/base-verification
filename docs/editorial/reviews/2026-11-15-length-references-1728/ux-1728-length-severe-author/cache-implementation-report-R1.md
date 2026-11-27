# Cache e integridade — revisão técnica

Corrigido o primeiro carregamento de dados17.28 sob o Service Worker17.27. O worker publicado foi reproduzido sem alteração; antes, devolvia manifesto/histórico/tópicos/referências antigos sem rede. Agora a consulta release atravessa esse cache; o worker atual preserva o funcionamento offline e não recarrega sessões ativas.

O gerador de release acompanha URLs lazy, offline e manifesto, atualiza o buster do loader e rejeita URLs antigas de dados alterados. Dados não alterados conservam seus busters.

- 35/35 testes de Service Worker e 159/159 testes de catálogo/revisões passaram.
- Sintaxe, git diff --check e bump --check passaram.
- 181 registros publicados, 741 posições e 353 IDs originais permanecem autenticados.
- Duas brechas reproduzidas do guard histórico foram encaminhadas ao agente responsável; não foram ocultadas.

Os hashes exatos, arquivos, logs e limites estão no receipt JSON. Não é aprovação médica. O pacote final ainda precisa da cópia atualizada do ledger, revisão dos guards, bateria completa e validação de publicação coordenadas pelo root.
