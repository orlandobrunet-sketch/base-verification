// NefroQuest — Leaderboard (data layer + render layer)
// Loaded before game.js. Functions become global via hoisting.

    let _boardCache = null;
    let _boardCacheTime = 0;
    let _boardFetchPromise = null; // in-flight lock — evita race condition em fetches paralelos
    const BOARD_CACHE_TTL = 30000; // 30s
    const BOARD_LOCAL_KEY = 'nefroquest-leaderboard';

    // Rate limiting: 1 push por sessão de jogo (evita flood no leaderboard)
    let _boardPushedThisSession = false;

    async function boardFetch(forceRefresh = false) {
      const now = Date.now();
      if (!forceRefresh && _boardCache && (now - _boardCacheTime) < BOARD_CACHE_TTL) return _boardCache;
      // Deduplica fetches concorrentes: retorna a mesma Promise se já está em voo
      if (_boardFetchPromise) return _boardFetchPromise;
      _boardFetchPromise = _doBoardFetch().finally(() => { _boardFetchPromise = null; });
      return _boardFetchPromise;
    }

    async function _doBoardFetch() {
      const now = Date.now();
      try {
        const res = await fetch(`${SUPA_URL}/rest/v1/leaderboard?select=*&order=score.desc,level.desc&limit=50`, {
          headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        _boardCache = data;
        _boardCacheTime = now;
        try { localStorage.setItem(BOARD_LOCAL_KEY, JSON.stringify({ data, ts: now })); } catch(e) {}
        return data;
      } catch(e) {
        _track('error_leaderboard_fetch', {msg: String(e)});
        if (_boardCache) return _boardCache;
        try {
          const raw = localStorage.getItem(BOARD_LOCAL_KEY);
          if (raw) {
            const { data: localData, ts } = JSON.parse(raw);
            // Usar cache local apenas se < 5 min (stale-while-revalidate offline)
            if (localData && Array.isArray(localData) && (Date.now() - (ts||0)) < 5*60*1000) {
              return localData;
            }
          }
        } catch(e2) {}
        _toast('Erro ao carregar o leaderboard. Verifique sua conexão.', 'error');
        return [];
      }
    }

    async function boardPush(score, level, playerName) {
      // Rate limiting: 1 push por sessão de jogo
      if (_boardPushedThisSession) return;
      // Sanity check: score e level devem ser números positivos razoáveis
      if (typeof score !== 'number' || score < 0 || score > 9_999_999) return;
      if (typeof level !== 'number' || level < 1 || level > 999) return;

      _boardPushedThisSession = true;
      const charName = state.character ? characters[state.character].name : 'Desconhecido';
      const userId = authUser?.id || null;
      const payload = {
        player_name: (playerName || 'Anônimo').substring(0, 40), // limite de tamanho
        character_name: charName,
        score: Math.floor(score),
        level: Math.floor(level),
        chests_opened: Math.max(0, state.chestsOpened || 0),
        best_streak: Math.max(0, state.streak || 0),
        played_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {})
      };
      try {
        // Upsert por user_id quando autenticado (evita entradas duplicadas no ranking)
        const prefer = userId
          ? 'resolution=merge-duplicates,return=minimal'
          : 'return=minimal';
        await fetch(`${SUPA_URL}/rest/v1/leaderboard`, {
          method: 'POST',
          headers: {
            'apikey': SUPA_KEY,
            'Authorization': `Bearer ${await (async()=>{ try { return (await _supaClient?.auth?.getSession())?.data?.session?.access_token || SUPA_KEY; } catch { return SUPA_KEY; } })()}`,
            'Content-Type': 'application/json',
            'Prefer': prefer
          },
          body: JSON.stringify(payload)
        });
        _boardCache = null; // invalidar cache local
      } catch(e) {
        _track('error_leaderboard_push', {msg: String(e)});
        _boardPushedThisSession = false; // permitir retry em caso de erro de rede
      }
    }

    // Manter compatibilidade com boardGet síncrono (usa cache)
    function boardGet() { return _boardCache || []; }
    function boardSave() {} // no-op, Supabase é o storage

    let _lastBoardFetch = 0;
    let _boardFullData = [];

    function _renderBoardRows(data, query) {
      const rankClass = ['r1','r2','r3'];
      const rankLabel = ['🥇','🥈','🥉'];
      const charAvatars = {
        'Dr. Nephros':    'assets/classes/clerigo_renal/nivel_01.jpg',
        'Dra. Aquaria':   'assets/classes/maga_metabolica/nivel_01.jpg',
        'Dr. Glomerulus': 'assets/classes/guerreiro_glomerular/nivel_01.png'
      };
      const q = (query || '').trim().toLowerCase();
      const filtered = data.map((r, globalIdx) => ({ r, globalIdx }))
        .filter(({ r }) => !q ||
          (r.player_name    || '').toLowerCase().includes(q) ||
          (r.character_name || '').toLowerCase().includes(q)
        );
      if (!filtered.length) {
        ui.boardBody.innerHTML = '<tr><td colspan="7" class="board-empty">Nenhum resultado encontrado.</td></tr>';
        return;
      }
      ui.boardBody.innerHTML = filtered.map(({ r, globalIdx }, filteredIdx) => {
        const i = q ? filteredIdx : globalIdx; // quando busca ativa, rank é da posição filtrada
        const rc = i < 3 ? rankClass[i] : 'rn';
        const rl = i < 3 ? rankLabel[i] : (i + 1);
        const avatar = charAvatars[r.character_name] || 'assets/classes/clerigo_renal/nivel_01.jpg';
        const dateStr = r.played_at ? new Date(r.played_at).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit'}) : '-';
        const isMe = state.lastSubmittedName && r.player_name === state.lastSubmittedName;
        return `<tr class="rank-${i < 3 ? i+1 : 'n'}${isMe ? ' rank-me' : ''}">
          <td class="col-rank"><span class="rank-badge ${rc}">${rl}</span></td>
          <td class="col-player"><div class="player-cell"><img class="player-avatar" src="${avatar}" alt="" loading="lazy"><span class="player-name-text">${escapeHtml(r.player_name)||'Anônimo'}</span></div></td>
          <td class="col-char">${escapeHtml(r.character_name)||'Desconhecido'}</td>
          <td class="col-score score-cell">${(r.score||0).toLocaleString('pt-BR')}</td>
          <td class="col-level level-cell">${r.level||1}</td>
          <td class="col-chests chests-cell">${r.chests_opened||0}</td>
          <td class="col-date date-cell">${dateStr}</td>
        </tr>`;
      }).join('');
    }

    async function renderBoard(forceRefresh = false){
      const now = Date.now();
      if (!forceRefresh && now - _lastBoardFetch < 5000) return;
      _lastBoardFetch = now;
      const loading = document.getElementById('boardLoading');
      const updateEl = document.getElementById('boardLastUpdate');
      const searchEl = document.getElementById('boardSearch');
      if (loading) loading.classList.remove('hidden');
      ui.boardBody.innerHTML = '';
      const data = await boardFetch(forceRefresh);
      if (loading) loading.classList.add('hidden');
      _boardFullData = data.slice(0, 50);
      if (_boardFullData.length === 0) {
        ui.boardBody.innerHTML = '<tr><td colspan="7" class="board-empty">Nenhum aventureiro registrou pontuação ainda.<br>Seja o primeiro a entrar para a história!</td></tr>';
      } else {
        _renderBoardRows(_boardFullData, searchEl?.value || '');
      }
      if (updateEl) updateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}`;

      if (searchEl && !searchEl.dataset.wired) {
        searchEl.dataset.wired = '1';
        let _searchTimer;
        searchEl.addEventListener('input', () => {
          clearTimeout(_searchTimer);
          _searchTimer = setTimeout(() => _renderBoardRows(_boardFullData, searchEl.value), 200);
        });
      }
      const myPosBtn = document.getElementById('boardMyPos');
      if (myPosBtn && !myPosBtn.dataset.wired) {
        myPosBtn.dataset.wired = '1';
        myPosBtn.addEventListener('click', () => {
          if (searchEl) { searchEl.value = ''; _renderBoardRows(_boardFullData, ''); }
          const myRow = ui.boardBody.querySelector('tr.rank-me');
          if (myRow) myRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else _toast('Sua pontuação ainda não está no ranking. Termine uma partida!', 'info');
        });
      }
    }
    window.renderBoard = renderBoard;
