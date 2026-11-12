/* Art belongs to the fictional patient ID, never to the selected player hero.
 * Portraits remain unavailable until their corresponding artwork is approved.
 * To enable one: add its expected file and set src to expectedSource, approved:true.
 */
(function () {
  'use strict';
  const authored = {
    aldric:  { name: 'Ferreiro Aldric',    src: 'assets/chamber/patients/aldric.webp', approved: true },
    mara:    { name: 'Curandeira Mara',    src: 'assets/chamber/patients/mara.webp', approved: true },
    theron:  { name: 'Guarda Theron',      src: 'assets/chamber/patients/theron.webp', approved: true },
    vance:   { name: 'Mercador Vance',     src: 'assets/chamber/patients/vance.webp', approved: true },
    kael:    { name: 'General Kael',       src: 'assets/chamber/patients/kael.webp', approved: true },
    vorgath: { name: 'Alquimista Vorgath', src: 'assets/chamber/patients/vorgath.webp', approved: true },
    selene:  { name: 'Maga Selene',        src: 'assets/chamber/patients/selene.webp', approved: true },
    edrin:   { name: 'Escriba Edrin',      src: 'assets/chamber/patients/edrin.webp', approved: true },
    liora:   { name: 'Sacerdotisa Liora',  src: 'assets/chamber/patients/liora.webp', approved: true },
    borius:  { name: 'Alquimista Borius',   src: 'assets/chamber/patients/borius.webp', approved: true },
    isolde:  { name: 'Flautista Isolde',   src: 'assets/chamber/patients/isolde.webp', approved: true },
    corvin:  { name: 'Nobre Corvin',       src: 'assets/chamber/patients/corvin.webp', approved: true },
    ophelia: { name: 'Herborista Ophelia', src: 'assets/chamber/patients/ophelia.webp', approved: true },
    helena:  { name: 'Sacerdotisa Helena', src: 'assets/chamber/patients/helena.webp', approved: true },
    brann:   { name: 'Viajante Brann',     src: 'assets/chamber/patients/brann.webp', approved: true },
    nara:    { name: 'Guerreira Nara',     src: 'assets/chamber/patients/nara.webp', approved: true },
    galen:   { name: 'Mercador Galen',     src: 'assets/chamber/patients/galen.webp', approved: true },
    maelis:  { name: 'Escudeira Maelis',   src: 'assets/chamber/patients/maelis.webp', approved: true },
    ivar:    { name: 'Gigante Ivar',       src: 'assets/chamber/patients/ivar.webp', approved: true },
    mireth:  { name: 'Sacerdotisa Mireth', src: 'assets/chamber/patients/mireth.webp', approved: true }
  };
  const portraits = Object.freeze(Object.fromEntries(Object.entries(authored).map(([id, entry]) => [
    id, Object.freeze({ ...entry, id, width: 768, height: 960,
      expectedSource: `assets/chamber/patients/${id}.webp` })
  ])));
  const escape = text => String(text).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  function portraitHTML(id) {
    if (!window.matchMedia('(min-width:961px) and (pointer:fine)').matches) return '';
    if (!Object.prototype.hasOwnProperty.call(portraits, id)) return '';
    const entry = portraits[id];
    // No guessed URL, hero fallback, placeholder or network probe for missing art.
    if (!entry.approved || entry.src !== entry.expectedSource) return '';
    return `<figure class="ab-patient-portrait" data-ab-portrait="${id}" hidden>
      <img src="${escape(entry.src)}" alt="Retrato ilustrado de ${escape(entry.name)}"
        width="${entry.width}" height="${entry.height}" decoding="async" loading="eager">
    </figure>`;
  }

  function hydrate(root) {
    root.querySelectorAll('[data-ab-portrait]').forEach(figure => {
      if (figure.dataset.abArtBound) return;
      figure.dataset.abArtBound = 'true';
      const image = figure.querySelector('img');
      const heading = figure.closest('.ab-patient-heading');
      const remove = () => { figure.remove(); heading?.classList.remove('has-portrait'); };
      let decoding = false;
      const reveal = () => {
        if (decoding || !figure.isConnected) return;
        if (!image.naturalWidth || !image.naturalHeight) { remove(); return; }
        decoding = true;
        // A successful fetch is not yet a drawable portrait. Keep identity readable
        // until decoding finishes, including repeated headers between acts.
        Promise.resolve().then(() => typeof image.decode === 'function' ? image.decode() : undefined).then(() => {
          if (!figure.isConnected) return;
          figure.hidden = false;
          heading?.classList.add('has-portrait');
        }).catch(remove);
      };
      image.addEventListener('load', reveal, { once: true });
      image.addEventListener('error', remove, { once: true });
      if (image.complete) { image.naturalWidth ? reveal() : remove(); }
    });
  }


  // Only artwork inspected and present in the release belongs in this registry.
  const approvedScenes = {
    aldric: 'assets/chamber/scenes/aldric.webp',
    mara: 'assets/chamber/scenes/mara.webp',
    theron: 'assets/chamber/scenes/theron.webp',
    edrin: 'assets/chamber/scenes/edrin.webp',
    vance: 'assets/chamber/scenes/vance.webp',
    kael: 'assets/chamber/scenes/kael.webp',
    vorgath: 'assets/chamber/scenes/vorgath.webp',
    selene: 'assets/chamber/scenes/selene.webp',
    liora: 'assets/chamber/scenes/liora.webp',
    borius: 'assets/chamber/scenes/borius.webp',
    isolde: 'assets/chamber/scenes/isolde.webp',
    corvin: 'assets/chamber/scenes/corvin.webp',
    helena: 'assets/chamber/scenes/helena.webp',
    brann: 'assets/chamber/scenes/brann.webp',
    ophelia: 'assets/chamber/scenes/ophelia.webp',
    nara: 'assets/chamber/scenes/nara.webp',
    galen: 'assets/chamber/scenes/galen.webp',
    maelis: 'assets/chamber/scenes/maelis.webp',
    ivar: 'assets/chamber/scenes/ivar.webp',
    mireth: 'assets/chamber/scenes/mireth.webp'
  };
  const chamberScene = 'assets/scenes/chamber-balance-still.webp';
  const scenes = Object.freeze(Object.fromEntries(Object.keys(authored).map(id => [id,
    Object.freeze({ id, src: approvedScenes[id] || null, approved: !!approvedScenes[id] })
  ])));
  function sceneHTML(id) {
    const entry = Object.prototype.hasOwnProperty.call(scenes, id) ? scenes[id] : null;
    const specific = entry?.approved && entry.src === `assets/chamber/scenes/${id}.webp`;
    const source = specific ? entry.src : chamberScene;
    return `<figure class="ab-scene ${id ? 'ab-case-scene' : 'ab-lab'}" data-ab-lab data-motion="paused"${id ? ` data-ab-case-scene="${escape(id)}"` : ''} data-ab-scene-source="${specific ? 'case' : 'chamber'}" aria-hidden="true">
      <img class="ab-scene-image${id ? '' : ' ab-lab-art'}" data-ab-scene-image src="${escape(source)}" alt="" width="1280" height="720" decoding="async">
      <span class="ab-scene-light ab-scene-light--cyan"></span><span class="ab-scene-light ab-scene-light--amber"></span>
    </figure>`;
  }
  function hydrateScenes(root) {
    root.querySelectorAll('[data-ab-scene-image]').forEach(image => {
      if (image.dataset.abSceneBound) return;
      image.dataset.abSceneBound = 'true';
      const scene = image.closest('[data-ab-lab]');
      const unavailable = () => {
        if (!image.isConnected) return;
        if (image.getAttribute('src') !== chamberScene) {
          scene.dataset.abSceneSource = 'chamber'; image.src = chamberScene;
        } else { image.hidden = true; scene.dataset.sceneStatus = 'unavailable'; }
      };
      image.addEventListener('error', unavailable);
      image.addEventListener('load', () => { if (image.isConnected) { image.hidden = false; scene.dataset.sceneStatus = 'ready'; } });
      if (image.complete) image.naturalWidth ? scene.dataset.sceneStatus = 'ready' : unavailable();
    });
  }

  // Presentation only: no clinical values, rewards or progress are animated.
  const motionKey = 'nq-chamber-motion-paused';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = null, motionPaused = false;
  try { motionPaused = localStorage.getItem(motionKey) === 'true'; } catch {}
  function syncMotionControls() {
    const selector = '[data-action="toggleChamberMotion"]';
    const controls = [...document.querySelectorAll(selector),
      ...(document.getElementById('profilePopupItems')?.content.querySelectorAll(selector) || [])];
    controls.forEach(button => {
      button.disabled = reducedMotion.matches;
      button.setAttribute('aria-pressed', String(!motionPaused && !reducedMotion.matches));
      button.title = reducedMotion.matches ? 'Movimento reduzido nas preferências do sistema' : '';
    });
  }
  function toggleMotion() {
    if (reducedMotion.matches) return false;
    motionPaused = !motionPaused;
    try { localStorage.setItem(motionKey, String(motionPaused)); } catch {}
    motion?.update(); syncMotionControls();
    return !motionPaused;
  }
  function unmountMotion() {
    if (!motion) return;
    motion.art.dataset.motion = 'paused';
    motion.abort.abort(); motion.observer.disconnect(); motion = null;
  }
  function mountMotion(overlay) {
    const art = overlay.querySelector('[data-ab-lab]');
    if (motion?.art === art && art?.isConnected) { motion.update(); return; }
    overlay.toggleAttribute('data-ab-motion-paused', motionPaused);
    unmountMotion(); if (!art) return;
    const abort = new AbortController();
    let visible = false;
    const update = () => {
      art.dataset.motion = !motionPaused && !reducedMotion.matches && visible && !document.hidden ? 'running' : 'paused';
      overlay.toggleAttribute('data-ab-motion-paused', motionPaused);
      syncMotionControls();
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
    motion = { art, abort, observer, update };
    document.addEventListener('visibilitychange', update, {signal:abort.signal});
    reducedMotion.addEventListener('change', update, {signal:abort.signal});
    observer.observe(art); update();
  }
  reducedMotion.addEventListener('change', syncMotionControls);
  addEventListener('storage', event => {
    if (event.key !== motionKey && event.key !== null) return;
    try { motionPaused = localStorage.getItem(motionKey) === 'true'; } catch {}
    motion?.update(); syncMotionControls();
  });
  document.addEventListener('DOMContentLoaded', syncMotionControls, {once:true});
  syncMotionControls();
  window.toggleChamberMotion = toggleMotion;
  window.NQChamberMotion = Object.freeze({mount:mountMotion,unmount:unmountMotion});

  window.NQChamberArt = Object.freeze({ portraits, portraitHTML, hydrate, scenes, sceneHTML, hydrateScenes });
})();
