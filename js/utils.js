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
    let _bibVisibleItems = []; // rastreado para openBibResumo
    const UNLOCKED_REFS_KEY = 'nq-unlocked-refs';

    function _getUnlockedArticles() {
      try { return JSON.parse(localStorage.getItem('unlockedArticles') || '[]'); } catch { return []; }
    }

    function _getUnlockedRefs() {
      try { return new Set(JSON.parse(localStorage.getItem(UNLOCKED_REFS_KEY) || '[]')); } catch { return new Set(); }
    }

    function _unlockRefsFromQuestion(keys) {
      if (!Array.isArray(keys) || !keys.length) return;
      const set = _getUnlockedRefs();
      let changed = false;
      keys.forEach(k => { if (k && !set.has(k)) { set.add(k); changed = true; } });
      if (changed) {
        try { localStorage.setItem(UNLOCKED_REFS_KEY, JSON.stringify([...set])); } catch {}
        _bibItems = null;
      }
    }

    function _buildBibItems() {
      const unlockedIdxs = _getUnlockedArticles();
      const unlockedRefs = _getUnlockedRefs();
      const items = [];

      // refsDB — desbloqueadas conforme aparecem nas referências de questões acertadas
      if (typeof refsDB === 'object' && refsDB !== null) {
        Object.entries(refsDB).forEach(([key, r]) => {
          const isUnlocked = unlockedRefs.has(key);
          items.push({
            label:      isUnlocked ? (r.label || '') : 'Referência bloqueada',
            autores:    '',
            jornal:     isUnlocked ? (r.journal || '') : '',
            ano:        isUnlocked ? (r.ano || '') : '',
            tipo:       isUnlocked ? (r.badge || 'REF') : 'REF',
            tipoColor:  r.badgeColor || '#64748b',
            impacto:    isUnlocked ? (r.impacto || '') : '',
            url:        isUnlocked ? (r.url || '') : '',
            icon:       isUnlocked ? (r.icon || '📖') : '🔒',
            locked:     !isUnlocked,
            _lockType:  'ref',
            resumo:     r.resumo || '',
            conclusao:  r.conclusao || '',
            curiosidade: r.curiosidade || '',
          });
        });
      }

      // nefroArticles — desbloqueados conforme baús abertos
      if (typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)) {
        const total = nefroArticles.length;
        nefroArticles.forEach((a, idx) => {
          const isUnlocked = unlockedIdxs.includes(idx);
          items.push({
            label:      isUnlocked ? (a.titulo || '') : 'Artigo bloqueado',
            autores:    isUnlocked ? (a.autores || '') : '',
            jornal:     isUnlocked ? (a.jornal  || '') : '',
            ano:        isUnlocked ? (a.ano     || '') : '',
            tipo:       'ARTIGO',
            tipoColor:  '#0e7490',
            impacto:    isUnlocked ? (a.impacto || '') : '',
            url:        '',
            icon:       isUnlocked ? '📄' : '🔒',
            locked:     !isUnlocked,
            _lockType:  'article',
            _totalArticles: total,
            resumo:     isUnlocked ? (a.resumo     || '') : '',
            conclusao:  isUnlocked ? (a.conclusao  || '') : '',
            curiosidade: isUnlocked ? (a.curiosidade || '') : '',
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

      const unlockedItems = items.filter(it => !it.locked);
      const lockedRefs    = items.filter(it =>  it.locked && it._lockType === 'ref');
      const lockedArts    = items.filter(it =>  it.locked && it._lockType === 'article');

      const filtered = q
        ? unlockedItems.filter(it =>
            it.label.toLowerCase().includes(q) ||
            it.autores.toLowerCase().includes(q) ||
            it.jornal.toLowerCase().includes(q) ||
            it.tipo.toLowerCase().includes(q) ||
            it.impacto.toLowerCase().includes(q)
          )
        : unlockedItems;

      const list = document.getElementById('bibList');
      const count = document.getElementById('bibCount');
      if (!list) return;

      if (count) {
        const totalRefs = unlockedItems.filter(it => it._lockType === 'ref').length + lockedRefs.length;
        const refsOpen  = unlockedItems.filter(it => it._lockType === 'ref').length;
        const totalArt  = unlockedItems.filter(it => it._lockType === 'article').length + lockedArts.length;
        const artOpen   = unlockedItems.filter(it => it._lockType === 'article').length;
        count.textContent = q
          ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
          : [
              totalRefs > 0 ? `${refsOpen}/${totalRefs} refs` : null,
              totalArt  > 0 ? `${artOpen}/${totalArt} artigos` : null,
            ].filter(Boolean).join(' · ');
      }

      // Banner explicativo de como desbloquear (topo da lista, sempre visível)
      const infoBanner = !q
        ? `<div class="bib-info-banner">
  <span class="bib-info-banner-icon">📖</span>
  <span>Acerte questões para revelar a evidência científica que as fundamenta. Artigos adicionais são desbloqueados ao abrir baús durante o jogo.</span>
</div>`
        : '';

      // Refs bloqueadas: card único de resumo (não lista individual)
      const hintCard = (!q && lockedRefs.length > 0)
        ? `<div class="bib-card bib-hint-card">
  <div class="bib-card-top">
    <span class="bib-card-icon">🔒</span>
    <span class="bib-card-label">${lockedRefs.length} referência${lockedRefs.length !== 1 ? 's' : ''} ainda bloqueada${lockedRefs.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="bib-unlock-hint">Acerte mais questões para revelar as referências que elas citam</div>
</div>`
        : '';

      // Visíveis: desbloqueados + artigos bloqueados individualmente
      const visibleItems = q ? filtered : [...unlockedItems, ...lockedArts];
      _bibVisibleItems = visibleItems;

      if (!visibleItems.length && !hintCard) {
        list.innerHTML = infoBanner + '<div class="bib-empty">Nenhuma referência encontrada.</div>';
        return;
      }

      list.innerHTML = infoBanner + visibleItems.map(it => {
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
        const itemIdx = visibleItems.indexOf(it);
        return `<div class="bib-card">
  <div class="bib-card-top">
    <span class="bib-card-icon">${escapeHtml(it.icon)}</span>
    <span class="bib-card-label">${labelHtml}</span>
    <span class="bib-badge" style="background:${it.tipoColor}22;color:${it.tipoColor};border:1px solid ${it.tipoColor}55;">${escapeHtml(it.tipo)}</span>
  </div>
  ${it.autores ? `<div class="bib-card-authors">${escapeHtml(it.autores)}</div>` : ''}
  ${metaParts.length ? `<div class="bib-card-meta">${metaParts.map(p => `<span>${p}</span>`).join('')}</div>` : ''}
  ${it.impacto ? `<div class="bib-card-impacto">${escapeHtml(it.impacto)}</div>` : ''}
  <button class="bib-resumo-btn" data-action="openBibResumo" data-pass-this="1" data-item-idx="${itemIdx}">📝 Resumo rápido</button>
</div>`;
      }).join('') + hintCard;
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

    function openBibResumo(btn) {
      const idx = parseInt(btn?.dataset?.itemIdx ?? '-1', 10);
      const it = _bibVisibleItems[idx];
      if (!it || it.locked) return;

      document.querySelectorAll('.bib-resumo-modal').forEach(el => el.remove());

      const hasContent = it.resumo || it.conclusao || it.curiosidade || it.impacto;
      const bodyHtml = hasContent
        ? [
            it.resumo     ? `<div class="brm-section"><div class="brm-label">📚 Resumo</div><div class="brm-text">${escapeHtml(it.resumo)}</div></div>` : '',
            it.conclusao  ? `<div class="brm-section"><div class="brm-label">🎯 Conclusão Principal</div><div class="brm-text">${escapeHtml(it.conclusao)}</div></div>` : '',
            it.curiosidade? `<div class="brm-section"><div class="brm-label">💡 Curiosidade</div><div class="brm-text">${escapeHtml(it.curiosidade)}</div></div>` : '',
            it.impacto    ? `<div class="brm-section"><div class="brm-label">⭐ Impacto na Nefrologia</div><div class="brm-text">${escapeHtml(it.impacto)}</div></div>` : '',
          ].join('')
        : `<div class="brm-soon">Resumo em elaboração — disponível em breve.</div>`;

      const overlay = document.createElement('div');
      overlay.className = 'bib-resumo-modal';
      overlay.innerHTML = `
        <div class="brm-box">
          <div class="brm-header">
            <div class="brm-title">${escapeHtml(it.label)}</div>
            <button class="brm-close" data-action="closeBibResumo" aria-label="Fechar">✕</button>
          </div>
          ${it.autores ? `<div class="brm-meta">${escapeHtml(it.autores)}${it.jornal ? ` · <em>${escapeHtml(it.jornal)}</em>` : ''}${it.ano ? ` (${escapeHtml(String(it.ano))})` : ''}</div>` : ''}
          <div class="brm-body">${bodyHtml}</div>
        </div>
      `;
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    }

    function closeBibResumo() {
      document.querySelectorAll('.bib-resumo-modal').forEach(el => el.remove());
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
