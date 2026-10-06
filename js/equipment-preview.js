/* NefroQuest — inspeção de equipamento. Lê o HUD; não modifica o estado do jogo. */
(() => {
  'use strict';
  const scope = document.getElementById('equipList');
  if (!scope) return;
  const selector = '.slot-diablo[data-slot]';
  const rarityMeta = {
    common: ['Comum', '#b7cadc'], rare: ['Raro', '#89c8d1'],
    epic: ['Épico', '#bab2ed'], legendary: ['Lendário', '#f0dba8'], mythic: ['Mítico', '#edf2ff']
  };
  let anchor = null, pinned = false, timer = 0, suppressFocus = null, dismissed = null, focusOwner = null;
  const panel = document.createElement('section');
  panel.id = 'nqEquipmentPreview';
  panel.className = 'nqe-preview';
  panel.hidden = true;
  panel.setAttribute('role', 'tooltip');
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const header = make('header', 'nqe-preview-header');
  const slotLabel = make('div', 'nqe-preview-slot');
  const title = make('h3', 'nqe-preview-title');
  title.id = 'nqEquipmentPreviewTitle';
  const rarity = make('span', 'nqe-preview-rarity');
  const closeButton = make('button', 'nqe-preview-close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Fechar detalhes do equipamento');
  closeButton.hidden = true;
  header.append(slotLabel, title, rarity, closeButton);
  const art = make('div', 'nqe-preview-art');
  const stats = make('dl', 'nqe-preview-stats');
  const values = {};
  for (const [key, label] of [['atk', 'Ataque'], ['def', 'Defesa'], ['kno', 'Conhec.'], ['luck', 'Sorte']]) {
    const row = make('div', 'nqe-preview-stat');
    const value = make('dd', '', '0');
    values[key] = value;
    row.append(make('dt', '', label), value);
    stats.append(row);
  }
  const desc = make('p', 'nqe-preview-desc');
  panel.append(header, art, stats, desc);
  document.body.append(panel);

  function slotFrom(target) {
    if (!(target instanceof Element)) return null;
    const slot = target.closest(selector);
    // Controles explícitos futuros conservam o próprio fluxo de ação.
    const control = target.closest('button, a[href], [data-action]');
    if (slot && control && control !== slot && slot.contains(control)) return null;
    return slot && scope.contains(slot) ? slot : null;
  }
  function sourceOf(slot) { return slot && slot.querySelector('[data-item-name]'); }
  function itemKey(slot) {
    const source = sourceOf(slot);
    return slot && source ? slot.dataset.slot + '|' + source.getAttribute('data-item-name') : '';
  }
  function allowed(slot) {
    if (!slot || !slot.isConnected || !sourceOf(slot) || !slot.getClientRects().length ||
        slot.closest('[hidden], .hidden, [inert]') || document.body.classList.contains('boss-stun-active')) return false;
    const blockers = [
      '[aria-modal="true"]', '.modal', '.modalWrap', '.auth-modal-overlay',
      '.chest-modal', '.game-modes-overlay', '.study-mode-popup', '.forge-popup',
      '.narrative-popup', '.nqnarr-overlay', '.nq-overlay', '.identity-overlay',
      '#charIntroOverlay', '#arquiQ9Popup', '.profile-popup.open',
      '.profile-popup[aria-hidden="false"]', '.nq-audio-panel', '.equip-stun-overlay'
    ].join(', ');
    const modalOpen = Array.from(document.querySelectorAll(blockers)).some(el => {
      if (el === panel || panel.contains(el) || !el.isConnected ||
          el.closest('[hidden], .hidden, [aria-hidden="true"]') || !el.getClientRects().length) return false;
      for (let node = el; node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' ||
            style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
      }
      const rect = el.getBoundingClientRect(), v = viewport();
      return rect.width > 0 && rect.height > 0 && rect.right > v.left &&
        rect.left < v.left + v.width && rect.bottom > v.top && rect.top < v.top + v.height;
    });
    if (modalOpen) return false;
    const drawer = slot.closest('.panel.left');
    if (drawer && window.matchMedia('(max-width: 768px)').matches && !drawer.classList.contains('mobile-open')) return false;
    const a = slot.getBoundingClientRect(), v = viewport();
    return a.right > v.left && a.left < v.left + v.width && a.bottom > v.top && a.top < v.top + v.height;
  }
  function safeImage(value) {
    if (!value) return '';
    try {
      const url = new URL(value, document.baseURI);
      return url.origin === location.origin &&
        /^\/assets\/(?:items|images)\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|avif)$/i.test(url.pathname)
        ? url.href : '';
    } catch { return ''; }
  }
  function statValue(source, key, starter) {
    const value = source.getAttribute('data-item-' + key);
    return starter ? '0' : (value && /^-?\d+(?:\.\d+)?$/.test(value) ? value : '—');
  }
  function viewport() {
    const v = window.visualViewport;
    return { left: v ? v.offsetLeft : 0, top: v ? v.offsetTop : 0,
      width: v ? v.width : window.innerWidth, height: v ? v.height : window.innerHeight };
  }
  function position() {
    if (!allowed(anchor)) { hide(); return; }
    const v = viewport(), margin = 12, gap = 12;
    panel.style.maxWidth = Math.max(80, v.width - margin * 2) + 'px';
    panel.style.maxHeight = Math.max(80, v.height - margin * 2) + 'px';
    const a = anchor.getBoundingClientRect(), p = panel.getBoundingClientRect();
    let left = a.right + gap;
    if (left + p.width > v.left + v.width - margin) left = a.left - p.width - gap;
    if (left < v.left + margin) left = a.left + (a.width - p.width) / 2;
    left = Math.max(v.left + margin, Math.min(left, v.left + v.width - p.width - margin));
    let top = a.top + (a.height - p.height) / 2;
    top = Math.max(v.top + margin, Math.min(top, v.top + v.height - p.height - margin));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }
  function hide(restoreFocus = false, dismiss = false) {
    window.clearTimeout(timer);
    if (!anchor) return;
    const previous = anchor;
    if (dismiss) dismissed = itemKey(previous);
    const focusWasInside = panel.contains(document.activeElement);
    const anchorLostFocus = focusOwner === previous && !previous.isConnected && document.activeElement === document.body;
    previous.setAttribute('aria-expanded', 'false');
    previous.removeAttribute('aria-describedby');
    anchor = null;
    pinned = false;
    panel.hidden = true;
    panel.dataset.pinned = 'false';
    if (restoreFocus || focusWasInside || anchorLostFocus) {
      const replacement = Array.from(scope.querySelectorAll(selector))
        .find(slot => slot.dataset.slot === previous.dataset.slot && allowed(slot));
      const safeControl = Array.from(document.querySelectorAll('button:not([disabled]), a[href], [role="button"]'))
        .find(el => !panel.contains(el) && !scope.contains(el) && el.getClientRects().length &&
          !el.closest('[hidden], .hidden, [inert]'));
      const target = allowed(previous) ? previous : replacement || safeControl;
      if (target) {
        suppressFocus = slotFrom(target);
        target.focus({ preventScroll: true });
      }
    }
  }
  function show(slot, pin = false) {
    if (pin) dismissed = null;
    if (!allowed(slot) || (dismissed === itemKey(slot) && !pin)) return;
    document.dispatchEvent(new CustomEvent('nq:hud-preview-opening', { detail: { kind: 'equipment' } }));
    window.clearTimeout(timer);
    if (anchor === slot && !panel.hidden) {
      if (pin && !pinned) {
        pinned = true;
        panel.dataset.pinned = 'true';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-labelledby', title.id);
        closeButton.hidden = false;
        slot.removeAttribute('aria-describedby');
      }
      position();
      return;
    }
    hide();
    const source = sourceOf(slot), starter = slot.classList.contains('starter');
    const meta = rarityMeta[source.getAttribute('data-item-rarity')] || rarityMeta.common;
    anchor = slot;
    pinned = pin;
    slot.setAttribute('aria-expanded', 'true');
    if (!pin) slot.setAttribute('aria-describedby', panel.id);
    panel.dataset.pinned = String(pin);
    panel.setAttribute('role', pin ? 'dialog' : 'tooltip');
    if (pin) panel.setAttribute('aria-labelledby', title.id);
    else panel.removeAttribute('aria-labelledby');
    closeButton.hidden = !pin;
    slotLabel.textContent = source.getAttribute('data-slot-label') || '';
    title.textContent = source.getAttribute('data-item-name') || 'Equipamento';
    rarity.textContent = starter ? 'Inicial · sem bônus' : meta[0];
    panel.style.setProperty('--nqe-rarity', starter ? rarityMeta.common[1] : meta[1]);
    for (const key of Object.keys(values)) values[key].textContent = statValue(source, key, starter);
    const description = source.getAttribute('data-item-desc') || '';
    desc.textContent = starter
      ? 'Equipamento inicial da classe. Este slot ainda não tem bônus de um item forjado.'
      : (description.length > 330 ? description.slice(0, 327).trimEnd() + '…' : description);
    desc.hidden = !desc.textContent;
    art.replaceChildren();
    art.dataset.starter = String(starter);
    const url = safeImage(source.getAttribute('data-item-img') || (source instanceof HTMLImageElement ? source.getAttribute('src') : ''));
    const fallback = () => art.replaceChildren(make('span', 'nqe-preview-fallback', '◇'));
    if (url) {
      const img = make('img');
      img.alt = title.textContent;
      img.decoding = 'async';
      img.addEventListener('error', () => { if (art.contains(img)) fallback(); }, { once: true });
      img.addEventListener('load', () => { if (art.contains(img)) position(); }, { once: true });
      img.src = url;
      art.append(img);
    } else fallback();
    document.querySelectorAll('.item-tooltip, .stat-tip-floating').forEach(el => { el.style.display = 'none'; });
    panel.hidden = false;
    panel.scrollTop = 0;
    position();
  }
  function decorate() {
    scope.querySelectorAll(selector).forEach(slot => {
      const source = sourceOf(slot);
      if (!source) return;
      source.classList.remove('item-with-tooltip');
      slot.setAttribute('role', 'button');
      slot.setAttribute('aria-label', (source.getAttribute('data-slot-label') || 'Equipamento') + ': ' +
        (source.getAttribute('data-item-name') || '') + '. Ver detalhes');
      slot.setAttribute('aria-haspopup', 'dialog');
      slot.setAttribute('aria-controls', panel.id);
      if (!slot.hasAttribute('aria-expanded')) slot.setAttribute('aria-expanded', 'false');
    });
    if (dismissed && !Array.from(scope.querySelectorAll(selector)).some(slot => itemKey(slot) === dismissed)) dismissed = null;
    if (anchor && !allowed(anchor)) hide();
    if (focusOwner && !focusOwner.isConnected && document.activeElement === document.body) {
      const previous = focusOwner;
      const replacement = Array.from(scope.querySelectorAll(selector))
        .find(slot => slot.dataset.slot === previous.dataset.slot && allowed(slot));
      if (replacement) {
        focusOwner = replacement;
        suppressFocus = replacement;
        replacement.focus({ preventScroll: true });
      }
    }
  }
  function delayedHide() {
    window.clearTimeout(timer);
    if (!pinned) timer = window.setTimeout(() => {
      if (anchor && !anchor.matches(':hover') && !panel.matches(':hover') &&
          document.activeElement !== anchor && !panel.contains(document.activeElement)) hide();
    }, 180);
  }
  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    const slot = slotFrom(e.target);
    if (e.target instanceof Element && e.target.closest('.stat-badge') && anchor) hide();
    if (slot && (!pinned || anchor === slot)) show(slot);
    if (panel.contains(e.target)) window.clearTimeout(timer);
  });
  document.addEventListener('pointerout', e => {
    const slot = slotFrom(e.target);
    if (slot && itemKey(slot) === dismissed && itemKey(slotFrom(e.relatedTarget)) !== dismissed) dismissed = null;
    if (slot || panel.contains(e.target)) delayedHide();
  });
  document.addEventListener('focusin', e => {
    const slot = slotFrom(e.target);
    if (slot) focusOwner = slot;
    else if (!panel.contains(e.target)) focusOwner = null;
    if (slot === suppressFocus) { suppressFocus = null; return; }
    suppressFocus = null;
    if (slot) show(slot);
    else if (anchor && !panel.contains(e.target)) hide();
  });
  document.addEventListener('focusout', e => {
    const slot = slotFrom(e.target);
    if (slot && itemKey(slot) === dismissed && itemKey(slotFrom(e.relatedTarget)) !== dismissed && !panel.contains(e.relatedTarget)) dismissed = null;
    if (slot && e.relatedTarget && !slot.contains(e.relatedTarget) && !panel.contains(e.relatedTarget)) focusOwner = null;
    if (slot || panel.contains(e.target)) {
      if (!pinned && !slotFrom(e.relatedTarget) && !panel.contains(e.relatedTarget)) hide();
    }
  });
  document.addEventListener('click', e => {
    const slot = slotFrom(e.target);
    if (!slot) return;
    e.preventDefault();
    e.stopPropagation();
    if (anchor === slot && pinned) hide(false, true);
    else show(slot, true);
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && anchor) {
      e.preventDefault();
      e.stopImmediatePropagation();
      hide(panel.contains(document.activeElement), true);
      return;
    }
    const slot = slotFrom(e.target);
    if (slot && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      show(slot, true);
      if (anchor) closeButton.focus({ preventScroll: true });
    }
  }, true);
  document.addEventListener('pointerdown', e => {
    if (anchor && !panel.contains(e.target) && !slotFrom(e.target)) hide();
  }, true);
  closeButton.addEventListener('click', () => hide(true, true));
  document.addEventListener('nq:hud-preview-opening', e => {
    if (e.detail && e.detail.kind === 'stat') hide();
  });
  for (const event of ['touchstart', 'touchend']) {
    document.addEventListener(event, e => {
      if (slotFrom(e.target) || panel.contains(e.target)) e.stopPropagation();
    }, { capture: true, passive: true });
  }
  document.addEventListener('scroll', e => {
    if (!panel.contains(e.target)) hide();
  }, true);
  window.addEventListener('resize', () => { if (anchor) position(); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => { if (anchor) position(); });
    window.visualViewport.addEventListener('scroll', () => { if (anchor) position(); });
  }
  new MutationObserver(decorate).observe(scope, { childList: true, subtree: true });
  const visibilityObserver = new MutationObserver(records => {
    if (!anchor || records.every(record => record.target === panel || panel.contains(record.target))) return;
    if (!allowed(anchor)) hide();
  });
  for (const node of [document.body, document.getElementById('mainApp'), scope.closest('.panel.left')]) {
    if (node) visibilityObserver.observe(node, { attributes: true, attributeFilter: ['class', 'hidden', 'inert', 'style', 'aria-hidden', 'aria-modal'], childList: node === document.body, subtree: node === document.body });
  }
  decorate();
})();
