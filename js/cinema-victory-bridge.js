/* A5 local presentation bridge. Native completion/rewards/save always run synchronously.
   Only the call that presents native results may be handed back once. */
(function(){
 'use strict';
 const fine=matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)'),coarse=matchMedia('(any-pointer:coarse)');
 let arena=null,originalModal=null,originalEvolution=null,evolutionWrapper=null,prepared=null,active=null,disposed=false,observer=null,deliveredCount=0;
 let evolutionFrame=0,evolutionHeld=0,evolutionReleased=0,evolutionCancelled=0;
 const records=new Map(),wrapped={};
 const names={nephros:'Dr. Nephros',aquaria:'Dra. Aquaria',glomerulus:'Dr. Glomerulus'};
 function read(){try{return {epoch:_progressEpoch,character:state.character,question:state.current,qid:state.current?.id,
  answer:state.questionAnswer,answered:state.answered,correct:state.correctTotal,hp:getBossHP(),progress:getBossProgress(),
  completed:state.gameCompleted,continued:state.completedGame,over:state.gameOver,started:state.gameStarted,lives:state.lives,level:state.level};}catch(_){return null;}}
 function mainVisible(){const main=document.getElementById('mainApp');return !disposed&&!!main&&!main.hidden&&!main.classList.contains('hidden')&&!!main.getClientRects().length;}
 function eligible(){return mainVisible()&&fine.matches;}
 function matches(rec,complete){const s=read();try{return !!rec&&!rec.cancelled&&mainVisible()&&!!s&&s.epoch===rec.epoch&&s.character===rec.character&&s.question===rec.question&&s.qid===rec.qid&&s.answer===rec.answer&&s.answered===true&&s.correct===100&&s.progress===10&&s.hp===0&&s.started===true&&s.over===false&&s.continued===false&&s.lives>0&&(!complete||s.completed===true)&&_matchesJourneyBinding(rec.binding);}catch(_){return false;}}
 // Selective A7 port: run native rendering once at its scheduled time and keep
 // the actual authored node until the final results have closed.
 function evolutionCurrent(rec){const s=read();try{return !!rec&&eligible()&&!!s&&s.epoch===rec.epoch&&s.character===rec.character&&s.started===true&&s.completed===true&&s.correct>=100&&!s.over&&_matchesJourneyBinding(rec.binding);}catch(_){return false;}}
 function clearEvolution(rec,reason){if(!rec)return;rec.evolutionAbandoned=true;if(rec.evolution){rec.evolution.node.remove();rec.evolution=null;evolutionCancelled++;}rec.evolutionReason=reason;}
 function clearEvolutionQueues(reason){for(const rec of records.values())clearEvolution(rec,reason);if(prepared&&!records.has(prepared.key))clearEvolution(prepared,reason);cancelAnimationFrame(evolutionFrame);evolutionFrame=0;}
 function flushEvolution(){
  evolutionFrame=0;if(disposed)return;
  for(const rec of records.values()){
   const pending=rec.evolution;if(!pending)continue;
   if(rec.evolutionAbandoned||!evolutionCurrent(rec)){clearEvolution(rec,'stale-context');continue;}
   if(!rec.delivered||active===rec||document.hidden||document.getElementById('victoryModal')||otherOverlay())continue;
   if(pending.node.dataset.nqDialogo){if(!evolutionFrame)evolutionFrame=requestAnimationFrame(flushEvolution);continue;}
   rec.evolution=null;
   if(document.activeElement===document.body){
    const origin=document.getElementById('nextBtn')||document.querySelector('.portrait-frame[data-action="showHeroLore"]');
    if(origin?.getClientRects().length&&!origin.closest('[hidden],[inert],.hidden'))origin.focus({preventScroll:true});
   }
   document.body.appendChild(pending.node);
   try{if(typeof nqDialogo==='function')nqDialogo(pending.node);}catch(_){}
   rec.evolutionReason='released-after-results';evolutionReleased++;
  }
 }
 function holdEvolution(receiver,args){
  const s=read(),rec=s&&records.get(String(s.epoch)+':'+s.character);
  const owned=!!rec&&Number(args[0])===rec.finalLevel&&evolutionCurrent(rec);
  const holding=owned&&!rec.evolutionAbandoned&&(active===rec||rec.delivered&&!!document.getElementById('victoryModal'));
  if(!owned||(!holding&&!rec.evolutionAbandoned))return originalEvolution.apply(receiver,args);
  const prior=document.activeElement;
  const result=originalEvolution.apply(receiver,args),node=document.querySelector('.evolution-popup');
  if(!node)return result;
  const focusWasNative=node.contains(document.activeElement)||document.activeElement===document.body;
  node.remove();
  if(rec.evolutionAbandoned||!evolutionCurrent(rec)){evolutionCancelled++;}
  else{if(rec.evolution)rec.evolution.node.remove();rec.evolution={node};rec.evolutionReason='held-until-results-close';evolutionHeld++;}
  if(focusWasNative&&prior?.isConnected&&prior.getClientRects().length&&!prior.closest('[hidden],[inert],.hidden'))prior.focus({preventScroll:true});
  if(!evolutionFrame)evolutionFrame=requestAnimationFrame(flushEvolution);
  return result;
 }
 function cleanupTimers(rec){if(!rec)return;clearTimeout(rec.watchdog);clearTimeout(rec.beat);cancelAnimationFrame(rec.frame1);cancelAnimationFrame(rec.frame2);rec.watchdog=rec.beat=rec.frame1=rec.frame2=0;}
 function releaseHold(){try{arena?.releaseNativeCompletion?.();}catch(_){/* Native results remain independent. */}}
 function cancel(rec,reason){if(!rec||rec.delivered||rec.cancelled)return false;cleanupTimers(rec);clearEvolution(rec,reason);rec.cancelled=true;rec.status='cancelled';rec.reason=reason;if(active===rec)active=null;if(prepared===rec)prepared=null;try{window.NQVictoryCinema?.cancelContext();}catch(_){}releaseHold();return true;}
 function deliver(rec,reason){
  if(!rec||rec.delivered||rec.cancelled)return false;
  if(!matches(rec,true))return cancel(rec,'stale-'+reason);
  // Native reward dialogs must finish before the delayed results take focus.
  // Completion and rewards already resolved; only their presentation waits.
  // Disposal removes the observer, so it must hand results back immediately.
  if(reason!=='disposed'&&eligible()&&otherOverlay()){
   cleanupTimers(rec);rec.status='waiting-native-overlay';rec.reason=reason;
   rec.resumeFilmAfterOverlay=['interrupted','native-overlay-before-beat','presentation-unavailable'].includes(reason);
   try{window.NQVictoryCinema?.cancelContext();}catch(_){}releaseHold();return true;
  }
  cleanupTimers(rec);rec.delivered=true;rec.status='native-results';rec.reason=reason;if(active===rec)active=null;if(prepared===rec)prepared=null;
  try{window.NQVictoryCinema?.cancelContext();}catch(_){}releaseHold();
  // Marked delivered before the native call: reentrant close/outcome cannot repeat it.
  if(!document.getElementById('victoryModal')){deliveredCount++;originalModal.apply(rec.receiver,rec.args||[]);}
  return true;
 }
 function otherOverlay(){return [...document.querySelectorAll('dialog[open],.nq-overlay,[aria-modal="true"],#arquiQ9Popup')].some(n=>n.id!=='nqVictoryCinema'&&!n.hidden&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');}
 function terminalVisible(){const n=document.getElementById('nqStaticHpTrack');if(!n||!n.getClientRects().length||document.hidden||otherOverlay())return false;const r=n.getBoundingClientRect(),style=getComputedStyle(n);if(!(r.width>0&&r.height>0&&style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&n.getAttribute('aria-valuenow')==='0'))return false;const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!top&&(top===n||n.contains(top));}
 function present(rec){
  if(!matches(rec,true))return cancel(rec,'context-before-presentation');
  if(!eligible()||document.hidden||otherOverlay())return deliver(rec,'presentation-unavailable');
  let accepted=false;try{accepted=window.NQVictoryCinema?.open({contextKey:rec.key,selectedName:names[rec.character],isCurrent:()=>matches(rec,true),onDone:reason=>deliver(rec,reason)})===true;}catch(_){accepted=false;}
  if(!accepted)return deliver(rec,'presentation-open-failed');
  if(rec.delivered||rec.cancelled||active!==rec)return;
  rec.status='victory-film';releaseHold();
 }
 function confirm(rec,event){
  const s=read();
  if(!rec||rec!==active||rec.confirmed||!matches(rec,true)||!event||event.answerIdentity!==rec.answer||event.accepted!==true||event.wasBoss!==true||event.correct!==true||event.blocked!==false||event.contextEpoch!==rec.epoch||event.progressBefore!==9||event.progressAfter!==10||event.hpBefore!==10||event.hpAfter!==0||event.gameCompleted!==true||event.gameOver!==false||event.livesAfter!==s.lives)return false;
  rec.confirmed=true;clearTimeout(rec.watchdog);rec.status='paint-pending';try{if(!document.hidden)playSound('victory');window.NQVictoryCinema?.prepare?.();}catch(_){}
  if(document.hidden)return deliver(rec,'hidden-before-beat');
  // Two animation frames ensure HP0 gets a painted opportunity before the hold.
  rec.frame1=requestAnimationFrame(()=>{rec.frame2=requestAnimationFrame(()=>{
   if(!matches(rec,true))return cancel(rec,'context-before-beat');
   // Offscreen HP does not invalidate a resolved victory. Keep native overlay safety.
   if(otherOverlay())return deliver(rec,'native-overlay-before-beat');
   rec.terminalPaintVisible=terminalVisible();
   rec.paintedAt=performance.now();rec.status='resolved-beat';rec.beat=setTimeout(()=>present(rec),matchMedia('(prefers-reduced-motion:reduce)').matches?350:1800);
  });});return true;
 }
 function capture(event){
  const s=read();
  if(!eligible()||!s||!Object.hasOwn(names,s.character)||s.completed||s.correct!==100||s.progress!==10||s.hp!==0||s.answer!==event?.answerIdentity||event?.contextEpoch!==s.epoch||event.accepted!==true||event.wasBoss!==true||event.correct!==true||event.blocked!==false||event.progressBefore!==9||event.progressAfter!==10||event.hpBefore!==10||event.hpAfter!==0||s.answered!==true||s.over||s.continued||!s.started||s.lives<=0)return;
  const key=String(s.epoch)+':'+s.character;if(records.has(key))return;
  let binding;try{binding=_captureJourneyBinding();if(!_matchesJourneyBinding(binding)||arena.holdNativeCompletion(event)!==true)return;}catch(_){return;}
  prepared={key,epoch:s.epoch,character:s.character,question:s.question,qid:s.qid,answer:s.answer,binding,finalLevel:s.level,status:'prepared',delivered:false,cancelled:false,confirmed:false};
 }
 function nativeModalWrapper(){
  const s=read(),known=s&&records.get(String(s.epoch)+':'+s.character);
  if(known&&(known===active||known.delivered||known.cancelled))return;
  if(!eligible())return originalModal.apply(this,arguments);
  const rec=prepared;if(!rec||!matches(rec,true))return originalModal.apply(this,arguments);
  rec.receiver=this;rec.args=Array.from(arguments);rec.status='awaiting-native-outcome';active=rec;records.set(rec.key,rec);
  rec.watchdog=setTimeout(()=>deliver(rec,'missing-outcome-fail-open'),200);
 }
 function guard(){if(active&&!active.delivered){if(!matches(active,true))cancel(active,'context-lost');else if(!eligible())deliver(active,'desktop-only');else if(active.status==='waiting-native-overlay'&&!otherOverlay()){const rec=active;if(rec.resumeFilmAfterOverlay){rec.resumeFilmAfterOverlay=false;present(rec);}else deliver(rec,rec.reason);}}flushEvolution();}
 function navigate(){clearEvolutionQueues('navigation');if(active)cancel(active,'navigation');else if(prepared)cancel(prepared,'navigation');}
 function visibility(){if(document.hidden&&active&&['paint-pending','resolved-beat','awaiting-native-outcome'].includes(active.status))deliver(active,'hidden-presentation-skipped');if(!document.hidden)flushEvolution();}
 function start(){
  arena=window.NQBossArena;originalModal=window.showGameCompletionModal;
  if(!arena||typeof originalModal!=='function'||typeof arena.holdNativeCompletion!=='function')return;
  for(const method of ['prepareOutcome','outcome']){
   const original=arena[method];wrapped[method]={original,wrapper:function(event){
    if(method==='prepareOutcome')capture(event);
    const result=original.apply(this,arguments);
    if(method==='outcome'&&active)confirm(active,event);
    return result;
   }};arena[method]=wrapped[method].wrapper;
  }
  window.showGameCompletionModal=nativeModalWrapper;
  originalEvolution=typeof window.showEvolutionPopup==='function'?window.showEvolutionPopup:null;
  if(originalEvolution){evolutionWrapper=function(){return holdEvolution(this,arguments);};window.showEvolutionPopup=evolutionWrapper;}
  observer=new MutationObserver(guard);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','inert','open','style']});
  document.addEventListener('visibilitychange',visibility);window.addEventListener('popstate',navigate);window.addEventListener('hashchange',navigate);window.addEventListener('pagehide',navigate);fine.addEventListener('change',guard);coarse.addEventListener('change',guard);
  const api={failPresentation:()=>active?deliver(active,'media-presentation-failed'):false,dispose:()=>{
   if(disposed)return;if(active)deliver(active,'disposed');else if(prepared)cancel(prepared,'disposed');clearEvolutionQueues('disposed');disposed=true;
   observer?.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('popstate',navigate);window.removeEventListener('hashchange',navigate);window.removeEventListener('pagehide',navigate);fine.removeEventListener('change',guard);coarse.removeEventListener('change',guard);
   if(window.showGameCompletionModal===nativeModalWrapper)window.showGameCompletionModal=originalModal;
   if(window.showEvolutionPopup===evolutionWrapper)window.showEvolutionPopup=originalEvolution;
   for(const method of Object.keys(wrapped))if(arena[method]===wrapped[method].wrapper)arena[method]=wrapped[method].original;
   window.NQVictoryCinema?.dispose();releaseHold();
  }};
  Object.defineProperty(api,'inspection',{get:()=>({available:true,mediaAvailable:window.NQVictoryCinema?.mediaConfig?.available===true,provisional:window.NQVictoryCinema?.mediaConfig?.available!==true,disposed,deliveredCount,evolution:{held:evolutionHeld,released:evolutionReleased,cancelled:evolutionCancelled,pending:[...records.values()].filter(r=>r.evolution).length},active:active?{key:active.key,status:active.status,confirmed:active.confirmed,paintedAt:active.paintedAt??null}:null,records:[...records.values()].map(r=>({key:r.key,status:r.status,confirmed:r.confirmed,delivered:r.delivered,cancelled:r.cancelled,reason:r.reason??null,evolutionPending:!!r.evolution,evolutionReason:r.evolutionReason??null}))})});window.NQVictoryBridge=api;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}());
