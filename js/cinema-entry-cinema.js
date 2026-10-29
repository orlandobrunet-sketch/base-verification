/* A6 story and approved film share one aperture. No native save/reward authority. */
(function(){
'use strict';
const fine=matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)'),coarse=matchMedia('(any-pointer:coarse)'),motion=matchMedia('(prefers-reduced-motion:reduce)');
let dialog=null,nodes=null,active=null,revision=0,disposed=false,monitor=0,loadTimer=0,stallTimer=0,observer=null,phaseTimer=0,phaseDeadline=0,phaseRemaining=0,phaseAction=null,scrollLock=null,scrollObserver=null;
const view={open:false,key:null,kind:null,stage:'closed',manual:false,available:false,source:null,started:false,muted:true,paused:true,soundOptIn:false,userVolume:1,maximumLinearPlaybackGain:1,effectiveVolume:1,audibleVolume:0,reducedMotion:motion.matches,visibilityPaused:false,firstFrameReady:false,frameReady:false,frameVisible:false,preflight:false,committed:false,storyParagraphs:0,reason:null,error:null};
const eligible=()=>fine.matches&&!coarse.matches&&!(navigator.maxTouchPoints>0);
const visible=n=>!!n?.isConnected&&!n.hidden&&n.getClientRects().length>0&&!n.closest('[hidden],[inert]')&&getComputedStyle(n).visibility!=='hidden';
function contextCurrent(s){try{return !!s&&s.isCurrent(s.key)===true;}catch(_){return false;}}
const valid=s=>!!s&&!s.done&&contextCurrent(s);
function anotherModal(){return [...document.querySelectorAll('dialog[open],[aria-modal="true"],.nq-overlay,#arquiQ9Popup')].some(n=>n!==dialog&&!dialog?.contains(n)&&visible(n));}
function deliver(fn,v){try{if(typeof fn==='function')fn(v);}catch(_){} }
function restoreScroll(){
 if(!scrollLock)return;
 if(anotherModal()){if(!scrollObserver){scrollObserver=new MutationObserver(restoreScroll);scrollObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','class','style','aria-modal']});}return;}
 const p=scrollLock;scrollLock=null;scrollObserver?.disconnect();scrollObserver=null;
 if(p.body.style.getPropertyValue('overflow')!=='hidden')return;
 if(p.value)p.body.style.setProperty('overflow',p.value,p.priority);else p.body.style.removeProperty('overflow');
}
function clearPhase(){clearTimeout(phaseTimer);phaseTimer=0;phaseAction=null;phaseRemaining=0;}
function clearTimers(){clearInterval(monitor);clearTimeout(loadTimer);clearTimeout(stallTimer);monitor=loadTimer=stallTimer=0;clearPhase();}
function pausePhase(){if(phaseTimer){phaseRemaining=Math.max(0,phaseDeadline-performance.now());clearTimeout(phaseTimer);phaseTimer=0;}}
function resumePhase(){if(!active||!phaseAction||phaseTimer||document.hidden)return;const fn=phaseAction,s=active;phaseDeadline=performance.now()+phaseRemaining;phaseTimer=setTimeout(()=>{phaseTimer=0;phaseRemaining=0;phaseAction=null;if(active===s&&valid(s))fn();},phaseRemaining);}
function schedulePhase(s,ms,fn){clearPhase();if(active!==s||!valid(s))return;phaseRemaining=ms;phaseAction=fn;resumePhase();}
function stage(v){view.stage=v;if(dialog)dialog.dataset.stage=v;}
function clearVideo(){if(!nodes?.video)return;const v=nodes.video;nodes.video=null;window.NQMovieSound?.dispose(v);v.pause();v.muted=true;v.removeAttribute('src');v.replaceChildren();v.load();v.remove();}
function finish(reason,{skip=false,cancel=false,deliverDone=true,restoreFocus=true}={}){
 const s=active;if(!s||s.done)return false;const current=valid(s);s.done=true;active=null;revision++;clearTimers();observer?.disconnect();observer=null;
 const focusWasHere=dialog?.contains(document.activeElement)||document.activeElement===document.body;
 s.prologue?.dispose();window.NQMovieArt?.dispose(dialog);clearVideo();holdNativeAudio(s,false);Object.assign(view,{open:false,stage:'closed',paused:true,muted:true,soundOptIn:false,audibleVolume:0,visibilityPaused:false,frameVisible:false,reason});if(dialog?.open)dialog.close();restoreScroll();
 const detail=Object.freeze({key:s.key,reason,started:s.started,skipped:skip&&current,manual:s.manual,committed:s.committed});
 document.dispatchEvent(new CustomEvent('nq-entry-cinema-closed',{detail}));
 if(current&&cancel&&s.preflight&&!s.committed)deliver(s.onCancel,detail);
 else{if(current&&skip)deliver(s.onSkip,detail);if(current&&deliverDone&&contextCurrent(s))deliver(s.onDone,detail);}
 if(!active&&current&&contextCurrent(s)&&restoreFocus&&focusWasHere&&!anotherModal()&&visible(s.focus))s.focus.focus({preventScroll:true});return true;
}
function closeGracefully(reason,skip=false){
 const s=active;if(!s||s.closing||!valid(s))return false;
 if(s.preflight&&!s.committed)return finish('cancelled',{cancel:true,deliverDone:false});
 s.closing=true;s.closeRequest={reason,skip};view.reason=reason;clearPhase();clearTimeout(loadTimer);clearTimeout(stallTimer);loadTimer=stallTimer=0;s.prologue?.dispose();s.prologue=null;stage('closing');window.NQMovieArt?.close(dialog,{onGain:gain=>{s.exitGain=gain;syncAudio(s);}});if(s.music){s.music.beginExit();nodes?.video?.pause();}
 nodes.next.hidden=nodes.play.hidden=nodes.sound.hidden=nodes.volumeControl.hidden=true;nodes.status.textContent='Retornando.';
 schedulePhase(s,motion.matches?80:340,()=>finish(reason,{skip}));return true;
}
function checkContext(){if(!active)return;if(!eligible()||!valid(active)){finish('context-changed',{deliverDone:false,restoreFocus:false});return;}if(!dialog?.isConnected||!dialog.open){finish('removed',{cancel:active.preflight&&!active.committed});return;}if(anotherModal())finish('interrupted',{cancel:active.preflight&&!active.committed,restoreFocus:false});}
function fail(reason,error){
 const s=active;if(!s||s.closing||!valid(s))return;view.error=error?String(error):reason;s.mediaFailed=true;view.available=false;clearTimeout(loadTimer);clearTimeout(stallTimer);loadTimer=stallTimer=0;clearVideo();holdNativeAudio(s,false);
 if(s.prologueActive)return;if(!s.storyContinued){nodes.status.textContent='O filme não está disponível. Você pode ler e continuar sem ele.';nodes.play.hidden=nodes.sound.hidden=nodes.volumeControl.hidden=true;return;}closeGracefully(reason,false);
}
function sourceFor(m){if(m?.available!==true||m?.approved!==true||typeof m.source!=='string')return null;try{const u=new URL(m.source,location.href);return u.origin===location.origin&&['http:','https:'].includes(u.protocol)?u.href:null;}catch(_){return null;}}
function maximumGainFor(m){if(!m||!Object.prototype.hasOwnProperty.call(m,'maximumLinearPlaybackGain'))return 1;const v=m.maximumLinearPlaybackGain;return typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1?v:null;}
function holdNativeAudio(s,enabled){
 if(enabled){if(!s.releaseNativeAudio){const release=window.NQNativeCinemaAudio?.acquire?.();if(typeof release!=='function')return false;s.releaseNativeAudio=release;}return true;}
 const release=s.releaseNativeAudio;s.releaseNativeAudio=null;release?.();return true;
}
function syncAudio(s){
 const v=nodes?.video;if(!v||active!==s||!valid(s))return;const volume=s.userVolume*s.maximumLinearPlaybackGain*(s.exitGain??1);
 if(s.music?.failed)s.soundOptIn=false;
 const running=!v.paused||(s.closing&&s.music?.tailPlaying);
 if(!holdNativeAudio(s,s.soundOptIn&&running&&volume>0))s.soundOptIn=false;
 const muted=!s.soundOptIn,videoMuted=!!s.music||muted;
 if(v.muted!==videoMuted)v.muted=videoMuted;const videoVolume=s.music?0:volume;if(Math.abs(v.volume-videoVolume)>1e-6)v.volume=videoVolume;
 s.music?.sync(!muted,volume);
 Object.assign(view,{muted,soundOptIn:s.soundOptIn,userVolume:s.userVolume,maximumLinearPlaybackGain:s.maximumLinearPlaybackGain,effectiveVolume:volume,audibleVolume:muted?0:volume});
 nodes.volume.value=String(Math.round(s.userVolume*100));nodes.volume.setAttribute('aria-valuetext',nodes.volume.value+'%');nodes.volumeOutput.textContent=nodes.volume.value+'%';nodes.sound.textContent=muted?'Ativar som':'Silenciar';nodes.sound.setAttribute('aria-pressed',String(!muted));
}
function controls(){return [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(visible);}
function keydown(e){
 if(!active)return;e.stopPropagation();if(e.key==='Escape'){e.preventDefault();if(e.isTrusted)closeGracefully('skip',true);}
 else if(e.key==='Tab'){const a=controls(),first=a[0],last=a[a.length-1];if(!first){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){e.preventDefault();first.focus();}}
}
function ensureDialog(){
 if(dialog?.isConnected)return;dialog=document.createElement('dialog');dialog.id='nqEntryCinema';dialog.className='nq-entry-cinema';dialog.setAttribute('aria-labelledby','nqEntryCinemaTitle');dialog.setAttribute('aria-describedby','nqEntryCinemaSubtitle nqEntryCinemaStatus');
 dialog.innerHTML='<div class="nq-entry-cinema__layout"><header class="nq-entry-cinema__top"><span class="nq-entry-cinema__chapter"></span><button type="button" class="nq-entry-cinema__close" aria-label="Fechar introdução">×</button></header><div class="nq-entry-cinema__stage"><div class="nq-entry-cinema__frame"><div class="nq-entry-cinema__aperture"><section class="nq-entry-cinema__story" role="region" tabindex="0" aria-label="História de introdução"><div class="nq-entry-cinema__story-content"><p class="nq-entry-cinema__eyebrow">NEFROQUEST</p><h2 id="nqEntryCinemaTitle"></h2><p id="nqEntryCinemaSubtitle"></p><div class="nq-entry-cinema__paragraphs"></div><p class="nq-entry-cinema__benefit" hidden></p></div></section></div></div></div><footer class="nq-entry-cinema__footer"><p id="nqEntryCinemaStatus" role="status"></p><div class="nq-entry-cinema__controls"><button type="button" class="nq-entry-cinema__next">Continuar para o filme</button><button type="button" class="nq-entry-cinema__play" hidden>Pausar filme</button><button type="button" class="nq-entry-cinema__sound" hidden>Ativar som</button><label class="nq-entry-cinema__volume" hidden><span>Volume</span><input type="range" min="0" max="100" step="1" value="100" data-nq-entry-volume aria-label="Volume do filme" aria-valuetext="100%"><output aria-hidden="true">100%</output></label><button type="button" class="nq-entry-cinema__skip" data-nq-entry-skip>Pular introdução</button></div></footer></div>';
 const q=x=>dialog.querySelector(x);nodes={chapter:q('.nq-entry-cinema__chapter'),title:q('h2'),subtitle:q('#nqEntryCinemaSubtitle'),story:q('.nq-entry-cinema__story'),paragraphs:q('.nq-entry-cinema__paragraphs'),benefit:q('.nq-entry-cinema__benefit'),frame:q('.nq-entry-cinema__frame'),aperture:q('.nq-entry-cinema__aperture'),status:q('[role="status"]'),close:q('.nq-entry-cinema__close'),skip:q('.nq-entry-cinema__skip'),next:q('.nq-entry-cinema__next'),play:q('.nq-entry-cinema__play'),sound:q('.nq-entry-cinema__sound'),volumeControl:q('.nq-entry-cinema__volume'),volume:q('.nq-entry-cinema__volume input'),volumeOutput:q('.nq-entry-cinema__volume output'),video:null};
 try{const markup=window.NQBattleIntro?.frameMarkup?.();if(typeof markup==='string'&&markup){nodes.frame.insertAdjacentHTML('beforeend',markup);view.frameReady=true;}}catch(_){view.frameReady=false;}dialog.dataset.frameReady=String(view.frameReady);
 nodes.close.addEventListener('click',e=>{if(e.isTrusted)closeGracefully('skip',true);});nodes.skip.addEventListener('click',e=>{if(!e.isTrusted||!active||active.closing)return;if(active.prologue){active.prologue.skip();return;}if(active.preflight&&!active.committed)continueStory(active,true);else closeGracefully('skip',true);});nodes.next.addEventListener('click',e=>{if(e.isTrusted&&active){if(active.prologue){active.prologue.next();nodes.play.textContent='Pausar história';}else continueStory(active,false);}});
 nodes.play.addEventListener('click',e=>{if(!e.isTrusted||!active||!valid(active)||!nodes.video||active.closing)return;if(active.prologue){nodes.play.textContent=active.prologue.toggle()?'Continuar história':'Pausar história';return;}if(nodes.video.paused)requestPlay(active);else nodes.video.pause();});
 nodes.sound.addEventListener('click',e=>{if(!e.isTrusted||!active||!valid(active)||active.closing||!nodes.video)return;active.soundOptIn=!active.soundOptIn;syncAudio(active);});nodes.volume.addEventListener('input',e=>{if(!e.isTrusted||!active||!valid(active)||active.closing||!nodes.video)return;active.userVolume=Math.max(0,Math.min(1,Number(nodes.volume.value)/100));syncAudio(active);});
 dialog.addEventListener('keydown',keydown,true);dialog.addEventListener('cancel',e=>{e.preventDefault();if(e.isTrusted)closeGracefully('skip',true);});dialog.addEventListener('close',()=>{if(active&&!dialog.open)finish('closed',{cancel:active.preflight&&!active.committed});});document.body.appendChild(dialog);
}
function requestPlay(s){
 const v=nodes?.video;if(!v||active!==s||!valid(s)||s.closing||!s.storyContinued||!s.revealComplete)return;
 if(!s.started&&!loadTimer)loadTimer=setTimeout(()=>{if(active===s&&valid(s)&&!s.started)fail('media-timeout');},12000);
 if(s.soundOptIn&&!holdNativeAudio(s,true)){s.soundOptIn=false;syncAudio(s);}
 try{const promise=v.play();if(promise?.catch)promise.catch(e=>{if(active===s&&nodes.video===v&&!s.closing)fail('playback-unavailable',e?.name||e);});}catch(e){if(active===s&&!s.closing)fail('playback-unavailable',e?.name||e);}
}
function beginFilm(s){
 if(active!==s||!valid(s)||s.closing||s.revealBegun||s.prologueActive)return;if(s.mediaFailed||!s.source){closeGracefully('media-unavailable',false);return;}
 if(!view.firstFrameReady){stage('loading');nodes.status.textContent='Preparando o filme. Você também pode pular.';return;}
 s.revealBegun=true;stage('revealing');dialog.dataset.storyVisible='false';
 const play=()=>{if(active!==s||!valid(s)||s.closing)return;s.revealComplete=true;const focus=document.activeElement,moveFocus=focus===document.body||focus===dialog||focus===nodes.next||nodes.story.contains(focus);nodes.story.hidden=true;nodes.play.hidden=nodes.sound.hidden=nodes.volumeControl.hidden=false;nodes.play.textContent='Reproduzir filme';stage('ready');nodes.status.textContent='Você pode pausar ou pular a qualquer momento.';if(moveFocus)nodes.play.focus({preventScroll:true});requestPlay(s);};
 play();
}
async function continueStory(s,skip){
 if(active!==s||!valid(s)||s.closing||s.continuing||s.storyContinued)return;s.continuing=true;stage('committing');nodes.next.disabled=nodes.skip.disabled=true;nodes.story.setAttribute('aria-busy','true');nodes.status.textContent=s.preflight?'Iniciando a jornada.':'Preparando a transição.';
 let accepted=false;try{accepted=typeof s.onContinue==='function'?await s.onContinue()===true:true;}catch(_){accepted=false;}
 if(active!==s||s.done)return;s.continuing=false;nodes.next.disabled=nodes.skip.disabled=false;nodes.story.removeAttribute('aria-busy');if(!valid(s)){finish('context-changed',{deliverDone:false,restoreFocus:false});return;}
 if(!accepted){stage('story');nodes.status.textContent='Não foi possível continuar. Sua sessão foi preservada.';return;}
 s.committed=true;view.committed=true;nodes.close.setAttribute('aria-label','Pular introdução e continuar');nodes.skip.textContent='Pular introdução';s.storyContinued=true;nodes.next.hidden=true;
 if(skip){closeGracefully('skip',true);return;}let shouldPlay=true;try{if(typeof s.shouldPlay==='function')shouldPlay=s.shouldPlay()===true;}catch(_){shouldPlay=false;}
 if(!shouldPlay){closeGracefully('already-seen',false);return;}beginFilm(s);
}
function attachVideo(s){
 const v=document.createElement('video');nodes.video=v;v.className='nq-entry-cinema__video';v.muted=v.defaultMuted=true;v.playsInline=true;v.preload='auto';v.controls=false;v.tabIndex=-1;v.setAttribute('aria-label',s.title+' — filme de introdução');const current=()=>active===s&&nodes.video===v&&valid(s);
 v.addEventListener('playing',e=>{if(current()&&(!s.revealComplete||!s.storyContinued||s.closing)){v.pause();if(!s.storyContinued){try{v.currentTime=0;}catch(_){}}return;}if(!current()||!e.isTrusted||v.readyState<2||v.paused||v.ended||v.currentSrc!==s.source)return;clearTimeout(loadTimer);clearTimeout(stallTimer);loadTimer=stallTimer=0;stage('playing');view.paused=false;nodes.play.textContent='Pausar filme';if(!s.started){s.started=view.started=true;deliver(s.onStarted,Object.freeze({key:s.key,source:s.source,manual:s.manual}));}});
 v.addEventListener('pause',()=>{if(!current()||s.closing||!s.revealComplete||!s.storyContinued)return;holdNativeAudio(s,false);view.paused=true;stage('paused');nodes.play.textContent='Continuar filme';});v.addEventListener('volumechange',()=>{if(current())syncAudio(s);});v.addEventListener('ended',e=>{if(current()&&e.isTrusted)closeGracefully('ended',false);});v.addEventListener('error',()=>{if(current()&&!s.closing)fail('media-error',v.error?.code);});v.addEventListener('timeupdate',()=>{if(current()){clearTimeout(stallTimer);stallTimer=0;}});
 v.addEventListener('stalled',()=>{if(!current()||s.closing||v.paused||document.hidden)return;clearTimeout(stallTimer);stallTimer=setTimeout(()=>{if(current()&&!v.paused&&!document.hidden)fail('media-stalled');},8000);});
 const firstFrame=e=>{if(!current()||s.closing||view.firstFrameReady||!e.isTrusted||v.readyState<2||v.currentSrc!==s.source)return;clearTimeout(loadTimer);loadTimer=0;v.pause();view.firstFrameReady=true;if(s.storyContinued)beginFilm(s);};v.addEventListener('loadeddata',firstFrame);v.addEventListener('canplay',firstFrame);
 nodes.aperture.prepend(v);s.music=window.NQMovieSound?.attach(v,s.artKey,()=>{if(current()){s.soundOptIn=false;syncAudio(s);nodes.status.textContent='A música não está disponível. O filme continua sem som.';}});window.NQMovieArt?.attach(dialog,v,nodes.aperture,s.artKey);syncAudio(s);v.src=s.source;loadTimer=setTimeout(()=>{if(current()&&!view.firstFrameReady)fail('media-timeout');},12000);v.load();
}
function showStory(s){if(active!==s||!valid(s)||s.closing)return;stage('story');dialog.dataset.storyVisible='true';nodes.next.hidden=false;nodes.status.textContent=s.mediaFailed?'O filme não está disponível. Você pode ler e continuar sem ele.':'Leia no seu ritmo. Continue quando quiser.';}
function open(o={}){
 if(o.preflight===true||disposed||!eligible()||!o.key||typeof o.isCurrent!=='function')return false;
 if(active){if(active.key===String(o.key)&&valid(active))return true;if(valid(active))return false;finish('context-changed',{deliverDone:false,restoreFocus:false});}if(anotherModal())return false;
 const source=sourceFor(o.media),gain=maximumGainFor(o.media);if(o.media?.available===true&&(!source||gain===null))return false;const kind=['camara','chamber'].includes(o.kind)?'camara':o.kind==='battle'?'battle':'hero';
 const s={key:String(o.key),kind,title:kind==='camara'?'CÂMARA DO EQUILÍBRIO':String(o.title||'Início da jornada'),subtitle:kind==='camara'?'Alquimista Renal':String(o.subtitle||''),paragraphs:Array.isArray(o.storyParagraphs)?o.storyParagraphs.filter(v=>typeof v==='string'&&v.length):[],benefit:typeof o.benefitText==='string'?o.benefitText:'',isCurrent:o.isCurrent,onStarted:o.onStarted,onSkip:o.onSkip,onDone:o.onDone,onContinue:o.onContinue,onCancel:o.onCancel,shouldPlay:o.shouldPlay,preflight:o.preflight===true,committed:o.preflight!==true,manual:o.manual===true,focus:document.activeElement,source,artKey:o.artKey||(kind==='camara'?'chamber':kind==='battle'?'battle':'nephros'),started:false,soundOptIn:false,userVolume:1,maximumLinearPlaybackGain:gain??1,done:false,visibilityResume:false,closing:false,continuing:false,storyContinued:false,mediaFailed:!source,revealBegun:false,revealComplete:false};
 if(!valid(s))return false;ensureDialog();active=s;revision++;Object.assign(view,{open:true,key:s.key,kind:s.kind,stage:'black',manual:s.manual,available:!!source,source,started:false,muted:true,paused:true,visibilityPaused:false,soundOptIn:false,userVolume:1,maximumLinearPlaybackGain:s.maximumLinearPlaybackGain,effectiveVolume:s.maximumLinearPlaybackGain,audibleVolume:0,firstFrameReady:false,frameVisible:true,reason:null,error:null,reducedMotion:motion.matches,preflight:s.preflight,committed:s.committed,storyParagraphs:s.paragraphs.length});
 Object.assign(dialog.dataset,{kind:s.kind,stage:'black',frameVisible:'true',maskOpen:'true',storyVisible:'false',visibilityPaused:'false',reducedMotion:String(motion.matches)});nodes.chapter.textContent=s.manual?'REVER INTRODUÇÃO':s.kind==='camara'?'ALQUIMISTA RENAL':s.kind==='battle'?'CONFRONTO FINAL':'INÍCIO DA JORNADA';nodes.title.textContent=s.title;nodes.subtitle.textContent=s.subtitle;
 nodes.paragraphs.replaceChildren(...s.paragraphs.map(value=>{const p=document.createElement('p');p.textContent=value;return p;}));nodes.benefit.textContent=s.benefit;nodes.benefit.hidden=!s.benefit;nodes.story.hidden=false;nodes.story.scrollTop=0;nodes.story.removeAttribute('aria-busy');nodes.next.disabled=nodes.skip.disabled=false;nodes.next.hidden=true;nodes.next.textContent=s.preflight?'Iniciar Jornada':'Continuar para o filme';nodes.skip.textContent=s.preflight?'Pular e iniciar jornada':'Pular introdução';nodes.close.setAttribute('aria-label',s.preflight?'Cancelar início da jornada':'Pular introdução e continuar');nodes.play.hidden=nodes.sound.hidden=nodes.volumeControl.hidden=true;nodes.volume.value='100';nodes.volumeOutput.textContent='100%';nodes.volume.setAttribute('aria-valuetext','100%');nodes.play.textContent='Pausar filme';nodes.sound.textContent='Ativar som';nodes.sound.setAttribute('aria-pressed','false');nodes.status.textContent='Preparando a introdução.';
 restoreScroll();const body=document.body;scrollLock={body,value:body.style.getPropertyValue('overflow'),priority:body.style.getPropertyPriority('overflow')};body.style.setProperty('overflow','hidden');try{dialog.showModal();}catch(_){finish('dialog-unavailable',{deliverDone:false,restoreFocus:false});return false;}nodes.skip.focus({preventScroll:true});observer=new MutationObserver(checkContext);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','inert','open','aria-modal']});monitor=setInterval(checkContext,100);
 s.storyContinued=true;nodes.story.hidden=true;nodes.next.hidden=true;s.prologueActive=['nephros','aquaria','glomerulus'].includes(s.artKey);
 if(source){try{attachVideo(s);}catch(e){fail('media-unavailable',e?.name||e);}}
 if(s.prologueActive){stage('prologue');nodes.next.hidden=nodes.play.hidden=false;nodes.next.textContent='Avançar';nodes.play.textContent='Pausar história';nodes.skip.textContent='Pular histórias';nodes.status.textContent='Você pode pausar, avançar ou pular as histórias.';
  s.prologue=window.NQCharacterPrologue?.open(nodes.aperture,s.artKey,s.title,()=>{if(active!==s||s.closing||!valid(s))return;s.prologue=null;s.prologueActive=false;nodes.next.hidden=true;nodes.skip.textContent='Pular introdução';beginFilm(s);});
  if(!s.prologue){s.prologueActive=false;beginFilm(s);}
 }else beginFilm(s);return true;
}
function visibilityChanged(){if(!active)return;const s=active,v=nodes.video;if(!valid(s)){checkContext();return;}if(document.hidden&&s.closing){finish(s.closeRequest?.reason||'closed',{skip:s.closeRequest?.skip===true});return;}if(document.hidden){s.visibilityResume=!!v&&!v.paused;view.visibilityPaused=true;dialog.dataset.visibilityPaused='true';pausePhase();v?.pause();}else{view.visibilityPaused=false;dialog.dataset.visibilityPaused='false';resumePhase();if(v&&s.visibilityResume&&!s.closing&&!motion.matches&&!anotherModal())requestPlay(s);s.visibilityResume=false;}}
const outsideKeyboard=e=>{if(!active)return;if(e.key==='Escape'||dialog?.contains(e.target)){keydown(e);e.stopImmediatePropagation();return;}e.preventDefault();e.stopImmediatePropagation();nodes?.close.focus({preventScroll:true});};
const motionChanged=()=>{view.reducedMotion=motion.matches;if(dialog)dialog.dataset.reducedMotion=String(motion.matches);if(!motion.matches||!active)return;const s=active;s.visibilityResume=false;nodes?.video?.pause();if(s.closing){finish(s.closeRequest?.reason||'closed',{skip:s.closeRequest?.skip===true});return;}if(view.stage==='black'){clearPhase();showStory(s);}else if(view.stage==='revealing'){clearPhase();s.revealComplete=true;nodes.story.hidden=true;nodes.play.hidden=nodes.sound.hidden=nodes.volumeControl.hidden=false;stage('ready');nodes.play.textContent='Reproduzir filme';nodes.status.textContent='Movimento reduzido: reproduza quando quiser ou pule.';}};
const cancelContext=()=>finish('context-changed',{cancel:true,deliverDone:false,restoreFocus:false}),pagehide=()=>finish('pagehide',{cancel:true,deliverDone:false,restoreFocus:false});
// Capture prevents older native overlay listeners from activating underlying controls.
 document.addEventListener('keydown',outsideKeyboard,true);document.addEventListener('visibilitychange',visibilityChanged);window.addEventListener('pagehide',pagehide);window.addEventListener('popstate',cancelContext);fine.addEventListener('change',checkContext);coarse.addEventListener('change',checkContext);motion.addEventListener('change',motionChanged);
window.NQEntryCinema=Object.freeze({open,close:reason=>active?.preflight&&!active.committed?finish(String(reason||'cancelled'),{cancel:true,deliverDone:false}):finish(String(reason||'closed')),cancelContext,dispose(){disposed=true;finish('disposed',{cancel:true,deliverDone:false});clearTimers();observer?.disconnect();observer=null;document.removeEventListener('keydown',outsideKeyboard,true);document.removeEventListener('visibilitychange',visibilityChanged);window.removeEventListener('pagehide',pagehide);window.removeEventListener('popstate',cancelContext);fine.removeEventListener('change',checkContext);coarse.removeEventListener('change',checkContext);motion.removeEventListener('change',motionChanged);dialog?.remove();dialog=nodes=null;restoreScroll();},get inspection(){return Object.freeze({...view,revision,disposed,videoPresent:!!nodes?.video,videoReadyState:nodes?.video?.readyState||0});}});
}());
