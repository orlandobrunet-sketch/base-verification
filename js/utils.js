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

    // ── Biblioteca de Referências ─────────────────────────────────────────
    let _bibItems = null;
    function _buildBibItems() {
      if (_bibItems) return _bibItems;
      const items = [];

      // Normalize refsDB (object keyed by id)
      if (typeof refsDB === 'object' && refsDB !== null) {
        Object.values(refsDB).forEach(r => {
          items.push({
            label:     r.label || '',
            autores:   '',
            jornal:    r.journal || '',
            ano:       r.ano || '',
            tipo:      r.badge || 'REF',
            tipoColor: r.badgeColor || '#64748b',
            impacto:   r.impacto || '',
            url:       r.url || '',
            icon:      r.icon || '📖',
          });
        });
      }

      // Normalize nefroArticles (array)
      if (typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)) {
        nefroArticles.forEach(a => {
          items.push({
            label:     a.titulo || '',
            autores:   a.autores || '',
            jornal:    a.jornal || '',
            ano:       a.ano || '',
            tipo:      'ARTIGO',
            tipoColor: '#0e7490',
            impacto:   a.impacto || '',
            url:       '',
            icon:      '📄',
          });
        });
      }

      // Sort A-Z by label
      items.sort((a, b) => a.label.localeCompare(b.label, 'pt', { sensitivity: 'base' }));
      _bibItems = items;
      return _bibItems;
    }

    function _bibRenderList(query) {
      const items = _buildBibItems();
      const q = (query || '').trim().toLowerCase();
      const filtered = q ? items.filter(it =>
        it.label.toLowerCase().includes(q) ||
        it.autores.toLowerCase().includes(q) ||
        it.jornal.toLowerCase().includes(q) ||
        it.tipo.toLowerCase().includes(q) ||
        it.impacto.toLowerCase().includes(q)
      ) : items;

      const list = document.getElementById('bibList');
      const count = document.getElementById('bibCount');
      if (!list) return;

      if (count) count.textContent = filtered.length + ' / ' + items.length + ' referências';

      if (!filtered.length) {
        list.innerHTML = '<div class="bib-empty">Nenhuma referência encontrada.</div>';
        return;
      }

      list.innerHTML = filtered.map(it => {
        const labelHtml = it.url
          ? `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener">${escapeHtml(it.label)}</a>`
          : escapeHtml(it.label);
        const metaParts = [
          it.jornal ? escapeHtml(it.jornal) : '',
          it.ano    ? escapeHtml(String(it.ano)) : '',
        ].filter(Boolean);
        return `<div class="bib-card">
  <div class="bib-card-top">
    <span class="bib-card-icon">${it.icon}</span>
    <span class="bib-card-label">${labelHtml}</span>
    <span class="bib-badge" style="background:${it.tipoColor}22;color:${it.tipoColor};border:1px solid ${it.tipoColor}55;">${escapeHtml(it.tipo)}</span>
  </div>
  ${it.autores ? `<div class="bib-card-authors">${escapeHtml(it.autores)}</div>` : ''}
  ${metaParts.length ? `<div class="bib-card-meta">${metaParts.map(p => `<span>${p}</span>`).join('')}</div>` : ''}
  ${it.impacto ? `<div class="bib-card-impacto">${escapeHtml(it.impacto)}</div>` : ''}
</div>`;
      }).join('');
    }

    function openBibliotecaModal() {
      const modal = document.getElementById('bibliotecaModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      _bibRenderList('');
      const searchEl = document.getElementById('bibSearch');
      if (searchEl) {
        searchEl.value = '';
        searchEl.oninput = () => _bibRenderList(searchEl.value);
        setTimeout(() => searchEl.focus(), 80);
      }
      const form = document.getElementById('bibSuggestForm');
      if (form) form.onsubmit = _bibSubmitSuggest;
    }

    function closeBibliotecaModal() {
      const modal = document.getElementById('bibliotecaModal');
      if (modal) modal.classList.add('hidden');
    }

    function closeBibliotecaModalOutside(e) {
      if (e.target === document.getElementById('bibliotecaModal')) closeBibliotecaModal();
    }

    async function _bibSubmitSuggest(e) {
      e.preventDefault();
      const urlVal    = (document.getElementById('bibSuggestUrl')?.value || '').trim();
      const reasonVal = (document.getElementById('bibSuggestReason')?.value || '').trim();
      const msgEl     = document.getElementById('bibSuggestMsg');
      if (!urlVal && !reasonVal) { if (msgEl) { msgEl.textContent = 'Preencha pelo menos um campo.'; msgEl.className = 'bib-suggest-msg err'; msgEl.style.display = ''; } return; }
      const btn = e.target.querySelector('.bib-submit-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
      try {
        const supaUrl = 'https://wviutasgroltjuyxpevc.supabase.co';
        const res = await fetch(supaUrl + '/functions/v1/send-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: '[NefroQuest] Sugestão de artigo',
            message: `URL/DOI: ${urlVal || '(não informado)'}\n\nJustificativa: ${reasonVal || '(não informada)'}`,
          }),
        });
        if (res.ok) {
          if (msgEl) { msgEl.textContent = 'Sugestão enviada! Obrigado pela contribuição.'; msgEl.className = 'bib-suggest-msg ok'; msgEl.style.display = ''; }
          e.target.reset();
        } else {
          throw new Error('HTTP ' + res.status);
        }
      } catch {
        if (msgEl) { msgEl.textContent = 'Erro ao enviar. Tente novamente.'; msgEl.className = 'bib-suggest-msg err'; msgEl.style.display = ''; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar sugestão'; }
      }
    }
