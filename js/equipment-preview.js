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
  // Masters originais só são solicitados ao abrir a inspeção e quando a
  // densidade da tela exige mais pixels que a miniatura de 384px oferece.
  // As fontes são opacas. Estes limites medidos incluem a silhueta e o brilho
  // (diferença RGB > 16 do fundo), não só o corpo da peça. O enquadro ocupa até
  // 92% da moldura real, mantém o aspecto e limita a ampliação a 1,35x.
  // [x, y, largura, altura, tamanho da fonte]; nomes são só metadados visuais.
  const artBounds = {
    'amuleto_rim.png': [64, 26, 250, 314, 384],
    'anel_albuminurico.png': [61, 83, 262, 216, 384],
    'armadura_homeostase_perfeita_female.png': [117, 15, 150, 359, 384],
    'armadura_homeostase_perfeita.png': [51, 61, 282, 277, 384],
    'armadura_primeva_female.png': [72, 22, 240, 340, 384],
    'armadura_primeva.png': [62, 26, 260, 334, 384],
    'avental_protetor_female.png': [123, 16, 138, 352, 384],
    'avental_protetor.png': [115, 21, 155, 341, 384],
    'bisturi_plantao.png': [180, 38, 24, 308, 384],
    'botas_caminho_saudavel.png': [55, 40, 301, 287, 384],
    'botas_pressao_controlada.png': [48, 36, 307, 319, 384],
    'cetro_nefron.png': [140, 22, 105, 345, 384],
    'egide_dialitica_female.png': [68, 26, 248, 331, 384],
    'egide_dialitica.png': [28, 20, 329, 348, 384],
    'elmo_filtrador_supremo.png': [49, 12, 286, 359, 384],
    'espada_nefroprotetora.png': [137, 23, 109, 341, 384],
    'estetoscopio_basico.png': [67, 32, 249, 319, 384],
    'estilete_tubular.png': [159, 32, 66, 318, 384],
    'excalibur_nefron.png': [145, 23, 94, 342, 384],
    'galocha_cti.png': [29, 51, 327, 286, 384],
    'gorro_cti.png': [48, 46, 287, 292, 384],
    'jaleco_plantao_female.png': [71, 28, 243, 328, 384],
    'jaleco_plantao.png': [62, 26, 260, 332, 384],
    'lamina_alca.png': [159, 16, 68, 352, 384],
    'lanca_glomerular.png': [152, 15, 80, 355, 384],
    'luva_esteril_cirurgia.png': [25, 53, 335, 277, 384],
    'luvas_latex_reforcadas.png': [38, 51, 308, 280, 384],
    'luvas_nitrilicas.png': [61, 56, 263, 267, 384],
    'manopla_dialise.png': [34, 29, 316, 329, 384],
    'manopla_homeostase.png': [40, 28, 303, 332, 384],
    'manto_renocortical_female.png': [99, 19, 186, 347, 384],
    'manto_renocortical.png': [77, 14, 230, 354, 384],
    'mascara_n95.png': [1, 0, 382, 383, 384],
    'mascara_tripla.png': [22, 70, 340, 254, 384],
    'orbe_cistatina.png': [85, 49, 213, 291, 384],
    'prancheta_clinica.png': [72, 21, 240, 332, 384],
    'propes_descartaveis.png': [35, 70, 314, 252, 384],
    'reliquia_titulo.png': [37, 37, 314, 305, 384],
    'sigilo_kdigo.png': [27, 24, 333, 333, 384],
    'tamanco_hospitalar.png': [43, 83, 298, 226, 384],
    'termometro_digital.png': [31, 26, 305, 333, 384],
    'touca_plissada.png': [31, 48, 322, 284, 384],
    'viseira_facial.png': [48, 45, 281, 290, 384],
    'starter/aqua_armor.png': [249, 118, 525, 789, 1024],
    'starter/aqua_boot.png': [74, 214, 878, 616, 1024],
    'starter/aqua_glove.png': [105, 153, 827, 721, 1024],
    'starter/aqua_helmet.png': [120, 188, 783, 569, 1024],
    'starter/aqua_relic.png': [255, 151, 499, 717, 1024],
    'starter/aqua_weapon.png': [421, 44, 183, 935, 1024],
    'starter/glom_armor.png': [199, 66, 610, 893, 1024],
    'starter/glom_boot.png': [100, 225, 824, 568, 1024],
    'starter/glom_glove.png': [81, 113, 862, 796, 1024],
    'starter/glom_helmet.png': [90, 294, 847, 433, 1024],
    'starter/glom_relic.png': [163, 250, 703, 541, 1024],
    'starter/glom_weapon.png': [471, 91, 87, 843, 1024],
    'starter/neph_armor.png': [292, 85, 440, 854, 1024],
    'starter/neph_boot.png': [110, 110, 805, 795, 1024],
    'starter/neph_glove.png': [122, 191, 780, 643, 1024],
    'starter/neph_helmet.png': [135, 105, 752, 815, 1024],
    'starter/neph_relic.png': [191, 130, 648, 767, 1024],
    'starter/neph_weapon.png': [359, 76, 305, 872, 1024]
  };
  const detailImages = Object.fromEntries(Object.keys(artBounds)
    .filter(name => !name.startsWith('starter/'))
    .map(name => ['/assets/items/' + name, 'assets/items/detail/' + name.replace(/\.png$/, '-1024.png')]));
  let anchor = null, pinned = false, timer = 0, suppressFocus = null, dismissed = null, focusOwner = null, touchFocusSlot = null;
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
  function frameImage(img) {
    const url = safeImage(img.getAttribute('src'));
    const name = url ? new URL(url).pathname.replace(/^\/assets\/items\//, '') : '';
    const bounds = artBounds[name], frame = img.parentElement;
    if (!bounds || !frame) return;
    const style = getComputedStyle(frame);
    // O preview ainda oculto tem largura CSS definida; medir antes de definir
    // srcset evita uma primeira solicitação com o sizes padrão de 100vw.
    const cssWidth = parseFloat(style.width) - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
    const width = frame.clientWidth || cssWidth;
    const height = frame.clientHeight || width;
    if (!(width > 0 && height > 0)) return;
    const [x, y, w, h, sourceSize] = bounds, base = Math.min(width, height);
    // As alças da N95 chegam à borda: ela conserva o respiro próprio em CSS.
    const scale = name === 'mascara_n95.png' ? 1
      : Math.min(1.35, .92 * width * sourceSize / (base * w), .92 * height * sourceSize / (base * h));
    const offsetX = name === 'mascara_n95.png' ? 0 : (.5 - (x + w / 2) / sourceSize) * base * scale;
    const offsetY = name === 'mascara_n95.png' ? 0 : (.5 - (y + h / 2) / sourceSize) * base * scale;
    img.style.setProperty('--nqe-art-scale', scale.toFixed(4));
    img.style.setProperty('--nqe-art-x', offsetX.toFixed(3) + 'px');
    img.style.setProperty('--nqe-art-y', offsetY.toFixed(3) + 'px');
    if (frame === art && img.hasAttribute('srcset')) {
      // A densidade precisa cobrir o bitmap ampliado, não só o quadro de 160px.
      img.sizes = Math.ceil(width * scale) + 'px';
    }
    return Math.ceil(width * scale);
  }
  const artFrames = new Set();
  const artResizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(records => {
    for (const { target } of records) {
      const img = target.querySelector('img');
      if (img) frameImage(img);
    }
  });
  function observeArt(frame) {
    if (artResizeObserver && !artFrames.has(frame)) {
      artFrames.add(frame);
      artResizeObserver.observe(frame);
    }
  }
  observeArt(art);
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
    const a = anchor.getBoundingClientRect();
    let p = panel.getBoundingClientRect();
    const fitsRight = a.right + gap + p.width <= v.left + v.width - margin;
    const fitsLeft = a.left - gap - p.width >= v.left + margin;
    // O hover/foco deixa o slot livre para o clique que fixa os detalhes.
    // Em telas estreitas, o conteúdo rola acima ou abaixo do equipamento.
    let above = null;
    if (!pinned && !fitsRight && !fitsLeft) {
      const roomAbove = Math.max(0, a.top - v.top - margin - gap);
      const roomBelow = Math.max(0, v.top + v.height - margin - a.bottom - gap);
      above = roomAbove >= roomBelow;
      panel.style.maxHeight = Math.max(80, above ? roomAbove : roomBelow) + 'px';
      p = panel.getBoundingClientRect();
    }
    let left = a.right + gap;
    if (left + p.width > v.left + v.width - margin) left = a.left - p.width - gap;
    if (left < v.left + margin) left = a.left + (a.width - p.width) / 2;
    left = Math.max(v.left + margin, Math.min(left, v.left + v.width - p.width - margin));
    let top = above === null ? a.top + (a.height - p.height) / 2
      : above ? a.top - p.height - gap : a.bottom + gap;
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
      img.addEventListener('error', () => {
        if (!art.contains(img)) return;
        if (img.hasAttribute('srcset')) {
          img.removeAttribute('srcset');
          img.removeAttribute('sizes');
          img.src = url;
        } else fallback();
      });
      img.addEventListener('load', () => { if (art.contains(img)) position(); }, { once: true });
      const detailUrl = safeImage(detailImages[new URL(url).pathname]);
      img.src = url;
      art.append(img);
      const bitmapWidth = frameImage(img);
      if (detailUrl) {
        img.sizes = bitmapWidth ? bitmapWidth + 'px' : '(max-height: 520px) 112px, (max-width: 400px) 144px, 160px';
        img.srcset = url + ' 384w, ' + detailUrl + ' 1024w';
      }
    } else fallback();
    document.querySelectorAll('.item-tooltip, .stat-tip-floating').forEach(el => { el.style.display = 'none'; });
    panel.hidden = false;
    const image = art.querySelector('img');
    if (image) frameImage(image);
    panel.scrollTop = 0;
    position();
  }
  function decorate() {
    for (const frame of artFrames) {
      if (!frame.isConnected) {
        artResizeObserver.unobserve(frame);
        artFrames.delete(frame);
      }
    }
    scope.querySelectorAll(selector).forEach(slot => {
      const source = sourceOf(slot);
      if (!source) return;
      if (source instanceof HTMLImageElement) {
        frameImage(source);
        observeArt(source.parentElement);
      }
      source.classList.remove('item-with-tooltip');
      slot.setAttribute('role', 'button');
      slot.setAttribute('aria-label', (source.getAttribute('data-slot-label') || 'Equipamento') + ': ' +
        (source.getAttribute('data-item-name') || '') + '. Ver detalhes');
      slot.setAttribute('aria-haspopup', 'dialog');
      slot.setAttribute('aria-controls', panel.id);
      if (!slot.hasAttribute('aria-expanded')) slot.setAttribute('aria-expanded', 'false');
    });
    if (dismissed && !Array.from(scope.querySelectorAll(selector)).some(slot => itemKey(slot) === dismissed)) dismissed = null;
    if (anchor && !allowed(anchor)) hide(false, true);
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
    const previousSlot = e.relatedTarget instanceof Element ? e.relatedTarget.closest(selector) : null;
    if (slot && dismissed === itemKey(slot) && e.relatedTarget instanceof Node &&
        itemKey(previousSlot) !== dismissed && !panel.contains(e.relatedTarget)) dismissed = null;
    if (e.target instanceof Element && e.target.closest('.stat-badge') && anchor) hide(false, true);
    if (slot && (!pinned || anchor === slot)) show(slot);
    if (panel.contains(e.target)) window.clearTimeout(timer);
  });
  document.addEventListener('pointerout', e => {
    const slot = slotFrom(e.target);
    if (slot && slot.isConnected && itemKey(slot) === dismissed && itemKey(slotFrom(e.relatedTarget)) !== dismissed) dismissed = null;
    if (slot || panel.contains(e.target)) delayedHide();
  });
  document.addEventListener('focusin', e => {
    const slot = slotFrom(e.target);
    if (slot) focusOwner = slot;
    else if (!panel.contains(e.target)) focusOwner = null;
    if (slot === suppressFocus) { suppressFocus = null; return; }
    suppressFocus = null;
    // O toque abre diretamente o diálogo no click compatível, sem um hover
    // transitório aparecer entre pointerdown e click.
    if (slot && slot === touchFocusSlot) { touchFocusSlot = null; return; }
    if (slot) show(slot);
    else if (anchor && !panel.contains(e.target)) hide();
  });
  document.addEventListener('focusout', e => {
    const slot = slotFrom(e.target);
    // Ao substituir o HUD, focusout tem relatedTarget=null. O descarte por
    // Escape pertence ao item, e continua válido no novo nó do mesmo slot.
    if (slot && slot.isConnected && e.relatedTarget instanceof Node && itemKey(slot) === dismissed &&
        itemKey(slotFrom(e.relatedTarget)) !== dismissed && !panel.contains(e.relatedTarget)) dismissed = null;
    if (slot && e.relatedTarget && !slot.contains(e.relatedTarget) && !panel.contains(e.relatedTarget)) focusOwner = null;
    if (slot || panel.contains(e.target)) {
      if (!pinned && !slotFrom(e.relatedTarget) && !panel.contains(e.relatedTarget)) hide();
    }
  });
  document.addEventListener('click', e => {
    touchFocusSlot = null;
    const slot = slotFrom(e.target);
    if (!slot) return;
    e.preventDefault();
    e.stopPropagation();
    if (anchor === slot && pinned) hide(false, true);
    else show(slot, true);
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && anchor) {
      const target = e.target;
      const previewOwnsEscape = !(target instanceof Element) ||
        target === document.body || target === document.documentElement ||
        anchor.contains(target) || panel.contains(target);
      if (previewOwnsEscape) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
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
    touchFocusSlot = e.pointerType === 'touch' ? slotFrom(e.target) : null;
    if (anchor && !panel.contains(e.target) && !slotFrom(e.target)) hide();
  }, true);
  document.addEventListener('pointercancel', () => { touchFocusSlot = null; }, true);
  closeButton.addEventListener('click', () => hide(true, true));
  document.addEventListener('nq:hud-preview-opening', e => {
    if (e.detail && e.detail.kind === 'stat') hide(false, true);
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
  // Fontes carregadas e ampliação de texto também podem mudar a altura do
  // portal sem resize da janela. A posição usa sempre o tamanho atual.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => { if (anchor && !panel.hidden) position(); }).observe(panel);
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
