/* One owner-supplied replacement bed per movie. Native preference/gate ownership stays in the players. */
(()=>{'use strict';const instances=new WeakMap(),tracks={battle:{source:'/assets/cinema-audio/v1/battle-dragon-due.mp3',gain:.3,offset:0},victory:{source:'/assets/cinema-audio/v1/victory-sovereign-ascent.mp3',gain:.3,offset:0}};
 function attach(video,key,onError){const config=tracks[key];if(!config)return null;instances.get(video)?.dispose();
  const audio=new Audio();audio.hidden=true;audio.dataset.nqMovieMusic=key;audio.preload='auto';audio.loop=false;audio.muted=true;audio.volume=0;video.parentElement.append(audio);
  let disposed=false,enabled=false,level=0,waiting=false,pending=false,failed=false,exiting=false,tail=false,raf=0;const events=[];
  const envelope=()=>Math.max(0,Math.min(1,video.currentTime/.5,Number.isFinite(video.duration)?(video.duration-video.currentTime)/.7:1));
  function volume(){const value=enabled&&!failed?Math.max(0,Math.min(1,level*config.gain*envelope())):0;if(Math.abs(audio.volume-value)>1e-5)audio.volume=value;audio.muted=!enabled||failed;}
  function align(){if(audio.readyState<1)return;const target=config.offset+video.currentTime;if(Math.abs(audio.currentTime-target)>.18)try{audio.currentTime=target;}catch(_){}}
  function fail(){if(disposed||failed)return;failed=true;audio.pause();audio.muted=true;audio.volume=0;onError?.();}
  function sync(nextEnabled,nextLevel){if(disposed)return;enabled=!!nextEnabled&&!failed;level=nextLevel;volume();if(exiting){if(!tail||!enabled)audio.pause();return;}if(!enabled||waiting||video.paused||video.ended||document.hidden){audio.pause();return;}align();if(audio.paused&&!pending){pending=true;Promise.resolve(audio.play()).then(()=>{if(disposed||!enabled||video.paused||waiting||document.hidden)audio.pause();}).catch(fail).finally(()=>pending=false);}}
  function listen(target,event,fn){target.addEventListener(event,fn);events.push([target,event,fn]);}
  for(const event of ['playing','seeked'])listen(video,event,()=>{if(exiting)return;waiting=false;sync(enabled,level);});
  for(const event of ['pause','ended','waiting','seeking'])listen(video,event,()=>{if(exiting)return;if(event==='waiting'||event==='seeking')waiting=true;audio.pause();});
  listen(video,'timeupdate',()=>{if(!exiting&&enabled&&!waiting&&!video.paused)align();});listen(audio,'loadedmetadata',()=>{align();sync(enabled,level);});listen(audio,'error',fail);listen(document,'visibilitychange',()=>{if(document.hidden&&!exiting)audio.pause();});
  function tick(){if(disposed)return;volume();raf=requestAnimationFrame(tick);}tick();audio.src=config.source;audio.load();
  const api={sync,beginExit(){exiting=true;tail=!audio.paused&&!audio.muted&&audio.volume>0;},get tailPlaying(){return tail&&!audio.paused;},get failed(){return failed;},get inspection(){return{source:audio.currentSrc,paused:audio.paused,muted:audio.muted,volume:audio.volume,time:audio.currentTime,failed};},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);for(const[t,e,f]of events)t.removeEventListener(e,f);audio.pause();audio.muted=true;audio.removeAttribute('src');audio.load();audio.remove();instances.delete(video);}};instances.set(video,api);return api;
 }
 window.NQMovieSound=Object.freeze({attach,dispose:video=>instances.get(video)?.dispose()});
})();
