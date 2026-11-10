// NefroQuest — Account Modal, Plan Modal
// Plain script — shares global scope with game.js

    // ============ ACCOUNT MODAL ============
    const ACCT_KEY = 'nefroquest-account';
    let _accountFocus, _deleteAccountFocus;
    let _accountBinding, _deleteAccountBinding;
    const _accountSaving = new Set();
    const _accountDeleting = new Set();

    function _accountKey(owner) {
      return ACCT_KEY + ':' + (owner || 'guest');
    }

    function _readAccountData(owner) {
      // A chave legada não registra o dono. Não atribuir seus dados a uma conta.
      try { return JSON.parse(localStorage.getItem(_accountKey(owner)) || '{}') || {}; }
      catch { return {}; }
    }

    function _accountNickname(user, saved = _readAccountData(user?.id)) {
      const serverNickname = user?.user_metadata?.nickname || '';
      const confirmed = saved.nicknameConfirmation;
      return user && confirmed?.previous === serverNickname && typeof confirmed.value === 'string'
        ? confirmed.value : serverNickname;
    }
    window._accountNickname = _accountNickname;
    window._clearAccountNicknameConfirmation = function (owner) {
      const saved = _readAccountData(owner);
      if (!saved.nicknameConfirmation) return;
      delete saved.nicknameConfirmation;
      try { localStorage.setItem(_accountKey(owner), JSON.stringify(saved)); } catch {}
    };

    function _accountIsCurrent(binding) {
      return binding && binding.owner === (authUser?.id || null) && binding.epoch === _authSessionEpoch;
    }

    async function _getAccountSession(client, binding) {
      const { data, error } = await client.auth.getSession();
      const session = data?.session;
      if (error || !_accountIsCurrent(binding) || session?.user?.id !== binding.owner || !session.access_token) {
        throw new Error('Sessão da conta indisponível');
      }
      return session;
    }

    function openAccountModal() {
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      const owner = authUser?.id || null;
      if (_accountSaving.has(owner) || _accountDeleting.has(owner)) return;
      let modal = document.getElementById('accountModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accountModal';
        modal.className = 'nq-overlay nq-overlay--hidden nqnarr-overlay nqaccount-overlay';
        modal.style.cssText = 'z-index:9998;';
        modal.innerHTML = `
          <section class="nqnarr-card nqaccount-card" role="dialog" aria-modal="true" aria-labelledby="accountTitle">
            <div class="nqnarr-reading" role="region" tabindex="0" aria-label="Dados e preferências da conta">
              <header class="nqaccount-heading"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="7"/><path d="M10 40v-5c0-8 28-8 28 0v5M17 40h14"/></svg><h2 id="accountTitle">Minha Conta</h2></header>
              <div class="nqaccount-fields">
                <div class="nqaccount-field nqaccount-wide"><label for="acctNickname">Apelido <span>Aparece no ranking</span></label><input id="acctNickname" type="text" placeholder="ex.: NefroMestre — não precisa ser seu nome real" maxlength="40"></div>
                <div class="nqaccount-field nqaccount-wide"><label for="acctEmail">Email</label><input id="acctEmail" type="email" placeholder="seu@email.com" disabled></div>
                <div class="nqaccount-field nqaccount-wide"><label for="acctIdentity">Modo preferido</label><select id="acctIdentity"><option value="">Não definido</option><option value="study">📖 Estudar</option><option value="combat">⚔️ Combater</option></select></div>
                <p class="nqaccount-group nqaccount-wide">Opcional<span>Não aparece para outros jogadores.</span></p>
                <div class="nqaccount-field "><label for="acctName">Nome completo <span>Privado</span></label><input id="acctName" type="text" placeholder="Seu nome" ></div>
                <div class="nqaccount-field "><label for="acctPhone">Telefone / WhatsApp</label><input id="acctPhone" type="tel" placeholder="+55 (11) 99999-9999" ></div>
                <div class="nqaccount-field "><label for="acctSpec">Especialidade</label><input id="acctSpec" type="text" placeholder="ex: Nefrologia, Clínica Médica..." ></div>
                <div class="nqaccount-field "><label for="acctCity">Cidade</label><input id="acctCity" type="text" placeholder="Sua cidade" ></div>
              </div>
              <p id="accountSaveStatus" class="nqaccount-status" role="status"></p>
              <div class="nqaccount-delete"><button data-action="confirmDeleteAccount"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg><span>Excluir minha conta</span></button></div>
            </div>
            <footer class="nqnarr-footer nqaccount-footer"><button class="nqaccount-cancel" data-action="closeAccountModal">Cancelar</button><button class="nqnarr-primary" data-action="saveAccountData">Salvar</button></footer>
          </section>
        `;
        document.body.appendChild(modal);
      }
      _accountBinding = { owner, epoch: _authSessionEpoch };
      const saved = _readAccountData(_accountBinding.owner);
      document.getElementById('acctNickname').value = _accountNickname(authUser, saved);
      document.getElementById('acctName').value     = saved.name ?? authUser?.user_metadata?.full_name ?? '';
      document.getElementById('acctEmail').value    = authUser?.email || '';
      document.getElementById('acctPhone').value    = saved.phone || '';
      document.getElementById('acctSpec').value     = saved.spec ?? authUser?.user_metadata?.specialty ?? '';
      document.getElementById('acctCity').value     = saved.city  || '';
      document.getElementById('acctIdentity').value = _getIdentity() || '';
      document.getElementById('accountSaveStatus').textContent = '';
      modal.querySelector('.nqaccount-delete').hidden = !_accountBinding.owner;
      modal.querySelector('[data-action="saveAccountData"]').disabled = false;
      modal.style.display = 'flex';
      _accountFocus?.(false);
      const returnFocus = [...document.querySelectorAll('[data-action="toggleProfilePopup"]')]
        .find(el => el.getClientRects().length && !el.closest('[hidden], [inert]'));
      _accountFocus = manageDialogFocus(modal, closeAccountModal, returnFocus);
    }
    function closeAccountModal(restoreFocus = true) {
      const m = document.getElementById('accountModal');
      _accountFocus?.(restoreFocus);
      _accountFocus = null;
      _accountBinding = null;
      if (m) m.style.display = 'none';
    }

    function confirmDeleteAccount() {
      const binding = _accountBinding;
      if (!binding?.owner || !_accountIsCurrent(binding) || _accountDeleting.has(binding.owner) || _accountSaving.has(binding.owner)) return;
      closeDeleteAccountConfirm();
      const popup = document.createElement('div');
      popup.className = 'nq-overlay nqnarr-overlay delete-account-confirm';
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-modal', 'true');
      popup.setAttribute('aria-label', 'Excluir Conta');
      popup.style.cssText = 'z-index:10001;';
      popup.innerHTML = `
        <section class="nqnarr-card nqaccount-confirm"><div class="nqnarr-reading" role="region" tabindex="0" aria-label="Consequências da exclusão">
          <h3>Excluir Conta</h3><p>A exclusão é permanente. Ela remove seu login, perfil, progresso e classificação vinculados à conta e encerra a sessão.</p>
          <p>Os registros de transações são mantidos para conciliação. Para dados enviados por formulário, <a href="/contato/" target="_blank" rel="noopener">fale com o suporte</a>.</p>
          <p class="nqaccount-status" role="status"></p></div>
          <footer class="nqnarr-footer nqaccount-footer"><button class="nqaccount-cancel" data-action="closeDeleteAccountConfirm">Cancelar</button><button class="nqaccount-danger" data-action="executeDeleteAccount">Sim, excluir minha conta</button></footer>
        </section>
      `;
      document.body.appendChild(popup);
      _deleteAccountBinding = { ...binding, popup, pending: false };
      _deleteAccountFocus = manageDialogFocus(popup, closeDeleteAccountConfirm,
        document.activeElement, popup.querySelector('[data-action="closeDeleteAccountConfirm"]'));
    }
    window.confirmDeleteAccount = confirmDeleteAccount;
    function closeDeleteAccountConfirm(restoreFocus = true) {
      if (restoreFocus && _deleteAccountBinding?.pending) return;
      _deleteAccountFocus?.(restoreFocus);
      _deleteAccountFocus = null;
      _deleteAccountBinding?.popup.remove();
      _deleteAccountBinding = null;
    }
    window.closeDeleteAccountConfirm = closeDeleteAccountConfirm;

    async function executeDeleteAccount() {
      const binding = _deleteAccountBinding;
      if (!_accountIsCurrent(binding) || _accountDeleting.has(binding.owner)) return;
      const client = _supaClient;
      const buttons = binding.popup.querySelectorAll('button');
      const status = binding.popup.querySelector('[role="status"]');
      binding.pending = true;
      _accountDeleting.add(binding.owner);
      buttons.forEach(button => { button.disabled = true; });
      status.textContent = 'Excluindo conta…';
      try {
        const session = await _getAccountSession(client, binding);
        const { data, error } = await client.functions.invoke('delete-account', {
          body: { userId: binding.owner },
          headers: { Authorization: 'Bearer ' + session.access_token }
        });
        if (error || data?.deleted !== true || data.userId !== binding.owner) {
          throw new Error('Exclusão não confirmada');
        }
      } catch {
        _accountDeleting.delete(binding.owner);
        if (_deleteAccountBinding === binding) {
          binding.pending = false;
          buttons.forEach(button => { button.disabled = false; });
          status.textContent = 'Não foi possível confirmar a exclusão. Tente novamente.';
          binding.popup.querySelector('[data-action="executeDeleteAccount"]').focus();
        }
        return;
      }
      try {
        let localCleaned = false;
        try {
          localStorage.removeItem(_accountKey(binding.owner));
          localStorage.removeItem(_identityStorageKey(binding.owner));
          localCleaned = true;
        } catch {}
        if (authUser?.id !== binding.owner) return;
        closeDeleteAccountConfirm(false);
        closeAccountModal(false);
        let loggedOut = false;
        try { loggedOut = (await authLogout({ localOnly: true, expectedOwner: binding.owner })) !== false; }
        catch {}
        if (authUser && authUser.id !== binding.owner) return;
        if (loggedOut && localCleaned) _toast('Conta excluída.', 'success');
        else _toast('Conta excluída no servidor. A limpeza deste navegador ficou incompleta.', 'error');
      } finally {
        _accountDeleting.delete(binding.owner);
      }
    }
    window.executeDeleteAccount = executeDeleteAccount;

    window._closeAccountOnOwnerChange = function () {
      closeDeleteAccountConfirm(false);
      closeAccountModal(false);
      document.getElementById('accountModal')?.remove();
    };

    async function saveAccountData() {
      const binding = _accountBinding;
      if (!_accountIsCurrent(binding) || _accountSaving.has(binding.owner) || _accountDeleting.has(binding.owner)) return;
      const saved = _readAccountData(binding.owner);
      const data = {
        name:  document.getElementById('acctName').value.trim(),
        phone: document.getElementById('acctPhone').value.trim(),
        spec:  document.getElementById('acctSpec').value.trim(),
        city:  document.getElementById('acctCity').value.trim(),
        nicknameConfirmation: saved.nicknameConfirmation,
      };
      // Campos vazios sem valor conhecido não apagam dados que só existem
      // no servidor. Um campo já salvo pela conta pode ser limpo e reenviado.
      for (const field of ['phone', 'city']) {
        if (!data[field] && typeof saved[field] !== 'string') delete data[field];
      }
      const nickname = (document.getElementById('acctNickname')?.value || '').trim().substring(0, 40);
      _accountSaving.add(binding.owner);
      const button = document.querySelector('[data-action="saveAccountData"]');
      const status = document.getElementById('accountSaveStatus');
      button.disabled = true;
      status.textContent = 'Salvando…';
      let localSaved = false;
      try {
        const newIdentity = document.getElementById('acctIdentity').value;
        localStorage.setItem(_accountKey(binding.owner), JSON.stringify(data));
        const identityKey = _identityStorageKey(binding.owner);
        if (newIdentity) localStorage.setItem(identityKey, newIdentity);
        else localStorage.removeItem(identityKey);
        localSaved = true;
        if (binding.owner) {
          const client = _supaClient;
          const session = await _getAccountSession(client, binding);
          const profile = { id: binding.owner };
          for (const field of ['phone', 'city']) {
            if (data[field] !== undefined) profile[field] = data[field];
          }
          if (Object.keys(profile).length > 1) {
            const { error: profileError } = await client.from('profiles').upsert(profile);
            if (profileError) throw profileError;
          }
          if (!_accountIsCurrent(binding)) return;
          // Fixar o token evita aplicar o formulário da conta anterior à sessão nova.
          const metadata = { full_name: data.name, specialty: data.spec };
          if (nickname) metadata.nickname = nickname;
          const result = await fetch(SUPA_URL + '/auth/v1/user', {
            method: 'PUT',
            headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: metadata })
          });
          if (!result.ok) throw new Error('Perfil não confirmado');
          if (!_accountIsCurrent(binding)) return;
          // O SDK pode ainda restaurar os metadados anteriores no próximo
          // carregamento. Um token já atualizado volta a ter precedência.
          if (nickname) {
            data.nicknameConfirmation = { previous: session.user.user_metadata?.nickname || '', value: nickname };
            localStorage.setItem(_accountKey(binding.owner), JSON.stringify(data));
          }
          localStorage.setItem('nq-nickname-asked', '1');
          authUser.user_metadata = { ...authUser.user_metadata, ...metadata };
          if (typeof profileStatsPush === 'function') profileStatsPush();
          if (typeof refreshWelcomeSave === 'function') refreshWelcomeSave();
        }
        if (_accountBinding !== binding) return;
        closeAccountModal();
        _toast(binding.owner ? 'Perfil salvo com sucesso!' : 'Perfil salvo neste dispositivo.', 'success');
      } catch {
        if (_accountBinding !== binding || !_accountIsCurrent(binding)) return;
        _track('error_save_account');
        status.textContent = localSaved
          ? 'Dados guardados neste dispositivo, mas não foi possível confirmar o salvamento na conta. Tente salvar novamente.'
          : 'Não foi possível concluir o salvamento. Seus campos continuam preenchidos. Tente salvar novamente.';
      } finally {
        _accountSaving.delete(binding.owner);
        if (_accountBinding === binding) button.disabled = false;
      }
    }

    // ============ PLAN MODAL ============
    // Era só uma caixa por cima: sem papel de diálogo nem nome, o foco ficava
    // atrás (no botão que abriu), o Tab caminhava pela jornada e o Escape não
    // fechava. Agora segue o mesmo contrato da Conta.
    let _planFocus = null, _planReturn = null;
    function openPlanModal() {
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('planModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'planModal';
        modal.className = 'nq-overlay nq-overlay--hidden nqnarr-overlay nqplan-overlay';
        modal.style.cssText = 'z-index:9998;';
        modal.innerHTML = `<div class="nqnarr-card nqplan-card" id="planModalContent"></div>`;
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
          <p class="plan-stat nqplan-remaining">${remaining} questões restantes no plano gratuito.</p>
          <button class="nqnarr-primary nqplan-upgrade" data-action="openPricingFromPlan">✨ Fazer Upgrade</button>
        `;
      }
      document.getElementById('planModalContent').innerHTML = `
        <div class="nqnarr-reading" role="region" tabindex="0" aria-label="Situação do plano">
          <h2 id="planTitle">Seu Plano</h2><div class="plan-badge ${badgeClass}">${badgeLabel}</div>${detailHtml}
        </div><footer class="nqnarr-footer modal-actions"><button class="nqaccount-cancel" data-action="closePlanModal">Fechar</button></footer>
      `;
      const painel = document.getElementById('planModalContent');
      painel.setAttribute('role', 'dialog');
      painel.setAttribute('aria-modal', 'true');
      painel.setAttribute('aria-labelledby', 'planTitle');
      // Aberto pelo menu do perfil (que acabou de fechar), o foco volta ao
      // botão do perfil, como na Conta; aberto de outro lugar, volta à origem.
      if (!_planFocus) {
        const origem = document.activeElement;
        _planReturn = origem && origem !== document.body && !origem.closest('.profile-popup')
          ? origem
          : [...document.querySelectorAll('[data-action="toggleProfilePopup"]')]
              .find(el => el.getClientRects().length && !el.closest('[hidden], [inert]'));
      }
      _planFocus?.(false);
      modal.style.display = 'flex';
      _planFocus = manageDialogFocus(modal, closePlanModal, _planReturn,
        painel.querySelector('[data-action="openPricingFromPlan"]') || painel.querySelector('.modal-actions button'));
    }
    function closePlanModal() {
      const m = document.getElementById('planModal');
      _planFocus?.();
      _planFocus = null;
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

