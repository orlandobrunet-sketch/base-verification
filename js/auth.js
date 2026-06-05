// NefroQuest — Auth (Supabase), Login, Guest, Profile
// Plain script — shares global scope with game.js

    // ============ SUPABASE CONFIG (single source of truth) ============
    // Para futura troca para custom domain (ex: https://auth.nefroquest.com),
    // mudar APENAS esta constante — todo o app referencia via window.NQ_CONFIG
    // ou direto via SUPA_URL no escopo global. Veja docs/AUTH_SETUP.md.
    const SUPA_URL = 'https://wviutasgroltjuyxpevc.supabase.co';
    const SUPA_KEY = 'sb_publishable_kUxWMU36-PEaNuhEqTy3Zw_-A5ep67_';

    // Onde o usuário é redirecionado APÓS completar o login OAuth (Google).
    // - Produção (nefroquest.com): fixa em https://nefroquest.com pra evitar
    //   inconsistências (www vs apex, query params residuais, etc).
    // - Dev local (localhost/127.0.0.1): usa origin atual pra OAuth funcionar
    //   no ambiente de desenvolvimento.
    const AUTH_REDIRECT_URL = (function() {
      const h = location.hostname;
      if (h === 'localhost' || h === '127.0.0.1') return location.origin;
      return 'https://nefroquest.com';
    })();

    // Expor config globalmente — outros módulos podem consultar via
    // window.NQ_CONFIG sem depender da ordem de carregamento dos scripts.
    window.NQ_CONFIG = window.NQ_CONFIG || {};
    window.NQ_CONFIG.SUPA_URL = SUPA_URL;
    window.NQ_CONFIG.SUPA_KEY = SUPA_KEY;
    window.NQ_CONFIG.AUTH_REDIRECT_URL = AUTH_REDIRECT_URL;

    // ===== SUPABASE AUTH =====
    let _supaClient = null;
    let authUser = null;
    Object.defineProperty(window, 'authUser', {
      get() { return authUser; },
      set(val) { authUser = val; },
      configurable: true
    });
    let _guestMode = false;
    let _guestHookShown = false;
    let _guestQuestionCount = 0;
    const GUEST_FREE_LIMIT = 15;

    (function initSupaAuth() {
      if (localStorage.getItem('nq_guest_mode') === '1') _guestMode = true;
      if (typeof supabase === 'undefined') { _track('error_supabase_missing'); return; }
      _supaClient = supabase.createClient(SUPA_URL, SUPA_KEY);

      _supaClient.auth.onAuthStateChange(async (event, session) => {
        const candidateUser = session?.user ?? null;
        if (event === 'PASSWORD_RECOVERY') {
          authUser = candidateUser;
          showUpdatePasswordModal();
          return;
        }
        authUser = candidateUser;
        if (authUser) {
          if (_guestMode) {
            _guestMode = false;
            _guestHookShown = false;
            localStorage.removeItem('nq_guest_mode');
          }
          _loadPremiumFromDB();
          _loadProgressFromCloud();
          checkFirstTimeOnboarding();
          // Se havia plano pendente (usuário clicou em pagar antes de fazer login)
          _resumePendingPayment();
        } else {
          localStorage.removeItem(PREMIUM_KEY);
          localStorage.removeItem(WHITELIST_KEY);
          localStorage.removeItem('nefroquest-premium-sig');
          localStorage.removeItem('nefroquest-whitelist-sig');
          _invalidatePremiumCache();
        }
        updateWelcomeUserBadge();
      });

      _supaClient.auth.getSession().then(({ data: { session } }) => {
        authUser = session?.user ?? null;
        if (authUser) { _loadPremiumFromDB(); _loadProgressFromCloud(); }
        else {
          localStorage.removeItem(PREMIUM_KEY);
          localStorage.removeItem('nefroquest-premium-sig');
          localStorage.removeItem('nefroquest-whitelist-sig');
          _invalidatePremiumCache();
        }
        updateWelcomeUserBadge();
      }).catch(() => { updateWelcomeUserBadge(); });
    })();

    function _authDisplayName() {
      if (!authUser) return null;
      return authUser.user_metadata?.full_name
        || authUser.user_metadata?.name
        || authUser.email?.split('@')[0]
        || 'Aventureiro';
    }

    function updateWelcomeUserBadge() {
      // Itens de admin só aparecem para admin LOGADO. Recalculado sempre —
      // senão, ao sair (ou entrar como visitante) os menus de admin ficavam
      // abertos, parecendo que a conta Google ainda estava logada.
      const _showAdmin = !!authUser && isAdminUser();
      document.querySelectorAll('.admin-item').forEach(el => el.classList.toggle('visible', _showAdmin));
      if (authUser) {
        const email = authUser.email || '';
        document.querySelectorAll('.profile-btn').forEach(b => b.classList.add('visible'));
        document.querySelectorAll('[id$="ProfileEmail"]').forEach(el => { el.textContent = email; });
        const mobileTopEmail = document.getElementById('mobileTopProfileEmail');
        if (mobileTopEmail) mobileTopEmail.textContent = email;
        const landing = document.getElementById('landingScreen');
        if (landing && !landing.classList.contains('hidden')) {
          landing.classList.add('hidden');
          document.getElementById('welcomeScreen')?.classList.remove('hidden');
          refreshWelcomeSave();
          if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
        }
      } else if (_guestMode) {
        document.querySelectorAll('.profile-btn').forEach(b => b.classList.add('visible'));
        document.querySelectorAll('[id$="ProfileEmail"]').forEach(el => { el.textContent = '👤 Convidado'; });
        const landing = document.getElementById('landingScreen');
        if (landing && !landing.classList.contains('hidden')) {
          landing.classList.add('hidden');
          document.getElementById('welcomeScreen')?.classList.remove('hidden');
          refreshWelcomeSave();
          if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
        }
      } else {
        document.querySelectorAll('.profile-btn').forEach(b => b.classList.remove('visible'));
      }
    }

    function openAuthModal() {
      document.getElementById('authModal').classList.add('show');
      _setAuthMsg('', '');
    }
    function closeAuthModal() {
      document.getElementById('authModal').classList.remove('show');
    }
    let _windowJustFocused = false;
    window.addEventListener('focus', () => { _windowJustFocused = true; setTimeout(() => { _windowJustFocused = false; }, 300); });
    function closeAuthOutside(e) {
      if (_windowJustFocused) return; // ignora clique de reativação da janela
      if (e.target.id === 'authModal') closeAuthModal();
    }
    function switchAuthTab(tab) {
      const isEntrar = tab === 'entrar';
      document.getElementById('tabEntrar').classList.toggle('active', isEntrar);
      document.getElementById('tabCadastrar').classList.toggle('active', !isEntrar);
      document.getElementById('authFormEntrar').style.display = isEntrar ? 'block' : 'none';
      document.getElementById('authFormCadastrar').style.display = isEntrar ? 'none' : 'block';
      document.getElementById('authFormForgot').style.display = 'none';
      _setAuthMsg('', '');
    }
    function showForgotPassword() {
      document.getElementById('authFormEntrar').style.display = 'none';
      document.getElementById('authFormCadastrar').style.display = 'none';
      document.getElementById('authFormForgot').style.display = 'block';
      _setAuthMsg('', '');
    }
    async function authForgotPassword() {
      if (!_supaClient) return;
      const email = document.getElementById('authForgotEmail').value.trim();
      if (!email) { _setAuthMsg('Digite seu email.', 'error'); return; }
      const btn = document.getElementById('authForgotBtn');
      btn.disabled = true; btn.textContent = 'Enviando...';
      try {
        const { error } = await _supaClient.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://nefroquest.com'
        });
        if (error) { _setAuthMsg(error.message, 'error'); }
        else { _setAuthMsg('Link enviado! Verifique seu email.', 'success'); }
      } catch { _setAuthMsg('Erro de conexão. Tente novamente.', 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Enviar Link de Redefinição'; }
    }
    function authKeyPress(e) {
      if (e.key !== 'Enter') return;
      const entrarVisible = document.getElementById('authFormEntrar').style.display !== 'none';
      entrarVisible ? authEmailLogin() : authEmailRegister();
    }
    function _setAuthMsg(msg, type) {
      const el = document.getElementById('authMsg');
      el.textContent = msg;
      el.className = 'auth-msg' + (type ? ' ' + type : '');
      el.style.display = msg ? 'block' : 'none';
    }
    async function loginWithGoogle() {
      if (!_supaClient) return;
      try {
        const { error } = await _supaClient.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: AUTH_REDIRECT_URL }
        });
        if (error) _setAuthMsg(error.message, 'error');
      } catch { _setAuthMsg('Erro de conexão. Tente novamente.', 'error'); }
    }
    async function authEmailLogin() {
      if (!_supaClient) return;
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      if (!email || !password) { _setAuthMsg('Preencha email e senha.', 'error'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _setAuthMsg('Digite um email válido.', 'error'); return; }
      const btn = document.getElementById('authLoginBtn');
      btn.disabled = true; btn.textContent = 'Entrando...';
      try {
        const { error } = await _supaClient.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos.'
            : error.message === 'Email not confirmed'
              ? 'Email não confirmado. Verifique sua caixa de entrada e clique no link de ativação.'
              : error.message;
          _setAuthMsg(msg, 'error');
        } else { closeAuthModal(); }
      } catch { _setAuthMsg('Erro de conexão. Tente novamente.', 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Entrar na Jornada'; }
    }
    async function authEmailRegister() {
      if (!_supaClient) return;
      const name = document.getElementById('authDisplayName').value.trim();
      const specialty = document.getElementById('authSpecialty').value;
      const email = document.getElementById('authEmailReg').value.trim();
      const password = document.getElementById('authPasswordReg').value;
      const passwordConfirm = document.getElementById('authPasswordConfirm').value;
      if (!name || !email || !password || !passwordConfirm) { _setAuthMsg('Preencha todos os campos.', 'error'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _setAuthMsg('Digite um email válido.', 'error'); return; }
      if (password.length < 6) { _setAuthMsg('Senha deve ter pelo menos 6 caracteres.', 'error'); return; }
      if (password !== passwordConfirm) { _setAuthMsg('As senhas não coincidem.', 'error'); return; }
      const btn = document.getElementById('authRegBtn');
      btn.disabled = true; btn.textContent = 'Criando conta...';
      try {
        const { error } = await _supaClient.auth.signUp({
          email, password,
          options: {
            data: { full_name: name, specialty },
            emailRedirectTo: window.location.origin + window.location.pathname
          }
        });
        if (error) { _setAuthMsg(error.message, 'error'); }
        else {
          _setAuthMsg('Conta criada! Verifique seu email para confirmar.', 'success');
          const resendEl = document.getElementById('authResendWrap');
          if (resendEl) { resendEl.style.display = 'block'; resendEl.dataset.email = email; }
        }
      } catch { _setAuthMsg('Erro de conexão. Tente novamente.', 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Criar Conta'; }
    }
    async function authResendConfirmation() {
      if (!_supaClient) return;
      const el = document.getElementById('authResendWrap');
      const email = el ? el.dataset.email : '';
      if (!email) return;
      const btn = document.getElementById('authResendBtn');
      btn.disabled = true; btn.textContent = 'Reenviando...';
      try {
        const { error } = await _supaClient.auth.resend({ type: 'signup', email });
        _setAuthMsg(error ? error.message : 'Email reenviado! Verifique sua caixa de entrada e o spam.', error ? 'error' : 'success');
      } catch { _setAuthMsg('Erro de conexão. Tente novamente.', 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Reenviar email'; }
    }
    async function authLogout() {
      if (!_supaClient) return;
      try { await _supaClient.auth.signOut(); } catch { /* cleanup local state regardless */ }
      authUser = null;
      _guestMode = false;
      _guestHookShown = false;
      localStorage.removeItem('nq_guest_mode');
      localStorage.removeItem(PREMIUM_KEY);
      localStorage.removeItem('nefroquest-premium-sig');
      localStorage.removeItem(WHITELIST_KEY);
      localStorage.removeItem('nefroquest-whitelist-sig');
      _invalidatePremiumCache(); _invalidateStatsCache();
      if (typeof window.clearLocalProgress === 'function') window.clearLocalProgress();
      updateWelcomeUserBadge();
      document.getElementById('welcomeScreen')?.classList.add('hidden');
      document.getElementById('landingScreen')?.classList.remove('hidden');
      document.getElementById('mainApp')?.classList.add('hidden');
    }

    function playAsGuest() {
      _guestMode = true;
      localStorage.setItem('nq_guest_mode', '1');
      const landing = document.getElementById('landingScreen');
      const welcome = document.getElementById('welcomeScreen');
      if (landing) landing.classList.add('hidden');
      if (welcome) welcome.classList.remove('hidden');
      updateWelcomeUserBadge();
    }

    function _showGuestHook() {
      if (!_guestMode || _guestHookShown || authUser) return;
      _guestHookShown = true;
      const overlay = document.createElement('div');
      overlay.className = 'nq-overlay';
      overlay.style.cssText = 'background:rgba(0,0,0,0.88);z-index:10001;backdrop-filter:blur(6px);padding:20px;';
      overlay.innerHTML = `
        <div style="background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid rgba(255,215,0,0.5);border-radius:16px;padding:28px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 0 60px rgba(255,215,0,0.15);">
          <div style="font-size:2rem;margin-bottom:8px;">🏆</div>
          <h2 style="color:var(--gold);font-family:'Cinzel',serif;margin-bottom:6px;font-size:1.2rem;">Nível 2 desbloqueado!</h2>
          <p style="color:var(--txt-dim);font-size:0.85rem;margin-bottom:20px;line-height:1.6;">Crie uma conta gratuita para salvar seu XP, equipamentos e sequência — e aparecer no ranking.</p>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;text-align:left;">
            <div style="color:#c8d8f0;font-size:0.82rem;">✅ Progresso salvo em qualquer dispositivo</div>
            <div style="color:#c8d8f0;font-size:0.82rem;">✅ Aparecer no ranking global</div>
            <div style="color:#c8d8f0;font-size:0.82rem;">✅ Streak e conquistas permanentes</div>
          </div>
          <button id="guestHookSignup" style="width:100%;padding:13px;background:linear-gradient(135deg,#fbbf24,#f59e0b);border:none;border-radius:10px;color:#1a0e00;font-weight:900;font-size:0.95rem;cursor:pointer;font-family:'Cinzel',serif;letter-spacing:1px;margin-bottom:10px;">🔑 Criar conta — é grátis</button>
          <button id="guestHookContinue" style="width:100%;padding:11px;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:10px;color:var(--txt-dim);font-size:0.82rem;cursor:pointer;">Continuar sem salvar</button>
        </div>
      `;
      document.body.appendChild(overlay);
      document.getElementById('guestHookSignup').onclick = () => {
        overlay.remove();
        openAuthModal();
      };
      document.getElementById('guestHookContinue').onclick = () => overlay.remove();
    }

    // ===== REDEFINIÇÃO DE SENHA =====
    function showUpdatePasswordModal() {
      let modal = document.getElementById('updatePasswordModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'updatePasswordModal';
        modal.className = 'nq-overlay nq-overlay--top';
        modal.style.cssText = 'background:rgba(0,0,0,0.92);z-index:10000;backdrop-filter:blur(10px);';
        modal.innerHTML = `
          <div class="modal-panel" style="max-width:400px;margin:auto 0;">
            <h2>🔑 Nova Senha</h2>
            <p style="color:#a0b8d0;font-size:0.85rem;margin-bottom:16px;text-align:center;line-height:1.6">Digite sua nova senha para retomar a jornada.</p>
            <div class="form-group">
              <label>Nova Senha</label>
              <input id="newPassword" type="password" placeholder="mín. 6 caracteres">
            </div>
            <div class="form-group">
              <label>Confirmar Senha</label>
              <input id="newPasswordConfirm" type="password" placeholder="repita a senha">
            </div>
            <div id="updatePwMsg" style="display:none;margin-bottom:12px;font-size:0.83rem;border-radius:6px;padding:8px 12px;"></div>
            <div class="modal-actions">
              <button data-action="saveNewPassword" style="background:linear-gradient(135deg,#c8960b,#ffd700);color:#1a0e00;border:none;font-weight:700;font-family:'Cinzel',serif;">Salvar Nova Senha</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      } else { modal.style.display = 'flex'; }
    }
    async function saveNewPassword() {
      const pwd = document.getElementById('newPassword').value;
      const confirm = document.getElementById('newPasswordConfirm').value;
      const msg = document.getElementById('updatePwMsg');
      const showMsg = (text, ok) => {
        msg.style.display = 'block';
        msg.style.background = ok ? 'rgba(74,222,128,0.15)' : 'rgba(251,113,133,0.15)';
        msg.style.color = ok ? '#4ade80' : '#fb7185';
        msg.textContent = text;
      };
      if (pwd.length < 6) { showMsg('Senha deve ter pelo menos 6 caracteres.', false); return; }
      if (pwd !== confirm) { showMsg('As senhas não coincidem.', false); return; }
      try {
        const { error } = await _supaClient.auth.updateUser({ password: pwd });
        if (error) { showMsg(error.message, false); }
        else {
          showMsg('Senha atualizada com sucesso!', true);
          setTimeout(() => { document.getElementById('updatePasswordModal').style.display = 'none'; }, 1500);
        }
      } catch { showMsg('Erro de conexão. Tente novamente.', false); }
    }

    // ===== ONBOARDING =====
    const ONBOARDED_KEY = 'nefroquest-onboarded';
    function checkFirstTimeOnboarding() {
      // Popup de onboarding removido — informações exibidas diretamente na tela de login
    }
    function showOnboardingModal() {
      // Popup de onboarding removido — informações exibidas diretamente na tela de login
    }

    // ===== LANDING SCREEN =====
    function landingLoginGoogle() {
      loginWithGoogle();
    }
    function landingLoginEmail() {
      openAuthModal();
      switchAuthTab('entrar');
    }
    // (dead code removido em v10.90: landingPlayGuest — botão usa playAsGuest
    //  direto; showLandingMsg — erros do landing vão pelo _setAuthMsg do modal)

    // ===== PROFILE POPUP =====
    function toggleProfilePopup(ctx) {
      const ids = { game: 'gameProfilePopup', welcome: 'welcomeProfilePopup', landing: 'landingProfilePopup', mobile: 'mobileProfilePopup', mobileTop: 'mobileTopProfilePopup' };
      const popup = document.getElementById(ids[ctx] || 'welcomeProfilePopup');
      if (!popup) return;
      const isOpen = popup.classList.contains('open');
      // Close all popups first
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      if (!isOpen) popup.classList.add('open');
    }
    // Close profile popup when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.profile-btn') && !e.target.closest('#mobileMenuBtn') && !e.target.closest('.profile-popup')) {
        document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      }
    });

    window.saveNewPassword        = saveNewPassword;
    window.openAuthModal          = openAuthModal;
    window.closeAuthModal         = closeAuthModal;
    window.switchAuthTab          = switchAuthTab;
    window.showForgotPassword     = showForgotPassword;
    window.authEmailLogin         = authEmailLogin;
    window.authEmailRegister      = authEmailRegister;
    window.authResendConfirmation = authResendConfirmation;
    window.authLogout             = authLogout;
    window.authKeyPress           = authKeyPress;  // mantido por compat — não mais usado pelo HTML
    window.loginWithGoogle        = loginWithGoogle;
    window.playAsGuest            = playAsGuest;
    window.showUpdatePasswordModal = showUpdatePasswordModal;
    window.toggleProfilePopup     = toggleProfilePopup;
    window.landingLoginGoogle     = landingLoginGoogle;
    window.landingLoginEmail      = landingLoginEmail;

    // ── Bind keypress listeners (substitui onkeypress= inline no HTML) ──
    // auth.js carrega com defer, então DOM está pronto neste ponto.
    (function bindAuthKeypress() {
      ['authPassword', 'authPasswordConfirm'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keypress', authKeyPress);
      });
    })();
