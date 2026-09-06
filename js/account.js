// NefroQuest — Account Modal, Plan Modal
// Plain script — shares global scope with game.js

    // ============ ACCOUNT MODAL ============
    const ACCT_KEY = 'nefroquest-account';
    let _accountFocus, _deleteAccountFocus;
    let _accountSaving = false;
    function openAccountModal() {
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('accountModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accountModal';
        modal.className = 'nq-overlay nq-overlay--hidden';
        modal.style.cssText = 'background:rgba(0,0,0,0.88);z-index:9998;backdrop-filter:blur(8px);';
        modal.innerHTML = `
          <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="accountTitle">
            <button class="modal-panel-x" data-action="closeAccountModal" aria-label="Fechar">&times;</button>
            <h2 id="accountTitle">👤 Minha Conta</h2>
            <div class="form-group">
              <label for="acctNickname">Apelido <span style="color:var(--txt-dim);font-weight:400;">(aparece no ranking)</span></label>
              <input id="acctNickname" type="text" maxlength="40" placeholder="ex.: NefroMestre — não precisa ser seu nome real">
            </div>
            <div class="form-group">
              <label for="acctName">Nome completo <span style="color:var(--txt-dim);font-weight:400;">(privado)</span></label>
              <input id="acctName" type="text" placeholder="Seu nome">
            </div>
            <div class="form-group">
              <label for="acctEmail">Email</label>
              <input id="acctEmail" type="email" placeholder="seu@email.com" disabled style="opacity:0.5">
            </div>
            <div class="form-group">
              <label for="acctPhone">Telefone / WhatsApp</label>
              <input id="acctPhone" type="tel" placeholder="+55 (11) 99999-9999">
            </div>
            <div class="form-group">
              <label for="acctSpec">Especialidade</label>
              <input id="acctSpec" type="text" placeholder="ex: Nefrologia, Clínica Médica...">
            </div>
            <div class="form-group">
              <label for="acctCity">Cidade</label>
              <input id="acctCity" type="text" placeholder="Sua cidade">
            </div>
            <div class="form-group">
              <label for="acctIdentity">Modo preferido</label>
              <select id="acctIdentity" style="width:100%;background:#0d1525;border:1px solid var(--blue-dark);color:var(--txt);border-radius:var(--radius-md);padding:9px 12px;font-size:1rem;font-family:inherit;">
                <option value="">Não definido</option>
                <option value="study">📖 Estudar</option>
                <option value="combat">⚔️ Combater</option>
              </select>
            </div>
            <p id="accountSaveStatus" role="status" style="color:#fda4af;line-height:1.5;"></p>
            <div class="modal-actions">
              <button data-action="closeAccountModal" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Cancelar</button>
              <button data-action="saveAccountData" style="background:linear-gradient(135deg,#1a4080,#2a5fa0);color:#e0f0ff;border:none;">Salvar</button>
            </div>
            <div style="margin-top:20px;border-top:1px solid rgba(251,113,133,0.25);padding-top:16px;">
              <div style="font-size:0.72rem;color:#fb7185;font-weight:700;letter-spacing:0.06em;margin-bottom:8px;">⚠ ZONA DE RISCO</div>
              <button data-action="confirmDeleteAccount" style="width:100%;background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.4);color:#fb7185;border-radius:8px;padding:9px;font-size:0.82rem;cursor:pointer;">🗑 Excluir minha conta e todos os dados</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      // Populate
      const saved = (() => { try { return JSON.parse(localStorage.getItem(ACCT_KEY) || '{}'); } catch(e) { return {}; } })();
      document.getElementById('acctNickname').value = authUser?.user_metadata?.nickname || '';
      document.getElementById('acctName').value     = authUser?.user_metadata?.full_name || saved.name || '';
      document.getElementById('acctEmail').value    = authUser?.email || '';
      document.getElementById('acctPhone').value    = saved.phone || '';
      document.getElementById('acctSpec').value     = saved.spec  || '';
      document.getElementById('acctCity').value     = saved.city  || '';
      document.getElementById('acctIdentity').value = _getIdentity() || '';
      document.getElementById('accountSaveStatus').textContent = '';
      modal.style.display = 'flex';
      _accountFocus?.(false);
      const returnFocus = [...document.querySelectorAll('[data-action="toggleProfilePopup"]')]
        .find(el => el.getClientRects().length && !el.closest('[hidden], [inert]'));
      _accountFocus = manageDialogFocus(modal, closeAccountModal, returnFocus);
    }
    function closeAccountModal() {
      const m = document.getElementById('accountModal');
      _accountFocus?.();
      _accountFocus = null;
      if (m) m.style.display = 'none';
    }

    function confirmDeleteAccount() {
      closeDeleteAccountConfirm();
      const popup = document.createElement('div');
      popup.className = 'nq-overlay delete-account-confirm';
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-modal', 'true');
      popup.setAttribute('aria-label', 'Excluir Conta');
      popup.style.cssText = 'background:rgba(0,0,0,0.92);z-index:10001;backdrop-filter:blur(8px);padding:24px;';
      popup.innerHTML = `
        <div style="max-width:380px;width:100%;background:linear-gradient(180deg,#1a0a0a,#0d0808);border:2px solid rgba(251,113,133,0.6);border-radius:14px;padding:28px 24px;text-align:center;">
          <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
          <h3 style="color:#fb7185;margin:0 0 8px;font-family:'Cinzel',serif;">Excluir Conta</h3>
          <p style="color:#c8d8f0;font-size:0.84rem;line-height:1.6;margin:0 0 16px;">Esta ação irá <strong style="color:#fb7185;">apagar permanentemente</strong> todos os seus dados: progresso, estatísticas, conquistas e histórico de revisão. Esta ação <strong>não pode ser desfeita.</strong></p>
          <p style="color:var(--txt-dim);font-size:0.75rem;margin:0 0 20px;">Para confirmar, sua sessão será encerrada e todos os dados locais e do servidor serão removidos.</p>
          <div style="display:flex;gap:10px;">
            <button data-action="closeDeleteAccountConfirm" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#c8d8f0;border-radius:8px;padding:10px;cursor:pointer;font-size:0.85rem;">Cancelar</button>
            <button data-action="executeDeleteAccount" style="flex:1;background:rgba(251,113,133,0.2);border:1px solid rgba(251,113,133,0.6);color:#fb7185;border-radius:8px;padding:10px;cursor:pointer;font-weight:700;font-size:0.85rem;">Sim, excluir tudo</button>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      _deleteAccountFocus = manageDialogFocus(popup, closeDeleteAccountConfirm);
    }
    window.confirmDeleteAccount = confirmDeleteAccount;
    function closeDeleteAccountConfirm() {
      _deleteAccountFocus?.();
      _deleteAccountFocus = null;
      document.querySelectorAll('.delete-account-confirm').forEach(el => el.remove());
    }
    window.closeDeleteAccountConfirm = closeDeleteAccountConfirm;

    async function executeDeleteAccount() {
      if (!_supaClient || !authUser) return;
      document.querySelectorAll('.delete-account-confirm').forEach(el => el.remove());
      try {
        await _supaClient.from('profiles').delete().eq('id', authUser.id);
      } catch(e) {}
      const nqKeys = Object.keys(localStorage).filter(k => k.startsWith('nq') || k.startsWith('nefro'));
      nqKeys.forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
      await authLogout();
    }
    window.executeDeleteAccount = executeDeleteAccount;
    async function saveAccountData() {
      const data = {
        name:  document.getElementById('acctName').value.trim(),
        phone: document.getElementById('acctPhone').value.trim(),
        spec:  document.getElementById('acctSpec').value.trim(),
        city:  document.getElementById('acctCity').value.trim(),
      };
      const nickname = (document.getElementById('acctNickname')?.value || '').trim().substring(0, 40);
      if (_accountSaving) return;
      _accountSaving = true;
      const button = document.querySelector('[data-action="saveAccountData"]');
      const status = document.getElementById('accountSaveStatus');
      button.disabled = true;
      status.textContent = 'Salvando…';
      let localSaved = false;
      try {
        const newIdentity = document.getElementById('acctIdentity').value;
        localStorage.setItem(ACCT_KEY, JSON.stringify(data));
        localStorage.setItem('nq-nickname-asked', '1');
        if (newIdentity) localStorage.setItem(IDENTITY_KEY, newIdentity);
        else localStorage.removeItem(IDENTITY_KEY);
        localSaved = true;
        if (authUser) {
          if (!_supaClient) throw new Error('Cliente indisponível');
          const { error: profileError } = await _supaClient.from('profiles').upsert({
            id: authUser.id, full_name: data.name, phone: data.phone,
            specialty: data.spec, city: data.city,
          });
          if (profileError) throw profileError;
          // Uma única gravação de metadata confirma também o apelido.
          const metadata = { full_name: data.name, specialty: data.spec };
          if (nickname) metadata.nickname = nickname;
          const { error: userError } = await _supaClient.auth.updateUser({ data: metadata });
          if (userError) throw userError;
          authUser.user_metadata = { ...authUser.user_metadata, ...metadata };
          if (typeof profileStatsPush === 'function') profileStatsPush();
          if (typeof refreshWelcomeSave === 'function') refreshWelcomeSave();
        }
        closeAccountModal();
        _toast(authUser ? 'Perfil salvo com sucesso!' : 'Perfil salvo neste dispositivo.', 'success');
      } catch (error) {
        _track('error_save_account', { msg: String(error.message || error) });
        status.textContent = localSaved
          ? 'Dados guardados neste dispositivo, mas não foi possível confirmar o salvamento na conta. Tente salvar novamente.'
          : 'Não foi possível concluir o salvamento. Seus campos continuam preenchidos. Tente salvar novamente.';
      } finally {
        _accountSaving = false;
        button.disabled = false;
      }
    }

    // ============ PLAN MODAL ============
    function openPlanModal() {
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('planModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'planModal';
        modal.className = 'nq-overlay nq-overlay--hidden';
        modal.style.cssText = 'background:rgba(0,0,0,0.88);z-index:9998;backdrop-filter:blur(8px);';
        modal.innerHTML = `<div class="modal-panel" id="planModalContent"></div>`;
        document.body.appendChild(modal);
      }
      const stats = getGameStats();
      const answered = stats.questionsAnsweredAllTime || 0;
      let badgeClass = 'free', badgeLabel = '🎓 Plano Gratuito', detailHtml = '';
      if (isAdminUser()) {
        badgeClass = 'admin'; badgeLabel = '🛡 Admin — Acesso Total';
        detailHtml = `<p class="plan-stat">Conta de administrador com acesso irrestrito.</p>`;
      } else if (isPremium()) {
        badgeClass = 'premium'; badgeLabel = '👑 Premium';
        detailHtml = `<p class="plan-stat">Acesso completo a todas as questões.</p>`;
      } else {
        const pct = Math.min(100, Math.round(answered / FREE_QUESTIONS_LIMIT * 100));
        const remaining = Math.max(0, FREE_QUESTIONS_LIMIT - answered);
        detailHtml = `
          <p class="plan-stat">${answered} de ${FREE_QUESTIONS_LIMIT} questões gratuitas respondidas.</p>
          <div class="plan-bar-wrap"><div class="plan-bar" style="width:${pct}%"></div></div>
          <p class="plan-stat" style="font-size:0.78rem;color:#708090">${remaining} questões restantes no plano gratuito.</p>
          <button class="btn gold" style="width:100%;margin-top:4px" data-action="openPricingFromPlan">✨ Fazer Upgrade</button>
        `;
      }
      document.getElementById('planModalContent').innerHTML = `
        <button class="modal-panel-x" data-action="closePlanModal" aria-label="Fechar">&times;</button>
        <h2>⭐ Seu Plano</h2>
        <div style="text-align:center">
          <div class="plan-badge ${badgeClass}">${badgeLabel}</div>
        </div>
        ${detailHtml}
        <div class="modal-actions" style="margin-top:14px">
          <button data-action="closePlanModal" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button>
        </div>
      `;
      modal.style.display = 'flex';
    }
    function closePlanModal() {
      const m = document.getElementById('planModal');
      if (m) m.style.display = 'none';
    }
    // Wrapper defensivo: garante que ambas funções executem mesmo se uma
    // delas falhar, evitando depender do dispatcher de data-action-seq.
    function openPricingFromPlan() {
      try { closePlanModal(); } catch (e) { /* ignore */ }
      if (typeof window.showPricingModal === 'function') {
        window.showPricingModal();
      } else {
        console.warn('showPricingModal não disponível');
      }
    }

    window.saveAccountData      = saveAccountData;
    window.openAccountModal     = openAccountModal;
    window.closeAccountModal    = closeAccountModal;
    window.openPlanModal        = openPlanModal;
    window.closePlanModal       = closePlanModal;
    window.openPricingFromPlan  = openPricingFromPlan;

