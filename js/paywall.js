// NefroQuest — Paywall, Pricing, Payment (Mercado Pago)
// Plain script — shares global scope with game.js

    // ============ PAYWALL ============
    function showPaywallModal() {
      let modal = document.getElementById('paywallModal');
      if (modal) { modal.classList.add('show'); return; }
      _track('paywall_shown', { questions_answered: state.correctTotal, level: state.level });
      modal = document.createElement('div');
      modal.id = 'paywallModal';
      modal.className = 'show';
      const guestBtns = !authUser ? `
        <button class="btn" style="background:rgba(96,165,250,0.12);border:2px solid rgba(96,165,250,0.5);color:var(--blue)" data-action="paywallRegister">📝 Criar conta gratuita</button>
        <button class="btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2)" data-action="paywallLogin">Já tenho conta — Entrar</button>
      ` : '';
      const _identity = _getIdentity();
      const _pwIcon  = _identity === 'study'  ? '📖' : '🏰';
      const _pwTitle = _identity === 'study'  ? 'Banco de Questões Completo' : 'Jornada Gratuita Concluída';
      const _pwBody  = _identity === 'study'
        ? `Você esgotou as <strong style="color:#ffd700">${FREE_QUESTIONS_LIMIT} questões gratuitas</strong>.<br>Desbloqueie o banco completo e todas as trilhas temáticas!`
        : `Você respondeu <strong style="color:#ffd700">${FREE_QUESTIONS_LIMIT} questões gratuitas</strong>.<br>Desbloqueie o acesso completo para continuar sua jornada nefrológica!`;
      const _pwDesc  = _identity === 'study'
        ? 'Acesso vitalício · +1000 questões · Todas as trilhas · Futuras atualizações'
        : 'Acesso vitalício · Todas as questões · Futuras atualizações';
      modal.innerHTML = `
        <div class="paywall-content">
          <div style="font-size:2.6rem;margin-bottom:12px;">${_pwIcon}</div>
          <h2>${_pwTitle}</h2>
          <p>${_pwBody}</p>
          <div class="paywall-price">
            <div class="price-amount">${PRICE_LIFETIME}</div>
            <div class="price-desc">${_pwDesc}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="btn gold" data-action="paywallUpgrade">✨ Desbloquear Acesso Premium</button>
            ${guestBtns}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
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
      document.getElementById('pricingModal')?.remove();
      const modal = document.createElement('div');
      modal.id = 'pricingModal';
      modal.className = 'nq-overlay';
      modal.style.cssText = 'background:rgba(0,0,0,0.94);z-index:9998;backdrop-filter:blur(10px);';
      const isPt = _lang === 'pt';
      const tagline = isPt
        ? 'Domine a Nefrologia com o método que funciona — questões clínicas reais, RPG e ciência de ponta.'
        : 'Master Nephrology with a method that works — real clinical questions, RPG & cutting-edge science.';
      modal.innerHTML = `
        <div class="pricing-wrap" style="position:relative;">
          <button class="pricing-close-btn" data-action="closePricingModal">✕</button>
          <div class="pricing-ornament">✦ Reino dos Néfrons ✦</div>
          <h2>NefroQuest</h2>
          <div class="pricing-sub-title">Ascension</div>
          <p>${tagline}</p>
          <div class="pricing-stats-row">
            <div class="pricing-stat-pill">🧠 <strong>${questionBank?.length ?? '+'}</strong> questões de nefrologia</div>
            <div class="pricing-stat-pill">🔄 Atualizado <strong>constantemente</strong></div>
            <div class="pricing-stat-pill">🏥 Foco em <strong>residência &amp; título</strong></div>
          </div>
          <div class="pricing-cards">
            <div class="pricing-card">
              <div class="pricing-icon">🎓</div>
              <h3>Gratuito</h3>
              <div class="pricing-amount">${isPt ? 'R$0' : 'US$0'}</div>
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
              <div class="pricing-badge">⭐ ${isPt ? 'MAIS POPULAR' : 'MOST POPULAR'}</div>
              <div class="pricing-icon">⚡</div>
              <h3>${isPt ? 'Mensal' : 'Monthly'}</h3>
              <div class="pricing-amount">${PRICE_MONTHLY}</div>
              <div class="pricing-period">${isPt ? 'por mês · cancele quando quiser' : 'per month · cancel anytime'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>${questionBank?.length ?? '+'} questões de nefrologia</li>
                <li>Modo de Estudo por tema</li>
                <li>Jornada RPG completa</li>
                <li>Ranking global</li>
                <li>Novos conteúdos todo mês</li>
                <li>Apoia o desenvolvimento da ferramenta</li>
              </ul>
              <button class="pricing-choose-btn btn-monthly" data-action="pricingChoose" data-arg="monthly">${isPt ? 'Assinar Agora' : 'Subscribe Now'}</button>
            </div>
            <div class="pricing-card">
              <div class="pricing-icon">👑</div>
              <h3>${isPt ? 'Vitalício' : 'Lifetime'}</h3>
              <div class="pricing-amount">${PRICE_LIFETIME}</div>
              <div class="pricing-period">${isPt ? 'pagamento único · acesso forever' : 'one-time payment · access forever'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>Tudo do plano Mensal</li>
                <li>Todas as futuras atualizações</li>
                <li>Melhor custo-benefício</li>
                <li>Acesso vitalício garantido</li>
                <li>Maior contribuição ao projeto</li>
                <li>Formação de nefrologistas para sempre</li>
              </ul>
              <button class="pricing-choose-btn btn-lifetime" data-action="pricingChoose" data-arg="lifetime">${isPt ? 'Compra Única' : 'Buy Once'}</button>
            </div>
          </div>
          <button class="pricing-login-link" data-action="_pricingToLogin">${isPt ? 'Já tenho conta — Entrar' : 'I have an account — Sign in'}</button>
        </div>`;
      document.body.appendChild(modal);
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
          <div class="promo-banner-icon">🧠</div>
          <div class="promo-banner-body">
            <div class="promo-banner-title">Você está dominando a Nefrologia!</div>
            <div class="promo-banner-text">
              Restam <strong style="color:#ffd700">${remaining} questões</strong> gratuitas.
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

    function pricingChoose(tier) {
      closePricingModal();
      if (tier === 'free') {
        if (!authUser) { openAuthModal(); switchAuthTab('cadastrar'); }
        return;
      }
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
      // Pequeno delay para fechar modal de auth antes de redirecionar
      setTimeout(() => _initPayment(plan), 400);
    }

    async function _initPayment(plan) {
      if (!authUser) { showPricingModal(); return; }

      // Mostrar loading
      const loadingEl = _showPaymentLoading(plan);

      try {
        const session = await _supaClient.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('Sessão inválida');

        const res = await fetch(`${SUPA_URL}/functions/v1/swift-function`, {
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
        // Redirecionar para Mercado Pago
        window.location.href = data.checkout_url;

      } catch (err) {
        loadingEl?.remove();
        _showPaymentError(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
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
        <div style="font-family:'Cinzel',serif;color:#ffd700;font-size:0.9rem;letter-spacing:1px;">Preparando ${label}…</div>
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

    // Detecta retorno do Mercado Pago e exibe feedback
    (function _checkPaymentReturn() {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('payment');
      const plan   = params.get('plan');
      if (!status) return;

      // Limpar params da URL sem recarregar
      const clean = window.location.pathname;
      window.history.replaceState({}, '', clean);

      if (status === 'approved') {
        _showPaymentSuccess(plan);
      } else if (status === 'pending') {
        _showPaymentPending();
      }
      // failed: não mostra nada, usuário já viu a tela do MP
    })();

    function _showPaymentSuccess(plan) {
      _track('premium_converted', { plan });
      const el = document.createElement('div');
      el.id = 'paymentSuccessOverlay';
      el.className = 'nq-overlay';
      el.style.cssText = 'background:rgba(0,0,0,0.96);z-index:10000;';
      const label = plan === 'lifetime' ? 'Vitalício' : 'Mensal';
      el.innerHTML = `
        <div style="text-align:center;max-width:420px;">
          <div style="font-size:3rem;margin-bottom:16px;">👑</div>
          <h2 style="font-family:'Cinzel Decorative',serif;color:#ffd700;font-size:1.6rem;margin-bottom:8px;">Pagamento Confirmado!</h2>
          <p style="color:#a0c8e0;font-size:0.9rem;line-height:1.6;margin-bottom:24px;">
            Bem-vindo ao Plano ${label}!<br>
            Seu acesso a <strong style="color:#ffd700">${questionBank?.length ?? '+'} questões</strong> foi ativado.<br>
            Aguarde alguns instantes enquanto sincronizamos seu acesso.
          </p>
          <button data-remove-id="paymentSuccessOverlay" data-action="_pollPremiumActivation"
            style="background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a0e00;border:none;padding:14px 32px;border-radius:10px;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;letter-spacing:1px;cursor:pointer;">
            ⚔ Começar Jornada Premium
          </button>
        </div>`;
      document.body.appendChild(el);
      // Inicia polling automaticamente após 2s
      setTimeout(_pollPremiumActivation, 2000);
    }

    function _showPaymentPending() {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0d1a2e;border:1px solid rgba(255,200,0,0.4);color:#ffd060;padding:16px 24px;border-radius:10px;font-size:0.85rem;z-index:10001;max-width:360px;text-align:center;line-height:1.5;';
      el.innerHTML = '⏳ <strong>Pagamento em processamento.</strong><br>Assim que aprovado seu acesso será ativado automaticamente.';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 8000);
    }

    let _premiumPollCount = 0;
    let _premiumPolling = false; // evita chains concorrentes
    async function _pollPremiumActivation() {
      if (!authUser || !_supaClient) return;
      if (_premiumPolling) return; // já existe uma chain ativa
      _premiumPolling = true;
      _premiumPollCount = 0;
      try { await _doPremiumPoll(); } catch { _premiumPolling = false; }
    }
    async function _doPremiumPoll() {
      if (!authUser || !_supaClient || _premiumPollCount >= 10) {
        _premiumPolling = false;
        return;
      }
      _premiumPollCount++;
      try {
        const { data: profile } = await _supaClient
          .from('profiles')
          .select('is_premium')
          .eq('id', authUser.id)
          .single();
        if (profile?.is_premium) {
          localStorage.setItem(PREMIUM_KEY, '1');
          _invalidatePremiumCache();
          document.getElementById('paymentSuccessOverlay')?.remove();
          updateWelcomeUserBadge();
          _premiumPolling = false;
          return;
        }
      } catch(e) {
        _track('error_premium_poll', {msg: String(e)});
      }
      // Backoff exponencial: tentativas 1-3→3s, 4-6→5s, 7-10→8s
      const delay = _premiumPollCount <= 3 ? 3000 : _premiumPollCount <= 6 ? 5000 : 8000;
      setTimeout(_doPremiumPoll, delay);
    }

