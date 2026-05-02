// NefroQuest — Utilities & Spaced-Repetition core
// Loaded before game.js; all declarations become global.

    // ============ SISTEMA DE STREAK MULTIPLICADOR ============
    function getStreakMultiplier(streak) {
      if (streak >= 15) return { mult: 2.5, label: 'x2.5', css: 'streak-x5', fire: '🔥🔥🔥' };
      if (streak >= 10) return { mult: 2.0, label: 'x2', css: 'streak-x4', fire: '🔥🔥' };
      if (streak >= 7) return { mult: 1.75, label: 'x1.75', css: 'streak-x3', fire: '🔥' };
      if (streak >= 5) return { mult: 1.5, label: 'x1.5', css: 'streak-x2', fire: '🔥' };
      if (streak >= 3) return { mult: 1.25, label: 'x1.25', css: 'streak-x2', fire: '' };
      return { mult: 1, label: '', css: '', fire: '' };
    }

    function _track(event, params = {}) {
      try {
        if (typeof gtag === 'function') {
          gtag('event', event, params);
        }
        // _track envia via Sentry/analytics; descomente para debug local:
        // console.debug('[analytics]', event, params);
      } catch(e) { /* silencia erros de analytics */ }
    }

    // Toast centralizado — substitui alert() em toda a aplicação
    let _toastTimer = null;
    function _toast(msg, type = 'info', duration = 3000) {
      const existing = document.querySelector('.nq-toast');
      if (existing) existing.remove();
      if (_toastTimer) clearTimeout(_toastTimer);
      const el = document.createElement('div');
      el.className = 'nq-toast' + (type !== 'info' ? ' ' + type : '');
      el.textContent = msg;
      document.body.appendChild(el);
      _toastTimer = setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 260);
      }, duration);
    }

    function getTimeAgo(ts) {
      if (!ts) return '';
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'agora mesmo';
      if (mins < 60) return `há ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `há ${hours}h`;
      const days = Math.floor(hours / 24);
      return `há ${days} dia${days > 1 ? 's' : ''}`;
    }

    function escapeHtml(s) {
      if (s == null) return '';
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function _firstSentence(text, maxLen) {
      if (!text) return '';
      maxLen = maxLen || 140;
      const dot = text.search(/\.\s+[A-ZÁÉÍÓÚÀÂÊÔÇÃ]/);
      const cut = dot > 30 && dot < maxLen ? dot + 1 : Math.min(text.length, maxLen);
      return text.substring(0, cut).trim();
    }

    // ── Spaced Repetition (SM-2) ──────────────────────────────────────────
    const SR_KEY = 'nefroquest-sr-data';
    function _loadSRData() {
      try { return JSON.parse(localStorage.getItem(SR_KEY) || '{}'); } catch { return {}; }
    }
    function _saveSRData(d) {
      try { localStorage.setItem(SR_KEY, JSON.stringify(d)); } catch {}
    }
    function updateSRData(qid, isCorrect) {
      if (!qid) return;
      const data = _loadSRData();
      const today = new Date().setHours(0,0,0,0);
      const card = data[qid] || { ef: 2.5, interval: 1, reps: 0, due: today };
      const q = isCorrect ? 4 : 1;
      card.ef = Math.max(1.3, card.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (isCorrect) {
        card.reps++;
        card.interval = card.reps === 1 ? 1 : card.reps === 2 ? 6 : Math.ceil(card.interval * card.ef);
      } else {
        card.reps = 0;
        card.interval = 1;
      }
      card.due = today + card.interval * 86400000;
      data[qid] = card;
      _saveSRData(data);
    }
    function getSRDueQuestions(qs) {
      const data = _loadSRData();
      const today = new Date().setHours(0,0,0,0);
      return qs.filter(q => !q.qid || !data[q.qid] || data[q.qid].due <= today);
    }
