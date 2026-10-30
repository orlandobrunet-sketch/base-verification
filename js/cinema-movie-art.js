/* Presentation clock follows decoded media time; never owns game state or audio. */
(function(){'use strict';
 const players=new WeakMap();
 const copy={nephros:['Dr. Nephros, primeiro plantão.','Cem acertos para salvar o reino.'],aquaria:['Dra. Aquaria, primeiro plantão.','Cem acertos para conter a maré.'],glomerulus:['Dr. Glomerulus, primeiro plantão.','Cem lâminas para vencer a guerra.'],chamber:['Câmara do Equilíbrio','O Arquivista lacrou vinte casos.'],battle:['Noventa batalhas depois.','Três guardiões, dez acertos.'],victory:['OS RINS FORAM SALVOS!']};
 const smooth=p=>{const v=Math.max(0,Math.min(1,p));return v*v*(3-2*v);},TAIL=.56;
 function attach(dialog,video,aperture,key){
  players.get(dialog)?.dispose();const reduced=matchMedia('(prefers-reduced-motion:reduce)'),caption=document.createElement('p'),veil=document.createElement('div');
  caption.className='nq-movie-caption';caption.setAttribute('aria-live','polite');caption.setAttribute('aria-atomic','true');veil.className='nq-movie-veil';veil.setAttribute('aria-hidden','true');aperture.append(veil,caption);
  dialog.dataset.movieArt='true';dialog.dataset.movieKey=key;dialog.dataset.moviePhase='loading';
  dialog.style.setProperty('--nq-movie-exit','340ms');let raf=0,closed=false,last='',opening=false;
  const cues=(copy[key]||[]).map((text,i)=>({text,start:key==='victory'?5.1:i===0?.75:4.05,end:key==='victory'?7.75:i===0?3.75:7.35}));
  function paint(){if(closed)return;const time=video.currentTime,cue=cues.find(c=>time>=c.start&&time<c.end),text=cue?.text||'';if(text!==last){caption.textContent=text;last=text;}const fadeIn=reduced.matches?.08:.42,fadeOut=reduced.matches?.08:.32,opacity=cue?String(Math.min(smooth((time-cue.start)/fadeIn),smooth((cue.end-time)/fadeOut))):'0';if(caption.style.opacity!==opacity)caption.style.opacity=opacity;
   // Fade over moving picture, so the film never freezes before it closes.
   const phase=dialog.dataset.moviePhase;if(!reduced.matches&&Number.isFinite(video.duration)&&(phase==='playing'||phase==='tail')){const next=video.duration-time<=TAIL&&(!video.paused||video.ended)?'tail':'playing';if(phase!==next)dialog.dataset.moviePhase=next;}raf=requestAnimationFrame(paint);}
  function playing(){if(opening||closed)return;opening=true;dialog.dataset.moviePhase='opening';requestAnimationFrame(()=>{if(!closed)dialog.dataset.moviePhase='playing';});}
  video.addEventListener('playing',playing);paint();
  let freeze=null,exitRaf=0;
  const api={close(options={}){if(closed)return;closed=true;cancelAnimationFrame(raf);
   if(video.readyState>=2&&video.videoWidth){try{freeze=document.createElement('canvas');freeze.className='nq-movie-freeze';freeze.width=video.videoWidth;freeze.height=video.videoHeight;freeze.setAttribute('aria-hidden','true');freeze.getContext('2d').drawImage(video,0,0);aperture.append(freeze);}catch(_){freeze?.remove();freeze=null;}}
   caption.style.opacity='0';dialog.dataset.moviePhase='closing';const start=performance.now(),duration=reduced.matches?80:340;
   const fade=()=>{const progress=Math.min(1,(performance.now()-start)/duration);options.onGain?.((1-progress)**2);if(progress<1)exitRaf=requestAnimationFrame(fade);};fade();
  },dispose(){closed=true;cancelAnimationFrame(raf);cancelAnimationFrame(exitRaf);video.removeEventListener('playing',playing);freeze?.remove();caption.remove();veil.remove();delete dialog.dataset.movieArt;delete dialog.dataset.moviePhase;players.delete(dialog);}};players.set(dialog,api);return api;
 }
 function openLore(title,paragraphs){
  if(document.querySelector('dialog[open]'))return false;document.getElementById('nqMovieLore')?.remove();
  const d=document.createElement('dialog'),heading=document.createElement('h2'),body=document.createElement('div'),close=document.createElement('button');d.id='nqMovieLore';d.className='nq-movie-lore';heading.id='nqMovieLoreTitle';heading.textContent=title;body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label','História completa');
  for(const text of paragraphs){const p=document.createElement('p');p.textContent=text;body.append(p);}close.type='button';close.textContent='Voltar à batalha';close.addEventListener('click',()=>d.close());d.setAttribute('aria-labelledby',heading.id);d.append(heading,body,close);document.body.append(d);d.showModal();body.focus({preventScroll:true});return true;
 }
 window.NQMovieArt=Object.freeze({attach,openLore,close:(dialog,options)=>players.get(dialog)?.close(options),dispose:dialog=>players.get(dialog)?.dispose()});
})();
