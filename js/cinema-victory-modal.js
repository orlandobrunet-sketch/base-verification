/* Local presentation only: native completion/rewards/save already resolved. */
(function(){
 'use strict';
 const fine=matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)'),coarse=matchMedia('(any-pointer:coarse)'),motion=matchMedia('(prefers-reduced-motion:reduce)');
 const SHA='7016a88d33a27f3ca02c1f56d38f314c8a764d92ee6b13a27706c1436d127808';
 let dialog=null,nodes=null,active=null,disposed=false,finishing=false,opening=false,observer=null,monitor=0;
 let focusBefore=null,scrollLock=null,scrollObserver=null;
 const view={open:false,stage:'closed',contextKey:null,available:false,source:null,frameReady:false,reducedMotion:motion.matches,visibilityPaused:false,closingReason:null,callbackInvoked:false,callbackError:null,started:false,muted:true,userVolume:1,maximumLinearPlaybackGain:.78,effectiveVolume:.78,revealComplete:false,error:null};
 const eligible=()=>fine.matches;
 const visible=n=>!!n?.isConnected&&!n.hidden&&n.getClientRects().length>0&&!n.closest('[hidden],[inert]')&&getComputedStyle(n).visibility!=='hidden';
 function mediaConfig(){
  const c=window.NQ_VICTORY_CINEMA_CONFIG;
  try{const u=new URL(c?.source,location.href),gain=Number(c.maximumLinearPlaybackGain);
   if(c.available!==true||c.approved!==true||c.sha256!==SHA||u.origin!==location.origin||!['http:','https:'].includes(u.protocol)||!u.pathname.endsWith('/NefroQuest-vitoria-coletiva-v6.mp4')||!Number.isFinite(gain)||gain<0||gain>.78)return null;
   return Object.freeze({available:true,approved:true,source:u.href,sha256:SHA,maximumLinearPlaybackGain:gain,status:'verified-selected-v6',semanticAudioVerified:false});
  }catch(_){return null;}
 }
 function othersOpen(){return [...document.querySelectorAll('dialog[open],[aria-modal="true"],.nq-overlay,#arquiQ9Popup')].some(n=>n!==dialog&&!dialog?.contains(n)&&visible(n));}
 function valid(s){if(!s||s.settled)return false;try{return s.isCurrent(s.contextKey)===true;}catch(_){return false;}}
 const current=s=>active===s&&valid(s);
 function restoreScroll(){
  const s=scrollLock;if(!s)return;
  if(s.body.style.getPropertyValue('overflow')!=='hidden'){scrollLock=null;scrollObserver?.disconnect();scrollObserver=null;return;}
  if(othersOpen()){if(!scrollObserver){scrollObserver=new MutationObserver(restoreScroll);scrollObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','aria-modal','class','style']});}return;}
  scrollLock=null;scrollObserver?.disconnect();scrollObserver=null;
  if(s.value)s.body.style.setProperty('overflow',s.value,s.priority);else s.body.style.removeProperty('overflow');
 }
 function lockScroll(){restoreScroll();const b=document.body;scrollLock={body:b,value:b.style.getPropertyValue('overflow'),priority:b.style.getPropertyPriority('overflow')};b.style.setProperty('overflow','hidden');}
 function clearPhase(s){if(!s)return;clearTimeout(s.clock?.timer);s.clock=null;cancelAnimationFrame(s.raf1);cancelAnimationFrame(s.raf2);s.raf1=s.raf2=0;}
 function resumeClock(s){
  const p=s?.clock;if(!p||p.timer||document.hidden||!current(s))return;p.at=performance.now();
  p.timer=setTimeout(()=>{if(!current(s)||s.clock!==p)return;p.timer=0;if(document.hidden){p.remaining=0;return;}s.clock=null;p.action();},Math.max(0,p.remaining));
 }
 function clock(s,name,ms,action){clearPhase(s);s.clock={name,remaining:ms,action,timer:0,at:0};resumeClock(s);}
 function pauseClock(s){const p=s?.clock;if(!p?.timer)return;clearTimeout(p.timer);p.timer=0;p.remaining=Math.max(0,p.remaining-(performance.now()-p.at));}
 function clearMedia(s){
  clearTimeout(s?.loadTimer);clearTimeout(s?.stallTimer);clearTimeout(s?.playTimer);if(s)s.loadTimer=s.stallTimer=s.playTimer=0;
  const v=nodes?.video;if(!v)return;v.pause();v.removeAttribute('src');v.load();v.remove();nodes.video=null;
 }
 function finishNow(reason,deliver){
  const s=active;if(!s||s.settled)return false;const mayDeliver=deliver===true&&valid(s);
  s.settled=true;finishing=true;clearPhase(s);clearInterval(monitor);monitor=0;observer?.disconnect();observer=null;
  active=null;clearMedia(s);holdNativeAudio(s,false);
  Object.assign(view,{open:false,stage:'closed',visibilityPaused:false,closingReason:reason,muted:true,effectiveVolume:0});
  const focusWasHere=dialog?.contains(document.activeElement)||document.activeElement===document.body,returnFocus=focusBefore;focusBefore=null;
  if(dialog?.open)dialog.close();restoreScroll();
  let stillCurrent=false;if(mayDeliver){try{stillCurrent=s.isCurrent(s.contextKey)===true;}catch(_){}}
  if(stillCurrent&&focusWasHere&&!othersOpen()&&visible(returnFocus))returnFocus.focus({preventScroll:true});
  if(stillCurrent){view.callbackInvoked=true;try{s.onDone(reason);}catch(e){view.callbackError=String(e?.message||e);}}
  document.dispatchEvent(new CustomEvent('nq-victory-cinema-closed',{detail:{contextKey:s.contextKey,reason,callbackInvoked:stillCurrent}}));finishing=false;return true;
 }
 function guard(){
  if(!active)return false;
  if(!valid(active)){finishNow('context-lost',false);return false;}
  if(!dialog?.isConnected||!dialog.open){finishNow('external-close',true);return false;}
  if(!eligible()){finishNow('desktop-only',true);return false;}
  if(othersOpen()){finishNow(active.closing?active.closeReason:'interrupted',true);return false;}return true;
 }
 function stage(name){view.stage=name;if(dialog)dialog.dataset.stage=name;}
 function requestFinish(reason){
  if(opening||!guard()||active.closing)return false;
  const s=active;s.closing=true;s.closeReason=reason;clearPhase(s);nodes.video?.pause();holdNativeAudio(s,false);
  const exitTitle=view.stage==='title';dialog.dataset.exitTitle=String(exitTitle);
  const titleAlpha=exitTitle?Math.max(0,Math.min(1,Number(getComputedStyle(nodes.card).opacity)||0)):1;
  dialog.style.setProperty('--nq-victory-title-exit-from',String(titleAlpha));
  const popupAlpha=Math.max(0,Math.min(1,Number(getComputedStyle(dialog).opacity)||0));
  const backdropAlpha=Math.max(0,Math.min(1,Number(getComputedStyle(dialog,'::backdrop').opacity)||0));
  dialog.style.setProperty('--nq-victory-exit-from',String(popupAlpha));
  dialog.style.setProperty('--nq-victory-backdrop-exit-from',String(backdropAlpha));stage('closing');
  nodes.next.disabled=nodes.play.disabled=nodes.replay.disabled=nodes.sound.disabled=nodes.volume.disabled=true;
  nodes.status.textContent='Retornando aos resultados…';
  if(motion.matches||document.hidden)return finishNow(reason,true);
  clock(s,'closing',450,()=>finishNow(s.closeReason,true));return true;
 }
function holdNativeAudio(s,enabled){
 if(enabled){if(!s.releaseNativeAudio){const release=window.NQNativeCinemaAudio?.acquire?.();if(typeof release!=='function')return false;s.releaseNativeAudio=release;}return true;}
 const release=s.releaseNativeAudio;s.releaseNativeAudio=null;release?.();return true;
}
 function applyVolume(s){
  const v=nodes?.video;if(!current(s)||!v)return;
  const value=Math.max(0,Math.min(1,s.userVolume))*s.media.maximumLinearPlaybackGain;
  if(s.muted&&!v.muted)v.muted=true;
  if(!holdNativeAudio(s,!s.muted&&!v.paused&&!s.closing))s.muted=true;
  if(Math.abs(v.volume-value)>.00001)v.volume=value;if(v.muted!==s.muted)v.muted=s.muted;
  Object.assign(view,{userVolume:s.userVolume,maximumLinearPlaybackGain:s.media.maximumLinearPlaybackGain,effectiveVolume:value,muted:s.muted});
  nodes.volume.value=String(s.userVolume);nodes.volume.setAttribute('aria-valuetext',Math.round(s.userVolume*100)+'%');
  nodes.sound.textContent=s.muted?'Ativar som':'Silenciar';nodes.sound.setAttribute('aria-pressed',String(!s.muted));
 }
 function fail(reason,error){if(active?.closing)return false;view.error=String(error||reason);return finishNow(reason,true);}
 function requestPlay(s){
  if(!current(s)||!guard()||!s.revealComplete||s.closing||view.stage==='title'||document.hidden)return false;const v=nodes.video;if(!v)return false;
  const attempt=++s.playAttempt;clearTimeout(s.playTimer);
  s.playTimer=setTimeout(()=>{if(current(s)&&!s.closing&&s.playAttempt===attempt&&!v.paused&&view.stage!=='playing')fail('play-start-timeout');},8000);
  const rejected=e=>{if(!current(s)||s.closing||nodes.video!==v||s.playAttempt!==attempt)return;if(e?.name==='AbortError'&&v.paused){clearTimeout(s.playTimer);return;}fail('playback-unavailable',e?.name||e);};
  if(!s.muted&&!holdNativeAudio(s,true)){s.muted=true;applyVolume(s);}
  try{Promise.resolve(v.play()).catch(rejected);}catch(e){rejected(e);}return true;
 }
 function finishReveal(s){
  if(!current(s)||s.closing||s.revealComplete||!guard())return;
  clearPhase(s);s.revealComplete=true;view.revealComplete=true;dialog.dataset.revealOpen='true';
  nodes.play.hidden=nodes.sound.hidden=nodes.volumeLabel.hidden=false;nodes.video.tabIndex=0;nodes.video.inert=false;nodes.card.hidden=true;
  stage(motion.matches?'ready':'loading');nodes.play.textContent='Reproduzir filme';
  nodes.status.textContent=motion.matches?'Reproduza o filme quando quiser, ou pule para os resultados.':'Preparando o encerramento…';
  if(!motion.matches)requestPlay(s);
 }
 function reveal(s){
  if(!current(s)||s.closing||s.revealStarted||!guard())return;s.revealStarted=true;stage('opening');dialog.dataset.revealOpen='false';nodes.card.hidden=true;
  if(motion.matches){finishReveal(s);return;}
  s.raf1=requestAnimationFrame(()=>{s.raf2=requestAnimationFrame(()=>{if(!current(s)||s.closing||s.revealComplete)return;dialog.dataset.revealOpen='true';clock(s,'opening',600,()=>finishReveal(s));});});
 }
 function showTitle(s){
  if(!current(s)||s.closing||!guard())return;clearPhase(s);nodes.video?.pause();holdNativeAudio(s,false);if(nodes.video){nodes.video.tabIndex=-1;nodes.video.inert=true;}stage('title');
  nodes.card.hidden=false;nodes.eyebrow.textContent='CONFRONTO FINAL · VITÓRIA';nodes.heading.textContent='OS RINS FORAM SALVOS!';
  nodes.subtitle.textContent=s.selectedName;nodes.note.textContent='O equilíbrio foi restaurado.';
  nodes.next.hidden=nodes.replay.hidden=false;nodes.play.hidden=nodes.sound.hidden=nodes.volumeLabel.hidden=true;
  nodes.next.textContent='Ver resultados';nodes.status.textContent='Os rins foram salvos.';nodes.next.focus({preventScroll:true});
  if(!motion.matches)clock(s,'title',2400,()=>requestFinish('ended'));
 }
 function restart(s){
  if(!current(s)||!guard()||s.closing||view.stage!=='title')return false;clearPhase(s);
  s.muted=true;applyVolume(s);holdNativeAudio(s,false);s.revealStarted=false;s.revealComplete=false;view.revealComplete=false;stage('loading');dialog.dataset.revealOpen='false';nodes.card.hidden=true;
  nodes.next.hidden=nodes.replay.hidden=nodes.play.hidden=nodes.sound.hidden=nodes.volumeLabel.hidden=true;
  const v=nodes.video;v.tabIndex=-1;v.inert=true;v.pause();s.loadExpired=false;try{v.currentTime=0;}catch(e){return fail('seek-unavailable',e?.name||e);}
  if(v.readyState>=2&&!v.seeking)reveal(s);
  if(!s.revealStarted)s.loadTimer=setTimeout(()=>{if(current(s)&&!s.revealStarted)fail('seek-timeout');},10000);return true;
 }
 function attachVideo(s){
  const v=document.createElement('video');nodes.video=v;v.className='nq-victory-cinema__video';v.playsInline=true;v.controls=false;v.tabIndex=-1;v.inert=true;
  v.muted=true;v.defaultMuted=true;v.preload='auto';v.loop=false;v.setAttribute('aria-label','Filme de vitória do NefroQuest');
  const live=()=>current(s)&&nodes.video===v,ready=()=>{if(live()&&v.readyState>=2&&!v.seeking){clearTimeout(s.loadTimer);s.loadTimer=0;s.loadExpired=false;reveal(s);}};
  v.addEventListener('loadeddata',ready);v.addEventListener('seeked',ready);
  v.addEventListener('playing',e=>{
   if(!live()||!e.isTrusted)return;
   if(!s.revealComplete){v.pause();try{v.currentTime=0;}catch(_){}return;}
   if(s.closing||v.readyState<2||v.paused||v.currentSrc!==s.media.source)return;
   clearTimeout(s.loadTimer);clearTimeout(s.stallTimer);clearTimeout(s.playTimer);s.loadTimer=s.stallTimer=s.playTimer=0;s.started=true;view.started=true;nodes.card.hidden=true;stage('playing');
   nodes.play.textContent='Pausar filme';nodes.status.textContent='Você pode pausar ou pular a qualquer momento.';
  });
  v.addEventListener('pause',()=>{if(!live()||!s.revealComplete||s.closing||view.stage==='title')return;clearTimeout(s.playTimer);s.playTimer=0;s.playAttempt++;holdNativeAudio(s,false);stage('paused');nodes.play.textContent='Continuar filme';});
  v.addEventListener('ended',e=>{if(live()&&e.isTrusted&&s.started&&s.revealComplete&&v.ended&&v.currentTime>=v.duration-.15)showTitle(s);});
  v.addEventListener('volumechange',()=>{if(live())applyVolume(s);});
  v.addEventListener('error',()=>{if(live())fail('media-error',v.error?.code);});
  v.addEventListener('timeupdate',()=>{if(live()){clearTimeout(s.stallTimer);s.stallTimer=0;}});
  v.addEventListener('stalled',()=>{if(!live()||v.paused||document.hidden)return;clearTimeout(s.stallTimer);s.stallTimer=setTimeout(()=>{if(live()&&!v.paused&&!document.hidden)fail('media-stalled');},8000);});
  nodes.aperture.appendChild(v);applyVolume(s);v.src=s.media.source;v.load();
  s.loadTimer=setTimeout(()=>{if(!live()||s.started)return;if(document.hidden){s.loadExpired=true;return;}fail('media-timeout');},10000);
 }
 function focusable(){return [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),video[tabindex="0"]')].filter(visible);}
 function keydown(e){
  if(!active)return;e.stopImmediatePropagation();
  if(e.key==='Escape'){e.preventDefault();requestFinish('escape');return;}
  if(e.key===' '&&e.target===nodes.video){e.preventDefault();if(nodes.video.paused)requestPlay(active);else nodes.video.pause();return;}
  if(e.key!=='Tab')return;const controls=focusable(),first=controls[0],last=controls[controls.length-1];
  if(!first){e.preventDefault();return;}
  if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){e.preventDefault();first.focus();}
 }
 function focusin(e){if(active&&!dialog.contains(e.target)&&!othersOpen())nodes.skip.focus({preventScroll:true});}
 function frameMarkup(){try{const m=window.NQBattleIntro?.frameMarkup?.();if(typeof m==='string'&&m.includes('nq-battle-intro__reliquary'))return m.replace(/nq-battle-intro__/g,'nq-victory-cinema__');}catch(_){}return '';}
 function mount(){
  if(dialog?.isConnected)return true;
  if(!document.body||typeof HTMLDialogElement==='undefined'||typeof HTMLDialogElement.prototype.showModal!=='function')return false;
  dialog=document.createElement('dialog');dialog.id='nqVictoryCinema';dialog.className='nq-victory-cinema';dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-labelledby','nqVictoryCinemaHeading');dialog.setAttribute('aria-describedby','nqVictoryCinemaNote');
  const frame=frameMarkup();view.frameReady=!!frame;dialog.dataset.frameReady=String(!!frame);
  dialog.innerHTML='<div class="nq-victory-cinema__surround"><div class="nq-victory-cinema__top"><span>NEFROQUEST · CONFRONTO FINAL</span><button type="button" class="nq-victory-cinema__close" aria-label="Fechar encerramento e ir para os resultados">×</button></div>'+
   '<div class="nq-victory-cinema__shell"><div class="nq-victory-cinema__aperture"><section class="nq-victory-cinema__card"><p class="nq-victory-cinema__eyebrow"></p><h2 id="nqVictoryCinemaHeading" class="nq-victory-cinema__heading"></h2><p class="nq-victory-cinema__subtitle"></p><p id="nqVictoryCinemaNote" class="nq-victory-cinema__note"></p></section></div>'+frame+'</div>'+
   '<div class="nq-victory-cinema__footer"><p class="nq-victory-cinema__status" role="status" aria-live="polite" aria-atomic="true"></p><div class="nq-victory-cinema__controls"><button type="button" class="nq-victory-cinema__next" hidden>Ver resultados</button><button type="button" class="nq-victory-cinema__replay" hidden>Rever filme</button><button type="button" class="nq-victory-cinema__play" hidden>Reproduzir filme</button><button type="button" class="nq-victory-cinema__sound" hidden aria-pressed="false">Ativar som</button><label class="nq-victory-cinema__volume" hidden>Volume<input type="range" data-nq-victory-volume min="0" max="1" step="0.01" value="1" aria-label="Volume do filme" aria-valuetext="100%"></label><button type="button" class="nq-victory-cinema__skip">Pular encerramento</button></div></div></div>';
  const select=n=>dialog.querySelector('.nq-victory-cinema__'+n);
  nodes={aperture:select('aperture'),card:select('card'),eyebrow:select('eyebrow'),heading:select('heading'),subtitle:select('subtitle'),note:select('note'),status:select('status'),next:select('next'),replay:select('replay'),play:select('play'),sound:select('sound'),volumeLabel:select('volume'),volume:dialog.querySelector('[data-nq-victory-volume]'),skip:select('skip'),close:select('close'),video:null};
  nodes.next.addEventListener('click',()=>requestFinish('continued'));nodes.skip.addEventListener('click',()=>requestFinish('skipped'));nodes.close.addEventListener('click',()=>requestFinish('closed'));
  nodes.replay.addEventListener('click',()=>{if(active)restart(active);});
  nodes.play.addEventListener('click',()=>{if(!active||!guard()||active.closing)return;if(nodes.video?.paused)requestPlay(active);else nodes.video?.pause();});
  nodes.sound.addEventListener('click',e=>{if(!e.isTrusted||!active||!guard()||active.closing)return;active.muted=!active.muted;applyVolume(active);});
  nodes.volume.addEventListener('input',e=>{if(!e.isTrusted||!active||!guard()||active.closing)return;active.userVolume=Math.max(0,Math.min(1,Number(nodes.volume.value)||0));applyVolume(active);});
  dialog.addEventListener('cancel',e=>{e.preventDefault();requestFinish('escape');});
  dialog.addEventListener('close',()=>{if(active&&!dialog.open)finishNow('external-close',true);});
  document.body.append(dialog);return true;
 }
 function open(r={}){
  if(disposed||finishing||opening||!eligible()||document.hidden||active||othersOpen())return false;
  const contextKey=typeof r.contextKey==='string'?r.contextKey.trim():'',selectedName=typeof r.selectedName==='string'?r.selectedName.trim():'',media=mediaConfig();
  if(!media||!contextKey||!selectedName||typeof r.isCurrent!=='function'||typeof r.onDone!=='function')return false;
  const s={contextKey,selectedName,isCurrent:r.isCurrent,onDone:r.onDone,media,settled:false,started:false,closing:false,closeReason:null,userVolume:1,muted:true,revealStarted:false,revealComplete:false,clock:null,loadTimer:0,stallTimer:0,playTimer:0,playAttempt:0,loadExpired:false,raf1:0,raf2:0,visibilityResume:false};
  if(!valid(s)||!mount()||!valid(s))return false;focusBefore=document.activeElement;active=s;
  Object.assign(view,{open:true,stage:'loading',contextKey,available:true,source:media.source,reducedMotion:motion.matches,visibilityPaused:false,closingReason:null,callbackInvoked:false,callbackError:null,started:false,muted:true,userVolume:1,maximumLinearPlaybackGain:media.maximumLinearPlaybackGain,effectiveVolume:media.maximumLinearPlaybackGain,revealComplete:false,error:null});
  dialog.dataset.stage='loading';dialog.dataset.exitTitle='false';dialog.dataset.revealOpen='false';dialog.dataset.visibilityPaused='false';dialog.dataset.reducedMotion=String(motion.matches);
  nodes.eyebrow.textContent='CONFRONTO FINAL';nodes.heading.textContent='O equilíbrio retorna.';nodes.subtitle.textContent='';nodes.note.textContent='';
  nodes.card.hidden=true;nodes.next.hidden=nodes.replay.hidden=nodes.play.hidden=nodes.sound.hidden=nodes.volumeLabel.hidden=true;
  nodes.next.disabled=nodes.replay.disabled=nodes.play.disabled=nodes.sound.disabled=nodes.volume.disabled=false;nodes.status.textContent='Preparando o encerramento…';opening=true;
  try{dialog.showModal();}catch(_){active=null;focusBefore=null;view.open=false;view.stage='closed';opening=false;return false;}
  if(disposed||active!==s||!valid(s)||!eligible()||othersOpen()){opening=false;finishNow('open-cancelled',false);return false;}
  lockScroll();observer=new MutationObserver(()=>{if(active)guard();});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','aria-modal','class','style']});
  monitor=setInterval(guard,100);opening=false;nodes.skip.focus({preventScroll:true});attachVideo(s);return true;
 }
 function visibilityChanged(){
  if(!active||!guard())return;const s=active;view.visibilityPaused=document.hidden;dialog.dataset.visibilityPaused=String(document.hidden);
  if(document.hidden){if(s.closing){finishNow(s.closeReason,true);return;}pauseClock(s);s.visibilityResume=!!nodes.video&&!nodes.video.paused&&!nodes.video.ended;if(s.visibilityResume)nodes.video.pause();}
  else{if(s.loadExpired){fail('media-timeout');return;}resumeClock(s);if(s.visibilityResume&&!motion.matches){s.visibilityResume=false;requestPlay(s);}}
 }
 function motionChanged(){
  view.reducedMotion=motion.matches;if(dialog)dialog.dataset.reducedMotion=String(motion.matches);
  if(!active||!guard()||!motion.matches)return;
  if(active.closing){finishNow(active.closeReason,true);return;}
  if(view.stage==='opening'){finishReveal(active);return;}
  if(view.stage==='title'){clearPhase(active);return;}
  if(nodes.video&&!nodes.video.paused)nodes.video.pause();
 }
 function navigate(){if(active)finishNow('navigation',false);}
 function eligibilityChanged(){if(active)guard();}
 function destroy(){
  if(disposed)return false;disposed=true;if(active)finishNow('disposed',true);observer?.disconnect();observer=null;clearInterval(monitor);monitor=0;dialog?.remove();dialog=null;nodes=null;
  document.removeEventListener('visibilitychange',visibilityChanged);document.removeEventListener('focusin',focusin,true);window.removeEventListener('keydown',keydown,true);
  window.removeEventListener('popstate',navigate);window.removeEventListener('hashchange',navigate);window.removeEventListener('pagehide',navigate);
  fine.removeEventListener('change',eligibilityChanged);coarse.removeEventListener('change',eligibilityChanged);motion.removeEventListener('change',motionChanged);restoreScroll();return true;
 }
 document.addEventListener('visibilitychange',visibilityChanged);document.addEventListener('focusin',focusin,true);window.addEventListener('keydown',keydown,true);
 window.addEventListener('popstate',navigate);window.addEventListener('hashchange',navigate);window.addEventListener('pagehide',navigate);
 fine.addEventListener('change',eligibilityChanged);coarse.addEventListener('change',eligibilityChanged);motion.addEventListener('change',motionChanged);
 window.NQVictoryCinema=Object.freeze({open,close:()=>requestFinish('closed'),skip:()=>requestFinish('skipped'),cancelContext:()=>finishNow('context-lost',true),destroy,dispose:destroy,
  get mediaConfig(){return mediaConfig()||Object.freeze({available:false,source:null,status:'unavailable'});},
  notifyMediaEnded:()=>false,notifyMediaError:()=>false,
  get inspection(){return {...view,eligible:eligible(),disposed,mediaStage:view.stage,videoTime:nodes?.video?.currentTime??null,videoPaused:nodes?.video?.paused??null,mediaStatus:mediaConfig()?.status||'unavailable'};}
 });
}());
