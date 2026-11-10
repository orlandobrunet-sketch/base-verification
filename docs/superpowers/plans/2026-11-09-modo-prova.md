# Modo Prova Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Configurar quantidade/tempo e reter correção até a conclusão, preservando progresso e versões.
**Architecture:** Manter js/exam.js e seus guardas de armazenamento/revisão. Centralizar leitura da duração validada; separar apresentação neutra da revisão final. CSS dedicado ao examPage respeita os controles compartilhados do Ritual.
**Tech Stack:** JavaScript vanilla,CSS,Playwright,fixtures técnicas existentes.
**Spec:** docs/superpowers/specs/2026-11-09-modo-prova-design.md

## Global Constraints

- Defaults60questões/90min;minutos1-240;quantidade1..banco disponível. Retenção ativa=max(2h,duração); prazo absoluto sem pausas.
- Sem alteração médica,de vídeos,de nota ou de descarte antecipado.
- Legados sem duração90min;campos inválidos preservados;retomada de consulta não regrava defaults.
- Nenhum gabarito,explicação ou revisão atual corrigida no DOM antes do fim.
- Bump16.95 e busters no mesmo commit dos assets (ampliação posterior para quatro horas).

## Review Focus

- Duração válida no limite do prazo e em relógio negativo: não aceitar resposta expirada.
- Save de outra aba/proprietário: preservar concorrência e compensação existentes.
- Última resposta histórica retomada: resultado consultável sem apagar registro.
- Configuração inválida/rede falha: nenhuma tentativa/relógio parcial;campos mantidos.
- Fonte ampliada e teclado em controles: não disparar atalhos ao editar números.

### Task1: Configuração e duração persistida

Files: js/exam.js;tests/specs/225-exam-config-final-review.spec.ts.
Interfaces: _examDuration(saved) retorna duração válida/defaultlegado ou null;_examValidateSaved devolve durationSec/questionCount validados;save/load/timer usam os mesmos campos.
- [x] Escrever testes escolha2questões/3min,reloadmesma duração,legado90,config0/fracionada/quantidadeexcessiva/duração121 e save inválido preservado.
- [x] Executar RED com retries0,manter logs.
- [x] Implementar campos e validação,preservar padrão e erros sem iniciar prova.
- [x] Executar cenários e verificar GREEN.

### Task2: Resposta neutra e revisão final

Files: js/exam.js;spec225;spec70;spec135;spec136;spec138.
Interfaces: showExamQuestion nunca revela avaliação;_examRevisionHtml(view,answered,review=false);showExamResults só em fim/expiração;_examNext mantém resultado somente leitura quando apropriado.
- [x] RED para ausência de explicação/correção após acerto/erro/reload,até resultado;revisão correta e erro final;recusa de resultado prematuro;deadline e histórico.
- [x] Implementar apresentação neutra,proteções e revisão final.
- [x] Mover expectativas antigas de correção imediata para fim mantendo identidade,gabarito,texto histórico,raw e zero writes. Sem enfraquecer verificações de fonte/nota.
- [x] GREEN dos novos testes e regressões exam/history pertinentes.

### Task3: Layout e validação

Files: styles/lumen/exam.css novo,index.html,jogar/index.html,sw.js,version.json,manifesto de release apenas.
Interfaces: estilos somente #examPage;mesmos hooks de ação/ids existentes.
- [x] Acrescentar testes de configuração/pergunta/resultado em320/390/1280,font16/32,foco,contraste e alvos44px.
- [x] Implementar direção visual da spec e busters/bumpoficial16.94.
- [x] Executar testes pertinentes,check de release,syntax/diff;capturar e criticar screenshots. Revisão independente final do diff e dos riscos citados.
- [ ] Commit/push e PRrascunho para CI completa;somente HEAD integralmente validado poderá ser proposto para integração/publicação. Não inferir publicação de conteúdo clínico.

### Task4: Multiplicador de sequência, pedido posterior

Files:js/game.js;tests/specs/226-streak-multiplier-display.spec.ts.
Interface:renderHUD apenas apresenta o retorno existente de getStreakMultiplier.
- [x] RED0acertos:esperado vazio,recebido×1;streak-display-red.
- [x] Ocultar elemento/texto se mult<=1;formatar retorno com toLocaleString('pt-BR') se>1.
- [x] GREEN ambos projetos,limiares0/1/2/3/5/7/10/15,reset por erro;exam-config-streak-green36/36 inclui estes2cenários.
- [ ] Regressão do216,revisão final e CI do mesmo lote16.94.

## Evidência de execução

88cenários finais de duração,conclusão,retomada,histórico e layout aprovados sem retries(exam-completion-final-green).104cenários da passagem anterior concluídos em55registrados+49retomados após interrupção do processo,sem apagar artefatos.78cenários anteriores70/135/138/216 aprovados. Multiplicador testado em ambos projetos nos limiares e reset. Revisão independente estática sem findings bloqueantes no diff inicial;correções posteriores de início duplicado,inputs e tempo de conclusão verificadas por RED→GREEN. Release/syntax/diff checks aprovados. CI completa ainda necessária antes de integrar.
