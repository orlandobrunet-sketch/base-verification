/* A6 unified native story and film. Native startup is called once;
 * no save/reward/clinical authority is delegated to this file or to media. */
(function () {
  'use strict';
  const fine = matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)');
  const coarse = matchMedia('(any-pointer:coarse)');
  const heroes = new Set(['nephros','aquaria','glomerulus']);
  const chamberInstances = new WeakSet();
  let active = null, inFlight = null, serial = 0, disposed = false, observer = null;
  let nativeStart = null, nativeChamber = null, nativeLore = null, nativeIntro = null;
  let startWrapper = null, chamberWrapper = null, loreWrapper = null, introWrapper = null;
  const stories = new Map();
  const metrics = {automaticOpened:0, manualOpened:0, skipped:0, started:0, failedOpen:0};
  const eligible = () => !disposed && fine.matches && !coarse.matches && !(navigator.maxTouchPoints > 0);
  function owner() { try { return authUser?.id || null; } catch (_) { return null; } }
  function normal() {
    try { return !window.NQPilot?.active && !(typeof isProgressSandbox === 'function' && isProgressSandbox()); }
    catch (_) { return false; }
  }
  function binding() { try { return _captureJourneyBinding(); } catch (_) { return null; } }
  function sameBinding(value) {
    try { return !!value && _matchesJourneyBinding(value) && normal(); } catch (_) { return false; }
  }
  function harvestHero(character) {
    if (typeof nativeIntro !== 'function') return null;
    nativeIntro(character);
    const node = document.getElementById('charIntroOverlay');
    if (!node) return null;
    const story = {paragraphs:[node.querySelector('#nqIntroStory')?.textContent || ''],
      benefitText:node.querySelector('#nqIntroBenefit')?.textContent || '',
      title:node.querySelector('h2')?.textContent || '',
      subtitle:node.querySelector('.nqinicio-subtitle')?.textContent || ''};
    // Disconnect the native focus manager before the single cinema dialog opens.
    node.remove();
    if (!story.paragraphs[0].trim() || !story.benefitText.trim()) return null;
    stories.set(character, story);
    return {story, node};
  }
  function canonicalHeroStory(character) {
    // Manual replay may follow a reload. Read the native authored constants;
    // opening a second native modal merely to read them consumes game RNG.
    try {
      const intro=CHARACTER_INTROS[character], bonus=CHARACTER_INITIAL_BONUS_COPY[character];
      if (!intro || !bonus) return stories.get(character) || null;
      return {paragraphs:[intro.text],
        benefitText:state.difficulty==='hardcore'
          ? 'No modo Hardcore, os bônus de personagem não se aplicam. Este aviso se refere aos bônus iniciais novos. Os atributos originais da classe permanecem.'
          : 'Bônus inicial de classe em novas jornadas em Fácil, Médio e Difícil: '+bonus+' A janela conta acertos e erros.',
        title:characters[character].name,subtitle:characters[character].title};
    } catch (_) { return stories.get(character) || null; }
  }
  function capture(place, character) {
    if (!eligible() || !normal()) return null;
    const config = window.NQ_ENTRY_CINEMA_CONFIG;
    const entry = config?.entries?.[place === 'hero' ? character : 'chamber'];
    const token = binding();
    if (!token || !entry || (place === 'hero' && !heroes.has(character))) return null;
    const overlay = place === 'chamber' ? document.getElementById('acidBaseOverlay') : null;
    let question = null, answered = null, nativeCharacter = null;
    try {
      question = state.current;answered = state.answered;nativeCharacter=state.character;
      if (place === 'hero') {
        if (!state.gameStarted || state.character !== character) return null;
      } else if (!overlay?.isConnected || overlay.dataset.abTela !== 'hub') return null;
    } catch (_) { return null; }
    const story = place === 'chamber'
      ? {paragraphs:[overlay.querySelector('.ab-lead')?.textContent || ''],benefitText:''}
      : canonicalHeroStory(character);
    return {place, character:place === 'hero' ? character : null, token, overlay, story,
      question, answered, nativeCharacter, owner:owner(), entry, preview:config.previewPlaceholders === true,
      descriptor:{owner:owner(),place,character:place === 'hero' ? character : null,
        version:(entry.narrativeVersion || (place === 'hero' ? config.heroVersion : config.chamberVersion))+'-story-v1',domain:'normal'}};
  }
  function contextCurrent(session) {
    if (!session || session.owner !== owner()) return false;
    if (session.preflight && !session.durable) {
      if (!normal()) return false;
      // Native startup guards its own binding until it commits. Its successful
      // commit changes the epoch; recapture only after the native true result.
      if (session.committing) return true;
      try { return sameBinding(session.token) && _lastSelectedCharacter===session.character &&
        window._pendingDiff===session.pendingDifficulty; } catch (_) { return false; }
    }
    if (!sameBinding(session.token)) return false;
    try {
      if (session.place === 'hero') return state.gameStarted && state.character === session.character &&
        state.current === session.question && state.answered === session.answered;
      return session.overlay === document.getElementById('acidBaseOverlay') &&
        session.overlay.isConnected && session.overlay.dataset.abTela === 'hub';
    } catch (_) { return false; }
  }
  const current = session => eligible() && contextCurrent(session);
  function restorationCurrent(session) {
    if (!session || session.owner !== owner() || !sameBinding(session.token)) return false;
    try { return state.character === session.nativeCharacter && state.current === session.question && state.answered === session.answered; }
    catch (_) { return false; }
  }
  function pauseTimer(session) {
    if (active !== session || !current(session)) return;
    const widget = document.getElementById('timerWidget');
    if (widget?.classList.contains('running') && typeof window.timerToggle === 'function') {
      session.restoreTimer = true;
      window.timerToggle();
    }
  }
  function end(session) {
    if (session.ended) return;
    session.ended = true;
    session.timerObserver?.disconnect();
    const valid = restorationCurrent(session);
    if (active === session) active = null;
    if (valid && session.restoreTimer && !document.getElementById('timerWidget')?.classList.contains('running')) {
      try { window.timerToggle?.(); } catch (_) { /* Presentation failure cannot block native game. */ }
    }
    const lore = session.restoreLore;
    if (lore?.node.isConnected && lore.node === document.getElementById('heroLoreModal')) {
      if (session.completedReplay) {
        const focus=document.activeElement,cinema=document.getElementById('nqEntryCinema');
        const restore=valid && (focus===document.body || focus===cinema || cinema?.contains(focus));
        lore.node.remove();
        if (restore) {
          const target=document.querySelector('.portrait-frame[data-action="showHeroLore"]');
          if (target?.getClientRects().length && !target.closest('[hidden],[inert],.hidden')) target.focus({preventScroll:true});
        }
        return;
      }
      if (valid) {
        lore.node.hidden=lore.hidden;lore.node.inert=lore.inert;
        const focus=document.activeElement,cinema=document.getElementById('nqEntryCinema');
        const mayRestore=focus===document.body || focus===cinema || cinema?.contains(focus);
        const competing=[...document.querySelectorAll('dialog[open],[aria-modal="true"],.nq-overlay,#arquiQ9Popup')]
          .some(node => node!==lore.node && !lore.node.contains(node) && node.getClientRects().length &&
            !node.closest('[hidden],[inert]') && getComputedStyle(node).visibility!=='hidden');
        if (mayRestore && !competing) {
          const target=eligible() && lore.focus?.isConnected && lore.node.contains(lore.focus)
            ? lore.focus : lore.node.querySelector('button:not(.nq-entry-replay):not(:disabled)');
          if(target?.getClientRects().length && !target.closest('[hidden],[inert]')) target.focus({preventScroll:true});
        }
      }
      else lore.node.remove();
    }
  }
  function mark(session, reason) {
    if (active !== session || !current(session) || (session.preflight && !session.durable)) return;
    if (reason === 'started') metrics.started++; else metrics.skipped++;
    try { window.NQEntrySeen?.mark(session.descriptor); } catch (_) { /* Never write native progress. */ }
  }
  function watchTimer(session) {
    pauseTimer(session);
    const widget=document.getElementById('timerWidget');
    if (widget && !session.ended && !session.timerObserver) {
      session.timerObserver=new MutationObserver(()=>pauseTimer(session));
      session.timerObserver.observe(widget,{attributes:true,attributeFilter:['class']});
    }
  }
  function commit(session) {
    if (session.durable || !session.preflight) return Promise.resolve(current(session));
    if (session.pendingStart) return session.pendingStart;
    if (active!==session || !current(session)) return Promise.resolve(false);
    session.committing=true;
    let result;
    try { result=nativeStart.call(window); } catch (_) { result=false; }
    const pending=Promise.resolve(result).then(value=>{
      if (active!==session || session.ended || session.owner!==owner() || !eligible() || !normal()) return false;
      if (value!==true) { session.committing=false; return false; }
      const durable=capture('hero',session.character);
      if (!durable) { session.committing=false; return false; }
      Object.assign(session,{token:durable.token,question:durable.question,answered:durable.answered,
        nativeCharacter:durable.nativeCharacter,descriptor:durable.descriptor,durable:true,committing:false});
      watchTimer(session);
      return current(session);
    },()=>{session.committing=false;return false;});
    session.pendingStart=pending;
    pending.finally(()=>{if(session.pendingStart===pending)session.pendingStart=null;});
    return pending;
  }
  function openCaptured(session, manual) {
    if (!session || active || !window.NQEntryCinema || !window.NQEntrySeen) return false;
    if (!manual && !session.preflight && window.NQEntrySeen.has(session.descriptor)) return false;
    if (!session.entry.media?.available && !session.preview) return false;
    session.key = 'entry-' + (++serial);
    session.ended = false; session.restoreTimer = false;
    active = session;
    let opened = false;
    try {
      opened = window.NQEntryCinema.open({key:session.key,kind:session.place,
        title:session.entry.title,subtitle:session.entry.subtitle,manual:!!manual,
        storyParagraphs:session.story?.paragraphs || [],benefitText:session.story?.benefitText || '',artKey:session.place==='chamber'?'chamber':session.character,
        preflight:session.preflight===true,onContinue:()=>commit(session),
        shouldPlay:()=>manual || !window.NQEntrySeen.has(session.descriptor),
        onCancel:()=>{
          if (active!==session || session.durable || session.owner!==owner()) return;
          let ownsSelection=false;
          try { ownsSelection=sameBinding(session.token) && _lastSelectedCharacter===session.character &&
            window._pendingDiff===session.pendingDifficulty; } catch (_) { /* Context owns cleanup. */ }
          if (ownsSelection) window.cancelCharacterIntro?.();
          end(session);
        },
        media:session.entry.media,isCurrent:() => current(session),
        onStarted:() => mark(session,'started'),onSkip:() => mark(session,'skip'),
        onDone:()=>{session.completedReplay=!!manual;end(session);}}) === true;
    } catch (_) { opened = false; }
    if (!opened) { metrics.failedOpen++; end(session); return false; }
    if (manual) metrics.manualOpened++; else metrics.automaticOpened++;
    if (!session.preflight || session.durable) watchTimer(session);
    return true;
  }
  function openPreflight(character) {
    if (!eligible() || !normal() || active || !heroes.has(character)) return false;
    const entry=window.NQ_ENTRY_CINEMA_CONFIG?.entries?.[character];
    if (!entry) return false;
    const token=binding(), ownerAtOpen=owner(), focus=document.activeElement;
    let pendingDifficulty;
    try { pendingDifficulty=window._pendingDiff; } catch (_) { return false; }
    const harvested=harvestHero(character);
    if (!harvested) return false;
    const session={place:'hero',character,token,owner:ownerAtOpen,pendingDifficulty,entry,
      story:harvested.story,preflight:true,durable:false,committing:false,focus,
      preview:false,descriptor:{owner:ownerAtOpen,place:'hero',character,
        version:entry.narrativeVersion+'-story-v1',domain:'normal'}};
    const opened=openCaptured(session,false);
    if (!opened && !document.getElementById('charIntroOverlay') && current(session)) {
      document.body.appendChild(harvested.node);
      harvested.node.querySelector('[data-action="closeIntroAndStart"]')?.focus();
    }
    return opened;
  }
  function replayHero() {
    if (!eligible() || active || !window.NQEntryCinema || !window.NQEntrySeen) return false;
    let hero; try { hero = state.character; } catch (_) { return false; }
    const session = capture('hero',hero); if (!session) return false;
    const lore = document.getElementById('heroLoreModal');
    if (lore) {
      session.restoreLore = {node:lore,hidden:lore.hidden,inert:lore.inert,focus:document.activeElement};
      lore.hidden = true;lore.inert = true;
    }
    session.story=canonicalHeroStory(hero);
    const opened = openCaptured(session,true);
    if (!opened && !session.ended && session.restoreLore) {
      lore.hidden=session.restoreLore.hidden;lore.inert=session.restoreLore.inert;
    }
    return opened;
  }
  function replayChamber() { return openCaptured(capture('chamber',null),true); }
  function addButton(parent, action, label) {
    if (!eligible() || !parent || parent.querySelector('[data-entry-replay="'+action+'"]')) return;
    const button = document.createElement('button');button.type = 'button';
    button.className = 'nq-entry-replay';button.dataset.entryReplay = action;button.textContent = label;
    button.addEventListener('click', event => {event.preventDefault();event.stopPropagation();
      if (action === 'hero') replayHero(); else replayChamber();});
    parent.appendChild(button);
  }
  function syncControls() {
    if (!eligible()) {
      document.querySelectorAll('.nq-entry-replay').forEach(node => node.remove());
      return;
    }
    if (!normal()) return;
    addButton(document.querySelector('#heroLoreModal .nqnarr-footer'),'hero','Rever introdução');
    const chamber = document.getElementById('acidBaseOverlay');
    if (chamber?.dataset.abTela === 'hub') addButton(chamber.querySelector('.ab-hub'),'chamber','Rever introdução');
  }
  function guard() {
    if (active && (!current(active) || !window.NQEntryCinema?.inspection.open)) {
      const session=active;window.NQEntryCinema?.cancelContext();end(session);
    }
    syncControls();
  }
  function install() {
    if (disposed) return;
    nativeStart = window.startGameWithCharacter;
    nativeIntro=window.showCharacterIntroModal;
    if (typeof nativeIntro==='function') {
      introWrapper=function(character){
        // Native explicit confirmation remains authoritative before cinema.
        if (document.getElementById('charIntroOverlay')) return;
        const result=nativeIntro.apply(this,arguments);
        if(eligible()&&normal()){
          const modal=document.getElementById('charIntroOverlay'),story=modal?.querySelector('#nqIntroStory');
          if(modal&&story){modal.classList.add('nq-movie-confirm');const details=document.createElement('details'),summary=document.createElement('summary');details.className='nq-entry-full-lore';summary.textContent='Ler história completa';story.before(details);details.append(summary,story);}
        }return result;
      };
      window.showCharacterIntroModal=introWrapper;
    }
    if (typeof nativeStart === 'function') {
      startWrapper = function () {
        if (active?.preflight && !active.durable) return commit(active);
        if (inFlight) return inFlight;
        const beforeOwner = owner();
        let result;try { result = nativeStart.apply(this,arguments); } catch (error) { throw error; }
        const pending = Promise.resolve(result).then(value => {
          if (value === true && beforeOwner === owner() && eligible() && normal()) {
            guard();
            let hero;try { hero = state.character; } catch (_) { hero = null; }
            const session=capture('hero',hero);
            if (session?.story) openCaptured(session,false);
          }
          return value;
        });
        inFlight = pending;
        pending.then(() => {if (inFlight === pending) inFlight = null;},() => {if (inFlight === pending) inFlight = null;});
        return pending;
      };
      window.startGameWithCharacter = startWrapper;
    }
    nativeChamber = window.showAcidBaseMinigame;
    if (typeof nativeChamber === 'function') {
      chamberWrapper = function () {
        const previous=document.getElementById('acidBaseOverlay');
        const internalReturn=!!previous?.isConnected && (!window.NQPilot || window.NQPilot.matchesBinding(previous._abBinding));
        const result = nativeChamber.apply(this,arguments);
        const overlay = document.getElementById('acidBaseOverlay');
        syncControls();
        if (eligible() && normal() && overlay && !internalReturn && !chamberInstances.has(overlay)) {
          chamberInstances.add(overlay);
          openCaptured(capture('chamber',null),false);
        }
        return result;
      };
      window.showAcidBaseMinigame = chamberWrapper;
    }
    nativeLore = window.showHeroLore;
    if (typeof nativeLore === 'function') {
      loreWrapper = function () {const result=nativeLore.apply(this,arguments);if(eligible()&&normal()){const modal=document.getElementById('heroLoreModal'),body=modal?.querySelector('[role="region"]');let hero;try{hero=state.character;}catch(_){}const story=canonicalHeroStory(hero);if(body&&story&&!body.querySelector('.nq-entry-full-lore')){const details=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');details.className='nq-entry-full-lore';summary.textContent='Início da jornada — história completa';p.textContent=story.paragraphs.join('\n\n');details.append(summary,p);body.append(details);}}syncControls();return result;};
      window.showHeroLore = loreWrapper;
    }
    observer = new MutationObserver(guard);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,
      attributeFilter:['class','hidden','inert','open','data-ab-tela']});
    fine.addEventListener('change',guard);coarse.addEventListener('change',guard);
    window.NQPilot?.onContextChange(guard);
    window.addEventListener('pagehide',dispose,{once:true});
    window.addEventListener('storage',guard);
    syncControls();
  }
  function dispose() {
    if (disposed) return;
    if (active) {const session=active;window.NQEntryCinema?.cancelContext();end(session);}
    disposed = true;observer?.disconnect();
    fine.removeEventListener('change',guard);coarse.removeEventListener('change',guard);
    window.removeEventListener('storage',guard);
    if (window.startGameWithCharacter === startWrapper) window.startGameWithCharacter=nativeStart;
    if (window.showCharacterIntroModal===introWrapper) window.showCharacterIntroModal=nativeIntro;
    if (window.showAcidBaseMinigame === chamberWrapper) window.showAcidBaseMinigame=nativeChamber;
    if (window.showHeroLore === loreWrapper) window.showHeroLore=nativeLore;
    document.querySelectorAll('.nq-entry-replay').forEach(node => node.remove());
  }
  window.NQEntryBridge=Object.freeze({get inspection(){return {active:active ? {
    place:active.place,character:active.character,key:active.key,preflight:!!active.preflight,
    durable:!!active.durable,committing:!!active.committing}:null,startupPending:!!inFlight||!!active?.pendingStart,
    desktop:eligible(),disposed,...metrics};},replayHero,replayChamber,
    replay:place => place === 'hero' ? replayHero() : place === 'chamber' ? replayChamber() : false,
    dispose});
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}());
