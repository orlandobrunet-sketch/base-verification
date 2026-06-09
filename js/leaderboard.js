// NefroQuest — Leaderboard (data layer + render layer)
// Loaded before game.js. Functions become global via hoisting.

    let _boardCache = null;
    let _boardCacheTime = 0;
    let _boardFetchPromise = null; // in-flight lock — evita race condition em fetches paralelos
    const BOARD_CACHE_TTL = 30000; // 30s
    const BOARD_LOCAL_KEY = 'nefroquest-leaderboard';

    let boardPushState = 'idle'; // 'idle' | 'in_flight' | 'done' | 'failed'
    let boardPushTimeout = null;

    function transitionBoardPush(newState) {
      console.log(`[LeaderboardFSM] Push State: ${boardPushState} -> ${newState}`);
      boardPushState = newState;
      if (boardPushTimeout) {
        clearTimeout(boardPushTimeout);
        boardPushTimeout = null;
      }
      
      // Set a defensive timeout of 10 seconds for 'in_flight'
      if (newState === 'in_flight') {
        boardPushTimeout = setTimeout(() => {
          if (boardPushState === 'in_flight') {
            console.warn("[LeaderboardFSM] Push request timed out. Resetting to failed.");
            transitionBoardPush('failed');
          }
        }, 10000);
      }
    }

    Object.defineProperty(window, '_boardPushedThisSession', {
      get: () => (boardPushState === 'in_flight' || boardPushState === 'done'),
      set: (val) => {
        if (!val) {
          transitionBoardPush('idle');
        } else {
          transitionBoardPush('done');
        }
      },
      configurable: true
    });

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
        if (typeof _reportError === 'function') {
          _reportError(e, { action: 'boardFetch' });
        } else {
          _track('error_leaderboard_fetch', {msg: String(e)});
        }
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
        } catch(e2) {
          if (typeof _reportError === 'function') _reportError(e2, { action: 'boardFetch_parseCache' });
        }
        _toast('Erro ao carregar o leaderboard. Verifique sua conexão.', 'error');
        return [];
      }
    }

    async function boardPush(score, level, playerName) {
      // Rate limiting: 1 push por sessão de jogo
      if (boardPushState === 'in_flight' || boardPushState === 'done') return;
      // Sanity check: score e level devem ser números positivos razoáveis
      if (typeof score !== 'number' || score < 0 || score > 9_999_999) return;
      if (typeof level !== 'number' || level < 1 || level > 999) return;

      transitionBoardPush('in_flight');
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

      if (!navigator.onLine) {
        try {
          const pending = JSON.parse(localStorage.getItem('nq-pending-leaderboard') || '[]');
          pending.push(payload);
          localStorage.setItem('nq-pending-leaderboard', JSON.stringify(pending));
          transitionBoardPush('idle'); // permite tentar novamente online
        } catch(e) {
          transitionBoardPush('failed');
        }
        return;
      }

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
        transitionBoardPush('done');
      } catch(e) {
        if (typeof _reportError === 'function') {
          _reportError(e, { action: 'boardPush', score, level });
        } else {
          _track('error_leaderboard_push', {msg: String(e)});
        }
        transitionBoardPush('failed'); // permitir retry em caso de erro de rede
      }
    }

    // ── Perfil Global (DC-4): ranking por desempenho ACUMULADO ──────────────
    let _profileCache = null;

    // Envia (upsert) as estatísticas acumuladas do usuário autenticado.
    async function profileStatsPush() {
      const userId = authUser?.id;
      if (!userId) return; // só autenticados têm perfil global acumulado
      let totalCorrect = 0, totalGames = 0, bestLevel = 1;
      try {
        const ds = (typeof getDetailedStats === 'function') ? getDetailedStats() : {};
        const gs = (typeof getGameStats === 'function') ? getGameStats() : {};
        totalCorrect = Math.max(0, Math.min(100000000, Math.floor(ds.totalCorrect || 0)));
        totalGames   = Math.max(0, Math.min(1000000, Math.floor(gs.gamesPlayed || 0)));
        bestLevel    = Math.max(1, Math.min(999, Math.floor(gs.bestLevel || 1)));
      } catch (e) { return; }
      const playerName = ((typeof _authDisplayName === 'function' && _authDisplayName()) || state.lastSubmittedName || 'Anônimo').substring(0, 40);
      const charName = state.character && characters[state.character] ? characters[state.character].name : null;
      const payload = {
        user_id: userId, player_name: playerName, character_name: charName,
        total_correct: totalCorrect, total_games: totalGames, best_level: bestLevel,
        updated_at: new Date().toISOString()
      };
      if (!navigator.onLine) return;
      try {
        const token = await (async () => { try { return (await _supaClient?.auth?.getSession())?.data?.session?.access_token || SUPA_KEY; } catch { return SUPA_KEY; } })();
        await fetch(`${SUPA_URL}/rest/v1/profiles_stats`, {
          method: 'POST',
          headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(payload)
        });
        _profileCache = null;
      } catch (e) {
        if (typeof _reportError === 'function') _reportError(e, { action: 'profileStatsPush' });
      }
    }
    window.profileStatsPush = profileStatsPush;

    async function _doProfileFetch() {
      try {
        const res = await fetch(`${SUPA_URL}/rest/v1/profiles_stats?select=*&order=total_correct.desc,best_level.desc&limit=50`, {
          headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        _profileCache = data;
        return data;
      } catch (e) {
        if (typeof _reportError === 'function') _reportError(e, { action: 'profileFetch' });
        if (_profileCache) return _profileCache;
        _toast('Erro ao carregar o ranking de perfil. Verifique sua conexão.', 'error');
        return [];
      }
    }
    // Exposto para o dashboard reaproveitar o ranking de Perfil Global.
    window._profileGlobalFetch = _doProfileFetch;

    async function syncPendingLeaderboard() {
      if (!navigator.onLine) return;
      try {
        const pending = JSON.parse(localStorage.getItem('nq-pending-leaderboard') || '[]');
        if (!pending.length) return;
        localStorage.removeItem('nq-pending-leaderboard');
        for (const payload of pending) {
          const prefer = payload.user_id ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal';
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
        }
        _boardCache = null;
      } catch(e) {
        if (typeof _reportError === 'function') _reportError(e, { action: 'syncPendingLeaderboard' });
      }
    }
    window.syncPendingLeaderboard = syncPendingLeaderboard;

    // Manter compatibilidade com boardGet síncrono (usa cache)
    function boardGet() { return _boardCache || []; }
    function boardSave() {} // no-op, Supabase é o storage

    let _lastBoardFetch = 0;
    let _boardFullData = [];

    // Modo do quadro: 'record' (recorde por partida) | 'global' (perfil acumulado)
    let _boardMode = 'record';
    const _CHAR_AVATARS = {
      'Dr. Nephros':    'assets/classes/clerigo_renal/nivel_01.jpg',
      'Dra. Aquaria':   'assets/classes/maga_metabolica/nivel_01.jpg',
      'Dr. Glomerulus': 'assets/classes/guerreiro_glomerular/nivel_01.png'
    };

    function _setBoardMode(mode) {
      if (mode !== 'record' && mode !== 'global') return;
      if (mode === _boardMode) return;
      _boardMode = mode;
      document.querySelectorAll('.board-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.arg === mode));
      const sub = document.querySelector('.board-subtitle');
      if (sub) sub.textContent = mode === 'global' ? 'Quem mais acertou ao longo da jornada' : 'Os maiores nefrologistas do reino';
      renderBoard(true);
    }
    window._setBoardMode = _setBoardMode;

    function _setBoardHead() {
      const head = document.getElementById('boardHead');
      if (!head) return;
      head.innerHTML = (_boardMode === 'global')
        ? '<tr><th class="col-rank">#</th><th class="col-player">Jogador</th><th class="col-score">Acertos</th><th class="col-level">Nível máx</th><th class="col-chests">Partidas</th></tr>'
        : '<tr><th class="col-rank">#</th><th class="col-player">Jogador</th><th class="col-char">Personagem</th><th class="col-score">Pontos</th><th class="col-level">Nível</th><th class="col-chests">Baús</th><th class="col-date">Data</th></tr>';
    }

    function _renderCurrentRows(query) {
      if (_boardMode === 'global') _renderProfileRows(_boardFullData, query);
      else _renderBoardRows(_boardFullData, query);
    }

    // Render do ranking de perfil global (colunas: acertos / nível máx / partidas)
    function _renderProfileRows(data, query) {
      const rankClass = ['r1','r2','r3'];
      const rankLabel = ['🥇','🥈','🥉'];
      const q = (query || '').trim().toLowerCase();
      const filtered = data.map((r, globalIdx) => ({ r, globalIdx }))
        .filter(({ r }) => !q ||
          (r.player_name || '').toLowerCase().includes(q) ||
          (r.character_name || '').toLowerCase().includes(q));
      ui.boardBody.innerHTML = '';
      if (!filtered.length) {
        const trEmpty = document.createElement('tr');
        const tdEmpty = document.createElement('td');
        tdEmpty.colSpan = 5;
        tdEmpty.className = 'board-empty';
        tdEmpty.textContent = q ? 'Nenhum resultado encontrado.' : 'Ninguém montou um perfil ainda. Jogue para acumular acertos!';
        trEmpty.appendChild(tdEmpty);
        ui.boardBody.appendChild(trEmpty);
        return;
      }
      const myId = (typeof authUser !== 'undefined' && authUser) ? authUser.id : null;
      filtered.forEach(({ r, globalIdx }, filteredIdx) => {
        const i = q ? filteredIdx : globalIdx;
        const rc = i < 3 ? rankClass[i] : 'rn';
        const rl = i < 3 ? rankLabel[i] : (i + 1);
        const avatar = _CHAR_AVATARS[r.character_name] || 'assets/classes/clerigo_renal/nivel_01.jpg';
        const isMe = myId && r.user_id === myId;

        const tr = document.createElement('tr');
        tr.className = `rank-${i < 3 ? i+1 : 'n'}${isMe ? ' rank-me' : ''}`;

        const tdRank = document.createElement('td');
        tdRank.className = 'col-rank';
        const spanRank = document.createElement('span');
        spanRank.className = `rank-badge ${rc}`;
        spanRank.textContent = rl;
        tdRank.appendChild(spanRank);
        tr.appendChild(tdRank);

        const tdPlayer = document.createElement('td');
        tdPlayer.className = 'col-player';
        const divPlayer = document.createElement('div');
        divPlayer.className = 'player-cell';
        const imgAvatar = document.createElement('img');
        imgAvatar.className = 'player-avatar';
        imgAvatar.src = avatar; imgAvatar.alt = ''; imgAvatar.setAttribute('loading', 'lazy');
        const spanName = document.createElement('span');
        spanName.className = 'player-name-text';
        spanName.textContent = r.player_name || 'Anônimo';
        divPlayer.appendChild(imgAvatar); divPlayer.appendChild(spanName);
        tdPlayer.appendChild(divPlayer);
        tr.appendChild(tdPlayer);

        // Perfil Global: sem coluna de personagem — só o apelido identifica.
        const tdCorrect = document.createElement('td');
        tdCorrect.className = 'col-score score-cell';
        tdCorrect.textContent = (r.total_correct || 0).toLocaleString('pt-BR');
        tr.appendChild(tdCorrect);

        const tdLevel = document.createElement('td');
        tdLevel.className = 'col-level level-cell';
        tdLevel.textContent = r.best_level || 1;
        tr.appendChild(tdLevel);

        const tdGames = document.createElement('td');
        tdGames.className = 'col-chests chests-cell';
        tdGames.textContent = r.total_games || 0;
        tr.appendChild(tdGames);

        ui.boardBody.appendChild(tr);
      });
    }

    function _renderBoardRows(data, query) {
      const rankClass = ['r1','r2','r3'];
      const rankLabel = ['🥇','🥈','🥉'];
      const charAvatars = _CHAR_AVATARS;
      const q = (query || '').trim().toLowerCase();
      const filtered = data.map((r, globalIdx) => ({ r, globalIdx }))
        .filter(({ r }) => !q ||
          (r.player_name    || '').toLowerCase().includes(q) ||
          (r.character_name || '').toLowerCase().includes(q)
        );
      ui.boardBody.innerHTML = '';
      if (!filtered.length) {
        const trEmpty = document.createElement('tr');
        const tdEmpty = document.createElement('td');
        tdEmpty.colSpan = 7;
        tdEmpty.className = 'board-empty';
        tdEmpty.textContent = 'Nenhum resultado encontrado.';
        trEmpty.appendChild(tdEmpty);
        ui.boardBody.appendChild(trEmpty);
        return;
      }
      filtered.forEach(({ r, globalIdx }, filteredIdx) => {
        const i = q ? filteredIdx : globalIdx; // quando busca ativa, rank é da posição filtrada
        const rc = i < 3 ? rankClass[i] : 'rn';
        const rl = i < 3 ? rankLabel[i] : (i + 1);
        const avatar = charAvatars[r.character_name] || 'assets/classes/clerigo_renal/nivel_01.jpg';
        const dateStr = r.played_at ? new Date(r.played_at).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit'}) : '-';
        const isMe = state.lastSubmittedName && r.player_name === state.lastSubmittedName;

        const tr = document.createElement('tr');
        tr.className = `rank-${i < 3 ? i+1 : 'n'}${isMe ? ' rank-me' : ''}`;

        // Rank cell
        const tdRank = document.createElement('td');
        tdRank.className = 'col-rank';
        const spanRank = document.createElement('span');
        spanRank.className = `rank-badge ${rc}`;
        spanRank.textContent = rl;
        tdRank.appendChild(spanRank);
        tr.appendChild(tdRank);

        // Player cell
        const tdPlayer = document.createElement('td');
        tdPlayer.className = 'col-player';
        const divPlayer = document.createElement('div');
        divPlayer.className = 'player-cell';
        
        const imgAvatar = document.createElement('img');
        imgAvatar.className = 'player-avatar';
        imgAvatar.src = avatar;
        imgAvatar.alt = '';
        imgAvatar.setAttribute('loading', 'lazy');
        
        const spanName = document.createElement('span');
        spanName.className = 'player-name-text';
        spanName.textContent = r.player_name || 'Anônimo';
        
        divPlayer.appendChild(imgAvatar);
        divPlayer.appendChild(spanName);
        tdPlayer.appendChild(divPlayer);
        tr.appendChild(tdPlayer);

        // Character cell
        const tdChar = document.createElement('td');
        tdChar.className = 'col-char';
        tdChar.textContent = r.character_name || 'Desconhecido';
        tr.appendChild(tdChar);

        // Score cell
        const tdScore = document.createElement('td');
        tdScore.className = 'col-score score-cell';
        tdScore.textContent = (r.score || 0).toLocaleString('pt-BR');
        tr.appendChild(tdScore);

        // Level cell
        const tdLevel = document.createElement('td');
        tdLevel.className = 'col-level level-cell';
        tdLevel.textContent = r.level || 1;
        tr.appendChild(tdLevel);

        // Chests cell
        const tdChests = document.createElement('td');
        tdChests.className = 'col-chests chests-cell';
        tdChests.textContent = r.chests_opened || 0;
        tr.appendChild(tdChests);

        // Date cell
        const tdDate = document.createElement('td');
        tdDate.className = 'col-date date-cell';
        tdDate.textContent = dateStr;
        tr.appendChild(tdDate);

        ui.boardBody.appendChild(tr);
      });
    }

    async function renderBoard(forceRefresh = false){
      const now = Date.now();
      if (!forceRefresh && now - _lastBoardFetch < 5000) return;
      _lastBoardFetch = now;
      const loading = document.getElementById('boardLoading');
      const updateEl = document.getElementById('boardLastUpdate');
      const searchEl = document.getElementById('boardSearch');
      _setBoardHead();
      if (loading) loading.classList.remove('hidden');
      ui.boardBody.innerHTML = '';
      const data = (_boardMode === 'global') ? await _doProfileFetch() : await boardFetch(forceRefresh);
      if (loading) loading.classList.add('hidden');
      _boardFullData = data.slice(0, 50);
      if (_boardFullData.length === 0) {
        ui.boardBody.innerHTML = '';
        const trEmpty = document.createElement('tr');
        const tdEmpty = document.createElement('td');
        tdEmpty.colSpan = (_boardMode === 'global') ? 6 : 7;
        tdEmpty.className = 'board-empty';
        if (_boardMode === 'global') {
          tdEmpty.appendChild(document.createTextNode('Ninguém montou um perfil ainda.'));
          tdEmpty.appendChild(document.createElement('br'));
          tdEmpty.appendChild(document.createTextNode('Jogue para acumular acertos e aparecer aqui!'));
        } else {
          tdEmpty.appendChild(document.createTextNode('Nenhum aventureiro registrou pontuação ainda.'));
          tdEmpty.appendChild(document.createElement('br'));
          tdEmpty.appendChild(document.createTextNode('Seja o primeiro a entrar para a história!'));
        }
        trEmpty.appendChild(tdEmpty);
        ui.boardBody.appendChild(trEmpty);
      } else {
        _renderCurrentRows(searchEl?.value || '');
      }
      if (updateEl) updateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}`;

      if (searchEl && !searchEl.dataset.wired) {
        searchEl.dataset.wired = '1';
        let _searchTimer;
        searchEl.addEventListener('input', () => {
          clearTimeout(_searchTimer);
          _searchTimer = setTimeout(() => _renderCurrentRows(searchEl.value), 200);
        });
      }
      const myPosBtn = document.getElementById('boardMyPos');
      if (myPosBtn && !myPosBtn.dataset.wired) {
        myPosBtn.dataset.wired = '1';
        myPosBtn.addEventListener('click', () => {
          if (searchEl) { searchEl.value = ''; _renderCurrentRows(''); }
          const myRow = ui.boardBody.querySelector('tr.rank-me');
          if (myRow) myRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else _toast('Você ainda não está no ranking. Termine uma partida!', 'info');
        });
      }
    }
    window.renderBoard = renderBoard;
