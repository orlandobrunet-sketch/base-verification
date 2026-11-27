// NefroQuest — Paywall, Pricing, Payment (Mercado Pago)
// Plain script — shares global scope with game.js

    // TWA (Trusted Web Activity) detection — Android app wrapper
    // When running inside the Play Store APK, in-app purchases via Mercado Pago
    // would violate Google Play Billing policy. Redirect users to the website instead.
    const _isTWA = (function() {
      try {
        if (document.referrer && document.referrer.startsWith('android-app://')) return true;
      } catch(e) {}
      return false;
    })();
    window._isTWA = _isTWA;

    // Ícones desenhados no lugar de emoji: acompanham a cor e o traço do jogo.
    const _PW_ICONES = {
      livro: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zm0 0v16',
      escudo: 'M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z',
      atualizar: 'M20 11a8 8 0 0 0-14.5-3L4 10m0-5v5h5m-5 3a8 8 0 0 0 14.5 3l1.5-2m0 5v-5h-5',
      capelo: 'M2 9l10-5 10 5-10 5zm4 2.5V16c3.5 2.5 8.5 2.5 12 0v-4.5',
      raio: 'M13 2L4 14h7l-1 8 9-12h-7z',
      coroa: 'M3 19h18M4 15L3 6l5.5 4L12 4l3.5 6L21 6l-1 9z',
    };
    const _pwIcone = nome => `<svg class="nq-icone" viewBox="0 0 24 24" aria-hidden="true"><path d="${_PW_ICONES[nome]}"/></svg>`;

    // ============ PAYWALL ============
    // Paywall e Preços eram só caixas por cima: sem papel de diálogo nem nome,
    // o foco ficava atrás, o Tab caminhava pela jornada e o Escape não fechava
    // Preços. Agora passam por nqDialogo. O Paywall continua sem fechar — é a
    // barreira depois das questões gratuitas; o Escape não abre caminho.
    const _paywallDialogo = modal => nqDialogo(modal, {
      painel: modal.querySelector('.paywall-content'),
      visivel: el => el.isConnected && el.classList.contains('show'),
    });
    function showPaywallModal() {
      let modal = document.getElementById('paywallModal');
      if (modal) { modal.classList.add('show'); _paywallDialogo(modal); _track('paywall_shown', { questions_answered: state.correctTotal, level: state.level }); return; }
      _track('paywall_shown', { questions_answered: state.correctTotal, level: state.level });
      modal = document.createElement('div');
      modal.id = 'paywallModal';
      modal.className = 'show';
      const guestBtns = !authUser ? `
        <button class="btn" style="background:rgba(96,165,250,0.12);border:2px solid rgba(96,165,250,0.5);color:var(--blue)" data-action="paywallRegister">Criar conta gratuita</button>
        <button class="btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2)" data-action="paywallLogin">Já tenho conta — Entrar</button>
      ` : '';
      const _identity = _getIdentity();
      const _pwIcon  = _pwIcone(_identity === 'study' ? 'livro' : 'escudo');
      const _pwTitle = _identity === 'study'  ? 'Banco de Questões Completo' : 'Jornada Gratuita Concluída';
      const _pwBody  = _identity === 'study'
        ? `Você esgotou as <strong class="nq-text-gold">${FREE_QUESTIONS_LIMIT} questões gratuitas</strong>.<br>Desbloqueie o banco completo e todas as trilhas temáticas!`
        : `Você respondeu <strong class="nq-text-gold">${FREE_QUESTIONS_LIMIT} questões gratuitas</strong>.<br>Desbloqueie o acesso completo para continuar sua jornada nefrológica!`;
      const _pwDesc  = _identity === 'study'
        ? 'Acesso vitalício · +1000 questões · Todas as trilhas · Futuras atualizações'
        : 'Acesso vitalício · Todas as questões · Futuras atualizações';
      modal.innerHTML = `
        <div class="paywall-content">
          <div style="font-size:2.6rem;margin-bottom:12px;color:var(--gold);">${_pwIcon}</div>
          <h2>${_pwTitle}</h2>
          <p>${_pwBody}</p>
          <div class="paywall-price">
            <div class="price-amount">${PRICE_LIFETIME}</div>
            <div class="price-desc">${_pwDesc}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="btn gold" data-action="paywallUpgrade">Desbloquear Acesso Premium</button>
            ${guestBtns}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      _paywallDialogo(modal);
    }
    function paywallUpgrade() {
      // Abre modal de escolha de plano para upgrade
      document.getElementById('paywallModal')?.classList.remove('show');
      showPricingModal();
    }
    function paywallLogin() {
      document.getElementById('paywallModal')?.classList.remove('show');
      openAuthModal();
      switchAuthTab('entrar');
    }
    function paywallRegister() {
      document.getElementById('paywallModal')?.classList.remove('show');
      openAuthModal();
      switchAuthTab('cadastrar');
    }

    // ============ PRICING MODAL ============
    function showPricingModal() {
      try {
        document.getElementById('pricingModal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'pricingModal';
        // 'show' é necessário: #pricingModal { display:none } por padrão,
        // #pricingModal.show { display:flex } no style.css.
        modal.className = 'nq-overlay show';
        // Camada extra de defesa: display:flex !important inline garante
        // visibilidade mesmo se algum hot reload / CSS quebrado interferir.
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.background = 'rgba(0,0,0,0.94)';
        modal.style.zIndex = '10000';
        modal.style.webkitBackdropFilter = 'blur(10px)';
        modal.style.backdropFilter = 'blur(10px)';
        // O restante (position:fixed, inset:0, align/justify, padding,
        // overflow-y, box-sizing) vem do #pricingModal e .nq-overlay.

        const isPt = _lang === 'pt';
        const tagline = isPt
          ? 'Domine a Nefrologia com o método que funciona — questões clínicas reais, RPG e ciência de ponta.'
          : 'Master Nephrology with a method that works — real clinical questions, RPG & cutting-edge science.';
        modal.innerHTML = `
        <div class="pricing-wrap" style="position:relative;">
          <button class="pricing-close-btn" data-action="closePricingModal" aria-label="Fechar">✕</button>
          <div class="pricing-ornament">✦ Reino dos Néfrons ✦</div>
          <h2>NefroQuest</h2>
          <div class="pricing-sub-title">Ascension</div>
          <p>${tagline}</p>
          <div class="pricing-stats-row">
            <div class="pricing-stat-pill">${_pwIcone('livro')} <strong>${questionBank?.length ?? '+'}</strong> questões de nefrologia</div>
            <div class="pricing-stat-pill">${_pwIcone('atualizar')} Atualizado <strong>constantemente</strong></div>
            <div class="pricing-stat-pill">${_pwIcone('capelo')} Foco em <strong>residência &amp; título</strong></div>
          </div>
          <div class="pricing-cards">
            <div class="pricing-card">
              <div class="pricing-icon">${_pwIcone('capelo')}</div>
              <h3>Gratuito</h3>
              <div class="pricing-amount">R$0</div>
              <div class="pricing-period">${isPt ? 'para sempre' : 'forever'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>${FREE_QUESTIONS_LIMIT} questões de nefrologia</li>
                <li>Todos os personagens</li>
                <li>Ranking global</li>
                <li class="pf-no">Modo de Estudo por tema</li>
                <li class="pf-no">${questionBank?.length ?? '+'} questões completas</li>
                <li class="pf-no">Atualizações e novos conteúdos</li>
              </ul>
              <button class="pricing-choose-btn btn-free" data-action="pricingChoose" data-arg="free">${isPt ? 'Começar Grátis' : 'Start Free'}</button>
            </div>
            <div class="pricing-card featured">
              <div class="pricing-badge">${isPt ? 'MAIS POPULAR' : 'MOST POPULAR'}</div>
              <div class="pricing-icon">${_pwIcone('raio')}</div>
              <h3>${isPt ? 'Mensal' : 'Monthly'}</h3>
              <div class="pricing-amount">${PRICE_MONTHLY}</div>
              <div class="pricing-period">${isPt ? '32 dias de acesso · sem renovação automática' : '32 days of access · no auto-renewal'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>${questionBank?.length ?? '+'} questões de nefrologia</li>
                <li>Modo de Estudo por tema</li>
                <li>Jornada RPG completa</li>
                <li>Ranking global</li>
                <li>Novos conteúdos todo mês</li>
                <li>Apoia o desenvolvimento da ferramenta</li>
              </ul>
              ${_isTWA
                ? `<div class="pricing-twa-notice">${isPt ? 'Para comprar, acesse <strong>nefroquest.com</strong> no seu navegador.' : 'To purchase, visit <strong>nefroquest.com</strong> in your browser.'}</div>`
                : `<button class="pricing-choose-btn btn-monthly" data-action="pricingChoose" data-arg="monthly">${isPt ? 'Comprar 32 dias' : 'Buy 32 days'}</button>`}
            </div>
            <div class="pricing-card">
              <div class="pricing-icon">${_pwIcone('coroa')}</div>
              <h3>${isPt ? 'Vitalício' : 'Lifetime'}</h3>
              <div class="pricing-amount">${PRICE_LIFETIME}</div>
              <div class="pricing-period">${isPt ? 'pagamento único · acesso vitalício' : 'one-time payment · access forever'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>Tudo do plano Mensal</li>
                <li>Todas as futuras atualizações</li>
                <li>Melhor custo-benefício</li>
                <li>Acesso vitalício garantido</li>
                <li>Maior contribuição ao projeto</li>
                <li>Formação de nefrologistas para sempre</li>
              </ul>
              ${_isTWA
                ? `<div class="pricing-twa-notice">${isPt ? 'Para comprar, acesse <strong>nefroquest.com</strong> no seu navegador.' : 'To purchase, visit <strong>nefroquest.com</strong> in your browser.'}</div>`
                : `<button class="pricing-choose-btn btn-lifetime" data-action="pricingChoose" data-arg="lifetime">${isPt ? 'Compra Única' : 'Buy Once'}</button>`}
            </div>
          </div>
          <button class="pricing-login-link" data-action="_pricingToLogin">${isPt ? 'Já tenho conta — Entrar' : 'I have an account — Sign in'}</button>
        </div>`;
        document.body.appendChild(modal);
        nqDialogo(modal, { painel: modal.querySelector('.pricing-wrap') });
        // O título visível é só a marca; o nome do diálogo diz o que ele é.
        const _painelPrecos = modal.querySelector('.pricing-wrap');
        _painelPrecos.removeAttribute('aria-labelledby');
        _painelPrecos.setAttribute('aria-label', isPt ? 'Planos e preços' : 'Plans and pricing');
      } catch (err) {
        console.error('[showPricingModal] erro ao montar modal:', err);
        if (typeof _track === 'function') {
          _track('error_pricing_modal', { msg: String(err && err.message || err) });
        }
      }
    }
    function closePricingModal() {
      document.getElementById('pricingModal')?.remove();
      // Se não autenticado, volta para a landing — sem opção de jogar sem conta
      if (!authUser && !_guestMode) {
        document.getElementById('welcomeScreen')?.classList.add('hidden');
        document.getElementById('landingScreen')?.classList.remove('hidden');
      }
    }

    // ── Banner promocional a cada 10 questões (free) ──
    let _lastPromoBannerAt = 0;
    function _checkPromoBanner() {
      if (isPremium() || (authUser && !_premiumAccessKnown())) return;
      const total = getGameStats().questionsAnsweredAllTime || 0;
      if (total < 10) return;
      if (total >= FREE_QUESTIONS_LIMIT) return; // paywall já cuida disso
      if (total % 10 !== 0) return;
      if (total === _lastPromoBannerAt) return;
      _lastPromoBannerAt = total;
      _showPromoBanner(total);
    }
    function _showPromoBanner(count) {
      document.getElementById('promoBannerOverlay')?.remove();
      const remaining = FREE_QUESTIONS_LIMIT - count;
      const overlay = document.createElement('div');
      overlay.id = 'promoBannerOverlay';
      overlay.className = 'promo-banner-overlay';
      overlay.innerHTML = `
        <div class="promo-banner">
          <div class="promo-banner-icon">${_pwIcone('livro')}</div>
          <div class="promo-banner-body">
            <div class="promo-banner-title">Você está dominando a Nefrologia!</div>
            <div class="promo-banner-text">
              Restam <strong class="nq-text-gold">${remaining} questões</strong> gratuitas.
              Desbloqueie <strong style="color:#c8d8f0">${questionBank?.length ?? '+'} questões</strong>, modo de estudo por tema
              e atualizações constantes — por menos de um café por mês.
            </div>
          </div>
          <button class="promo-banner-cta" data-remove-id="promoBannerOverlay" data-action="showPricingModal">Ver Planos</button>
          <button class="promo-banner-close" data-remove-id="promoBannerOverlay">✕</button>
        </div>`;
      document.body.appendChild(overlay);
      setTimeout(() => document.getElementById('promoBannerOverlay')?.remove(), 12000);
    }

    // ── Mercado Pago checkout ──
    let _pendingPaymentPlan = null; // plan pendente enquanto user faz login/cadastro
    const _paymentCheckoutKey = 'nq-payment-checkout';
    const _paymentReturnKey = 'nq-payment-return';
    const _paymentRetryDelays = [1500, 3000, 5000];
    const _validPaymentId = id => typeof id === 'string' && /^\d{1,32}$/.test(id);
    const _validPreferenceId = id => typeof id === 'string' && /^[a-z0-9-]{1,128}$/i.test(id);
    const _validPaymentPlan = plan => plan === 'monthly' || plan === 'lifetime';
    let _paymentReturnState = null;

    function _readPaymentSession(key) {
      try { return JSON.parse(sessionStorage.getItem(key)); }
      catch { return null; }
    }

    function _writePaymentSession(key, value) {
      try {
        if (value) sessionStorage.setItem(key, JSON.stringify(value));
        else sessionStorage.removeItem(key);
      } catch {}
    }

    function pricingChoose(tier) {
      closePricingModal();
      if (tier === 'free') {
        if (!authUser) { openAuthModal(); switchAuthTab('cadastrar'); }
        return;
      }
      _track('plan_selected', { plan: tier, logged_in: !!authUser });
      // Plano pago: requer login
      if (!authUser) {
        _pendingPaymentPlan = tier;
        openAuthModal();
        switchAuthTab('cadastrar');
        _setAuthMsg('Crie sua conta para continuar para o pagamento.', 'success');
        return;
      }
      _initPayment(tier);
    }

    function _resumePendingPayment() {
      if (!_pendingPaymentPlan) return;
      const plan = _pendingPaymentPlan;
      _pendingPaymentPlan = null;
      const owner = authUser?.id;
      const epoch = _authSessionEpoch;
      // Pequeno delay para fechar modal de auth antes de redirecionar
      setTimeout(() => {
        if (owner && authUser?.id === owner && _authSessionEpoch === epoch) _initPayment(plan);
      }, 400);
    }

    let _paymentPreparation = null;
    const _paymentPreparationSameOwner = attempt => authUser?.id === attempt.owner && _authSessionEpoch === attempt.epoch;
    const _paymentPreparationCurrent = attempt => _paymentPreparation === attempt &&
      attempt.preparing && !attempt.controller.signal.aborted && _paymentPreparationSameOwner(attempt) && attempt.overlay?.isConnected;

    function _closePaymentPreparation(attempt) {
      // Uma resposta antiga não pode remover a janela da tentativa nova.
      if (_paymentPreparation !== attempt) return;
      _paymentPreparation = null;
      clearTimeout(attempt.timeout);
      attempt.subscription?.unsubscribe();
      attempt.controller.abort();
      attempt.releaseFocus?.(false);
      attempt.overlay?.remove();
    }

    function _leavePaymentPreparation(attempt) {
      if (_paymentPreparation !== attempt) return;
      _closePaymentPreparation(attempt);
      // Encerra somente esta preparação local, sem cancelar uma compra no
      // provedor nem apagar comprovantes de outro fluxo.
      showPricingModal();
    }

    async function _initPayment(plan) {
      if (!authUser) { showPricingModal(); return; }
      if (!_validPaymentPlan(plan)) return;
      const previous = _paymentPreparation;
      if (previous?.preparing && _paymentPreparationSameOwner(previous)) return;
      if (previous) _closePaymentPreparation(previous);
      const attempt = {
        owner: authUser.id, epoch: _authSessionEpoch, plan, startedAt: Date.now(),
        controller: new AbortController(), preparing: true, timedOut: false,
      };
      _paymentPreparation = attempt;
      const interrupted = new Promise((_, reject) => {
        attempt.controller.signal.addEventListener('abort', () => reject(new Error('Preparação interrompida')), { once: true });
      });
      const wait = value => Promise.race([value, interrupted]);
      _showPaymentLoading(attempt);
      attempt.timeout = setTimeout(() => {
        if (_paymentPreparation !== attempt || !attempt.preparing) return;
        attempt.timedOut = true;
        attempt.controller.abort();
      }, 30000);
      if (_supaClient?.auth?.onAuthStateChange) {
        const { data } = _supaClient.auth.onAuthStateChange(() => queueMicrotask(() => {
          if (_paymentPreparation === attempt && !_paymentPreparationSameOwner(attempt)) _closePaymentPreparation(attempt);
        }));
        attempt.subscription = data?.subscription;
      }
      try {
        const session = await wait(_supaClient.auth.getSession());
        if (!_paymentPreparationCurrent(attempt)) return;
        const token = session.data?.session?.access_token;
        if (session.error || !token || session.data.session.user?.id !== attempt.owner) throw new Error('Sessão inválida');
        const res = await wait(fetch(`${SUPA_URL}/functions/v1/create-mp-preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ plan }),
          signal: attempt.controller.signal,
        }));
        if (!_paymentPreparationCurrent(attempt)) return;
        const data = await wait(res.json());
        if (!_paymentPreparationCurrent(attempt)) return;
        if (!res.ok || !data.checkout_url) throw new Error('Checkout indisponível');
        _writePaymentSession(_paymentCheckoutKey, _validPreferenceId(data.preference_id)
          ? { owner: attempt.owner, plan, startedAt: attempt.startedAt, preferenceId: data.preference_id }
          : null);
        _track('checkout_started', { plan });
        _closePaymentPreparation(attempt);
        window.location.href = data.checkout_url;
      } catch {
        if (_paymentPreparation === attempt && _paymentPreparationSameOwner(attempt)) _showPaymentError(attempt);
      } finally {
        clearTimeout(attempt.timeout);
        if (_paymentPreparation === attempt && (!_paymentPreparationSameOwner(attempt) || !attempt.overlay?.isConnected)) _closePaymentPreparation(attempt);
      }
    }

    function _showPaymentLoading(attempt) {
      const el = document.createElement('div');
      el.id = 'paymentLoadingOverlay';
      el.className = 'nq-overlay nqnarr-overlay nqplan-overlay';
      el.style.zIndex = '10000';
      const label = attempt.plan === 'lifetime' ? 'Plano Vitalício' : 'Plano Mensal';
      const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.innerHTML = `
        <section class="nqnarr-card nqplan-card" role="dialog" aria-modal="true" aria-labelledby="paymentPreparationTitle">
          <div class="nqnarr-reading" role="region" tabindex="0" aria-label="Preparação do checkout">
            <h2 id="paymentPreparationTitle">Preparando pagamento</h2>
            <div data-payment-spinner aria-hidden="true" style="width:40px;height:40px;margin-bottom:18px;border:3px solid #91dfe333;border-top-color:#91dfe3;border-radius:50%;${motion ? 'animation:spin .8s linear infinite;' : ''}"></div>
            <div role="status" aria-live="polite" aria-atomic="true">
              <p class="plan-stat"><strong>${label}</strong></p>
              <p class="plan-stat" data-preparation-message>Você será redirecionado para o Mercado Pago. Aguarde a preparação do checkout.</p>
            </div>
          </div>
          <footer class="nqnarr-footer nqaccount-footer">
            <button type="button" class="nqaccount-cancel" data-preparation-back>Voltar aos planos</button>
            <button type="button" class="nqnarr-primary" data-preparation-retry hidden>Tentar novamente</button>
          </footer>
        </section>`;
      attempt.overlay = el;
      document.body.appendChild(el);
      el.querySelector('[data-preparation-back]').onclick = () => _leavePaymentPreparation(attempt);
      el.querySelector('[data-preparation-retry]').onclick = () => {
        if (_paymentPreparation === attempt && _paymentPreparationSameOwner(attempt)) _initPayment(attempt.plan);
      };
      attempt.releaseFocus = manageDialogFocus(el, () => _leavePaymentPreparation(attempt), document.activeElement,
        el.querySelector('[data-preparation-back]'));
    }

    function _showPaymentError(attempt) {
      attempt.preparing = false;
      attempt.overlay.querySelector('h2').textContent = 'Preparação não concluída';
      attempt.overlay.querySelector('[data-payment-spinner]').hidden = true;
      attempt.overlay.querySelector('[data-preparation-message]').textContent = attempt.timedOut
        ? 'A preparação demorou mais que o esperado. Tente novamente ou volte aos planos.'
        : 'Não foi possível preparar o checkout agora. Tente novamente ou volte aos planos.';
      attempt.overlay.querySelector('[data-preparation-retry]').hidden = false;
    }

    function _paymentReturnReceipt() {
      const url = new URL(window.location.href);
      const hint = url.searchParams.get('payment');
      if (!hint) {
        const saved = _readPaymentSession(_paymentReturnKey);
        return _validPaymentId(saved?.id) ? saved : null;
      }
      if (!['approved', 'pending', 'failed'].includes(hint)) return null;
      const paymentId = url.searchParams.get('payment_id') ?? url.searchParams.get('collection_id');
      const preferenceId = url.searchParams.get('preference_id');
      const receipt = {
        id: hint !== 'failed' && _validPaymentId(paymentId) ? paymentId : null,
        preferenceId: _validPreferenceId(preferenceId) ? preferenceId : null,
        failed: hint === 'failed',
      };
      // O identificador serve apenas para buscar o registro no servidor.
      _writePaymentSession(_paymentReturnKey, receipt.id ? receipt : null);
      for (const key of ['payment', 'plan', 'payment_id', 'collection_id', 'preference_id', 'collection_status',
        'status', 'external_reference', 'merchant_order_id', 'payment_type', 'site_id', 'processing_mode', 'merchant_account_id']) {
        url.searchParams.delete(key);
      }
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
      return receipt;
    }

    function _showPaymentStatus(state, title, message, action = '') {
      state.needsLogin = action === 'login';
      const overlay = state.overlay;
      overlay.querySelector('[data-payment-title]').textContent = title;
      overlay.querySelector('[data-payment-description]').textContent = message;
      const next = overlay.querySelector('[data-payment-action]');
      next.hidden = !action;
      next.textContent = action === 'login' ? 'Entrar para verificar' : 'Verificar novamente';
      next.onclick = action === 'login' ? () => {
        state.waitingForLogin = true;
        _dismissPaymentReturn(state, true);
        openAuthModal();
        switchAuthTab('entrar');
      } : () => _verifyPaymentReturn(state);
      if (!action && document.activeElement === next) overlay.querySelector('[data-payment-close]').focus();
    }

    function _cancelPaymentCheck(state) {
      clearTimeout(state.retry);
      state.retry = null;
      state.check?.abort();
      state.check = null;
    }

    function _retireStalePaymentReturn(state) {
      if (!state.owner || (state.owner === authUser?.id && state.epoch === _authSessionEpoch)) return false;
      _cancelPaymentCheck(state);
      state.owner = null;
      state.epoch = null;
      if (state.overlay?.isConnected) {
        _showPaymentStatus(state, 'Sessão alterada', 'Verifique a compra na conta que iniciou o pagamento.', authUser ? 'retry' : 'login');
      }
      return true;
    }

    function _dismissPaymentReturn(state, keepReceipt = false) {
      _cancelPaymentCheck(state);
      state.overlay?.remove();
      state.overlay = null;
      if (keepReceipt) return;
      _paymentReturnState = null;
      state.subscription?.unsubscribe();
      _writePaymentSession(_paymentReturnKey, null);
    }

    function _openPaymentReturn(state) {
      const overlay = document.createElement('div');
      overlay.id = 'paymentReturnOverlay';
      overlay.className = 'nq-overlay';
      overlay.style.cssText = 'background:rgba(0,0,0,0.93);z-index:10000;padding:20px;';
      overlay.innerHTML = `
        <div style="text-align:center;width:min(100%,420px);background:#0d1a2e;border:1px solid var(--gold);border-radius:12px;padding:22px;overflow-wrap:anywhere;">
          <h2 class="nq-section-heading">Retorno do pagamento</h2>
          <div role="status" aria-live="polite" aria-atomic="true" style="color:#c8d8f0;margin:14px 0;line-height:1.55;">
            <strong data-payment-title></strong>
            <p data-payment-description></p>
          </div>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
            <button type="button" class="btn" data-payment-close aria-label="Fechar retorno do pagamento" style="min-height:44px;">Fechar</button>
            <button type="button" class="btn gold" data-payment-action hidden style="min-height:44px;">Verificar novamente</button>
          </div>
        </div>`;
      state.overlay = overlay;
      document.body.appendChild(overlay);
      overlay.querySelector('[data-payment-close]').onclick = () => _dismissPaymentReturn(state);
      nqDialogo(overlay, { painel: overlay.firstElementChild });
      if (!state.receipt.id) {
        _showPaymentStatus(state, 'Pagamento não confirmado', state.receipt.failed
          ? 'O checkout foi encerrado. Consulte Seu Plano para acompanhar seu acesso.'
          : 'O retorno não trouxe um identificador de pagamento. Consulte Seu Plano ou entre em contato com o suporte.');
        return;
      }
      _verifyPaymentReturn(state);
    }

    function _trackConfirmedPurchase(receipt, result, owner) {
      const checkout = _readPaymentSession(_paymentCheckoutKey);
      // Uma consulta a um comprovante antigo ou aberto em outra sessão não é nova conversão.
      const processedAt = Date.parse(result.processed_at);
      if (!checkout || !receipt.preferenceId || checkout.preferenceId !== receipt.preferenceId ||
          checkout.owner !== owner || checkout.plan !== result.plan ||
          !Number.isFinite(checkout.startedAt) || !(processedAt >= checkout.startedAt - 5000)) return;
      _writePaymentSession(_paymentCheckoutKey, null);
      const key = 'nq-payment-converted:' + owner + ':' + receipt.id;
      try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
        _track('premium_converted', { plan: result.plan });
      } catch {}
    }

    async function _verifyPaymentReturn(state, attempt = 0) {
      if (!state.overlay?.isConnected || state.check) return;
      const check = new AbortController();
      state.check = check;
      state.owner = authUser?.id ?? null;
      state.epoch = _authSessionEpoch;
      const current = () => state.check === check && state.overlay?.isConnected && !_retireStalePaymentReturn(state);
      // Sessão e leitura da resposta dividem o prazo da mesma tentativa.
      // A corrida também libera a interface se uma dependência ignorar o abort.
      const interrupted = new Promise((_, reject) => {
        check.signal.addEventListener('abort', () => reject(new Error('Verificação interrompida')), { once: true });
      });
      const wait = promise => Promise.race([promise, interrupted]);
      const requestTimeout = setTimeout(() => check.abort(), 10000);
      _showPaymentStatus(state, 'Verificando pagamento', 'Consultando a situação da compra.');
      try {
        const { data, error } = (await wait(_supaClient?.auth.getSession())) ?? {};
        if (!current()) return;
        if (error) throw error;
        if (!authUser || !data?.session?.access_token || data.session.user?.id !== authUser.id) {
          _showPaymentStatus(state, 'Entre para verificar', 'Use a mesma conta que iniciou a compra.', 'login');
          return;
        }
        state.owner = authUser.id;
        state.epoch = _authSessionEpoch;
        const response = await wait(fetch(`${SUPA_URL}/functions/v1/mp-payment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token, apikey: SUPA_KEY },
          body: JSON.stringify({ payment_id: state.receipt.id }),
          signal: check.signal,
        }));
        if (!current()) return;
        if (response.status === 401) {
          _showPaymentStatus(state, 'Entre para verificar', 'Renove a sessão da conta que iniciou a compra.', 'login');
          return;
        }
        if (!response.ok) throw new Error('Payment status unavailable');
        const result = await wait(response.json());
        if (!current()) return;
        if (result.status === 'pending') {
          const retry = attempt < _paymentRetryDelays.length;
          _showPaymentStatus(state, 'Pagamento ainda não confirmado',
            'A confirmação pode demorar. Verifique novamente ou acompanhe o acesso em Seu Plano.', retry ? '' : 'retry');
          if (retry) {
            state.retry = setTimeout(() => {
              state.retry = null;
              if (!_retireStalePaymentReturn(state)) _verifyPaymentReturn(state, attempt + 1);
            }, _paymentRetryDelays[attempt]);
          }
          return;
        }
        if (result.status === 'reversed') {
          const access = await wait(_awaitPremiumAccess({ refresh: true })).catch(() => 'pending');
          if (!current() || access === 'stale') return;
          const synchronized = access !== 'pending';
          if (synchronized) _writePaymentSession(_paymentReturnKey, null);
          _showPaymentStatus(state, 'Pagamento revertido', synchronized
            ? 'Esta compra tem um estorno ou contestação registrado.'
            : 'O estorno está registrado. Verifique novamente para atualizar a situação do seu acesso.',
          synchronized ? '' : 'retry');
          return;
        }
        if (!_validPaymentPlan(result.plan) || !['recorded', 'confirmed'].includes(result.status)) {
          throw new Error('Invalid payment status');
        }
        const plan = result.plan === 'lifetime' ? 'Vitalício' : 'Mensal';
        if (result.status === 'recorded') {
          _showPaymentStatus(state, 'Pagamento localizado',
            `A compra do plano ${plan} consta no histórico. Verifique novamente ou consulte o acesso atual em Seu Plano.`, 'retry');
          return;
        }
        // A compra foi confirmada. A situação do acesso vem de uma nova
        // leitura do perfil, que pode falhar sem invalidar o comprovante.
        const access = await wait(_awaitPremiumAccess({ refresh: true })).catch(() => 'pending');
        if (!current() || access === 'stale') return;
        const synchronized = access === 'premium';
        if (synchronized) _writePaymentSession(_paymentReturnKey, null);
        try { updateWelcomeUserBadge(); } catch {}
        _trackConfirmedPurchase(state.receipt, result, state.owner);
        const accessMessage = synchronized
          ? 'O acesso Premium da conta está ativo.'
          : 'Estamos sincronizando seu acesso. Verifique novamente ou consulte Seu Plano.';
        _showPaymentStatus(state, 'Pagamento confirmado',
          `A compra do plano ${plan} foi confirmada. ${accessMessage}`, synchronized ? '' : 'retry');
      } catch {
        if (current()) {
          _showPaymentStatus(state, 'Verificação indisponível', 'Não foi possível consultar a compra agora. Tente novamente.', 'retry');
        }
      } finally {
        clearTimeout(requestTimeout);
        if (state.check === check) state.check = null;
      }
    }

    (function _checkPaymentReturn() {
      const receipt = _paymentReturnReceipt();
      if (!receipt) return;
      const state = { receipt, overlay: null, owner: null, epoch: null, check: null, retry: null, waitingForLogin: false };
      _paymentReturnState = state;
      if (receipt.id && _supaClient) {
        const { data } = _supaClient.auth.onAuthStateChange(() => {
          // Sai do callback síncrono do Supabase antes de consultar a sessão.
          setTimeout(() => {
            if (_paymentReturnState !== state) return;
            _retireStalePaymentReturn(state);
            if (!authUser) return;
            if (state.waitingForLogin) {
              state.waitingForLogin = false;
              _openPaymentReturn(state);
            } else if (state.needsLogin && state.overlay?.isConnected) {
              _verifyPaymentReturn(state);
            }
          }, 0);
        });
        state.subscription = data.subscription;
      }
      _openPaymentReturn(state);
    })();

    window.showPaywallModal       = showPaywallModal;
    window.paywallUpgrade         = paywallUpgrade;
    window.paywallLogin           = paywallLogin;
    window.paywallRegister        = paywallRegister;
    window.showPricingModal       = showPricingModal;
    window.closePricingModal      = closePricingModal;
    window.pricingChoose          = pricingChoose;

