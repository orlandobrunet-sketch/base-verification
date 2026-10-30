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
      const reveal = () => {
        if (!figure.isConnected) return;
        if (!image.naturalWidth || !image.naturalHeight) { remove(); return; }
        figure.hidden = false;
        heading?.classList.add('has-portrait');
      };
      image.addEventListener('load', reveal, { once: true });
      image.addEventListener('error', remove, { once: true });
      if (image.complete) { image.naturalWidth ? reveal() : remove(); }
    });
  }

  window.NQChamberArt = Object.freeze({ portraits, portraitHTML, hydrate });
})();
