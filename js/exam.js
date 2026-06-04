// NefroQuest — Exam Mode (Simulado)
// Plain script — shares global scope with game.js

    const EXAM_QUESTION_COUNT = 60;
    const EXAM_DURATION_SEC   = 90 * 60; // 90 minutos
    const EXAM_SAVE_KEY = 'nefroquest-exam-state';
    const EXAM_TTL_MS   = 2 * 60 * 60 * 1000; // 2 horas

    let _examState = null; // {questions, idx, answers, startTime, timerInterval}

    function _saveExamState() {
      if (!_examState) return;
      try {
        const { questions, idx, answers, startTime } = _examState;
        localStorage.setItem(EXAM_SAVE_KEY, JSON.stringify({ questions, idx, answers, startTime, savedAt: Date.now() }));
      } catch(e) { console.error('[NQ] _saveExamState failed', e); }
    }

    function _loadExamState() {
      try {
        const raw = localStorage.getItem(EXAM_SAVE_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s?.startTime || !s?.questions?.length) return null;
        if (Date.now() - s.savedAt > EXAM_TTL_MS) { localStorage.removeItem(EXAM_SAVE_KEY); return null; }
        const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
        if (elapsed >= EXAM_DURATION_SEC) { localStorage.removeItem(EXAM_SAVE_KEY); return null; }
        return s;
      } catch(e) { return null; }
    }

    function _clearExamState() {
      try { localStorage.removeItem(EXAM_SAVE_KEY); } catch(e) {}
    }

    async function startExamMode() {
      if (_examState) { showExamQuestion(); return; }

      // Verificar se existe prova salva (refresh/fechar browser)
      const saved = _loadExamState();
      if (saved) {
        const elapsed = Math.floor((Date.now() - saved.startTime) / 1000);
        const remaining = EXAM_DURATION_SEC - elapsed;
        const m = Math.floor(remaining / 60);
        if (confirm(`Você tem uma prova em andamento (${m} min restantes). Continuar de onde parou?`)) {
          _examState = { questions: saved.questions, idx: saved.idx, answers: saved.answers, startTime: saved.startTime, timerInterval: null };
          document.getElementById('welcomeScreen')?.classList.add('hidden');
          _renderExamUI();
          return;
        } else {
          _clearExamState();
        }
      }

      // Sortear 60 questões únicas do banco
      if (!questionBank) { await _loadTopics(); }
      const pool = shuffle([...questionBank]);
      const questions = pool.slice(0, EXAM_QUESTION_COUNT);

      _examState = {
        questions,
        idx: 0,
        answers: [],   // {qId, correct, cat, answered}
        startTime: Date.now(),
        timerInterval: null
      };

      document.getElementById('welcomeScreen')?.classList.add('hidden');
      _renderExamUI();
    }

    function _renderExamUI() {
      document.querySelectorAll('.exam-overlay').forEach(e => e.remove());
      const overlay = document.createElement('div');
      overlay.className = 'exam-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:#0a0e1a;overflow-y:auto;display:flex;flex-direction:column;';
      overlay.id = 'examOverlay';
      document.body.appendChild(overlay);
      _examState.timerInterval = setInterval(_updateExamTimer, 1000);
      showExamQuestion();
    }

    function _updateExamTimer() {
      if (!_examState) return;
      const elapsed = Math.floor((Date.now() - _examState.startTime) / 1000);
      const remaining = EXAM_DURATION_SEC - elapsed;
      const el = document.getElementById('examTimer');
      if (!el) return;
      if (remaining <= 0) {
        clearInterval(_examState.timerInterval);
        _clearExamState();
        // Marcar questões restantes como não respondidas
        while (_examState.answers.length < _examState.questions.length) {
          _examState.answers.push({ qId: _examState.questions[_examState.answers.length].id, correct: false, cat: _examState.questions[_examState.answers.length].c || 'geral', answered: false });
        }
        showExamResults();
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      const urgent = remaining < 600;
      el.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
      el.style.color = urgent ? '#fb7185' : '#34d399';
    }

    function showExamQuestion() {
      const overlay = document.getElementById('examOverlay');
      if (!overlay) return;
      const {questions, idx, answers} = _examState;
      if (idx >= questions.length) { showExamResults(); return; }
      const q = questions[idx];
      const answered = answers[idx];
      const elapsed = Math.floor((Date.now() - _examState.startTime) / 1000);
      const remaining = EXAM_DURATION_SEC - elapsed;
      const m = Math.floor(remaining / 60), s = remaining % 60;

      overlay.innerHTML = `
        <div style="max-width:700px;width:100%;margin:0 auto;padding:20px 16px 100px;box-sizing:border-box;">
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;background:rgba(20,30,50,0.9);border-radius:12px;padding:12px 16px;border:1px solid var(--blue-dark);">
            <div style="font-family:'Cinzel',serif;color:var(--gold);font-size:0.9rem;">📝 Prova Simulada</div>
            <div style="display:flex;gap:16px;align-items:center;">
              <div id="examTimer" style="font-weight:bold;color:#34d399;">⏱ ${m}:${s.toString().padStart(2,'0')}</div>
              <div style="color:var(--txt-dim);font-size:0.85rem;">${idx+1} / ${questions.length}</div>
            </div>
          </div>
          <!-- Barra de progresso -->
          <div style="background:rgba(0,0,0,0.4);height:4px;border-radius:2px;margin-bottom:16px;overflow:hidden;">
            <div style="background:var(--gold);height:100%;width:${((idx)/questions.length*100).toFixed(1)}%;transition:width 0.3s;"></div>
          </div>
          <!-- Questão -->
          <div style="background:rgba(20,30,50,0.8);border:1px solid var(--blue-dark);border-radius:12px;padding:18px;margin-bottom:14px;">
            <div style="color:var(--txt-dim);font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Questão ${idx+1}</div>
            <p style="color:var(--txt);font-size:0.92rem;line-height:1.7;margin:0;">${escapeHtml(q.q)}</p>
          </div>
          <!-- Opções -->
          <div id="examOpts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
            ${q.o.map((opt, i) => {
              let bg = 'rgba(20,30,50,0.7)', border = '1px solid var(--blue-dark)', color = 'var(--txt)';
              if (answered) {
                if (i === q.a) { bg='rgba(52,211,153,0.15)'; border='1px solid #34d399'; color='#34d399'; }
                else if (i === answered.chosen) { bg='rgba(251,113,133,0.15)'; border='1px solid #fb7185'; color='#fb7185'; }
              }
              return `<button data-action="_examAnswer" data-arg="${i}" data-arg-type="number" ${answered?'disabled':''} style="text-align:left;background:${bg};border:${border};border-radius:10px;padding:12px 14px;color:${color};font-size:0.87rem;cursor:${answered?'default':'pointer'};transition:all 0.15s;line-height:1.5;">${escapeHtml(opt)}</button>`;
            }).join('')}
          </div>
          ${answered ? `
            <div style="background:rgba(20,30,50,0.8);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;margin-bottom:14px;font-size:0.82rem;color:#94a3b8;line-height:1.6;">
              <strong style="color:${answered.correct?'#34d399':'#fb7185'};">${answered.correct?'✅ Correto':'❌ Incorreto'}</strong><br>
              ${escapeHtml(q.e)}
            </div>
            <button data-action="_examNext" style="width:100%;background:linear-gradient(180deg,#4f46e5,#3730a3);border:2px solid #6366f1;color:#fff;border-radius:10px;padding:13px;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;cursor:pointer;letter-spacing:1px;">
              ${idx+1 < questions.length ? 'PRÓXIMA' : 'VER RESULTADO'}
            </button>` : ''}
          <!-- Botão sair -->
          <button data-action="_exitExam" style="margin-top:10px;width:100%;background:none;border:1px solid #374151;color:#64748b;border-radius:8px;padding:8px;font-size:0.78rem;cursor:pointer;">Encerrar prova</button>
        </div>`;
    }

    function _examAnswer(chosen) {
      const {questions, idx} = _examState;
      const q = questions[idx];
      const correct = chosen === q.a;
      _examState.answers[idx] = { qId: q.id, correct, cat: q.c || 'geral', chosen, answered: true };
      if (typeof trackQuestionAnswer === 'function') {
        trackQuestionAnswer(q, correct, 0);
      }
      _saveExamState();
      showExamQuestion();
    }

    function _examNext() {
      _examState.idx++;
      if (_examState.idx >= _examState.questions.length) { showExamResults(); }
      else { showExamQuestion(); }
    }

    function _exitExam() {
      if (!confirm('Encerrar a prova? O progresso será perdido.')) return;
      clearInterval(_examState.timerInterval);
      _clearExamState();
      _examState = null;
      document.querySelectorAll('.exam-overlay').forEach(e => e.remove());
      document.getElementById('mobileStatusBar')?.classList.remove('active');
      document.getElementById('welcomeScreen')?.classList.remove('hidden');
      refreshWelcomeSave();
      if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
    }

    function showExamResults() {
      clearInterval(_examState.timerInterval);
      const {questions, answers, startTime} = _examState;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const totalAnswered = answers.filter(a => a.answered).length;
      const totalCorrect  = answers.filter(a => a.correct).length;
      const pct = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0;
      const elMin = Math.floor(elapsed / 60), elSec = elapsed % 60;

      // Desempenho por categoria
      const byCat = {};
      answers.forEach(a => {
        if (!a.answered) return;
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
          const c = p>=70?'#34d399':p>=50?'#fbbf24':'#fb7185';
          return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:6px;">
            <span style="flex:1;font-size:0.8rem;color:var(--txt);">${catLabels[cat]||cat}</span>
            <div style="width:60px;background:rgba(0,0,0,0.4);height:4px;border-radius:2px;overflow:hidden;flex-shrink:0;"><div style="background:${c};height:100%;width:${p}%;"></div></div>
            <span style="color:${c};font-weight:bold;font-size:0.78rem;min-width:36px;text-align:right;">${p}% (${d.correct}/${d.total})</span>
          </div>`;
        }).join('');

      const overlay = document.getElementById('examOverlay');
      if (!overlay) return;
      overlay.innerHTML = `
        <div style="max-width:600px;width:100%;margin:0 auto;padding:24px 16px 40px;box-sizing:border-box;">
          <h2 style="color:var(--gold);font-family:'Cinzel',serif;text-align:center;margin-bottom:20px;">📋 Resultado da Prova</h2>
          <!-- Placar geral -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:1.8rem;font-weight:bold;color:${pct>=60?'#34d399':pct>=40?'#fbbf24':'#fb7185'};">${pct}%</div>
              <div style="font-size:0.68rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Acerto</div>
            </div>
            <div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.35);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:1.8rem;font-weight:bold;color:var(--blue);">${totalCorrect}/${totalAnswered}</div>
              <div style="font-size:0.68rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Corretas</div>
            </div>
            <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:1.8rem;font-weight:bold;color:#fbbf24;">${elMin}m${elSec}s</div>
              <div style="font-size:0.68rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Tempo</div>
            </div>
          </div>
          <!-- Mensagem -->
          <div style="background:rgba(20,30,50,0.8);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;text-align:center;margin-bottom:20px;">
            <p style="color:var(--txt);font-size:0.9rem;margin:0;">
              ${pct>=70?'🏆 Excelente! Aprovado com distinção.':pct>=60?'✅ Aprovado! Continue estudando para aperfeiçoar.':pct>=40?'⚠️ Abaixo da média. Revise os tópicos em vermelho.':'❌ Resultado insuficiente. Use o Modo de Estudo para reforçar.'}
            </p>
          </div>
          <!-- Por categoria -->
          <div style="text-align:left;margin-bottom:20px;">
            <h3 style="color:var(--gold);font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:1px;margin-bottom:10px;">DESEMPENHO POR CATEGORIA</h3>
            <div style="display:flex;flex-direction:column;gap:6px;">${catRows}</div>
          </div>
          <!-- Revisão de erros -->
          ${(() => {
            const wrongItems = questions.map((q, i) => ({q, ans: answers[i]})).filter(({ans}) => ans && ans.answered && !ans.correct);
            if (!wrongItems.length) return '<div style="text-align:center;color:#34d399;margin-bottom:20px;font-size:0.85rem;">🎉 Sem erros para revisar!</div>';
            const optLetters = ['A','B','C','D'];
            return `
            <div style="text-align:left;margin-bottom:20px;">
              <h3 style="color:#fb7185;font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:1px;margin-bottom:4px;">📋 REVISÃO DE ERROS (${wrongItems.length})</h3>
              <button data-action="_toggleErrorsList" data-pass-this="1"
                style="background:none;border:1px solid rgba(251,113,133,0.4);color:#fb7185;border-radius:6px;padding:6px 14px;font-size:0.78rem;cursor:pointer;margin-bottom:10px;">▼ Ver erros</button>
              <div style="display:none;flex-direction:column;gap:10px;">
                ${wrongItems.map(({q, ans}) => {
                  const opts = q.o || [];
                  return `<div style="background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.3);border-radius:10px;padding:14px;">
                    <p style="color:var(--txt);font-size:0.85rem;line-height:1.6;margin-bottom:10px;">${escapeHtml(q.q)}</p>
                    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
                      ${opts.map((o, i) => {
                        const isCorrect = i === q.a;
                        const isChosen  = i === ans.chosen;
                        const bg    = isCorrect ? 'rgba(52,211,153,0.15)' : isChosen ? 'rgba(251,113,133,0.15)' : 'transparent';
                        const border= isCorrect ? '1px solid #34d399' : isChosen ? '1px solid #fb7185' : '1px solid rgba(255,255,255,0.1)';
                        const color = isCorrect ? '#34d399' : isChosen ? '#fb7185' : 'var(--txt-dim)';
                        const mark  = isCorrect ? ' ✓' : isChosen ? ' ✗' : '';
                        return `<div style="background:${bg};border:${border};border-radius:6px;padding:7px 10px;font-size:0.8rem;color:${color};">${optLetters[i]}. ${escapeHtml(o)}${mark}</div>`;
                      }).join('')}
                    </div>
                    <div style="font-size:0.78rem;color:#94a3b8;line-height:1.6;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">${escapeHtml(q.e || '')}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>`;
          })()}
          <div style="display:flex;gap:10px;margin-top:0;">
            <button data-action="_shareExamResult" data-args='[${pct},${totalCorrect},${totalAnswered}]' style="flex:1;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;border-radius:10px;padding:11px;font-size:0.82rem;font-weight:600;cursor:pointer;">📤 Compartilhar</button>
            <button data-action="_finishExam" style="flex:2;background:linear-gradient(180deg,#b8860b,#7a5a00);border:2px solid var(--gold);color:#fff8dc;border-radius:10px;padding:11px;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;cursor:pointer;letter-spacing:1px;">VOLTAR AO MENU</button>
          </div>
        </div>`;
    }

    function _finishExam() {
      _clearExamState();
      _examState = null;
      document.querySelectorAll('.exam-overlay').forEach(e => e.remove());
      document.getElementById('mobileStatusBar')?.classList.remove('active');
      document.getElementById('welcomeScreen')?.classList.remove('hidden');
      refreshWelcomeSave();
      if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
    }
