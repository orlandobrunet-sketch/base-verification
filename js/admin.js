// NefroQuest — Admin Panel & Analytics
// Plain script — shares global scope with game.js

    // ============ ADMIN PANEL ============
    async function adminJumpToBoss() {
      if (!isAdminUser()) return;
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));

      if (!questionBank) {
        _toast('Carregando questões…', 'info', 30000);
        try { await _loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }

      if (!state.gameStarted) {
        if (!state.selectedCharacter) state.selectedCharacter = 'guerreiro';
        state.gameStarted = true;
        document.getElementById('welcomeScreen')?.classList.add('hidden');
        document.getElementById('mainApp')?.classList.remove('hidden');
        document.getElementById('actionDock')?.classList.remove('hidden');
      }
      state.correctTotal = BOSS_START_CORRECT;
      state.narrativeShown = BOSS_START_CORRECT;
      state.bossIntroShown = true;
      state.battleFinalShown = false;
      shuffleQueue();
      renderHUD();
      updateBadges();
      renderQuestion();
      updateBossUI();
      applyBossOptionBadges();
      setTimeout(() => showBossIntroPopup(), 50);
    }

    function openAdminPanel() {
      if (!isAdminUser()) return;
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('adminModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'nq-overlay nq-overlay--hidden';
        modal.style.cssText = 'background:rgba(0,0,0,0.88);z-index:9998;backdrop-filter:blur(8px);';
        modal.innerHTML = `
          <div class="modal-panel" style="max-width:500px">
            <button class="modal-panel-x" data-action="closeAdminPanel" aria-label="Fechar">&times;</button>
            <h2>🛡 Administração — Lista de Acesso</h2>
            <p style="color:#a0b8d0;font-size:0.82rem;margin-bottom:14px">Emails com acesso completo (lista de amigos / convidados).</p>
            <div class="whitelist-input-row">
              <input id="wlEmailInput" type="email" placeholder="email@exemplo.com">
              <button class="btn gold" style="white-space:nowrap;padding:8px 16px" data-action="adminAddWhitelist">+ Adicionar</button>
            </div>
            <div id="wlList" class="whitelist-list"><div class="whitelist-empty">Carregando...</div></div>
            <div class="modal-actions" style="margin-top:16px">
              <button data-action="closeAdminPanel" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
      adminLoadWhitelist();
    }
    function closeAdminPanel() {
      const m = document.getElementById('adminModal');
      if (m) m.style.display = 'none';
    }

    // ── Analytics Panel ───────────────────────────────────────────────────────
    function openAnalyticsPanel() {
      if (!isAdminUser()) return;
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('analyticsModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'analyticsModal';
        modal.className = 'nq-overlay nq-overlay--hidden nq-overlay--top';
        modal.style.cssText = 'background:rgba(0,0,0,0.88);z-index:9998;backdrop-filter:blur(8px);padding:20px 16px;';
        modal.innerHTML = `
          <div class="modal-panel" style="max-width:560px;width:100%;margin:auto 0;">
            <button class="modal-panel-x" data-action="closeAnalyticsPanel" aria-label="Fechar">&times;</button>
            <h2>📊 Analytics — NefroQuest</h2>
            <p style="color:#8a9cc0;font-size:0.78rem;margin-bottom:16px;">Dados em tempo real do Supabase + funil de eventos no GA4.</p>

            <!-- Métricas do ranking -->
            <div id="analyticsStats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;">
              <div style="background:rgba(255,255,255,0.04);border:1px solid var(--blue-dark);border-radius:10px;padding:12px;text-align:center;">
                <div id="anTotalPlayers" style="font-size:1.6rem;font-weight:700;color:var(--gold);">—</div>
                <div style="font-size:0.68rem;color:#8a9cc0;margin-top:2px;">jogadores</div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid var(--blue-dark);border-radius:10px;padding:12px;text-align:center;">
                <div id="anAvgScore" style="font-size:1.6rem;font-weight:700;color:var(--blue);">—</div>
                <div style="font-size:0.68rem;color:#8a9cc0;margin-top:2px;">score médio</div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid var(--blue-dark);border-radius:10px;padding:12px;text-align:center;">
                <div id="anMaxScore" style="font-size:1.6rem;font-weight:700;color:var(--ok);">—</div>
                <div style="font-size:0.68rem;color:#8a9cc0;margin-top:2px;">recorde</div>
              </div>
            </div>

            <!-- Distribuição de níveis -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;margin-bottom:18px;">
              <div style="font-size:0.72rem;color:#8a9cc0;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Distribuição de Níveis</div>
              <div id="anLevelChart" style="font-size:0.78rem;color:#c8d8f0;">Carregando…</div>
            </div>

            <!-- Top 5 scores -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;margin-bottom:18px;">
              <div style="font-size:0.72rem;color:#8a9cc0;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Top 5 Jogadores</div>
              <div id="anTop5" style="font-size:0.82rem;color:#c8d8f0;">Carregando…</div>
            </div>

            <!-- Link GA4 -->
            <div style="background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.3);border-radius:10px;padding:14px;margin-bottom:18px;">
              <div style="font-size:0.72rem;color:#8a9cc0;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Funil de Eventos (GA4)</div>
              <p style="font-size:0.78rem;color:#a0b8d0;margin-bottom:10px;line-height:1.5;">
                Eventos instrumentados: <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">game_started</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">question_answered</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">boss_entered</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">game_completed</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">paywall_shown</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">premium_converted</code>
              </p>
              <a href="https://analytics.google.com" target="_blank" rel="noopener"
                style="display:inline-flex;align-items:center;gap:6px;background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.4);color:var(--blue);border-radius:8px;padding:8px 14px;font-size:0.78rem;font-weight:600;text-decoration:none;cursor:pointer;">
                🔗 Abrir Google Analytics 4
              </a>
            </div>

            <div class="modal-actions">
              <button data-action="closeAnalyticsPanel" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button>
              <button data-action="loadAnalyticsData" style="background:rgba(96,165,250,0.12);color:var(--blue);border:1px solid rgba(96,165,250,0.4);">↺ Atualizar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
      loadAnalyticsData();
    }

    function closeAnalyticsPanel() {
      const m = document.getElementById('analyticsModal');
      if (m) m.style.display = 'none';
    }

    async function loadAnalyticsData() {
      if (!_supaClient) return;
      try {
        // Busca dados do leaderboard
        const { data, error } = await _supaClient
          .from('leaderboard')
          .select('player_name, score, level')
          .order('score', { ascending: false })
          .limit(200);
        if (error) throw error;
        if (!data || data.length === 0) {
          document.getElementById('anTotalPlayers').textContent = '0';
          document.getElementById('anAvgScore').textContent = '0';
          document.getElementById('anMaxScore').textContent = '0';
          document.getElementById('anLevelChart').textContent = 'Sem dados ainda.';
          document.getElementById('anTop5').textContent = 'Sem dados ainda.';
          return;
        }

        // Métricas gerais
        const total = data.length;
        const avgScore = Math.round(data.reduce((s, r) => s + (r.score || 0), 0) / total);
        const maxScore = data[0].score || 0;
        document.getElementById('anTotalPlayers').textContent = total.toLocaleString('pt-BR');
        document.getElementById('anAvgScore').textContent = avgScore.toLocaleString('pt-BR');
        document.getElementById('anMaxScore').textContent = maxScore.toLocaleString('pt-BR');

        // Distribuição de níveis em faixas
        const bands = [
          { label: 'Lv 1–5',   min: 1,  max: 5  },
          { label: 'Lv 6–10',  min: 6,  max: 10 },
          { label: 'Lv 11–20', min: 11, max: 20 },
          { label: 'Lv 21–50', min: 21, max: 50 },
          { label: 'Lv 51+',   min: 51, max: 999 },
        ];
        const maxBandCount = Math.max(...bands.map(b => data.filter(r => r.level >= b.min && r.level <= b.max).length), 1);
        document.getElementById('anLevelChart').innerHTML = bands.map(b => {
          const count = data.filter(r => r.level >= b.min && r.level <= b.max).length;
          const pct = Math.round(count / maxBandCount * 100);
          return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="width:62px;font-size:0.72rem;color:#8a9cc0;flex-shrink:0;">${b.label}</span>
            <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:14px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--blue-dark),var(--blue));border-radius:4px;transition:width 0.5s;"></div>
            </div>
            <span style="font-size:0.72rem;color:#c8d8f0;width:28px;text-align:right;">${count}</span>
          </div>`;
        }).join('');

        // Top 5
        const medals = ['🥇','🥈','🥉','4º','5º'];
        document.getElementById('anTop5').innerHTML = data.slice(0, 5).map((r, i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="width:24px;font-size:0.85rem;">${medals[i]}</span>
            <span style="flex:1;color:#e8efff;">${escapeHtml((r.player_name||'Anônimo').slice(0,28))}</span>
            <span style="color:var(--gold);font-weight:700;">${(r.score||0).toLocaleString('pt-BR')}</span>
            <span style="color:#8a9cc0;font-size:0.72rem;">Lv${r.level||1}</span>
          </div>
        `).join('');
      } catch(e) {
        const err = '<div style="color:#fb7185;font-size:0.78rem;">Erro ao carregar dados.</div>';
        ['anLevelChart','anTop5'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = err; });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    async function adminLoadWhitelist() {
      const list = document.getElementById('wlList');
      if (!list || !_supaClient) return;
      list.innerHTML = '<div class="whitelist-empty">Carregando...</div>';
      try {
        const { data, error } = await _supaClient
          .from('access_whitelist')
          .select('email, added_at')
          .order('added_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
          list.innerHTML = '<div class="whitelist-empty">Nenhum email na lista ainda.</div>';
          return;
        }
        list.innerHTML = '';
        data.forEach(r => {
          const item = document.createElement('div');
          item.className = 'whitelist-item';
          const span = document.createElement('span');
          span.textContent = r.email;
          const btn = document.createElement('button');
          btn.textContent = 'Remover';
          btn.addEventListener('click', () => adminRemoveWhitelist(r.email));
          item.appendChild(span);
          item.appendChild(btn);
          list.appendChild(item);
        });
      } catch(e) {
        list.innerHTML = '<div class="whitelist-empty" style="color:#fb7185">Erro ao carregar. Verifique a tabela no Supabase.</div>';
      }
    }
    async function adminAddWhitelist() {
      if (!isAdminUser()) return;
      const input = document.getElementById('wlEmailInput');
      const email = input?.value.trim().toLowerCase();
      if (!email || !email.includes('@')) { _toast('Digite um email válido.', 'error'); return; }
      if (!_supaClient) return;
      try {
        const { error } = await _supaClient
          .from('access_whitelist')
          .upsert({ email, added_at: new Date().toISOString() });
        if (error) throw error;
        if (input) input.value = '';
        adminLoadWhitelist();
      } catch(e) {
        _toast('Erro ao adicionar: ' + (e.message || e), 'error');
      }
    }
    async function adminRemoveWhitelist(email) {
      if (!isAdminUser()) return;
      if (!_supaClient) return;
      if (!confirm(`Remover acesso de ${email}?`)) return;
      try {
        const { error } = await _supaClient
          .from('access_whitelist')
          .delete()
          .eq('email', email);
        if (error) throw error;
        adminLoadWhitelist();
      } catch(e) {
        _toast('Erro ao remover: ' + (e.message || e), 'error');
      }
    }

    window.adminAddWhitelist      = adminAddWhitelist;
    window.openAdminPanel         = openAdminPanel;
    window.adminJumpToBoss        = adminJumpToBoss;
