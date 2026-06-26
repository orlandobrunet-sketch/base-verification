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
        // Nota: _track envia SÓ para o GA4 (gtag). O Sentry é canal separado e
        // captura erros automaticamente (config no <head>). Para debug local:
        // console.debug('[analytics]', event, params);
      } catch(e) { /* silencia erros de analytics */ }
    }

    function _reportError(error, context = {}) {
      console.error('[NQ Error]', error, context);
      
      // Envia para o Sentry
      try {
        if (typeof Sentry !== 'undefined' && typeof Sentry.captureException === 'function') {
          Sentry.captureException(error, { extra: context });
        }
      } catch(e) {}

      // Envia evento para o GA4
      try {
        _track('app_error', {
          error_message: error instanceof Error ? error.message : String(error),
          error_context: JSON.stringify(context)
        });
      } catch(e) {}
    }
    window._reportError = _reportError;

    // Helper de i18n leve. Uso: t('Texto PT', 'EN text'). Lê o idioma de
    // window.NQ_CONFIG.lang (definido em game.js). Default = PT (fallback seguro
    // — public médico brasileiro). Veja docs/I18N.md para a estratégia completa.
    function t(pt, en) {
      const lang = (window.NQ_CONFIG && window.NQ_CONFIG.lang) || 'pt';
      return (lang === 'en' && typeof en === 'string') ? en : pt;
    }
    window.t = t;

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

    // ── Spaced Repetition (FSRS-4.5) ──────────────────────────────────────
    // Free Spaced Repetition Scheduler — modela Estabilidade (S, dias até a
    // retenção cair a 90%), Dificuldade (D, 1–10) e Retrievability (R). Mantém
    // os campos `interval` (dias) e `due` (timestamp) por compatibilidade com o
    // dashboard. Entrada binária do jogo: acerto→Good(3), erro→Again(1).
    const SR_KEY = 'nefroquest-sr-data';
    const _DAY_MS = 86400000;
    const _FSRS_W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];
    const _FSRS_DECAY = -0.5;
    const _FSRS_FACTOR = 19 / 81;       // = retençãoAlvo^(1/DECAY) − 1 para 0.9
    const _FSRS_RETENTION = 0.9;        // retenção-alvo

    function _loadSRData() {
      try { return JSON.parse(localStorage.getItem(SR_KEY) || '{}'); } catch { return {}; }
    }
    function _saveSRData(d) {
      try { localStorage.setItem(SR_KEY, JSON.stringify(d)); } catch(e) { console.error('[NQ] _saveSRData failed', e); }
    }

    const _clampD = d => Math.min(10, Math.max(1, d));
    const _fsrsInitD = g => _clampD(_FSRS_W[4] - _FSRS_W[5] * (g - 3));
    const _fsrsInitS = g => Math.max(0.1, _FSRS_W[g - 1]);
    const _fsrsR = (t, S) => Math.pow(1 + _FSRS_FACTOR * t / S, _FSRS_DECAY);
    const _fsrsInterval = S => Math.max(1, Math.round((S / _FSRS_FACTOR) * (Math.pow(_FSRS_RETENTION, 1 / _FSRS_DECAY) - 1)));
    const _fsrsNextD = (D, g) => _clampD(_FSRS_W[7] * _fsrsInitD(4) + (1 - _FSRS_W[7]) * (D - _FSRS_W[6] * (g - 3)));
    const _fsrsStabRecall = (D, S, R, g) => {
      const hard = g === 2 ? _FSRS_W[15] : 1;
      const easy = g === 4 ? _FSRS_W[16] : 1;
      return S * (1 + Math.exp(_FSRS_W[8]) * (11 - D) * Math.pow(S, -_FSRS_W[9]) * (Math.exp((1 - R) * _FSRS_W[10]) - 1) * hard * easy);
    };
    const _fsrsStabLapse = (D, S, R) => _FSRS_W[11] * Math.pow(D, -_FSRS_W[12]) * (Math.pow(S + 1, _FSRS_W[13]) - 1) * Math.exp((1 - R) * _FSRS_W[14]);

    function updateSRData(qid, isCorrect) {
      if (!qid) return;
      const data = _loadSRData();
      const today = new Date().setHours(0, 0, 0, 0);
      const g = isCorrect ? 3 : 1; // Good / Again
      let card = data[qid];

      // Migração de cards SM-2 antigos ({ef, interval, reps, due}) → FSRS
      if (card && card.S === undefined) {
        const ef = typeof card.ef === 'number' ? card.ef : 2.5;
        const interval = card.interval || 1;
        card = {
          S: Math.max(0.5, interval),
          D: _clampD(1 + (2.5 - ef) / 1.2 * 9),
          interval,
          due: card.due || today,
          last: card.due ? (card.due - interval * _DAY_MS) : today,
          reps: card.reps || 1,
          lapses: 0
        };
      }

      if (!card || card.S === undefined || !card.reps) {
        // Primeira revisão
        const S = _fsrsInitS(g);
        const D = _fsrsInitD(g);
        const interval = _fsrsInterval(S);
        card = { S, D, interval, due: today + interval * _DAY_MS, last: today, reps: 1, lapses: isCorrect ? 0 : 1 };
      } else {
        const t = Math.max(0, Math.round((today - (card.last || today)) / _DAY_MS));
        const R = _fsrsR(t, card.S);
        const D = _fsrsNextD(card.D, g);
        let S = g === 1 ? _fsrsStabLapse(D, card.S, R) : _fsrsStabRecall(D, card.S, R, g);
        S = Math.max(0.1, S);
        const interval = _fsrsInterval(S);
        card = {
          S, D, interval, due: today + interval * _DAY_MS, last: today,
          reps: (card.reps || 0) + 1, lapses: (card.lapses || 0) + (g === 1 ? 1 : 0)
        };
      }
      data[qid] = card;
      _saveSRData(data);
    }

    function getSRDueQuestions(qs) {
      const data = _loadSRData();
      const today = new Date().setHours(0, 0, 0, 0);
      return qs.filter(q => !q.qid || !data[q.qid] || data[q.qid].due <= today);
    }

    // ── Modo Leitura (acessibilidade) ─────────────────────────────────────
    const READING_MODE_KEY = 'nefroquest-reading-mode';
    function _syncReadingModeButtons(on) {
      document.querySelectorAll('[data-action="toggleReadingMode"]').forEach(b => {
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    function applyReadingMode() {
      let on = false;
      try { on = localStorage.getItem(READING_MODE_KEY) === '1'; } catch (e) {}
      document.body.classList.toggle('reading-mode', on);
      _syncReadingModeButtons(on);
    }
    function toggleReadingMode() {
      const on = !document.body.classList.contains('reading-mode');
      document.body.classList.toggle('reading-mode', on);
      try { localStorage.setItem(READING_MODE_KEY, on ? '1' : '0'); } catch (e) {}
      _syncReadingModeButtons(on);
      if (typeof _toast === 'function') _toast(on ? '🔠 Modo leitura ativado — texto maior e mais contraste.' : 'Modo leitura desativado.', 'info', 2500);
      if (typeof playSound === 'function') playSound('click');
    }
    window.toggleReadingMode = toggleReadingMode;
    window.applyReadingMode = applyReadingMode;
    // Aplica a preferência salva assim que o DOM estiver pronto.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyReadingMode, { once: true });
    } else {
      applyReadingMode();
    }

    // ── Grimório de Conhecimento ──────────────────────────────────────────
    let _bibActiveFilter = 'all';

    const BIB_FAV_KEY = 'nq-bib-favorites';
    function _getBibFavorites() {
      try { return new Set(JSON.parse(localStorage.getItem(BIB_FAV_KEY) || '[]')); } catch { return new Set(); }
    }
    function _toggleBibFav(key) {
      const favs = _getBibFavorites();
      if (favs.has(key)) { favs.delete(key); } else { favs.add(key); }
      try { localStorage.setItem(BIB_FAV_KEY, JSON.stringify([...favs])); } catch(e) {}
      const searchEl = document.getElementById('bibSearch');
      _bibRenderList(searchEl ? searchEl.value : '');
    }
    window._toggleBibFav = _toggleBibFav;

    function _setBibFilter(filterName, btn) {
      _bibActiveFilter = filterName;
      const filterWrap = document.getElementById('bibFilters');
      if (filterWrap) {
        filterWrap.querySelectorAll('.bib-filter-btn').forEach(b => {
          b.classList.toggle('active', b === btn || b.dataset.arg === filterName);
        });
      }
      const searchEl = document.getElementById('bibSearch');
      _bibRenderList(searchEl ? searchEl.value : '');
      if (typeof playSound === 'function') playSound('click');
    }
    window._setBibFilter = _setBibFilter;

    const rarityColors = {
      comum: { text: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.2)', label: 'Comum' },
      raro: { text: '#38bdf8', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.3)', label: 'Raro' },
      'épico': { text: '#c084fc', bg: 'rgba(168,85,247,0.09)', border: 'rgba(168,85,247,0.35)', label: 'Épico' },
      'épica': { text: '#c084fc', bg: 'rgba(168,85,247,0.09)', border: 'rgba(168,85,247,0.35)', label: 'Épico' },
      lendário: { text: '#ffd700', bg: 'rgba(255,215,0,0.09)', border: 'rgba(255,215,0,0.6)', label: 'Lendário' },
      lendária: { text: '#ffd700', bg: 'rgba(255,215,0,0.09)', border: 'rgba(255,215,0,0.6)', label: 'Lendário' }
    };
    const rarityScrollIcons = {
      comum: '📜',
      raro: '📜💎',
      'épico': '📜🔮',
      'épica': '📜🔮',
      lendário: '📜👑',
      lendária: '📜👑'
    };
    window.rarityScrollIcons = rarityScrollIcons;
    window.rarityColors = rarityColors;

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
        try { localStorage.setItem(UNLOCKED_REFS_KEY, JSON.stringify([...set])); } catch(e) { console.error('[NQ] _unlockRefsFromQuestion failed', e); }
        _bibItems = null;
      }
    }

    function _buildBibItems() {
      const isUserAdmin = (typeof isAdminUser === 'function' && isAdminUser()) || (typeof window.isAdminUser === 'function' && window.isAdminUser());
      const unlockedIdxs = _getUnlockedArticles();
      const unlockedRefs = _getUnlockedRefs();
      const items = [];

      // refsDB — desbloqueadas conforme aparecem nas referências de questões acertadas
      if (typeof refsDB === 'object' && refsDB !== null) {
        Object.entries(refsDB).forEach(([key, r]) => {
          const isUnlocked = isUserAdmin || unlockedRefs.has(key);
          items.push({
            _bibKey:    key,                                          // chave única para dedup
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
          const isUnlocked = isUserAdmin || unlockedIdxs.includes(idx);
          items.push({
            _bibKey:    `__art_${idx}`,                              // chave única para dedup
            label:      isUnlocked ? (a.titulo || '') : 'Artigo bloqueado',
            autores:    isUnlocked ? (a.autores || '') : '',
            jornal:     isUnlocked ? (a.jornal  || '') : '',
            ano:        isUnlocked ? (a.ano     || '') : '',
            tipo:       'ARTIGO',
            tipoColor:  '#0e7490',
            impacto:    isUnlocked ? (a.impacto || '') : '',
            url:        '',
            icon:       isUnlocked ? (rarityScrollIcons[a.raridade || 'comum'] || '📜') : '🔒',
            locked:     !isUnlocked,
            _lockType:  'article',
            raridade:   a.raridade || 'comum',
            _totalArticles: total,
            resumo:     isUnlocked ? (a.resumo     || '') : '',
            conclusao:  isUnlocked ? (a.conclusao  || '') : '',
            curiosidade: isUnlocked ? (a.curiosidade || '') : '',
          });
        });
      }

      // De-duplicação por _bibKey (chave única da fonte).
      // Mantém o mais completo quando a mesma chave aparece mais de uma vez
      // (ex: entrada duplicada na refsDB). NÃO faz dedup por journal — journals
      // genéricos como "New England Journal of Medicine" são compartilhados por
      // dezenas de refs distintas e colapsar por journal eliminaria a maioria delas.
      const _score = it => (!it.locked ? 100 : 0) + (it.resumo ? 4 : 0) + (it.conclusao ? 2 : 0) + (it.curiosidade ? 1 : 0);
      const _seen = new Map();
      const deduped = [];
      for (const it of items) {
        const k = it._bibKey;
        if (!_seen.has(k)) {
          _seen.set(k, deduped.length);
          deduped.push(it);
        } else {
          const idx = _seen.get(k);
          if (_score(it) > _score(deduped[idx])) deduped[idx] = it;
        }
      }

      // Desbloqueados primeiro (A-Z), depois bloqueados
      deduped.sort((a, b) => {
        if (a.locked !== b.locked) return a.locked ? 1 : -1;
        return a.label.localeCompare(b.label, 'pt', { sensitivity: 'base' });
      });

      return deduped;
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
        // Totais reais direto das fontes (evita distorção por dedup)
        const totalRefs = (typeof refsDB === 'object' && refsDB) ? Object.keys(refsDB).length : 0;
        const totalArt  = (typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)) ? nefroArticles.length : 0;
        const refsOpen  = unlockedItems.filter(it => it._lockType === 'ref').length;
        const artOpen   = unlockedItems.filter(it => it._lockType === 'article').length;
        count.textContent = q
          ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
          : `${refsOpen + artOpen}/${totalRefs + totalArt} artigos`;
      }

      // Banner explicativo de como desbloquear (topo da lista, sempre visível)
      const infoBanner = !q
        ? `<div class="bib-info-banner">
  <span class="bib-info-banner-icon">📖</span>
  <span>Artigos são desbloqueados quando você acerta as questões ou abre baús.</span>
</div>`
        : '';

      // Refs bloqueadas: card único de resumo (não lista individual)
      // Usa o total real de refsDB menos as já desbloqueadas para exibir a contagem correta
      const _totalRefsReal = (typeof refsDB === 'object' && refsDB) ? Object.keys(refsDB).length : 0;
      const _lockedRefsCount = _totalRefsReal - unlockedItems.filter(it => it._lockType === 'ref').length;
      const hintCard = (!q && _lockedRefsCount > 0)
        ? `<div class="bib-card bib-hint-card">
  <div class="bib-card-top">
    <span class="bib-card-icon">🔒</span>
    <span class="bib-card-label">${_lockedRefsCount} referência${_lockedRefsCount !== 1 ? 's' : ''} ainda bloqueada${_lockedRefsCount !== 1 ? 's' : ''}</span>
  </div>
  <div class="bib-unlock-hint">Acerte mais questões para revelar as referências que elas citam</div>
</div>`
        : '';

      // Visíveis: desbloqueados + artigos bloqueados individualmente
      let visibleItems = q ? filtered : [...unlockedItems, ...lockedArts];

      if (_bibActiveFilter === 'legendary') {
        visibleItems = visibleItems.filter(it => it.raridade === 'legendary' || it.raridade === 'lendário' || it.raridade === 'lendária');
      } else if (_bibActiveFilter === 'epic') {
        visibleItems = visibleItems.filter(it => it.raridade === 'epic' || it.raridade === 'épico' || it.raridade === 'épica');
      } else if (_bibActiveFilter === 'rare') {
        visibleItems = visibleItems.filter(it => it.raridade === 'rare' || it.raridade === 'raro' || it.raridade === 'uncommon' || it.raridade === 'incomum');
      } else if (_bibActiveFilter === 'guideline') {
        visibleItems = visibleItems.filter(it => it.tipo === 'GUIDELINE' || (it.label && it.label.toLowerCase().includes('kdigo')) || (it.jornal && it.jornal.toLowerCase().includes('kdigo')));
      } else if (_bibActiveFilter === 'favorites') {
        const favs = _getBibFavorites();
        visibleItems = visibleItems.filter(it => favs.has(it._bibKey));
      }

      _bibVisibleItems = visibleItems;

      if (!visibleItems.length && !hintCard) {
        const emptyMsg = _bibActiveFilter === 'favorites'
          ? '<div class="bib-empty">Nenhum favorito ainda. Clique na ⭐ em qualquer artigo para salvar aqui.</div>'
          : '<div class="bib-empty">Nenhuma referência encontrada.</div>';
        list.innerHTML = infoBanner + emptyMsg;
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
        const isFav = _getBibFavorites().has(it._bibKey);
        let cardStyle = '';
        let rarityLabel = '';
        if (it._lockType === 'article') {
          const rarity = (it.raridade || 'comum').toLowerCase();
          const rInfo = rarityColors[rarity] || rarityColors.comum;
          cardStyle = `background:${rInfo.bg};border-color:${rInfo.border};box-shadow:0 0 10px ${rInfo.border};`;
          rarityLabel = `<span style="background:${rInfo.bg};color:${rInfo.text};border:1px solid ${rInfo.border};padding:2px 8px;border-radius:10px;font-size:0.68rem;font-weight:bold;text-transform:uppercase;margin-left:6px;font-family:'Cinzel',serif;display:inline-block;vertical-align:middle;">${rInfo.label}</span>`;
        }
        return `<div class="bib-card" style="${cardStyle}">
  <div class="bib-card-top">
    <span class="bib-card-icon">${escapeHtml(it.icon)}</span>
    <span class="bib-card-label">${labelHtml}${rarityLabel}</span>
    <span class="bib-badge" style="background:${it.tipoColor}22;color:${it.tipoColor};border:1px solid ${it.tipoColor}55;">${escapeHtml(it.tipo)}</span>
  </div>
  ${it.autores ? `<div class="bib-card-authors">${escapeHtml(it.autores)}</div>` : ''}
  ${metaParts.length ? `<div class="bib-card-meta">${metaParts.map(p => `<span>${p}</span>`).join('')}</div>` : ''}
  ${it.impacto ? `<div class="bib-card-impacto">${escapeHtml(it.impacto)}</div>` : ''}
  <div class="bib-card-actions">
    <button class="bib-resumo-btn" data-action="openBibResumo" data-pass-this="1" data-item-idx="${itemIdx}">📝 Resumo rápido</button>
    <button class="bib-fav-btn${isFav ? ' active' : ''}" data-action="_toggleBibFav" data-arg="${it._bibKey}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-label="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">★</button>
  </div>
</div>`;
      }).join('') + hintCard;
    }

    function openBibliotecaModal() {
      const modal = document.getElementById('bibliotecaModal');
      if (!modal) return;
      _bibActiveFilter = 'all';
      const filterWrap = document.getElementById('bibFilters');
      if (filterWrap) {
        filterWrap.querySelectorAll('.bib-filter-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.arg === 'all');
        });
      }
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

    // Renderiza o popup de resumo (mesmo visual usado no Grimório) a partir de
    // um item com { label, autores, jornal, ano, resumo, conclusao, curiosidade, impacto }.
    function _showResumoModal(it) {
      if (!it) return;
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
          ${it.autores || it.jornal ? `<div class="brm-meta">${it.autores ? escapeHtml(it.autores) : ''}${it.jornal ? `${it.autores ? ' · ' : ''}<em>${escapeHtml(it.jornal)}</em>` : ''}${it.ano ? ` (${escapeHtml(String(it.ano))})` : ''}</div>` : ''}
          <div class="brm-body">${bodyHtml}</div>
        </div>
      `;
      // overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); // disabled to prevent accidental closing
      document.body.appendChild(overlay);
    }

    function openBibResumo(btn) {
      const idx = parseInt(btn?.dataset?.itemIdx ?? '-1', 10);
      const it = _bibVisibleItems[idx];
      if (!it || it.locked) return;
      _showResumoModal(it);
    }

    // Abre o mesmo popup de resumo do Grimório a partir de uma chave da refsDB.
    // Usado pelas referências exibidas em cada questão do jogo.
    function openRefResumo(key) {
      if (typeof refsDB !== 'object' || !refsDB || !refsDB[key]) return;
      const r = refsDB[key];
      _showResumoModal({
        label:       r.label || '',
        autores:     '',
        jornal:      r.journal || '',
        ano:         r.ano || '',
        resumo:      r.resumo || '',
        conclusao:   r.conclusao || '',
        curiosidade: r.curiosidade || '',
        impacto:     r.impacto || '',
      });
      try { if (typeof _track === 'function') _track('ref_resumo_opened', { key }); } catch {}
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

    function closeBibliotecaModalOutside() {
      // Desativado: o modal fecha só pelo X (clicar fora fechava por acidente).
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
        // SUPA_URL é definida em auth.js no escopo global (plain script).
        // window.NQ_CONFIG.SUPA_URL é fallback caso ordem de carregamento mude.
        const supaUrl = (typeof SUPA_URL !== 'undefined') ? SUPA_URL
          : (window.NQ_CONFIG && window.NQ_CONFIG.SUPA_URL)
          || 'https://wviutasgroltjuyxpevc.supabase.co';
        // Auth obrigatória (verify_jwt) — sem apikey/Authorization o Supabase
        // rejeita com 401. Logado: usa o JWT da sessão; visitante: publishable key.
        const _supaKey = (window.NQ_CONFIG && window.NQ_CONFIG.SUPA_KEY)
          || (typeof SUPA_KEY !== 'undefined' ? SUPA_KEY : '');
        let _authToken = _supaKey;
        try {
          const _sess = await (typeof _supaClient !== 'undefined' ? _supaClient : null)?.auth?.getSession();
          _authToken = _sess?.data?.session?.access_token || _supaKey;
        } catch {}
        const res = await fetch(supaUrl + '/functions/v1/send-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: _supaKey, Authorization: `Bearer ${_authToken}` },
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

    // ── Motor Adaptativo de Aprendizado (E1 — IRT leve) ──────────────────
    function calculateUserTheta(cat) {
      let stats = {};
      try {
        const raw = localStorage.getItem('nefroquest-detailed-stats');
        if (raw) stats = JSON.parse(raw) || {};
      } catch (e) {}

      const catStats = stats.byCategory && stats.byCategory[cat];
      
      // 1. Linha de base acumulada
      let theta = 2.0; // Início neutro (médio)
      if (catStats && typeof catStats.total === 'number' && catStats.total > 0) {
        const correct = catStats.correct || 0;
        const total = catStats.total;
        const p = Math.max(0.05, Math.min(0.95, correct / total));
        const logit = Math.log(p / (1 - p));
        theta = 2.0 + logit * 0.5; // p=0.5 -> 2.0, p=0.95 -> 2.94, p=0.05 -> 1.05
      }

      // 2. Refinamento sequencial via SGD no histórico recente (últimas 100 questões)
      const history = stats.questionHistory;
      const bank = (typeof window !== 'undefined' && Array.isArray(window.questionBank))
        ? window.questionBank
        : (typeof questionBank !== 'undefined' && Array.isArray(questionBank) ? questionBank : null);
      if (Array.isArray(history) && history.length > 0 && bank) {
        const relevant = [];
        for (let i = history.length - 1; i >= 0; i--) {
          const h = history[i];
          if (!h || !h.qid) continue;
          // Localizar questão no banco para extrair categoria e dificuldade nominal
          const q = bank.find(item => (item.id || item.qid) === h.qid);
          if (q && (q.c === cat || q.cat === cat)) {
            const diffStr = q._d || q.diff || 'medium';
            const b = diffStr === 'easy' ? 1.0 : diffStr === 'hard' ? 3.0 : 2.0;
            relevant.push({ isCorrect: !!h.correct, b });
          }
        }

        const alpha = 0.3; // taxa de aprendizado
        for (const step of relevant) {
          const pCorrect = 1 / (1 + Math.exp(-(theta - step.b)));
          const actual = step.isCorrect ? 1.0 : 0.0;
          theta = theta + alpha * (actual - pCorrect);
        }
      }

      // Clampar para faixa de segurança
      return Math.min(3.5, Math.max(0.5, theta));
    }
    window.calculateUserTheta = calculateUserTheta;

    function getAdaptiveTargetDifficulty(theta) {
      if (theta < 1.3) return 'easy';
      if (theta > 2.3) return 'hard';
      return 'medium';
    }
    window.getAdaptiveTargetDifficulty = getAdaptiveTargetDifficulty;

