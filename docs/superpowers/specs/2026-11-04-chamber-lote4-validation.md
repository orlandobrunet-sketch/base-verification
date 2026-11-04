# Câmara — checkpoint dos lotes 3 e 4

Branch `codex/camara-imersao`, versão local16.66, ainda sem commit/push/publicação. PR929 e fila posterior preservados.

## Conteúdo

- Lote3: Liora (pH urinário contextual e causas renais hipocalêmicas), Brann (L-lactato e contexto das cartas), comandos de componentes em Galen/Helena/Ivar, Maelis (contexto neurológico) e fisiologia renal em Edrin. Revisão formal `2026-11-04-chamber-clinical-review-part3.md`.
- Lote4: interpretação de AG medido em Edrin; raciocínio do gap osmolar em Vorgath; cloreto/diuréticos em Mara e Isolde; sal/K/Mg em provável Gitelman; duração respiratória agora explícita em Helena/Ivar; PAP conforme contexto em Ivar; Nara descreve componente respiratório associado quando a PaCO2 ultrapassa a tolerância da compensação. Revisão formal `2026-11-04-chamber-clinical-review-part4.md`.
- Fontes específicas verificadas e vinculadas; IDs existentes reutilizados. Novos registros: Emmett2020 e ATS2019. Nenhum card compartilhado foi reescrito. A revisão formal delimita aprovação por recorte, sem declarar os100atos aprovados.

## Evidência automatizada

- Lote3:13contratos aprovados; regressão70pass/18skips previstos, sem falhas/retries;338testes de qualidade aprovados.
- Novos testes de domínio:3/3 aprovados. Partições determinantes de pH/compensação dos20geradores,40pares de AG/albumina de Edrin,37.107combinações independentes de Na/glicose/BUN/gap osmolar em Vorgath. Não significa enumerar o produto cartesiano de toda variável irrelevante nem permutações de cartas.
- Lote4: seis novos contratos reproduziram defeitos antes da correção (13pass/6fail). Após aplicação, um seletor do teste ainda procurava o ID antigo de uma carta reformulada; foi corrigido para exigir a existência e seleção do ID novo, mantendo as demais asserções. Resultado:22/22 testes de geradores/domínios aprovados.
- Regressão de interface pós-lote4:70pass/18skips previstos,0falhas/retries,6,7min, em desktop/mobile; inclui os20casos completos nos dois projetos. `chamber-integral-lote4.log`.
- Qualidade pós-lote4 e correção técnica abaixo:347/347 aprovados, sem exclusões. `chamber-quality-lote4.log`.
- Manifesto regenerado para16.66:741questões/2964perfis, todos os digests compatíveis com helper real. Bump/check16.66 e `git diff --check` aprovados. Nenhuma alteração no banco principal `data/topics.js`.

## Falha técnica de referências reproduzida e corrigida

`194-chamber-source-recovery.spec.ts` exercita erro de rede com repetição no resumo, volta a ato anterior enquanto a resposta está pendente e fechamento durante a carga. Primeiro harness foi corrigido para registrar interceptação antes da navegação e para selecionar a aba Referências desktop; testes não presumem `refsDB` como propriedade de `window` (é lexical global).

Defeito real reproduzido em desktop/mobile: resposta atrasada substituía ato revisitado pelo resumo e salvava conclusão. Correção prende o resultado à view de origem ainda conectada. Fechar durante a carga já não salvava e foi preservado. Acrescentados botão de tentar fontes novamente, estado de carregamento, retorno à aba de referências e prevenção de rastreamento repetido da conclusão. Red do botão ausente confirmado isoladamente; após patch6/6 aprovados,0retries,36,7s (`chamber-source-green.log`). Nenhum teste existente foi enfraquecido.

## Ainda não é conclusão integral

Matriz visual concluída:9fluxos/27capturas em1159×684,1100×900 com fonte32 ePixel7;0errosJS/overflow/perda de texto. Shards conferidos serialmente:2708casos em6partes, sem ausentes/duplicações/extras. Faltam consolidar a auditoria clínica dos recortes restantes dos100atos e referências de todos os casos. Inspeções identificaram novos candidatos a revisão, ainda sem patch: Borius (segurança da hipercalemia, suspensão temporária/contextual de fármacos), Theron (resposta tampão aguda versus renal e PaO2 numérica não apresentada), Kael (não atribuir opioide confirmado à poção não caracterizada). Não publicar o pacote nem inferir aprovação destes pontos.
