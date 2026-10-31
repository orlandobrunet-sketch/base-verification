/* Shared reliquary frame for the film players. Decorative only. */
(function () {
  'use strict';
  function reliquaryMarkup(){
    // Decorative metalwork sits below the opaque 16:9 aperture.
    const corner='<svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" focusable="false"><path class="nq-battle-intro__plate" d="M3 3H66L70 7V16H23L16 23V70H7L3 66Z"/><path class="nq-battle-intro__carving" d="M8 8H61M8 8V61M12 16H17L23 10H47M16 12V17L10 23V47"/><path class="nq-battle-intro__edge" d="M26 4H62L67 9M4 26V62L9 67M28 14H54M14 28V54"/><path class="nq-battle-intro__etch" d="m33 7 3 3 3-3m7 0 3 3 3-3M7 33l3 3-3 3m0 7 3 3-3 3"/><path class="nq-battle-intro__gem" d="m13 7 6 6-6 6-6-6Z"/><path class="nq-battle-intro__gem-cut" d="m13 9 4 4-4 4-4-4Z"/></svg>';
    const corners=['nw','ne','se','sw'].map(position=>'<span class="nq-battle-intro__corner nq-battle-intro__corner--'+position+'">'+corner+'</span>').join('');
    const crest='<svg class="nq-battle-intro__crest" viewBox="0 0 80 56" width="72" height="50" aria-hidden="true" focusable="false"><path class="nq-battle-intro__crest-metal" d="m4 24 17-9L40 2l19 13 17 9-10 18-26 12-26-12Z"/><path class="nq-battle-intro__crest-edge" d="m10 25 15-7L40 7l15 11 15 7-8 13-22 10-22-10Z"/><path class="nq-battle-intro__crest-engraving" d="M17 25h8m30 0h8M23 37l7-4m20 0 7 4M40 8v6"/><path class="nq-battle-intro__renal" d="M45 15c9-1 14 7 11 15-2 8-9 14-17 12-6-1-10-7-7-12 2-3 7-2 8-6 1-3-1-7 5-9Z"/><path class="nq-battle-intro__renal-line" d="M46 19c5 1 8 6 6 11-1 5-5 8-10 8m-1-16c3 2 5 4 7 5m-9 2 9 2m-10 4 7-3"/></svg>';
    return '<div class="nq-battle-intro__reliquary" aria-hidden="true">'+corners+crest+'</div>';
  }
  window.NQBattleIntro={frameMarkup:reliquaryMarkup};
})();
