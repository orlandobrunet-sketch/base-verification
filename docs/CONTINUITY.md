# Continuidade do NefroQuest

A etapa atual separa a apresentação embaralhada das alternativas da revisão clínica do banco. A branch é `codex/answer-shuffle-2026-10-12`, criada sobre o merge `25f44e4449e770314c94f9a59256dfc2e1ab4d17` da versão 16.07. A candidata técnica atual é 16.09. Consulte `version.json` e o HEAD baixado para identificar a versão e o commit deste checkout.

O embaralhamento usa identidades autorais e uma permutação guardada com a questão. Respostas, retomadas, recargas, provas antigas e revisão de erros preservam essa relação. Referências à ordem ou a letras mantêm a ordem original; V/F, respostas numéricas e cartões têm contratos próprios. A Câmara MC faz parte da cobertura. A mudança técnica preserva o texto clínico e o viés de comprimento permanece pendente.

O núcleo tem testes determinísticos de todas as permutações, identidade, snapshots inválidos e distribuição, sem um balanceador de posições previsível. Os testes de campanha e modos verificam respostas, recursos, legado, recarga e recusa de gravação. A CI da branch executa Quality, Smoke e Full em quatro shards. Consulte os resultados do commit exato no GitHub Actions antes de reutilizar uma aprovação.

Na validação local deste checkpoint, passaram 209 testes Node, 62 cenários de navegador de modos/regressões e mais 124 cenários da suíte de reparo em desktop/móvel, sem falhas ou retries nas execuções finais. A CI também inclui os testes Deno e a suíte Full; seu resultado oficial deve ser conferido para o HEAD baixado. As fixtures Node antigas foram atualizadas para carregar as dependências reais de apresentação e persistência, preservando as assertivas.

A candidata 16.08 não foi publicada: a [CI929](https://github.com/orlandobrunet-sketch/base-verification/actions/runs/38289888559) falhou. A 16.09 corrige a tentativa de persistir dentro da prévia isolada de chefes e atualiza dois testes para a identidade autoral e para snapshots coerentes, mantendo as recusas de gravação e as assertivas de isolamento. O [PR896](https://github.com/orlandobrunet-sketch/base-verification/pull/896) reúne o embaralhamento e os reparos; use somente a CI do HEAD final.

Neste checkpoint, foram revisadas 96 de 741 questões principais; 645 ainda não foram revisadas. As propostas permanecem separadas do banco publicado.

A revisão clínica avança em lotes rastreáveis, priorizando as corretas exclusivamente mais longas e as dependências de letras. Um lote revisado não aprova o restante do banco. Propostas, pendências, fontes e a fila completa estão em `docs/editorial/reviews/2026-10-12/`; consulte seu `index.json` para a cobertura exata. Nenhum item bloqueado pode ser aplicado a `data/topics.js`; mudanças materiais exigem novo parecer, conforme `AGENTS.md` e `.claude/skills/revisar-nefroquest/SKILL.md`.

No outro computador, instale as dependências a partir de `tests/package-lock.json` e o Chromium do Playwright. Ative os hooks com `git config core.hooksPath .githooks`. Use um servidor estático local e um Python funcional desse computador quando necessário. Os testes técnicos usam fixtures e backend simulado; operações reais de conta, pagamentos e nuvem dependem do projeto e dos segredos configurados nos serviços, que não devem ser copiados para o Git.

Próximos passos clínicos: resolver a compatibilidade entre revisões autorais e snapshots históricos antes de aplicar AFTERs; reconciliar cards novos e divergências de taxonomia; integrar apenas versões clínicas liberadas e continuar os itens ainda não revisados. A publicação técnica depende da CI aprovada para o HEAD exato e do deploy correspondente. Recompensa vitalícia Hardcore com validação confiável no servidor, membros honorários e Meus troféus ficam depois das questões.
