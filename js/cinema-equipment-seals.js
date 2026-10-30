/* Reflect native poison state; no timers, benefits or gameplay authority. */
(()=>{'use strict';const fine=matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)'),coarse=matchMedia('(any-pointer:coarse)');let queued=false;
 function sync(){queued=false;let poisoned=false;try{poisoned=typeof state!=='undefined'&&state.bossStunActive===true;}catch(_){}
  const enabled=fine.matches&&poisoned&&document.body.classList.contains('boss-stun-active');
  document.querySelectorAll('#equipList .slot-diablo').forEach((slot,i)=>{const existing=slot.querySelector('.nq-uremic-seal');if(enabled&&!existing){const seal=document.createElement('span');seal.className='nq-uremic-seal';seal.id='nqUremicSeal'+i;seal.innerHTML='<svg viewBox="0 0 12 14" aria-hidden="true"><rect x="1" y="6" width="10" height="7" rx="1" fill="none" stroke="currentColor"/><path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor"/></svg><span aria-hidden="true">SELADO</span><span class="sr-only">Equipamento bloqueado pelo veneno urêmico</span>';slot.append(seal);const ids=(slot.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);if(!ids.includes(seal.id))ids.push(seal.id);slot.setAttribute('aria-describedby',ids.join(' '));}
   else if(!enabled&&existing){const ids=(slot.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==existing.id);if(ids.length)slot.setAttribute('aria-describedby',ids.join(' '));else slot.removeAttribute('aria-describedby');existing.remove();}});
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(sync);}}
 function start(){const list=document.getElementById('equipList');if(!list)return;new MutationObserver(schedule).observe(list,{childList:true,subtree:true});new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});fine.addEventListener('change',schedule);coarse.addEventListener('change',schedule);sync();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
