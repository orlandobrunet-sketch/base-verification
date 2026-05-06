// NefroQuest — Study Mode (topic selector, trails, spaced-repetition UI)
// Loaded before game.js. All functions become global.

    function getSRDueCount() {
      const selectedCats = new Set();
      NEFRO_AXES.forEach(ax => { if (_studySelectedAxes.has(ax.id)) selectedCats.add(ax.cat); });
      return getSRDueQuestions(topics.filter(q => selectedCats.has(q.cat))).length;
    }
    function startSRStudyMode() {
      if (_studySelectedAxes.size === 0) { _toast('Selecione pelo menos um eixo!', 'warning'); return; }
      const selectedCats = new Set();
      NEFRO_AXES.forEach(ax => { if (_studySelectedAxes.has(ax.id)) selectedCats.add(ax.cat); });
      const due = getSRDueQuestions(topics.filter(q => selectedCats.has(q.cat)));
      if (due.length === 0) {
        _toast('Sem revisões pendentes hoje. Volte amanhã ou use o Estudo Livre.', 'info', 4000);
        return;
      }
      studyModeQuestions = shuffle(due);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      _studyAxisStats = {};
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      showStudyModePage();
    }

    const NEFRO_AXES = [
      { id: 'drc',                  icon: '🪴', label: 'DRC & KDIGO',              cat: 'drc' },
      { id: 'lra',                  icon: '⚠️', label: 'LRA & Nefrotoxicidade',    cat: 'lra' },
      { id: 'glomerular',           icon: '🔬', label: 'Glomerulopatias',           cat: 'glomerular' },
      { id: 'eletrólitos',          icon: '⚡', label: 'Distúrbios Eletrolíticos',  cat: 'eletrólitos' },
      { id: 'acido_base',           icon: '🧪', label: 'Ácido-Base',               cat: 'acido_base' },
      { id: 'dialise',              icon: '💉', label: 'Diálise & DP',              cat: 'dialise' },
      { id: 'transplante',          icon: '🫀', label: 'Transplante Renal',         cat: 'transplante' },
      { id: 'hipertensao',          icon: '❤️', label: 'Hipertensão',               cat: 'hipertensao' },
      { id: 'nefropatia_diabetica', icon: '🩸', label: 'Nefropatia Diabética',      cat: 'nefropatia_diabetica' },
      { id: 'infeccao',             icon: '🦠', label: 'Infecção Renal',            cat: 'infeccao' },
      { id: 'litíase',              icon: '💎', label: 'Litíase Renal',             cat: 'litíase' },
      { id: 'farmacologia',         icon: '💊', label: 'Farmacologia',              cat: 'farmacologia' },
      { id: 'genetica',             icon: '🧬', label: 'Genética Renal',            cat: 'genetica' },
      { id: 'uti',                  icon: '🏥', label: 'UTI / Crítico',             cat: 'uti' },
      { id: 'diagnostico',          icon: '🔭', label: 'Diagnóstico',               cat: 'diagnostico' },
      { id: 'oncologia_renal',      icon: '🎗️', label: 'Oncologia Renal',           cat: 'oncologia_renal' },
      { id: 'nefrologia_geral',     icon: '📚', label: 'Nefrologia Geral',          cat: 'nefrologia_geral' },
    ];

    function drawRadarChart(canvas, axes) {
      if (!canvas || !axes.length) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const r = Math.min(cx, cy) - 36;
      const n = axes.length;
      ctx.clearRect(0, 0, W, H);
      // Rings at 25%, 50%, 75%, 100%
      [0.25, 0.5, 0.75, 1].forEach(pct => {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * pct * Math.cos(a), y = cy + r * pct * Math.sin(a);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = pct === 1 ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      // Spokes
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        ctx.strokeStyle = 'rgba(96,165,250,0.15)';
        ctx.stroke();
      }
      // Data polygon
      ctx.beginPath();
      axes.forEach((ax, i) => {
        const pct = ax.total > 0 ? ax.correct / ax.total : 0;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * pct * Math.cos(a), y = cy + r * pct * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(168,85,247,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(168,85,247,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Dots + labels
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      axes.forEach((ax, i) => {
        const pct = ax.total > 0 ? ax.correct / ax.total : 0;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const dx = cx + r * pct * Math.cos(a), dy = cy + r * pct * Math.sin(a);
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        const lx = cx + (r + 22) * Math.cos(a), ly = cy + (r + 22) * Math.sin(a);
        ctx.fillText(ax.icon, lx, ly);
      });
    }

    function getAxisStats(stats) {
      return NEFRO_AXES.map(axis => {
        const d = (stats.byCategory || {})[axis.cat] || { correct: 0, wrong: 0, total: 0 };
        const { correct, wrong, total } = d;
        const accuracy = total > 0 ? ((correct / total) * 100) : null;
        return { ...axis, correct, wrong, total, accuracy };
      }).filter(a => a.total > 0)
        .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100)); // piores primeiro
    }

    // ── Notificações de estudo ──────────────────────────────────────────────
    async function enableStudyReminders() {
      if (!('Notification' in window)) {
        _toast('Seu navegador não suporta notificações.', 'error'); return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        _toast('Permissão negada. Ative nas configurações do navegador.', 'warning'); return;
      }
      localStorage.setItem('nq_notif_enabled', '1');
      // Tentar registrar periodic sync
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
          await reg.periodicSync.register('nq-study-reminder', { minInterval: 20 * 60 * 60 * 1000 }).catch(() => {});
        }
      }
      _toast('Lembretes de estudo ativados!', 'success');
    }
    function disableStudyReminders() {
      localStorage.removeItem('nq_notif_enabled');
      _toast('Lembretes desativados.', 'info');
    }
    function toggleStudyReminders() {
      if (localStorage.getItem('nq_notif_enabled')) {
        disableStudyReminders();
      } else {
        enableStudyReminders();
      }
    }
    function _checkStudyReminder() {
      if (Notification.permission !== 'granted') return;
      if (!localStorage.getItem('nq_notif_enabled')) return;
      const lastStudy = parseInt(localStorage.getItem('nq_last_study') || '0');
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      if (lastStudy < yesterday) {
        const banner = document.createElement('div');
        banner.id = 'studyReminderBanner';
        banner.style.cssText = 'position:fixed;bottom:calc(80px + env(safe-area-inset-bottom, 0px));left:50%;transform:translateX(-50%);background:rgba(139,92,246,0.95);color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:0.85rem;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.4);max-width:320px;width:90%;';
        banner.innerHTML = '📚 Você não estudou hoje ainda!<br><button onclick="this.parentElement.remove();showTopicSelector();" style="margin-top:8px;background:#fff;color:#7c3aed;border:none;padding:6px 16px;border-radius:8px;font-weight:bold;cursor:pointer;">Estudar agora</button> <button onclick="this.parentElement.remove();" style="margin-top:8px;background:transparent;color:#e9d5ff;border:1px solid rgba(255,255,255,0.3);padding:6px 12px;border-radius:8px;cursor:pointer;">Depois</button>';
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 15000);
      }
    }

    function showStatsModal() {
      document.querySelectorAll('.stats-popup').forEach(el => el.remove());

      const stats = getDetailedStats();
      const avgTime = stats.timeStats.questionCount > 0 
        ? Math.round(stats.timeStats.totalTime / stats.timeStats.questionCount) 
        : 0;
      const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
        : 0;

      const axisStats = getAxisStats(stats);

      // Todos os tópicos praticados, ordenados por pior desempenho
      const allTopicData = Object.entries(stats.byTopic)
        .map(([topic, data]) => ({
          topic,
          accuracy: data.total > 0 ? ((data.correct / data.total) * 100) : null,
          total: data.total,
          correct: data.correct,
          wrong: data.wrong
        }))
        .filter(t => t.total > 0)
        .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));
      
      const modal = document.createElement('div');
      modal.className = 'modal show stats-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:32px 16px calc(env(safe-area-inset-bottom,0px)+16px);box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;max-height:88vh;overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(59,130,246,0.3);">
          <h2 style="color:var(--gold);margin-bottom:16px;font-family:'Cinzel',serif;">📊 ESTATÍSTICAS</h2>
          
          <!-- Resumo geral -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#34d399;font-weight:bold;">${stats.totalQuestions}</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Questões</div>
            </div>
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#34d399;font-weight:bold;">${accuracy}%</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Acerto</div>
            </div>
            <div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:var(--blue);font-weight:bold;">${avgTime}s</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">T. Médio</div>
            </div>
            <div style="background:rgba(251,113,133,0.12);border:1px solid rgba(251,113,133,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#fb7185;font-weight:bold;">${stats.totalWrong}</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Erros</div>
            </div>
          </div>

          <!-- Radar Chart -->
          ${axisStats.length >= 3 ? `
          <div style="text-align:center;margin-bottom:16px;">
            <h3 style="color:var(--gold);margin-bottom:10px;font-size:0.9rem;font-family:'Cinzel',serif;letter-spacing:1px;">RADAR DE DESEMPENHO</h3>
            <canvas id="nqRadarChart" width="280" height="280" style="max-width:100%;"></canvas>
          </div>` : ''}
          <!-- Desempenho por Eixo -->
          <div style="text-align:left;margin-bottom:16px;">
            <h3 style="color:var(--gold);margin-bottom:10px;font-size:0.9rem;font-family:'Cinzel',serif;letter-spacing:1px;">DESEMPENHO POR EIXO</h3>
            ${axisStats.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${axisStats.map(a => {
                const pct = a.accuracy !== null ? a.accuracy.toFixed(0) : 0;
                const color = a.accuracy >= 70 ? '#34d399' : a.accuracy >= 50 ? '#fbbf24' : '#fb7185';
                const bgColor = a.accuracy >= 70 ? 'rgba(52,211,153,0.08)' : a.accuracy >= 50 ? 'rgba(251,191,36,0.08)' : 'rgba(251,113,133,0.08)';
                const borderColor = a.accuracy >= 70 ? 'rgba(52,211,153,0.3)' : a.accuracy >= 50 ? 'rgba(251,191,36,0.3)' : 'rgba(251,113,133,0.3)';
                return `
                  <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:10px 12px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:1.1rem;">${a.icon}</span>
                        <span style="color:var(--txt);font-size:0.85rem;font-weight:600;">${a.label}</span>
                      </div>
                      <div style="text-align:right;">
                        <span style="color:${color};font-weight:bold;font-size:0.95rem;">${pct}%</span>
                        <span style="color:var(--txt-dim);font-size:0.7rem;margin-left:6px;">${a.correct}/${a.total}</span>
                      </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);height:5px;border-radius:3px;overflow:hidden;">
                      <div style="background:${color};height:100%;width:${pct}%;transition:width 0.5s;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            ` : '<p style="color:var(--txt-dim);text-align:center;padding:16px;font-size:0.85rem;">Jogue para ver seu desempenho por eixo!</p>'}
          </div>

          <!-- Tópicos com pior desempenho -->
          ${allTopicData.length > 0 ? `
          <div style="text-align:left;margin-bottom:16px;">
            <h3 style="color:var(--gold);margin-bottom:10px;font-size:0.9rem;font-family:'Cinzel',serif;letter-spacing:1px;">TÓPICOS A REFORÇAR</h3>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;">
              ${allTopicData.slice(0, 6).map(t => {
                const pct = t.accuracy !== null ? t.accuracy.toFixed(0) : 0;
                const color = t.accuracy >= 70 ? '#34d399' : t.accuracy >= 50 ? '#fbbf24' : '#fb7185';
                return `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:rgba(255,255,255,0.04);border-radius:6px;">
                    <span style="color:var(--txt);font-size:0.78rem;flex:1;">${escapeHtml(t.topic)}</span>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <div style="width:60px;background:rgba(0,0,0,0.4);height:4px;border-radius:2px;overflow:hidden;">
                        <div style="background:${color};height:100%;width:${pct}%;"></div>
                      </div>
                      <span style="color:${color};font-weight:bold;font-size:0.78rem;min-width:32px;text-align:right;">${pct}%</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}
          

          ${(() => {
            const hist = (stats.questionHistory || []).slice().reverse();
            if (hist.length < 3) return '';
            const days = {};
            hist.forEach(h => {
              const d = (h.date || '').slice(0,10);
              if (!d) return;
              if (!days[d]) days[d] = {correct:0,total:0};
              days[d].total++;
              if (h.correct) days[d].correct++;
            });
            const sorted = Object.keys(days).sort().slice(-7);
            if (sorted.length < 2) return '';
            const pts = sorted.map(d => ({ d, pct: Math.round(days[d].correct/days[d].total*100) }));
            const max = 100, h2 = 55, w = 400/(pts.length-1);
            const polyline = pts.map((p,i) => `${(i*w).toFixed(1)},${(h2 - p.pct/max*h2).toFixed(1)}`).join(' ');
            const dots = pts.map((p,i) => `<circle cx="${(i*w).toFixed(1)}" cy="${(h2 - p.pct/max*h2).toFixed(1)}" r="5" fill="${p.pct>=70?'#34d399':p.pct>=50?'#fbbf24':'#fb7185'}" />`).join('');
            const labels = pts.map((p,i) => `<text x="${(i*w).toFixed(1)}" y="${h2+16}" text-anchor="middle" fill="#64748b" font-size="11">${p.d.slice(5)}</text><text x="${(i*w).toFixed(1)}" y="${(h2 - p.pct/max*h2 - 8).toFixed(1)}" text-anchor="middle" fill="${p.pct>=70?'#34d399':p.pct>=50?'#fbbf24':'#fb7185'}" font-size="11" font-weight="bold">${p.pct}%</text>`).join('');
            return '<div style="text-align:left;margin-bottom:16px;">'
              + '<h3 style="color:var(--gold);margin-bottom:8px;font-size:0.9rem;font-family:\'Cinzel\',serif;letter-spacing:1px;">EVOLUÇÃO (ÚLTIMOS 7 DIAS)</h3>'
              + '<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;">'
              + '<svg viewBox="-8 -14 416 90" style="width:100%;display:block;">'
              + '<polyline points="' + polyline + '" fill="none" stroke="#6366f1" stroke-width="3" stroke-linejoin="round"/>'
              + dots + labels
              + '</svg>'
              + '</div>'
              + '</div>';
          })()}
          <button class="btn sec" data-action="confirmResetProgress"  style="margin-right:8px;background:rgba(251,113,133,0.15);border-color:rgba(251,113,133,0.4);color:#fb7185;font-size:0.78rem;">🗑️ Resetar Progresso</button>
          <button class="btn gold" data-close-closest=".modal">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);
      const radarCanvas = document.getElementById('nqRadarChart');
      if (radarCanvas && axisStats.length >= 3) {
        drawRadarChart(radarCanvas, axisStats);
        // Tooltip ao passar o mouse nos ícones do radar
        const _rTip = document.createElement('div');
        _rTip.style.cssText = 'position:fixed;pointer-events:none;background:#0e1830;border:1px solid rgba(139,92,246,0.5);color:#d5e2ff;padding:4px 10px;border-radius:7px;font-size:0.78rem;white-space:nowrap;z-index:99999;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.6);';
        document.body.appendChild(_rTip);
        const _rN = axisStats.length;
        const _rW = radarCanvas.width, _rH = radarCanvas.height;
        const _rCx = _rW / 2, _rCy = _rH / 2;
        const _rR = Math.min(_rCx, _rCy) - 36;
        const _rPts = axisStats.map((ax, i) => {
          const a = (i / _rN) * Math.PI * 2 - Math.PI / 2;
          return { x: _rCx + (_rR + 22) * Math.cos(a), y: _rCy + (_rR + 22) * Math.sin(a), label: ax.label, accuracy: ax.accuracy };
        });
        radarCanvas.addEventListener('mousemove', e => {
          const rect = radarCanvas.getBoundingClientRect();
          const scaleX = radarCanvas.width / rect.width;
          const scaleY = radarCanvas.height / rect.height;
          const mx = (e.clientX - rect.left) * scaleX;
          const my = (e.clientY - rect.top) * scaleY;
          const found = _rPts.find(pt => Math.hypot(mx - pt.x, my - pt.y) < 24);
          if (found) {
            const pct = found.accuracy != null ? found.accuracy.toFixed(0) + '%' : '—';
            _rTip.textContent = `${found.label} — ${pct} acerto`;
            _rTip.style.display = 'block';
            _rTip.style.left = (e.clientX + 14) + 'px';
            _rTip.style.top = (e.clientY - 12) + 'px';
          } else {
            _rTip.style.display = 'none';
          }
        });
        radarCanvas.addEventListener('mouseleave', () => { _rTip.style.display = 'none'; });
        // Limpa o tooltip quando o modal for removido do DOM
        const _rObs = new MutationObserver(() => {
          if (!document.contains(radarCanvas)) { _rTip.remove(); _rObs.disconnect(); }
        });
        _rObs.observe(document.body, { childList: true, subtree: false });
      }
      playSound('click');
    }

    function confirmResetProgress() {
      if (!confirm('⚠️ Apagar todo o histórico de estatísticas, questões dominadas e save atual?\n\nEsta ação não pode ser desfeita.')) return;
      localStorage.removeItem(STATS_STORAGE_KEY);
      localStorage.removeItem(MASTERED_KEY);
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(ACHIEVEMENTS_KEY);
      localStorage.removeItem(STUDY_SAVE_KEY);
      localStorage.removeItem(EXAM_SAVE_KEY);
      localStorage.removeItem('unlockedArticles');
      localStorage.removeItem('nefroquest-arqui-defeated');
      localStorage.removeItem('nefroquest-minigame-notified');
      localStorage.removeItem(SR_KEY);
      unlockedArticles = [];
      _masteredSet = new Set();
      chestCost = 100;
      _invalidateStatsCache();
      document.querySelectorAll('.stats-popup').forEach(el => el.remove());
      _toast('Progresso resetado. Começando do zero!', 'success');
    }

    // ============ MODO DE ESTUDO POR TEMA ============
    let selectedTopic = 'all';
    let studyMode = 'all'; // 'all', 'topic', 'review'
    
    function extractTopics() {
      const topicsSet = new Set();
      topics.forEach(q => {
        if (q.t) topicsSet.add(q.t);
      });
      return Array.from(topicsSet).sort();
    }
    
    // Eixos selecionados no Modo de Estudo
    let _studySelectedAxes = new Set();

    async function showTopicSelector() {
      if (typeof topics === 'undefined') {
        _toast('Carregando questões…', 'info', 30000);
        try { await window._loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      _studySelectedAxes = new Set(NEFRO_AXES.map(a => a.id));

      const isMobile = window.innerWidth <= 768;
      const modal = document.createElement('div');
      modal.className = 'modal show study-mode-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:' + (isMobile ? 'flex-start' : 'center') + ';justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:' + (isMobile ? '12px 12px calc(env(safe-area-inset-bottom,0px)+80px)' : '32px 16px') + ';box-sizing:border-box;';

      // Calcular SR due com todos os temas
      const totalDue = getSRDueQuestions(topics).length;
      const srLabel = totalDue > 0 ? `${totalDue} ${totalDue > 1 ? 'questões' : 'questão'} para revisar hoje` : 'Nenhuma revisão pendente hoje';
      const srColor = totalDue > 0 ? '#a78bfa' : 'var(--txt-dim)';

      modal.innerHTML = `
        <div class="modal-content" style="max-width:440px;width:100%;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:16px;padding:24px 20px;box-shadow:0 0 40px rgba(139,92,246,0.3);">
          <h2 style="color:var(--gold);margin:0 0 4px;font-family:'Cinzel',serif;font-size:1.1rem;">📖 MODO DE ESTUDO</h2>
          <p style="color:var(--txt-dim);font-size:0.8rem;margin:0 0 20px;">Escolha como quer estudar hoje</p>

          <!-- Opção 1: Estudo Livre -->
          <div style="border:2px solid rgba(251,191,36,0.35);border-radius:14px;padding:16px 16px 14px;margin-bottom:10px;background:rgba(251,191,36,0.04);text-align:left;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="font-size:1.6rem;line-height:1;flex-shrink:0;">🎲</div>
              <div style="color:var(--gold);font-weight:700;font-size:0.97rem;">Estudo Livre</div>
            </div>
            <div style="color:var(--txt-dim);font-size:0.82rem;line-height:1.5;margin-bottom:12px;">20 questões aleatórias de <strong style="color:var(--txt);">todos os temas</strong>. Sem configuração. Ideal para uma revisão rápida.</div>
            <button class="btn gold" data-action="startFreeStudyMode" style="width:100%;padding:10px;font-size:0.88rem;">Iniciar</button>
          </div>

          <!-- Opção 2: Por Tema -->
          <div style="border:2px solid rgba(96,165,250,0.35);border-radius:14px;padding:16px 16px 14px;margin-bottom:10px;background:rgba(96,165,250,0.04);text-align:left;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="font-size:1.6rem;line-height:1;flex-shrink:0;">📚</div>
              <div style="color:var(--blue);font-weight:700;font-size:0.97rem;">Por Tema</div>
            </div>
            <div style="color:var(--txt-dim);font-size:0.82rem;line-height:1.5;margin-bottom:12px;">Escolha os temas e pratique <strong style="color:var(--txt);">20 questões focadas</strong>. Útil quando quer reforçar um assunto específico.</div>
            <button class="btn" data-action="showAxesSelector" style="width:100%;padding:10px;font-size:0.88rem;border-color:var(--blue);color:var(--blue);">Selecionar Temas</button>
          </div>

          <!-- Opção 3: Revisão Espaçada -->
          <div style="border:2px solid rgba(167,139,250,0.35);border-radius:14px;padding:16px 16px 14px;margin-bottom:20px;background:rgba(167,139,250,0.04);text-align:left;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="font-size:1.6rem;line-height:1;flex-shrink:0;">📅</div>
              <div style="color:#a78bfa;font-weight:700;font-size:0.97rem;">Revisão Espaçada</div>
            </div>
            <div style="color:var(--txt-dim);font-size:0.82rem;line-height:1.5;margin-bottom:6px;">O sistema decide o que você precisa rever. Retém mais com menos esforço.</div>
            <div style="margin-bottom:12px;font-size:0.78rem;color:${srColor};font-weight:600;">📅 ${srLabel}</div>
            <button class="btn" data-action="startSRStudyAllMode" style="width:100%;padding:10px;font-size:0.88rem;border-color:#8b5cf6;color:#c4b5fd;${totalDue === 0 ? 'opacity:0.5;cursor:not-allowed;' : ''}">Revisar Agora</button>
          </div>

          <button class="btn sec" data-close-closest=".modal" style="width:100%;">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('click');
    }

    function showAxesSelector() {
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      _studySelectedAxes = new Set(NEFRO_AXES.map(a => a.id));

      const isMobile = window.innerWidth <= 768;
      const modal = document.createElement('div');
      modal.className = 'modal show study-mode-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:' + (isMobile ? 'flex-start' : 'center') + ';justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:' + (isMobile ? '12px 12px calc(env(safe-area-inset-bottom,0px)+80px)' : '32px 16px') + ';box-sizing:border-box;';

      const stats = getDetailedStats();

      function renderAxesHTML() {
        return NEFRO_AXES.map(axis => {
          const sel = _studySelectedAxes.has(axis.id);
          const axisData = getAxisStats(stats).find(a => a.id === axis.id);
          const qCount = topics.filter(q => q.cat === axis.cat).length;
          const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
          const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
          return `
            <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
              style="cursor:pointer;padding:8px 10px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.4rem;">${axis.icon}</span>
              <div style="flex:1;text-align:left;">
                <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
                <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
              </div>
              <div style="text-align:right;">
                <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
                <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
              </div>
              <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      modal.innerHTML = `
        <div class="modal-content" style="max-width:460px;width:100%;max-height:calc(100vh - 48px);overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:18px 20px;box-shadow:0 0 40px rgba(139,92,246,0.3);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <button class="btn sec" data-action="showTopicSelector" style="padding:4px 10px;font-size:0.78rem;">← Voltar</button>
            <h2 style="color:var(--blue);margin:0;font-family:'Cinzel',serif;font-size:1rem;flex:1;">📚 Escolha os Temas</h2>
          </div>
          <p style="color:var(--txt-dim);font-size:0.78rem;margin:0 0 14px;">20 questões serão sorteadas dos temas selecionados</p>

          <div style="margin-bottom:10px;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px;">
              <button class="btn sec" data-action="_selectTrail" data-arg="residencia" style="font-size:0.72rem;padding:4px 9px;">🏥 Residência</button>
              <button class="btn sec" data-action="_selectTrail" data-arg="titulo" style="font-size:0.72rem;padding:4px 9px;">📋 Título</button>
              <button class="btn sec" data-action="_selectTrail" data-arg="eletrolitos" style="font-size:0.72rem;padding:4px 9px;">⚡ Eletrólitos & AB</button>
            </div>
          </div>

          <div id="axisCardList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">
            ${renderAxesHTML()}
          </div>

          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:14px;">
            <button class="btn sec" data-action="_studySelectAll" data-arg="true" data-arg-type="boolean" style="font-size:0.76rem;padding:6px 12px;">✓ Todos</button>
            <button class="btn sec" data-action="_studySelectAll" data-arg="false" data-arg-type="boolean" style="font-size:0.76rem;padding:6px 12px;">✗ Nenhum</button>
          </div>

          <button class="btn gold" data-action="startStudyMode" style="width:100%;padding:12px;">📚 Iniciar Sessão</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('click');
    }

    function _studyToggleAxis(id) {
      if (_studySelectedAxes.has(id)) _studySelectedAxes.delete(id);
      else _studySelectedAxes.add(id);
      // Re-render cards
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      list.innerHTML = NEFRO_AXES.map(axis => {
        const sel = _studySelectedAxes.has(axis.id);
        const axisData = getAxisStats(stats).find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.4rem;">${axis.icon}</span>
            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    function _studySelectAll(sel) {
      if (sel) NEFRO_AXES.forEach(a => _studySelectedAxes.add(a.id));
      else _studySelectedAxes.clear();
      // Re-render todos os cards
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      list.innerHTML = NEFRO_AXES.map(axis => {
        const selected = _studySelectedAxes.has(axis.id);
        const axisData = getAxisStats(stats).find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${selected ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.4rem;">${axis.icon}</span>
            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${selected ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${selected ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${selected ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    const _TRAILS = {
      residencia:  ['lra', 'eletrólitos', 'hipertensao', 'infeccao', 'glomerular', 'acido_base'],
      titulo:      ['glomerular', 'transplante', 'dialise', 'genetica', 'drc', 'acido_base', 'nefropatia_diabetica', 'farmacologia'],
      eletrolitos: ['eletrólitos', 'acido_base'],
    };

    function _selectTrail(trailId) {
      const ids = _TRAILS[trailId];
      if (!ids) return;
      _studySelectedAxes.clear();
      ids.forEach(id => _studySelectedAxes.add(id));
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      list.innerHTML = NEFRO_AXES.map(axis => {
        const sel = _studySelectedAxes.has(axis.id);
        const axisData = getAxisStats(stats).find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.4rem;">${axis.icon}</span>
            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    // Estado do modo de estudo
    const STUDY_SAVE_KEY = 'nefroquest-study-state';
    const STUDY_TTL_MS   = 24 * 60 * 60 * 1000; // 24h

    function _saveStudyState() {
      if (!studyModeActive || !studyModeQuestions.length) return;
      try {
        localStorage.setItem(STUDY_SAVE_KEY, JSON.stringify({
          questions: studyModeQuestions.map(q => q.qid || q.id || q.q.substring(0, 40)),
          index: studyModeIndex,
          correct: studyModeCorrect,
          wrong: studyModeWrong,
          savedAt: Date.now()
        }));
      } catch(e) {}
    }

    function _loadStudyState() {
      try {
        const raw = localStorage.getItem(STUDY_SAVE_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s?.questions?.length) return null;
        if (Date.now() - s.savedAt > STUDY_TTL_MS) { localStorage.removeItem(STUDY_SAVE_KEY); return null; }
        return s;
      } catch(e) { return null; }
    }

    function _clearStudyState() {
      try { localStorage.removeItem(STUDY_SAVE_KEY); } catch(e) {}
    }

    let studyModeActive = false;
    let studyModeQuestions = [];
    let studyModeIndex = 0;
    let studyModeCorrect = 0;
    let studyModeWrong = 0;
    let _studyAxisStats = {};  // { cat: { correct, wrong } } — reset each session

    // ── Mentor quota (free: 5/day) + Diagnosis quota (free: 3/day) ──────────
    const MENTOR_QUOTA_KEY = 'nq-mentor-quota';
    const DIAG_QUOTA_KEY   = 'nq-diag-quota';
    const MENTOR_DAILY_LIMIT = 5;
    const DIAG_DAILY_LIMIT   = 3;
    let _mentorCurrentQ = null;
    let _mentorHistory = [];

    async function startFreeStudyMode() {
      if (typeof topics === 'undefined') {
        _toast('Carregando questões…', 'info', 30000);
        try { await window._loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }
      // Estudo Livre: 20 questões aleatórias de TODOS os temas, sem precisar selecionar eixos
      _studySelectedAxes = new Set(NEFRO_AXES.map(a => a.id));
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      studyModeQuestions = shuffle([...topics]).slice(0, 20);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      _studyAxisStats = {};
      showStudyModePage();
    }

    async function startSRStudyAllMode() {
      if (typeof topics === 'undefined') {
        _toast('Carregando questões…', 'info', 30000);
        try { await window._loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }
      // Revisão Espaçada com todos os temas
      _studySelectedAxes = new Set(NEFRO_AXES.map(a => a.id));
      const due = getSRDueQuestions(topics);
      if (due.length === 0) {
        _toast('Nenhuma revisão pendente hoje. Volte amanhã ou use o Estudo Livre.', 'info', 4000);
        return;
      }
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      studyModeQuestions = shuffle(due);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      _studyAxisStats = {};
      showStudyModePage('revisão espaçada');
    }

    function _getMentorQuota() {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const stored = JSON.parse(localStorage.getItem(MENTOR_QUOTA_KEY) || '{}');
        if (stored.date !== today) return { date: today, count: 0 };
        return stored;
      } catch { return { date: today, count: 0 }; }
    }

    function _renderMentorMarkdown(text) {
      // Escapa HTML primeiro para evitar XSS
      let s = escapeHtml(text);
      // Títulos: ### → h4, ## → h3, # → h3
      s = s.replace(/^### (.+)$/gm, '<h4 style="color:var(--gold);margin:10px 0 4px;font-size:0.9rem;">$1</h4>');
      s = s.replace(/^## (.+)$/gm, '<h3 style="color:var(--blue);margin:12px 0 5px;font-size:0.95rem;">$1</h3>');
      s = s.replace(/^# (.+)$/gm, '<h3 style="color:var(--gold);margin:12px 0 5px;font-size:1rem;">$1</h3>');
      // Negrito e itálico
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Listas com -
      s = s.replace(/^- (.+)$/gm, '<li style="margin:2px 0;">$1</li>');
      s = s.replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:6px 0 6px 16px;padding:0;">$&</ul>');
      // Quebras de linha
      s = s.replace(/\n/g, '<br>');
      // Limpar <br> após tags de bloco
      s = s.replace(/<br>(<\/?(?:h[34]|ul|li))/g, '$1');
      return s;
    }

    function _canAskMentor() {
      if (isPremium()) return true;
      return _getMentorQuota().count < MENTOR_DAILY_LIMIT;
    }

    function _incrementMentorQuota() {
      if (isPremium()) return;
      const q = _getMentorQuota();
      q.count = (q.count || 0) + 1;
      localStorage.setItem(MENTOR_QUOTA_KEY, JSON.stringify(q));
    }

    function _mentorRemainingText() {
      if (isPremium()) return '';
      const { count } = _getMentorQuota();
      const rem = Math.max(0, MENTOR_DAILY_LIMIT - count);
      return `${rem}/${MENTOR_DAILY_LIMIT} perguntas restantes hoje`;
    }

    function _diagRemainingText() {
      if (isPremium()) return '';
      const { count } = _getDiagQuota();
      const rem = Math.max(0, DIAG_DAILY_LIMIT - count);
      return `${rem}/${DIAG_DAILY_LIMIT} diagnósticos restantes hoje`;
    }

    function _buildAxisBarsHtml() {
      const entries = Object.entries(_studyAxisStats);
      if (entries.length === 0) return '';
      const sorted = entries
        .map(([cat, s]) => {
          const axis = NEFRO_AXES.find(a => a.cat === cat);
          const total = s.correct + s.wrong;
          const pct = total > 0 ? Math.round((s.correct / total) * 100) : 0;
          return { label: axis ? `${axis.icon} ${axis.label}` : cat, pct };
        })
        .sort((a, b) => a.pct - b.pct);
      const bars = sorted.map(({ label, pct }) => {
        const color = pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185';
        return `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <div style="flex:0 0 150px;font-size:0.73rem;color:var(--txt-dim);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
            <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:4px;height:12px;overflow:hidden;">
              <div style="width:${pct}%;background:${color};height:100%;border-radius:4px;"></div>
            </div>
            <div style="flex:0 0 34px;font-size:0.73rem;color:${color};font-weight:bold;">${pct}%</div>
          </div>`;
      }).join('');
      return `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px 16px 10px;margin-bottom:20px;text-align:left;">
          <div style="font-size:0.75rem;color:var(--txt-dim);margin-bottom:12px;text-align:center;letter-spacing:0.05em;text-transform:uppercase;">Desempenho por Eixo</div>
          ${bars}
        </div>`;
    }

    function _getDiagQuota() {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const stored = JSON.parse(localStorage.getItem(DIAG_QUOTA_KEY) || '{}');
        if (stored.date !== today) return { date: today, count: 0 };
        return stored;
      } catch { return { date: today, count: 0 }; }
    }

    function _canRunDiagnosis() {
      if (isPremium()) return true;
      return _getDiagQuota().count < DIAG_DAILY_LIMIT;
    }

    function _incrementDiagQuota() {
      if (isPremium()) return;
      const q = _getDiagQuota();
      q.count = (q.count || 0) + 1;
      localStorage.setItem(DIAG_QUOTA_KEY, JSON.stringify(q));
    }
    
    function startStudyMode() {
      if (_studySelectedAxes.size === 0) {
        _toast('Selecione pelo menos um eixo para estudar!', 'warning');
        return;
      }

      // Verificar sessão salva
      const saved = _loadStudyState();
      if (saved) {
        // Reconstituir questions a partir dos qids salvos
        const savedIds = new Set(saved.questions);
        const restored = topics.filter(q => savedIds.has(q.qid || q.id || q.q.substring(0, 40)));
        if (restored.length > 0 && confirm(`Você tem uma sessão de estudo em andamento (${saved.index}/${saved.questions.length} questões). Continuar?`)) {
          studyModeQuestions = restored;
          studyModeIndex = Math.min(saved.index, restored.length - 1);
          studyModeCorrect = saved.correct || 0;
          studyModeWrong = saved.wrong || 0;
          studyModeActive = true;
          showStudyModePage();
          return;
        } else {
          _clearStudyState();
        }
      }

      // Coletar categorias dos eixos selecionados
      const selectedCats = new Set();
      NEFRO_AXES.forEach(axis => {
        if (_studySelectedAxes.has(axis.id)) selectedCats.add(axis.cat);
      });

      // Filtrar questões pelas categorias selecionadas
      studyModeQuestions = topics.filter(q => selectedCats.has(q.cat));
      
      if (studyModeQuestions.length === 0) {
        _toast('Nenhuma questão encontrada para os temas selecionados.', 'warning');
        return;
      }
      
      // Embaralhar e limitar sessão a 20 questões
      studyModeQuestions = shuffle(studyModeQuestions).slice(0, 20);
      studyModeIndex = 0;
      studyModeCorrect = 0;
      studyModeWrong = 0;
      studyModeActive = true;
      _studyAxisStats = {};

      // Fechar popup de seleção
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());

      // Abrir página de estudo (sem música — modo de estudo é silencioso)
      showStudyModePage();
    }
    
    function showStudyModePage(sessionLabel) {
      // Esconder o jogo principal
      document.querySelector('.app').classList.add('hidden');
      document.querySelector('.welcome-screen')?.classList.add('hidden');
      
      // Remover página anterior se existir
      document.getElementById('studyModePage')?.remove();
      
      const page = document.createElement('div');
      page.id = 'studyModePage';
      page.style.cssText = 'position:fixed;inset:0;z-index:1000;background:linear-gradient(180deg,#0a1020 0%,#060d18 100%);overflow-y:auto;';
      page.innerHTML = `
        <div style="max-width:900px;margin:0 auto;padding:20px;min-height:100%;padding-bottom:100px;">
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:8px;flex-wrap:nowrap;">
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <button class="btn sec" data-action="exitStudyMode" style="font-size:0.78rem;padding:6px 12px;white-space:nowrap;">
                ← Voltar
              </button>
              <!-- Contadores ao lado do botão Voltar -->
              <div style="display:inline-flex;gap:8px;align-items:center;background:rgba(10,15,30,0.6);border:1px solid rgba(255,215,0,0.15);border-radius:16px;padding:4px 10px;white-space:nowrap;">
                <span style="color:#34d399;font-weight:bold;font-size:0.9rem;" id="studyCorrect">${studyModeCorrect}</span><span style="color:#34d399;font-size:0.75rem;">✓</span>
                <span style="color:rgba(255,215,0,0.2);font-size:0.85rem;">|</span>
                <span style="color:#fb7185;font-weight:bold;font-size:0.9rem;" id="studyWrong">${studyModeWrong}</span><span style="color:#fb7185;font-size:0.75rem;">✗</span>
              </div>
            </div>
            <div style="text-align:center;flex:1;">
              <h1 style="font-family:'MedievalSharp','Cinzel',serif;color:var(--gold);font-size:1.1rem;margin:0;">${sessionLabel === 'reforço' ? '🎯 Sessão de Reforço' : '📖 Modo de Estudo'}</h1>
            </div>
            <div style="color:var(--txt-dim);font-size:0.85rem;flex-shrink:0;">
              <span id="studyProgress">${studyModeIndex + 1}</span>/${studyModeQuestions.length}
            </div>
          </div>
          
          <!-- Question Area -->
          <div id="studyQuestionArea" style="background:linear-gradient(180deg,#1a1228,#12192e);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 30px rgba(30,60,120,0.3);">
            <!-- Questão será renderizada aqui -->
          </div>
        </div>
      `;
      document.body.appendChild(page);
      
      renderStudyQuestion();
    }
    
    function renderStudyQuestion() {
      if (studyModeIndex >= studyModeQuestions.length) {
        showStudyModeResults();
        return;
      }
      
      const q = studyModeQuestions[studyModeIndex];
      const area = document.getElementById('studyQuestionArea');
      
      area.innerHTML = `
        <div style="margin-bottom:16px;">
          <span style="background:rgba(139,92,246,0.2);color:#a78bfa;padding:4px 10px;border-radius:4px;font-size:0.75rem;">
            ${escapeHtml(q.t || 'Geral')}
          </span>
        </div>
        
        <h3 style="color:var(--txt);font-size:1.1rem;line-height:1.6;margin-bottom:24px;">
          ${escapeHtml(q.q)}
        </h3>

        <div id="studyOptions" style="display:grid;gap:10px;">
          ${q.opts.map((opt, idx) => `
            <button class="study-option-btn" data-action="answerStudyQuestion" data-arg="${idx}" data-arg-type="number"
                    style="background:linear-gradient(180deg,#1e293b,#0f172a);border:2px solid #334155;border-radius:10px;padding:14px 18px;text-align:left;color:var(--txt);font-size:0.95rem;cursor:pointer;transition:all 0.2s;"
                    onmouseover="this.style.borderColor='var(--blue)';this.style.background='linear-gradient(180deg,#1e3a5f,#0f172a)'"
                    onmouseout="this.style.borderColor='#334155';this.style.background='linear-gradient(180deg,#1e293b,#0f172a)'">
              <span style="color:var(--blue);font-weight:bold;margin-right:8px;">${String.fromCharCode(65 + idx)})</span>
              ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
        
        <div id="studyFeedback" style="display:none;margin-top:20px;"></div>
      `;
      
      document.getElementById('studyProgress').textContent = studyModeIndex + 1;
    }
    
    function answerStudyQuestion(selectedIdx) {
      if (studyModeIndex >= studyModeQuestions.length) return;
      const q = studyModeQuestions[studyModeIndex];
      const isCorrect = selectedIdx === q.ans;
      
      // Desabilitar botões
      document.querySelectorAll('.study-option-btn').forEach((btn, idx) => {
        btn.disabled = true;
        btn.style.cursor = 'default';
        btn.onmouseover = null;
        btn.onmouseout = null;
        
        if (idx === q.ans) {
          btn.style.borderColor = '#34d399';
          btn.style.background = 'rgba(52,211,153,0.15)';
        } else if (idx === selectedIdx && !isCorrect) {
          btn.style.borderColor = '#fb7185';
          btn.style.background = 'rgba(251,113,133,0.15)';
        }
      });
      
      // Atualizar contadores
      updateSRData(q.qid, isCorrect);
      localStorage.setItem('nq_last_study', Date.now().toString());
      if (isCorrect) {
        studyModeCorrect++;
        document.getElementById('studyCorrect').textContent = studyModeCorrect;
      } else {
        studyModeWrong++;
        document.getElementById('studyWrong').textContent = studyModeWrong;
      }

      // Rastrear desempenho por eixo temático
      if (q.cat) {
        _studyAxisStats[q.cat] = _studyAxisStats[q.cat] || { correct: 0, wrong: 0 };
        _studyAxisStats[q.cat][isCorrect ? 'correct' : 'wrong']++;
      }

      // Botão de mentor (apenas em erros)
      const mentorBtnHtml = !isCorrect ? `
        <div style="text-align:center;margin-top:10px;">
          ${_canAskMentor()
            ? `<button class="btn ghost" style="font-size:0.78rem;padding:7px 16px;" data-action="openMentorModal">
                🔮 Consultar o Oráculo <span style="font-size:0.68rem;opacity:0.6;">(${_mentorRemainingText()})</span>
               </button>`
            : `<div style="font-size:0.75rem;color:var(--txt-dim);margin-top:4px;">Limite diário de perguntas atingido — <button class="btn ghost" style="font-size:0.72rem;padding:4px 10px;" data-action="showPricingModal">Premium ilimitado</button></div>`
          }
        </div>` : '';

      // Mostrar feedback
      const feedback = document.getElementById('studyFeedback');
      feedback.style.display = 'block';
      feedback.innerHTML = `
        <div style="background:${isCorrect ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)'};border:2px solid ${isCorrect ? '#34d399' : '#fb7185'};border-radius:10px;padding:16px;">
          <div style="color:${isCorrect ? '#34d399' : '#fb7185'};font-weight:bold;margin-bottom:8px;">
            ${isCorrect ? '✓ Correto!' : '✗ Incorreto'}
          </div>
          <div style="color:var(--txt);font-size:0.9rem;line-height:1.5;">
            ${escapeHtml(q.exp || 'A resposta correta é a alternativa ' + String.fromCharCode(65 + q.ans) + '.')}
          </div>
          ${(q.refs||[]).length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${(q.refs||[]).map(k => refsDB[k] ? `<a href="https://scholar.google.com/scholar?q=${encodeURIComponent(refsDB[k].label)}" target="_blank" rel="noopener" style="color:var(--blue);font-size:0.72rem;text-decoration:none;border:1px solid rgba(96,165,250,0.3);padding:2px 9px;border-radius:12px;white-space:nowrap;">🔗 ${escapeHtml(refsDB[k].label)}</a>` : '').filter(Boolean).join('')}</div>` : ''}
        </div>
        ${mentorBtnHtml}
        <div style="text-align:center;margin-top:16px;">
          <button class="btn gold" data-action="nextStudyQuestion">
            ${studyModeIndex + 1 < studyModeQuestions.length ? 'Próxima Questão' : 'Ver Resultados'}
          </button>
        </div>
      `;

      // Guardar questão atual para o mentor
      _mentorCurrentQ = q;
      _mentorHistory = [];

      playSound(isCorrect ? 'correct' : 'wrong');
    }
    
    function nextStudyQuestion() {
      studyModeIndex++;
      _saveStudyState();
      renderStudyQuestion();
    }
    
    function showStudyModeResults() {
      const total = studyModeQuestions.length;
      const accuracy = total > 0 ? Math.round((studyModeCorrect / total) * 100) : 0;

      const area = document.getElementById('studyQuestionArea');
      area.innerHTML = `
        <div style="text-align:center;">
          <h2 style="color:var(--gold);font-family:'MedievalSharp','Cinzel',serif;margin-bottom:20px;">
            🎉 Estudo Concluído! 🎉
          </h2>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
            <div style="background:rgba(59,130,246,0.15);border:2px solid rgba(59,130,246,0.4);border-radius:10px;padding:16px;">
              <div style="font-size:2rem;color:#3b82f6;font-weight:bold;">${total}</div>
              <div style="font-size:0.8rem;color:var(--txt-dim);">Questões</div>
            </div>
            <div style="background:rgba(52,211,153,0.15);border:2px solid rgba(52,211,153,0.4);border-radius:10px;padding:16px;">
              <div style="font-size:2rem;color:#34d399;font-weight:bold;">${studyModeCorrect}</div>
              <div style="font-size:0.8rem;color:var(--txt-dim);">Acertos</div>
            </div>
            <div style="background:rgba(251,113,133,0.15);border:2px solid rgba(251,113,133,0.4);border-radius:10px;padding:16px;">
              <div style="font-size:2rem;color:#fb7185;font-weight:bold;">${studyModeWrong}</div>
              <div style="font-size:0.8rem;color:var(--txt-dim);">Erros</div>
            </div>
          </div>

          <div style="background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.3);border-radius:10px;padding:20px;margin-bottom:24px;">
            <div style="font-size:2.5rem;color:var(--gold);font-weight:bold;">${accuracy}%</div>
            <div style="color:var(--txt-dim);">Taxa de Acerto</div>
          </div>

          ${_buildAxisBarsHtml()}

          <div id="aiDiagnosisCard" class="ai-diagnosis-card ai-diagnosis-loading">
            <div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão
              ${!isPremium() ? `<span style="font-size:0.68rem;opacity:0.55;font-weight:normal;margin-left:8px;">${_diagRemainingText()}</span>` : ''}
            </div>
            <div class="ai-diagnosis-spinner"></div>
          </div>

          <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;">
            <button class="btn sec" data-action="exitStudyMode">← Voltar</button>
            <button class="btn gold" data-action="restartStudyMode">Estudar Novamente</button>
          </div>
        </div>
      `;

      playSound('victory');

      // Buscar diagnóstico IA em background — graceful degradation se falhar
      if (total > 0) {
        _fetchDiagnosis(total, studyModeCorrect, studyModeWrong, accuracy);
      } else {
        document.getElementById('aiDiagnosisCard')?.remove();
      }
    }

    async function _fetchDiagnosis(total, correct, wrong, accuracy) {
      const card = document.getElementById('aiDiagnosisCard');
      if (!card) return;

      if (!_canRunDiagnosis()) {
        card.innerHTML = `<div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão</div>
          <div style="color:var(--txt-dim);font-size:0.82rem;padding:8px 0;">Limite diário de diagnósticos atingido (${DIAG_DAILY_LIMIT}/dia). Volte amanhã ou <strong style="color:var(--gold);">faça upgrade para Premium</strong> para uso ilimitado.</div>`;
        card.classList.remove('ai-diagnosis-loading');
        return;
      }
      _incrementDiagQuota();

      // Montar array de eixos com estatísticas
      const axes = Object.entries(_studyAxisStats).map(([cat, stats]) => {
        const axis = NEFRO_AXES.find(a => a.cat === cat);
        return { name: axis ? axis.label : cat, correct: stats.correct, wrong: stats.wrong };
      });

      try {
        const _diagToken = (typeof window.getAuthToken === 'function') ? (await window.getAuthToken()) : null;
        const res = await fetch(`${SUPA_URL}/functions/v1/ai-diagnosis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': `Bearer ${_diagToken || SUPA_KEY}` },
          body: JSON.stringify({ axes, totalCorrect: correct, totalWrong: wrong, accuracy }),
        });

        if (res.status === 429) {
          card.classList.remove('ai-diagnosis-loading');
          card.innerHTML = `<div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão</div><div class="ai-diagnosis-body" style="text-align:center;padding:16px 0;color:var(--txt-dim);">Limite diário atingido.<br><span style="font-size:0.8rem;">Volte amanhã ou <strong style="color:var(--gold);cursor:pointer;" onclick="showPremiumModal()">faça upgrade para Premium</strong>.</span></div>`;
          return;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const { diagnosis } = await res.json();
        if (!diagnosis) throw new Error('empty');

        // Verificar se há pontos fracos para reforço (cat com acerto < 60%)
        const weakCats = _getWeakCats();
        const hasWeak = weakCats.length > 0;

        card.classList.remove('ai-diagnosis-loading');
        card.innerHTML = `
          <div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão
            ${!isPremium() ? `<span style="font-size:0.68rem;opacity:0.55;font-weight:normal;margin-left:8px;">${_diagRemainingText()}</span>` : ''}
          </div>
          <div class="ai-diagnosis-body">${_renderMentorMarkdown(diagnosis)}</div>
          ${!isPremium() ? `<div style="font-size:0.7rem;color:var(--txt-dim);margin-top:10px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">🔮 Oráculo: ${_mentorRemainingText()} &nbsp;·&nbsp; 🤖 Diagnóstico: ${_diagRemainingText()}</div>` : ''}
          ${hasWeak ? `
          <div style="margin-top:14px;text-align:center;">
            <button class="btn reinforcement-btn" data-action="startReinforcementSession">
              🎯 Treinar pontos fracos <span style="font-size:0.72rem;opacity:0.7;">(${_countReinforcementQuestions(weakCats)} questões)</span>
            </button>
          </div>` : ''}
        `;
      } catch {
        card.remove();
      }
    }

    function _getWeakCats() {
      return Object.entries(_studyAxisStats)
        .filter(([, s]) => {
          const total = s.correct + s.wrong;
          return total > 0 && (s.correct / total) < 0.6;
        })
        .map(([cat]) => cat);
    }

    function _countReinforcementQuestions(weakCats) {
      const pool = topics.filter(q => weakCats.includes(q.cat));
      return Math.min(7, pool.length);
    }

    function startReinforcementSession() {
      const weakCats = _getWeakCats();
      if (weakCats.length === 0) {
        _toast('Nenhum ponto fraco identificado — sessão excelente!', 'success');
        return;
      }

      // Filtrar questões das categorias fracas, priorizando revisões pendentes
      const pool = topics.filter(q => weakCats.includes(q.cat));
      const due   = getSRDueQuestions(pool);
      // Se não há revisões pendentes, usa o pool completo
      const source = due.length >= 3 ? due : pool;
      const questions = shuffle(source).slice(0, 7);

      if (questions.length === 0) {
        _toast('Sem questões disponíveis para esses eixos.', 'warning');
        return;
      }

      // Lançar mini-sessão reutilizando o fluxo existente
      studyModeQuestions = questions;
      studyModeIndex     = 0;
      studyModeCorrect   = 0;
      studyModeWrong     = 0;
      studyModeActive    = true;
      _studyAxisStats    = {};
      _clearStudyState();

      // Label especial para sessão de reforço
      showStudyModePage('reforço');
    }

    window.startReinforcementSession = startReinforcementSession;
    window.showAxesSelector      = showAxesSelector;
    window.startFreeStudyMode    = startFreeStudyMode;
    window.startSRStudyAllMode   = startSRStudyAllMode;
    
    function restartStudyMode() {
      _clearStudyState();
      studyModeQuestions = shuffle(studyModeQuestions);
      studyModeIndex = 0;
      studyModeCorrect = 0;
      studyModeWrong = 0;
      renderStudyQuestion();
    }
    
    function exitStudyMode() {
      _clearStudyState();
      studyModeActive = false;
      document.getElementById('studyModePage')?.remove();
      document.querySelector('.app').classList.remove('hidden');
      
      // Se não tinha jogo iniciado, mostrar welcome
      if (!state.gameStarted) {
        document.querySelector('.welcome-screen')?.classList.remove('hidden');
        refreshWelcomeSave();
      }
    }

    // ── Mentor Modal ────────────────────────────────────────────────────────
    function openMentorModal() {
      const q = _mentorCurrentQ;
      if (!q) return;

      // Remove existing overlay if any
      document.getElementById('mentorOverlay')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'mentorOverlay';
      overlay.className = 'mentor-overlay';
      overlay.innerHTML = `
        <div class="mentor-modal" role="dialog" aria-modal="true" aria-label="Oráculo dos Néfrons">
          <div style="position:relative;overflow:hidden;border-radius:17px 17px 0 0;flex-shrink:0;">
            <img src="assets/images/oraculo-nefrons.webp" alt="Oráculo dos Néfrons"
              style="width:100%;height:178px;object-fit:cover;object-position:center 38%;display:block;"
              onerror="this.style.display='none'">
            <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.06) 0%,rgba(9,13,35,0.52) 48%,#131d35 100%);pointer-events:none;"></div>
            <div style="position:absolute;inset:0;background:radial-gradient(ellipse 90% 65% at 50% 32%,rgba(168,85,247,0.16) 0%,transparent 68%);pointer-events:none;"></div>
            <div style="position:absolute;bottom:14px;left:0;right:0;text-align:center;pointer-events:none;">
              <div style="color:#f0e6ff;font-size:0.9rem;font-weight:700;letter-spacing:0.1em;text-shadow:0 0 22px rgba(168,85,247,1),0 2px 8px rgba(0,0,0,1);">ORÁCULO DOS NÉFRONS</div>
              <div style="color:#c4a6e0;font-size:0.63rem;letter-spacing:0.14em;margin-top:4px;text-shadow:0 1px 5px rgba(0,0,0,1);">✦ A Sabedoria dos Rins ✦</div>
            </div>
            <button class="mentor-close-btn" data-action="closeMentorModal" aria-label="Fechar"
              style="position:absolute;top:10px;right:12px;background:rgba(0,0,0,0.58);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:4px 9px;line-height:1;z-index:2;">✕</button>
          </div>
          <div class="mentor-context">
            <div class="mentor-context-label">Questão em análise:</div>
            <div class="mentor-context-text">${escapeHtml(_firstSentence(q.q || '', 120))}</div>
          </div>
          <div class="mentor-chat" id="mentorChat"></div>
          <div class="mentor-quota-bar" id="mentorQuotaBar">${_mentorRemainingText()}</div>
          <div class="mentor-input-row">
            <textarea id="mentorInput" class="mentor-textarea"
              placeholder="O que você não entendeu? Qual foi o seu raciocínio?" rows="2"
              maxlength="400"></textarea>
            <button class="btn gold mentor-send-btn" data-action="_sendMentorMessage">Enviar</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('visible'));

      const input = document.getElementById('mentorInput');
      input?.focus();

      // Close on overlay click outside modal
      overlay.addEventListener('click', e => { if (e.target === overlay) closeMentorModal(); });

      // Enter to submit (Shift+Enter for newline)
      input?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _sendMentorMessage(); }
      });
    }

    function closeMentorModal() {
      const overlay = document.getElementById('mentorOverlay');
      if (!overlay) return;
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 280);
    }

    async function _sendMentorMessage() {
      const q = _mentorCurrentQ;
      const input = document.getElementById('mentorInput');
      const chat = document.getElementById('mentorChat');
      if (!input || !chat || !q) return;

      const text = input.value.trim();
      if (!text) return;

      if (!_canAskMentor()) {
        _appendMentorMsg(chat, 'system', 'Você atingiu o limite diário de 3 perguntas. Faça upgrade para Premium para perguntas ilimitadas.');
        return;
      }

      _appendMentorMsg(chat, 'user', text);
      input.value = '';
      input.disabled = true;

      const thinkingEl = _appendMentorMsg(chat, 'assistant', '...');
      thinkingEl.classList.add('mentor-thinking');

      try {
        const _mentorToken = (typeof window.getAuthToken === 'function') ? (await window.getAuthToken()) : null;
        const res = await fetch(`${SUPA_URL}/functions/v1/ai-mentor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': `Bearer ${_mentorToken || SUPA_KEY}` },
          body: JSON.stringify({
            questionText: q.q,
            options: q.opts,
            correctOption: q.opts?.[q.ans],
            explanation: q.exp,
            userQuestion: text,
            history: _mentorHistory,
          }),
        });

        const data = await res.json();
        if (res.status === 429) throw new Error('quota_exceeded');
        if (!res.ok || !data.reply) throw new Error(data.error || 'Erro ao contatar o mentor.');

        thinkingEl.classList.remove('mentor-thinking');
        thinkingEl.innerHTML = _renderMentorMarkdown(data.reply);

        // Update history for multi-turn
        _mentorHistory.push({ role: 'user', content: text });
        _mentorHistory.push({ role: 'assistant', content: data.reply });

        _incrementMentorQuota();

        const quotaBar = document.getElementById('mentorQuotaBar');
        if (quotaBar) quotaBar.textContent = _mentorRemainingText();

        // Update the mentor button in feedback if quota exhausted
        if (!_canAskMentor()) {
          document.querySelector('[data-action="openMentorModal"]')?.remove();
        }
      } catch (err) {
        _track('error_mentor_send', { msg: String(err) });
        thinkingEl.classList.remove('mentor-thinking');
        if (String(err).includes('quota_exceeded')) {
          thinkingEl.innerHTML = `Limite diário atingido. <span style="color:var(--gold);cursor:pointer;" onclick="showPremiumModal()">Faça upgrade para Premium</span> para perguntas ilimitadas.`;
        } else {
          thinkingEl.textContent = 'Oráculo indisponível no momento. Tente novamente em instantes.';
        }
        thinkingEl.style.color = '#fb7185';
      } finally {
        input.disabled = false;
        input.focus();
      }
    }

    function _appendMentorMsg(chat, role, text) {
      const el = document.createElement('div');
      el.className = `mentor-msg mentor-msg-${role}`;
      el.textContent = text;
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
      return el;
    }

    // Expose to dispatcher
    window.openMentorModal   = openMentorModal;
    window.closeMentorModal  = closeMentorModal;
    window._sendMentorMessage = _sendMentorMessage;
    window.setMentorQuestion = function(q) { _mentorCurrentQ = q; _mentorHistory = []; };
