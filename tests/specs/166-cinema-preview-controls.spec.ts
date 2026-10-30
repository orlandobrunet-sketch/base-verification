import {test,expect} from '@playwright/test';
import{advanceToFilm}from'../helpers/cinema';
test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
test('each film keeps pause, mute and skip reachable after consecutive replays',async({page})=>{
 await page.goto('/cinema-preview.html',{waitUntil:'domcontentloaded'});
 for(const key of ['nephros','aquaria','glomerulus','chamber','battle','victory']){
  await page.locator('[data-preview="'+key+'"]').click();const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();if(['nephros','aquaria','glomerulus'].includes(key))await advanceToFilm(dialog);
  if(key==='victory')await expect.poll(()=>page.evaluate(()=>(window as any).NQVictoryCinema.inspection.stage)).toBe('playing');else await expect.poll(()=>dialog.locator('video').evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.4)).toBe(true);
  const pause=dialog.getByRole('button',{name:/^Pausar/}),sound=dialog.getByRole('button',{name:'Ativar som',exact:true}),skip=dialog.getByRole('button',{name:/^(Pular introdução|Ver resultados)$/});
  for(const control of [pause,sound,skip]){
   await expect(control).toBeVisible();expect(await control.evaluate(el=>{let opacity=1;for(let n:Element|null=el;n;n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);return opacity;})).toBeGreaterThan(.99);
   expect(await control.evaluate(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return hit===el||el.contains(hit);})).toBe(true);
  }
  await pause.click();if(key==='victory')await expect.poll(()=>page.evaluate(()=>(window as any).NQVictoryCinema.inspection.stage)).toBe('paused');else await expect(dialog.locator('video')).toHaveJSProperty('paused',true);await skip.click();await expect(dialog).toBeHidden();
 }
});

test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinema only; native touch presentation is preserved.');});
