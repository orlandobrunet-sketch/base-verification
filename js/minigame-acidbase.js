// NefroQuest — Minigame: A Câmara do Equilíbrio (Ácido-Base)
// Plain script — shares global scope with game.js
// Fase 1: hub + Caso 1 (Ferreiro Aldric — acidose metabólica + Winter)

(function(){
  const AB_KEY = 'nq-acidbase-progress';
  const AB_OVERLAY_ID = 'acidBaseOverlay';

  // ── Persistência ────────────────────────────────────────────────────────
  function _loadProgress(){
    try { return JSON.parse(localStorage.getItem(AB_KEY) || '{}'); }
    catch { return {}; }
  }
  function _saveProgress(p){
    try { localStorage.setItem(AB_KEY, JSON.stringify(p)); } catch {}
  }
  function _markCompleted(caseId, grimoireUses){
    const p = _loadProgress();
    p.completed = Array.isArray(p.completed) ? p.completed : [];
    if (!p.completed.includes(caseId)) p.completed.push(caseId);
    p.grimoireUses = p.grimoireUses || {};
    p.grimoireUses[caseId] = (p.grimoireUses[caseId] || 0) + (grimoireUses || 0);
    _saveProgress(p);
  }

  // ── Casos clínicos (Fase 1: apenas Aldric ativo) ─────────────────────────
  const CASES = [
    {
      id: 'aldric',
      title: 'Ferreiro Aldric',
      subtitle: 'Acidose metabólica simples (Winter)',
      chapter: 'Caso I — A Forja Escaldante',
      unlocked: true,
      narrative: 'O ferreiro <strong>Aldric</strong> chega à câmara cambaleando. Trabalhou 14h diante da forja sob calor extremo, sem pausa para água. Apresenta fraqueza intensa, taquipneia profunda e mucosas secas. Você colhe a gasometria arterial.',
      gas: { pH: 7.22, PaCO2: 22, HCO3: 9, BE: -16, Na: 138, Cl: 110, K: 4.2, alb: 4.0 },
      acts: [
        {
          kind: 'mc',
          prompt: '<strong>Ato I — Distúrbio primário.</strong><br>Analisando pH, PaCO₂ e HCO₃⁻, qual o distúrbio primário?',
          options: [
            { label: 'Acidose metabólica', correct: true },
            { label: 'Acidose respiratória', correct: false },
            { label: 'Alcalose metabólica', correct: false },
            { label: 'Alcalose respiratória', correct: false }
          ],
          explainCorrect: 'pH 7.22 → <strong>acidemia</strong>. HCO₃⁻ 9 mEq/L (baixo) acompanha a acidemia → distúrbio primário é <strong>metabólico</strong>. PaCO₂ 22 mmHg (baixo) é a compensação respiratória esperada (hiperventilação), não o distúrbio primário.',
          explainWrong: {
            'Acidose respiratória': 'Numa acidose respiratória primária, PaCO₂ estaria <em>alto</em> e HCO₃⁻ subiria para compensar. Aqui PaCO₂ está baixo.',
            'Alcalose metabólica': 'Alcalose teria pH > 7.45 e HCO₃⁻ alto. Aqui o pH é 7.22 (ácido).',
            'Alcalose respiratória': 'Alcalose teria pH > 7.45. Aqui o pH é 7.22.'
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação esperada (Winter).</strong><br>Calcule a PaCO₂ esperada para acidose metabólica com HCO₃⁻ = 9 mEq/L.',
          grimoire: {
            title: 'Fórmula de Winter',
            body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code><br>Aplica-se apenas a <em>acidose metabólica</em>.'
          },
          unit: 'mmHg',
          target: 21.5,
          tolerance: 2,
          explainCorrect: 'PaCO₂ esperada = 1,5 × 9 + 8 = <strong>21,5 mmHg (±2)</strong>. O valor real (22) está dentro da faixa → a compensação respiratória é <strong>adequada</strong>. Não há distúrbio respiratório associado.',
          explainWrong: 'Reveja: 1,5 × 9 = 13,5. Some 8 → 21,5. Tolerância ±2 (19,5–23,5). PaCO₂ real 22 entra na faixa.'
        },
        {
          kind: 'num',
          prompt: '<strong>Ato III — Ânion gap.</strong><br>Calcule o AG sérico (albumina normal = 4,0 g/dL).',
          grimoire: {
            title: 'Ânion gap',
            body: '<code>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</code><br>Normal: 8–12 mEq/L. Corrigir para albumina: <code>AG_corrigido = AG + 2,5 × (4 − alb)</code>.'
          },
          unit: 'mEq/L',
          target: 19,
          tolerance: 1,
          explainCorrect: 'AG = 138 − (110 + 9) = <strong>19 mEq/L</strong> (alto, normal 8–12). Albumina normal → sem correção. <strong>AG elevado</strong> indica acúmulo de ácido orgânico — investigar <strong>lactato</strong> (exercício extremo + hipovolemia).',
          explainWrong: 'AG = Na − (Cl + HCO₃). Aqui: 138 − (110 + 9) = 19.'
        },
        {
          kind: 'mc',
          prompt: '<strong>Ato IV — Conduta clínica.</strong><br>pH 7.22, lactato pendente, paciente desidratado e taquipneico. Qual a conduta inicial?',
          options: [
            { label: 'Bolus de bicarbonato de sódio 8,4% IV imediato', correct: false },
            { label: 'Reposição volêmica com cristaloide + investigar causa do AG alto (lactato, função renal)', correct: true },
            { label: 'Intubação e hiperventilação mecânica', correct: false },
            { label: 'Hemodiálise de urgência', correct: false }
          ],
          explainCorrect: 'A causa provável é <strong>acidose láctica por hipoperfusão</strong> (desidratação + exercício). Tratar a causa: ressuscitação volêmica. Bicarbonato só se pH < 7,10 ou disfunção orgânica grave. Hiperventilação artificial é desnecessária (compensação já adequada). Hemodiálise sem indicação clara aqui (sem insuficiência renal grave, sem toxinas).',
          explainWrong: {
            'Bolus de bicarbonato de sódio 8,4% IV imediato': 'Bicarbonato em acidose láctica não melhora desfecho com pH > 7,10 e pode piorar acidose intracelular. Tratar a causa primeiro.',
            'Intubação e hiperventilação mecânica': 'A compensação respiratória já é adequada (Winter). Intubar sem indicação ventilatória prejudica a compensação espontânea.',
            'Hemodiálise de urgência': 'Sem indicação clássica de HD aguda (sem AEIOU: Acidose refratária, distúrbio Eletrolítico, Intoxicação, sObrecarga, Uremia).'
          }
        }
      ],
      summary: '<strong>Acidose metabólica com AG alto</strong> + compensação respiratória adequada (Winter). Causa provável: <strong>acidose láctica</strong> por hipoperfusão (calor + esforço + desidratação). Conduta: volume + investigar lactato.'
    },
    { id: 'mara',   title: 'Curandeira Mara',  subtitle: 'Alcalose metabólica (vômitos)',         chapter: 'Caso II',  unlocked: false },
    { id: 'theron', title: 'Guarda Theron',    subtitle: 'Acidose respiratória crônica (DPOC)',   chapter: 'Caso III', unlocked: false },
    { id: 'vance',  title: 'Mercador Vance',   subtitle: 'Misto + delta-delta',                   chapter: 'Caso IV',  unlocked: false },
    { id: 'kael',   title: 'General Kael',     subtitle: 'Triplo distúrbio (desafio)',            chapter: 'Caso V',   unlocked: false }
  ];

  // ── UI: Hub (lista de casos) ───────────────────────────────────────────
  function showAcidBaseMinigame(){
    document.getElementById(AB_OVERLAY_ID)?.remove();
    const progress = _loadProgress();
    const completed = new Set(progress.completed || []);
    try { if (typeof _track === 'function') _track('minigame_acid_base_opened', {}); } catch {}

    const cardsHTML = CASES.map(c => {
      const isDone = completed.has(c.id);
      const isLocked = !c.unlocked;
      const stateClass = isLocked ? 'ab-case-locked' : (isDone ? 'ab-case-done' : 'ab-case-ready');
      const badge = isLocked ? '🔒 Em breve' : (isDone ? '✓ Concluído' : '▶ Jogar');
      const action = isLocked ? '' : `data-ab-case="${c.id}"`;
      return `
        <button type="button" class="ab-case ${stateClass}" ${action} ${isLocked?'disabled':''}>
          <div class="ab-case-chapter">${c.chapter}</div>
          <div class="ab-case-title">${c.title}</div>
          <div class="ab-case-sub">${c.subtitle}</div>
          <div class="ab-case-badge">${badge}</div>
        </button>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = AB_OVERLAY_ID;
    overlay.className = 'nq-overlay acid-base-overlay';
    overlay.innerHTML = `
      <div class="ab-card">
        <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
        <div class="ab-hub">
          <div class="ab-ornament">✦ A Câmara do Equilíbrio ✦</div>
          <h2 class="ab-title">Alquimista Renal</h2>
          <p class="ab-lead">Cinco pacientes do reino aguardam diagnóstico ácido-base. Domine a fórmula de Winter, o ânion gap e a delta-delta para restaurar o equilíbrio.</p>
          <div class="ab-grid">${cardsHTML}</div>
          <div class="ab-hub-footer">Progresso: <strong>${completed.size}/5</strong> casos · Sem cronômetro · 100% offline</div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    _bindOverlayEvents(overlay);
  }

  function _bindOverlayEvents(overlay){
    overlay.addEventListener('click', e => {
      const t = e.target;
      if (t === overlay || t.closest('[data-ab-close]')) { overlay.remove(); return; }
      const caseBtn = t.closest('[data-ab-case]');
      if (caseBtn){
        const id = caseBtn.getAttribute('data-ab-case');
        const c = CASES.find(x => x.id === id);
        if (c && c.unlocked) _startCase(overlay, c);
      }
    });
    document.addEventListener('keydown', _escClose);
    function _escClose(ev){
      if (ev.key === 'Escape' && document.getElementById(AB_OVERLAY_ID)){
        overlay.remove();
        document.removeEventListener('keydown', _escClose);
      }
    }
  }

  // ── UI: Caso (4 atos sequenciais) ──────────────────────────────────────
  function _startCase(overlay, kase){
    try { if (typeof _track === 'function') _track('minigame_acid_base_case_started', { case: kase.id }); } catch {}
    const sess = { actIdx: 0, grimoireUses: 0, wrongAttempts: 0 };
    _renderIntro(overlay, kase, sess);
  }

  function _renderIntro(overlay, kase, sess){
    const g = kase.gas;
    const card = overlay.querySelector('.ab-card');
    card.innerHTML = `
      <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
      <div class="ab-case-view">
        <div class="ab-ornament">${kase.chapter}</div>
        <h2 class="ab-title">${kase.title}</h2>
        <p class="ab-narrative">${kase.narrative}</p>
        <div class="ab-gas-grid">
          <div class="ab-gas"><span>pH</span><strong>${g.pH}</strong></div>
          <div class="ab-gas"><span>PaCO₂</span><strong>${g.PaCO2}</strong><em>mmHg</em></div>
          <div class="ab-gas"><span>HCO₃⁻</span><strong>${g.HCO3}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>BE</span><strong>${g.BE}</strong></div>
          <div class="ab-gas"><span>Na⁺</span><strong>${g.Na}</strong></div>
          <div class="ab-gas"><span>Cl⁻</span><strong>${g.Cl}</strong></div>
          <div class="ab-gas"><span>K⁺</span><strong>${g.K}</strong></div>
          <div class="ab-gas"><span>Albumina</span><strong>${g.alb}</strong><em>g/dL</em></div>
        </div>
        <button type="button" class="ab-btn-primary" data-ab-start-acts>Iniciar Diagnóstico em 4 Atos →</button>
      </div>`;
    card.querySelector('[data-ab-start-acts]').onclick = () => _renderAct(overlay, kase, sess);
    card.querySelector('[data-ab-close]').onclick = () => overlay.remove();
  }

  function _renderAct(overlay, kase, sess){
    const act = kase.acts[sess.actIdx];
    const card = overlay.querySelector('.ab-card');
    const progressDots = kase.acts.map((_,i) =>
      `<span class="ab-dot ${i<sess.actIdx?'done':i===sess.actIdx?'current':''}"></span>`
    ).join('');

    let bodyHTML = '';
    if (act.kind === 'mc') {
      bodyHTML = `<div class="ab-options">
        ${act.options.map((o,i) => `<button type="button" class="ab-option" data-ab-pick="${i}">${o.label}</button>`).join('')}
      </div>`;
    } else if (act.kind === 'num') {
      bodyHTML = `
        <div class="ab-num-row">
          <input type="number" step="0.1" inputmode="decimal" class="ab-num-input" id="abNumInput" placeholder="Digite o valor" aria-label="Valor calculado">
          <span class="ab-num-unit">${act.unit||''}</span>
          <button type="button" class="ab-btn-primary" data-ab-num-submit>Conferir</button>
        </div>`;
    }

    const grimoireBtn = act.grimoire
      ? `<button type="button" class="ab-grimoire-btn" data-ab-grimoire>📖 Consultar Grimório</button>`
      : '';

    card.innerHTML = `
      <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
      <div class="ab-case-view">
        <div class="ab-progress">${progressDots}</div>
        <div class="ab-prompt">${act.prompt}</div>
        ${grimoireBtn}
        <div class="ab-grimoire-panel" id="abGrimoirePanel" hidden></div>
        ${bodyHTML}
        <div class="ab-feedback" id="abFeedback" hidden></div>
      </div>`;

    card.querySelector('[data-ab-close]').onclick = () => overlay.remove();
    const grimBtn = card.querySelector('[data-ab-grimoire]');
    if (grimBtn) grimBtn.onclick = () => {
      const panel = card.querySelector('#abGrimoirePanel');
      if (!panel.hasAttribute('hidden')) { panel.setAttribute('hidden',''); return; }
      panel.innerHTML = `<div class="ab-grimoire-title">${act.grimoire.title}</div><div class="ab-grimoire-body">${act.grimoire.body}</div>`;
      panel.removeAttribute('hidden');
      sess.grimoireUses++;
    };

    if (act.kind === 'mc') {
      card.querySelectorAll('[data-ab-pick]').forEach(b => {
        b.onclick = () => _handleAnswerMC(overlay, kase, sess, parseInt(b.getAttribute('data-ab-pick'),10), b);
      });
    } else if (act.kind === 'num') {
      const input = card.querySelector('#abNumInput');
      const submit = card.querySelector('[data-ab-num-submit]');
      const go = () => _handleAnswerNum(overlay, kase, sess, parseFloat(input.value));
      submit.onclick = go;
      input.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); });
      setTimeout(() => input.focus(), 30);
    }
  }

  function _handleAnswerMC(overlay, kase, sess, pickIdx, btn){
    const act = kase.acts[sess.actIdx];
    const picked = act.options[pickIdx];
    const card = overlay.querySelector('.ab-card');
    card.querySelectorAll('[data-ab-pick]').forEach(b => b.disabled = true);
    btn.classList.add(picked.correct ? 'correct' : 'wrong');
    if (picked.correct) {
      _showFeedback(card, true, act.explainCorrect);
    } else {
      sess.wrongAttempts++;
      const why = (act.explainWrong && act.explainWrong[picked.label]) || '';
      const correctOpt = act.options.find(o => o.correct);
      _showFeedback(card, false, `${why} <br><br><strong>Resposta correta:</strong> ${correctOpt.label}.<br>${act.explainCorrect}`);
    }
    _appendNextBtn(card, overlay, kase, sess);
  }

  function _handleAnswerNum(overlay, kase, sess, value){
    const act = kase.acts[sess.actIdx];
    if (!Number.isFinite(value)) return;
    const card = overlay.querySelector('.ab-card');
    const ok = Math.abs(value - act.target) <= act.tolerance;
    card.querySelector('[data-ab-num-submit]').disabled = true;
    card.querySelector('#abNumInput').disabled = true;
    if (ok) {
      _showFeedback(card, true, act.explainCorrect);
    } else {
      sess.wrongAttempts++;
      _showFeedback(card, false, `Valor informado: <strong>${value}</strong>. Resposta esperada: <strong>${act.target} ${act.unit||''}</strong> (±${act.tolerance}).<br><br>${act.explainWrong}<br><br>${act.explainCorrect}`);
    }
    _appendNextBtn(card, overlay, kase, sess);
  }

  function _showFeedback(card, ok, html){
    const fb = card.querySelector('#abFeedback');
    fb.className = 'ab-feedback ' + (ok ? 'ok' : 'err');
    fb.innerHTML = `<div class="ab-feedback-icon">${ok ? '✓' : '✗'}</div><div class="ab-feedback-body">${html}</div>`;
    fb.removeAttribute('hidden');
  }

  function _appendNextBtn(card, overlay, kase, sess){
    const fb = card.querySelector('#abFeedback');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'ab-btn-primary ab-next';
    const isLast = sess.actIdx >= kase.acts.length - 1;
    next.textContent = isLast ? 'Concluir Caso →' : 'Próximo Ato →';
    next.onclick = () => {
      if (isLast) { _renderSummary(overlay, kase, sess); }
      else { sess.actIdx++; _renderAct(overlay, kase, sess); }
    };
    fb.appendChild(next);
    setTimeout(() => next.focus(), 30);
  }

  function _renderSummary(overlay, kase, sess){
    _markCompleted(kase.id, sess.grimoireUses);
    try { if (typeof _track === 'function') _track('minigame_acid_base_case_completed', {
      case: kase.id, grimoireUses: sess.grimoireUses, wrongAttempts: sess.wrongAttempts
    }); } catch {}
    const card = overlay.querySelector('.ab-card');
    const flawless = sess.wrongAttempts === 0;
    card.innerHTML = `
      <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
      <div class="ab-case-view ab-summary-view">
        <div class="ab-ornament">${kase.chapter} — Concluído</div>
        <h2 class="ab-title">${flawless ? '🏆 Diagnóstico Impecável' : '✓ Caso Concluído'}</h2>
        <div class="ab-summary-text">${kase.summary}</div>
        <div class="ab-summary-stats">
          <div><span>Erros</span><strong>${sess.wrongAttempts}</strong></div>
          <div><span>Grimório</span><strong>${sess.grimoireUses}×</strong></div>
        </div>
        <div class="ab-summary-actions">
          <button type="button" class="ab-btn-primary" data-ab-back>← Voltar à Câmara</button>
        </div>
      </div>`;
    card.querySelector('[data-ab-close]').onclick = () => overlay.remove();
    card.querySelector('[data-ab-back]').onclick = () => { overlay.remove(); showAcidBaseMinigame(); };
  }

  // ── Expor entry point ──────────────────────────────────────────────────
  window.showAcidBaseMinigame = showAcidBaseMinigame;
})();
