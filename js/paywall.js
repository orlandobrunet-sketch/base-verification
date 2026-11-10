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
      if (isPremium()) return;
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

    async function _initPayment(plan) {
      if (!authUser) { showPricingModal(); return; }
      const owner = authUser.id;
      const epoch = _authSessionEpoch;
      const startedAt = Date.now();
      const current = () => authUser?.id === owner && _authSessionEpoch === epoch;

      // Mostrar loading
      const loadingEl = _showPaymentLoading(plan);

      try {
        const session = await _supaClient.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token || session.data.session.user?.id !== owner || !current()) throw new Error('Sessão inválida');

        const res = await fetch(`${SUPA_URL}/functions/v1/create-mp-preference`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json();

        if (!res.ok || !data.checkout_url) {
          throw new Error(data.error || 'Erro ao criar checkout');
        }

        loadingEl?.remove();
        if (!current()) return;
        _writePaymentSession(_paymentCheckoutKey, _validPreferenceId(data.preference_id)
          ? { owner, plan, startedAt, preferenceId: data.preference_id }
          : null);
        _track('checkout_started', { plan });
        // Redirecionar para Mercado Pago
        window.location.href = data.checkout_url;

      } catch (err) {
        loadingEl?.remove();
        if (current()) _showPaymentError(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
      }
    }

    function _showPaymentLoading(plan) {
      const el = document.createElement('div');
      el.id = 'paymentLoadingOverlay';
      el.className = 'nq-overlay nq-overlay--col';
      el.style.cssText = 'background:rgba(0,0,0,0.9);z-index:10000;gap:16px;';
      const label = plan === 'lifetime' ? 'Plano Vitalício' : 'Plano Mensal';
      el.innerHTML = `
        <div style="width:48px;height:48px;border:3px solid rgba(255,215,0,0.2);border-top-color:#ffd700;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <div class="nq-section-heading">Preparando ${label}…</div>
        <div style="color:#6080a0;font-size:0.78rem;">Você será redirecionado para o Mercado Pago</div>`;
      document.body.appendChild(el);
      return el;
    }

    function _showPaymentError(msg) {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a0a0a;border:1px solid rgba(220,50,50,0.5);color:#ff8080;padding:14px 24px;border-radius:10px;font-size:0.85rem;z-index:10001;max-width:340px;text-align:center;';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
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
      const active = () => state.check === check && state.overlay?.isConnected;
      const sameAccount = () => authUser?.id === state.owner && _authSessionEpoch === state.epoch;
      let requestTimeout;
      _showPaymentStatus(state, 'Verificando pagamento', 'Consultando a situação da compra.');
      try {
        const { data, error } = await _supaClient?.auth.getSession() ?? {};
        if (!active()) return;
        if (error) throw error;
        if (!authUser || !data?.session?.access_token || data.session.user?.id !== authUser.id) {
          _showPaymentStatus(state, 'Entre para verificar', 'Use a mesma conta que iniciou a compra.', 'login');
          return;
        }
        state.owner = authUser.id;
        state.epoch = _authSessionEpoch;
        requestTimeout = setTimeout(() => check.abort(), 10000);
        const response = await fetch(`${SUPA_URL}/functions/v1/mp-payment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token, apikey: SUPA_KEY },
          body: JSON.stringify({ payment_id: state.receipt.id }),
          signal: check.signal,
        });
        if (!active() || !sameAccount()) return;
        if (response.status === 401) {
          _showPaymentStatus(state, 'Entre para verificar', 'Renove a sessão da conta que iniciou a compra.', 'login');
          return;
        }
        if (!response.ok) throw new Error('Payment status unavailable');
        const result = await response.json();
        if (!active() || !sameAccount()) return;
        if (result.status === 'pending') {
          const retry = attempt < _paymentRetryDelays.length;
          _showPaymentStatus(state, 'Pagamento ainda não confirmado',
            'A confirmação pode demorar. Verifique novamente ou acompanhe o acesso em Seu Plano.', retry ? '' : 'retry');
          if (retry) {
            state.retry = setTimeout(() => {
              state.retry = null;
              if (sameAccount()) _verifyPaymentReturn(state, attempt + 1);
            }, _paymentRetryDelays[attempt]);
          }
          return;
        }
        if (result.status === 'reversed') {
          _writePaymentSession(_paymentReturnKey, null);
          _showPaymentStatus(state, 'Pagamento revertido', 'Esta compra tem um estorno ou contestação registrado.');
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
        _writePaymentSession(_paymentReturnKey, null);
        let accessMessage = 'O acesso Premium da conta está ativo.';
        try {
          if (!_saveVerifiedPremium(state.owner)) return;
          updateWelcomeUserBadge();
        } catch {
          accessMessage = 'Reabra o jogo para sincronizar seu acesso neste navegador.';
        }
        _trackConfirmedPurchase(state.receipt, result, state.owner);
        _showPaymentStatus(state, 'Pagamento confirmado', `A compra do plano ${plan} foi confirmada. ${accessMessage}`);
      } catch {
        if (active() && (!state.owner || sameAccount())) {
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
            if (state.owner && (state.owner !== authUser?.id || state.epoch !== _authSessionEpoch)) {
              _cancelPaymentCheck(state);
              state.owner = null;
              state.epoch = null;
              if (state.overlay) _showPaymentStatus(state, 'Sessão alterada', 'Verifique a compra na conta que iniciou o pagamento.', authUser ? 'retry' : 'login');
            }
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

