/* Short literal excerpts precede the film; full authored lore remains separately readable. */
(()=>{'use strict';const FADE_IN=480,FADE_OUT=360,LEAVE=900,cards={nephros:[['Os néfrons do reino estão virando pedra.',3400],['Cada acerto seu salva um.',2800]],aquaria:[['Onde outros veem números, você vê correntes.',3600],['O Arqui-Nefromante envenenou as águas do reino.',3800]],glomerulus:[['A guerra acontece no nível celular.',3200],['O Arqui-Nefromante semeia imunocomplexos pelo reino.',4200]]},smooth=p=>{const v=Math.max(0,Math.min(1,p));return v*v*(3-2*v);};
 function open(aperture,key,title,onDone){const sequence=cards[key];if(!sequence)return null;const motion=matchMedia('(prefers-reduced-motion:reduce)'),root=document.createElement('section'),name=document.createElement('p'),copy=document.createElement('p');root.className='nq-movie-prologue';root.setAttribute('aria-label','História de '+title);name.className='nq-prologue-name';name.textContent=title;copy.className='nq-prologue-copy';copy.setAttribute('aria-live','polite');copy.setAttribute('aria-atomic','true');root.append(name,copy);aperture.append(root);
  let index=0,elapsed=0,gap=false,paused=false,done=false,forceFinish=false,last=performance.now(),raf=0;const visibility=()=>last=performance.now();document.addEventListener('visibilitychange',visibility);
  function dispose(){if(done)return;done=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);root.remove();}
  // The dark layer outlives the sequence so the film rises from under it.
  function finish(){if(done)return;done=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);if(motion.matches)root.remove();else{root.dataset.leaving='true';setTimeout(()=>root.remove(),LEAVE);}onDone();}
  function draw(){if(done)return;const now=performance.now(),delta=now-last;last=now;if(!paused&&!document.hidden)elapsed+=delta;
   if(gap){copy.style.opacity='0';if(elapsed>=150){if(forceFinish||index===sequence.length-1){finish();return;}index++;elapsed=0;gap=false;}}
   else{const[text,duration]=sequence[index];if(copy.textContent!==text)copy.textContent=text;root.dataset.card=String(index+1);copy.style.opacity=motion.matches||paused?'1':String(Math.min(smooth(elapsed/FADE_IN),smooth((duration-elapsed)/FADE_OUT)));if(elapsed>=duration){gap=true;elapsed=0;}}
   raf=requestAnimationFrame(draw);
  }draw();return{get paused(){return paused;},toggle(){paused=!paused;if(paused){gap=false;elapsed=Math.max(FADE_IN,Math.min(sequence[index][1]-FADE_OUT,elapsed));}last=performance.now();return paused;},next(){if(done)return;paused=false;last=performance.now();if(gap){elapsed=150;return;}elapsed=Math.max(elapsed,sequence[index][1]-FADE_OUT);},skip(){if(done)return;forceFinish=true;paused=false;if(!gap)elapsed=Math.max(elapsed,sequence[index][1]-FADE_OUT);last=performance.now();},dispose};
 }
 window.NQCharacterPrologue=Object.freeze({open});
})();
