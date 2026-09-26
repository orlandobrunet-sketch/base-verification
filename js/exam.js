// NefroQuest — Exam Mode (Simulado)
// Plain script — shares global scope with game.js
//
// O Simulado era uma camada fixa por cima do jogo. A jornada continuava
// visível para o teclado: apertar "2" durante a prova respondia a questão da
// campanha escondida atrás. Retomar e encerrar usavam `confirm()` nativo, o
// tempo esgotado fora do app apagava a prova sem aviso, e a correção de cada
// alternativa era só cor.
//
// Agora é uma página: a jornada fica escondida e inerte, a prova tem o próprio
// teclado, início e retomada são escolhas na página, a correção diz em texto
// qual era a certa e qual foi a sua, e o resultado conta as não respondidas.

    const EXAM_QUESTION_COUNT = 60;
    const EXAM_DURATION_SEC   = 90 * 60; // 90 minutos
    const EXAM_SAVE_KEY = 'nefroquest-exam-state';
    const EXAM_TTL_MS   = 2 * 60 * 60 * 1000; // 2 horas

    let _examState = null; // {questions, idx, answers, startTime, timerInterval, tempoEsgotado}
    let _examOrigem = null;
    let _examConfirmandoSaida = false;

    function _saveExamState() {
      if (!_examState) return;
      try {
        const { questions, idx, answers, startTime } = _examState;
        localStorage.setItem(EXAM_SAVE_KEY, JSON.stringify({ questions, idx, answers, startTime, savedAt: Date.now() }));
      } catch(e) { console.error('[NQ] _saveExamState failed', e); }
    }

    /* Prova salva: `null` se não há ou se ficou velha demais; `expirada` se o
     * tempo acabou enquanto a pessoa estava fora — nesse caso ela vê o
     * resultado do que respondeu, em vez de a prova sumir sem explicação. */
    function _loadExamState() {
      try {
        const raw = localStorage.getItem(EXAM_SAVE_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s?.startTime || !s?.questions?.length) return null;
        if (Date.now() - s.savedAt > EXAM_TTL_MS) { localStorage.removeItem(EXAM_SAVE_KEY); return null; }
        const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
        return { ...s, expirada: elapsed >= EXAM_DURATION_SEC };
      } catch(e) { return null; }
    }

    function _clearExamState() {
      try { localStorage.removeItem(EXAM_SAVE_KEY); } catch(e) {}
    }

    const _examRestante = () => Math.max(0, EXAM_DURATION_SEC - Math.floor((Date.now() - _examState.startTime) / 1000));
    const _examRelogio = seg => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;

    // ── Superfície ────────────────────────────────────────────────────────
    function _examPagina() {
      let pagina = document.getElementById('examPage');
      if (pagina) return pagina;
      _examOrigem = {
        foco: document.activeElement,
        scroll: window.scrollY,
        elementos: [...document.querySelectorAll('#mainApp, #welcomeScreen')].map(el => ({ el, hidden: el.classList.contains('hidden'), inert: el.inert })),
      };
      // A jornada sai de cena de verdade: escondida e inerte, fora do alcance
      // do teclado e dos atalhos de resposta.
      _examOrigem.elementos.forEach(({ el }) => { el.classList.add('hidden'); el.inert = true; });
      pagina = document.createElement('section');
      pagina.id = 'examPage';
      pagina.className = 'nq-study-surface nq-exam';
      pagina.setAttribute('role', 'main');
      pagina.setAttribute('aria-label', 'Prova simulada');
      pagina.addEventListener('keydown', _examTeclado);
      // Foco perdido (no body) não pode devolver o teclado à jornada.
      document.addEventListener('keydown', _examTecladoForaDaPagina, true);
      document.body.appendChild(pagina);
      document.body.classList.add('nq-studying');
      window.scrollTo(0, 0);
      return pagina;
    }

    function _examTeclado(e) {
      // A prova tem o próprio contexto de teclado; atalhos da jornada não passam.
      e.stopPropagation();
      if (e.key === 'Escape' && _examConfirmandoSaida) { e.preventDefault(); _examCancelarSaida(); return; }
      const alvo = e.target;
      if (alvo instanceof Element && alvo.closest('button, a[href], summary, input, textarea')) return;
      if (!_examState || _examConfirmandoSaida || document.getElementById('examResultado')) return;
      const indice = { A: 0, B: 1, C: 2, D: 3, 1: 0, 2: 1, 3: 2, 4: 3 }[e.key.toUpperCase()];
      if (indice === undefined || _examState.answers[_examState.idx]) return;
      const botao = document.querySelectorAll('#examOpts button')[indice];
      if (botao && !botao.disabled) { e.preventDefault(); botao.click(); }
    }

    function _examTecladoForaDaPagina(e) {
      const pagina = document.getElementById('examPage');
      if (!pagina || pagina.contains(e.target)) return;
      _examTeclado(e);
    }

    function _examFechar() {
      document.removeEventListener('keydown', _examTecladoForaDaPagina, true);
      if (_examState?.timerInterval) clearInterval(_examState.timerInterval);
      _examState = null;
      _examConfirmandoSaida = false;
      document.getElementById('examPage')?.remove();
      document.body.classList.remove('nq-studying');
      document.getElementById('mobileStatusBar')?.classList.remove('active');
      const origem = _examOrigem;
      _examOrigem = null;
      if (origem) {
        origem.elementos.forEach(({ el, hidden, inert }) => { el.classList.toggle('hidden', hidden); el.inert = inert; });
        window.scrollTo(0, origem.scroll);
      }
      const boasVindas = document.getElementById('welcomeScreen');
      if (boasVindas && !boasVindas.classList.contains('hidden')) {
        refreshWelcomeSave();
        if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
      }
      const volta = origem?.foco?.isConnected && origem.foco.offsetParent !== null ? origem.foco : null;
      volta?.focus({ preventScroll: true });
    }

    function _examFocar(seletor) {
      document.querySelector(seletor)?.focus({ preventScroll: true });
    }

    // ── Início e retomada ─────────────────────────────────────────────────
    async function startExamMode() {
      const pagina = _examPagina();
      if (_examState) { _examIniciarRelogio(); showExamQuestion(); return; }

      const saved = _loadExamState();
      if (saved?.expirada) {
        _examState = { questions: saved.questions, idx: saved.idx, answers: saved.answers, startTime: saved.startTime, timerInterval: null };
        _examEsgotarTempo();
        return;
      }
      if (saved) {
        const respondidas = saved.answers.filter(a => a?.answered).length;
        const restante = EXAM_DURATION_SEC - Math.floor((Date.now() - saved.startTime) / 1000);
        pagina.innerHTML = `
          <div class="nq-study-content nq-exam-intro">
            <h1 id="examTitulo" tabindex="-1">Prova em andamento</h1>
            <p>Você respondeu ${respondidas} de ${saved.questions.length} questões e restam ${Math.floor(restante / 60)} minutos. O relógio continuou contando enquanto você esteve fora.</p>
            <div class="nq-exam-acoes">
              <button type="button" class="btn gold" data-action="_examRetomar">Retomar prova</button>
              <button type="button" class="btn sec" data-action="_examDescartarSalva">Descartar e começar outra</button>
              <button type="button" class="btn sec" data-action="_examFechar">Voltar</button>
            </div>
          </div>`;
        _examFocar('#examTitulo');
        return;
      }
      _examIntro();
    }

    function _examIntro(erro = '') {
      const pagina = _examPagina();
      pagina.innerHTML = `
        <div class="nq-study-content nq-exam-intro">
          <h1 id="examTitulo" tabindex="-1">Prova simulada</h1>
          <p>${EXAM_QUESTION_COUNT} questões sorteadas do banco, ${EXAM_DURATION_SEC / 60} minutos. Depois de cada resposta, você vê a correção e a explicação.</p>
          <p>O relógio começa quando você clicar em "Começar prova" e continua contando se você sair. Uma prova interrompida pode ser retomada por até duas horas.</p>
          ${erro ? `<p class="nq-exam-erro" role="alert">${erro}</p>` : ''}
          <div class="nq-exam-acoes">
            <button type="button" class="btn gold" data-action="_examComecar">Começar prova</button>
            <button type="button" class="btn sec" data-action="_examFechar">Voltar</button>
          </div>
        </div>`;
      _examFocar(erro ? '[data-action="_examComecar"]' : '#examTitulo');
    }

    async function _examComecar() {
      const botao = document.querySelector('[data-action="_examComecar"]');
      if (botao) { botao.disabled = true; botao.textContent = 'Carregando questões…'; }
      try {
        if (!questionBank) await _loadTopics();
      } catch (e) {
        _examIntro('Não foi possível carregar as questões. Verifique a conexão e tente de novo.');
        return;
      }
      if (!document.getElementById('examPage')) return;
      _examState = {
        questions: shuffle([...questionBank]).slice(0, EXAM_QUESTION_COUNT),
        idx: 0,
        answers: [],   // {qId, correct, cat, chosen, answered}
        startTime: Date.now(),
        timerInterval: null
      };
      _saveExamState();
      _examIniciarRelogio();
      showExamQuestion();
    }

    function _examRetomar() {
      const saved = _loadExamState();
      if (!saved) { _examIntro(); return; }
      _examState = { questions: saved.questions, idx: saved.idx, answers: saved.answers, startTime: saved.startTime, timerInterval: null };
      if (saved.expirada) { _examEsgotarTempo(); return; }
      _examIniciarRelogio();
      showExamQuestion();
    }

    function _examDescartarSalva() {
      _clearExamState();
      _examIntro();
    }

    // ── Relógio ───────────────────────────────────────────────────────────
    function _examIniciarRelogio() {
      if (_examState.timerInterval) clearInterval(_examState.timerInterval);
      _examState.timerInterval = setInterval(_updateExamTimer, 1000);
    }

    function _examEsgotarTempo() {
      if (_examState.timerInterval) clearInterval(_examState.timerInterval);
      _examState.tempoEsgotado = true;
      // As questões que faltaram contam como não respondidas.
      for (let i = 0; i < _examState.questions.length; i++) {
        if (!_examState.answers[i]) {
          const q = _examState.questions[i];
          _examState.answers[i] = { qId: q.id, correct: false, cat: q.c || 'geral', answered: false };
        }
      }
      _clearExamState();
      showExamResults();
    }

    function _updateExamTimer() {
      if (!_examState || document.getElementById('examResultado')) return;
      const restante = _examRestante();
      if (restante <= 0) { _examEsgotarTempo(); return; }
      const el = document.getElementById('examTimer');
      if (!el) return;
      el.textContent = `${_examRelogio(restante)} restantes`;
      el.classList.toggle('nq-exam-urgente', restante < 600);
    }

    // ── Questão ───────────────────────────────────────────────────────────
    function showExamQuestion() {
      const pagina = document.getElementById('examPage') || _examPagina();
      const { questions, idx, answers } = _examState;
      if (idx >= questions.length) { showExamResults(); return; }
      const q = questions[idx];
      const resposta = answers[idx];
      const restante = _examRestante();
      const letras = ['A', 'B', 'C', 'D', 'E'];

      pagina.innerHTML = `
        <div class="nq-study-content">
          <header class="nq-exam-cabecalho">
            <p class="nq-exam-titulo">Prova simulada</p>
            <p id="examTimer" class="nq-exam-relogio${restante < 600 ? ' nq-exam-urgente' : ''}" aria-label="Tempo restante">${_examRelogio(restante)} restantes</p>
            <div class="nq-exam-progresso" role="progressbar" aria-label="Progresso da prova" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${idx}">
              <div style="width:${(idx / questions.length * 100).toFixed(1)}%"></div>
            </div>
          </header>
          <article class="nq-exam-questao">
            <h1 id="examQuestaoTitulo" tabindex="-1">Questão ${idx + 1} de ${questions.length}</h1>
            <p class="nq-exam-enunciado">${escapeHtml(q.q)}</p>
            ${resposta ? `
            <ol id="examOpts" class="nq-exam-opcoes" aria-label="Alternativas corrigidas">
              ${q.o.map((opt, i) => {
                let marca = '', estado = '';
                if (i === q.a) { estado = 'certa'; marca = i === resposta.chosen ? 'Sua resposta — correta' : 'Resposta correta'; }
                else if (i === resposta.chosen) { estado = 'errada'; marca = 'Sua resposta'; }
                return `<li class="nq-exam-opcao${estado ? ' nq-exam-opcao-' + estado : ' nq-exam-opcao-neutra'}">
                  <span class="nq-exam-letra" aria-hidden="true">${letras[i]}</span>
                  <span>${escapeHtml(opt)}${marca ? `<strong class="nq-exam-marca">${marca}</strong>` : ''}</span>
                </li>`;
              }).join('')}
            </ol>` : `
            <div id="examOpts" class="nq-exam-opcoes">
              ${q.o.map((opt, i) => `<button type="button" class="nq-exam-opcao" data-action="_examAnswer" data-arg="${i}" data-arg-type="number">
                  <span class="nq-exam-letra" aria-hidden="true">${letras[i]}</span>
                  <span>${escapeHtml(opt)}</span>
                </button>`).join('')}
            </div>`}
            <div id="examCorrecao" role="status" aria-live="polite" tabindex="-1">
              ${resposta ? `
                <div class="nq-exam-correcao ${resposta.correct ? 'nq-exam-acertou' : 'nq-exam-errou'}">
                  <p class="nq-exam-veredito">${resposta.correct ? 'Correto.' : `Incorreto. A resposta certa é a ${letras[q.a]}.`}</p>
                  <p>${escapeHtml(q.e)}</p>
                </div>
                <button type="button" class="btn gold" data-action="_examNext">${idx + 1 < questions.length ? 'Próxima questão' : 'Ver resultado'}</button>` : ''}
            </div>
          </article>
          <footer class="nq-exam-rodape" id="examRodape">${_examRodapeHtml()}</footer>
        </div>`;
    }

    function _examRodapeHtml() {
      if (_examConfirmandoSaida) return `
        <div class="nq-exam-confirmar" role="group" aria-labelledby="examSairTitulo">
          <p id="examSairTitulo">Encerrar a prova agora? As respostas desta prova serão descartadas e ela não poderá ser retomada.</p>
          <div class="nq-exam-acoes">
            <button type="button" class="btn sec" data-action="_examCancelarSaida">Continuar a prova</button>
            <button type="button" class="btn nq-exam-perigo" data-action="_examConfirmarSaida">Encerrar e descartar</button>
          </div>
        </div>`;
      return `
        <div class="nq-exam-acoes">
          <button type="button" class="btn sec" data-action="_examSairDepois">Sair e continuar depois</button>
          <button type="button" class="btn sec" data-action="_exitExam">Encerrar prova</button>
        </div>
        <p class="nq-exam-nota">Ao sair, o relógio continua contando.</p>`;
    }

    function _examAnswer(chosen) {
      if (!_examState || _examState.answers[_examState.idx]) return;
      const { questions, idx } = _examState;
      const q = questions[idx];
      const correct = chosen === q.a;
      _examState.answers[idx] = { qId: q.id, correct, cat: q.c || 'geral', chosen, answered: true };
      if (typeof trackQuestionAnswer === 'function') {
        trackQuestionAnswer(q, correct, 0);
      }
      _saveExamState();
      showExamQuestion();
      _examFocar('#examCorrecao');
    }

    function _examNext() {
      _examState.idx++;
      _saveExamState();
      if (_examState.idx >= _examState.questions.length) { showExamResults(); }
      else { showExamQuestion(); _examFocar('#examQuestaoTitulo'); }
    }

    // ── Saída ─────────────────────────────────────────────────────────────
    function _exitExam() {
      _examConfirmandoSaida = true;
      document.getElementById('examRodape').innerHTML = _examRodapeHtml();
      _examFocar('[data-action="_examCancelarSaida"]');
    }

    function _examCancelarSaida() {
      _examConfirmandoSaida = false;
      document.getElementById('examRodape').innerHTML = _examRodapeHtml();
      _examFocar('[data-action="_exitExam"]');
    }

    function _examConfirmarSaida() {
      _clearExamState();
      _examFechar();
    }

    function _examSairDepois() {
      _saveExamState();
      _examFechar();
    }

    // ── Resultado ─────────────────────────────────────────────────────────
    function showExamResults() {
      if (_examState.timerInterval) clearInterval(_examState.timerInterval);
      _clearExamState();
      const pagina = document.getElementById('examPage') || _examPagina();
      const { questions, answers, startTime, tempoEsgotado } = _examState;
      const elapsed = Math.min(EXAM_DURATION_SEC, Math.floor((Date.now() - startTime) / 1000));
      const totalAnswered = answers.filter(a => a?.answered).length;
      const totalCorrect  = answers.filter(a => a?.correct).length;
      const pct = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0;
      const semResposta = questions.length - totalAnswered;
      const elMin = Math.floor(elapsed / 60), elSec = elapsed % 60;

      const byCat = {};
      answers.forEach(a => {
        if (!a?.answered) return;
        if (!byCat[a.cat]) byCat[a.cat] = {correct:0,total:0};
        byCat[a.cat].total++;
        if (a.correct) byCat[a.cat].correct++;
      });
      const catLabels = {
        glomerular:'Glomerulopatias',nefrologia_geral:'Nefrologia Geral',
        'eletrólitos':'Eletrólitos',lra:'LRA',drc:'DRC',
        nefropatia_diabetica:'Nefropatia Diabética',dialise:'Diálise',
        transplante:'Transplante',hipertensao:'Hipertensão',
        acido_base:'Ácido-Base','litíase':'Litíase',infeccao:'Infecção',
        farmacologia:'Farmacologia',genetica:'Genética',uti:'UTI / Crítico',
        diagnostico:'Diagnóstico',oncologia_renal:'Oncologia Renal',geral:'Geral'
      };
      const catRows = Object.entries(byCat)
        .sort((a,b) => (a[1].correct/a[1].total) - (b[1].correct/b[1].total))
        .map(([cat,d]) => {
          const p = Math.round(d.correct/d.total*100);
          return `<li><span>${catLabels[cat]||cat}</span><span class="nq-exam-barra" aria-hidden="true"><span style="width:${p}%"></span></span><span>${p}% (${d.correct} de ${d.total})</span></li>`;
        }).join('');

      const letras = ['A','B','C','D','E'];
      const erros = questions.map((q, i) => ({q, ans: answers[i]})).filter(({ans}) => ans && ans.answered && !ans.correct);
      const mensagem = totalAnswered === 0 ? 'Nenhuma questão foi respondida.'
        : pct>=70?'Excelente! Aprovado com distinção.':pct>=60?'Aprovado! Continue estudando para aperfeiçoar.':pct>=40?'Abaixo da média. Revise as categorias com menor acerto.':'Resultado insuficiente. Use o Modo de Estudo para reforçar.';

      pagina.innerHTML = `
        <div class="nq-study-content" id="examResultado">
          <h1 id="examResultadoTitulo" tabindex="-1">Resultado da Prova</h1>
          ${tempoEsgotado ? `<p class="nq-exam-aviso">O tempo de ${EXAM_DURATION_SEC / 60} minutos terminou. ${semResposta} ${semResposta === 1 ? 'questão ficou' : 'questões ficaram'} sem resposta.</p>` : ''}
          <dl class="nq-study-result-metrics">
            <div><dt>Acerto nas respondidas</dt><dd>${pct}%</dd></div>
            <div><dt>Corretas</dt><dd>${totalCorrect} de ${totalAnswered}</dd></div>
            <div><dt>Respondidas</dt><dd>${totalAnswered} de ${questions.length}</dd></div>
            <div><dt>Tempo</dt><dd>${elMin}m${elSec}s</dd></div>
          </dl>
          <p class="nq-exam-mensagem">${mensagem}</p>
          ${catRows ? `<section aria-labelledby="examCatTitulo"><h2 id="examCatTitulo">Desempenho por categoria</h2><ul class="nq-exam-categorias">${catRows}</ul></section>` : ''}
          ${!totalAnswered ? '' : erros.length ? `
            <details class="nq-exam-erros">
              <summary>Revisar erros (${erros.length})</summary>
              ${erros.map(({q, ans}) => `
                <article>
                  <p>${escapeHtml(q.q)}</p>
                  <ul>${(q.o || []).map((o, i) => `<li class="${i === q.a ? 'nq-exam-opcao-certa' : i === ans.chosen ? 'nq-exam-opcao-errada' : ''}">${letras[i]}. ${escapeHtml(o)}${i === q.a ? ' <strong>— resposta correta</strong>' : i === ans.chosen ? ' <strong>— sua resposta</strong>' : ''}</li>`).join('')}</ul>
                  <p class="nq-exam-explicacao">${escapeHtml(q.e || '')}</p>
                </article>`).join('')}
            </details>` : '<p class="nq-exam-mensagem">Nenhum erro entre as respondidas.</p>'}
          <div class="nq-exam-acoes">
            <button type="button" class="btn sec" data-action="_shareExamResult" data-args='[${pct},${totalCorrect},${totalAnswered}]'>Compartilhar</button>
            <button type="button" class="btn gold" data-action="_finishExam">Voltar ao menu</button>
          </div>
        </div>`;
      _examFocar('#examResultadoTitulo');
    }

    function _finishExam() {
      _clearExamState();
      _examFechar();
    }
