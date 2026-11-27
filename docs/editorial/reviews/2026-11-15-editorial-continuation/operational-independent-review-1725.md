# Revisão operacional independente — 17.25

**Resultado: APROVADA para a aplicação limitada aos quatro arquivos de dados do plano exato.** Este é um recibo técnico de integridade; não emite nova aprovação médica nem declara commit ou publicação concluídos. Não há bloqueio pendente dentro desse escopo.

Revisor: /root/editorial_inventory_1725, independente do autor do utilitário. Base ca1184916b53cddfc7581df17ed75ff3a029c14f/17.24. Utilitário SHA-256 d2c43e855fd6271f7c691d4fcdfe75b2ad1c043197651c5c3ed0b1e1b2634167. Bundle 439985a5eaf2f64e06814a6abedaf4032624920d598133dfa0e85ea8c9802e59. Plano sha256:150b809f6034f686136a3db454d4a9b52451970b0c1dad7478073dd1e53962eb. O JSON de mesmo nome atende ao contrato NQ_1725_OPERATIONAL_APPROVAL_v1 do utilitário.

## Vínculo dos gates

Conferidos oito objetos de questão e dois cards completos contra os literais e hashes das duas revisões independentes: Sodium A4, SHA 31b04dd9d5900decff2d8fcf49a261d43c06687e732ac2d0566a2e7873f6ce8f; SUSTAIN-6 A1, SHA da498ece30ea229f63d54c8d7b9fb685441c78d17ff15b90bbd40a3e3966e825. Os dez gates estão efetivamente disponíveis e derivam publicação liberada pelos quatro campos clínicos reais. Os envelopes autorais permanecem rascunhos; sua situação não substitui nem invalida o gate independente da versão exata.

O adapter usa caminhos fixos por questão. Preserva o formato real de auditoria A4 indexada por dez critérios, FSRS com valor PRESERVAR e cobertura 2013 indexada por doze campos; para SUSTAIN, usa as listas e booleanos reais. Os resultados do Advogado do Recurso foram lidos no relatório, sem inventar campo intermediário. Revisor, versão, gate e auditoria não podem ser substituídos por um trecho arbitrário de texto.

## Conferência independente do plano

Primeiro montei a projeção dos candidatos em memória com o catálogo e o helper reais, sem usar o planejador. Depois executei prepare() do utilitário final com todas as gravações de arquivos desabilitadas e comparei o resultado inteiro ao artefato de dry-run e ao seu hash. Os planos coincidem exatamente.

|Contrato|Resultado|
|---|---:|
|Questões correntes|741 preservadas|
|Autores alterados / intactos|8 / 733|
|Histórico|169→177|
|Vínculos antigos / novos conhecidos|676 / 32|
|Apresentações reais nos quatro modos|2964|
|Resets de FSRS|0|

As oito linhas alteradas são exatamente as permitidas; todas as demais linhas de topics permanecem byte a byte. A inserção no histórico preserva o prefixo original de 1.663.484 bytes e o sufixo de 164 bytes, totalizando os 1.663.648 bytes anteriores sem reserialização. Os oito novos registros arquivam a versão 17.24, não 17.25, com autores, fontes dos quatro perfis, cards anteriores e bindings. O manifesto novo é 17.25. Não se usa a versão de destino para rotular o conteúdo histórico.

SUSTAIN-6 mantém somente os consumidores 1a93346d e 516ec2a6; ambos recebem histórico e revisão. O card 2013 é adicionado para 21a99f07, d9257155 e e94a6488. Não há consumidor indireto esquecido desse card novo. Cards existentes fora de sustain6 permanecem integralmente iguais; nenhuma referência é fundida ou excluída. A única mudança de dificuldade é a4c85d32 hard→medium, explicitamente liberada; identidade e ordem do banco são preservadas.

## Controles adversariais e recuperação

Dez controles positivos aceitaram os oito audits de questão e as duas coberturas reais. Quatorze controles negativos rejeitaram: LIBERADA em campo errado; ausência de publicationAuthorization; revisão maior; evidência/pendência inválida ou decisiva; autor igual ao revisor; eliminatório disparado; reset FSRS; autoridade ausente; bytes alterados em cada relatório ou no bundle; e versão candidata diferente. Nenhum controle escreveu arquivos.

Em um sistema de arquivos exclusivamente virtual, injetei falha na terceira substituição. O código restaurou todos os buffers originais. Uma segunda simulação completou quatro substituições em memória; a repetição posterior foi recusada antes da primeira gravação por detectar fonte diferente da base. Esse teste não executou aplicação no repositório.

O código limita gravações aos quatro arquivos listados no JSON; fixa base, candidatos, reports, bundle, plano e bytes do recibo. Verifica novamente as fontes antes da escrita. A reexecução após uma aplicação completa é recusada e não acrescenta histórico repetido. A restauração é compensatória, não uma transação entre arquivos: encerramento abrupto ou falha da própria restauração exige recuperação manual. Isso está explicitado no utilitário e não é apresentado como garantia de atomicidade.

## Valor dos contratos e limites de liberação

Os dois contratos novos em tests/answers/answer-length-history.test.cjs têm valor de regressão: usam catálogo real, quatro perfis, 32 bindings e separação dos cards antigos/atuais. O RED informado por root antes da integração é coerente com a ausência da coorte 17.24, mas esta auditoria não o transforma em execução própria. Os contratos não demonstram navegação, escrita real, FSRS de um dispositivo ou preservação integral de bytes; as últimas garantias vieram da inspeção/projeção acima. Nenhum teste adicional que apenas copie a implementação foi criado.

Após a aplicação real, root ainda precisa rodar esses contratos e os validadores estruturais/editoriais, confirmar o diff real e usar os testes existentes de histórico/consumidores. O guard genérico de references no manifesto cobre adições/remoções por ID; a igualdade integral dos cards fora do escopo é garantida adicionalmente pelo utilitário.

Antes do commit, version.json, sw.js e index.html precisam estar em 17.25 no mesmo commit dos assets. O manifesto editorial real ainda precisa declarar exatamente todos os arquivos alterados, incluindo testes/docs e as duas operações de referência. A regra -text da pasta de revisão preserva os bytes pinados no Git. Essa etapa de fechamento não está incluída na autorização limitada de aplicar os quatro arquivos de dados. Qualquer alteração dos pins, fontes ou plano invalida este recibo.
