/* Presentation only. Native Chamber controls, answers and persistence remain untouched. */
(function () {
  'use strict';

  const mounted = new WeakMap();
  const foldMemories = new WeakMap();
  const chapterMemories = new WeakMap();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function shown(node) {
    if (!node?.isConnected || node.closest('[hidden], .nql-hidden, [inert]')) return false;
    const closed = node.closest('details:not([open])');
    return !closed || !!closed.querySelector(':scope > summary')?.contains(node);
  }

  function inViewport(node) {
    if (!shown(node)) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
      rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function mark(state, node, name, value) {
    if (!node) return;
    let original = state.attributes.get(node);
    if (!original) { original = new Map(); state.attributes.set(node, original); }
    if (!original.has(name)) original.set(name, node.getAttribute(name));
    if (node.getAttribute(name) !== value) node.setAttribute(name, value);
  }

  function decorative(state, tag, className, parent) {
    const node = document.createElement(tag);
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    state.owned.add(node);
    parent.append(node);
    return node;
  }

  function caseId(card) {
    const art = window.NQChamberArt;
    const direct = card.getAttribute('data-ab-case');
    if (direct && art?.scenes?.[direct]) return direct;
    // Locked cards deliberately have no action ID. Match only approved patient identity.
    const name = card.querySelector('.ab-case-char')?.textContent?.trim();
    return Object.values(art?.portraits || {}).find(entry => entry.name === name)?.id;
  }

  function loadCardArt(state, card) {
    if (!inViewport(card) || card.dataset.abxArt === 'unavailable' || card.querySelector('.abx-case-art')) return;
    const id = caseId(card);
    const entry = id && window.NQChamberArt?.scenes?.[id];
    if (!entry?.approved || entry.src !== `assets/chamber/scenes/${id}.webp`) return;
    const image = decorative(state, 'img', 'abx-case-art', card);
    image.alt = '';
    image.width = 1280;
    image.height = 720;
    image.decoding = 'async';
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      image.remove();
      mark(state, card, 'data-abx-art', 'unavailable');
    }, { once: true, signal: state.events.signal });
    mark(state, card, 'data-abx-art', 'ready');
    image.src = entry.src;
  }

  function syncMotion(state) {
    const overlay = state.overlay;
    const allowed = !reduced.matches && !overlay.hasAttribute('data-ab-motion-paused');
    const scene = overlay.querySelector('[data-ab-lab]');
    const running = allowed && !document.hidden && scene?.dataset.motion === 'running' && shown(scene);
    mark(state, overlay, 'data-abx-motion', running ? 'running' : 'paused');
    mark(state, overlay, 'data-abx-motion-enabled', allowed && !document.hidden ? 'true' : 'false');
    state.pointerEnabled = !!running && finePointer.matches && !!state.worldSource;
    if (!state.pointerEnabled) resetDepth(state);
  }

  function resetDepth(state) {
    if (state.depthFrame) cancelAnimationFrame(state.depthFrame);
    state.depthFrame = 0;
    state.depthRect = null;
    state.world?.style.setProperty('--abx-depth-x', '0px');
    state.world?.style.setProperty('--abx-depth-y', '0px');
  }

  function pointerDepth(state, event) {
    if (!state.pointerEnabled || event.pointerType === 'touch' || !state.world) return;
    // Geometry is read once per pointer entry/resize/scroll, never inside a frame.
    if (!state.depthRect) state.depthRect = state.card.getBoundingClientRect();
    const rect = state.depthRect;
    if (!rect.width || !rect.height) return;
    state.depthX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)) * 7;
    state.depthY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)) * 4;
    if (state.depthFrame) return;
    state.depthFrame = requestAnimationFrame(() => {
      state.depthFrame = 0;
      if (mounted.get(state.overlay) !== state || !state.pointerEnabled || document.hidden) return;
      state.world.style.setProperty('--abx-depth-x', `${state.depthX.toFixed(2)}px`);
      state.world.style.setProperty('--abx-depth-y', `${state.depthY.toFixed(2)}px`);
    });
  }

  function world(state, card, stage) {
    const atmosphere = card.querySelector(':scope > .abx-atmosphere');
    if (!atmosphere) return;
    state.card = card;
    if (!state.world?.isConnected) {
      state.world = decorative(state, 'span', 'abx-world', atmosphere);
      state.worldArt = decorative(state, 'span', 'abx-world-art', state.world);
    }
    const scene = card.querySelector('[data-ab-case-scene]');
    // Reuse only the native scene already selected by the case, including its fallback.
    const source = scene?.querySelector('[data-ab-scene-image]')?.getAttribute('src');
    const safe = /^assets\/(?:chamber\/scenes\/[a-z0-9_-]+|scenes\/chamber-balance-still)\.webp$/.test(source || '');
    const next = stage !== 'catalogue' && safe ? source : '';
    if (state.worldSource !== next) {
      state.worldSource = next;
      state.worldArt.style.backgroundImage = next ? `url("${next}")` : 'none';
    }
  }

  function seal(state, parent, className, outcome) {
    if (!parent || parent.querySelector(`:scope > .${className}`)) return;
    const node = decorative(state, 'span', className, parent);
    node.dataset.abxSeal = outcome;
    const sign = outcome === 'correct' ? '<path d="m21 32 8 8 15-17"/>'
      : outcome === 'review' ? '<path d="M41 22a15 15 0 1 0 4 15M41 15v10H31"/>'
        : '<path d="M19 21h11l3 4 3-4h10v24H36l-3 4-3-4H19zM33 25v24M24 28h5m-5 7h5m8-7h4m-4 7h4"/>';
    node.innerHTML = `<svg viewBox="0 0 66 66" focusable="false" aria-hidden="true"><circle class="abx-seal-orbit" cx="33" cy="33" r="29"/><circle class="abx-seal-inner" cx="33" cy="33" r="24"/>${sign}<path class="abx-seal-rays" d="M33 1v5m0 54v5M1 33h5m54 0h5"/></svg>`;
    return node;
  }

  function chapter(state, card, stage, outcome) {
    const id = card.querySelector('[data-ab-case-scene]')?.dataset.abCaseScene;
    if (!id) return;
    const steps = [...card.querySelectorAll('.ab-progress .ab-dot')];
    const route = card.querySelector('.ab-intro-route');
    const count = route?.children.length || steps.length;
    if (count) chapterMemories.set(state.overlay, { id, count });
    const progress = card.querySelector('.ab-progress');
    if (progress && !progress.querySelector('.abx-route-line')) {
      decorative(state, 'span', 'abx-route-line', progress);
    }
    const line = progress?.querySelector('.abx-route-line');
    if (line && steps.length) {
      const current = steps.findIndex(step => step.classList.contains('current'));
      const passed = current >= 0 ? current : steps.filter(step => step.classList.contains('done')).length;
      line.style.setProperty('--abx-route-fill', `${Math.min(100, passed / Math.max(1, steps.length - 1) * 100)}%`);
    }
    const feedback = card.querySelector('#abFeedback');
    if (outcome !== 'pending' && feedback && !feedback.hidden) seal(state, feedback, 'abx-verdict-seal', outcome);
    if (stage !== 'result') return;
    const summary = card.querySelector('.ab-summary-view');
    const signature = seal(state, summary, 'abx-chapter-seal', 'complete');
    if (signature) summary.querySelector('.ab-summary-title')?.before(signature);
    const memory = chapterMemories.get(state.overlay);
    if (!summary || memory?.id !== id || summary.querySelector('.abx-finish-track')) return;
    const track = decorative(state, 'span', 'abx-finish-track', summary);
    for (let index = 0; index < memory.count; index++) decorative(state, 'i', '', track);
    summary.querySelector('.ab-summary-title')?.after(track);
  }

  function portrait(state, context) {
    if (!context || context.querySelector('[data-ab-portrait], .abx-patient-portrait')) return;
    const id = context.querySelector('[data-ab-case-scene]')?.dataset.abCaseScene;
    const entry = id && window.NQChamberArt?.portraits?.[id];
    if (!entry?.approved || entry.src !== entry.expectedSource || state.failedPortraits.has(id)) return;
    const figure = decorative(state, 'figure', 'abx-patient-portrait', context);
    const unavailable = () => { state.failedPortraits.add(id); figure.remove(); };
    const image = document.createElement('img');
    image.alt = '';
    image.width = entry.width;
    image.height = entry.height;
    image.decoding = 'async';
    figure.hidden = true;
    image.addEventListener('load', () => {
      Promise.resolve().then(() => image.decode?.()).then(() => {
        if (mounted.get(state.overlay) === state && figure.isConnected && image.naturalWidth) figure.hidden = false;
      }).catch(unavailable);
    }, { once: true, signal: state.events.signal });
    image.addEventListener('error', unavailable, { once: true, signal: state.events.signal });
    figure.append(image);
    image.src = entry.src;
  }

  function foldContext(state) {
    const overlay = state.overlay;
    const memory = foldMemories.get(overlay);
    if (overlay.classList.contains('nq-chamber-workspace') ||
        !['act', 'result'].includes(overlay.dataset.abxStage)) {
      if (memory) memory.refocusSummary = false;
      return;
    }
    const context = overlay.querySelector('.ab-context');
    if (!context || context.querySelector('details')) return;
    const nodes = [context.querySelector(':scope > [data-ab-case-scene]'),
      context.querySelector(':scope > .ab-narrative'), context.querySelector(':scope > .ab-gas-grid')].filter(Boolean);
    if (!nodes.length) return;
    const same = memory?.context === context;
    const refocusSummary = same && memory.refocusSummary;
    if (memory) memory.refocusSummary = false;
    const active = document.activeElement;
    const details = document.createElement('details');
    details.className = 'abx-context-fold';
    details.open = same ? memory.open : false;
    const summary = document.createElement('summary');
    summary.textContent = 'História e exames';
    details.append(summary);
    state.owned.add(details);
    nodes.forEach(node => {
      const marker = document.createComment('abx-context');
      node.before(marker);
      details.append(node);
      state.undo.push(() => { if (marker.parentNode) marker.replaceWith(node); });
    });
    context.append(details);
    state.fold = { context, details, summary };
    if (refocusSummary) summary.focus({ preventScroll: true });
    else if (details.open && details.contains(active)) active.focus({ preventScroll: true });
  }

  function reconcile(state) {
    if (mounted.get(state.overlay) !== state || !state.overlay.isConnected) return;
    const overlay = state.overlay;
    const card = overlay.querySelector('.ab-card');
    if (!card) return;
    const stage = overlay.dataset.abTela === 'hub' ? 'catalogue' :
      card.querySelector('.ab-body--intro') ? 'intro' :
      card.querySelector('.ab-summary-view') ? 'result' : 'act';
    mark(state, overlay, 'data-abx-stage', stage);
    if (!card.querySelector(':scope > .abx-atmosphere')) {
      const atmosphere = decorative(state, 'div', 'abx-atmosphere', card);
      decorative(state, 'span', 'abx-atmosphere-light', atmosphere);
      decorative(state, 'span', 'abx-atmosphere-dust', atmosphere);
    }
    world(state, card, stage);
    if (stage === 'intro') portrait(state, card.querySelector('.ab-context'));
    card.querySelectorAll('.ab-progress .ab-dot').forEach((dot, index) => {
      mark(state, dot, 'data-abx-step', String(index + 1).padStart(2, '0'));
    });
    const feedback = card.querySelector('#abFeedback');
    const outcome = feedback?.classList.contains('ok') ? 'correct' : feedback?.classList.contains('err') ? 'review' : 'pending';
    mark(state, overlay, 'data-abx-outcome', outcome);
    chapter(state, card, stage, outcome);
    if (stage === 'catalogue') {
      card.querySelectorAll('.ab-case').forEach(item => {
        if (state.cards.has(item)) return;
        state.cards.add(item);
        state.intersection?.observe(item);
      });
      state.cards.forEach(item => {
        if (!item.isConnected) { state.intersection?.unobserve(item); state.cards.delete(item); }
        else loadCardArt(state, item);
      });
    }
    syncMotion(state);
  }

  function unmount(overlay) {
    const state = overlay && mounted.get(overlay);
    if (!state) return;
    const fold = state.fold;
    const refocusSummary = !!fold && document.activeElement === fold.summary;
    if (fold) foldMemories.set(overlay, {
      context: fold.context, open: fold.details.open, refocusSummary
    });
    mounted.delete(overlay);
    resetDepth(state);
    state.events.abort();
    state.observer.disconnect();
    state.intersection?.disconnect();
    reduced.removeEventListener('change', state.onMotion);
    finePointer.removeEventListener('change', state.onMotion);
    for (let index = state.undo.length - 1; index >= 0; index--) state.undo[index]();
    state.owned.forEach(node => node.remove());
    state.attributes.forEach((attributes, node) => attributes.forEach((value, name) => {
      if (value === null) node.removeAttribute(name);
      else node.setAttribute(name, value);
    }));
    overlay.classList.remove('nq-chamber-expansion');
    // The Workspace may map the removed disclosure control to this native heading.
    return refocusSummary ? fold.context.querySelector('.ab-title') : null;
  }

  function mount(overlay) {
    if (!overlay?.isConnected) return;
    unmount(overlay);
    const state = {
      overlay, events: new AbortController(), owned: new Set(), attributes: new Map(),
      cards: new Set(), failedPortraits: new Set(), undo: [], fold: null,
      queued: false, observer: null, intersection: null, onMotion: null,
      card: null, world: null, worldArt: null, worldSource: '',
      pointerEnabled: false, depthFrame: 0, depthRect: null, depthX: 0, depthY: 0
    };
    mounted.set(overlay, state);
    overlay.classList.add('nq-chamber-expansion');
    state.onMotion = () => syncMotion(state);
    state.observer = new MutationObserver(() => {
      if (state.queued) return;
      state.queued = true;
      queueMicrotask(() => { state.queued = false; reconcile(state); });
    });
    if (typeof IntersectionObserver === 'function') {
      state.intersection = new IntersectionObserver(entries => {
        if (mounted.get(overlay) !== state) return;
        entries.forEach(entry => { if (entry.isIntersecting) loadCardArt(state, entry.target); });
      });
    }
    reconcile(state);
    foldContext(state);
    syncMotion(state);
    state.observer.observe(overlay, { subtree: true, childList: true, attributes: true,
      attributeFilter: ['class', 'hidden', 'inert', 'open', 'src', 'data-motion', 'data-ab-motion-paused'] });
    document.addEventListener('visibilitychange', state.onMotion, { signal: state.events.signal });
    window.addEventListener('scroll', () => {
      state.depthRect = null;
      if (!state.intersection) state.cards.forEach(item => loadCardArt(state, item));
    }, { passive: true, signal: state.events.signal });
    overlay.addEventListener('pointermove', event => pointerDepth(state, event), { passive: true, signal: state.events.signal });
    overlay.addEventListener('pointerleave', () => resetDepth(state), { passive: true, signal: state.events.signal });
    window.addEventListener('resize', () => resetDepth(state), { passive: true, signal: state.events.signal });
    reduced.addEventListener('change', state.onMotion);
    finePointer.addEventListener('change', state.onMotion);
  }

  window.NQChamberExpansion = Object.freeze({ mount, unmount });
}());
