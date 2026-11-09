(function () {
  'use strict';

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  onReady(function initLumenPortal() {
    var entry = document.querySelector('.nql-portal__entry');
    var routes = document.querySelector('.nql-portal__routes');
    var routeStatus = document.getElementById('portalRouteStatus');
    var skipLink = document.querySelector('.nql-skip-link');
    var portalMain = document.getElementById('portalMain');
    var routeCopy = {
      google: 'Acesso rápido com sua conta Google',
      email: 'Conta, progresso e revisões sincronizados',
      guest: '15 questões sem conta; com conta grátis, são 50'
    };

    function setRoute(route) {
      if (!entry || !routeCopy[route]) return;
      entry.dataset.route = route;
      if (routeStatus) routeStatus.textContent = routeCopy[route];
    }

    if (routes) {
      routes.querySelectorAll('[data-portal-route]').forEach(function (button) {
        var route = button.dataset.portalRoute;
        button.addEventListener('pointerenter', function () { setRoute(route); });
        button.addEventListener('focus', function () { setRoute(route); });
      });
      routes.addEventListener('pointerleave', function () {
        if (!routes.contains(document.activeElement)) setRoute('email');
      });
      routes.addEventListener('focusout', function (event) {
        if (!routes.contains(event.relatedTarget) && !(modal && modal.classList.contains('show'))) setRoute('email');
      });
    }

    if (skipLink && portalMain) {
      skipLink.addEventListener('click', function (event) {
        event.preventDefault();
        if (window.location.hash !== '#portalMain') {
          history.pushState(history.state, '', '/jogar/#portalMain');
        }
        portalMain.focus({ preventScroll: true });
        portalMain.scrollIntoView({ block: 'start', behavior: 'auto' });
      });
    }

    var modal = document.getElementById('authModal');
    if (!modal) return;

    if (routes) {
      routes.addEventListener('click', function (event) {
        var routeButton = event.target.closest('[data-portal-route]');
        if (!routeButton) return;
        modal.dataset.authEntry = routeButton.dataset.portalRoute === 'email' ? 'email' : 'generic';
      });
    }

    var authBox = document.getElementById('authBox');
    var tabEntrar = document.getElementById('tabEntrar');
    var tabCadastrar = document.getElementById('tabCadastrar');
    var formEntrar = document.getElementById('authFormEntrar');
    var formCadastrar = document.getElementById('authFormCadastrar');
    var formForgot = document.getElementById('authFormForgot');
    var authMsg = document.getElementById('authMsg');
    var backgroundRegions = ['landingScreen', 'welcomeScreen', 'mainApp']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var wasOpen = false;
    var returnFocus = null;
    var initialFocusFrame = 0;

    function isVisible(element) {
      if (!element || element.hidden || !element.getClientRects().length) return false;
      var style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function isActivePanel(element) {
      // O controlador de autenticação alterna display. A visibilidade herdada
      // do diálogo durante a animação não muda qual formulário está ativo.
      return !!element && !element.hidden && element.style.display !== 'none';
    }

    function syncPanels() {
      var loginActive = isActivePanel(formEntrar);
      var registerActive = isActivePanel(formCadastrar);
      var forgotActive = isActivePanel(formForgot);

      if (tabs) {
        tabs.classList.toggle('nql-auth-tabs--hidden', forgotActive);
        tabs.setAttribute('aria-hidden', String(forgotActive));
        tabs.inert = forgotActive;
      }

      if (tabEntrar) {
        tabEntrar.setAttribute('aria-selected', String(loginActive));
        tabEntrar.tabIndex = loginActive ? 0 : -1;
      }
      if (tabCadastrar) {
        tabCadastrar.setAttribute('aria-selected', String(registerActive));
        tabCadastrar.tabIndex = registerActive ? 0 : -1;
      }
      if (formEntrar) formEntrar.setAttribute('aria-hidden', String(!loginActive));
      if (formCadastrar) formCadastrar.setAttribute('aria-hidden', String(!registerActive));
      if (formForgot) formForgot.setAttribute('aria-hidden', String(!forgotActive));
    }

    function firstFieldForCurrentPanel() {
      if (isActivePanel(formForgot)) return document.getElementById('authForgotEmail');
      if (isActivePanel(formCadastrar)) return document.getElementById('authDisplayName');
      return document.getElementById('authEmail');
    }

    function focusInitialFieldWhenReady() {
      window.cancelAnimationFrame(initialFocusFrame);
      function attempt() {
        initialFocusFrame = 0;
        if (!modal.isConnected || !modal.classList.contains('show')) return;
        if (!isVisible(modal)) {
          initialFocusFrame = window.requestAnimationFrame(attempt);
          return;
        }
        syncPanels();
        var active = document.activeElement;
        if (active !== document.body && active !== document.documentElement && active !== returnFocus) return;
        var target = firstFieldForCurrentPanel();
        if (!isVisible(target)) {
          initialFocusFrame = window.requestAnimationFrame(attempt);
          return;
        }
        target.focus({ preventScroll: true });
      }
      initialFocusFrame = window.requestAnimationFrame(attempt);
    }

    function syncModal() {
      var isOpen = modal.classList.contains('show');
      modal.setAttribute('aria-hidden', String(!isOpen));
      modal.inert = !isOpen;
      backgroundRegions.forEach(function (region) { region.inert = isOpen; });
      document.body.classList.toggle('nql-auth-open', isOpen);
      syncPanels();

      if (isOpen && !wasOpen) {
        returnFocus = document.activeElement;
        focusInitialFieldWhenReady();
      } else if (!isOpen && wasOpen) {
        window.cancelAnimationFrame(initialFocusFrame);
        initialFocusFrame = 0;
        if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') {
          returnFocus.focus({ preventScroll: true });
        }
        returnFocus = null;
        modal.removeAttribute('data-auth-entry');
      }
      wasOpen = isOpen;
    }

    function getFocusable() {
      if (!authBox) return [];
      return Array.prototype.filter.call(
        authBox.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        isVisible
      );
    }

    modal.addEventListener('keydown', function (event) {
      if (!modal.classList.contains('show')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        if (typeof window.closeAuthModal === 'function') window.closeAuthModal();
        return;
      }

      if (event.key === 'Tab') {
        var focusable = getFocusable();
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (event.key === 'Enter' && /^(INPUT|SELECT)$/.test(event.target.tagName)) {
        event.preventDefault();
        event.stopPropagation();
        var pendingButton = isVisible(formForgot)
          ? document.getElementById('authForgotBtn')
          : isVisible(formCadastrar)
            ? document.getElementById('authRegBtn')
            : document.getElementById('authLoginBtn');
        if (pendingButton && pendingButton.disabled) return;
        if (isVisible(formForgot) && typeof window.authForgotPassword === 'function') {
          window.authForgotPassword();
        } else if (isVisible(formCadastrar) && typeof window.authEmailRegister === 'function') {
          window.authEmailRegister();
        } else if (typeof window.authEmailLogin === 'function') {
          window.authEmailLogin();
        }
      }
    });

    var tabs = modal.querySelector('.auth-tabs');
    if (tabs) {
      tabs.addEventListener('keydown', function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        var useLogin = event.key === 'Home'
          ? true
          : event.key === 'End'
            ? false
            : document.activeElement === tabCadastrar;
        var nextTab = useLogin ? tabEntrar : tabCadastrar;
        if (nextTab) nextTab.click();
        window.setTimeout(function () {
          syncPanels();
          if (nextTab) nextTab.focus();
        }, 0);
      });
    }

    modal.addEventListener('click', function (event) {
      var forgotTrigger = event.target.closest('[data-action="showForgotPassword"]');
      var tabTrigger = event.target.closest('[data-action="switchAuthTab"]');
      if (!forgotTrigger && !tabTrigger) return;
      window.setTimeout(function () {
        syncPanels();
        var target = firstFieldForCurrentPanel();
        if (target) target.focus({ preventScroll: true });
      }, 0);
    });

    if (authMsg) {
      new MutationObserver(function () {
        var isError = authMsg.classList.contains('error');
        var hasMessage = !!authMsg.textContent.trim();
        authMsg.setAttribute('role', isError ? 'alert' : 'status');
        if (!hasMessage || !modal.classList.contains('show')) return;
        window.requestAnimationFrame(function () {
          authMsg.scrollIntoView({ block: 'center', behavior: 'auto' });
          if (isError) {
            var invalidField = modal.querySelector('[aria-invalid="true"]');
            (invalidField || authMsg).focus({ preventScroll: true });
          }
        });
      }).observe(authMsg, { attributes: true, attributeFilter: ['class'], childList: true });
    }

    modal.querySelectorAll('#authLoginBtn, #authForgotBtn, #authRegBtn, #authResendBtn').forEach(function (button) {
      new MutationObserver(function () {
        button.setAttribute('aria-busy', String(button.disabled));
      }).observe(button, { attributes: true, attributeFilter: ['disabled'] });
      button.setAttribute('aria-busy', String(button.disabled));
    });

    new MutationObserver(syncModal).observe(modal, { attributes: true, attributeFilter: ['class'] });
    [tabEntrar, tabCadastrar, formEntrar, formCadastrar, formForgot].forEach(function (element) {
      if (!element) return;
      new MutationObserver(syncPanels).observe(element, { attributes: true, attributeFilter: ['class', 'style'] });
    });

    syncModal();
  });
})();
