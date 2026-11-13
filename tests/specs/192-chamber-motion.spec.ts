import {test,expect,type Page} from '@playwright/test';

test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'no-preference'}});
async function open(page:Page){
 await page.evaluate(()=>{document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).showAcidBaseMinigame();});
 const cinema=page.locator('#nqEntryCinema[open]');if(await cinema.count()){await page.keyboard.press('Escape');await expect(cinema).toHaveCount(0);}
}
test.beforeEach(async({page})=>{await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/',{waitUntil:'load'});await page.locator('[data-portal-route="guest"]').click();});
async function preferences(page:Page){await page.getByRole('button',{name:'Preferências',exact:true}).click();return page.locator('#mobileProfilePopup.open').getByRole('button',{name:'Animações da Câmara',exact:true});}

test('balance can be paused by keyboard and remembers preference without changing progress',async({page})=>{
 await open(page);const before=await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'));
 const art=page.locator('[data-ab-lab]'),pause=await preferences(page);
 await expect(art).toHaveAttribute('data-motion','running');
 await expect.poll(()=>art.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
 await pause.focus();await page.keyboard.press('Space');
 await expect(pause).toBeFocused();await expect(pause).toHaveAttribute('aria-pressed','false');
 await expect(art).toHaveAttribute('data-motion','paused');
 expect(await art.evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='paused'))).toBe(true);
 await page.keyboard.press('Escape');await page.locator('[data-ab-close]').click();await open(page);
 await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','paused');
 await (await preferences(page)).click();
 await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','running');
 expect(await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'))).toBe(before);
});

test('reduced motion is static and follows a changed system preference',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);
 const art=page.locator('[data-ab-lab]');await expect(art).toHaveAttribute('data-motion','paused');
 await expect(await preferences(page)).toBeDisabled();
 expect(await art.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await expect(page.getByRole('button',{name:'Animações da Câmara',exact:true})).toBeEnabled();
 await expect(art).toHaveAttribute('data-motion','running');
});

test('hidden overview suspends the scene and an act keeps the patient setting',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await open(page);const art=page.locator('[data-ab-lab]');await expect(art).toHaveAttribute('data-motion','running');
 await page.getByRole('tab',{name:/^Casos clínicos \(\d+\)$/}).click();await expect(art).toHaveAttribute('data-motion','paused');
 await page.getByRole('tab',{name:'Visão geral',exact:true}).click();await expect(art).toHaveAttribute('data-motion','running');
 await page.locator('[data-ab-next]').click();await page.locator('[data-ab-start-acts]').click();
 await expect(page.locator('[data-ab-case-scene="aldric"]')).toBeVisible();await expect(page.locator('.ab-prompt')).toBeFocused();
});

test('large text and narrow screens keep readable content without horizontal overflow',async({page})=>{
 for(const [width,font]of[[1440,16],[1159,16],[1100,32],[390,16],[320,32]]){
  await page.setViewportSize({width,height:900});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);await open(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const about=page.locator('.ab-hub-about'),lead=about.locator('.ab-lead'),summary=about.locator('summary');
  await expect(about).not.toHaveAttribute('open');await expect(lead).toBeHidden();
  const original=await lead.textContent();expect(original?.trim().length).toBeGreaterThan(0);
  await expect(summary).toHaveText('O que você vai praticar');
  await summary.scrollIntoViewIfNeeded();await summary.focus();await expect(summary).toBeFocused();
  expect(await summary.evaluate(element=>{const box=element.getBoundingClientRect();return box.width>=44&&box.height>=44&&element.contains(document.elementFromPoint(box.left+box.width/2,box.top+box.height/2));})).toBe(true);
  await summary.press('Enter');await expect(about).toHaveAttribute('open','');
  await expect(lead).toBeVisible();expect(await lead.textContent()).toBe(original);
  expect(await lead.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);return [...range.getClientRects()].every(box=>!box.width||box.left>=-1&&box.right<=innerWidth+1);})).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const desktop=await page.evaluate(()=>matchMedia('(min-width:961px) and (pointer:fine)').matches);
  await expect(page.locator('[data-ab-lab]')).toBeVisible();
  await expect(page.getByRole('button',{name:'Preferências',exact:true})).toBeVisible();
  if(desktop)await expect(page.locator('[data-ab-next]')).toBeVisible();
 }
});

test('document visibility events suspend and resume the balance',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await open(page);const art=page.locator('[data-ab-lab]');await expect(art).toHaveAttribute('data-motion','running');
 // Headless Chromium keeps every tab visible. Exercise the actual visibility
 // handler with a controlled document-hidden state, without claiming OS observation.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(art).toHaveAttribute('data-motion','paused');
 await page.evaluate(()=>{delete (document as any).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await expect(art).toHaveAttribute('data-motion','running');
});
test('closing the hub aborts motion listeners and disconnects its visibility observer',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await page.evaluate(()=>{
  const tracked:{signals:AbortSignal[],disconnected:number}={signals:[],disconnected:0};(window as any).__motionLifecycle=tracked;
  const add=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type:any,callback:any,options:any){
   if(options?.signal&&(this===document&&type==='visibilitychange'||this instanceof MediaQueryList&&type==='change'||this instanceof HTMLButtonElement&&this.hasAttribute('data-ab-motion-toggle')&&type==='click'))tracked.signals.push(options.signal);
   return add.call(this,type,callback,options);
  } as typeof add;
  const Original=IntersectionObserver;
  window.IntersectionObserver=class extends Original{
   tracked=false;
   observe(target:Element){if(target.hasAttribute('data-ab-lab'))this.tracked=true;super.observe(target);}
   disconnect(){if(this.tracked)tracked.disconnected++;super.disconnect();}
  };
 });
 await open(page);await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','running');
 const count=await page.evaluate(()=>(window as any).__motionLifecycle.signals.length);expect(count).toBeGreaterThan(0);
 await page.locator('[data-ab-close]').click();
 expect(await page.evaluate(()=>(window as any).__motionLifecycle.signals.every((s:AbortSignal)=>s.aborted))).toBe(true);
 expect(await page.evaluate(()=>(window as any).__motionLifecycle.disconnected)).toBe(1);
 await open(page);await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','running');
 expect(await page.evaluate(n=>(window as any).__motionLifecycle.signals.slice(n).some((s:AbortSignal)=>!s.aborted),count)).toBe(true);
});
