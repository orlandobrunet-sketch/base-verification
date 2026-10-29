/* Isolated local presentation. Never reads/writes combat, rewards, saves or RNG. */
(function () {
  'use strict';
  const canonicalSource='/assets/cinema/v1/NefroQuest-camera-isolada-teste-04.mp4';
  const canonicalSHA256='535a8a93b93a49f2cfe9c1284904c26e2287f5fcada2ebf48827c5a789136b9c';
  const desktop=matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)');
  const coarse=matchMedia('(any-pointer:coarse)');
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  const seen=new Set();
  let dialog=null,nodes=null,active=null,generation=0,stageGeneration=0;
  let phaseTimer=0,phaseDeadline=0,phaseRemaining=0,phaseAction=null,mediaTimer=0,closeTimer=0;
  let previousFocus=null,scrollSnapshot=null,scrollReleaseObserver=null,observer=null,disposed=false;
  const state={open:false,stage:'closed',contextKey:null,source:canonicalSource,available:false,
    reducedMotion:motion.matches,muted:true,paused:true,firstFrameReady:false,mediaError:null,
    closingReason:null,sourceProvenance:null,played:false,ended:false,
    userVolume:1,maximumLinearPlaybackGain:1,effectiveVolume:1,soundOptIn:false};
  const eligible=()=>desktop.matches&&!coarse.matches&&!(navigator.maxTouchPoints>0);
  const visible=node=>!!node&&node.isConnected&&!node.hidden&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden';
  const content=(node,value)=>{const text=String(value||'');if(node.textContent!==text)node.textContent=text;};
  function othersOpen(){
    return [...document.querySelectorAll('dialog[open], [aria-modal="true"], .nq-overlay, #arquiQ9Popup')]
      .some(node=>node!==dialog&&!dialog?.contains(node)&&visible(node));
  }
  function current(token){return !!active&&generation===token&&!disposed&&state.open;}
  function clearPhase(){clearTimeout(phaseTimer);phaseTimer=0;phaseAction=null;phaseRemaining=0;phaseDeadline=0;}
  function clearMedia(){clearTimeout(mediaTimer);mediaTimer=0;}
  function pausePhase(){
    if(phaseTimer){phaseRemaining=Math.max(0,phaseDeadline-performance.now());clearTimeout(phaseTimer);phaseTimer=0;}
    if(dialog)dialog.dataset.timelinePaused='true';
  }
  function resumePhase(){
    if(!active||phaseTimer||!phaseAction||!phaseRemaining||motion.matches)return;
    if(document.hidden||othersOpen()){dialog.dataset.timelinePaused='true';return;}
    dialog.dataset.timelinePaused='false';
    const token=generation,revision=stageGeneration,action=phaseAction,delay=phaseRemaining;
    phaseDeadline=performance.now()+delay;
    phaseTimer=setTimeout(()=>{phaseTimer=0;phaseRemaining=0;if(current(token)&&revision===stageGeneration)action();},delay);
  }
  function schedule(delay,action){
    clearPhase();phaseAction=action;phaseRemaining=delay;resumePhase();
  }
  function setStage(stage){
    clearPhase();stageGeneration++;state.stage=stage;
    dialog.dataset.stage=stage;
    dialog.dataset.timelinePaused='false';
    // Keep the actual last frame/card mounted until its fade to black completes.
    if(stage==='closing'||stage==='leaving')return;
    dialog.dataset.frameVisible=String(['loading','opening','playing','paused','ready','unavailable'].includes(stage));
    const focused=document.activeElement;
    nodes.next.hidden=!['title','allies'].includes(stage);
    nodes.play.hidden=!['playing','paused','ready'].includes(stage);
    nodes.sound.hidden=!['opening','playing','paused','ready'].includes(stage);
    nodes.volumeLabel.hidden=nodes.sound.hidden;
    nodes.titleCard.hidden=!['title','allies'].includes(stage);
    nodes.film.hidden=!['loading','opening','playing','paused','ready','unavailable'].includes(stage);
    nodes.message.hidden=stage!=='unavailable'&&stage!=='loading';
    nodes.play.textContent=stage==='playing'?'Pausar':'Reproduzir';
    nodes.play.setAttribute('aria-label',stage==='playing'?'Pausar o filme de introdução':'Reproduzir o filme de introdução');
    nodes.skip.textContent=stage==='unavailable'?'Ir para a batalha':'Pular introdução';
    if(focused&&dialog.contains(focused)&&!visible(focused))nodes.skip.focus({preventScroll:true});
  }
  function status(value){content(nodes.status,value);}
  function lockScroll(){
    restoreScroll();
    const body=document.body;
    scrollSnapshot={body,overflow:body.style.getPropertyValue('overflow'),priority:body.style.getPropertyPriority('overflow')};
    body.style.setProperty('overflow','hidden');
  }
  function restoreScroll(){
    const snapshot=scrollSnapshot;
    if(!snapshot)return;
    if(snapshot.body.style.getPropertyValue('overflow')!=='hidden'){
      scrollSnapshot=null;scrollReleaseObserver?.disconnect();scrollReleaseObserver=null;return;
    }
    // Do not take ownership of a second overlay's scroll lock.
    if(othersOpen()){
      if(!scrollReleaseObserver){scrollReleaseObserver=new MutationObserver(restoreScroll);scrollReleaseObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','aria-modal','class','style']});}
      return;
    }
    if(snapshot.overflow)snapshot.body.style.setProperty('overflow',snapshot.overflow,snapshot.priority);
    else snapshot.body.style.removeProperty('overflow');
    scrollSnapshot=null;scrollReleaseObserver?.disconnect();scrollReleaseObserver=null;
  }
  function releaseMedia(){
    clearMedia();if(!nodes)return;
    state.soundOptIn=false;state.userVolume=1;syncAudio();
    const film=nodes.video;film.pause();film.muted=true;
    film.removeAttribute('src');film.load();state.paused=true;state.muted=true;
  }
  function finish(reason){
    if(!active)return;
    const detail={contextKey:active.contextKey,reason};
    generation++;clearPhase();clearMedia();clearTimeout(closeTimer);closeTimer=0;observer?.disconnect();observer=null;
    releaseMedia();state.open=false;state.stage='closed';state.closingReason=reason;
    active=null;
    const focusWasInside=dialog.contains(document.activeElement)||document.activeElement===document.body;
    if(dialog.open)dialog.close();
    restoreScroll();
    if(focusWasInside&&!othersOpen()&&visible(previousFocus)&&!previousFocus.closest('[inert]'))previousFocus.focus({preventScroll:true});
    previousFocus=null;
    document.dispatchEvent(new CustomEvent('nq-battle-intro-closed',{detail}));
  }
  function close(reason='closed',immediate=false){
    if(!active||state.stage==='closing'||state.stage==='leaving')return false;
    const token=generation;
    nodes.video.pause();state.paused=true;state.closingReason=String(reason);
    // Freeze the currently painted card/frame before changing stage selectors.
    // In particular, neither a mask reset nor an animation-name change may cut it.
    const cardPaint=getComputedStyle(nodes.titleCard),filmPaint=getComputedStyle(nodes.film);
    const cardOpacity=cardPaint.opacity,filmOpacity=filmPaint.opacity,filmClip=filmPaint.clipPath;
    nodes.titleCard.style.animation='none';nodes.titleCard.style.opacity=cardOpacity;
    nodes.film.style.transition='none';nodes.film.style.opacity=filmOpacity;nodes.film.style.clipPath=filmClip;
    clearMedia();setStage('closing');
    if(immediate||motion.matches){finish(reason);return true;}
    // The page becomes available even if no video event ever arrives.
    closeTimer=setTimeout(()=>{
      if(!current(token))return;
      setStage('leaving');closeTimer=setTimeout(()=>{if(current(token))finish(reason);},250);
    },450);
    return true;
  }
  function unavailable(message){
    if(!active||state.stage==='closing'||state.stage==='leaving')return;
    clearMedia();nodes.video.pause();state.paused=true;
    state.mediaError=message;setStage('unavailable');
    content(nodes.messageTitle,'O confronto aguarda.');
    content(nodes.messageText,'O filme de introdução não está disponível nesta prévia. Você pode seguir para a batalha.');
    status('Filme indisponível. A batalha permanece disponível.');
    nodes.skip.focus({preventScroll:true});
  }
  function configure(){
    const raw=window.NQ_BATTLE_INTRO_CONFIG||{};
    // Owner selected camera04 for the new local revision.
    const source=raw.source===undefined?canonicalSource:raw.source;
    let valid=false;
    try{const url=new URL(source,location.href);valid=url.origin===location.origin&&url.pathname===canonicalSource&&!url.search&&!url.hash;}catch(_){}
    const gain=raw.maximumLinearPlaybackGain;
    return {available:raw.available===true&&raw.approved===true&&raw.sha256===canonicalSHA256&&valid&&
      typeof gain==='number'&&Number.isFinite(gain)&&gain>=0&&gain<=1,
      source:canonicalSource,maximumLinearPlaybackGain:gain,
      provenance:typeof raw.provenance==='string'?raw.provenance:null};
  }
  function syncAudio(){
    if(!nodes)return;
    const gain=Math.max(0,Math.min(1,state.maximumLinearPlaybackGain));
    const value=Math.max(0,Math.min(1,state.userVolume))*gain;
    const muted=!state.soundOptIn||!active;
    if(Math.abs(nodes.video.volume-value)>1e-6)nodes.video.volume=value;
    if(nodes.video.muted!==muted)nodes.video.muted=muted;
    state.effectiveVolume=value;state.muted=muted;
    nodes.sound.textContent=muted?'Ativar som':'Silenciar';nodes.sound.setAttribute('aria-pressed',String(!muted));
    nodes.volume.value=String(Math.round(state.userVolume*100));
    nodes.volume.setAttribute('aria-valuetext',Math.round(state.userVolume*100)+'%');
  }
  function pausePlayback(message){
    if(!active||!['opening','playing','paused','ready'].includes(state.stage))return;
    nodes.video.pause();state.paused=true;if(state.stage!=='paused')setStage('paused');
    if(message)status(message);
  }
  async function play(){
    if(!active||!['playing','paused','ready'].includes(state.stage)||document.hidden||othersOpen())return false;
    if(!state.firstFrameReady)return false;
    const token=generation;
    try{
      await nodes.video.play();
      if(!current(token))return false;
      if(state.stage==='closing'||state.stage==='leaving'){nodes.video.pause();return false;}
      setStage('playing');state.paused=false;state.played=true;status('O confronto começa.');return true;
    }catch(_){
      if(current(token)&&!['closing','leaving'].includes(state.stage)){nodes.video.pause();state.paused=true;setStage('paused');status('Selecione Reproduzir para assistir à introdução.');}
      return false;
    }
  }
  function onFirstFrame(){
    if(!active||state.stage!=='loading'||nodes.video.readyState<2)return;
    clearMedia();state.firstFrameReady=true;nodes.video.pause();state.paused=true;
    setStage(motion.matches?'ready':'opening');status(motion.matches?'Introdução pronta. Selecione Reproduzir para assistir.':'');
    if(motion.matches)return;
    const token=generation;
    schedule(600,()=>{if(!current(token))return;setStage('ready');play();});
  }
  function showFilm(){
    if(!active)return;
    const config=configure();state.available=config.available;state.sourceProvenance=config.provenance;
    state.source=config.source;
    setStage('loading');content(nodes.messageTitle,'O confronto começa.');content(nodes.messageText,'Preparando a introdução…');
    status('Preparando o filme de introdução.');
    if(!config.available){unavailable('Approved intro asset unavailable locally');return;}
    const token=generation;
    state.maximumLinearPlaybackGain=config.maximumLinearPlaybackGain;state.soundOptIn=false;state.userVolume=1;syncAudio();
    nodes.video.src=config.source;nodes.video.preload='auto';nodes.video.load();
    mediaTimer=setTimeout(()=>{if(current(token)&&state.stage==='loading')unavailable('Intro loading timed out');},12000);
    if(nodes.video.readyState>=2)onFirstFrame();
  }
  function showAllies(){
    if(!active)return;
    setStage('allies');content(nodes.eyebrow,'VOCÊ NÃO ESTÁ SOZINHO');
    content(nodes.heading,active.selectedName);
    content(nodes.subtitle,active.allies.join(' e ')+' unem-se ao confronto.');
    content(nodes.subnote,'Seu personagem continua liderando.');
    status('Seus aliados se unem ao confronto.');
    if(!motion.matches)schedule(2400,showFilm);
  }
  function showTitle(){
    if(!active)return;
    setStage('title');content(nodes.eyebrow,'A BATALHA FINAL');content(nodes.heading,'O TRONO DA UREMIA');
    content(nodes.subtitle,'O Arqui-Nefromante aguarda.');content(nodes.subnote,'');status('A batalha final. O Trono da Uremia.');
    if(!motion.matches)schedule(2400,showAllies);
  }
  function next(){if(state.stage==='title')showAllies();else if(state.stage==='allies')showFilm();}
  function focusable(){return [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(visible);}
  function keydown(event){
    if(!active)return;
    // Prevent journey shortcuts from receiving keys typed in this presentation.
    event.stopPropagation();
    if(event.key==='Escape'){event.preventDefault();close('escape');return;}
    if(event.key==='Tab'){
      const items=focusable(),first=items[0],last=items[items.length-1];
      if(!first){event.preventDefault();return;}
      if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
    }
  }
  function reliquaryMarkup(){
    // Decorative metalwork sits below the opaque 16:9 aperture.
    const corner='<svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" focusable="false"><path class="nq-battle-intro__plate" d="M3 3H66L70 7V16H23L16 23V70H7L3 66Z"/><path class="nq-battle-intro__carving" d="M8 8H61M8 8V61M12 16H17L23 10H47M16 12V17L10 23V47"/><path class="nq-battle-intro__edge" d="M26 4H62L67 9M4 26V62L9 67M28 14H54M14 28V54"/><path class="nq-battle-intro__etch" d="m33 7 3 3 3-3m7 0 3 3 3-3M7 33l3 3-3 3m0 7 3 3-3 3"/><path class="nq-battle-intro__gem" d="m13 7 6 6-6 6-6-6Z"/><path class="nq-battle-intro__gem-cut" d="m13 9 4 4-4 4-4-4Z"/></svg>';
    const corners=['nw','ne','se','sw'].map(position=>'<span class="nq-battle-intro__corner nq-battle-intro__corner--'+position+'">'+corner+'</span>').join('');
    const crest='<svg class="nq-battle-intro__crest" viewBox="0 0 80 56" width="72" height="50" aria-hidden="true" focusable="false"><path class="nq-battle-intro__crest-metal" d="m4 24 17-9L40 2l19 13 17 9-10 18-26 12-26-12Z"/><path class="nq-battle-intro__crest-edge" d="m10 25 15-7L40 7l15 11 15 7-8 13-22 10-22-10Z"/><path class="nq-battle-intro__crest-engraving" d="M17 25h8m30 0h8M23 37l7-4m20 0 7 4M40 8v6"/><path class="nq-battle-intro__renal" d="M45 15c9-1 14 7 11 15-2 8-9 14-17 12-6-1-10-7-7-12 2-3 7-2 8-6 1-3-1-7 5-9Z"/><path class="nq-battle-intro__renal-line" d="M46 19c5 1 8 6 6 11-1 5-5 8-10 8m-1-16c3 2 5 4 7 5m-9 2 9 2m-10 4 7-3"/></svg>';
    return '<div class="nq-battle-intro__reliquary" aria-hidden="true">'+corners+crest+'</div>';
  }
  function mount(){
    if(dialog)return true;
    if(typeof HTMLDialogElement==='undefined'||typeof HTMLDialogElement.prototype.showModal!=='function')return false;
    dialog=document.createElement('dialog');dialog.id='nqBattleIntro';dialog.className='nq-battle-intro';
    dialog.setAttribute('aria-label','Introdução do Confronto Final');dialog.setAttribute('aria-modal','true');
    dialog.innerHTML='<div class="nq-battle-intro__surround"><div class="nq-battle-intro__top"><span>NEFROQUEST · CONFRONTO FINAL</span><button type="button" class="nq-battle-intro__close" aria-label="Fechar introdução">×</button></div><div class="nq-battle-intro__shell"><section class="nq-battle-intro__card"><p class="nq-battle-intro__eyebrow"></p><h2 class="nq-battle-intro__heading"></h2><p class="nq-battle-intro__subtitle"></p><p class="nq-battle-intro__subnote"></p></section><div class="nq-battle-intro__film" hidden><video class="nq-battle-intro__video" playsinline muted preload="none" aria-label="Filme de introdução do Confronto Final" tabindex="-1"></video><div class="nq-battle-intro__message" hidden><h2></h2><p></p></div></div>'+reliquaryMarkup()+'</div><div class="nq-battle-intro__footer"><p class="nq-battle-intro__status" role="status" aria-live="polite" aria-atomic="true"></p><div class="nq-battle-intro__controls"><button type="button" class="nq-battle-intro__next" hidden>Continuar</button><button type="button" class="nq-battle-intro__play" hidden>Reproduzir</button><button type="button" class="nq-battle-intro__sound" aria-pressed="false" hidden>Ativar som</button><label class="nq-battle-intro__volume-label" hidden>Volume<input class="nq-battle-intro__volume" data-nq-battle-volume type="range" min="0" max="100" step="1" value="100" aria-label="Volume do filme"></label><button type="button" class="nq-battle-intro__skip">Pular introdução</button></div></div></div>';
    const select=name=>dialog.querySelector('.nq-battle-intro__'+name);
    nodes={titleCard:select('card'),eyebrow:select('eyebrow'),heading:select('heading'),subtitle:select('subtitle'),subnote:select('subnote'),film:select('film'),video:select('video'),message:select('message'),messageTitle:select('message').querySelector('h2'),messageText:select('message').querySelector('p'),status:select('status'),next:select('next'),play:select('play'),sound:select('sound'),volumeLabel:select('volume-label'),volume:select('volume'),skip:select('skip'),close:select('close')};
    nodes.video.muted=true;nodes.video.playsInline=true;
    nodes.next.addEventListener('click',next);nodes.skip.addEventListener('click',()=>close('skipped'));
    nodes.close.addEventListener('click',()=>close('closed'));
    nodes.play.addEventListener('click',()=>state.stage==='playing'?pausePlayback('Introdução pausada.'):play());
    nodes.sound.addEventListener('click',event=>{
      if(!event.isTrusted)return;
      if(!active||!state.firstFrameReady)return;
      state.soundOptIn=!state.soundOptIn;syncAudio();
    });
    nodes.volume.addEventListener('input',event=>{if(!active||!event.isTrusted)return;state.userVolume=Math.max(0,Math.min(1,Number(nodes.volume.value)/100));syncAudio();});
    nodes.video.addEventListener('volumechange',()=>{if(active)syncAudio();});
    nodes.video.addEventListener('loadeddata',onFirstFrame);
    nodes.video.addEventListener('error',()=>{if(active&&!['closing','leaving','closed'].includes(state.stage))unavailable('Intro video element error');});
    nodes.video.addEventListener('ended',event=>{if(event.isTrusted&&nodes.video.ended&&active&&['playing','paused'].includes(state.stage)){state.ended=true;close('ended');}});
    dialog.addEventListener('keydown',keydown,true);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close('escape');});
    dialog.addEventListener('close',()=>{if(active&&!dialog.open)finish('external-close');});
    document.body.append(dialog);return true;
  }
  function open(request={}){
    if(disposed||!eligible()||document.hidden||active||othersOpen())return false;
    const key=typeof request.contextKey==='string'?request.contextKey:'';
    const selectedName=typeof request.selectedName==='string'?request.selectedName.trim():'';
    const allies=Array.isArray(request.allies)?request.allies.filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim()):[];
    if(!key||!selectedName||allies.length!==2||(!request.manual&&seen.has(key))||!mount())return false;
    active={contextKey:key,character:request.character,selectedName,allies};generation++;
    previousFocus=document.activeElement;
    Object.assign(state,{open:true,stage:'entering',contextKey:key,available:false,reducedMotion:motion.matches,
      muted:true,paused:true,firstFrameReady:false,mediaError:null,closingReason:null,played:false,ended:false,userVolume:1,maximumLinearPlaybackGain:1,effectiveVolume:1,soundOptIn:false});
    nodes.titleCard.style.removeProperty('animation');nodes.titleCard.style.removeProperty('opacity');
    nodes.film.style.removeProperty('transition');nodes.film.style.removeProperty('opacity');nodes.film.style.removeProperty('clip-path');
    dialog.dataset.frameVisible='false';dialog.dataset.stage='entering';nodes.titleCard.hidden=true;nodes.film.hidden=true;
    nodes.next.hidden=true;nodes.play.hidden=true;nodes.sound.hidden=true;nodes.volumeLabel.hidden=true;syncAudio();nodes.skip.textContent='Pular introdução';
    try{dialog.showModal();}catch(_){active=null;state.open=false;state.stage='closed';return false;}
    if(!request.manual)seen.add(key);
    lockScroll();nodes.skip.focus({preventScroll:true});
    const token=generation;
    observer=new MutationObserver(()=>{if(!current(token)||!othersOpen())return;pausePhase();pausePlayback('Introdução pausada por outra janela.');});
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','aria-modal','class','style']});
    if(motion.matches)showTitle();else schedule(250,showTitle);
    return true;
  }
  function changedVisibility(){
    if(!active)return;
    if(document.hidden){pausePhase();pausePlayback('Introdução pausada enquanto a janela está oculta.');}
    else resumePhase();
  }
  function changedEligibility(){if(active&&!eligible())finish('desktop-only');}
  function changedMotion(){
    state.reducedMotion=motion.matches;
    if(!active||!motion.matches)return;
    if(['closing','leaving'].includes(state.stage)){finish(state.closingReason||'reduced-motion');return;}
    pausePhase();pausePlayback('Movimento reduzido. Selecione Reproduzir se quiser assistir ao filme.');
  }
  function navigation(){if(active)finish('navigation');}
  document.addEventListener('visibilitychange',changedVisibility);
  window.addEventListener('pagehide',navigation);window.addEventListener('popstate',navigation);
  desktop.addEventListener('change',changedEligibility);coarse.addEventListener('change',changedEligibility);motion.addEventListener('change',changedMotion);
  window.NQBattleIntro={open,frameMarkup:reliquaryMarkup,close:()=>close('closed'),skip:()=>close('skipped'),
    cancelContext(){
      if(!active)return false;
      finish('context-lost');return true;
    },
    dispose(){if(disposed)return;if(active)finish('disposed');disposed=true;clearPhase();clearMedia();clearTimeout(closeTimer);observer?.disconnect();dialog?.remove();dialog=null;nodes=null;
      document.removeEventListener('visibilitychange',changedVisibility);window.removeEventListener('pagehide',navigation);window.removeEventListener('popstate',navigation);desktop.removeEventListener('change',changedEligibility);coarse.removeEventListener('change',changedEligibility);motion.removeEventListener('change',changedMotion);},
    get inspection(){return {...state,eligible:eligible(),video: nodes?{currentTime:nodes.video.currentTime,duration:Number.isFinite(nodes.video.duration)?nodes.video.duration:null,paused:nodes.video.paused,muted:nodes.video.muted,volume:nodes.video.volume,readyState:nodes.video.readyState,src:nodes.video.currentSrc||null}:null};}
  };
})();
