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
        if (!state.selectedCharacter) state.selectedCharacter = 'nephros';
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

            <!-- Avaliações das Questões -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;margin-bottom:18px;">
              <div style="font-size:0.72rem;color:#8a9cc0;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Avaliações Recentes de Questões</div>
              <div id="anRatingsList" style="font-size:0.78rem;color:#c8d8f0;max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px;">Carregando…</div>
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
        const chartEl = document.getElementById('anLevelChart');
        if (chartEl) {
          chartEl.innerHTML = '';
          bands.forEach(b => {
            const count = data.filter(r => r.level >= b.min && r.level <= b.max).length;
            const pct = Math.round(count / maxBandCount * 100);

            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';

            const labelSpan = document.createElement('span');
            labelSpan.style.cssText = 'width:62px;font-size:0.72rem;color:#8a9cc0;flex-shrink:0;';
            labelSpan.textContent = b.label;

            const progressContainer = document.createElement('div');
            progressContainer.style.cssText = 'flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:14px;overflow:hidden;';

            const progressBar = document.createElement('div');
            progressBar.style.cssText = `width:${pct}%;height:100%;background:linear-gradient(90deg,var(--blue-dark),var(--blue));border-radius:4px;transition:width 0.5s;`;
            progressContainer.appendChild(progressBar);

            const countSpan = document.createElement('span');
            countSpan.style.cssText = 'font-size:0.72rem;color:#c8d8f0;width:28px;text-align:right;';
            countSpan.textContent = count;

            rowDiv.appendChild(labelSpan);
            rowDiv.appendChild(progressContainer);
            rowDiv.appendChild(countSpan);
            chartEl.appendChild(rowDiv);
          });
        }

        // Top 5
        const medals = ['🥇','🥈','🥉','4º','5º'];
        const top5El = document.getElementById('anTop5');
        if (top5El) {
          top5El.innerHTML = '';
          data.slice(0, 5).forEach((r, i) => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);';

            const spanMedal = document.createElement('span');
            spanMedal.style.cssText = 'width:24px;font-size:0.85rem;';
            spanMedal.textContent = medals[i];

            const spanName = document.createElement('span');
            spanName.style.cssText = 'flex:1;color:#e8efff;';
            spanName.textContent = (r.player_name || 'Anônimo').slice(0, 28);

            const spanScore = document.createElement('span');
            spanScore.style.cssText = 'color:var(--gold);font-weight:700;';
            spanScore.textContent = (r.score || 0).toLocaleString('pt-BR');

            const spanLevel = document.createElement('span');
            spanLevel.style.cssText = 'color:#8a9cc0;font-size:0.72rem;';
            spanLevel.textContent = `Lv${r.level || 1}`;

            itemDiv.appendChild(spanMedal);
            itemDiv.appendChild(spanName);
            itemDiv.appendChild(spanScore);
            itemDiv.appendChild(spanLevel);
            top5El.appendChild(itemDiv);
          });
        }

        // Carregar avaliações das questões do Supabase
        const ratingsEl = document.getElementById('anRatingsList');
        if (ratingsEl) {
          ratingsEl.innerHTML = '<div style="color:var(--txt-dim); font-size:0.74rem;">Carregando avaliações…</div>';
          try {
            const { data: ratingData, error: ratingError } = await _supaClient
              .from('question_ratings')
              .select('question_id, question_text, rating_quality, rating_learning, player_email, created_at')
              .order('created_at', { ascending: false })
              .limit(50);

            if (ratingError) throw ratingError;

            if (!ratingData || ratingData.length === 0) {
              ratingsEl.innerHTML = '<div style="color:var(--txt-dim); font-size:0.74rem; text-align:center; padding:10px 0;">Nenhuma avaliação registrada ainda.</div>';
            } else {
              const stars = (num) => '★'.repeat(num) + '☆'.repeat(5 - num);
              ratingsEl.innerHTML = ratingData.map(r => {
                const dateStr = new Date(r.created_at).toLocaleDateString('pt-BR');
                return `
                  <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; font-size:0.74rem; line-height:1.4;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.65rem; color:var(--txt-dim); margin-bottom:4px;">
                      <span>Q#${r.question_id} &nbsp;·&nbsp; ${escapeHtml(r.player_email)}</span>
                      <span>${dateStr}</span>
                    </div>
                    <div style="font-size:0.78rem; color:#fff; font-weight:600; margin-bottom:6px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical; max-height:2.8em; line-height:1.3;">"${escapeHtml(r.question_text)}"</div>
                    <div style="display:flex; gap:12px; font-size:0.7rem; border-top:1px solid rgba(255,255,255,0.03); padding-top:4px;">
                      <span>Qualidade: <strong style="color:#fbbf24;">${stars(r.rating_quality)}</strong></span>
                      <span>Aprendizado: <strong style="color:#fbbf24;">${stars(r.rating_learning)}</strong></span>
                    </div>
                  </div>
                `;
              }).join('');
            }
          } catch (err) {
            console.error('[NQ] Load ratings error', err);
            ratingsEl.innerHTML = '<div style="color:#fb7185; font-size:0.74rem;">Erro ao carregar avaliações.</div>';
          }
        }

      } catch(e) {
        if (typeof _reportError === 'function') _reportError(e, { action: 'loadAnalyticsData' });
        ['anLevelChart','anTop5','anRatingsList'].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML = '';
            const errDiv = document.createElement('div');
            errDiv.style.cssText = 'color:#fb7185;font-size:0.78rem;';
            errDiv.textContent = 'Erro ao carregar dados.';
            el.appendChild(errDiv);
          }
        });
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
        if (typeof _reportError === 'function') _reportError(e, { action: 'adminLoadWhitelist' });
        list.innerHTML = '<div class="whitelist-empty" style="color:#fb7185">Erro ao carregar. Verifique a tabela no Supabase.</div>';
      }
    }
    async function adminAddWhitelist() {
      if (!isAdminUser()) return;
      const input = document.getElementById('wlEmailInput');
      const email = input?.value.trim().toLowerCase();
      if (!email || !email.includes('@')) { _toast('Digite um email válido.', 'error'); return; }
      if (!_supaClient) return;
      if (!_supaClient) { _toast('Cliente Supabase não disponível.', 'error'); return; }
      try {
        const { error } = await _supaClient
          .from('access_whitelist')
          .upsert({ email, added_at: new Date().toISOString() });
        if (error) throw error;
        if (input) input.value = '';
        _toast('Email adicionado com sucesso!', 'ok');
        adminLoadWhitelist();
      } catch(e) {
        if (typeof _reportError === 'function') _reportError(e, { action: 'adminAddWhitelist', email });
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
        if (typeof _reportError === 'function') _reportError(e, { action: 'adminRemoveWhitelist', email });
        _toast('Erro ao remover: ' + (e.message || e), 'error');
      }
    }

    // ── Campanha de Push (notificações aos assinantes) ──────────────────────
    function openPushCampaign() {
      if (!isAdminUser()) return;
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      document.getElementById('pushCampaignModal')?.remove();
      const modal = document.createElement('div');
      modal.id = 'pushCampaignModal';
      modal.className = 'nq-overlay';
      modal.style.cssText = 'background:rgba(0,0,0,0.88);z-index:9998;backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-panel" style="max-width:460px;width:100%;">
          <button class="modal-panel-x" data-action="closePushCampaign" aria-label="Fechar">&times;</button>
          <h2>📣 Campanha (Push)</h2>
          <p style="color:#8a9cc0;font-size:0.78rem;margin-bottom:4px;">Envia uma notificação push para <strong>todos os usuários que ativaram notificações</strong> (não é e-mail; alcança apenas quem deu permissão).</p>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
            <input id="pushCampTitle" type="text" maxlength="60" placeholder="Título (ex.: Nova questão no NefroQuest!)" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#fff;padding:9px 12px;font-size:0.85rem;outline:none;">
            <textarea id="pushCampBody" maxlength="160" rows="3" placeholder="Mensagem (até 160 caracteres)" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#fff;padding:9px 12px;font-size:0.85rem;outline:none;resize:vertical;"></textarea>
            <input id="pushCampUrl" type="text" placeholder="Link ao clicar (opcional, ex.: /)" value="/" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#fff;padding:9px 12px;font-size:0.82rem;outline:none;">
          </div>
          <div id="pushCampStatus" style="font-size:0.76rem;color:var(--txt-dim);margin-top:12px;min-height:18px;"></div>
          <div class="modal-actions" style="margin-top:14px;display:flex;gap:10px;">
            <button id="pushCampSend" class="btn gold" style="flex:1;" data-action="_sendPushCampaign">📣 Enviar campanha</button>
            <button data-action="closePushCampaign" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      setTimeout(() => document.getElementById('pushCampTitle')?.focus(), 60);
    }
    function closePushCampaign() { document.getElementById('pushCampaignModal')?.remove(); }

    async function _sendPushCampaign() {
      if (!isAdminUser()) return;
      const title = (document.getElementById('pushCampTitle')?.value || '').trim();
      const body  = (document.getElementById('pushCampBody')?.value || '').trim();
      const url   = (document.getElementById('pushCampUrl')?.value || '').trim() || '/';
      const statusEl = document.getElementById('pushCampStatus');
      const btn = document.getElementById('pushCampSend');
      if (!title || !body) {
        if (statusEl) { statusEl.style.color = '#fbbf24'; statusEl.textContent = 'Preencha título e mensagem.'; }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
      if (statusEl) { statusEl.style.color = 'var(--txt-dim)'; statusEl.textContent = 'Enviando…'; }
      try {
        if (typeof _supaClient === 'undefined' || !_supaClient) throw new Error('Sessão indisponível.');
        // functions.invoke já inclui o token do admin logado no Authorization.
        const { data, error } = await _supaClient.functions.invoke('send-push', { body: { title, body, url } });
        if (error) throw error;
        const sent = data?.sent ?? 0, failed = data?.failed ?? 0, stale = data?.stale_removed ?? 0;
        if (statusEl) {
          statusEl.style.color = '#4ade80';
          statusEl.textContent = `✅ Enviado para ${sent} dispositivo(s). Falhas: ${failed}${stale ? ` · ${stale} expirada(s) removida(s)` : ''}.`;
        }
        if (typeof playSound === 'function') playSound('chest');
      } catch (e) {
        if (statusEl) { statusEl.style.color = '#f87171'; statusEl.textContent = '❌ Erro: ' + (e?.message || e); }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📣 Enviar campanha'; }
      }
    }
    window.openPushCampaign       = openPushCampaign;
    window.closePushCampaign      = closePushCampaign;
    window._sendPushCampaign      = _sendPushCampaign;

    window.adminAddWhitelist      = adminAddWhitelist;
    window.openAdminPanel         = openAdminPanel;
    window.adminJumpToBoss        = adminJumpToBoss;
    window.loadAnalyticsData      = loadAnalyticsData;
