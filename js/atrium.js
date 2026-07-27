/**
 * NefroQuest — Lúmen Vivo / Página 2: Átrio da Jornada
 * Camada exclusivamente visual e de acessibilidade. A lógica do jogo permanece em game.js.
 */
(function initLumenAtrium() {
  'use strict';

  const ROUTE_COPY = {
    modes: 'Alterne entre a jornada principal, treinos, prova e desafios rápidos.',
    dashboard: 'Leia seus pontos fortes, lacunas e evolução por competência.',
    ritual: 'Responda ao ritual para receber uma dificuldade inicial recomendada.',
    ranking: 'Compare constância, nível e pontuação com outros exploradores.',
    library: 'Consulte referências e materiais para aprofundar o raciocínio clínico.'
  };

  const DEFAULT_STATUS = 'Explore uma rota sem perder o fio da sua jornada.';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  ready(() => {
    const screen = document.getElementById('welcomeScreen');
    if (!screen || screen.dataset.nqUi !== 'lumen') return;

    const main = document.getElementById('atriumMain');
    const skipLink = screen.querySelector('.nql-skip-link');
    const savedInfo = document.getElementById('welcomeSavedInfo');
    const continueButton = document.getElementById('welcomeContinueBtn');
    const status = document.getElementById('atriumRouteStatus');
    const routeList = screen.querySelector('.nql-atrium__route-list');

    let currentRoute = null;

    function isRendered(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function syncJourneyState() {
      const hasSavedJourney = isRendered(savedInfo) || isRendered(continueButton);
      screen.dataset.journeyState = hasSavedJourney ? 'saved' : 'fresh';
    }

    function syncScreenState() {
      const isHidden = screen.classList.contains('hidden');
      screen.setAttribute('aria-hidden', String(isHidden));
      if (!isHidden) window.requestAnimationFrame(syncJourneyState);
    }

    function setRoute(route) {
      if (!route || !status) return;
      currentRoute?.classList.remove('is-current');
      currentRoute = route;
      currentRoute.classList.add('is-current');
      status.textContent = ROUTE_COPY[route.dataset.atriumRoute] || DEFAULT_STATUS;
    }

    function clearRoute(route) {
      if (!route || route !== currentRoute) return;
      route.classList.remove('is-current');
      currentRoute = null;
      if (status) status.textContent = DEFAULT_STATUS;
    }

    skipLink?.addEventListener('click', (event) => {
      event.preventDefault();
      history.replaceState(null, '', '/jogar/#atriumMain');
      main?.focus({ preventScroll: true });
      main?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });

    routeList?.addEventListener('pointerover', (event) => {
      const route = event.target.closest('[data-atrium-route]');
      if (route && routeList.contains(route)) setRoute(route);
    });

    routeList?.addEventListener('pointerout', (event) => {
      const route = event.target.closest('[data-atrium-route]');
      if (!route || route.contains(event.relatedTarget)) return;
      clearRoute(route);
    });

    routeList?.addEventListener('focusin', (event) => {
      const route = event.target.closest('[data-atrium-route]');
      if (route && routeList.contains(route)) setRoute(route);
    });

    routeList?.addEventListener('focusout', (event) => {
      const route = event.target.closest('[data-atrium-route]');
      if (!route || route.contains(event.relatedTarget)) return;
      clearRoute(route);
    });

    const screenObserver = new MutationObserver(syncScreenState);
    screenObserver.observe(screen, { attributes: true, attributeFilter: ['class'] });

    const journeyObserver = new MutationObserver(syncJourneyState);
    if (savedInfo) journeyObserver.observe(savedInfo, { attributes: true, attributeFilter: ['style', 'class'] });
    if (continueButton) journeyObserver.observe(continueButton, { attributes: true, attributeFilter: ['style', 'class'] });

    syncScreenState();
    syncJourneyState();
  });
})();
