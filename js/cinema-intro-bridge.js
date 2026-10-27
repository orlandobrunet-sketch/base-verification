/* A6 local presentation only. Read the authored native template inertly; never
 * invoke its sound/focus/RNG hooks to build a successful cinematic. Native
 * bossIntroShown, combat, saves, rewards and RNG remain owned by the game. */
(function () {
 'use strict';
 const seen = new Set(), stories = new Map();
 const fine = matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)');
 const coarse = matchMedia('(any-pointer:coarse)');
 let original = null, active = null, serial = 0, observer = null, disposed = false, pending = null, retryTimer = 0;
 const metrics = {authoredStoryParses:0, automaticOpened:0, manualOpened:0, fallbacks:0};
 const eligible = () => !disposed && fine.matches && !coarse.matches && !(navigator.maxTouchPoints > 0);
 function owner() { try { return authUser?.id || null; } catch (_) { return null; } }
 function binding() { try { return _captureJourneyBinding(); } catch (_) { return null; } }
 function matches(token) { try { return !!token && _matchesJourneyBinding(token); } catch (_) { return false; } }
 function liveKey() {
  if (!eligible()) return null;
  try {
   const main = document.getElementById('mainApp');
   if (!main || main.hidden || main.classList.contains('hidden') || !main.getClientRects().length ||
       !state.gameStarted || !isBossBattle() || state.gameOver || state.gameCompleted || state.completedGame ||
       state.correctTotal < 90 || state.correctTotal > 99) return null;
   return String(typeof _progressEpoch === 'undefined' ? 0 : _progressEpoch) + ':' + state.character;
  } catch (_) { return null; }
 }
 function current(session) {
  return !!session && eligible() && session.owner === owner() && matches(session.binding) &&
   session.contextKey === liveKey();
 }
 function announceClosed(session, reason) {
  if (!session || session.announcedClosed) return;
  session.announcedClosed = true;
  document.dispatchEvent(new CustomEvent('nq-battle-intro-closed',
   {detail:{contextKey:session.contextKey, reason}}));
 }
 // Native rewards/narratives may be scheduled by the same accepted answer.
 // Queue only an automatic story that has not started; no native state authority.
 function nativeOverlayOpen() {
  return [...document.querySelectorAll('dialog[open],.nq-overlay,.forge-popup,.equip-compare-overlay,[aria-modal="true"],#arquiQ9Popup')]
   .some(n => !n.hidden && !n.closest('[hidden],[inert]') && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden');
 }
 function scheduleRetry() {
  if (!pending || retryTimer || disposed) return;
  retryTimer = setTimeout(() => {
   retryTimer = 0; const session = pending;
   if (!session || !current(session)) { pending = null; return; }
   if (active || document.hidden || nativeOverlayOpen()) return;
   pending = null;
   if (!open(false) && current(session)) pending = session;
  }, 180);
 }
 function guardContext() {
  const session = active;
  if (session && !current(session)) {
   active = null;
   if (window.NQEntryCinema?.inspection.key === session.key) window.NQEntryCinema.cancelContext();
   announceClosed(session, 'context-changed');
  } else if (session && (!window.NQEntryCinema?.inspection.open || window.NQEntryCinema.inspection.key !== session.key)) {
   active = null;announceClosed(session, 'presentation-closed');
  }
  if (pending && !current(pending)) pending = null;
  scheduleRetry();
 }
 function context() {
  if (!eligible()) return null;
  try {
   window.NQBossArena?.sync();
   const view = window.NQBossArena?.inspection;
   const token = binding(), key = liveKey();
   if (!view?.active || !token || !key || view.contextKey !== key || !Array.isArray(view.allies) ||
       view.allies.length !== 2 || !view.selectedName) return null;
   return {contextKey:key, character:view.character, selectedName:view.selectedName,
    allies:[...view.allies], owner:owner(), binding:token};
  } catch (_) { return null; }
 }
 const text = node => (node?.textContent || '').trim();
 function readNativeStory() {
  if (!original) return null;
  // This candidate is tied to the frozen native authored template. Interpolated
  // game expressions remain inert text; no eval, template execution, live DOM,
  // image request or native function invocation is used for successful opens.
  const source = Function.prototype.toString.call(original);
  const match = /popup\.innerHTML\s*=\s*`([\s\S]*?)`\s*;/.exec(source);
  if (!match || /<\/?template\b/i.test(match[1])) return null;
  const parsed = new DOMParser().parseFromString('<template>' + match[1] + '</template>', 'text/html');
  const root = parsed.querySelector('template')?.content;
  if (!root) return null;
  const paragraphs = [...root.querySelectorAll('#bossIntroArrival .nqboss-story, #bossIntroArrival blockquote p, #bossIntroChallenge .nqboss-story, #bossIntroChallenge .nqboss-destiny')]
   .map(text).filter(Boolean);
  const stats = [...root.querySelectorAll('#bossIntroChallenge .nqboss-stats > div')]
   .map(row => ({label:text(row.querySelector('dt'))}));
  if (paragraphs.length !== 5 || paragraphs.some(paragraph => paragraph.includes('${')) ||
      stats.length !== 3 || stats.some(stat => !stat.label || stat.label.includes('${'))) return null;
  metrics.authoredStoryParses++;
  return {paragraphs, stats};
 }
 function statistics(story) {
  try {
   const values = [String(state.correctTotal), String(state.level), state.score.toLocaleString('pt-BR')];
   return story.stats.map((stat, index) => stat.label + ': ' + values[index]).join(' · ');
  } catch (_) { return null; }
 }
 function open(manual) {
  guardContext();
  const data = context();
  if (!data || !window.NQEntryCinema) return false;
  if (active && current(active)) return active.contextKey === data.contextKey;
  if (!manual && seen.has(data.contextKey)) return true;
  if (!manual && pending && current(pending)) return true;
  const config = window.NQ_BATTLE_INTRO_CONFIG;
  if (!config?.available || !config.approved) return false;
  let story = stories.get(data.contextKey);
  if (!story) {
   try { story = readNativeStory(); } catch (_) { return false; }
   if (!story) return false;
   stories.set(data.contextKey, story);
   while (stories.size > 32) stories.delete(stories.keys().next().value);
  }
  const session = {...data, key:'battle-story-' + (++serial)};
  const storyParagraphs = [...story.paragraphs, 'VOCÊ NÃO ESTÁ SOZINHO', data.selectedName,
   data.allies.join(' e ') + ' unem-se ao confronto.'];
  const benefitText = statistics(story);
  if (benefitText === null) return false;
  active = session;
  let accepted = false;
  try {
   accepted = window.NQEntryCinema.open({key:session.key, kind:'battle', title:'O TRONO DA UREMIA',
    subtitle:'O Arqui-Nefromante aguarda.', storyParagraphs, benefitText, manual:!!manual,
    media:config, isCurrent:() => current(session),
    onStarted:() => {if (active === session && current(session)) seen.add(session.contextKey);},
    onSkip:() => {if (active === session && current(session)) seen.add(session.contextKey);},
    onDone:detail => {
     if (active === session) active = null;
     if (!manual && !detail?.started && detail?.reason === 'interrupted' && current(session)) {pending = session;scheduleRetry();}
     announceClosed(session, detail?.reason || 'closed');
    }}) === true;
  } catch (_) { accepted = false; }
  if (!accepted) {
   if (active === session) active = null;
   return false;
  }
  if (manual) metrics.manualOpened++; else metrics.automaticOpened++;
  return true;
 }
 function openManual() {
  if (!context()) return false;
  if (open(true)) return true;
  if (!original) return false;
  // Successful initial/replayed cinema has no native side effects. Only a presentation
  // failure falls back to the original usable story rather than a dead control.
  try { original();metrics.fallbacks++;return true; } catch (_) { return false; }
 }
 function start() {
  original = typeof window.showBossIntroPopup === 'function' ? window.showBossIntroPopup : null;
  if (original) window.showBossIntroPopup = function () {
   if (!open(false)) {metrics.fallbacks++;return original.apply(this, arguments);}
  };
  const arena = window.NQBossArena;
  for (const method of ['sync','outcome']) {
   if (typeof arena?.[method] !== 'function') continue;
   const nativeObserver = arena[method];
   arena[method] = function () {const result = nativeObserver.apply(this, arguments);guardContext();return result;};
  }
  const main = document.getElementById('mainApp');
  if (main) {
   observer = new MutationObserver(guardContext);
   observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','hidden','inert','style','open','aria-modal']});
  }
  fine.addEventListener('change', guardContext);coarse.addEventListener('change', guardContext);
  window.addEventListener('storage', guardContext);
  document.addEventListener('visibilitychange', guardContext);
  window.NQPilot?.onContextChange(guardContext);
  window.addEventListener('nq-boss-cinema-request', event => {
   const data = context();
   if (data && event.detail?.manual === true && event.detail.contextKey === data.contextKey &&
       event.detail.character === data.character) openManual();
  });
  window.addEventListener('pagehide', () => {
   disposed = true;pending=null;clearTimeout(retryTimer);guardContext();observer?.disconnect();
   document.removeEventListener('visibilitychange', guardContext);
   fine.removeEventListener('change', guardContext);coarse.removeEventListener('change', guardContext);
   window.removeEventListener('storage', guardContext);
  }, {once:true});
  window.NQBattleIntroBridge = Object.freeze({inspection:() => ({seenContexts:[...seen],
   nativeFunctionWrapped:!!original, unifiedPlayer:true, cachedStoryContexts:stories.size,
   activeKey:active?.key || null, pendingKey:pending?.contextKey || null, ...metrics}), openManual});
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});else start();
}());
