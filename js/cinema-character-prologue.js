/* Short literal excerpts precede the film; full authored lore remains separately readable. */
(()=>{'use strict';const cards={nephros:[['O Reino dos Néfrons está sob ameaça.',4000],['Você enxerga o que outros ignoram: cada questão correta é um néfron preservado.',5500]],aquaria:[['Onde outros veem números, você vê correntes.',4000],['Cada resposta certa é uma maré controlada.',4000]],glomerulus:[['A guerra acontece no nível celular.',4000],['Seu raciocínio é sua arma, as diretrizes são sua armadura.',4800]]};
 function open(aperture,key,title,onDone){const sequence=cards[key];if(!sequence)return null;const motion=matchMedia('(prefers-reduced-motion:reduce)'),root=document.createElement('section'),name=document.createElement('p'),copy=document.createElement('p');root.className='nq-movie-prologue';root.setAttribute('aria-label','História de '+title);name.className='nq-prologue-name';name.textContent=title;copy.className='nq-prologue-copy';copy.setAttribute('aria-live','polite');copy.setAttribute('aria-atomic','true');root.append(name,copy);aperture.append(root);
  let index=0,elapsed=0,gap=false,paused=false,done=false,forceFinish=false,last=performance.now(),raf=0;const visibility=()=>last=performance.now();document.addEventListener('visibilitychange',visibility);
  function dispose(){if(done)return;done=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);root.remove();}
  function finish(){if(done)return;dispose();onDone();}
  function draw(){if(done)return;const now=performance.now(),delta=now-last;last=now;if(!paused&&!document.hidden)elapsed+=delta;
   if(gap){copy.style.opacity='0';if(elapsed>=150){if(forceFinish||index===sequence.length-1){finish();return;}index++;elapsed=0;gap=false;}}
   else{const[text,duration]=sequence[index];if(copy.textContent!==text)copy.textContent=text;root.dataset.card=String(index+1);copy.style.opacity=motion.matches||paused?'1':String(Math.max(0,Math.min(1,elapsed/300,(duration-elapsed)/300)));if(elapsed>=duration){gap=true;elapsed=0;}}
   raf=requestAnimationFrame(draw);
  }draw();return{get paused(){return paused;},toggle(){paused=!paused;if(paused){gap=false;elapsed=Math.max(300,Math.min(sequence[index][1]-300,elapsed));}last=performance.now();return paused;},next(){if(done)return;paused=false;if(gap)return;elapsed=Math.max(elapsed,sequence[index][1]-300);last=performance.now();},skip(){if(done)return;forceFinish=true;paused=false;if(!gap)elapsed=Math.max(elapsed,sequence[index][1]-300);last=performance.now();},dispose};
 }
 window.NQCharacterPrologue=Object.freeze({open});
})();
