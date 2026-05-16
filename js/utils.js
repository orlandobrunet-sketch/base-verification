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

    // ── Grimório de Conhecimento ──────────────────────────────────────────
    let _bibItems = null;

    function _getUnlockedArticles() {
      try { return JSON.parse(localStorage.getItem('unlockedArticles') || '[]'); } catch { return []; }
    }

    function _buildBibItems() {
      const unlockedIdxs = _getUnlockedArticles();
      const items = [];

      // refsDB — sempre visíveis (diretrizes, guias, referências)
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
            locked:    false,
          });
        });
      }

      // nefroArticles — desbloqueados conforme baús abertos
      if (typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)) {
        const total = nefroArticles.length;
        nefroArticles.forEach((a, idx) => {
          const isUnlocked = unlockedIdxs.includes(idx);
          items.push({
            label:     isUnlocked ? (a.titulo || '') : 'Artigo bloqueado',
            autores:   isUnlocked ? (a.autores || '') : '',
            jornal:    isUnlocked ? (a.jornal  || '') : '',
            ano:       isUnlocked ? (a.ano     || '') : '',
            tipo:      'ARTIGO',
            tipoColor: '#0e7490',
            impacto:   isUnlocked ? (a.impacto || '') : '',
            url:       '',
            icon:      isUnlocked ? '📄' : '🔒',
            locked:    !isUnlocked,
            _totalArticles: total,
            _unlockedCount: unlockedIdxs.length,
          });
        });
      }

      // Desbloqueados primeiro (A-Z), depois bloqueados
      items.sort((a, b) => {
        if (a.locked !== b.locked) return a.locked ? 1 : -1;
        return a.label.localeCompare(b.label, 'pt', { sensitivity: 'base' });
      });

      return items;
    }

    function _bibRenderList(query) {
      const items = _buildBibItems();
      const q = (query || '').trim().toLowerCase();

      // Desbloqueados: filtráveis. Bloqueados: sempre ao final, não filtrados.
      const unlocked = items.filter(it => !it.locked);
      const locked   = items.filter(it =>  it.locked);
      const filtered = q
        ? unlocked.filter(it =>
            it.label.toLowerCase().includes(q) ||
            it.autores.toLowerCase().includes(q) ||
            it.jornal.toLowerCase().includes(q) ||
            it.tipo.toLowerCase().includes(q) ||
            it.impacto.toLowerCase().includes(q)
          )
        : unlocked;

      const list = document.getElementById('bibList');
      const count = document.getElementById('bibCount');
      if (!list) return;

      if (count) {
        const meta = locked[0];
        const totalArt   = meta ? meta._totalArticles : 0;
        const artVisible = unlocked.filter(it => it.tipo === 'ARTIGO').length;
        const refs       = unlocked.filter(it => it.tipo !== 'ARTIGO').length;
        count.textContent = q
          ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
          : (totalArt > 0
              ? `${refs} referências · ${artVisible}/${totalArt} artigos`
              : `${refs} referências`);
      }

      const visibleItems = q ? filtered : [...unlocked, ...locked];

      if (!visibleItems.length) {
        list.innerHTML = '<div class="bib-empty">Nenhuma referência encontrada.</div>';
        return;
      }

      list.innerHTML = visibleItems.map(it => {
        if (it.locked) {
          return `<div class="bib-card bib-card-locked">
  <div class="bib-card-top">
    <span class="bib-card-icon">🔒</span>
    <span class="bib-card-label">Artigo bloqueado</span>
    <span class="bib-badge" style="background:#0e749022;color:#0e7490;border:1px solid #0e749055;">ARTIGO</span>
  </div>
  <div class="bib-unlock-hint">Abra mais baús para revelar este artigo no Grimório</div>
</div>`;
        }
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
      _bibItems = null; // rebuild para refletir baús recém-abertos
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
      // Colapsa o formulário de sugestão ao fechar
      const fields = document.getElementById('bibSuggestFields');
      const btn = document.querySelector('.bib-suggest-toggle');
      if (fields) fields.classList.remove('show');
      if (btn) btn.classList.remove('open');
    }

    function toggleBibSuggestForm() {
      const fields = document.getElementById('bibSuggestFields');
      const btn = document.querySelector('.bib-suggest-toggle');
      if (!fields) return;
      const isOpen = fields.classList.contains('show');
      fields.classList.toggle('show', !isOpen);
      if (btn) btn.classList.toggle('open', !isOpen);
      if (!isOpen) {
        // Rola para o formulário aparecer na tela
        setTimeout(() => fields.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      }
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
