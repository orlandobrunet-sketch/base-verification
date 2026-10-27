/* Isolated A3 desktop presentation.
   Native state owns answers, HP, lives, milestones, completion and rewards. */
(function () {
  'use strict';
  const names = {nephros:'Dr. Nephros', aquaria:'Dra. Aquaria', glomerulus:'Dr. Glomerulus'};
  const phases = Object.freeze([
    Object.freeze({id:'throne', title:'O Trono da Uremia', chapter:'O confronto começa', text:'Após noventa batalhas, você chega ao Trono da Uremia.'}),
    Object.freeze({id:'mist', title:'A Névoa da Azotemia', chapter:'O feitiço do Arqui-Nefromante', text:'A névoa tóxica invade seus sentidos. Mas a chama do conhecimento ainda pulsa dentro de você.'}),
    Object.freeze({id:'flame', title:'A Chama dos Néfrons', chapter:'A força retorna', text:'A névoa se dissipa. Seus equipamentos voltam a brilhar — a força retorna!'}),
    Object.freeze({id:'last', title:'A Última Prova', chapter:'Uma última questão', text:'Uma última questão. Uma última resposta. O destino dos rins do reino depende de você.'})
  ]);
  function phaseForProgress(progress) {
    if (!Number.isSafeInteger(progress) || progress < 0 || progress > 9) return null;
    return phases[progress < 3 ? 0 : progress < 8 ? 1 : progress === 8 ? 2 : 3];
  }
  function normalizeSnapshot(value) {
    if (!value || !Object.hasOwn(names,value.character) || !Number.isSafeInteger(value.epoch) ||
        !Number.isSafeInteger(value.correctTotal) || value.correctTotal < 90 || value.correctTotal > 99 ||
        value.progress !== value.correctTotal - 90 || value.hp !== 100 - value.progress * 10 ||
        value.started !== true || value.inBoss !== true || value.over !== false ||
        value.completed !== false || value.continued !== false || value.desktopEligible !== true) return null;
    return {contextKey:String(value.epoch)+':'+value.character, character:value.character,
      selectedName:names[value.character], allies:Object.keys(names).filter(id=>id!==value.character).map(id=>names[id]),
      progress:value.progress, hp:value.hp, phase:phaseForProgress(value.progress)};
  }
  function eventSnapshot(value) {
    if(!value||!Object.hasOwn(names,value.character)||!Number.isSafeInteger(value.epoch)||
       !Number.isSafeInteger(value.correctTotal)||value.correctTotal<90||value.correctTotal>100||
       value.progress!==value.correctTotal-90||value.hp!==100-value.progress*10||
       !Number.isFinite(value.lives)||value.lives<0||value.started!==true||value.continued===true||
       value.desktopEligible!==true)return null;
    return {key:String(value.epoch)+':'+value.character,epoch:value.epoch,character:value.character,
      progress:value.progress,hp:value.hp,lives:value.lives,answer:value.answer,
      questionId:value.questionId==null?null:String(value.questionId),answered:value.answered===true,
      completed:value.completed===true,over:value.over===true,inBoss:value.inBoss===true};
  }
  function createHpMotion(options) {
    options=options||{};
    const now=typeof options.now==='function'?options.now:()=>performance.now();
    const defer=typeof options.defer==='function'?options.defer:queueMicrotask;
    const render=typeof options.render==='function'?options.render:()=>{};
    let snapshot=null,pending=null,grace=null,animation=null,awakeUntil=0,fill=null,trail=null;
    let reduced=!!options.reduced,visible=options.visible!==false,disposed=false,lastEvent=null;
    let prepared=new WeakMap(),seen=new WeakSet(),generation=0,acceptedCount=0;
    function inspection(){
      return {contextKey:snapshot?.key??null,nativeHP:snapshot?.hp??null,nativeProgress:snapshot?.progress??null,
        displayFillHP:fill,displayTrailHP:trail,animating:!!animation,awake:awakeUntil>now(),
        generation,acceptedCount,reducedMotion:reduced,visible,disposed,lastEvent:lastEvent?{...lastEvent}:null};
    }
    function publish(){render(inspection());}
    function settle(clearPending){
      generation++;animation=null;awakeUntil=0;grace=null;
      fill=trail=snapshot?snapshot.hp:null;
      if(clearPending)pending=null;
    }
    function validNative(next){
      return !!next&&((next.inBoss&&!next.completed&&!next.over)||
        (snapshot?.key===next.key&&((next.completed&&next.progress===10)||(next.over&&next.lives<=0))));
    }
    function sync(value){
      if(disposed)return false;
      const next=eventSnapshot(value);
      if(!validNative(next)){snapshot=null;pending=null;prepared=new WeakMap();seen=new WeakSet();settle(true);publish();return false;}
      const changed=!snapshot||snapshot.key!==next.key;
      if(changed){snapshot=next;pending=null;prepared=new WeakMap();seen=new WeakSet();settle(true);publish();return true;}
      const previous=snapshot;snapshot=next;
      if(previous.questionId!==next.questionId){pending=null;prepared=new WeakMap();settle(true);publish();return true;}
      const pendingMatches=pending&&pending.key===next.key&&pending.questionId===next.questionId&&pending.after===next.progress&&pending.hpAfter===next.hp&&next.answer===pending.answer;
      const sameTarget=previous.hp===next.hp&&previous.progress===next.progress;
      if(next.completed||next.over||!visible||reduced)settle(!pendingMatches);
      else if(!sameTarget&&!pendingMatches){
        if(next.hp<previous.hp){
          const expected={key:next.key,before:previous.progress,hpBefore:previous.hp,after:next.progress,hpAfter:next.hp};
          grace=expected;
          defer(()=>{if(disposed||grace!==expected)return;grace=null;settle(true);publish();});
        }else settle(true);
      }
      publish();return true;
    }
    function preparedEvent(event,next){
      if(!event||typeof event!=='object'||!event.answerIdentity||typeof event.answerIdentity!=='object'||
         !validNative(next)||snapshot?.key!==next.key||event.answerIdentity!==next.answer||!next.answered||
         seen.has(event.answerIdentity)||event.accepted!==true||event.wasBoss!==true||
         event.contextEpoch!==next.epoch||!Number.isSafeInteger(event.progressBefore)||event.progressBefore<0||event.progressBefore>9||
         event.hpBefore!==100-event.progressBefore*10||event.progressAfter!==next.progress||event.hpAfter!==next.hp||
         !Number.isFinite(event.livesBefore)||event.livesBefore<0||typeof event.correct!=='boolean'||typeof event.blocked!=='boolean'||
         (event.correct&&event.blocked)||event.progressAfter!==event.progressBefore+(event.correct?1:0))return false;
      if(next.questionId!=null&&event.answerIdentity.questionId!=null&&String(event.answerIdentity.questionId)!==next.questionId)return false;
      return true;
    }
    function prepareOutcome(event,value){
      if(disposed)return false;
      const next=eventSnapshot(value);
      if(!preparedEvent(event,next)||prepared.has(event.answerIdentity))return false;
      const binding={key:next.key,epoch:next.epoch,character:next.character,questionId:next.questionId,answer:event.answerIdentity,
        before:event.progressBefore,after:event.progressAfter,hpBefore:event.hpBefore,hpAfter:event.hpAfter,
        livesBefore:event.livesBefore,correct:event.correct,blocked:event.blocked,
        canAnimate:(snapshot.progress===event.progressBefore&&snapshot.hp===event.hpBefore)||
          !!(grace&&grace.key===next.key&&grace.before===event.progressBefore&&grace.hpBefore===event.hpBefore&&grace.after===next.progress&&grace.hpAfter===next.hp)};
      prepared.set(event.answerIdentity,binding);pending=binding;grace=null;return true;
    }
    function outcome(event,value){
      if(disposed)return false;
      const next=eventSnapshot(value),binding=event?.answerIdentity&&typeof event.answerIdentity==='object'?prepared.get(event.answerIdentity):null;
      if(!binding||!preparedEvent(event,next)||binding.key!==next.key||binding.epoch!==next.epoch||binding.character!==next.character||binding.questionId!==next.questionId||
         binding.before!==event.progressBefore||binding.after!==event.progressAfter||binding.hpBefore!==event.hpBefore||
         binding.hpAfter!==event.hpAfter||binding.livesBefore!==event.livesBefore||binding.correct!==event.correct||binding.blocked!==event.blocked||
         event.livesAfter!==next.lives||typeof event.gameCompleted!=='boolean'||typeof event.gameOver!=='boolean'||
         event.gameCompleted!==next.completed||event.gameOver!==next.over||(next.completed&&next.progress!==10)||(next.over&&next.lives>0))return false;
      seen.add(event.answerIdentity);prepared.delete(event.answerIdentity);if(pending===binding)pending=null;
      snapshot=next;acceptedCount++;
      lastEvent={correct:event.correct,blocked:event.blocked,progressBefore:binding.before,progressAfter:binding.after,
        hpBefore:binding.hpBefore,hpAfter:binding.hpAfter,contextKey:next.key,animated:false};
      if(event.correct&&binding.canAnimate&&visible&&!reduced&&!next.completed&&!next.over){
        const time=now();
        animation={started:time,fromFill:fill==null?binding.hpBefore:fill,fromTrail:Math.max(trail??binding.hpBefore,binding.hpBefore),to:next.hp};
        awakeUntil=time+3200;generation++;lastEvent.animated=true;publish();
      }else{settle(false);publish();}
      return true;
    }
    function advance(time){
      if(disposed)return false;
      time=Number.isFinite(time)?time:now();
      if(animation){
        const elapsed=Math.max(0,time-animation.started),ease=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
        fill=animation.fromFill+(animation.to-animation.fromFill)*ease(elapsed/320);
        trail=animation.fromTrail+(animation.to-animation.fromTrail)*ease((elapsed-150)/520);
        if(elapsed>=670){fill=trail=animation.to;animation=null;}
      }
      if(awakeUntil&&time>=awakeUntil)awakeUntil=0;
      publish();return !!animation||awakeUntil>time;
    }
    function wake(contextKey){
      if(disposed||!snapshot||snapshot.key!==contextKey||!visible||reduced||snapshot.completed||snapshot.over)return false;
      awakeUntil=now()+3200;publish();return true;
    }
    function setVisible(value){if(disposed)return false;visible=!!value;if(!visible)settle(false);publish();return visible;}
    function setReducedMotion(value){if(disposed)return false;reduced=!!value;if(reduced)settle(false);publish();return reduced;}
    function dispose(){if(disposed)return;disposed=true;settle(true);snapshot=null;prepared=new WeakMap();seen=new WeakSet();publish();}
    return Object.freeze({sync,prepareOutcome,outcome,advance,wake,setVisible,setReducedMotion,dispose,inspection});
  }
  function artManifest(value){
    if(!value||value.approved!==true||!value.states)return null;
    const rows={};const hashes=new Set();
    for(const phase of phases){
      const row=value.states[phase.id];
      if(!row||typeof row.src!=='string'||!/^\/assets\/boss-cinema\/v1\/[a-zA-Z0-9._-]+\.(?:webp|png|jpg|jpeg)$/.test(row.src)||
         !/^[a-fA-F0-9]{64}$/.test(row.sha256||'')||typeof row.description!=='string')return null;
      const hash=row.sha256.toLowerCase();if(hashes.has(hash))return null;hashes.add(hash);
      rows[phase.id]={src:row.src,sha256:hash,libraryFileId:row.libraryFileId??null,description:row.description,
        layout:row.layout==='panoramic'?'panoramic':'portrait',width:row.width,height:row.height,
        objectPosition:typeof row.objectPosition==='string'&&/^[0-9.]+% [0-9.]+%$/.test(row.objectPosition)?row.objectPosition:null};
    }
    return rows;
  }
  if (typeof module === 'object' && module.exports) module.exports = Object.freeze({phaseForProgress,normalizeSnapshot,eventSnapshot,createHpMotion,artManifest});
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const fine = matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)');
  const coarse = matchMedia('(any-pointer:coarse)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const $ = id=>document.getElementById(id);
  let host=null, root=null, current=null, disposed=false, queued=false, addedArenaClass=false, hpFrame=0, terminal=null;
  let imageGeneration=0,imageTimer=0,imageRequestKey='',imageTargetKey='',activeArt=null,inactiveArt=null;
  const imageCache=new Map(),imageVerified=new Set();
  const imageState={phase:null,currentSrc:'/assets/arqui-nefromante-chegada.webp',uniqueVerifiedAssets:0,ready:false,imagesPending:true,error:null,transitioning:false};
  function hpVisible(){
    if(document.hidden||!eligible()||!root||root.hidden||!root.getClientRects().length)return false;
    const box=root.getBoundingClientRect(),style=getComputedStyle(root);
    if(style.visibility==='hidden'||style.display==='none'||box.bottom<=0||box.top>=innerHeight||box.right<=0||box.left>=innerWidth)return false;
    return ![...document.querySelectorAll('dialog[open],[aria-modal="true"],.nq-overlay')].some(node=>{
      if(node.hidden||!node.getClientRects().length)return false;
      const s=getComputedStyle(node);return s.display!=='none'&&s.visibility!=='hidden';
    });
  }
  function renderHp(view){
    const fill=$('nqStaticHpFill'),trail=$('nqStaticHpTrail');
    if(fill&&view.displayFillHP!=null)fill.style.width=view.displayFillHP+'%';
    if(trail&&view.displayTrailHP!=null)trail.style.width=view.displayTrailHP+'%';
    if(root){root.dataset.hpMotion=view.animating?'active':'rest';root.dataset.hpAwake=view.awake?'true':'false';}
  }
  const hp=createHpMotion({reduced:reduced.matches,visible:true,render:renderHp});
  function runHp(){
    if(hpFrame||disposed)return;
    const tick=()=>{
      hpFrame=0;if(disposed)return;
      if(hp.advance(performance.now()))hpFrame=requestAnimationFrame(tick);
    };
    hpFrame=requestAnimationFrame(tick);
  }
  function cancelHp(){if(hpFrame)cancelAnimationFrame(hpFrame);hpFrame=0;}
  const put=(id,value)=>{const node=$(id);if(node&&node.textContent!==String(value))node.textContent=String(value);};
  function eligible(){return fine.matches&&!coarse.matches&&!(navigator.maxTouchPoints>0);}
  function mainVisible(){const main=$('mainApp');return !!main&&!main.hidden&&!main.classList.contains('hidden')&&main.getClientRects().length>0;}
  function readNativeRaw(){
    try {
      if(typeof state==='undefined'||typeof isBossBattle!=='function'||typeof getBossProgress!=='function'||typeof getBossHP!=='function')return null;
      return {epoch:typeof _progressEpoch==='undefined'?0:_progressEpoch,
        character:state.character,correctTotal:state.correctTotal,progress:getBossProgress(),hp:getBossHP(),
        started:!!state.gameStarted,inBoss:!!isBossBattle(),over:!!state.gameOver,completed:!!state.gameCompleted,
        continued:!!state.completedGame,desktopEligible:eligible()&&mainVisible(),
        lives:state.lives,answer:state.questionAnswer,answered:!!state.answered,questionId:state.current?.id};
    }catch(_){return null;}
  }
  function readNative(){return normalizeSnapshot(readNativeRaw());}
  function terminalValid(raw){
    return !!terminal&&!!raw&&raw.epoch===terminal.epoch&&raw.character===terminal.character&&
      raw.questionId===terminal.questionId&&raw.answer===terminal.answer&&raw.answered===true&&
      raw.correctTotal===100&&raw.progress===10&&raw.hp===0&&raw.started===true&&
      raw.over===false&&raw.continued===false&&raw.lives>0&&raw.desktopEligible===true;
  }
  function renderTerminal(raw){
    if(!root||!terminalValid(raw))return false;
    // Native updateBossUI removes these after completion. Retain only the
    // already approved battle styling during this bounded cosmetic hold.
    for(const name of terminal.bodyClasses)if(!document.body.classList.contains(name))document.body.classList.add(name);
    cancelHp();hp.setVisible(false);if(raw.completed)hp.sync(raw);
    root.dataset.terminal='true';root.dataset.hpMotion='rest';root.dataset.hpAwake='false';
    put('nqStaticStage','Etapa 10/10');put('nqStaticHpText','HP 0%');
    const track=$('nqStaticHpTrack');track?.setAttribute('aria-valuenow','0');
    track?.setAttribute('aria-valuetext','HP 0%, 10 de 10 golpes concluídos');
    if($('nqStaticHpFill'))$('nqStaticHpFill').style.width='0%';
    if($('nqStaticHpTrail'))$('nqStaticHpTrail').style.width='0%';
    if($('nqStaticIntro'))$('nqStaticIntro').disabled=true;
    return true;
  }
  function holdNativeCompletion(event){
    const raw=readNativeRaw();
    if(disposed||terminal||!root||!current||current.progress!==9||current.hp!==10||
       !event||event.accepted!==true||event.wasBoss!==true||event.correct!==true||event.blocked!==false||
       event.progressBefore!==9||event.progressAfter!==10||event.hpBefore!==10||event.hpAfter!==0||
       event.contextEpoch!==raw?.epoch||event.answerIdentity!==raw?.answer||!raw.answer||
       current.contextKey!==String(raw.epoch)+':'+raw.character||event.livesBefore<=0)return false;
    terminal={epoch:raw.epoch,character:raw.character,answer:raw.answer,questionId:raw.questionId,
      bodyClasses:['boss-battle-mode','arqui-nefromante-final'].filter(name=>document.body.classList.contains(name))};
    if(!terminalValid(raw)){terminal=null;return false;}
    return renderTerminal(raw);
  }
  function clearTerminal(){
    const held=terminal;terminal=null;
    // A newly started boss owns its own classes. Never remove those on a
    // stale callback; otherwise return to the current native non-boss style.
    if(held&&readNativeRaw()?.inBoss!==true)for(const name of held.bodyClasses)document.body.classList.remove(name);
  }
  function releaseNativeCompletion(){clearTerminal();sync();}
  function cancelImageTransition(){
    imageGeneration++;clearTimeout(imageTimer);imageTimer=0;imageState.transitioning=false;
    if(activeArt)activeArt.style.opacity='1';
    if(inactiveArt)inactiveArt.style.opacity='0';
    if(root&&activeArt)root.dataset.artLayout=activeArt.dataset.artLayout||'portrait';
  }
  async function verifiedImage(row){
    const cached=imageCache.get(row.sha256);if(cached)return cached;
    const job=(async()=>{
      if(!crypto.subtle)throw new Error('Image integrity verification unavailable');
      const response=await fetch(row.src,{credentials:'same-origin',cache:'force-cache'});
      if(!response.ok)throw new Error('Boss artwork unavailable');
      const bytes=await response.arrayBuffer();
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
      if(hash!==row.sha256)throw new Error('Boss artwork integrity mismatch');
      const blob=new Blob([bytes],{type:response.headers.get('Content-Type')||'image/webp'});
      const url=URL.createObjectURL(blob),test=new Image();
      try{test.src=url;await test.decode();if(!test.naturalWidth||!test.naturalHeight)throw new Error('Boss artwork decode failed');}
      catch(error){URL.revokeObjectURL(url);throw error;}
      test.src='';
      if(disposed){URL.revokeObjectURL(url);throw new Error('Boss artwork request disposed');}
      imageVerified.add(row.sha256);imageState.uniqueVerifiedAssets=imageVerified.size;
      return {url,source:row.src,sha256:row.sha256};
    })();
    imageCache.set(row.sha256,job);
    try{return await job;}catch(error){imageCache.delete(row.sha256);throw error;}
  }
  function syncArt(snapshot){
    const manifest=artManifest(window.NQBossArtStates);
    imageState.imagesPending=!manifest;
    if(!manifest){imageState.ready=false;imageState.error=null;return;}
    if(!root||!activeArt||document.hidden)return;
    const row=manifest[snapshot.phase.id],key=snapshot.contextKey+':'+snapshot.phase.id+':'+row.sha256;
    if(imageRequestKey===key)return;
    cancelImageTransition();imageRequestKey=key;imageTargetKey=key;imageState.ready=false;imageState.error=null;
    const generation=imageGeneration,context=snapshot.contextKey,phase=snapshot.phase.id;
    const valid=()=>!disposed&&root&&current?.contextKey===context&&current?.phase.id===phase&&imageGeneration===generation&&imageTargetKey===key&&!document.hidden;
    verifiedImage(row).then(async loaded=>{
      if(!valid())return;
      const incoming=inactiveArt,outgoing=activeArt;
      incoming.src=loaded.url;incoming.alt='';incoming.setAttribute('aria-hidden','true');
      incoming.dataset.artLayout=row.layout;
      incoming.style.objectPosition=row.objectPosition||(row.layout==='panoramic'?'50% 0%':'60% top');
      await incoming.decode();if(!valid())return;
      root.dataset.artLayout=row.layout;
      const commit=()=>{
        if(!valid())return;
        outgoing.style.opacity='0';outgoing.alt='';outgoing.setAttribute('aria-hidden','true');
        incoming.style.opacity='1';incoming.alt=row.description;incoming.removeAttribute('aria-hidden');
        activeArt=incoming;inactiveArt=outgoing;imageTimer=0;imageState.transitioning=false;
        imageState.phase=phase;imageState.currentSrc=row.src;imageState.ready=true;
      };
      if(reduced.matches||!hpVisible()){commit();return;}
      imageState.transitioning=true;
      incoming.style.transition='none';incoming.style.opacity='0';
      void incoming.getBoundingClientRect();
      incoming.style.transition='opacity 260ms ease';outgoing.style.transition='opacity 260ms ease';
      requestAnimationFrame(()=>{
        if(!valid())return;
        incoming.style.opacity='1';outgoing.style.opacity='0';
        imageTimer=setTimeout(commit,270);
      });
    }).catch(error=>{
      if(!valid())return;
      imageRequestKey='';imageState.error=String(error?.message||error);imageState.transitioning=false;
      if(activeArt)activeArt.style.opacity='1';if(inactiveArt)inactiveArt.style.opacity='0';
    });
  }
  function measureReferenceHeight(){
    if(!host)return;
    const old=$('nqBossArena'),scene=old?.querySelector('.nq-arena-scene');
    let height=innerHeight<=800?312.796875:352.796875;
    if(old&&scene){
      const hidden=old.hidden,visibility=old.style.visibility,sceneHeight=scene.style.height,rootHidden=root?.hidden;
      const hadContext=host.classList.contains('nq-static-context');
      if(root)root.hidden=true;
      host.classList.remove('nq-static-context');old.hidden=false;old.style.visibility='hidden';
      scene.style.height=(innerHeight<=800?168:208)+'px';
      const measured=host.getBoundingClientRect().height;
      old.hidden=hidden;old.style.visibility=visibility;scene.style.height=sceneHeight;
      if(root)root.hidden=rootHidden;
      if(hadContext)host.classList.add('nq-static-context');
      if(measured>240&&measured<800)height=measured;
    }
    host.style.setProperty('--nq-static-outer-height',height+'px');
    if(root)root.dataset.referenceOuterHeight=String(height);
  }
  function requestIntro(){
    const snapshot=readNative();
    if(!current||!snapshot||snapshot.contextKey!==current.contextKey)return false;
    window.dispatchEvent(new CustomEvent('nq-boss-cinema-request',{detail:{contextKey:snapshot.contextKey,
      character:snapshot.character,selectedName:snapshot.selectedName,allies:[...snapshot.allies],manual:true}}));
    return true;
  }
  function mount(){
    if(root)return true;
    host=$('nqBossEncounter');const main=$('mainApp');if(!host||!main)return false;
    if(!main.classList.contains('nq-arena-active')){main.classList.add('nq-arena-active');addedArenaClass=true;}
    root=document.createElement('section');root.id='nqBossStatic';root.setAttribute('aria-label','Confronto com o Arqui-Nefromante');
    root.innerHTML='<header class="nq-static-hud"><div class="nq-static-identity"><span class="nq-static-eyebrow">CONFRONTO FINAL</span><h1>Arqui-Nefromante</h1></div><div class="nq-static-progress"><span id="nqStaticStage"></span><span id="nqStaticHpText"></span><div id="nqStaticHpTrack" role="progressbar" aria-label="Vida do Arqui-Nefromante" aria-valuemin="0" aria-valuemax="100"><span id="nqStaticHpTrail" aria-hidden="true"></span><span id="nqStaticHpFill" aria-hidden="true"></span></div></div></header><div class="nq-static-scene"><img class="nq-static-art" src="/assets/arqui-nefromante-chegada.webp" alt="Arqui-Nefromante de barba grisalha diante do Trono da Uremia, empunhando seu cajado" width="1536" height="1024"><img class="nq-static-art nq-static-art--next" alt="" aria-hidden="true" width="1536" height="1024"><div class="nq-static-atmosphere" aria-hidden="true"></div><div class="nq-static-copy"><p class="nq-static-chapter" id="nqStaticChapter"></p><h2 id="nqStaticTitle"></h2><p class="nq-static-narration" id="nqStaticNarration"></p><button type="button" id="nqStaticIntro"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg><span>Ver introdução</span></button></div></div>';
    const copy=root.querySelector('.nq-static-copy');
    copy.setAttribute('role','region');copy.setAttribute('aria-label','Narrativa do confronto');copy.tabIndex=0;
    host.append(root);measureReferenceHeight();host.classList.add('nq-static-context');
    activeArt=root.querySelector('.nq-static-art');inactiveArt=root.querySelector('.nq-static-art--next');inactiveArt.style.opacity='0';
    $('nqStaticIntro').addEventListener('click',requestIntro);
    root.querySelector('.nq-static-art').addEventListener('error',()=>{if(root)root.dataset.artUnavailable='true';});
    return true;
  }
  let noticeRail=null;
  function restoreNoticeRail(){
    if(!noticeRail)return;
    for(const node of [...noticeRail.children])document.body.append(node);
    noticeRail.remove();noticeRail=null;
  }
  function placeNativeNotices(){
    if(!eligible()||!root||!host?.isConnected||!mainVisible()){restoreNoticeRail();return;}
    const notices=[document.querySelector('.nq-toast'),document.getElementById('nqAchievementCelebrations')].filter(Boolean);
    if(notices.length&&!noticeRail){noticeRail=document.createElement('div');noticeRail.id='nqDesktopNoticeRail';noticeRail.setAttribute('aria-label','Avisos da jornada');host.before(noticeRail);}
    if(!noticeRail)return;
    for(const node of notices)if(node.parentNode!==noticeRail)noticeRail.append(node);
    const empty=noticeRail.childElementCount===0;if(noticeRail.hidden!==empty)noticeRail.hidden=empty;
  }
  function restore(){
    restoreNoticeRail();
    clearTerminal();
    cancelHp();cancelImageTransition();imageRequestKey='';imageTargetKey='';activeArt=null;inactiveArt=null;
    imageState.phase=null;imageState.currentSrc='/assets/arqui-nefromante-chegada.webp';imageState.ready=false;
    if(root)root.remove();root=null;
    host?.classList.remove('nq-static-context');host?.style.removeProperty('--nq-static-outer-height');
    if(addedArenaClass)$('mainApp')?.classList.remove('nq-arena-active');
    addedArenaClass=false;host=null;current=null;
  }
  function sync(){
    if(disposed)return false;
    const raw=readNativeRaw(),snapshot=normalizeSnapshot(raw),previousKey=current?.contextKey;
    if(terminal){if(renderTerminal(raw))return true;clearTerminal();}
    hp.setVisible(hpVisible());hp.sync(raw);
    if(!snapshot){if(root)restore();current=null;return false;}
    current=snapshot;if(!mount())return false;placeNativeNotices();
    hp.setVisible(hpVisible());renderHp(hp.inspection());
    root.dataset.context=snapshot.contextKey;root.dataset.phase=snapshot.phase.id;
    put('nqStaticStage','Etapa '+(snapshot.progress+1)+'/10');put('nqStaticHpText','HP '+snapshot.hp+'%');
    const track=$('nqStaticHpTrack');
    track.setAttribute('aria-valuenow',String(snapshot.hp));
    track.setAttribute('aria-valuetext','HP '+snapshot.hp+'%, '+snapshot.progress+' de 10 golpes concluídos');
    put('nqStaticChapter',snapshot.phase.chapter);put('nqStaticTitle',snapshot.phase.title);put('nqStaticNarration',snapshot.phase.text);
    syncArt(snapshot);
    if(previousKey!==snapshot.contextKey){hp.wake(snapshot.contextKey);runHp();}
    return true;
  }
  function schedule(){if(queued||disposed)return;queued=true;queueMicrotask(()=>{queued=false;sync();});}
  function start(){
    const api={sync,holdNativeCompletion,releaseNativeCompletion,prepareOutcome:event=>hp.prepareOutcome(event,readNativeRaw()),
      outcome:event=>{const accepted=hp.outcome(event,readNativeRaw());sync();runHp();return accepted;},
      presentNativeCompletion:()=>false,presentNativeFeedback:()=>!!terminal||(eligible()&&!!current&&!!root),
      requestIntro,dispose:()=>{disposed=true;restore();hp.dispose();mainObserver?.disconnect();bodyObserver?.disconnect();
        for(const promise of imageCache.values())promise.then(row=>URL.revokeObjectURL(row.url)).catch(()=>{});
        document.removeEventListener('visibilitychange',refreshVisibility);document.removeEventListener('nq-battle-intro-closed',introClosed);
        window.removeEventListener('scroll',refreshVisibility,true);window.removeEventListener('resize',onResize);
        fine.removeEventListener('change',schedule);coarse.removeEventListener('change',schedule);reduced.removeEventListener('change',onReducedChange);}};
    Object.defineProperty(api,'active',{get:()=>!!current&&!!root});
    Object.defineProperty(api,'inspection',{get:()=>({active:!!current&&!!root,contextKey:current?.contextKey??null,
      character:current?.character??null,selectedName:current?.selectedName??null,allies:current?[...current.allies]:[],
      nativeProgress:terminal?10:current?.progress??null,nativeHP:terminal?0:current?.hp??null,phase:current?.phase.id??null,terminalPrepared:!!terminal,
      illustration:imageState.currentSrc,uniqueIllustrations:imageState.uniqueVerifiedAssets||1,atmosphereStates:4,
      hp:hp.inspection(),image:{...imageState},
      videoInBanner:false,perHitCinemaImplemented:false,nativeCompletionDelegated:false,
      outerHeight:root?Number(root.dataset.referenceOuterHeight):null})});
    window.NQBossArena=api;window.NQBossCinema=api;
    const main=$('mainApp');let mainObserver=null,bodyObserver=null;
    if(main){mainObserver=new MutationObserver(schedule);mainObserver.observe(main,{attributes:true,attributeFilter:['class','hidden','inert','style']});}
    bodyObserver=new MutationObserver(refreshVisibility);bodyObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','aria-modal','class']});
    window.addEventListener('resize',onResize);
    fine.addEventListener('change',schedule);coarse.addEventListener('change',schedule);
    document.addEventListener('visibilitychange',refreshVisibility);window.addEventListener('scroll',refreshVisibility,{passive:true,capture:true});
    document.addEventListener('nq-battle-intro-closed',introClosed);
    reduced.addEventListener('change',onReducedChange);
    sync();
  }
  function refreshVisibility(){
    if(disposed)return;placeNativeNotices();
    const visible=hpVisible();hp.setVisible(visible);
    if(!visible){cancelHp();cancelImageTransition();imageRequestKey='';}
    else if(current)syncArt(current);
  }
  function onResize(){if(disposed)return;if(root)measureReferenceHeight();schedule();}
  function onReducedChange(){
    if(disposed)return;
    hp.setReducedMotion(reduced.matches);cancelImageTransition();imageRequestKey='';
    if(current)syncArt(current);if(reduced.matches)cancelHp();
  }
  function introClosed(event){hp.setVisible(hpVisible());if(hp.wake(event.detail?.contextKey))runHp();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}());
